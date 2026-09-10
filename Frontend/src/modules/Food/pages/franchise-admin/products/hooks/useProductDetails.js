import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { productService, subscribeToProductChanges } from "../productService";

export function useProductDetails(id) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToProductChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    });
    return unsubscribe;
  }, [id, queryClient]);

  return useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id),
    enabled: !!id,
    staleTime: 5000
  });
}
