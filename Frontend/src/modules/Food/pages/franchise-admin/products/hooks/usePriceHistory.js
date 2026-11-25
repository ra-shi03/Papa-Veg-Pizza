import { useQuery } from "@tanstack/react-query";
import { adminAPI } from "@food/api";

export function usePriceHistory(productId, filters = {}) {
  return useQuery({
    queryKey: ["price-history", productId, filters],
    queryFn: () => adminAPI.getPriceHistory(productId, filters).then((res) => res.data.data),
    enabled: !!productId,
    keepPreviousData: true,
    staleTime: 5000
  });
}
