import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { categoryService, subscribeToCategoryChanges } from "../categoryService";
import { toast } from "sonner";

export function useCategories(params = {}) {
  const queryClient = useQueryClient();

  // Invalidate when category pub-sub fires
  useEffect(() => {
    const unsubscribe = subscribeToCategoryChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["categories", params],
    queryFn: () => categoryService.getCategories(params),
    placeholderData: (prev) => prev
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => categoryService.createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category created successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create category");
    }
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => categoryService.updateCategory(id, data),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      queryClient.invalidateQueries({ queryKey: ["category", res.data._id] });
      toast.success("Category updated successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update category");
    }
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success("Category deleted successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete category");
    }
  });
}

export function useBulkCategoryAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, action, payload }) => categoryService.bulkCategoryActions(ids, action, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      toast.success(res.message || "Bulk action executed successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Bulk action failed");
    }
  });
}
