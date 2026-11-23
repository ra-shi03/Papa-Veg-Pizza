import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { throwApiError } from "@/services/api/apiError";



// Helper to initialize attendance db in localStorage if empty




// 1. Fetch Attendance Hook
export function useAttendanceList(filters = {}) {
  return useQuery({
    queryKey: ["kitchenAttendance", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/attendance", {
          params: filters,
        });

        // Handle fallback stub detection
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
        throwApiError(err, "Could not load attendance");
        
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

// 2. Fetch Single Record Hook
export function useAttendanceDetails(id) {
  return useQuery({
    queryKey: ["attendanceDetails", id],
    queryFn: async () => {
      if (!id) return null;
      try {
        const response = await apiClient.get(`/store/attendance/${id}`);
        
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
        throwApiError(err, "Could not load the attendance record");
        
      }
    },
    enabled: !!id,
  });
}

// 3. Mark Attendance Hook
export function useMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await apiClient.post("/store/attendance", payload);

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }

        return response.data;
      } catch (err) {
        throwApiError(err, "Failed to mark attendance");
        // Simulation Fallback
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] });
      toast.success("Attendance marked successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to mark attendance");
    },
  });
}

// 4. Bulk Mark Attendance Hook
export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      try {
        const response = await apiClient.post("/store/attendance/bulk", payload);

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }

        return response.data;
      } catch (err) {
        throwApiError(err, "Failed to submit bulk attendance");
        // Simulation Fallback
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] });
      toast.success("Bulk attendance registered successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to submit bulk attendance");
    },
  });
}

// 5. Update Attendance Hook
export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      try {
        const response = await apiClient.put(`/store/attendance/${id}`, payload);

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }

        return response.data;
      } catch (err) {
        throwApiError(err, "Failed to update attendance record");
        // Simulation Fallback
        
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceDetails", variables.id] });
      toast.success("Attendance record updated successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to update attendance record");
    },
  });
}

// 6. Delete Attendance Hook
export function useDeleteAttendance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      try {
        const response = await apiClient.delete(`/store/attendance/${id}`);

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stub response detected");
        }

        return response.data;
      } catch (err) {
        throwApiError(err, "Failed to delete attendance record");
        
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] });
      toast.success("Attendance record deleted successfully!");
    },
    onError: (err) => {
      toast.error(err?.message || "Failed to delete attendance record");
    },
  });
}

// 7. The caller's own attendance today (kitchen staff): GET /store/attendance/today
export function useMyAttendanceToday(enabled = true) {
  return useQuery({
    queryKey: ["myAttendanceToday"],
    enabled,
    queryFn: async () => {
      const response = await apiClient.get("/store/attendance/today");
      return response.data?.data || null;
    },
    refetchInterval: 60000,
  });
}

// 8. Clock in / clock out for the caller (the store comes from the sign-in, never from the screen)
export function useClockInOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (action) => {
      try {
        const response = await apiClient.post(action === "out" ? "/store/attendance/clock-out" : "/store/attendance/clock-in");
        return response.data;
      } catch (err) {
        throw new Error(err?.response?.data?.message || err?.response?.data?.error || "Could not update your attendance");
      }
    },
    onSuccess: (data, action) => {
      queryClient.invalidateQueries({ queryKey: ["myAttendanceToday"] });
      queryClient.invalidateQueries({ queryKey: ["myAttendanceHistory"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] });
      toast.success(action === "out" ? "Clocked out. See you next shift!" : "Clocked in. Have a good shift!");
    },
    onError: (err) => {
      toast.error(err?.message || "Could not update your attendance");
    },
  });
}
