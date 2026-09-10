import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve revenue breakdown metrics and contributions.
 * @param {string} month - The month key (e.g. "Jun 2026").
 * @param {boolean} enabled - Whether the query is enabled.
 */
export function useRevenueBreakdown(month, enabled = false) {
  return useQuery({
    queryKey: ["revenue-breakdown", month],
    queryFn: async () => {
      if (!month) return null;
      const response = await apiClient.get(`/reports/store/revenue/${encodeURIComponent(month)}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API response format");
    },
    enabled: enabled && !!month,
  });
}
