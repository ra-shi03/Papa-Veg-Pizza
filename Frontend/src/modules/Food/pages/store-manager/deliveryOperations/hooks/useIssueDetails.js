import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

export default function useIssueDetails(issueId) {
  return useQuery({
    queryKey: ["issue-details", issueId],
    queryFn: async () => {
      if (!issueId) return null;
      
      // Get all issues and locate the one matching issueId
      const issuesRes = await apiClient.get("/store/delivery/issues");
      const issues = issuesRes.data?.data || issuesRes.data || [];
      const issue = issues.find(i => i._id === issueId);
      
      if (!issue) return null;

      // Get tracking details for customer & rider coordinates/info
      let tracking = null;
      try {
        const trackingRes = await apiClient.get(`/store/tracking/${issue.orderId}`);
        tracking = trackingRes.data?.data || trackingRes.data;
      } catch (_) {}

      // Get custom timeline logs
      let timeline = [];
      try {
        const timelineRes = await apiClient.get(`/store/delivery/timeline/${issue.orderId}`);
        timeline = timelineRes.data?.data || timelineRes.data || [];
      } catch (_) {}

      return {
        issue,
        tracking,
        timeline
      };
    },
    enabled: !!issueId,
  });
}
