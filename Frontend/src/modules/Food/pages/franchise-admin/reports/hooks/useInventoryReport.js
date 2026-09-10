// Custom hooks for Inventory Reports Page
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

// Fetch inventory dashboard summary stats
export function useInventoryDashboard(filters = {}) {
  return useQuery({
    queryKey: ["inventoryDashboard", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/inventory/dashboard", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch consumption trend data
export function useConsumptionTrend(filters = {}) {
  return useQuery({
    queryKey: ["inventoryConsumptionTrend", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/inventory/consumption-trend", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch low stock levels list
export function useLowStockLevels(filters = {}) {
  return useQuery({
    queryKey: ["inventoryLowStock", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/inventory/low-stock", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch detailed ingredient usage
export function useIngredientUsage(filters = {}) {
  return useQuery({
    queryKey: ["ingredientUsage", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/inventory/ingredient-usage", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch purchase requests analytics
export function usePurchaseRequestsAnalytics(filters = {}) {
  return useQuery({
    queryKey: ["purchaseRequestsAnalytics", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/inventory/purchase-analytics", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch purchase requests list
export function usePurchaseRequestsList(filters = {}) {
  return useQuery({
    queryKey: ["purchaseRequestsList", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/purchase-requests", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch stock transactions list
export function useStockTransactionsList(filters = {}) {
  return useQuery({
    queryKey: ["stockTransactionsList", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/stock-transactions", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch suppliers summary list
export function useSuppliersSummaryList(filters = {}) {
  return useQuery({
    queryKey: ["suppliersSummaryList", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/inventory/suppliers", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch generated inventory reports logs list
export function useInventoryReportsList(filters = {}) {
  return useQuery({
    queryKey: ["inventoryReportsList", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/inventory/list", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch single inventory report details
export function useInventoryReportDetail(reportId) {
  return useQuery({
    queryKey: ["inventoryReportDetail", reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const { data } = await apiClient.get(`/reports/inventory/${reportId}`);
      return data.data;
    },
    enabled: !!reportId,
    staleTime: 5000,
  });
}

// Generate new inventory report
export function useGenerateInventoryReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/reports/inventory/generate", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryReportsList"] });
    }
  });
}

// Delete inventory report log
export function useDeleteInventoryReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (reportId) => {
      const { data } = await apiClient.delete(`/reports/inventory/${reportId}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventoryReportsList"] });
    }
  });
}
