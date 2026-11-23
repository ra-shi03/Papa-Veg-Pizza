import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { throwApiError } from "@/services/api/apiError";



// Initialize shifts DB in localStorage if empty




// 1. Fetch Shifts List
export function useShiftList(filters = {}) {
  return useQuery({
    queryKey: ["kitchenShifts", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/shifts", {
          params: filters,
        });

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }

        if (response.data?.success && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error("API return format mismatch");
      } catch (err) {
        throwApiError(err, "Could not load shifts");
        
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

// 2. Fetch Single Shift Details
export function useShiftDetails(id) {
  return useQuery({
    queryKey: ["shiftDetails", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const response = await apiClient.get(`/store/shifts/${id}`);

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }

        if (response.data?.success && response.data.data) {
          return response.data.data;
        } else if (response.data) {
          return response.data;
        }
        throw new Error("API return format mismatch");
      } catch (err) {
        throwApiError(err, "Could not load the shift");
        
      }
    },
    enabled: !!id,
  });
}

// 3. Create Shift
export function useCreateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await apiClient.post("/store/shifts", payload);
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }
        return response.data;
      } catch (err) {
        throwApiError(err, "Failed to create shift");
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenShifts"] });
      toast.success("Shift created successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to create shift");
    },
  });
}

// 4. Update Shift
export function useUpdateShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      try {
        const response = await apiClient.put(`/store/shifts/${id}`, payload);
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }
        return response.data;
      } catch (err) {
        throwApiError(err, "Failed to update shift");
        
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenShifts"] });
      queryClient.invalidateQueries({ queryKey: ["shiftDetails", variables.id] });
      toast.success("Shift updated successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to update shift");
    },
  });
}

// 5. Delete Shift
export function useDeleteShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      try {
        const response = await apiClient.delete(`/store/shifts/${id}`);
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }
        return response.data;
      } catch (err) {
        throwApiError(err, "Failed to delete shift");
        // Localstorage updates
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenShifts"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] }); // Refresh staff lists too
      toast.success("Shift deleted successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to delete shift");
    },
  });
}

// 6. Assign Staff to Shift
export function useAssignStaffToShift() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ shiftId, payload }) => {
      try {
        const response = await apiClient.post(`/store/shifts/${shiftId}/assign`, payload);
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }
        return response.data;
      } catch (err) {
        throwApiError(err, "Failed to assign staff to shift");
        // Fallback implementation
        
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenShifts"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      queryClient.invalidateQueries({ queryKey: ["shiftDetails", variables.shiftId] });
      toast.success("Shift assignments updated successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to assign staff to shift");
    },
  });
}
