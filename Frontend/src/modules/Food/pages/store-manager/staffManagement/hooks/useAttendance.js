import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { initialMockAttendance } from "../mockData";

const ATTENDANCE_STORAGE_KEY = "pvp_kitchen_attendance";

// Helper to initialize attendance db in localStorage if empty
const initializeAttendanceDb = () => {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem(ATTENDANCE_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(initialMockAttendance));
    }
  }
};

initializeAttendanceDb();

const getLocalAttendance = () => {
  try {
    return JSON.parse(localStorage.getItem(ATTENDANCE_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalAttendance = (records) => {
  localStorage.setItem(ATTENDANCE_STORAGE_KEY, JSON.stringify(records));
};

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
        console.warn("Backend attendance API offline, pulling from local storage mock data");
        let list = getLocalAttendance();

        // 1. Filter by Date (exact match: YYYY-MM-DD)
        if (filters.date) {
          list = list.filter((a) => a.date === filters.date);
        }

        // 2. Filter by Shift
        if (filters.shiftId && filters.shiftId !== "All") {
          list = list.filter((a) => a.shiftId === filters.shiftId);
        }

        // 3. Filter by Status
        if (filters.status && filters.status !== "All") {
          list = list.filter((a) => a.status === filters.status);
        }

        // 4. Filter by Search and Role require joining staff information
        if (filters.search || (filters.role && filters.role !== "All")) {
          // Pull staff records to map roles and names
          const staffStorage = localStorage.getItem("pvp_kitchen_staff");
          let staffList = [];
          try {
            staffList = JSON.parse(staffStorage) || [];
          } catch (e) {}

          list = list.filter((a) => {
            const staffObj = staffList.find((s) => s._id === a.staffId);
            if (!staffObj) return false;

            // Filter by role
            if (filters.role && filters.role !== "All") {
              if (staffObj.role !== filters.role) return false;
            }

            // Filter by search query
            if (filters.search) {
              const q = filters.search.toLowerCase();
              const nameMatch = staffObj.fullName && staffObj.fullName.toLowerCase().includes(q);
              const codeMatch = staffObj.employeeCode && staffObj.employeeCode.toLowerCase().includes(q);
              return nameMatch || codeMatch;
            }

            return true;
          });
        }

        return list;
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
        const list = getLocalAttendance();
        const found = list.find((a) => a._id === id);
        if (found) return found;
        throw new Error("Attendance record not found");
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
        // Simulation Fallback
        const list = getLocalAttendance();
        const newRecord = {
          _id: `att-${Date.now()}`,
          storeId: "store-indore-01",
          staffId: payload.staffId,
          shiftId: payload.shiftId,
          date: payload.date,
          checkIn: payload.checkIn || "",
          checkOut: payload.checkOut || "",
          totalHours: Number(payload.totalHours) || 0,
          overtimeHours: Number(payload.overtimeHours) || 0,
          status: payload.status,
          markedBy: payload.markedBy || "Store Manager",
          notes: payload.notes || "",
          createdAt: new Date().toISOString()
        };

        const updated = [newRecord, ...list];
        setLocalAttendance(updated);
        return { success: true, data: newRecord };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] });
      toast.success("Attendance marked successfully!");
    },
    onError: () => {
      toast.error("Failed to mark attendance");
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
        // Simulation Fallback
        const list = getLocalAttendance();
        
        // Remove existing records for the same date/shift to prevent duplicates
        let updated = list.filter(
          (a) => !(a.date === payload.date && a.shiftId === payload.shiftId)
        );

        // Add bulk records
        const newRecords = payload.attendances.map((item) => {
          // Auto calculate hours if present
          let checkIn = "";
          let checkOut = "";
          let totalHours = 0;
          let overtimeHours = 0;

          if (item.status === "present") {
            // Default 8-hour shift hours
            checkIn = "09:00 AM";
            checkOut = "05:00 PM";
            totalHours = 8.0;
            overtimeHours = 0;
          } else if (item.status === "half_day") {
            checkIn = "09:00 AM";
            checkOut = "01:00 PM";
            totalHours = 4.0;
            overtimeHours = 0;
          }

          return {
            _id: `att-bulk-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            storeId: "store-indore-01",
            staffId: item.staffId,
            shiftId: payload.shiftId,
            date: payload.date,
            checkIn,
            checkOut,
            totalHours,
            overtimeHours,
            status: item.status,
            markedBy: payload.markedBy || "Store Manager",
            notes: "",
            createdAt: new Date().toISOString()
          };
        });

        updated = [...newRecords, ...updated];
        setLocalAttendance(updated);
        return { success: true, data: newRecords };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] });
      toast.success("Bulk attendance registered successfully!");
    },
    onError: () => {
      toast.error("Failed to submit bulk attendance");
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
        // Simulation Fallback
        const list = getLocalAttendance();
        const updated = list.map((a) => {
          if (a._id === id) {
            return {
              ...a,
              shiftId: payload.shiftId ?? a.shiftId,
              date: payload.date ?? a.date,
              checkIn: payload.checkIn ?? a.checkIn,
              checkOut: payload.checkOut ?? a.checkOut,
              totalHours: payload.totalHours !== undefined ? Number(payload.totalHours) : a.totalHours,
              overtimeHours: payload.overtimeHours !== undefined ? Number(payload.overtimeHours) : a.overtimeHours,
              status: payload.status ?? a.status,
              notes: payload.notes ?? a.notes,
              markedBy: payload.markedBy ?? a.markedBy
            };
          }
          return a;
        });
        setLocalAttendance(updated);
        return { success: true, id };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] });
      queryClient.invalidateQueries({ queryKey: ["attendanceDetails", variables.id] });
      toast.success("Attendance record updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update attendance record");
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
        const list = getLocalAttendance();
        const filtered = list.filter((a) => a._id !== id);
        setLocalAttendance(filtered);
        return { success: true, id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenAttendance"] });
      toast.success("Attendance record deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete attendance record");
    },
  });
}
