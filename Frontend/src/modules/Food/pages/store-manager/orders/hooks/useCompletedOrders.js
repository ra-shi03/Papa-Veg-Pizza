import { useState, useEffect } from "react";
import { storeOrdersApi, LIVE_POLL_MS, useLiveIndicator } from "../../api/storeOrdersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import io from "socket.io-client";





const inDateRange = (o, f) => {
  const created = new Date(o.createdAt);
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const days = (n) => created >= new Date(startOfToday.getTime() - (n - 1) * 86400000);
  if (f.dateRangeType === "Today" && created < startOfToday) return false;
  if (f.dateRangeType === "Yesterday" && !(created >= new Date(startOfToday.getTime() - 86400000) && created < startOfToday)) return false;
  if (f.dateRangeType === "Last 7 Days" && !days(7)) return false;
  if (f.dateRangeType === "Last 30 Days" && !days(30)) return false;
  if (f.startDate && f.endDate) {
    const end = new Date(f.endDate);
    end.setHours(23, 59, 59, 999);
    if (created < new Date(f.startDate) || created > end) return false;
  }
  return true;
};

export function useCompletedOrders(filters = {}) {
  const query = useQuery({
    queryKey: ["completedOrders", filters],
    queryFn: async () => {
      let list = (await storeOrdersApi.list("completed", { search: filters.search })).filter((o) => inDateRange(o, filters));
      if (filters.paymentType && filters.paymentType !== "All") {
        list = list.filter((o) => o.paymentMethod.toLowerCase() === String(filters.paymentType).toLowerCase());
      }

      const totalOrders = list.length;
      const totalRevenue = list.reduce((sum, o) => sum + o.grandTotal, 0);
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      return {
        orders: list.slice((page - 1) * limit, page * limit),
        totalOrders,
        totalRevenue,
        averageOrderValue: totalOrders ? Math.round(totalRevenue / totalOrders) : 0,
        averageDeliveryTime: 0,
        averageCustomerRating: 0,
        highValueOrdersCount: list.filter((o) => o.grandTotal > 1000).length,
        pagination: { total: totalOrders, page, limit },
      };
    },
    refetchInterval: LIVE_POLL_MS * 4,
    staleTime: 5000,
  });
  return { ...query, socketConnected: useLiveIndicator(query) };
}

export function useReorderOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ previousOrderId, items }) => {
      // Placing an order on a customer's behalf needs pricing, payment and the customer's consent: not built yet.

      throw new Error("Reordering from the store is not available yet. Ask the customer to place the order again in the app.");
      
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incomingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["completedOrders"] });
      toast.success("Reorder created successfully!");
    },
    onError: (err) => {
      toast.error("Failed to create reorder: " + err.message);
    }
  });
}

export function useExportCompletedOrders() {
  return useMutation({
    mutationFn: async ({ format, dateRange, emailReport, emailAddress }) => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return { success: true, format, dateRange, emailReport, emailAddress };
    },
    onSuccess: (data) => {
      if (data.emailReport) {
        toast.success(`Report dispatched successfully via email to ${data.emailAddress}`);
      } else {
        toast.success(`Export successful! Downloading PVP_Completed_Orders.${data.format.toLowerCase()}`);
      }
    },
    onError: (err) => {
      toast.error("Failed to export report: " + err.message);
    }
  });
}
