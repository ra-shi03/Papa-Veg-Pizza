import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { stockService, subscribeToStockChanges } from "../services/stockService";
import { toast } from "sonner";

export function useStores() {
  return useQuery({
    queryKey: ["stores-list"],
    queryFn: () => stockService.getStores()
  });
}

export function useStockLevels(params = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToStockChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      queryClient.invalidateQueries({ queryKey: ["stock-history"] });
      queryClient.invalidateQueries({ queryKey: ["consumption-trend"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["stock-levels", params],
    queryFn: () => stockService.getStocks(params),
    placeholderData: (prev) => prev
  });
}

export function useAdjustStock() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload) => stockService.adjustStock(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["stock-levels"] });
      queryClient.invalidateQueries({ queryKey: ["stock-history"] });
      queryClient.invalidateQueries({ queryKey: ["consumption-trend"] });
      toast.success("Stock level adjusted successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to adjust stock level");
    }
  });
}

export function useStockHistory(params = {}) {
  return useQuery({
    queryKey: ["stock-history", params],
    queryFn: () => stockService.getHistory(params)
  });
}

export function useConsumptionTrend(ingredientId, storeId) {
  return useQuery({
    queryKey: ["consumption-trend", ingredientId, storeId],
    queryFn: () => stockService.getConsumptionTrend(ingredientId, storeId),
    enabled: !!ingredientId && !!storeId
  });
}
