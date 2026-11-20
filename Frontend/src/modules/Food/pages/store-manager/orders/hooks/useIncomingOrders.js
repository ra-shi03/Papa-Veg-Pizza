import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeOrdersApi, apiErrorMessage, LIVE_POLL_MS, useLiveIndicator } from "../../api/storeOrdersApi";

// New orders waiting for the store manager. Polled, so a customer's order shows up within seconds.
export function useIncomingOrders(filters = {}) {
  const query = useQuery({
    queryKey: ["incomingOrders", filters],
    queryFn: () => storeOrdersApi.list("incoming", filters),
    refetchInterval: LIVE_POLL_MS,
    staleTime: 3000,
  });
  return { ...query, data: query.data || [], socketConnected: useLiveIndicator(query) };
}

// Accept an order into the kitchen; the store manager then assigns kitchen staff to its stations (Active Orders).
export function useAcceptOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }) => storeOrdersApi.accept(orderId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incomingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
      toast.success("Order accepted successfully", {
        description: `Order ${data?.orderNumber || ""} has been sent to the kitchen. Assign kitchen staff to its stations.`,
      });
    },
    onError: (err) => toast.error("Failed to accept order: " + apiErrorMessage(err)),
  });
}

export function useRejectOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, payload }) => storeOrdersApi.reject(orderId, payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["incomingOrders"] });
      queryClient.invalidateQueries({ queryKey: ["cancelledOrders"] });
      toast.success("Order cancelled successfully", {
        description: `Order ${data?.orderNumber || ""} status changed to Cancelled.`,
      });
    },
    onError: (err) => toast.error("Failed to cancel order: " + apiErrorMessage(err)),
  });
}
