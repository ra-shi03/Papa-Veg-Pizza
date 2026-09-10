import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { initialMockShifts } from "../mockData";

const SHIFTS_STORAGE_KEY = "pvp_kitchen_shifts";
const STAFF_STORAGE_KEY = "pvp_kitchen_staff";

// Initialize shifts DB in localStorage if empty
const initializeShiftsDb = () => {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem(SHIFTS_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(initialMockShifts));
    }
  }
};

initializeShiftsDb();

const getLocalShifts = () => {
  try {
    return JSON.parse(localStorage.getItem(SHIFTS_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalShifts = (records) => {
  localStorage.setItem(SHIFTS_STORAGE_KEY, JSON.stringify(records));
};

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
        console.warn("Backend shifts API offline, pulling from local storage mock data");
        let list = getLocalShifts();

        if (filters.status && filters.status !== "All") {
          list = list.filter((s) => s.status === filters.status);
        }

        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter((s) => s.shiftName.toLowerCase().includes(q));
        }

        return list;
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
        const list = getLocalShifts();
        const found = list.find((s) => s._id === id);
        if (found) return found;
        throw new Error("Shift not found");
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
        const list = getLocalShifts();
        const newRecord = {
          _id: payload.shiftName.replace(/ /g, "_") + "-" + Date.now(),
          storeId: "store-indore-01",
          shiftName: payload.shiftName,
          startTime: payload.startTime,
          endTime: payload.endTime,
          breakMinutes: Number(payload.breakMinutes) || 0,
          maxStaff: Number(payload.maxStaff) || 5,
          assignedStaff: [],
          status: "active",
          description: payload.description || "",
          createdBy: "Shubham Jamliya",
          createdAt: new Date().toISOString(),
        };

        const updated = [...list, newRecord];
        setLocalShifts(updated);
        return { success: true, data: newRecord };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenShifts"] });
      toast.success("Shift created successfully!");
    },
    onError: () => {
      toast.error("Failed to create shift");
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
        const list = getLocalShifts();
        const updated = list.map((s) => {
          if (s._id === id) {
            return {
              ...s,
              shiftName: payload.shiftName ?? s.shiftName,
              startTime: payload.startTime ?? s.startTime,
              endTime: payload.endTime ?? s.endTime,
              breakMinutes: payload.breakMinutes !== undefined ? Number(payload.breakMinutes) : s.breakMinutes,
              maxStaff: payload.maxStaff !== undefined ? Number(payload.maxStaff) : s.maxStaff,
              status: payload.status ?? s.status,
              description: payload.description ?? s.description,
            };
          }
          return s;
        });
        setLocalShifts(updated);
        return { success: true, id };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenShifts"] });
      queryClient.invalidateQueries({ queryKey: ["shiftDetails", variables.id] });
      toast.success("Shift updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update shift");
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
        // Localstorage updates
        const list = getLocalShifts();
        const filtered = list.filter((s) => s._id !== id);
        setLocalShifts(filtered);

        // Also clean up staff shift assignments
        const staffStorage = localStorage.getItem(STAFF_STORAGE_KEY);
        if (staffStorage) {
          try {
            const staffList = JSON.parse(staffStorage) || [];
            const clearedStaff = staffList.map((s) => {
              if (s.shiftId === id) {
                return { ...s, shiftId: "" };
              }
              return s;
            });
            localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(clearedStaff));
          } catch (e) {}
        }

        return { success: true, id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenShifts"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] }); // Refresh staff lists too
      toast.success("Shift deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete shift");
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
        // Fallback implementation
        const list = getLocalShifts();
        const updatedShifts = list.map((s) => {
          if (s._id === shiftId) {
            return {
              ...s,
              assignedStaff: payload.staffIds, // Overwrite with new assignment list
            };
          }
          // Remove these staff members from any other shifts they might have been assigned to
          const filteredAssigned = s.assignedStaff.filter((id) => !payload.staffIds.includes(id));
          return {
            ...s,
            assignedStaff: filteredAssigned,
          };
        });
        setLocalShifts(updatedShifts);

        // Update staff records in localStorage
        const staffStorage = localStorage.getItem(STAFF_STORAGE_KEY);
        if (staffStorage) {
          try {
            const staffList = JSON.parse(staffStorage) || [];
            const updatedStaff = staffList.map((s) => {
              // If employee is in the new staffIds, assign to this shift
              if (payload.staffIds.includes(s._id)) {
                return { ...s, shiftId };
              }
              // If employee was on this shift, but got deselected, remove their shiftId
              if (s.shiftId === shiftId && !payload.staffIds.includes(s._id)) {
                return { ...s, shiftId: "" };
              }
              return s;
            });
            localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(updatedStaff));
          } catch (e) {}
        }

        return { success: true, shiftId };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenShifts"] });
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      queryClient.invalidateQueries({ queryKey: ["shiftDetails", variables.shiftId] });
      toast.success("Shift assignments updated successfully!");
    },
    onError: () => {
      toast.error("Failed to assign staff to shift");
    },
  });
}
