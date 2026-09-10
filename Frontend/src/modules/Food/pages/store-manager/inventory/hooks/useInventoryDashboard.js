import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalIngredients } from "../mockData";

export function useInventoryDashboard() {
  return useQuery({
    queryKey: ["inventory-dashboard"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/inventory/dashboard");
        
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
        console.warn("Backend API unavailable for dashboard. Using local calculated values.");
        
        // Compute dashboard metrics from local storage
        const ingredients = getLocalIngredients();
        const totalIngredients = ingredients.length;
        const availableIngredients = ingredients.filter(i => i.status === "available").length;
        const lowStockCount = ingredients.filter(i => i.status === "low_stock").length;
        const outOfStockCount = ingredients.filter(i => i.status === "out_of_stock").length;
        
        const inventoryValue = ingredients.reduce((sum, item) => {
          return sum + (item.currentStock * item.costPerUnit);
        }, 0);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        return {
          totalIngredients,
          availableIngredients,
          lowStockCount,
          outOfStockCount,
          inventoryValue: Math.round(inventoryValue)
        };
      }
    },
    staleTime: 5000,
  });
}
