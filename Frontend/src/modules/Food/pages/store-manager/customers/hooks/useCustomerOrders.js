import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { mockCustomers, mockOrders, mockComplaints, mockReviews } from "../mockData";

// Fallback Mock Local Storage Keys for Customer DB
const CUSTOMER_STORAGE_KEY = "mock_db_customers";
const STORE_ORDERS_STORAGE_KEY = "mock_db_store_orders";
const REFUNDS_STORAGE_KEY = "mock_db_refunds";

// Helper to load fallback data
const getLocalData = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : defaultVal;
  } catch (_) {
    return defaultVal;
  }
};

const setLocalData = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {}
};

// 1. Fetch Customer Orders List (Paginated & Filtered)
export function useCustomerOrdersList(filters = {}) {
  return useQuery({
    queryKey: ["customerOrders", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/customers/orders", {
          params: filters,
        });

        // Backend response wraps it in response.data.data
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        } else if (response.data && response.data.customers) {
          return response.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        console.warn("Backend Customer Orders API offline, applying local mock filters");
        
        // Client side filtering fallback
        const localCust = getLocalData(CUSTOMER_STORAGE_KEY, mockCustomers);
        const localOrd = getLocalData(STORE_ORDERS_STORAGE_KEY, mockOrders);

        const search = filters.search || "";
        const status = filters.status || "";
        const paymentStatus = filters.paymentStatus || "";
        const returning = filters.returning === "true" || filters.returning === true;
        const highValue = filters.highValue === "true" || filters.highValue === true;
        const startDate = filters.startDate || "";
        const endDate = filters.endDate || "";
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const sortBy = filters.sortBy || "name";
        const sortOrder = filters.sortOrder || "asc";

        let filtered = [...localCust];

        // Search name/email/mobile
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(c => 
            c.name.toLowerCase().includes(q) || 
            c.email.toLowerCase().includes(q) || 
            c.mobile.includes(q)
          );
        }

        // Returning Customers
        if (returning) {
          filtered = filtered.filter(c => c.totalOrders > 1);
        }

        // High Value (Spent >= 5000)
        if (highValue) {
          filtered = filtered.filter(c => c.totalSpent >= 5000);
        }

        // Date range
        if (startDate && endDate) {
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime();
          filtered = filtered.filter(c => {
            const d = new Date(c.lastOrderDate).getTime();
            return d >= start && d <= end;
          });
        }

        // Join recent order details
        let customersWithOrders = filtered.map(c => {
          const cOrders = localOrd.filter(o => o.customerId === c._id);
          cOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          const latestOrder = cOrders[0] || null;
          return {
            ...c,
            recentOrder: latestOrder ? {
              _id: latestOrder._id,
              orderNumber: latestOrder.orderNumber,
              createdAt: latestOrder.createdAt,
              totalAmount: latestOrder.totalAmount,
              paymentStatus: latestOrder.paymentStatus,
              deliveryType: latestOrder.deliveryType,
              orderStatus: latestOrder.orderStatus
            } : null
          };
        });

        // Apply Order Status Filter
        if (status && status !== "All") {
          customersWithOrders = customersWithOrders.filter(c => 
            c.recentOrder && c.recentOrder.orderStatus.toLowerCase() === status.toLowerCase()
          );
        }

        // Apply Payment Status Filter
        if (paymentStatus && paymentStatus !== "All") {
          customersWithOrders = customersWithOrders.filter(c => 
            c.recentOrder && c.recentOrder.paymentStatus.toLowerCase() === paymentStatus.toLowerCase()
          );
        }

        // Sorting
        customersWithOrders.sort((a, b) => {
          let valA, valB;
          if (sortBy === "name") {
            valA = a.name;
            valB = b.name;
          } else if (sortBy === "mobile") {
            valA = a.mobile;
            valB = b.mobile;
          } else if (sortBy === "orderNumber") {
            valA = a.recentOrder ? a.recentOrder.orderNumber : "";
            valB = b.recentOrder ? b.recentOrder.orderNumber : "";
          } else if (sortBy === "lastOrderDate" || sortBy === "orderDate") {
            valA = a.lastOrderDate;
            valB = b.lastOrderDate;
          } else if (sortBy === "totalSpent" || sortBy === "orderAmount" || sortBy === "totalAmount") {
            valA = a.recentOrder ? a.recentOrder.totalAmount : 0;
            valB = b.recentOrder ? b.recentOrder.totalAmount : 0;
          } else if (sortBy === "totalOrders") {
            valA = a.totalOrders;
            valB = b.totalOrders;
          } else {
            valA = a.name;
            valB = b.name;
          }

          if (typeof valA === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });

        const totalCount = customersWithOrders.length;
        const pages = Math.ceil(totalCount / limit);
        const start = (page - 1) * limit;
        const paginated = customersWithOrders.slice(start, start + limit);

        return {
          customers: paginated,
          pagination: {
            total: totalCount,
            page,
            limit,
            pages
          }
        };
      }
    },
    placeholderData: (previousData) => previousData,
  });
}

// 2. Fetch Single Customer Profile
export function useCustomerProfile(customerId) {
  return useQuery({
    queryKey: ["customerProfile", customerId],
    queryFn: async () => {
      if (!customerId) return null;
      try {
        const response = await apiClient.get(`/store/customers/${customerId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        return response.data;
      } catch (err) {
        console.warn("Backend Customer Detail API offline, using local mock fallback");
        const localCust = getLocalData(CUSTOMER_STORAGE_KEY, mockCustomers);
        const localOrd = getLocalData(STORE_ORDERS_STORAGE_KEY, mockOrders);

        const customer = localCust.find(c => c._id === customerId);
        if (!customer) throw new Error("Customer not found");

        const recentOrders = localOrd.filter(o => o.customerId === customerId);
        recentOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        const complaints = mockComplaints.filter(c => c.customerId === customerId);
        const reviews = mockReviews.filter(r => r.customerId === customerId);

        return {
          customerProfile: customer,
          recentOrders,
          complaints,
          reviews
        };
      }
    },
    enabled: !!customerId,
  });
}

// 3. Fetch Single Order Details
export function useOrderDetails(orderId) {
  return useQuery({
    queryKey: ["orderDetails", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      try {
        const response = await apiClient.get(`/store/orders/${orderId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        return response.data;
      } catch (err) {
        console.warn("Backend Order Details API offline, using local mock fallback");
        const localCust = getLocalData(CUSTOMER_STORAGE_KEY, mockCustomers);
        const localOrd = getLocalData(STORE_ORDERS_STORAGE_KEY, mockOrders);

        const order = localOrd.find(o => o._id === orderId);
        if (!order) throw new Error("Order not found");

        const customer = localCust.find(c => c._id === order.customerId);
        
        // Mock items, payments, timelines, and refunds
        const items = [
          { name: "Veg Supreme Pizza", quantity: 1, price: 399, customizations: "Size: Large, Extra Cheese: Yes, Toppings: Onion, Capsicum", subtotal: 399 },
          { name: "Garlic Breadsticks", quantity: 1, price: 81, customizations: "None", subtotal: 81 }
        ];

        const payments = [
          { _id: `pay-${orderId}`, orderId, transactionId: "TXN102930283", amount: order.totalAmount, method: order.paymentMethod, status: order.paymentStatus === "paid" ? "success" : "pending", createdAt: order.createdAt }
        ];

        const deliveryTracking = [
          { status: "Order Placed", timestamp: order.createdAt },
          { status: "Kitchen Started", timestamp: new Date(new Date(order.createdAt).getTime() + 300000).toISOString() },
          { status: "Ready", timestamp: new Date(new Date(order.createdAt).getTime() + 900000).toISOString() }
        ];

        if (order.orderStatus === "delivered") {
          deliveryTracking.push(
            { status: "Rider Assigned", timestamp: new Date(new Date(order.createdAt).getTime() + 1000000).toISOString() },
            { status: "Out For Delivery", timestamp: new Date(new Date(order.createdAt).getTime() + 1100000).toISOString() },
            { status: "Delivered", timestamp: new Date(new Date(order.createdAt).getTime() + 2000000).toISOString() }
          );
        }

        const refunds = getLocalData(REFUNDS_STORAGE_KEY, []).filter(r => r.orderId === orderId);

        return {
          order: {
            ...order,
            customerName: customer ? customer.name : "Customer Name",
            customerEmail: customer ? customer.email : "N/A",
            customerMobile: customer ? customer.mobile : "N/A",
            storeName: "Papa Veg Pizza - Central Hub"
          },
          items,
          payments,
          deliveryTracking,
          refunds
        };
      }
    },
    enabled: !!orderId,
  });
}

// 4. Create Refund Mutation
export function useCreateRefund() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }) => {
      try {
        const response = await apiClient.post(`/store/orders/${orderId}/refund`, { reason });
        return response.data?.data || response.data;
      } catch (err) {
        console.warn("Backend Refund API offline, applying client-side refund status");
        
        // Mutate local storage
        const localOrd = getLocalData(STORE_ORDERS_STORAGE_KEY, mockOrders);
        const orderIdx = localOrd.findIndex(o => o._id === orderId);
        if (orderIdx !== -1) {
          localOrd[orderIdx].orderStatus = "refunded";
          localOrd[orderIdx].paymentStatus = "refunded";
          setLocalData(STORE_ORDERS_STORAGE_KEY, localOrd);
        }

        const refunds = getLocalData(REFUNDS_STORAGE_KEY, []);
        const newRefund = {
          _id: `ref-${Math.floor(100 + Math.random() * 900)}`,
          orderId,
          reason,
          amount: localOrd[orderIdx]?.totalAmount || 500,
          status: "pending",
          createdAt: new Date().toISOString()
        };
        refunds.unshift(newRefund);
        setLocalData(REFUNDS_STORAGE_KEY, refunds);

        return newRefund;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      queryClient.invalidateQueries({ queryKey: ["orderDetails", variables.orderId] });
      queryClient.invalidateQueries({ queryKey: ["customerProfile"] });
      toast.success("Refund request successfully created!");
    },
    onError: () => {
      toast.error("Failed to process refund request");
    }
  });
}
