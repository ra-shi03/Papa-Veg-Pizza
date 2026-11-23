import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useStockRequestsDashboard() {
  return useQuery({
    queryKey: ["stock-dashboard"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${INV}/stock-requests/dashboard`);
        
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }

        if (response.data && typeof response.data === "object" && "pendingRequests" in response.data) {
          return response.data;
        }
        if (response.data?.data && typeof response.data.data === "object" && "pendingRequests" in response.data.data) {
          return response.data.data;
        }

        throw new Error("Invalid response format");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    staleTime: 5000,
  });
}
