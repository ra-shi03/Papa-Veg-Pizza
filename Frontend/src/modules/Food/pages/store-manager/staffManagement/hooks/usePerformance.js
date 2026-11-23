import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { throwApiError } from "@/services/api/apiError";



// Initialize performance DB in localStorage if empty



// 1. Fetch Performance Leaderboard
export function usePerformanceList(filters = {}) {
  return useQuery({
    queryKey: ["kitchenPerformance", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/performance", {
          params: filters,
        });

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }

        if (response.data?.success && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error("API return format mismatch");
      } catch (err) {
        throwApiError(err, "Could not load performance");
        
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

// 2. Fetch Single Staff Performance Details
export function useStaffPerformanceDetails(staffId, period = "monthly") {
  return useQuery({
    queryKey: ["staffPerformanceDetails", staffId, period],
    queryFn: async () => {
      if (!staffId) return null;
      try {
        const response = await apiClient.get(`/store/performance/${staffId}`, {
          params: { period }
        });

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }

        if (response.data?.success && response.data.data) {
          return response.data.data;
        } else if (response.data) {
          return response.data;
        }
        throw new Error("API return format mismatch");
      } catch (err) {
        throwApiError(err, "Could not load performance");
        
      }
    },
    enabled: !!staffId,
  });
}
