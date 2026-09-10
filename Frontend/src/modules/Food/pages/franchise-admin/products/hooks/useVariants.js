import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { productService, subscribeToProductChanges } from "../productService";

export function useVariants(productId) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!productId) return;
    const unsubscribe = subscribeToProductChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["variants", productId] });
    });
    return unsubscribe;
  }, [productId, queryClient]);

  return useQuery({
    queryKey: ["variants", productId],
    queryFn: () => productService.getProductVariants(productId),
    enabled: !!productId,
    staleTime: 5000
  });
}

export function zuseSaveVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => productService.saveVariant(data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["variants", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });
}

export function zuseDeleteVariant() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, productId }) => productService.deleteVariant(id),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["variants", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.productId] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });
}
