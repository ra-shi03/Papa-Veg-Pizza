import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalInventoryAlerts } from "../mockData";

export function useAlertsDashboard() {
  return useQuery({
    queryKey: ["alerts-dashboard"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/alerts/dashboard");
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.activeAlerts !== undefined) {
          return response.data;
        }
        throw new Error("Invalid response format");
      } catch (err) {
        console.warn("Backend API unavailable. Fetching alerts dashboard from local storage.");

        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 300));

        const alerts = getLocalInventoryAlerts();
        const activeList = alerts.filter(a => a.status === "active");
        const resolvedList = alerts.filter(a => a.status === "resolved");

        const activeAlerts = activeList.length;
        const criticalAlerts = activeList.filter(a => a.severity === "critical").length;
        const resolvedAlerts = resolvedList.length;

        // Unique ingredients affected
        const uniqueIngredients = new Set(activeList.map(a => a.ingredientId));
        const ingredientsAffected = uniqueIngredients.size;

        return {
          activeAlerts,
          criticalAlerts,
          resolvedAlerts,
          ingredientsAffected
        };
      }
    }
  });
}
