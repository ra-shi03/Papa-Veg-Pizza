import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
// 1. Fetch Complaints List (Paginated & Filtered)
export function useComplaintsList(filters = {}) {
  return useQuery({
    queryKey: ["complaints", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/food/store/complaints", {
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

// 2. Fetch Single Complaint Details
export function useComplaintDetails(complaintId) {
  return useQuery({
    queryKey: ["complaintDetails", complaintId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/food/store/complaints/${complaintId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API response format");
      } catch (err) {
        throw err; // the real answer from the server is shown; there is no sample data
      }
    },
    enabled: !!complaintId
  });
}

// 3. Resolve Complaint Mutation
export function useResolveComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ complaintId, data }) => {
      try {
        const response = await apiClient.put(`/food/store/complaints/${complaintId}/resolve`, data);
        return response.data?.data || response.data;
      } catch (err) {
        throw err; // the real answer from the server is shown; there is no sample data
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaintDetails", variables.complaintId] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      toast.success("Complaint resolved successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to resolve complaint");
    }
  });
}
