import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useCreateStockRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { ingredientId, requestedQty, urgency, reason, notes } = payload;
      
      try {
        const response = await apiClient.post(`${INV}/stock-requests`, {
          ingredientId,
          requestedQty: Number(requestedQty),
          urgency,
          reason,
          notes
        });

        if (response.data && response.data.success) {
          return response.data;
        }

        throw new Error(response.data?.message || "Failed to create request");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Stock request created successfully");
      
      // Invalidate related query caches
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit stock request");
    }
  });
}
