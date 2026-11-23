import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useFulfillRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { requestId, deliveredQty, remarks } = payload;

      try {
        const response = await apiClient.patch(`${INV}/stock-requests/fulfill`, {
          requestId,
          deliveredQty: Number(deliveredQty),
          remarks
        });

        if (response.data && response.data.success) {
          return response.data;
        }

        throw new Error(response.data?.message || "Failed to fulfill request");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Request fulfilled");
      
      // Invalidate queries to refresh tables, stats, and inventory
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock-request-details", variables.requestId] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
    },
    onError: (error) => {
      toast.error(error.message || "Fulfillment failed");
    }
  });
}
