import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { productService, subscribeToProductChanges } from "../productService";

export function useProducts(filters = {}) {
  const queryClient = useQueryClient();

  // Listen for database changes to invalidate cache automatically
  useEffect(() => {
    const unsubscribe = subscribeToProductChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    });
    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => productService.getProducts(filters),
    keepPreviousData: true,
    staleTime: 5000
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => productService.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => productService.updateProduct(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", variables.id] });
    }
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => productService.deleteProduct(id),
    onSuccess: (data, id) => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["product", id] });
    }
  });
}

export function useBulkAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ids, action, payload }) => productService.bulkAction(ids, action, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    }
  });
}
