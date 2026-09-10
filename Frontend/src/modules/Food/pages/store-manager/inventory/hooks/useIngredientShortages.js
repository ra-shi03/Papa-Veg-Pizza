import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalShortages } from "../mockData";

export function useIngredientShortages(filters = {}, options = {}) {
  const { 
    page = 1, 
    limit = 10, 
    search = "", 
    severity = "All", 
    status = "All", 
    storeId = "All", 
    from = "", 
    to = "" 
  } = filters;
  const { refetchInterval } = options;

  return useQuery({
    queryKey: ["ingredient-shortages", page, limit, search, severity, status, storeId, from, to],
    refetchInterval,
    queryFn: async () => {
      try {
        const response = await apiClient.get("/ingredient-shortages", {
          params: { page, limit, search, severity, status, storeId, from, to }
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
        console.warn("Backend API unavailable. Fetching ingredient shortages from local database.");

        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 300));

        let list = getLocalShortages();

        // 1. Search Filter
        if (search.trim()) {
          const q = search.toLowerCase();
          list = list.filter(a => 
            a.ingredientName.toLowerCase().includes(q) ||
            a._id.toLowerCase().includes(q)
          );
        }

        // 2. Severity Filter
        if (severity && severity !== "All") {
          list = list.filter(a => a.severity === severity);
        }

        // 3. Status Filter
        if (status && status !== "All") {
          list = list.filter(a => a.status === status);
        }

        // 4. Store Filter
        if (storeId && storeId !== "All") {
          list = list.filter(a => a.storeId === storeId);
        }

        // 5. Date range filters
        if (from) {
          const fromDate = new Date(from);
          list = list.filter(a => new Date(a.createdAt) >= fromDate);
        }
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          list = list.filter(a => new Date(a.createdAt) <= toDate);
        }

        // Sort descending by date
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // Pagination
        const total = list.length;
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const startIndex = (page - 1) * limit;
        const paginatedData = list.slice(startIndex, startIndex + limit);

        return {
          data: paginatedData,
          pagination: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages
          }
        };
      }
    }
  });
}
