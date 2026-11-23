import { useState, useEffect } from "react";
import { storeOrdersApi, LIVE_POLL_MS, useLiveIndicator } from "../../api/storeOrdersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { throwApiError } from "@/services/api/apiError";
import io from "socket.io-client";









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
        throwApiError(err, "Could not record the refund request");
      }
      
    },
    onSuccess: (data) => {
      toast.success("Refund request sent to your franchise admin", {
        description: `Reference: ${data.refund.referenceNumber}. The customer's wallet is credited once it is approved.`,
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
        throwApiError(err, "Could not reopen the order");
      }
      
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
        throwApiError(err, "Could not load the refund history");
      }
      
    },
    enabled: !!orderId,
  });
}
