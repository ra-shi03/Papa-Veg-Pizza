import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { INV, throwApiError } from "./inventoryApi";

export function useShortagesDashboard() {
  return useQuery({
    queryKey: ["shortages-dashboard"],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`${INV}/ingredient-shortages/dashboard`);
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.activeShortages !== undefined) {
          return response.data;
        }
        throw new Error("Invalid response format");
      } catch (err) {
        throwApiError(err);
        
      }
    },
  });
}
