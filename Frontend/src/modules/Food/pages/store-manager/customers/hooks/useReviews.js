import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
// 1. Fetch Reviews List
export function useReviewsList(filters = {}) {
  return useQuery({
    queryKey: ["reviews", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/food/store/reviews", {
          params: filters,
        });
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        throw err; // the real answer from the server is shown; there is no sample data
      }
    }
  });
}

// 2. Fetch Single Review Details
export function useReviewDetails(reviewId) {
  return useQuery({
    queryKey: ["reviewDetails", reviewId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/food/store/reviews/${reviewId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        throw err; // the real answer from the server is shown; there is no sample data
      }
    },
    enabled: !!reviewId
  });
}

// 3. Reply to Review Mutation
export function useReplyToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, text, repliedBy }) => {
      try {
        const response = await apiClient.post(`/food/store/reviews/${reviewId}/reply`, { text, repliedBy });
        return response.data?.data || response.data;
      } catch (err) {
        throw err; // the real answer from the server is shown; there is no sample data
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviewDetails", variables.reviewId] });
      toast.success("Manager reply published successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to publish reply");
    }
  });
}
