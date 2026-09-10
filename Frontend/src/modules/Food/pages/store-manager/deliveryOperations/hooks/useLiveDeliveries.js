import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";

export default function useLiveDeliveries(filters = {}) {
  return useQuery({
    queryKey: ["live-deliveries", filters],
    queryFn: async () => {
      const response = await apiClient.get("/store/delivery/live");
      let list = [];
      if (Array.isArray(response.data)) {
        list = response.data;
      } else if (Array.isArray(response.data?.data)) {
        list = response.data.data;
      }

      // 1. Search Filter (by Order ID or Customer Name)
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(
          (d) =>
            (d.orderId && d.orderId.toLowerCase().includes(q)) ||
            (d.customerName && d.customerName.toLowerCase().includes(q))
        );
      }

      // 2. Status Filter (Assigned, Picked Up, Out For Delivery, Delivered)
      if (filters.status && filters.status !== "All") {
        const statusMap = {
          "assigned": "assigned",
          "accepted": "accepted",
          "picked_up": "picked_up",
          "out_for_delivery": "out_for_delivery",
          "delivered": "delivered"
        };
        const filterVal = filters.status.toLowerCase().replace(/\s+/g, "_");
        list = list.filter(
          (d) => d.deliveryStatus && d.deliveryStatus.toLowerCase() === (statusMap[filterVal] || filterVal)
        );
      }

      return list;
    }
  });
}
