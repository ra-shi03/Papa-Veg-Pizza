import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

export default function useResolveIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ issueId, data }) => {
      const response = await apiClient.patch(`/store/delivery/issues/${issueId}`, data);
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["delivery-issues"] });
      queryClient.invalidateQueries({ queryKey: ["issue-details", variables.issueId] });
      // Invalidate tracking and live-deliveries since rider reassignments or status changes occur
      queryClient.invalidateQueries({ queryKey: ["live-deliveries"] });
      queryClient.invalidateQueries({ queryKey: ["tracking"] });
    }
  });
}
