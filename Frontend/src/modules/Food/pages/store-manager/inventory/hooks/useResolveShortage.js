import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useResolveShortage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { shortageId, actionTaken, notes = "" } = payload;

      try {
        const response = await apiClient.patch(`${INV}/ingredient-shortages/${shortageId}/resolve`, {
          actionTaken,
          notes
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
        throw new Error(response.data?.message || "Failed to resolve shortage");
      } catch (err) {
        throwApiError(err);
        
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Shortage marked resolved");
      queryClient.invalidateQueries({ queryKey: ["ingredient-shortages"] });
      queryClient.invalidateQueries({ queryKey: ["shortages-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["shortage-details"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resolve shortage");
    }
  });
}
