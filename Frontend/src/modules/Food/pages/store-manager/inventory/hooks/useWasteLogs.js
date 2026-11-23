import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useWasteLogs(filters, role, currentUser) {
  const { page = 1, limit = 5, search = "", wasteType = "All", reportedBy = "All", from = null, to = null } = filters;

  return useQuery({
    queryKey: ["waste", page, limit, search, wasteType, reportedBy, from, to, role, currentUser],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${INV}/waste`, {
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
        throwApiError(err);
        
      }
    }
  });
}
