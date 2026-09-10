import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { adminAPI } from "@food/api";
import { subscribeToPricingChanges } from "../services/storePricingService";

export function usePriceHistory(productId, filters = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToPricingChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["price-history", productId] });
    });
    return unsubscribe;
  }, [queryClient, productId]);

  return useQuery({
    queryKey: ["price-history", productId, filters],
    queryFn: () => adminAPI.getPriceHistory(productId, filters).then((res) => res.data.data),
    enabled: !!productId,
    keepPreviousData: true,
    staleTime: 5000
  });
}
