import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalStockRequests, getLocalIngredients, mockStaffProfiles } from "../mockData";

export function useStockRequestDetails(requestId) {
  return useQuery({
    queryKey: ["stock-request-details", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      try {
        const response = await apiClient.get(`/stock-requests/${requestId}`);

        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }

        if (response.data) {
          return response.data;
        }

        throw new Error("Invalid response format");
      } catch (err) {
        console.warn(`Backend API unavailable for stock request details ${requestId}. Assembling locally.`);
        
        const requests = getLocalStockRequests();
        const request = requests.find(r => r._id === requestId);

        if (!request) {
          throw new Error("Stock request not found");
        }

        const ingredients = getLocalIngredients();
        const ingredient = ingredients.find(i => i._id === request.ingredientId) || null;

        // Retrieve staff details
        const requestedByProfile = mockStaffProfiles[request.requestedBy] || {
          name: request.requestedBy,
          shift: "General Shift",
          department: "Kitchen Operations",
          role: "Kitchen Staff"
        };

        const approvedByProfile = request.approvedBy ? (mockStaffProfiles[request.approvedBy] || {
          name: request.approvedBy,
          shift: "Store General Hours",
          department: "Administration",
          role: "Store Manager"
        }) : null;

        // Construct dynamic timeline events
        const timeline = [
          {
            title: "Requested",
            status: "completed",
            user: request.requestedBy,
            date: request.createdAt,
            remarks: request.reason
          }
        ];

        if (request.status === "approved" || request.status === "fulfilled") {
          timeline.push({
            title: "Approved",
            status: "completed",
            user: request.approvedBy || "Store Manager",
            date: new Date(new Date(request.createdAt).getTime() + 1800000).toISOString(), // simulated +30m
            remarks: request.remarks || "Approved for dispatch."
          });
        }

        if (request.status === "rejected") {
          timeline.push({
            title: "Rejected",
            status: "failed",
            user: request.approvedBy || "Store Manager",
            date: new Date(new Date(request.createdAt).getTime() + 1800000).toISOString(), // simulated +30m
            remarks: request.remarks || "Rejected due to capacity limits."
          });
        }

        if (request.status === "fulfilled") {
          timeline.push({
            title: "Fulfilled",
            status: "completed",
            user: request.approvedBy || "Store Manager",
            date: new Date(new Date(request.createdAt).getTime() + 3600000).toISOString(), // simulated +1h
            remarks: "Delivered to kitchen and verified stock update."
          });
        }

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 250));

        return {
          request,
          ingredient,
          requestedBy: requestedByProfile,
          approvedBy: approvedByProfile,
          timeline
        };
      }
    },
    enabled: !!requestId,
    staleTime: 5000,
  });
}
