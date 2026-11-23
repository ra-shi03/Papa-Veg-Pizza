import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { requestId, approvedQty, remarks } = payload;

      try {
        const response = await apiClient.patch(`${INV}/stock-requests/approve`, {
          requestId,
          approvedQty: Number(approvedQty),
          remarks
        });

        if (response.data && response.data.success) {
          return response.data;
        }

        throw new Error(response.data?.message || "Failed to approve request");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Request approved");
      
      // Invalidate queries to refresh tables and stats
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock-request-details", variables.requestId] });
    },
    onError: (error) => {
      toast.error(error.message || "Approval failed");
    }
  });
}
