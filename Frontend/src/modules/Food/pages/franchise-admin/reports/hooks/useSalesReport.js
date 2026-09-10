// Custom hooks for Sales Reports Page
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

// Fetch dashboard summary stats
export function useSalesDashboard(filters = {}) {
  return useQuery({
    queryKey: ["salesDashboard", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/sales/dashboard", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch revenue trends (hourly, daily, weekly, monthly, yearly)
export function useSalesTrend(filters = {}, mode = "daily") {
  return useQuery({
    queryKey: ["salesTrend", filters, mode],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/sales/revenue-trend", {
        params: { ...filters, mode }
      });
      return data.data;
    },
    staleTime: 10000,
  });
}

// Fetch store performance metrics
export function useStorePerformance(filters = {}) {
  return useQuery({
    queryKey: ["storePerformanceData", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/sales/store-performance", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch payment distribution breakdown
export function usePaymentDistribution(filters = {}) {
  return useQuery({
    queryKey: ["paymentDistribution", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/sales/payment-distribution", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch top selling products
export function useTopProducts(filters = {}) {
  return useQuery({
    queryKey: ["topProducts", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/sales/top-products", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch generated reports lists
export function useGeneratedReports(filters = {}) {
  return useQuery({
    queryKey: ["generatedReports", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/generated-reports", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch a single report's detail view
export function useSingleReport(id) {
  return useQuery({
    queryKey: ["singleReport", id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await apiClient.get(`/generated-reports/${id}`);
      return data.data;
    },
    enabled: !!id,
    staleTime: 5000,
  });
}

// Create a new sales report
export function useGenerateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/reports/sales/generate", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generatedReports"] });
    }
  });
}

// Delete an existing generated report
export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/generated-reports/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["generatedReports"] });
    }
  });
}

// Fetch list of stores for dropdown selections
export function useStoresDropdown() {
  return useQuery({
    queryKey: ["storesDropdown"],
    queryFn: async () => {
      const { data } = await apiClient.get("/stores/dropdown");
      return data.data;
    },
    staleTime: 60000,
  });
}
