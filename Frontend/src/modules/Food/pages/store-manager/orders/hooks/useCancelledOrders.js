import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

export function useCancelledOrders(filters = {}) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    setSocketConnected(true);
    const socketUrl = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: false,
    });

    // Real-time socket events simulation
    socket.on("connect", () => setSocketConnected(true));
    socket.on("disconnect", () => setSocketConnected(false));
    
    // Simulate real-time socket events locally for demo purposes
    const handleReopenSim = (e) => {
      queryClient.invalidateQueries({ queryKey: ["cancelledOrders"] });
    };
    
    window.addEventListener("orderReopenedSim", handleReopenSim);
    window.addEventListener("refundInitiatedSim", handleReopenSim);

    return () => {
      socket.disconnect();
      window.removeEventListener("orderReopenedSim", handleReopenSim);
      window.removeEventListener("refundInitiatedSim", handleReopenSim);
    };
  }, [queryClient]);

  const cancelledOrdersQuery = useQuery({
    queryKey: ["cancelledOrders", filters],
    queryFn: async () => {
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 350));
      let list = getLocalCancelledOrders();

      // Apply Search (Order ID, Customer Name, Phone Number)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customer?.name.toLowerCase().includes(q) ||
            o.customer?.phone.includes(q)
        );
      }

      // Filter by Date
      if (filters.dateRange && filters.dateRange !== "All") {
        const now = new Date();
        list = list.filter((o) => {
          const orderDate = new Date(o.createdAt);
          if (filters.dateRange === "Today") {
            return orderDate.toDateString() === now.toDateString();
          }
          if (filters.dateRange === "Yesterday") {
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            return orderDate.toDateString() === yesterday.toDateString();
          }
          if (filters.dateRange === "Last 7 Days") {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            return orderDate >= sevenDaysAgo;
          }
          if (filters.dateRange === "Last 30 Days") {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            return orderDate >= thirtyDaysAgo;
          }
          return true;
        });
      }

      // Filter by Custom Date Range
      if (filters.customDateRange && filters.customDateRange.length === 2) {
        const [start, end] = filters.customDateRange;
        list = list.filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= new Date(start) && orderDate <= new Date(end);
        });
      }

      // Filter by Cancellation Type (Customer, Store, System)
      if (filters.cancellationType && filters.cancellationType !== "All") {
        list = list.filter(
          (o) => o.cancelledBy?.toLowerCase() === filters.cancellationType.toLowerCase()
        );
      }

      // Filter by Refund Status
      if (filters.refundStatus && filters.refundStatus !== "All") {
        list = list.filter(
          (o) => o.refundStatus?.toLowerCase() === filters.refundStatus.toLowerCase()
        );
      }

      // Filter by Payment Method
      if (filters.paymentMethod && filters.paymentMethod !== "All") {
        list = list.filter(
          (o) => o.paymentMethod?.toLowerCase() === filters.paymentMethod.toLowerCase()
        );
      }

      // Filter by Reopen Eligibility
      if (filters.reopenEligible && filters.reopenEligible !== "All") {
        const now = new Date();
        const checkEligible = (o) => {
          const cancelledAtDate = new Date(o.cancelledAt || o.updatedAt);
          const timeDiffMins = (now - cancelledAtDate) / 60000;
          const isTimeEligible = timeDiffMins <= 5;
          const isKitchenNotStarted = o.status !== "preparing" && o.status !== "baking" && o.status !== "packaging" && o.status !== "ready";
          const isInventoryAvailable = true; // Simulated inventory check
          return isTimeEligible && isKitchenNotStarted && isInventoryAvailable;
        };

        if (filters.reopenEligible === "Yes") {
          list = list.filter(checkEligible);
        } else if (filters.reopenEligible === "No") {
          list = list.filter((o) => !checkEligible(o));
        }
      }

      // Sort Cancelled Orders
      const orderField = filters.sortField || "cancelledAt";
      const orderDir = filters.sortOrder === "ascend" ? 1 : -1;
      list.sort((a, b) => {
        const valA = a[orderField] || a.createdAt;
        const valB = b[orderField] || b.createdAt;
        if (valA < valB) return -1 * orderDir;
        if (valA > valB) return 1 * orderDir;
        return 0;
      });

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const startIndex = (page - 1) * limit;
      const endIndex = page * limit;
      const paginatedList = list.slice(startIndex, endIndex);

      // KPI Calculations
      const totalCancelledOrders = list.length;
      const totalRefundAmount = list.reduce((sum, o) => sum + (o.refundAmount || 0), 0);
      const refundPendingCount = list.filter((o) => o.refundStatus === "refund_pending").length;
      const refundCompletedCount = list.filter((o) => o.refundStatus === "refund_completed").length;

      return {
        orders: paginatedList,
        totalCancelledOrders,
        totalRefundAmount,
        refundPendingCount,
        refundCompletedCount,
        pagination: {
          current: page,
          pageSize: limit,
          total: list.length,
        },
      };
    },
  });

  return {
    ...cancelledOrdersQuery,
    socketConnected,
  };
}

export function useInitiateRefund() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      // Simulate network request
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
      // Simulate network request
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
      await new Promise((resolve) => setTimeout(resolve, 200));
      const refunds = getLocalRefunds();
      return refunds.filter((r) => r.orderId === orderId);
    },
    enabled: !!orderId,
  });
}
