// Custom hooks for Staff Reports Page
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

// Fetch staff dashboard summary stats
export function useStaffDashboard(filters = {}) {
  return useQuery({
    queryKey: ["staffDashboard", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/staff/dashboard", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch staff role distribution
export function useStaffRoleDistribution(filters = {}) {
  return useQuery({
    queryKey: ["staffRoleDistribution", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/staff/role-distribution", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch attendance trend data
export function useStaffAttendanceTrend(filters = {}) {
  return useQuery({
    queryKey: ["staffAttendanceTrend", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/staff/attendance-trend", { params: filters });
      return data.data;
    },
    staleTime: 10000,
  });
}

// Fetch delivery partner performance metrics
export function useDeliveryPerformance(filters = {}) {
  return useQuery({
    queryKey: ["deliveryPerformance", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/staff/delivery-performance", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch kitchen staff performance metrics
export function useKitchenPerformance(filters = {}) {
  return useQuery({
    queryKey: ["kitchenPerformance", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/staff/kitchen-performance", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch store manager performance metrics
export function useManagerPerformance(filters = {}) {
  return useQuery({
    queryKey: ["managerPerformance", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/staff/manager-performance", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch detailed staff report list
export function useStaffDetailedList(filters = {}) {
  return useQuery({
    queryKey: ["staffDetailedList", filters],
    queryFn: async () => {
      const { data } = await apiClient.get("/reports/staff/list", { params: filters });
      return data.data;
    },
    staleTime: 5000,
  });
}

// Fetch single staff member details
export function useStaffDetail(staffId) {
  return useQuery({
    queryKey: ["staffDetail", staffId],
    queryFn: async () => {
      if (!staffId) return null;
      const { data } = await apiClient.get(`/staff/${staffId}`);
      return data.data;
    },
    enabled: !!staffId,
    staleTime: 5000,
  });
}

// Fetch staff shifts history
export function useStaffShifts(staffId) {
  return useQuery({
    queryKey: ["staffShifts", staffId],
    queryFn: async () => {
      if (!staffId) return null;
      const { data } = await apiClient.get(`/staff/${staffId}/shifts`);
      return data.data;
    },
    enabled: !!staffId,
    staleTime: 5000,
  });
}

// Generate new staff report
export function useGenerateStaffReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await apiClient.post("/reports/staff/generate", payload);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffReportsList"] });
    }
  });
}

// Fetch generated staff reports log list
export function useStaffReportsList() {
  return useQuery({
    queryKey: ["staffReportsList"],
    queryFn: async () => {
      const { data } = await apiClient.get("/staff-reports");
      return data.data;
    },
    staleTime: 5000,
  });
}

// Delete an existing generated staff report
export function useDeleteStaffReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const { data } = await apiClient.delete(`/staff-reports/${id}`);
      return data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["staffReportsList"] });
    }
  });
}

// Fetch report detail for exporting staff reports
export function useExportStaffReport(reportId) {
  return useQuery({
    queryKey: ["exportStaffReport", reportId],
    queryFn: async () => {
      if (!reportId) return null;
      const { data } = await apiClient.get(`/staff-reports/${reportId}/export`);
      return data.data;
    },
    enabled: !!reportId,
    staleTime: 10000,
  });
}
