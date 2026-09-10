import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { initialMockPerformance } from "../mockData";

const PERFORMANCE_STORAGE_KEY = "pvp_kitchen_performance";

// Initialize performance DB in localStorage if empty
const initializePerformanceDb = () => {
  if (typeof window !== "undefined") {
    const existing = localStorage.getItem(PERFORMANCE_STORAGE_KEY);
    if (!existing) {
      localStorage.setItem(PERFORMANCE_STORAGE_KEY, JSON.stringify(initialMockPerformance));
    }
  }
};

initializePerformanceDb();

const getLocalPerformance = () => {
  try {
    return JSON.parse(localStorage.getItem(PERFORMANCE_STORAGE_KEY)) || [];
  } catch (e) {
    return [];
  }
};

// 1. Fetch Performance Leaderboard
export function usePerformanceList(filters = {}) {
  return useQuery({
    queryKey: ["kitchenPerformance", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/performance", {
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
        console.warn("Backend performance API offline, pulling from local storage mock data");
        let list = getLocalPerformance();

        // 1. Filter by Period (daily, weekly, monthly)
        const period = filters.period || "monthly";
        list = list.filter((p) => p.period === period);

        // 2. Filter by Role & Search (requires staff details joining)
        if (filters.role || filters.search) {
          const staffStorage = localStorage.getItem("pvp_kitchen_staff");
          let staffList = [];
          try {
            staffList = JSON.parse(staffStorage) || [];
          } catch (e) {}

          list = list.filter((p) => {
            const staffObj = staffList.find((s) => s._id === p.staffId);
            if (!staffObj) return false;

            // Filter by role
            if (filters.role && filters.role !== "All") {
              const r = filters.role.toLowerCase().replace(/ /g, "_");
              const staffRole = staffObj.role.toLowerCase().replace(/ /g, "_");
              if (staffRole !== r) return false;
            }

            // Filter by search query (name or employee code)
            if (filters.search) {
              const q = filters.search.toLowerCase();
              const nameMatch = staffObj.fullName && staffObj.fullName.toLowerCase().includes(q);
              const codeMatch = staffObj.employeeCode && staffObj.employeeCode.toLowerCase().includes(q);
              return nameMatch || codeMatch;
            }

            return true;
          });
        }

        // Sort leaderboard by score descending
        return list.sort((a, b) => b.score - a.score);
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

// 2. Fetch Single Staff Performance Details
export function useStaffPerformanceDetails(staffId, period = "monthly") {
  return useQuery({
    queryKey: ["staffPerformanceDetails", staffId, period],
    queryFn: async () => {
      if (!staffId) return null;
      try {
        const response = await apiClient.get(`/store/performance/${staffId}`, {
          params: { period }
        });

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
        const list = getLocalPerformance();
        const found = list.find((p) => p.staffId === staffId && p.period === period);
        if (found) return found;
        
        // Return dummy / default calculated metrics for safe rendering
        return {
          staffId,
          period,
          totalOrders: 0,
          avgPreparationTime: 0,
          delayedOrders: 0,
          attendancePercentage: 100,
          customerComplaints: 0,
          rating: 5.0,
          score: 100
        };
      }
    },
    enabled: !!staffId,
  });
}
