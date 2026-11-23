import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

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
        const response = await apiClient.get(INV, {
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
        throwApiError(err);
        
      }
    },
    staleTime: 5000,
  });
}
