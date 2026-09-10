import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { mockDailySales } from "../mockData";

export function useDailySales(filters = {}) {
  return useQuery({
    queryKey: ["daily-sales", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/reports/daily-sales", {
          params: filters,
        });
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        console.warn("Backend Daily Sales API offline, processing local mock calculations", err);

        const storeId = filters.storeId || "st-indore-01";
        const startDate = filters.startDate || "";
        const endDate = filters.endDate || "";
        const paymentMethod = filters.paymentMethod || "All";
        const orderType = filters.orderType || "All";

        // Filter the 30-day mock dataset by dates
        let filtered = [...mockDailySales];

        if (startDate && endDate) {
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime();
          filtered = filtered.filter(item => {
            const d = new Date(item.date).getTime();
            return d >= start && d <= end;
          });
        }

        // Handle case where date filters returned nothing (fallback to last 7 days)
        if (filtered.length === 0) {
          filtered = mockDailySales.slice(0, 7);
        }

        // Accumulate statistics
        let revenue = 0;
        let totalOrders = 0;
        let cashSales = 0;
        let onlineSales = 0;
        let cancelledRevenue = 0;
        let refundAmount = 0;
        let totalDiscounts = 0;
        let totalTaxes = 0;

        const paymentDistribution = { cash: 0, upi: 0, card: 0, wallet: 0 };
        const orderStatusDistribution = { completed: 0, cancelled: 0, refunded: 0 };

        // Aggregate hourly sales (sum or average)
        const hourlyMap = {};
        for (let h = 10; h <= 22; h++) {
          hourlyMap[`${h.toString().padStart(2, '0')}:00`] = 0;
        }

        filtered.forEach(day => {
          // Adjust figures based on paymentMethod filter
          let dayRevenue = day.revenue;
          let dayCash = day.paymentDistribution.cash;
          let dayUpi = day.paymentDistribution.upi;
          let dayCard = day.paymentDistribution.card;
          let dayWallet = day.paymentDistribution.wallet;
          let dayOnline = day.onlineSales;
          let dayDiscounts = day.discountAmount;
          let dayTaxes = day.taxAmount;

          if (paymentMethod !== "All") {
            const pMethod = paymentMethod.toLowerCase();
            if (pMethod === "cash") {
              dayRevenue = dayCash;
              dayUpi = 0;
              dayCard = 0;
              dayWallet = 0;
              dayOnline = 0;
              dayDiscounts = Math.floor(dayDiscounts * (dayCash / day.revenue));
              dayTaxes = Math.floor(dayTaxes * (dayCash / day.revenue));
            } else {
              dayCash = 0;
              if (pMethod === "upi") {
                dayRevenue = dayUpi;
                dayCard = 0;
                dayWallet = 0;
              } else if (pMethod === "card") {
                dayRevenue = dayCard;
                dayUpi = 0;
                dayWallet = 0;
              } else if (pMethod === "wallet") {
                dayRevenue = dayWallet;
                dayUpi = 0;
                dayCard = 0;
              }
              dayOnline = dayRevenue;
              dayDiscounts = Math.floor(dayDiscounts * (dayOnline / day.revenue));
              dayTaxes = Math.floor(dayTaxes * (dayOnline / day.revenue));
            }
          }

          // Adjust figures based on orderType filter
          if (orderType !== "All") {
            // Dine-in represents ~30%, Takeaway ~30%, Delivery ~40%
            let factor = 0.4;
            if (orderType.toLowerCase() === "dine-in") factor = 0.3;
            if (orderType.toLowerCase() === "takeaway") factor = 0.3;

            dayRevenue = Math.floor(dayRevenue * factor);
            dayCash = Math.floor(dayCash * factor);
            dayUpi = Math.floor(dayUpi * factor);
            dayCard = Math.floor(dayCard * factor);
            dayWallet = Math.floor(dayWallet * factor);
            dayOnline = dayUpi + dayCard + dayWallet;
            dayDiscounts = Math.floor(dayDiscounts * factor);
            dayTaxes = Math.floor(dayTaxes * factor);
          }

          revenue += dayRevenue;
          totalOrders += orderType !== "All" ? Math.floor(day.totalOrders * 0.35) : day.totalOrders;
          cashSales += dayCash;
          onlineSales += dayOnline;
          cancelledRevenue += orderType !== "All" ? Math.floor(day.cancelledRevenue * 0.35) : day.cancelledRevenue;
          refundAmount += orderType !== "All" ? Math.floor(day.refundAmount * 0.35) : day.refundAmount;
          totalDiscounts += dayDiscounts;
          totalTaxes += dayTaxes;

          paymentDistribution.cash += dayCash;
          paymentDistribution.upi += dayUpi;
          paymentDistribution.card += dayCard;
          paymentDistribution.wallet += dayWallet;

          orderStatusDistribution.completed += orderType !== "All" ? Math.floor(day.orderStatusDistribution.completed * 0.35) : day.orderStatusDistribution.completed;
          orderStatusDistribution.cancelled += orderType !== "All" ? Math.floor(day.orderStatusDistribution.cancelled * 0.35) : day.orderStatusDistribution.cancelled;
          orderStatusDistribution.refunded += orderType !== "All" ? Math.floor(day.orderStatusDistribution.refunded * 0.35) : day.orderStatusDistribution.refunded;

          // Hourly mapping aggregation
          day.hourlySales.forEach(hItem => {
            let hrRev = hItem.revenue;
            if (paymentMethod !== "All") {
              const pMethod = paymentMethod.toLowerCase();
              const ratio = pMethod === "cash" ? (day.paymentDistribution.cash / day.revenue) : (day.onlineSales / day.revenue);
              hrRev = Math.floor(hrRev * ratio);
            }
            if (orderType !== "All") {
              let factor = 0.4;
              if (orderType.toLowerCase() === "dine-in") factor = 0.3;
              if (orderType.toLowerCase() === "takeaway") factor = 0.3;
              hrRev = Math.floor(hrRev * factor);
            }
            hourlyMap[hItem.time] = (hourlyMap[hItem.time] || 0) + hrRev;
          });
        });

        const avgOrderValue = totalOrders > 0 ? Math.round(revenue / totalOrders) : 0;
        const salesGrowth = filtered.length > 0 ? filtered[0].salesGrowth : 0; // Growth comparison indicator

        // Format hourly sales array for recharts
        const revenueTrend = Object.keys(hourlyMap).map(time => ({
          time,
          revenue: Math.round(hourlyMap[time] / filtered.length) // average hourly revenue across filtered days
        }));

        // Format sales summary table list
        const salesSummary = filtered.map(day => {
          let dayRevenue = day.revenue;
          let dayCash = day.paymentDistribution.cash;
          let dayUpi = day.paymentDistribution.upi;
          let dayCard = day.paymentDistribution.card;
          let dayWallet = day.paymentDistribution.wallet;
          let dayDiscounts = day.discountAmount;
          let dayTaxes = day.taxAmount;
          let dayRefunds = day.refundAmount;
          let dayOrders = day.totalOrders;

          if (paymentMethod !== "All") {
            const pMethod = paymentMethod.toLowerCase();
            if (pMethod === "cash") {
              dayRevenue = dayCash;
              dayDiscounts = Math.floor(dayDiscounts * (dayCash / day.revenue));
              dayTaxes = Math.floor(dayTaxes * (dayCash / day.revenue));
              dayRefunds = Math.floor(dayRefunds * (dayCash / day.revenue));
            } else {
              const online = dayUpi + dayCard + dayWallet;
              dayRevenue = pMethod === "upi" ? dayUpi : pMethod === "card" ? dayCard : dayWallet;
              dayDiscounts = Math.floor(dayDiscounts * (dayRevenue / day.revenue));
              dayTaxes = Math.floor(dayTaxes * (dayRevenue / day.revenue));
              dayRefunds = Math.floor(dayRefunds * (dayRevenue / day.revenue));
            }
          }

          if (orderType !== "All") {
            let factor = 0.4;
            if (orderType.toLowerCase() === "dine-in") factor = 0.3;
            if (orderType.toLowerCase() === "takeaway") factor = 0.3;

            dayRevenue = Math.floor(dayRevenue * factor);
            dayDiscounts = Math.floor(dayDiscounts * factor);
            dayTaxes = Math.floor(dayTaxes * factor);
            dayRefunds = Math.floor(dayRefunds * factor);
            dayOrders = Math.floor(dayOrders * factor);
          }

          const netSales = dayRevenue - dayRefunds - dayDiscounts + dayTaxes;

          return {
            date: day.date,
            orders: dayOrders || 0,
            revenue: dayRevenue || 0,
            discounts: dayDiscounts || 0,
            taxes: dayTaxes || 0,
            refunds: dayRefunds || 0,
            netSales: netSales || 0,
            growth: day.salesGrowth || 0
          };
        });

        return {
          revenue,
          totalOrders,
          avgOrderValue,
          cashSales,
          onlineSales,
          cancelledRevenue,
          refundAmount,
          salesGrowth,
          revenueTrend,
          paymentDistribution,
          orderStatusDistribution,
          salesSummary
        };
      }
    }
  });
}
