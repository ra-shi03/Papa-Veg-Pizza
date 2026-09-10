import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

/**
 * Hook to retrieve comparative metrics between two employees.
 * @param {string} staffAId - First staff identifier.
 * @param {string} staffBId - Second staff identifier.
 */
export function useStaffComparison(staffAId, staffBId) {
  return useQuery({
    queryKey: ["staff-comparison", staffAId, staffBId],
    queryFn: async () => {
      if (!staffAId || !staffBId) return null;
      const response = await apiClient.get("/reports/staff-comparison", {
        params: { staffA: staffAId, staffB: staffBId }
      });
      if (response.data?.success && response.data?.data) {
        return response.data.data;
      }
      throw new Error("Invalid API format");
    },
    enabled: !!staffAId && !!staffBId,
  });
}
