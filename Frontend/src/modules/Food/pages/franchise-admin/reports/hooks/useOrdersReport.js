// Custom hooks for Order Reports Page
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@food/api/axios";

// Standard useDebounce hook to prevent excessive API requests on search input
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Fetch order dashboard summary stats
export function useOrderDashboard(filters = {}) {
  return useQuery({
    queryKey: ["orderDashboard", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/orders/dashboard", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch order status distribution
export function useOrderStatusDistribution(filters = {}) {
  return useQuery({
    queryKey: ["orderStatusDistribution", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/orders/status-distribution", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch peak order hours heatmap data
export function useOrderHourlyHeatmap(filters = {}) {
  return useQuery({
    queryKey: ["orderHourlyHeatmap", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/orders/hourly", { params: filters });
      return data.data;
    },
    staleTime: 10000,
  });
}

// Fetch order type distribution
export function useOrderTypeDistribution(filters = {}) {
  return useQuery({
    queryKey: ["orderTypeDistribution", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/orders/order-type", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch store performance metrics
export function useOrderStorePerformance(filters = {}) {
  return useQuery({
    queryKey: ["orderStorePerformance", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/orders/store-performance", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch detailed order reports list
export function useDetailedOrderReports(filters = {}) {
  return useQuery({
    queryKey: ["detailedOrderReports", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/orders/list", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch single order detail
export function useOrderDetail(orderId) {
  return useQuery({
    queryKey: ["orderDetail", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await apiClient.get(`/orders/${orderId}`);
      return data.data;
    },
    enabled: !!orderId,
    staleTime: 5000,
  });
}

// Generate new order report
export function useGenerateOrderReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/reports/orders/generate", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["detailedOrderReports"] });
    }
  });
}

// Fetch invoice detail for invoice printing/pdf download
export function useOrderInvoice(orderId) {
  return useQuery({
    queryKey: ["orderInvoice", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const { data } = await apiClient.get(`/orders/${orderId}/invoice`);
      return data.data;
    },
    enabled: !!orderId,
    staleTime: 10000,
  });
}
