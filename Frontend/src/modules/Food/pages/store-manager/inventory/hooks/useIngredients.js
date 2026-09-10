import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalIngredients } from "../mockData";

export function useIngredients(filters = {}) {
  const {
    page = 1,
    limit = 10,
    search = "",
    category = "",
    status = "",
    supplier = "",
    unit = "",
    from = "",
    to = ""
  } = filters;

  return useQuery({
    queryKey: ["inventory", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/inventory", {
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
        console.warn("Backend API unavailable for ingredients. Using local filtered data.");
        
        let list = getLocalIngredients();

        // 1. Apply Search Filter
        if (search) {
          const q = search.toLowerCase();
          list = list.filter(item => 
            item.ingredientName.toLowerCase().includes(q) ||
            item.supplierName?.toLowerCase().includes(q)
          );
        }

        // 2. Apply Category Filter
        if (category && category !== "All") {
          list = list.filter(item => item.category === category);
        }

        // 3. Apply Status Filter
        if (status && status !== "All") {
          list = list.filter(item => item.status === status);
        }

        // 4. Apply Supplier Filter
        if (supplier && supplier !== "All") {
          list = list.filter(item => item.supplierId === supplier);
        }

        // 5. Apply Unit Filter
        if (unit && unit !== "All") {
          list = list.filter(item => item.unit === unit);
        }

        // 6. Apply Date Filters (from/to)
        if (from) {
          const fromDate = new Date(from);
          list = list.filter(item => new Date(item.updatedAt) >= fromDate);
        }
        if (to) {
          const toDate = new Date(to);
          // Set to end of day to include full date
          toDate.setHours(23, 59, 59, 999);
          list = list.filter(item => new Date(item.updatedAt) <= toDate);
        }

        // 7. Calculate Pagination
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
