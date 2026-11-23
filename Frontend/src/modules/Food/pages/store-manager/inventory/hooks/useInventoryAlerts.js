import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useInventoryAlerts(filters = {}, options = {}) {
  const { page = 1, limit = 10, search = "", severity = "All", status = "All", from = "", to = "" } = filters;
  const { refetchInterval } = options;

  return useQuery({
    queryKey: ["alerts", page, limit, search, severity, status, from, to],
    refetchInterval,
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${INV}/alerts`, {
          params: { page, limit, search, severity, status, from, to }
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
    }
  });
}
