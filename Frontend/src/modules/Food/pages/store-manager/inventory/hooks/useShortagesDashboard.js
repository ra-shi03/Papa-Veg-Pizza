import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalShortages, mockAffectedOrders } from "../mockData";

export function useShortagesDashboard() {
  return useQuery({
    queryKey: ["shortages-dashboard"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/ingredient-shortages/dashboard");
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.activeShortages !== undefined) {
          return response.data;
        }
        throw new Error("Invalid response format");
      } catch (err) {
        console.warn("Backend API unavailable. Fetching shortages dashboard from local database.");

        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 300));

        const shortages = getLocalShortages();
        const activeList = shortages.filter((s) => s.status === "active");

        const activeShortages = activeList.length;
        const criticalShortages = activeList.filter((s) => s.severity === "critical").length;

        // Sum affected orders count
        const affectedOrders = activeList.reduce((sum, s) => sum + (s.affectedOrders || 0), 0);

        // Sum revenue loss from affected orders
        let estimatedRevenueLoss = 0;
        activeList.forEach((s) => {
          const orders = mockAffectedOrders[s.ingredientId] || [];
          if (orders.length > 0) {
            estimatedRevenueLoss += orders.reduce((sum, o) => sum + (o.revenue || 0), 0);
          } else {
            // Fallback estimation
            estimatedRevenueLoss += (s.affectedOrders || 0) * 450;
          }
        });

        return {
          activeShortages,
          criticalShortages,
          affectedOrders,
          estimatedRevenueLoss,
        };
      }
    },
  });
}
