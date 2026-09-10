import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

export default function useRiderDetails(riderId) {
  return useQuery({
    queryKey: ["rider", riderId],
    queryFn: async () => {
      if (!riderId) return null;
      const response = await apiClient.get(`/store/rider/${riderId}`);
      
      // Axios response mapping helper
      let detail = null;
      if (response.data?.success && response.data?.data) {
        detail = response.data.data;
      } else {
        detail = response.data;
      }
      return detail;
    },
    enabled: !!riderId
  });
}
