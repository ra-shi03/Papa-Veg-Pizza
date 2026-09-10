import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve delay analysis details for a single order.
 * @param {string} orderId - Order identifier.
 */
export function useDelayAnalysis(orderId) {
  return useQuery({
    queryKey: ["delay-analysis", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await apiClient.get(`/reports/kitchen/delay/${orderId}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API format");
    },
    enabled: !!orderId,
  });
}
