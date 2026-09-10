import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve staff performance metrics, rankings, and ledger.
 * @param {Object} filters - Search filters.
 * @param {string} filters.storeId - Store identifier.
 * @param {string} filters.period - Reporting period (daily | weekly | monthly).
 * @param {string} filters.role - Staff role filter.
 * @param {string} filters.station - Kitchen station filter.
 * @param {number} filters.page - Table page index.
 * @param {number} filters.limit - Table limit per page.
 * @param {string} filters.search - Search string.
 * @param {string} filters.sortBy - Sort by column key.
 * @param {string} filters.sortOrder - Sort direction ('asc' | 'desc').
 */
export function useStaffPerformance(filters = {}) {
  return useQuery({
    queryKey: ["staff-performance", filters],
    queryFn: async () => {
      const response = await apiClient.get("/reports/staff-performance", {
        params: filters,
      });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API format");
    },
  });
}
