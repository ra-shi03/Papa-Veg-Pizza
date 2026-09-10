import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { getLocalStockRequests, setLocalStockRequests } from "../mockData";

export function useRejectRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { requestId, remarks, approvedBy = "Shubham Jamliya" } = payload;

      try {
        const response = await apiClient.patch("/stock-requests/reject", {
          requestId,
          remarks
        });

        if (response.data && response.data.success) {
          return response.data;
        }

        throw new Error(response.data?.message || "Failed to reject request");
      } catch (err) {
        console.warn("Backend API unavailable for stock rejection. Simulating locally.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 400));

        const requests = getLocalStockRequests();
        const requestIndex = requests.findIndex(r => r._id === requestId);

        if (requestIndex === -1) {
          throw new Error("Stock request not found");
        }

        const request = requests[requestIndex];

        // Perform local update
        const updatedRequest = {
          ...request,
          status: "rejected",
          remarks: remarks || "Rejected",
          approvedBy,
          updatedAt: new Date().toISOString()
        };

        requests[requestIndex] = updatedRequest;
        setLocalStockRequests(requests);

        return {
          success: true,
          message: `Request ${request.requestNo} rejected`
        };
      }
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Request rejected");
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock-request-details", variables.requestId] });
    },
    onError: (error) => {
      toast.error(error.message || "Rejection failed");
    }
  });
}
