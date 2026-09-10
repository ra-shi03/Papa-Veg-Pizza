import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { mockStores } from "../mockData";

export function useAvailableStores(ingredientId) {
  return useQuery({
    queryKey: ["available-stores", ingredientId],
    enabled: !!ingredientId,
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/inventory/available-stores`, {
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
        console.warn("Backend API unavailable. Fetching available stores from mock database.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Returns mock stores. Adjust mock availableQty based on ingredient ID
        return mockStores.map(store => {
          let stock = store.availableQty;
          if (ingredientId === "ing-013") {
            stock = store.storeId === "st-indore-02" ? 300 : 150;
          }
          return {
            ...store,
            availableQty: stock
          };
        });
      }
    }
  });
}
