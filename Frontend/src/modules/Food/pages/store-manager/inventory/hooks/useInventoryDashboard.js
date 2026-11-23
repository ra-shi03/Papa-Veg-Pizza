import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useInventoryDashboard() {
  return useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${INV}/dashboard`);
        
        // Detect stubbed response pattern
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }

        if (response.data && typeof response.data === "object" && "totalIngredients" in response.data) {
          return response.data;
        }
        if (response.data?.data && typeof response.data.data === "object" && "totalIngredients" in response.data.data) {
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
