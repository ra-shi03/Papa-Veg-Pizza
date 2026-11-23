import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useTransferStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { 
        fromStore, 
        fromStoreId, 
        toStore = "Indore Main Store", 
        toStoreId = "st-indore-01", 
        ingredientId, 
        quantity, 
        reason, 
        remarks = "",
        shortageId
      } = payload;

      try {
        const response = await apiClient.post(`${INV}/transfer`, {
          fromStoreId,
          toStoreId,
          ingredientId,
          quantity,
          reason,
          remarks
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
        throw new Error(response.data?.message || "Failed to submit stock transfer");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Transfer request submitted successfully");
      queryClient.invalidateQueries({ queryKey: ["ingredient-shortages"] });
      queryClient.invalidateQueries({ queryKey: ["shortages-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["shortage-details"] });
      queryClient.invalidateQueries({ queryKey: ["stock-transfers"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit transfer request");
    }
  });
}
