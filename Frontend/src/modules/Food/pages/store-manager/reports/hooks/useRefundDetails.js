import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { mockDetailedOrders } from "../mockData";

export function useRefundDetails(orderId) {
  return useQuery({
    queryKey: ["refund-details", orderId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/reports/refund/${orderId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        console.warn(`Backend Refund Details API offline for order ${orderId}, pulling local mock refund details`, err);

        const order = mockDetailedOrders.find(o => o._id === orderId);
        if (!order || !order.refund) {
          throw new Error("Refund details not found for this order");
        }

        return {
          refundAmount: order.refund.amount,
          reason: order.refund.reason,
          approvedBy: order.refund.approvedBy,
          status: order.refund.status,
          createdAt: order.refund.createdAt
        };
      }
    },
    enabled: !!orderId,
  });
}
