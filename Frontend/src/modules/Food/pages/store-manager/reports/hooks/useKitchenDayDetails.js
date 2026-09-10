import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve operational kitchen detail metrics for a single date.
 * @param {string} date - Date string format (YYYY-MM-DD).
 */
export function useKitchenDayDetails(date) {
  return useQuery({
    queryKey: ["kitchen-day-details", date],
    queryFn: async () => {
      if (!date) return null;
      const response = await apiClient.get(`/reports/kitchen/${date}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API format");
    },
    enabled: !!date,
  });
}
