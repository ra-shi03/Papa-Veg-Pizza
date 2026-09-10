import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
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

export function useCompletedOrders(filters = {}) {
  const queryClient = useQueryClient();
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    setSocketConnected(true);
    const socketUrl = import.meta.env?.VITE_SOCKET_URL || window.location.origin;
    const socket = io(socketUrl, {
      transports: ["websocket"],
      autoConnect: false,
    });

    // Real-time simulations
    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  const completedOrdersQuery = useQuery({
    queryKey: ["completedOrders", filters],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      
      let list = getLocalCompletedOrders();

      // Apply Search (Order Number, Customer Name, Customer Phone)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(q) ||
            o.customer.name.toLowerCase().includes(q) ||
            o.customer.phone.toLowerCase().includes(q)
        );
      }

      // Filter by Payment Type
      if (filters.paymentType && filters.paymentType !== "All") {
        list = list.filter((o) => o.paymentMethod.toLowerCase() === filters.paymentType.toLowerCase());
      }

      // Filter by Payment Status (Paid, Refunded)
      if (filters.paymentStatus && filters.paymentStatus !== "All") {
        if (filters.paymentStatus.toLowerCase() === "refunded") {
          list = list.filter((o) => o.refundStatus === "refunded");
        } else {
          list = list.filter((o) => o.refundStatus !== "refunded");
        }
      }

      // Filter by Delivery Type (orderType)
      if (filters.deliveryType && filters.deliveryType !== "All") {
        list = list.filter((o) => o.orderType === filters.deliveryType.toLowerCase());
      }

      // Filter by Order Source
      if (filters.orderSource && filters.orderSource !== "All") {
        list = list.filter((o) => o.orderSource.toLowerCase() === filters.orderSource.toLowerCase());
      }

      // Filter by Order Value (High Value > 1000)
      if (filters.highValue === "true" || filters.highValue === true || filters.orderValue === "High Value") {
        list = list.filter((o) => o.grandTotal > 1000);
      }

      // Filter by Customer Rating
      if (filters.rating && filters.rating !== "All") {
        const targetRating = parseInt(filters.rating);
        if (!isNaN(targetRating)) {
          list = list.filter((o) => o.customerRating === targetRating);
        }
      }

      // Filter by Date
      if (filters.dateRangeType && filters.dateRangeType !== "All") {
        const now = new Date();
        now.setHours(23, 59, 59, 999); // end of today
        
        list = list.filter((o) => {
          const orderDate = new Date(o.createdAt);
          const diffTime = Math.abs(now - orderDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (filters.dateRangeType === "Today") {
            return diffDays <= 1 && orderDate.getDate() === now.getDate();
          }
          if (filters.dateRangeType === "Yesterday") {
            const yesterday = new Date();
            yesterday.setDate(now.getDate() - 1);
            return orderDate.getDate() === yesterday.getDate() && orderDate.getMonth() === yesterday.getMonth();
          }
          if (filters.dateRangeType === "Last 7 Days") {
            return diffDays <= 7;
          }
          if (filters.dateRangeType === "Last 30 Days") {
            return diffDays <= 30;
          }
          return true;
        });
      }

      // Filter by Custom Date Range
      if (filters.startDate && filters.endDate) {
        const start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
        
        list = list.filter((o) => {
          const orderDate = new Date(o.createdAt);
          return orderDate >= start && orderDate <= end;
        });
      }

      // Calculate KPI Aggregates
      const totalOrders = list.length;
      const totalRevenue = list.reduce((sum, o) => sum + o.grandTotal, 0);
      const averageOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;
      
      const ordersWithDuration = list.filter((o) => o.totalDuration);
      const averageDeliveryTime = ordersWithDuration.length > 0 
        ? Math.round(ordersWithDuration.reduce((sum, o) => sum + o.totalDuration, 0) / ordersWithDuration.length) 
        : 28; // Default fallback to 28 mins

      const ratedOrders = list.filter((o) => o.customerRating);
      const averageCustomerRating = ratedOrders.length > 0
        ? Number((ratedOrders.reduce((sum, o) => sum + o.customerRating, 0) / ratedOrders.length).toFixed(1))
        : 4.5; // Default fallback to 4.5 stars

      const highValueOrdersCount = list.filter((o) => o.grandTotal > 1000).length;

      // Pagination
      const page = parseInt(filters.page) || 1;
      const limit = parseInt(filters.limit) || 10;
      const startIndex = (page - 1) * limit;
      const paginatedList = list.slice(startIndex, startIndex + limit);

      return {
        orders: paginatedList,
        totalOrders,
        totalRevenue,
        averageOrderValue,
        averageDeliveryTime,
        averageCustomerRating,
        highValueOrdersCount,
        pagination: {
          total: totalOrders,
          page,
          limit
        }
      };
    },
    staleTime: 1000,
  });

  return {
    ...completedOrdersQuery,
    socketConnected,
  };
}

export function useReorderOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ previousOrderId, items }) => {
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
