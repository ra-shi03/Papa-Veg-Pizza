import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve detailed performance logs for a single staff member.
 * @param {string} staffId - Staff identifier.
 */
export function useStaffDetails(staffId) {
  return useQuery({
    queryKey: ["staff-details", staffId],
    queryFn: async () => {
      if (!staffId) return null;
      const response = await apiClient.get(`/reports/staff/${staffId}`);
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API format");
    },
    enabled: !!staffId,
  });
}
