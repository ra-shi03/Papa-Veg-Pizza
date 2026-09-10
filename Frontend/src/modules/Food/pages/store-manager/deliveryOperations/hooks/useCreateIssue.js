import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

export default function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newIssue) => {
      const response = await apiClient.post("/store/delivery/issues", newIssue);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["delivery-issues"] });
      // Invalidate live-deliveries in case stats/status needs updates
      queryClient.invalidateQueries({ queryKey: ["live-deliveries"] });
    }
  });
}
