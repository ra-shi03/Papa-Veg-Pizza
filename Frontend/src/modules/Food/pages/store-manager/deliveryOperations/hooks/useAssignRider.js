import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
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
        // Fallback LocalStorage updates
        const orders = getLocalReadyOrders();
        const updatedOrders = orders.map((o) => {
          if (o._id === orderId) {
            return {
              ...o,
              assignedRiderId: riderId,
              deliveryPartnerId: riderId,
              deliveryStatus: "assigned",
              status: "assigned"
            };
          }
          return o;
        });
        setLocalReadyOrders(updatedOrders);

        const riders = getLocalRiders();
        const updatedRiders = riders.map((r) => {
          if (r._id === riderId) {
            return {
              ...r,
              activeOrders: r.activeOrders + 1,
              availability: "busy"
            };
          }
          return r;
        });
        setLocalRiders(updatedRiders);

        return { success: true, message: "Rider assigned successfully (Simulated)" };
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
