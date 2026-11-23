import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { throwApiError } from "@/services/api/apiError";
import { getLocalReadyOrders, setLocalReadyOrders } from "./useReadyOrders";
import { getLocalRiders, setLocalRiders } from "./useAvailableRiders";

export default function useAssignRider() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ orderId, riderId }) => {
      try {
        const response = await apiClient.post("/store/delivery/assign", {
          orderId,
          riderId
        });
        return response.data;
      } catch (err) {
        throwApiError(err, "Could not assign rider. Please try again.");
        // Fallback LocalStorage updates
        
      }
    },
    onSuccess: (data) => {
      toast.success("Assignment created", {
        description: data.message || "Rider assigned successfully."
      });
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["ready-orders"] });
      queryClient.invalidateQueries({ queryKey: ["available-riders"] });
    },
    onError: (err) => {
      toast.error("Assignment failed", {
        description: err.message || "Could not assign rider. Please try again."
      });
    }
  });
}
