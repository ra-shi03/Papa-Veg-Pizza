import { useQuery } from "@tanstack/react-query";
import apiClient from "@/services/api/axios";
import { mockDetailedOrders } from "../mockData";

export function useOrderReports(filters = {}) {
  return useQuery({
    queryKey: ["order-reports", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/reports/orders", {
          params: filters,
        });
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        console.warn("Backend Order Reports API offline, processing local mock calculations", err);

        const startDate = filters.startDate || "";
        const endDate = filters.endDate || "";
        const status = filters.status || "All";
        const paymentMethod = filters.paymentMethod || "All";
        const orderType = filters.orderType || "All";
        const couponUsed = filters.couponUsed || "All";
        const search = filters.search || "";
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;

        let filtered = [...mockDetailedOrders];

        // 1. Filter by Date Range
        if (startDate && endDate) {
          const start = new Date(startDate).getTime();
          // Include the entire end day
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          const endTime = end.getTime();
          filtered = filtered.filter(o => {
            const time = new Date(o.createdAt).getTime();
            return time >= start && time <= endTime;
          });
        }

        // 2. Filter by Status
        if (status !== "All") {
          filtered = filtered.filter(o => o.orderStatus.toLowerCase() === status.toLowerCase());
        }

        // 3. Filter by Payment Method
        if (paymentMethod !== "All") {
          filtered = filtered.filter(o => {
            const pMethod = o.paymentMethod.toLowerCase();
            const filterMethod = paymentMethod.toLowerCase();
            if (filterMethod === "upi") return pMethod.includes("upi");
            if (filterMethod === "card") return pMethod.includes("card") || pMethod.includes("netbanking");
            if (filterMethod === "wallet") return pMethod.includes("wallet");
            return pMethod.includes(filterMethod);
          });
        }

        // 4. Filter by Order Type
        if (orderType !== "All") {
          filtered = filtered.filter(o => o.orderType.toLowerCase() === orderType.toLowerCase());
        }

        // 5. Filter by Coupon Used
        if (couponUsed !== "All") {
          if (couponUsed === "Coupon Applied") {
            filtered = filtered.filter(o => o.couponId !== null);
          } else if (couponUsed === "No Coupon") {
            filtered = filtered.filter(o => o.couponId === null);
          }
        }

        // 6. Filter by Search Query
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(o => 
            o.orderNumber.toLowerCase().includes(q) ||
            o.customer.name.toLowerCase().includes(q) ||
            o._id.toLowerCase().includes(q)
          );
        }

        // Calculate Dashboard Cards Metrics
        const totalCount = filtered.length;
        const completedCount = filtered.filter(o => o.orderStatus === "completed" || o.orderStatus === "delivered").length;
        const cancelledCount = filtered.filter(o => o.orderStatus === "cancelled").length;
        const refundCount = filtered.filter(o => o.orderStatus === "refunded").length;

        // Averages
        const prepOrders = filtered.filter(o => o.preparationTime > 0);
        const avgPrepTime = prepOrders.length > 0 
          ? Math.round(prepOrders.reduce((sum, o) => sum + o.preparationTime, 0) / prepOrders.length) 
          : 0;

        const delOrders = filtered.filter(o => o.orderType === "delivery" && o.deliveryTime > 0);
        const avgDeliveryTime = delOrders.length > 0 
          ? Math.round(delOrders.reduce((sum, o) => sum + o.deliveryTime, 0) / delOrders.length) 
          : 0;

        const couponOrders = filtered.filter(o => o.couponId !== null);
        const couponUsage = couponOrders.length;
        const couponPercentage = totalCount > 0 ? Math.round((couponUsage / totalCount) * 100) : 0;

        const dashboard = {
          totalOrders: totalCount,
          completedOrders: completedCount,
          cancelledOrders: cancelledCount,
          avgPreparationTime: avgPrepTime,
          avgDeliveryTime,
          refundOrders: refundCount,
          couponUsageCount: couponUsage,
          couponUsagePercentage: couponPercentage
        };

        // Charts: Orders By Status
        const statusDistribution = {
          completed: completedCount,
          cancelled: cancelledCount,
          refunded: refundCount,
          pending: filtered.filter(o => o.orderStatus === "pending" || o.orderStatus === "preparing" || o.orderStatus === "ready").length
        };

        // Charts: Peak Hours Analysis
        const hourlyMap = {};
        for (let h = 10; h <= 22; h++) {
          hourlyMap[`${h.toString().padStart(2, '0')}:00`] = 0;
        }
        filtered.forEach(o => {
          const date = new Date(o.createdAt);
          const hr = `${date.getHours().toString().padStart(2, '0')}:00`;
          if (hourlyMap[hr] !== undefined) {
            hourlyMap[hr] += 1;
          }
        });
        const hourlyOrders = Object.keys(hourlyMap).map(hour => ({
          hour,
          orders: hourlyMap[hour]
        }));

        // Charts: Order Type Distribution
        const typeDistribution = {
          delivery: { count: 0, revenue: 0 },
          takeaway: { count: 0, revenue: 0 },
          "dine-in": { count: 0, revenue: 0 }
        };
        filtered.forEach(o => {
          const type = o.orderType.toLowerCase();
          if (typeDistribution[type]) {
            typeDistribution[type].count += 1;
            typeDistribution[type].revenue += o.totalAmount;
          }
        });
        const orderTypeDistribution = Object.keys(typeDistribution).map(type => ({
          type: type.charAt(0).toUpperCase() + type.slice(1),
          count: typeDistribution[type].count,
          revenue: typeDistribution[type].revenue,
          percentage: totalCount > 0 ? Math.round((typeDistribution[type].count / totalCount) * 100) : 0
        }));

        // Order Analytics Table - Sorting (Default to createdAt desc)
        const sortBy = filters.sortBy || "createdAt";
        const sortOrder = filters.sortOrder || "desc";
        
        const sorted = [...filtered].sort((a, b) => {
          let valA = a[sortBy];
          let valB = b[sortBy];

          if (sortBy === "createdAt") {
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
          }

          if (typeof valA === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });

        // Table Pagination
        const pages = Math.ceil(sorted.length / limit) || 1;
        const startIdx = (page - 1) * limit;
        const paginatedOrders = sorted.slice(startIdx, startIdx + limit);

        const orderAnalytics = paginatedOrders.map(o => ({
          _id: o._id,
          orderNumber: o.orderNumber,
          customerName: o.customer.name,
          orderType: o.orderType,
          itemsCount: o.items.reduce((sum, item) => sum + item.quantity, 0),
          totalAmount: o.totalAmount,
          preparationTime: o.preparationTime,
          deliveryTime: o.deliveryTime,
          orderStatus: o.orderStatus,
          couponCode: o.coupon ? o.coupon.code : null,
          createdAt: o.createdAt
        }));

        return {
          dashboard,
          statusDistribution,
          hourlyOrders,
          orderTypeDistribution,
          orderAnalytics,
          pagination: {
            total: totalCount,
            page,
            limit,
            pages
          }
        };
      }
    }
  });
}
