import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalStockRequests } from "../mockData";

export function useStockRequestsDashboard() {
  return useQuery({
    queryKey: ["stock-dashboard"],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/stock-requests/dashboard");
        
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }

        if (response.data && typeof response.data === "object" && "pendingRequests" in response.data) {
          return response.data;
        }
        if (response.data?.data && typeof response.data.data === "object" && "pendingRequests" in response.data.data) {
          return response.data.data;
        }

        throw new Error("Invalid response format");
      } catch (err) {
        console.warn("Backend API unavailable for stock requests dashboard. Calculating locally.");
        
        const requests = getLocalStockRequests();
        const pendingRequests = requests.filter(r => r.status === "pending").length;
        const approvedRequests = requests.filter(r => r.status === "approved").length;
        const rejectedRequests = requests.filter(r => r.status === "rejected").length;
        const urgentRequests = requests.filter(r => r.urgency === "critical" || r.urgency === "high").length;

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        return {
          pendingRequests,
          approvedRequests,
          rejectedRequests,
          urgentRequests
        };
      }
    },
    staleTime: 5000,
  });
}
