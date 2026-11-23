import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useIngredientDetails(ingredientId) {
  return useQuery({
    queryKey: ["ingredient-details", ingredientId],
    queryFn: async () => {
      if (!ingredientId) return null;
      try {
        const response = await apiClient.get(`${INV}/${ingredientId}`);

        // Detect stubbed response pattern
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
    enabled: !!ingredientId,
    staleTime: 5000,
  });
}
