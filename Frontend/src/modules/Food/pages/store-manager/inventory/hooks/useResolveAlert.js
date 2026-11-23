import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useResolveAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { alertId, resolutionNote, resolvedBy } = payload;

      try {
        const response = await apiClient.patch(`${INV}/alerts/resolve`, {
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
        throwApiError(err);
        
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
