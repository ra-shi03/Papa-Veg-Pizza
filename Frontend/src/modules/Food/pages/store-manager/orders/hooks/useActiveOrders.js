import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { storeOrdersApi, apiErrorMessage, LIVE_POLL_MS, useLiveIndicator } from "../../api/storeOrdersApi";

// Orders in the kitchen. Managers see all, supervisors their own, kitchen staff what is assigned to them.
export function useActiveOrders(filters = {}) {
  const query = useQuery({
    queryKey: ["activeOrders", filters],
    queryFn: () => storeOrdersApi.list("active", filters),
    refetchInterval: LIVE_POLL_MS,
    staleTime: 3000,
  });
  return { ...query, data: query.data || [], socketConnected: useLiveIndicator(query) };
}

export function useActiveKitchenStaff(roleFilter = "") {
  return useQuery({
    queryKey: ["activeKitchenStaff", roleFilter],
    queryFn: () => storeOrdersApi.team(roleFilter),
  });
}

const refreshKitchen = (queryClient) => {
  queryClient.invalidateQueries({ queryKey: ["activeOrders"] });
  queryClient.invalidateQueries({ queryKey: ["activeKitchenStaff"] });
  queryClient.invalidateQueries({ queryKey: ["readyOrders"] });
};

// Move an order through preparing -> baking -> packaging -> ready.
export function useUpdateKitchenStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, status }) =>
      storeOrdersApi.stage(orderId, status === "ready" ? "ready" : status),
    onSuccess: (data, variables) => {
      refreshKitchen(queryClient);
      toast.success(`Stage updated to ${variables.status}`);
    },
    onError: (err) => toast.error("Failed to update stage: " + apiErrorMessage(err)),
  });
}

// Supervisor (or manager) assigns kitchen staff to a station.
export function useAssignStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, role, staffId }) => storeOrdersApi.assignStaff(orderId, { staffId, role }),
    onSuccess: () => {
      refreshKitchen(queryClient);
      toast.success("Kitchen staff assigned successfully");
    },
    onError: (err) => toast.error("Failed to assign staff: " + apiErrorMessage(err)),
  });
}

export function useChangePriority() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, priority }) => storeOrdersApi.priority(orderId, priority),
    onSuccess: (data, variables) => {
      refreshKitchen(queryClient);
      toast.success(`Priority updated to ${variables.priority.toUpperCase()}`);
    },
    onError: (err) => toast.error("Failed to update priority: " + apiErrorMessage(err)),
  });
}

export function usePauseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, isPaused, reason }) => storeOrdersApi.pause(orderId, { isPaused, reason }),
    onSuccess: (data, variables) => {
      refreshKitchen(queryClient);
      toast.success(variables.isPaused ? "Order paused" : "Order resumed");
    },
    onError: (err) => toast.error("Failed to pause order: " + apiErrorMessage(err)),
  });
}

// Marks the order packed and ready; it then shows under Ready Orders and goes to dispatch.
export function useMarkReady() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId }) => storeOrdersApi.stage(orderId, "ready"),
    onSuccess: () => {
      refreshKitchen(queryClient);
      toast.success("Order marked as ready and sent to dispatch!");
    },
    onError: (err) => toast.error("Failed to mark order ready: " + apiErrorMessage(err)),
  });
}

export function useLogDelay() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, minutes, reason }) => storeOrdersApi.delay(orderId, { minutes, reason }),
    onSuccess: (data, variables) => {
      refreshKitchen(queryClient);
      toast.success(`Expected ready time delayed by ${variables.minutes} mins`);
    },
    onError: (err) => toast.error("Failed to delay order: " + apiErrorMessage(err)),
  });
}
