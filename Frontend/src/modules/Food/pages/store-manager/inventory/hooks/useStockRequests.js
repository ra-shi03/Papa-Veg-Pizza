import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalStockRequests } from "../mockData";

export function useStockRequests(filters = {}, role = "store_manager", currentUser = "Aman Verma") {
  const {
    page = 1,
    limit = 10,
    search = "",
    status = "",
    urgency = "",
    ingredientId = "",
    from = "",
    to = ""
  } = filters;

  return useQuery({
    queryKey: ["stock-requests", filters, role, currentUser],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/stock-requests", {
          params: { ...filters, role, currentUser }
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
        console.warn("Backend API unavailable for stock requests. Filtering locally.");
        
        let list = getLocalStockRequests();

        // 1. Role-Based Scoping
        // Kitchen Staff can ONLY view their own requests
        if (role === "kitchen_staff") {
          list = list.filter(r => r.requestedBy === currentUser);
        }

        // 2. Search Request Number
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(r => r.requestNo.toLowerCase().includes(q));
        }

        // 3. Status Filter
        if (status && status !== "All") {
          list = list.filter(r => r.status === status);
        }

        // 4. Urgency Filter
        if (urgency && urgency !== "All") {
          list = list.filter(r => r.urgency === urgency);
        }

        // 5. Ingredient Filter
        if (ingredientId && ingredientId !== "All") {
          list = list.filter(r => r.ingredientId === ingredientId);
        }

        // 6. Date Range Filters
        if (from) {
          const fromDate = new Date(from);
          list = list.filter(r => new Date(r.createdAt) >= fromDate);
        }
        if (to) {
          const toDate = new Date(to);
          toDate.setHours(23, 59, 59, 999);
          list = list.filter(r => new Date(r.createdAt) <= toDate);
        }

        // 7. Sort by Date Descending
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 8. Pagination
        const total = list.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedData = list.slice(startIndex, startIndex + limit);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

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
    },
    staleTime: 5000,
  });
}
