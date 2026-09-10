import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalTransactions } from "../mockData";

export function useInventoryHistory(ingredientId, filters = {}) {
  const {
    page = 1,
    limit = 5,
    search = "",
    type = ""
  } = filters;

  return useQuery({
    queryKey: ["history", ingredientId, filters],
    queryFn: async () => {
      if (!ingredientId) return { data: [], pagination: {} };
      try {
        const response = await apiClient.get(`/inventory/${ingredientId}/history`, {
          params: filters
        });

        // Detect stubbed response pattern
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
        console.warn(`Backend API unavailable for history on ingredient ${ingredientId}. Using local history logs.`);
        
        let list = getLocalTransactions().filter(t => t.ingredientId === ingredientId);

        // 1. Filter by transaction type
        if (type && type !== "All") {
          list = list.filter(t => t.type === type);
        }

        // 2. Filter by search query (reason or createdBy)
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(t => 
            t.reason.toLowerCase().includes(q) ||
            t.createdBy.toLowerCase().includes(q)
          );
        }

        // 3. Sort by date descending
        list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        // 4. Calculate pagination
        const total = list.length;
        const totalPages = Math.ceil(total / limit);
        const startIndex = (page - 1) * limit;
        const paginatedData = list.slice(startIndex, startIndex + limit);

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 200));

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
    enabled: !!ingredientId,
    staleTime: 5000,
  });
}
