import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { addonService } from "../addonService";
import { toast } from "sonner";

export function useAssignedProducts(addonId) {
  return useQuery({
    queryKey: ["addon-products", addonId],
    queryFn: () => addonService.getAssignedProducts(addonId),
    enabled: !!addonId
  });
}

export function useAssignProductsToAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ addonId, productIds }) => addonService.assignProductsToAddon(addonId, productIds),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addon-products", variables.addonId] });
      queryClient.invalidateQueries({ queryKey: ["addon", variables.addonId] });
      queryClient.invalidateQueries({ queryKey: ["addons"] });
      toast.success("Products assigned successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to assign products");
    }
  });
}
