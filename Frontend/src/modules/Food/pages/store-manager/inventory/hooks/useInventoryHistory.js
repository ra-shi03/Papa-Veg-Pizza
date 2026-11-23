import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useInventoryHistory(ingredientId, filters = {}) {
  const {
    page = 1,
    limit = 5,
    search = "",
    type = ""
  } = filters;

  return useQuery({
    queryKey: ["history", ingredientId, filters],
    queryFn: async () => {
      if (!ingredientId) return { data: [], pagination: {} };
      try {
        const response = await apiClient.get(`${INV}/${ingredientId}/history`, {
          params: filters
        });

        // Detect stubbed response pattern
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }

        if (response.data && response.data.data) {
          return response.data;
        }

        throw new Error("Invalid response format");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    enabled: !!ingredientId,
    staleTime: 5000,
  });
}
