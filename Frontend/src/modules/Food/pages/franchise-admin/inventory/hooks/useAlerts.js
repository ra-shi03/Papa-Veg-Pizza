import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { alertService, subscribeToAlertChanges } from "../services/alertService";
import { toast } from "sonner";

export function useAlertsQuery(params = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToAlertChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-detail"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["low-stock-alerts", params],
    queryFn: () => alertService.getAlerts(params),
    placeholderData: (prev) => prev
  });
}

export function useAlertDetailQuery(id) {
  return useQuery({
    queryKey: ["alert-detail", id],
    queryFn: () => alertService.getAlertById(id),
    enabled: !!id
  });
}

export function useUsersListQuery() {
  return useQuery({
    queryKey: ["users-list"],
    queryFn: () => alertService.getUsers()
  });
}

export function useUpdateAlertMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }) => alertService.updateAlert(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-detail"] });
      toast.success("Alert details updated successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update alert details");
    }
  });
}

export function useResolveAlertMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => alertService.resolveAlert(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-detail"] });
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] }); // refresh stock levels since stock is updated
      toast.success("Low stock alert resolved successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to resolve alert");
    }
  });
}

export function useCreatePurchaseRequestMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => alertService.createPurchaseRequest(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["low-stock-alerts"] });
      queryClient.invalidateQueries({ queryKey: ["alert-detail"] });
      toast.success("Purchase request created successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create purchase request");
    }
  });
}

export function useAlertConsumptionTrend(ingredientId, storeId) {
  return useQuery({
    queryKey: ["alert-consumption-trend", ingredientId, storeId],
    queryFn: () => alertService.getConsumptionTrend(ingredientId, storeId),
    enabled: !!ingredientId && !!storeId
  });
}
