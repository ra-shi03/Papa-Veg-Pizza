import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve kitchen performance metrics, trends, and table ledger.
 * @param {Object} filters - Search filters.
 * @param {string} filters.storeId - Store identifier.
 * @param {string} filters.startDate - Start Date (YYYY-MM-DD).
 * @param {string} filters.endDate - End Date (YYYY-MM-DD).
 * @param {string} filters.station - Operational kitchen station.
 * @param {string} filters.staffId - Staff member identifier.
 * @param {number} filters.page - Table page index.
 * @param {number} filters.limit - Table limit per page.
 * @param {string} filters.sortBy - Column sorting key.
 * @param {string} filters.sortOrder - Sorting order ('asc' | 'desc').
 */
export function useKitchenPerformance(filters = {}) {
  return useQuery({
    queryKey: ["kitchen-performance", filters],
    queryFn: async () => {
      const response = await apiClient.get("/reports/kitchen-performance", {
        params: filters,
      });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API format");
    },
  });
}
