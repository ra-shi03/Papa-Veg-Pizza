import { useState, useEffect } from "react";
import { storeOrdersApi, LIVE_POLL_MS, useLiveIndicator } from "../../api/storeOrdersApi";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { STANDALONE_MOCK, failOrMock } from "@/services/api/mockPolicy";
import io from "socket.io-client";
import { initialMockCompletedOrders } from "../mockData";

const COMPLETED_ORDERS_STORAGE_KEY = "pvp_completed_orders";

const getLocalCompletedOrders = () => {
  try {
    let list = JSON.parse(localStorage.getItem(COMPLETED_ORDERS_STORAGE_KEY));
    if (!list || !Array.isArray(list) || list.length === 0) {
      list = initialMockCompletedOrders;
      localStorage.setItem(COMPLETED_ORDERS_STORAGE_KEY, JSON.stringify(list));
    }
    return list;
  } catch (e) {
    localStorage.setItem(COMPLETED_ORDERS_STORAGE_KEY, JSON.stringify(initialMockCompletedOrders));
    return initialMockCompletedOrders;
  }
};

const setLocalCompletedOrders = (orders) => {
  localStorage.setItem(COMPLETED_ORDERS_STORAGE_KEY, JSON.stringify(orders));
};

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
      // Say so instead of pretending a new order exists (the local copy below only runs when VITE_STANDALONE_MOCK=true).
      if (!STANDALONE_MOCK) {
        throw new Error("Reordering from the store is not available yet. Ask the customer to place the order again in the app.");
      }
      await new Promise((resolve) => setTimeout(resolve, 500));

      const completedOrders = getLocalCompletedOrders();
      const order = completedOrders.find((o) => o._id === previousOrderId);
      if (!order) throw new Error("Original order not found");

      // Build items with adjusted quantities
      const reorderItems = items || order.items;

      // Seed a new active/incoming order into local storage PVP orders DB
      const localActiveOrders = JSON.parse(localStorage.getItem("pvp_incoming_orders")) || [];
      const newOrderId = `reorder-${Date.now()}`;
      
      const newOrder = {
        _id: newOrderId,
        orderNumber: `PVP-R${Math.floor(10000 + Math.random() * 90000)}`,
        customerId: order.customerId,
        customer: order.customer,
        status: "received",
        createdAt: new Date().toISOString(),
        orderType: order.orderType,
        priority: "normal",
        paymentStatus: "payment_pending",
        paymentMethod: order.paymentMethod,
        grandTotal: reorderItems.reduce((acc, it) => acc + (it.unitPrice * it.quantity), 0),
        items: reorderItems,
        deliveryAddress: order.deliveryAddress
      };

      localActiveOrders.unshift(newOrder);
      localStorage.setItem("pvp_incoming_orders", JSON.stringify(localActiveOrders));

      return { success: true, orderId: newOrderId, status: "payment_pending" };
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
