import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { categoryService, subscribeToCategoryChanges } from "../categoryService";

export function useCategoryDetails(id) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!id) return;
    const unsubscribe = subscribeToCategoryChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["category", id] });
    });
    return () => unsubscribe();
  }, [id, queryClient]);

  return useQuery({
    queryKey: ["category", id],
    queryFn: () => categoryService.getCategoryDetails(id),
    enabled: !!id
  });
}
