import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

export default function useDeliveryIssues(filters = {}) {
  return useQuery({
    queryKey: ["delivery-issues", filters],
    queryFn: async () => {
      const response = await apiClient.get("/store/delivery/issues");
      let list = [];
      if (Array.isArray(response.data)) {
        list = response.data;
      } else if (Array.isArray(response.data?.data)) {
        list = response.data.data;
      }

      // 1. Search Filter (by Ticket ID or Order ID)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (item) =>
            (item._id && item._id.toLowerCase().includes(q)) ||
            (item.orderId && item.orderId.toLowerCase().includes(q))
        );
      }

      // 2. Issue Type Filter
      if (filters.issueType && filters.issueType !== "All") {
        list = list.filter(
          (item) => item.issueType && item.issueType.toLowerCase() === filters.issueType.toLowerCase()
        );
      }

      // 3. Status Filter
      if (filters.status && filters.status !== "All") {
        const statusMap = {
          "open": "open",
          "in_progress": "in_progress",
          "resolved": "resolved",
          "escalated": "escalated",
          "closed": "closed"
        };
        const filterVal = filters.status.toLowerCase().replace(/\s+/g, "_");
        list = list.filter(
          (item) => item.status && item.status.toLowerCase() === (statusMap[filterVal] || filterVal)
        );
      }

      // 4. Severity Filter
      if (filters.severity && filters.severity !== "All") {
        list = list.filter(
          (item) => item.severity && item.severity.toLowerCase() === filters.severity.toLowerCase()
        );
      }

      return list;
    }
  });
}
