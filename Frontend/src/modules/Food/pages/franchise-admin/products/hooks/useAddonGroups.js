import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { addonService, subscribeToGroupChanges } from "../addonService";
import { toast } from "sonner";

export function useAddonGroups() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = subscribeToGroupChanges(() => {
      queryClient.invalidateQueries({ queryKey: ["addon-groups"] });
    });
    return () => unsubscribe();
  }, [queryClient]);

  return useQuery({
    queryKey: ["addon-groups"],
    queryFn: () => addonService.getAddonGroups(),
    placeholderData: (prev) => prev
  });
}

export function useCreateAddonGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => addonService.createAddonGroup(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addon-groups"] });
      toast.success("Group created successfully");
    },
    onError: (err) => {
      toast.error(err.message || "Failed to create group");
    }
  });
}
