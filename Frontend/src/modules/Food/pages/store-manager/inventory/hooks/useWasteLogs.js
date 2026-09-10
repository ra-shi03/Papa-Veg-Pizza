import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalWasteLogs } from "../mockData";

export function useWasteLogs(filters, role, currentUser) {
  const { page = 1, limit = 5, search = "", wasteType = "All", reportedBy = "All", from = null, to = null } = filters;

  return useQuery({
    queryKey: ["waste", page, limit, search, wasteType, reportedBy, from, to, role, currentUser],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/waste", {
          params: { page, limit, search, wasteType, reportedBy, from, to }
        });
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.data) {
          return response.data;
        }
        throw new Error("Invalid response format");
      } catch (err) {
        console.warn("Backend API unavailable. Fetching waste logs from local database.");

        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 300));

        let logs = getLocalWasteLogs().filter(log => log.status !== "deleted");

        // 1. Role Scoping
        if (role === "kitchen_staff") {
          logs = logs.filter(log => log.reportedBy === currentUser);
        }

        // 2. Search filtering
        if (search.trim()) {
          const query = search.toLowerCase();
          logs = logs.filter(
            log =>
              log.ingredientName.toLowerCase().includes(query) ||
              log.reason.toLowerCase().includes(query) ||
              log.reportedBy.toLowerCase().includes(query)
          );
        }

        // 3. Waste Type filtering
        if (wasteType && wasteType !== "All") {
          logs = logs.filter(log => log.wasteType === wasteType);
        }

        // 4. Reported By filtering
        if (reportedBy && reportedBy !== "All") {
          logs = logs.filter(log => log.reportedBy === reportedBy);
        }

        // 5. Date Range filtering
        if (from) {
          const fromDate = new Date(from);
          logs = logs.filter(log => new Date(log.createdAt) >= fromDate);
        }
        if (to) {
          const toDate = new Date(to);
          logs = logs.filter(log => new Date(log.createdAt) <= toDate);
        }

        // Sort descending by date
        logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination calculations
        const total = logs.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const startIndex = (page - 1) * limit;
        const paginatedData = logs.slice(startIndex, startIndex + limit);

        return {
          data: paginatedData,
          pagination: {
            total,
            page,
            limit,
            totalPages
          }
        };
      }
    }
  });
}
