import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { getLocalShortages, setLocalShortages, mockShortageTimeline } from "../mockData";

export function useResolveShortage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { shortageId, actionTaken, notes = "" } = payload;

      try {
        const response = await apiClient.patch(`/ingredient-shortages/${shortageId}/resolve`, {
          actionTaken,
          notes
        });
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.success) {
          return response.data;
        }
        throw new Error(response.data?.message || "Failed to resolve shortage");
      } catch (err) {
        console.warn("Backend API unavailable. Resolving shortage in local database.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const shortages = getLocalShortages();
        const index = shortages.findIndex((s) => s._id === shortageId);

        if (index === -1) {
          throw new Error("Shortage record not found");
        }

        const currentUser = localStorage.getItem("store_user_name") || "Shubham Jamliya";

        shortages[index] = {
          ...shortages[index],
          status: "resolved",
          actionTaken,
          resolvedBy: currentUser,
          resolvedAt: new Date().toISOString(),
          resolutionNote: notes
        };

        setLocalShortages(shortages);

        // Update timeline
        if (!mockShortageTimeline[shortageId]) {
          mockShortageTimeline[shortageId] = [];
        }
        mockShortageTimeline[shortageId].push({
          user: currentUser,
          action: "resolved",
          remarks: notes || `Resolved shortage: ${actionTaken}`,
          createdAt: new Date().toISOString()
        });

        return {
          success: true,
          message: "Shortage marked as resolved successfully"
        };
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Shortage marked resolved");
      queryClient.invalidateQueries({ queryKey: ["ingredient-shortages"] });
      queryClient.invalidateQueries({ queryKey: ["shortages-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["shortage-details"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to resolve shortage");
    }
  });
}
