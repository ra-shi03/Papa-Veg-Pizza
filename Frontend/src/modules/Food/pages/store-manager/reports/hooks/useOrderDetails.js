import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { mockDetailedOrders } from "../mockData";

export function useOrderDetails(orderId) {
  return useQuery({
    queryKey: ["order-details", orderId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/reports/order/${orderId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        console.warn(`Backend Order Details API offline for id ${orderId}, pulling local mock details`, err);

        const order = mockDetailedOrders.find(o => o._id === orderId);
        if (!order) {
          throw new Error("Order details not found in mock database");
        }

        return {
          orderInfo: {
            _id: order._id,
            orderNumber: order.orderNumber,
            status: order.orderStatus,
            orderType: order.orderType,
            createdAt: order.createdAt,
            totalAmount: order.totalAmount
          },
          customer: {
            name: order.customer.name,
            phone: order.customer.phone,
            email: order.customer.email,
            address: order.customer.address,
            orderHistoryCount: order.customer.orderHistoryCount
          },
          items: order.items,
          coupon: order.coupon,
          payment: {
            method: order.paymentMethod,
            status: order.paymentStatus,
            transactionId: `TXN${9000000000 + Math.floor(Math.random() * 999999999)}`,
            amountPaid: order.totalAmount
          },
          preparationTimeline: order.preparationTimeline,
          deliveryTimeline: order.deliveryTimeline,
          staff: order.staff,
          customerRating: order.customerRating
        };
      }
    },
    enabled: !!orderId,
  });
}
