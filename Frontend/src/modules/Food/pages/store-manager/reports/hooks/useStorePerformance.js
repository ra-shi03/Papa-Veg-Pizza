import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve store performance metrics, charts, and monthly ledger table.
 * @param {Object} filters - Search filters.
 * @param {string} filters.storeId - Store identifier.
 * @param {string} filters.period - Reporting period (monthly | quarterly | yearly).
 * @param {string} filters.startDate - Custom start date.
 * @param {string} filters.endDate - Custom end date.
 * @param {number} filters.page - Table page index.
 * @param {number} filters.limit - Table limit per page.
 */
export function useStorePerformance(filters = {}) {
  return useQuery({
    queryKey: ["store-performance", filters],
    queryFn: async () => {
      const response = await apiClient.get("/reports/store", {
        params: filters,
      });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API response format");
    },
  });
}
