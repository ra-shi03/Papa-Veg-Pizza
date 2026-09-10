import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve food waste records details.
 * @param {string} wasteId - Waste item identifier.
 */
export function useWasteAnalysis(wasteId) {
  return useQuery({
    queryKey: ["waste-analysis", wasteId],
    queryFn: async () => {
      if (!wasteId) return null;
      const response = await apiClient.get(`/reports/kitchen/waste/${wasteId}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API format");
    },
    enabled: !!wasteId,
  });
}
