import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminAPI } from "@food/api";

export function useBulkPriceUpdate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminAPI.bulkPriceUpdate(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-pricing"] });
    }
  });
}

export function useCopyPricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => adminAPI.copyPricing(data).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-pricing"] });
    }
  });
}

export function useApplyBulkPricingAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pricingIds, action, payload }) =>
      adminAPI.applyBulkPricingAction(pricingIds, action, payload).then((res) => res.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["store-pricing"] });
    }
  });
}
