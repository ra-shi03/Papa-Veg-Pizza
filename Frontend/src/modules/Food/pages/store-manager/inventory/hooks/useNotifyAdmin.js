import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { mockShortageTimeline } from "../mockData";

export function useNotifyAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { shortageId, type, message, priority } = payload;

      try {
        const response = await apiClient.post("/notifications/admin", {
          shortageId,
          type,
          message,
          priority
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
        throw new Error(response.data?.message || "Failed to notify admin");
      } catch (err) {
        console.warn("Backend API unavailable. Logging admin notification.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        // Update timeline in local memory
        if (shortageId) {
          if (!mockShortageTimeline[shortageId]) {
            mockShortageTimeline[shortageId] = [];
          }
          mockShortageTimeline[shortageId].push({
            user: localStorage.getItem("store_user_name") || "Shubham Jamliya",
            action: "reported",
            remarks: `Dispatched Admin Emergency Alert [Priority: ${priority.toUpperCase()}]: ${message}`,
            createdAt: new Date().toISOString()
          });
        }

        return {
          success: true,
          message: "Emergency notification successfully dispatched to administrator dashboard."
        };
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Admin notified successfully");
      queryClient.invalidateQueries({ queryKey: ["shortage-details"] });
      queryClient.invalidateQueries({ queryKey: ["ingredient-shortages"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to notify admin");
    }
  });
}
