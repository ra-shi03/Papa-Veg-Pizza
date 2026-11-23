import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useStockRequestDetails(requestId) {
  return useQuery({
    queryKey: ["stock-request-details", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      try {
        const response = await apiClient.get(`${INV}/stock-requests/${requestId}`);

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
    enabled: !!requestId,
    staleTime: 5000,
  });
}
