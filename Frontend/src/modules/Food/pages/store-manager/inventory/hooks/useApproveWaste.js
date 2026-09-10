import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { getLocalWasteLogs, setLocalWasteLogs } from "../mockData";

export function useApproveWaste() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload) => {
      const { wasteId, remarks = "", approvedBy = "Shubham Jamliya" } = payload;
      try {
        const response = await apiClient.patch(`/waste/${wasteId}/approve`, { remarks });
        if (
          response.data?.message === "Stubbed operational response" ||
          response.data?.data?.message === "Stubbed operational response"
        ) {
          throw new Error("Stubbed response placeholder detected");
        }
        if (response.data && response.data.success) {
          return response.data;
        }
        throw new Error(response.data?.message || "Waste approval failed on backend");
      } catch (err) {
        console.warn("Backend API unavailable. Approving waste log locally.");

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 400));

        const wasteLogs = getLocalWasteLogs();
        const logIndex = wasteLogs.findIndex(w => w._id === wasteId);

        if (logIndex === -1) {
          throw new Error("Waste log not found in local database");
        }

        const log = wasteLogs[logIndex];
        if (log.status === "approved") {
          throw new Error("Waste record is already approved");
        }

        // Update properties
        const updatedLog = {
          ...log,
          status: "approved",
          approvedBy,
          remarks: remarks || log.remarks,
          timeline: [
            ...log.timeline,
            {
              user: approvedBy,
              action: "approved",
              remarks: remarks || "Approved by store manager",
              createdAt: new Date().toISOString()
            }
          ]
        };

        wasteLogs[logIndex] = updatedLog;
        setLocalWasteLogs(wasteLogs);

        return {
          success: true,
          message: "Waste record approved successfully in local database"
        };
      }
    },
    onSuccess: (data, variables) => {
      toast.success(data.message || "Waste record approved");
      queryClient.invalidateQueries({ queryKey: ["waste"] });
      queryClient.invalidateQueries({ queryKey: ["waste-dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["waste-details", variables.wasteId] });
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to approve waste record");
    }
  });
}
