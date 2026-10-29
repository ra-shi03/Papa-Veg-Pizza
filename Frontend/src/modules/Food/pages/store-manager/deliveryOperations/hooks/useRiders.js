import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

export default function useRiders(filters = {}) {
  return useQuery({
    queryKey: ["riders", filters],
    queryFn: async () => {
      const response = await apiClient.get("/store/riders");
      let list = [];
      if (Array.isArray(response.data)) {
        list = response.data;
      } else if (Array.isArray(response.data?.data)) {
        list = response.data.data;
      } else if (Array.isArray(response.data?.riders)) {
        list = response.data.riders;
      }

      // 1. Search Filter (by name, phone number or area; the server sends riders near this store, phone masked)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (r) =>
            String(r.name || "").toLowerCase().includes(q) ||
            String(r.mobile || "").includes(q) ||
            String(r.area || "").toLowerCase().includes(q)
        );
      }

      // 2. Availability Filter
      if (filters.availability && filters.availability !== "All") {
        list = list.filter(
          (r) => r.availability && r.availability.toLowerCase() === filters.availability.toLowerCase()
        );
      }

      // 3. Status Filter
      if (filters.status && filters.status !== "All") {
        list = list.filter(
          (r) => r.currentStatus && r.currentStatus.toLowerCase() === filters.status.toLowerCase()
        );
      }

      // 4. Vehicle Type Filter
      if (filters.vehicleType && filters.vehicleType !== "All") {
        list = list.filter(
          (r) => r.vehicleType && r.vehicleType.toLowerCase() === filters.vehicleType.toLowerCase()
        );
      }

      return list;
    }
  });
}
