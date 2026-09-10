import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { adminAPI } from "@food/api";
import { subscribeToPricingChanges } from "../services/storePricingService";

export function useStorePricing(filters = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToPricingChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["store-pricing"] });
    });
    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: ["store-pricing", filters],
    queryFn: () => adminAPI.getStorePricing(filters).then((res) => res.data.data),
    keepPreviousData: true,
    staleTime: 5000
  });
}

export function useStorePricingDetails(id) {
  return useQuery({
    queryKey: ["store-pricing-detail", id],
    queryFn: () => adminAPI.getStorePricingById(id).then((res) => res.data.data),
    enabled: !!id
  });
}

export function useUpdateStorePricing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => adminAPI.updateStorePricing(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["store-pricing"] });
      queryClient.invalidateQueries({ queryKey: ["store-pricing-detail", variables.id] });
      queryClient.invalidateQueries({ queryKey: ["price-history"] });
    }
  });
}
