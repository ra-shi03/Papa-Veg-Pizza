import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve monthly store details (revenue, expenses, products, staff, delivery, inventory).
 * @param {string} month - The month to retrieve details for (e.g., "Jun 2026").
 * @param {boolean} enabled - Whether the query is enabled.
 */
export function useMonthlyStoreDetails(month, enabled = false) {
  return useQuery({
    queryKey: ["monthly-store-details", month],
    queryFn: async () => {
      if (!month) return null;
      const response = await apiClient.get(`/reports/store/${encodeURIComponent(month)}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API response format");
    },
    enabled: enabled && !!month,
  });
}
