import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { 
  getLocalShortages, 
  getLocalIngredients, 
  mockAffectedOrders, 
  mockShortageTimeline, 
  mockStores 
} from "../mockData";

export function useShortageDetails(shortageId) {
  return useQuery({
    queryKey: ["shortage-details", shortageId],
    enabled: !!shortageId,
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/ingredient-shortages/${shortageId}`);
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
        console.warn(`Backend API unavailable. Fetching shortage details for ${shortageId} from local storage.`);

        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 305));

        const shortages = getLocalShortages();
        const shortage = shortages.find((s) => s._id === shortageId);

        if (!shortage) {
          throw new Error("Shortage record not found");
        }

        const ingredients = getLocalIngredients();
        const ingredient = ingredients.find((i) => i._id === shortage.ingredientId);

        const affectedOrders = mockAffectedOrders[shortage.ingredientId] || [];
        const timeline = mockShortageTimeline[shortageId] || [];

        // Filter stores having this ingredient (mocking store stock data)
        const stores = mockStores.map(store => {
          // Adjust mock availableQty dynamically if needed
          let stock = store.availableQty;
          if (shortage.ingredientId === "ing-013") {
            stock = store.storeId === "st-indore-02" ? 300 : 150;
          }
          return {
            ...store,
            availableQty: stock
          };
        });

        // Compute local analytics
        const revenueLoss = affectedOrders.reduce((sum, o) => sum + (o.revenue || 0), 0);
        const delayedOrders = affectedOrders.filter(o => o.status === "preparing" || o.status === "pending").length;

        // Mock alternative ingredients in the same category
        let alternatives = [];
        if (ingredient) {
          alternatives = ingredients
            .filter(i => i.category === ingredient.category && i._id !== ingredient._id && i.currentStock > i.minimumStock)
            .map(i => ({ name: i.ingredientName, stock: `${i.currentStock} ${i.unit}`, status: "available" }));
        }

        const analytics = {
          revenueLoss,
          delayedOrders,
          alternatives: alternatives.length > 0 ? alternatives : [{ name: "No direct alternative available", stock: "N/A", status: "none" }],
          stores
        };

        return {
          shortage,
          ingredient: {
            ...ingredient,
            requiredStock: (ingredient?.minimumStock || 10) + shortage.shortageQty,
            missingQty: shortage.shortageQty
          },
          affectedOrders,
          analytics,
          timeline
        };
      }
    }
  });
}
