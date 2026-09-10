import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve expense breakdown metrics.
 * @param {string} month - The month key (e.g. "Jun 2026").
 * @param {boolean} enabled - Whether the query is enabled.
 */
export function useExpenseBreakdown(month, enabled = false) {
  return useQuery({
    queryKey: ["expense-breakdown", month],
    queryFn: async () => {
      if (!month) return null;
      const response = await apiClient.get(`/reports/store/expenses/${encodeURIComponent(month)}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API response format");
    },
    enabled: enabled && !!month,
  });
}
