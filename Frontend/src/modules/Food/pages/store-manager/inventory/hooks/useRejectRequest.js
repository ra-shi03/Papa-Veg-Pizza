import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { requestId, remarks } = payload;

      try {
        const response = await apiClient.patch(`${INV}/stock-requests/reject`, {
          requestId,
          remarks
        });

        if (response.data && response.data.success) {
          return response.data;
        }

        throw new Error(response.data?.message || "Failed to reject request");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Request rejected");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock-request-details", variables.requestId] });
    },
    onError: (error) => {
      toast.error(error.message || "Rejection failed");
    }
  });
}
