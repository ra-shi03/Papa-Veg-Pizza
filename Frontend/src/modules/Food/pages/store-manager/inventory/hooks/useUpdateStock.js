import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useUpdateStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { ingredientId, type, quantity, reason, notes } = payload;
      
      try {
        const response = await apiClient.post(`${INV}/update-stock`, {
          ingredientId,
          type,
          quantity: Number(quantity),
          reason,
          notes
        });

        if (response.data && response.data.success) {
          return response.data;
        }
        
        throw new Error(response.data?.message || "Stock update failed on backend");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Stock updated successfully");
      
      // Invalidate queries to refresh components
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["inventory-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient-details"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update stock");
    }
  });
}
