import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalIngredients, getLocalTransactions, mockConsumptionStats } from "../mockData";

export function useIngredientDetails(ingredientId) {
  return useQuery({
    queryKey: ["ingredient-details", ingredientId],
    queryFn: async () => {
      if (!ingredientId) return null;
      try {
        const response = await apiClient.get(`/inventory/${ingredientId}`);

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
        console.warn(`Backend API unavailable for ingredient details ${ingredientId}. Using local storage details.`);
        
        const ingredients = getLocalIngredients();
        const ingredient = ingredients.find(i => i._id === ingredientId);

        if (!ingredient) {
          throw new Error("Ingredient not found");
        }

        // Retrieve consumption stats
        const consumption = mockConsumptionStats[ingredientId] || {
          today: 0,
          week: 0,
          month: 0,
          averageDaily: 0
        };

        // Retrieve last 5 transactions
        const transactions = getLocalTransactions()
          .filter(t => t.ingredientId === ingredientId)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 250));

        return {
          ingredient,
          consumption,
          recentTransactions: transactions
        };
      }
    },
    enabled: !!ingredientId,
    staleTime: 5000,
  });
}
