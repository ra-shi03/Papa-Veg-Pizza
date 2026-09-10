import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { getLocalWasteLogs, getLocalIngredients, mockStaffProfiles } from "../mockData";

export function useWasteDetails(wasteId) {
  return useQuery({
    queryKey: ["waste-details", wasteId],
    enabled: !!wasteId,
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/waste/${wasteId}`);
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.wasteLog) {
          return response.data;
        }
        throw new Error("Invalid response format");
      } catch (err) {
        console.warn("Backend API unavailable. Fetching waste log detail from local database.");

        // Simulate network latency
        await new Promise((resolve) => setTimeout(resolve, 300));

        const logs = getLocalWasteLogs();
        const wasteLog = logs.find(log => log._id === wasteId);

        if (!wasteLog) {
          throw new Error("Waste log not found in local database");
        }

        const ingredients = getLocalIngredients();
        const ingredient = ingredients.find(ing => ing._id === wasteLog.ingredientId);

        const reportedProfile = mockStaffProfiles[wasteLog.reportedBy] || { name: wasteLog.reportedBy };
        const approvedProfile = wasteLog.approvedBy ? (mockStaffProfiles[wasteLog.approvedBy] || { name: wasteLog.approvedBy }) : null;

        return {
          wasteLog,
          ingredient: ingredient || {
            ingredientName: wasteLog.ingredientName,
            category: "Unknown",
            currentStock: 0,
            costPerUnit: (wasteLog.estimatedLoss / (wasteLog.quantity || 1)) || 0,
            unit: "Unit"
          },
          reportedBy: reportedProfile,
          approvedBy: approvedProfile,
          images: wasteLog.images || [],
          timeline: wasteLog.timeline || []
        };
      }
    }
  });
}
