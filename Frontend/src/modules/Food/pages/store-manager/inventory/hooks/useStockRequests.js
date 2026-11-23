import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useStockRequests(filters = {}, role = "store_manager", currentUser = "") {
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
        const response = await apiClient.get(`${INV}/stock-requests`, {
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
        throwApiError(err);
        
      }
    },
    staleTime: 5000,
  });
}
