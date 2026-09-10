import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalInventoryAlerts, getLocalIngredients, mockConsumptionStats } from "../mockData";

export function useAlertDetails(alertId) {
  return useQuery({
    queryKey: ["alert-details", alertId],
    enabled: !!alertId,
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/alerts/${alertId}`);
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
        console.warn(`Backend API unavailable. Fetching alert details for ${alertId} from local storage.`);

        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 300));

        const alerts = getLocalInventoryAlerts();
        const alert = alerts.find((a) => a._id === alertId);

        if (!alert) {
          throw new Error("Alert not found");
        }

        const ingredients = getLocalIngredients();
        const ingredient = ingredients.find((i) => i._id === alert.ingredientId);

        const consumption = mockConsumptionStats[alert.ingredientId] || {
          today: 0,
          week: 0,
          month: 0,
          averageDaily: 0,
        };

        // Calculate estimated depletion time
        let depletionEstimation = "N/A";
        if (alert.currentStock === 0) {
          depletionEstimation = "Out of Stock / Depleted";
        } else if (consumption.averageDaily > 0) {
          const days = (alert.currentStock / consumption.averageDaily).toFixed(1);
          depletionEstimation = `${days} days remaining`;
        } else {
          depletionEstimation = "No daily consumption data available";
        }

        return {
          ...alert,
          category: ingredient?.category || "Unknown",
          unit: ingredient?.unit || "Unit",
          costPerUnit: ingredient?.costPerUnit || 0,
          reorderLevel: ingredient?.reorderLevel || 0,
          supplierName: ingredient?.supplierName || "Default Supplier",
          consumption,
          depletionEstimation,
        };
      }
    },
  });
}
