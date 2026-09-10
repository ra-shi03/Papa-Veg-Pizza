import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { initialMockStaff } from "../mockData";

const STAFF_STORAGE_KEY = "pvp_kitchen_staff";

// Initialize mock database in localStorage with upgrade support
const initializeStaffDb = () => {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem(STAFF_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(initialMockStaff));
    } else {
      try {
        const parsed = JSON.parse(existing);
        let modified = false;
        const upgraded = parsed.map((s, idx) => {
          const fallback = initialMockStaff.find(item => item._id === s._id) || initialMockStaff[idx] || {};
          let itemModified = false;

          // Normalize and copy name
          const nameVal = s.fullName || s.name || fallback.fullName || fallback.name || "Staff Member";
          if (s.fullName !== nameVal) {
            s.fullName = nameVal;
            itemModified = true;
          }
          if (s.name !== nameVal) {
            s.name = nameVal;
            itemModified = true;
          }

          // Normalize role
          let roleVal = s.role || fallback.role || "Pizza Maker";
          if (roleVal.toLowerCase() === "kitchen_supervisor" || roleVal.toLowerCase() === "kitchen supervisor") {
            roleVal = "Kitchen Supervisor";
          } else if (roleVal.toLowerCase() === "chef" || roleVal.toLowerCase() === "pizza_maker" || roleVal.toLowerCase() === "pizza maker") {
            roleVal = "Pizza Maker";
          } else if (roleVal.toLowerCase() === "baker") {
            roleVal = "Baker";
          } else if (roleVal.toLowerCase() === "packager") {
            roleVal = "Packager";
          }
          if (s.role !== roleVal) {
            s.role = roleVal;
            itemModified = true;
          }

          // Normalize profileImage/avatar
          const avatarVal = s.profileImage || s.avatar || fallback.profileImage || fallback.avatar || "";
          if (s.profileImage !== avatarVal) {
            s.profileImage = avatarVal;
            itemModified = true;
          }
          if (s.avatar !== avatarVal) {
            s.avatar = avatarVal;
            itemModified = true;
          }

          // Normalize employeeId/employeeCode
          const codeVal = s.employeeCode || s.employeeId || fallback.employeeCode || fallback.employeeId || `PVP-ST-0${idx + 1}`;
          if (s.employeeCode !== codeVal) {
            s.employeeCode = codeVal;
            itemModified = true;
          }
          if (s.employeeId !== codeVal) {
            s.employeeId = codeVal;
            itemModified = true;
          }

          // Normalize status
          const statusVal = (s.status || fallback.status || "active").toLowerCase();
          if (s.status !== statusVal) {
            s.status = statusVal;
            itemModified = true;
          }

          // Today status
          const todayStatusVal = s.todayStatus || fallback.todayStatus || "present";
          if (s.todayStatus !== todayStatusVal) {
            s.todayStatus = todayStatusVal;
            itemModified = true;
          }

          // Shift
          const shiftVal = s.shiftId || s.shiftType || fallback.shiftId || "Morning";
          if (s.shiftId !== shiftVal) {
            s.shiftId = shiftVal;
            itemModified = true;
          }

          // Experience
          const expVal = s.experience !== undefined && s.experience !== "" ? Number(s.experience) : (fallback.experience !== undefined ? Number(fallback.experience) : 1);
          if (s.experience !== expVal) {
            s.experience = expVal;
            itemModified = true;
          }

          // Performance Score
          const perfVal = s.performanceScore !== undefined && Number(s.performanceScore) > 0 ? Number(s.performanceScore) : (fallback.performanceScore || 85);
          if (s.performanceScore !== perfVal) {
            s.performanceScore = perfVal;
            itemModified = true;
          }

          // Joining Date
          const jDate = s.joiningDate && s.joiningDate !== "Invalid Date" && s.joiningDate !== "" ? s.joiningDate : (fallback.joiningDate || `2024-0${Math.min(9, idx + 1)}-15`);
          if (s.joiningDate !== jDate) {
            s.joiningDate = jDate;
            itemModified = true;
          }

          // Copy other fallback fields if they are missing
          const otherFields = ["salaryType", "salary", "skills", "emergencyContact", "stats", "activities"];
          otherFields.forEach(field => {
            if (s[field] === undefined || s[field] === null || s[field] === "") {
              s[field] = fallback[field];
              itemModified = true;
            }
          });

          if (itemModified) {
            modified = true;
          }
          return s;
        });

        if (modified) {
          localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(upgraded));
        }
      } catch (e) {
        localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(initialMockStaff));
      }
    }
  }
};

initializeStaffDb();

const getLocalStaff = () => {
  try {
    return JSON.parse(localStorage.getItem(STAFF_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

const setLocalStaff = (staffList) => {
  localStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(staffList));
};

// 1. Fetch Staff List Hook
export function useStaffList(filters = {}) {
  return useQuery({
    queryKey: ["kitchenStaff", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/staff", {
          params: filters,
        });
        
        if (response.data?.success && Array.isArray(response.data.data)) {
          return response.data.data;
        } else if (Array.isArray(response.data)) {
          return response.data;
        }
        throw new Error("API return format mismatch");
      } catch (err) {
        console.warn("Backend staff API offline, pulling from local storage mock data");
        let list = getLocalStaff();

        // client side search and filters
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (s) =>
              (s.fullName && s.fullName.toLowerCase().includes(q)) ||
              (s.employeeCode && s.employeeCode.toLowerCase().includes(q)) ||
              (s.email && s.email.toLowerCase().includes(q))
          );
        }

        if (filters.role && filters.role !== "All") {
          list = list.filter((s) => s.role === filters.role);
        }

        if (filters.shiftId && filters.shiftId !== "All") {
          list = list.filter((s) => s.shiftId === filters.shiftId);
        }

        if (filters.status && filters.status !== "All") {
          list = list.filter((s) => s.status === filters.status);
        }

        return list;
      }
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
        const response = await apiClient.get(`/store/staff/${id}`);
        if (response.data?.success && response.data.data) {
          return response.data.data;
        } else if (response.data) {
          return response.data;
        }
        throw new Error("API return format mismatch");
      } catch (err) {
        const list = getLocalStaff();
        const found = list.find((s) => s._id === id);
        if (found) return found;
        throw new Error("Staff member not found");
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
        // Assume API endpoint
        const response = await apiClient.post("/store/staff", payload);
        return response.data;
      } catch (err) {
        // Simulation Fallback
        const list = getLocalStaff();
        const nextCodeNum = list.length + 1;
        const codeMap = {
          "Kitchen Supervisor": "KS",
          "Pizza Maker": "PM",
          "Baker": "BK",
          "Packager": "PK"
        };
        const prefix = codeMap[payload.role] || "ST";
        const employeeCode = `PVP-${prefix}-0${nextCodeNum}`;

        const newStaff = {
          _id: `staff-${Date.now()}`,
          storeId: "store-indore-01",
          userId: `user-${Date.now()}`,
          fullName: payload.fullName,
          email: payload.email,
          phone: payload.phone,
          profileImage: payload.profileImage || "",
          role: payload.role,
          employeeCode,
          joiningDate: payload.joiningDate || new Date().toISOString().split("T")[0],
          shiftId: payload.shiftId || "Morning",
          salaryType: payload.salaryType || "Monthly",
          salary: Number(payload.salary) || 0,
          experience: Number(payload.experience) || 0,
          skills: payload.skills || [],
          emergencyContact: payload.emergencyContact || "",
          status: "active",
          todayStatus: "present",
          performanceScore: 90,
          createdAt: new Date().toISOString(),
          stats: {
            ordersCompleted: 0,
            avgPrepTime: 15,
            delayedOrders: 0,
            attendance: 100
          },
          activities: [
            { id: `act-${Date.now()}-1`, type: "Shift Changes", title: "Joined the store", time: "Just now", status: "completed" }
          ]
        };

        const updated = [...list, newStaff];
        setLocalStaff(updated);
        return { success: true, data: newStaff };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      toast.success("Kitchen staff added successfully!");
    },
    onError: () => {
      toast.error("Failed to add kitchen staff");
    },
  });
}

// 4. Update Staff Mutation Hook
export function useUpdateStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      try {
        const response = await apiClient.put(`/store/staff/${id}`, payload);
        return response.data;
      } catch (err) {
        // Simulation Fallback
        const list = getLocalStaff();
        const updated = list.map((s) => {
          if (s._id === id) {
            return {
              ...s,
              fullName: payload.fullName ?? s.fullName,
              email: payload.email ?? s.email,
              phone: payload.phone ?? s.phone,
              profileImage: payload.profileImage ?? s.profileImage,
              role: payload.role ?? s.role,
              joiningDate: payload.joiningDate ?? s.joiningDate,
              salaryType: payload.salaryType ?? s.salaryType,
              salary: payload.salary !== undefined ? Number(payload.salary) : s.salary,
              experience: payload.experience !== undefined ? Number(payload.experience) : s.experience,
              skills: payload.skills ?? s.skills,
              emergencyContact: payload.emergencyContact ?? s.emergencyContact,
            };
          }
          return s;
        });
        setLocalStaff(updated);
        return { success: true, id };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      queryClient.invalidateQueries({ queryKey: ["staffDetails", variables.id] });
      toast.success("Staff profile updated successfully!");
    },
    onError: () => {
      toast.error("Failed to update staff profile");
    },
  });
}

// 5. Update Staff Status Mutation Hook
export function useUpdateStaffStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      try {
        const response = await apiClient.patch(`/store/staff/${id}/status`, { status });
        return response.data;
      } catch (err) {
        const list = getLocalStaff();
        const updated = list.map((s) => {
          if (s._id === id) {
            const actId = `act-${Date.now()}-status`;
            const label = status === "active" ? "activated" : status === "inactive" ? "deactivated" : "suspended";
            const type = status === "active" ? "completed" : status === "inactive" ? "info" : "severe";
            return {
              ...s,
              status,
              activities: [
                { id: actId, type: "Recent Performance Updates", title: `Staff profile ${label}`, time: "Just now", status: type },
                ...s.activities
              ]
            };
          }
          return s;
        });
        setLocalStaff(updated);
        return { success: true, id, status };
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
        const response = await apiClient.patch(`/store/staff/${id}/shift`, payload);
        return response.data;
      } catch (err) {
        const list = getLocalStaff();
        const updated = list.map((s) => {
          if (s._id === id) {
            const actId = `act-${Date.now()}-shift`;
            return {
              ...s,
              shiftId: payload.shiftId,
              activities: [
                { id: actId, type: "Shift Changes", title: `Assigned shift: ${payload.shiftId} (Eff. ${payload.effectiveDate || "Immediate"})`, time: "Just now", status: "completed" },
                ...s.activities
              ]
            };
          }
          return s;
        });
        setLocalStaff(updated);
        return { success: true, id };
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

// 7. Mark Leave Mutation Hook
export function useMarkLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      try {
        const response = await apiClient.patch(`/store/staff/${id}/leave`, payload);
        return response.data;
      } catch (err) {
        const list = getLocalStaff();
        const updated = list.map((s) => {
          if (s._id === id) {
            const actId = `act-${Date.now()}-leave`;
            return {
              ...s,
              todayStatus: "leave",
              activities: [
                { id: actId, type: "Attendance Logs", title: `Marked Leave: ${payload.leaveType} (${payload.startDate} to ${payload.endDate})`, time: "Just now", status: "info" },
                ...s.activities
              ]
            };
          }
          return s;
        });
        setLocalStaff(updated);
        return { success: true, id };
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      queryClient.invalidateQueries({ queryKey: ["staffDetails", variables.id] });
      toast.success("Leave marked successfully!");
    },
    onError: () => {
      toast.error("Failed to mark leave");
    },
  });
}

// 8. Delete Staff Mutation Hook
export function useDeleteStaff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      try {
        const response = await apiClient.delete(`/store/staff/${id}`);
        return response.data;
      } catch (err) {
        const list = getLocalStaff();
        const filtered = list.filter((s) => s._id !== id);
        setLocalStaff(filtered);
        return { success: true, id };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["kitchenStaff"] });
      toast.success("Staff member deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete staff member");
    },
  });
}
