import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useNotifyAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { shortageId, type, message, priority } = payload;

      try {
        const response = await apiClient.post(`${INV}/notifications/admin`, {
          shortageId,
          type,
          message,
          priority
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
        throw new Error(response.data?.message || "Failed to notify admin");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Admin notified successfully");
      queryClient.invalidateQueries({ queryKey: ["shortage-details"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient-shortages"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to notify admin");
    }
  });
}
