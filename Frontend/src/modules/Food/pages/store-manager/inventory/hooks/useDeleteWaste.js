import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { getLocalWasteLogs, setLocalWasteLogs } from "../mockData";

export function useDeleteWaste() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { wasteId } = payload;

      try {
        const response = await apiClient.delete(`/waste/${wasteId}`);
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.success) {
          return response.data;
        }
        throw new Error(response.data?.message || "Failed to delete waste log on backend");
      } catch (err) {
        console.warn("Backend API unavailable. Deleting waste log from local storage database.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 300));

        const wasteLogs = getLocalWasteLogs();
        const logIndex = wasteLogs.findIndex(w => w._id === wasteId);

        if (logIndex === -1) {
          throw new Error("Waste log not found in local database");
        }

        // We mark status as "deleted" to soft-delete it
        wasteLogs[logIndex] = {
          ...wasteLogs[logIndex],
          status: "deleted"
        };
        setLocalWasteLogs(wasteLogs);

        return {
          success: true,
          message: "Waste record deleted successfully from local database"
        };
      }
    },
    onSuccess: (data) => {
      toast.success(data.message || "Waste record deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["waste"] });
      queryClient.invalidateQueries({ queryKey: ["waste-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete waste record");
    }
  });
}
