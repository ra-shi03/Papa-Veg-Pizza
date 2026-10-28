import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { adminAPI } from "@food/api";
import { subscribeToPricingChanges } from "../services/storePricingService";
import { adminClient } from "@/services/api/axios";
import { failOrMock } from "@/services/api/mockPolicy";
import { categoryService } from "../categoryService";
import { productService } from "../productService";

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

// The real catalogue for the pricing pickers (GET /food/admin/category-products and /food/admin/products), not the local
// sample catalogue. The sample one is used only when VITE_STANDALONE_MOCK=true.
export function usePricingCategories() {
  return useQuery({
    queryKey: ["pricing-catalogue-categories"],
    queryFn: async () => {
      try {
        const res = await adminClient.get("/food/admin/category-products");
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        return { categories: rows.map((c) => ({ ...c, _id: String(c._id), name: c.label || c.name || "Category" })) };
      } catch (err) {
        failOrMock(err, "Could not load categories");
        return categoryService.getCategories({ limit: 1000 });
      }
    },
    staleTime: 60000,
  });
}

export function usePricingProducts() {
  return useQuery({
    queryKey: ["pricing-catalogue-products"],
    queryFn: async () => {
      try {
        const res = await adminClient.get("/food/admin/products");
        const rows = Array.isArray(res.data?.data) ? res.data.data : [];
        const lowest = (p) => {
          const prices = (p.sizes || []).map((x) => Number(x.price)).filter((n) => n > 0);
          return Number(p.price) > 0 ? Number(p.price) : prices.length ? Math.min(...prices) : 0;
        };
        return {
          products: rows.map((p) => ({
            ...p, _id: String(p._id), categoryId: String(p.categoryId?._id || p.categoryId || ""),
            categoryName: p.categoryId?.label || p.categoryId?.name || "", image: p.image || "", basePrice: lowest(p),
          })),
        };
      } catch (err) {
        failOrMock(err, "Could not load products");
        return productService.getProducts({ limit: 1000 });
      }
    },
    staleTime: 60000,
  });
}

