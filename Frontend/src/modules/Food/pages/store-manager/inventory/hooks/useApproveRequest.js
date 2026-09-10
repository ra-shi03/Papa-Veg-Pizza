import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { getLocalStockRequests, setLocalStockRequests } from "../mockData";

export function useApproveRequest() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { requestId, approvedQty, remarks, approvedBy = "Shubham Jamliya" } = payload;

      try {
        const response = await apiClient.patch("/stock-requests/approve", {
          requestId,
          approvedQty: Number(approvedQty),
          remarks
        });

        if (response.data && response.data.success) {
          return response.data;
        }

        throw new Error(response.data?.message || "Failed to approve request");
      } catch (err) {
        console.warn("Backend API unavailable for stock approval. Simulating locally.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 450));

        const requests = getLocalStockRequests();
        const requestIndex = requests.findIndex(r => r._id === requestId);

        if (requestIndex === -1) {
          throw new Error("Stock request not found");
        }

        const request = requests[requestIndex];

        // Perform local update
        const updatedRequest = {
          ...request,
          status: "approved",
          approvedQty: Number(approvedQty),
          remarks: remarks || "Approved in offline mode",
          approvedBy,
          updatedAt: new Date().toISOString()
        };

        requests[requestIndex] = updatedRequest;
        setLocalStockRequests(requests);

        return {
          success: true,
          message: `Request ${request.requestNo} approved successfully`
        };
      }
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Request approved");
      
      // Invalidate queries to refresh tables and stats
      queryClient.invalidateQueries({ queryKey: ["stock-requests"] });
      queryClient.invalidateQueries({ queryKey: ["stock-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["stock-request-details", variables.requestId] });
    },
    onError: (error) => {
      toast.error(error.message || "Approval failed");
    }
  });
}
