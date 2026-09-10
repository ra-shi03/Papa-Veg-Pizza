import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalWasteLogs } from "../mockData";

export function useWasteDashboard() {
  return useQuery({
    queryKey: ["waste-dashboard"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/waste/dashboard");
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.totalWasteToday !== undefined) {
          return response.data;
        }
        throw new Error("Invalid response format");
      } catch (err) {
        console.warn("Backend API unavailable. Fetching waste dashboard from local storage.");

        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 300));

        const wasteLogs = getLocalWasteLogs().filter(log => log.status !== "deleted");

        // Today's boundaries (Indian Standard Time or system local)
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Weekly boundaries (7 days ago)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        let totalWasteToday = 0;
        let weeklyWaste = 0;
        let lossAmount = 0;
        const ingredientQuantities = {};

        wasteLogs.forEach((log) => {
          const logDate = new Date(log.createdAt);
          const qty = Number(log.quantity) || 0;
          const loss = Number(log.estimatedLoss) || 0;

          if (logDate >= startOfToday) {
            totalWasteToday += qty;
          }
          if (logDate >= sevenDaysAgo) {
            weeklyWaste += qty;
          }
          lossAmount += loss;

          // Track ingredient totals for top wasted ingredient
          const name = log.ingredientName || "Unknown Ingredient";
          ingredientQuantities[name] = (ingredientQuantities[name] || 0) + qty;
        });

        // Find top wasted ingredient
        let topWastedIngredient = "None";
        let maxQty = 0;
        Object.entries(ingredientQuantities).forEach(([name, qty]) => {
          if (qty > maxQty) {
            maxQty = qty;
            topWastedIngredient = name;
          }
        });

        return {
          totalWasteToday: Number(totalWasteToday.toFixed(2)),
          weeklyWaste: Number(weeklyWaste.toFixed(2)),
          lossAmount: Number(lossAmount.toFixed(2)),
          topWastedIngredient
        };
      }
    }
  });
}
