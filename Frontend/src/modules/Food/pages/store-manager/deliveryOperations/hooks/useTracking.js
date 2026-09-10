import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

export default function useTracking(orderId) {
  return useQuery({
    queryKey: ["tracking", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      const response = await apiClient.get(`/store/tracking/${orderId}`);
      if (response.data?.data) {
        return response.data.data;
      }
      return response.data;
    },
    enabled: !!orderId,
    refetchInterval: 10000, // Background polling every 10 seconds as a fallback
  });
}
