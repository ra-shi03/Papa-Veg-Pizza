import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { mockDailySales } from "../mockData";

export function useDayDetails(date) {
  return useQuery({
    queryKey: ["daily-sales-detail", date],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/reports/daily-sales/${date}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        console.warn(`Backend Day Details API offline for date ${date}, pulling local mock day details`, err);

        const dayData = mockDailySales.find(d => d.date === date);
        if (!dayData) {
          throw new Error("Date details not found in mock data");
        }

        // Format payment breakdown
        const paymentBreakdown = [
          { method: "Cash", transactions: dayData.paymentTransactions.cash, revenue: dayData.paymentDistribution.cash },
          { method: "UPI", transactions: dayData.paymentTransactions.upi, revenue: dayData.paymentDistribution.upi },
          { method: "Card", transactions: dayData.paymentTransactions.card, revenue: dayData.paymentDistribution.card },
          { method: "Wallet", transactions: dayData.paymentTransactions.wallet, revenue: dayData.paymentDistribution.wallet }
        ];

        return {
          date: dayData.date,
          totalRevenue: dayData.revenue,
          completedOrders: dayData.completedOrders,
          cancelledOrders: dayData.cancelledOrders,
          refundAmount: dayData.refundAmount,
          paymentBreakdown,
          topSellingItems: dayData.topSellingItems,
          topCustomers: dayData.topCustomers,
          hourlySales: dayData.hourlySales
        };
      }
    },
    enabled: !!date,
  });
}
