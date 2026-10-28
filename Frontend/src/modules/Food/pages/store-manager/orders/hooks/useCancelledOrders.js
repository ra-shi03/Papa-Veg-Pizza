import { useState, useEffect } from "react";
import { storeOrdersApi, LIVE_POLL_MS, useLiveIndicator } from "../../api/storeOrdersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { STANDALONE_MOCK, failOrMock } from "@/services/api/mockPolicy";
import io from "socket.io-client";
import { initialMockCancelledOrders, initialMockRefunds } from "../mockData";

const CANCELLED_ORDERS_KEY = "pvp_cancelled_orders";
const REFUNDS_KEY = "pvp_refunds";
const INCOMING_ORDERS_KEY = "pvp_incoming_orders";

const getLocalCancelledOrders = () => {
  try {
    let list = JSON.parse(localStorage.getItem(CANCELLED_ORDERS_KEY));
    if (!list || !Array.isArray(list)) {
      list = initialMockCancelledOrders;
      localStorage.setItem(CANCELLED_ORDERS_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    return initialMockCancelledOrders;
  }
};

const setLocalCancelledOrders = (orders) => {
  localStorage.setItem(CANCELLED_ORDERS_KEY, JSON.stringify(orders));
};

const getLocalRefunds = () => {
  try {
    let list = JSON.parse(localStorage.getItem(REFUNDS_KEY));
    if (!list || !Array.isArray(list)) {
      list = initialMockRefunds;
      localStorage.setItem(REFUNDS_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    return initialMockRefunds;
  }
};

const setLocalRefunds = (refunds) => {
  localStorage.setItem(REFUNDS_KEY, JSON.stringify(refunds));
};

const getLocalIncomingOrders = () => {
  try {
    return JSON.parse(localStorage.getItem(INCOMING_ORDERS_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalIncomingOrders = (orders) => {
  localStorage.setItem(INCOMING_ORDERS_KEY, JSON.stringify(orders));
};

const REFUND_UI = { pending: "refund_pending", processed: "refund_completed", failed: "refund_failed" };

const toCancelled = (o) => {
  const cancelledEntry = [...(o.timeline || [])].reverse().find((t) => String(t.status).startsWith("cancelled"));
  const refundable = o.paymentMethod === "Online" && o.paymentStatus !== "pending";
  return {
    ...o,
    cancelledAt: cancelledEntry?.timestamp || o.createdAt,
    cancelledBy: o.orderStatus === "cancelled_by_user" ? "Customer" : "Store",
    refundStatus: REFUND_UI[o.refundStatus] || (refundable ? "refund_pending" : "not_applicable"),
    refundAmount: refundable ? o.grandTotal : 0,
  };
};

export function useCancelledOrders(filters = {}) {
  const query = useQuery({
    queryKey: ["cancelledOrders", filters],
    queryFn: async () => {
      let list = (await storeOrdersApi.list("cancelled", { search: filters.search })).map(toCancelled);
      if (filters.refundStatus && filters.refundStatus !== "All") {
        list = list.filter((o) => o.refundStatus === String(filters.refundStatus).toLowerCase());
      }
      if (filters.paymentMethod && filters.paymentMethod !== "All") {
        list = list.filter((o) => o.paymentMethod.toLowerCase() === String(filters.paymentMethod).toLowerCase());
      }
      const dir = filters.sortOrder === "ascend" ? 1 : -1;
      const field = filters.sortField || "cancelledAt";
      list.sort((a, b) => ((a[field] || a.createdAt) < (b[field] || b.createdAt) ? -dir : dir));

      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      return {
        orders: list.slice((page - 1) * limit, page * limit),
        totalCancelledOrders: list.length,
        totalRefundAmount: list.reduce((sum, o) => sum + o.refundAmount, 0),
        refundPendingCount: list.filter((o) => o.refundStatus === "refund_pending").length,
        refundCompletedCount: list.filter((o) => o.refundStatus === "refund_completed").length,
        pagination: { current: page, pageSize: limit, total: list.length },
      };
    },
    refetchInterval: LIVE_POLL_MS * 4,
    staleTime: 5000,
  });
  return { ...query, socketConnected: useLiveIndicator(query) };
}

export function useInitiateRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      try {
        // POST /store/orders/:id/refund: a refund request record (nothing is paid out from the store screen)
        const r = await storeOrdersApi.requestRefund(payload.orderId, {
          amount: Number(payload.refundAmount) || undefined,
          reason: [payload.reason, payload.notes].filter(Boolean).join(" - ") || undefined,
        });
        return { success: true, refund: { ...r, referenceNumber: `REF-${String(r?._id || "").slice(-8).toUpperCase()}` } };
      } catch (err) {
        failOrMock(err, "Could not record the refund request"); // the local copy below only runs when VITE_STANDALONE_MOCK=true
      }
      await new Promise((resolve) => setTimeout(resolve, 500));

      const { orderId, refundAmount, refundType, refundMethod, reason, notes } = payload;
      
      // Update order refund status in cancelled orders
      const cancelledList = getLocalCancelledOrders();
      const orderIdx = cancelledList.findIndex((o) => o._id === orderId);
      
      if (orderIdx === -1) {
        throw new Error("Order not found");
      }

      cancelledList[orderIdx].refundStatus = "refund_pending";
      cancelledList[orderIdx].refundAmount = parseFloat(refundAmount);
      cancelledList[orderIdx].updatedAt = new Date().toISOString();
      setLocalCancelledOrders(cancelledList);

      // Add to Refunds Collection
      const refunds = getLocalRefunds();
      const newRefund = {
        _id: `ref-${Date.now()}`,
        orderId,
        customerId: cancelledList[orderIdx].customerId,
        amount: parseFloat(refundAmount),
        refundType,
        refundMethod,
        refundReason: reason,
        status: "pending",
        referenceNumber: `REF_REFID_${Math.floor(100000000 + Math.random() * 900000000)}`,
        processedBy: "Store Manager",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      refunds.push(newRefund);
      setLocalRefunds(refunds);

      // Trigger socket event simulation
      window.dispatchEvent(new CustomEvent("refundInitiatedSim", { detail: { orderId } }));

      // Return details
      return { success: true, refund: newRefund };
    },
    onSuccess: (data) => {
      toast.success("Refund initiated successfully", {
        description: `Reference: ${data.refund.referenceNumber}`,
      });
      queryClient.invalidateQueries({ queryKey: ["cancelledOrders"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to initiate refund");
    }
  });
}

export function useReopenOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, customerMessage }) => {
      try {
        // PATCH /food/store/orders/:id/reopen: within 5 minutes of the store's own cancellation, back to Incoming
        const order = await storeOrdersApi.reopen(orderId, { customerMessage });
        return { success: true, order };
      } catch (err) {
        failOrMock(err, "Could not reopen the order"); // the local copy below only runs when VITE_STANDALONE_MOCK=true
      }
      await new Promise((resolve) => setTimeout(resolve, 500));

      const cancelledList = getLocalCancelledOrders();
      const orderIdx = cancelledList.findIndex((o) => o._id === orderId);

      if (orderIdx === -1) {
        throw new Error("Order not found in cancelled list");
      }

      const orderObj = cancelledList[orderIdx];

      // Reopening eligibility validations
      const cancelledAtDate = new Date(orderObj.cancelledAt || orderObj.updatedAt);
      const timeDiffMins = (new Date() - cancelledAtDate) / 60000;

      const cancelledWithin5Minutes = timeDiffMins <= 5;
      const kitchenStarted = false; // Simulated check
      const inventoryAvailable = true; // Simulated check

      if (!cancelledWithin5Minutes) {
        throw new Error("Cannot reopen order: Reopening window of 5 minutes has expired.");
      }

      // Update status and move back to Incoming Orders
      const updatedOrder = {
        ...orderObj,
        status: "awaiting_confirmation",
        timeline: [
          ...orderObj.timeline,
          {
            status: "awaiting_confirmation",
            timestamp: new Date().toISOString(),
            note: `Order reopened by Store Manager. Message: ${customerMessage || "Default notification message"}`
          }
        ]
      };

      // Remove from Cancelled List
      const newCancelledList = cancelledList.filter((o) => o._id !== orderId);
      setLocalCancelledOrders(newCancelledList);

      // Push to Incoming List
      const incomingList = getLocalIncomingOrders();
      incomingList.push(updatedOrder);
      setLocalIncomingOrders(incomingList);

      // Trigger socket event simulation
      window.dispatchEvent(new CustomEvent("orderReopenedSim", { detail: { orderId } }));

      return { success: true, order: updatedOrder };
    },
    onSuccess: () => {
      toast.success("Order moved to Incoming Orders", {
        description: "Order reopened successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["cancelledOrders"] });
      queryClient.invalidateQueries({ queryKey: ["incomingOrders"] });
    },
    onError: (err) => {
      toast.error(err.message || "Failed to reopen order");
    }
  });
}

export function useRefundHistory(orderId) {
  return useQuery({
    queryKey: ["refundHistory", orderId],
    queryFn: async () => {
      try {
        return (await storeOrdersApi.refunds(orderId)) || [];
      } catch (err) {
        failOrMock(err, "Could not load the refund history"); // sample refunds only when VITE_STANDALONE_MOCK=true
      }
      await new Promise((resolve) => setTimeout(resolve, 200));
      const refunds = getLocalRefunds();
      return refunds.filter((r) => r.orderId === orderId);
    },
    enabled: !!orderId,
  });
}
