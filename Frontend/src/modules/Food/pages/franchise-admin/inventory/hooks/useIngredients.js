import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ingredientService, subscribeToIngredientChanges } from "../services/ingredientService";
import { toast } from "sonner";

export function useIngredients(params = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToIngredientChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["ingredients", params],
    queryFn: () => ingredientService.getIngredients(params),
    placeholderData: (prev) => prev
  });
}

export function useIngredientDetails(id) {
  return useQuery({
    queryKey: ["ingredient", id],
    queryFn: () => ingredientService.getIngredientDetails(id),
    enabled: !!id
  });
}

export function useCreateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => ingredientService.createIngredient(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      toast.success("Ingredient created successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create ingredient");
    }
  });
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => ingredientService.updateIngredient(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient", variables.id] });
      toast.success("Ingredient updated successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update ingredient");
    }
  });
}

export function useUpdateIngredientStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }) => ingredientService.updateIngredientStatus(id, status),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["ingredients"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient", variables.id] });
      const actionText = variables.status === "ACTIVE" ? "enabled" : "disabled";
      toast.success(`Ingredient successfully ${actionText}!`);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update status");
    }
  });
}

export function useSuppliers() {
  return useQuery({
    queryKey: ["suppliers"],
    queryFn: () => ingredientService.getSuppliers()
  });
}

export function useIngredientStocks(id) {
  return useQuery({
    queryKey: ["ingredient-stocks", id],
    queryFn: () => ingredientService.getStoreStocks(id),
    enabled: !!id
  });
}

export function usePurchaseOrders(id) {
  return useQuery({
    queryKey: ["purchase-orders", id],
    queryFn: () => ingredientService.getPurchaseOrders(id),
    enabled: !!id
  });
}

export function useConsumptionHistory(id) {
  return useQuery({
    queryKey: ["ingredient-consumption", id],
    queryFn: () => ingredientService.getConsumptionHistory(id),
    enabled: !!id
  });
}

export function useExpiryBatches(id) {
  return useQuery({
    queryKey: ["ingredient-batches", id],
    queryFn: () => ingredientService.getExpiryBatches(id),
    enabled: !!id
  });
}

export function useStockTransactions(id, filters = {}) {
  return useQuery({
    queryKey: ["stock-transactions", id, filters],
    queryFn: () => ingredientService.getStockTransactions(id, filters),
    enabled: !!id
  });
}
