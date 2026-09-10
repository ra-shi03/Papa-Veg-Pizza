import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { addonService, subscribeToAddonChanges } from "../addonService";
import { toast } from "sonner";

export function useAddons(params = {}) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToAddonChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["addons", params],
    queryFn: () => addonService.getAddons(params),
    placeholderData: (prev) => prev
  });
}

export function useAddonDetails(id) {
  return useQuery({
    queryKey: ["addon", id],
    queryFn: () => addonService.getAddonDetails(id),
    enabled: !!id
  });
}

export function useCreateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => addonService.createAddon(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
      toast.success("Add-on created successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create add-on");
    }
  });
}

export function useUpdateAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }) => addonService.updateAddon(id, data),
    onSuccess: (res, variables) => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
      queryClient.invalidateQueries({ queryKey: ["addon", variables.id] });
      toast.success("Add-on updated successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update add-on");
    }
  });
}

export function useDeleteAddon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => addonService.deleteAddon(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
      toast.success("Add-on deleted successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to delete add-on");
    }
  });
}

export function useBulkAddonAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, action, payload }) => addonService.bulkAddonActions(ids, action, payload),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
      toast.success(res.message || "Bulk action processed successfully!");
    },
    onError: (err) => {
      toast.error(err.message || "Bulk action failed");
    }
  });
}
