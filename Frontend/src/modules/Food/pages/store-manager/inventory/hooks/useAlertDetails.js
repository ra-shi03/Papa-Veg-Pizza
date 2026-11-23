import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useAlertDetails(alertId) {
  return useQuery({
    queryKey: ["alert-details", alertId],
    enabled: !!alertId,
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${INV}/alerts/${alertId}`);
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data) {
          return response.data;
        }
        throw new Error("Invalid response format");
      } catch (err) {
        throwApiError(err);
        
      }
    },
  });
}
