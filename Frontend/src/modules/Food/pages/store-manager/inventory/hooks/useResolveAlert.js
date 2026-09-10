import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { getLocalInventoryAlerts, setLocalInventoryAlerts } from "../mockData";

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { alertId, resolutionNote, resolvedBy = "Shubham Jamliya" } = payload;

      try {
        const response = await apiClient.patch(`/alerts/resolve`, {
          alertId,
          resolutionNote,
          resolvedBy
        });
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.success) {
          return response.data;
        }
        throw new Error(response.data?.message || "Failed to resolve alert on backend");
      } catch (err) {
        console.warn("Backend API unavailable. Resolving alert in local database.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const alerts = getLocalInventoryAlerts();
        const alertIndex = alerts.findIndex((a) => a._id === alertId);

        if (alertIndex === -1) {
          throw new Error("Alert not found in local database");
        }

        alerts[alertIndex] = {
          ...alerts[alertIndex],
          status: "resolved",
          resolvedBy,
          resolvedAt: new Date().toISOString(),
          resolutionNote
        };

        setLocalInventoryAlerts(alerts);

        return {
          success: true,
          message: "Alert resolved successfully in local database"
        };
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Alert resolved successfully");
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alerts-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["alert-details"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resolve alert");
    }
  });
}
