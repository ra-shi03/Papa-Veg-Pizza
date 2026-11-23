import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useAvailableStores(ingredientId) {
  return useQuery({
    queryKey: ["available-stores", ingredientId],
    enabled: !!ingredientId,
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${INV}/available-stores`, {
          params: { ingredientId }
        });
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        return response.data;
      } catch (err) {
        throwApiError(err);
        
      }
    }
  });
}
