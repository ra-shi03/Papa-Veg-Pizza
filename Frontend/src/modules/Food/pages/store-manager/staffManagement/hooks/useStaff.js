import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { throwApiError } from "@/services/api/apiError";



// 1. Fetch Staff List Hook
export function useStaffList(filters = {}) {
  return useQuery({
    queryKey: ["kitchenStaff", filters],
    queryFn: async () => {
      const response = await apiClient.get("/food/store/staff", { params: filters });
      if (response.data?.success && Array.isArray(response.data.data)) {
        return response.data.data;
      }
      return [];
    },
    placeholderData: (previousData) => previousData,
  });
}

// 2. Fetch Single Staff Details Hook
export function useStaffDetails(id) {
  return useQuery({
    queryKey: ["staffDetails", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const response = await apiClient.get(`/food/store/staff/${id}`);
        if (response.data?.success && response.data.data) {
          return response.data.data;
        } else if (response.data) {
          return response.data;
        }
        throw new Error("API return format mismatch");
      } catch (err) {
        throwApiError(err, "Could not load the staff member");
        
      }
    },
    enabled: !!id,
  });
}

// 3. Create Staff Mutation Hook
export function useCreateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await apiClient.post("/food/store/staff", payload);
        return response.data;
      } catch (err) {
        // If server returned a real error (4xx/5xx), rethrow so onError handles it
        if (err?.response?.status >= 400) {
          throw new Error(
            err?.response?.data?.message || "Failed to register staff member."
          );
        }

        throwApiError(err, "Failed to register staff member.");
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      toast.success("Staff added and sent to the franchise admin for approval.");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to register staff member.");
    },
  });
}

// 4. Update Staff Mutation Hook
export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      try {
        const response = await apiClient.patch(`/food/store/staff/${id}`, payload);
        return response.data;
      } catch (err) {
        throw new Error(err?.response?.data?.message || "Failed to update staff profile.");
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      queryClient.invalidateQueries({ queryKey: ["staffDetails", variables.id] });
      toast.success("Staff profile updated successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to update staff profile");
    },
  });
}

// 5. Update Staff Status Mutation Hook
export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      try {
        const response = await apiClient.patch(`/food/store/staff/${id}/status`, { status });
        return response.data;
      } catch (err) {
        throw new Error(err?.response?.data?.message || "Failed to update staff status.");
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      queryClient.invalidateQueries({ queryKey: ["staffDetails", variables.id] });
      toast.success(`Staff status updated to "${variables.status}"`);
    },
    onError: () => {
      toast.error("Failed to update staff status");
    },
  });
}

// 6. Assign Shift Mutation Hook
export function useAssignShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      try {
        const response = await apiClient.patch(`/food/store/staff/${id}/shift`, payload);
        return response.data;
      } catch (err) {
        throw new Error(err?.response?.data?.message || "Failed to assign shift.");
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      queryClient.invalidateQueries({ queryKey: ["staffDetails", variables.id] });
      toast.success("Shift assigned successfully!");
    },
    onError: () => {
      toast.error("Failed to assign shift");
    },
  });
}

// 8. Delete Staff Mutation Hook
export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      try {
        const response = await apiClient.delete(`/food/store/staff/${id}`);
        return response.data;
      } catch (err) {
        throwApiError(err, "Failed to delete staff member");
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      toast.success("Staff member deleted successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to delete staff member");
    },
  });
}
