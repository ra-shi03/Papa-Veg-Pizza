import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { mockComplaints, mockCustomers, mockOrders, mockStaff } from "../mockData";

// Local Storage Keys
const COMPLAINTS_STORAGE_KEY = "mock_db_customer_complaints";
const CUSTOMER_STORAGE_KEY = "mock_db_customers";
const STORE_ORDERS_STORAGE_KEY = "mock_db_store_orders";
const ORDER_ITEMS_STORAGE_KEY = "mock_db_order_items";
const REFUNDS_STORAGE_KEY = "mock_db_refunds";

const getLocalData = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    if (val) {
      const parsed = JSON.parse(val);
      if (key === COMPLAINTS_STORAGE_KEY && parsed.length > 0 && !parsed.some(c => c.priority)) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
        return defaultVal;
      }
      return parsed;
    }
    return defaultVal;
  } catch (_) {
    return defaultVal;
  }
};

const setLocalData = (key, val) => {
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (_) {}
};

// 1. Fetch Complaints List (Paginated & Filtered)
export function useComplaintsList(filters = {}) {
  return useQuery({
    queryKey: ["complaints", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/complaints", {
          params: filters,
        });
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        console.warn("Backend Complaints API offline, applying local mock filters");

        const localComplaints = getLocalData(COMPLAINTS_STORAGE_KEY, mockComplaints);
        const localCustomers = getLocalData(CUSTOMER_STORAGE_KEY, mockCustomers);
        const localOrders = getLocalData(STORE_ORDERS_STORAGE_KEY, mockOrders);

        const search = filters.search || "";
        const complaintType = filters.complaintType || "";
        const priority = filters.priority || "";
        const status = filters.status || "";
        const startDate = filters.startDate || "";
        const endDate = filters.endDate || "";
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const sortBy = filters.sortBy || "createdAt";
        const sortOrder = filters.sortOrder || "desc";

        let filtered = [...localComplaints];

        // Filter by search
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(c => {
            const customer = localCustomers.find(cust => cust._id === c.customerId);
            const order = localOrders.find(ord => ord._id === c.orderId);
            return (
              c._id.toLowerCase().includes(q) ||
              c.description.toLowerCase().includes(q) ||
              c.complaintType.toLowerCase().includes(q) ||
              (customer && (
                customer.name.toLowerCase().includes(q) ||
                customer.email.toLowerCase().includes(q) ||
                customer.mobile.includes(q)
              )) ||
              (order && order.orderNumber.toLowerCase().includes(q))
            );
          });
        }

        // Filter by type
        if (complaintType && complaintType !== "All") {
          filtered = filtered.filter(c => c.complaintType.toLowerCase() === complaintType.toLowerCase());
        }

        // Filter by priority
        if (priority && priority !== "All") {
          filtered = filtered.filter(c => c.priority.toLowerCase() === priority.toLowerCase());
        }

        // Filter by status
        if (status && status !== "All") {
          filtered = filtered.filter(c => c.status.toLowerCase() === status.toLowerCase());
        }

        // Date range
        if (startDate && endDate) {
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime();
          filtered = filtered.filter(c => {
            const d = new Date(c.createdAt).getTime();
            return d >= start && d <= end;
          });
        }

        // Join customer profile summary and order details
        const complaintsWithDetails = filtered.map(c => {
          const customer = localCustomers.find(cust => cust._id === c.customerId);
          const order = localOrders.find(ord => ord._id === c.orderId);
          return {
            ...c,
            customerName: customer ? customer.name : "Unknown",
            customerMobile: customer ? customer.mobile : "",
            customerEmail: customer ? customer.email : "",
            orderNumber: order ? order.orderNumber : "N/A"
          };
        });

        // Sorting
        complaintsWithDetails.sort((a, b) => {
          let valA, valB;
          if (sortBy === "createdAt") {
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
            return sortOrder === "asc" ? valA - valB : valB - valA;
          } else if (sortBy === "priority") {
            const priorityOrder = { low: 1, medium: 2, high: 3, critical: 4 };
            valA = priorityOrder[a.priority.toLowerCase()] || 0;
            valB = priorityOrder[b.priority.toLowerCase()] || 0;
          } else if (sortBy === "status") {
            valA = a.status;
            valB = b.status;
          } else if (sortBy === "complaintType") {
            valA = a.complaintType;
            valB = b.complaintType;
          } else if (sortBy === "customerName") {
            valA = a.customerName;
            valB = b.customerName;
          } else {
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
            return sortOrder === "asc" ? valA - valB : valB - valA;
          }

          if (typeof valA === "string") {
            return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
          }
          return sortOrder === "asc" ? (valA || 0) - (valB || 0) : (valB || 0) - (valA || 0);
        });

        const totalCount = complaintsWithDetails.length;
        const pages = Math.ceil(totalCount / limit);
        const start = (page - 1) * limit;
        const paginated = complaintsWithDetails.slice(start, start + limit);

        return {
          complaints: paginated,
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

// 2. Fetch Single Complaint Details
export function useComplaintDetails(complaintId) {
  return useQuery({
    queryKey: ["complaintDetails", complaintId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/store/complaints/${complaintId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API response format");
      } catch (err) {
        console.warn("Backend Complaint Details API offline, applying local mock fetch");

        const localComplaints = getLocalData(COMPLAINTS_STORAGE_KEY, mockComplaints);
        const localCustomers = getLocalData(CUSTOMER_STORAGE_KEY, mockCustomers);
        const localOrders = getLocalData(STORE_ORDERS_STORAGE_KEY, mockOrders);
        const localItems = getLocalData(ORDER_ITEMS_STORAGE_KEY, []);

        const complaint = localComplaints.find(c => c._id === complaintId);
        if (!complaint) throw new Error("Complaint not found locally");

        const customer = localCustomers.find(cust => cust._id === complaint.customerId) || null;
        const order = localOrders.find(ord => ord._id === complaint.orderId) || null;
        let orderItems = [];
        if (order) {
          orderItems = localItems.filter(it => it.orderId === order._id);
        }

        return {
          ...complaint,
          customer,
          order: order ? {
            ...order,
            items: orderItems
          } : null
        };
      }
    },
    enabled: !!complaintId
  });
}

// 3. Resolve Complaint Mutation
export function useResolveComplaint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ complaintId, data }) => {
      try {
        const response = await apiClient.put(`/store/complaints/${complaintId}/resolve`, data);
        return response.data?.data || response.data;
      } catch (err) {
        console.warn("Backend Resolve Complaint API offline, updating local storage");

        const localComplaints = getLocalData(COMPLAINTS_STORAGE_KEY, mockComplaints);
        const complaintIdx = localComplaints.findIndex(c => c._id === complaintId);
        if (complaintIdx === -1) throw new Error("Complaint not found");

        const complaint = localComplaints[complaintIdx];
        const refundAmount = Number(data?.refundAmount) || 0;
        const replacementOrderId = data?.replacementOrderId || "";
        const couponIssued = data?.couponIssued || "";
        const actionTaken = data?.actionTaken || "Resolved by store supervisor";
        const resolvedBy = data?.staff || data?.resolvedBy || "Store Manager";

        const updated = {
          ...complaint,
          status: "resolved",
          resolvedBy,
          updatedAt: new Date().toISOString(),
          resolution: {
            actionTaken,
            resolvedBy,
            refundAmount,
            replacementOrderId,
            couponIssued,
            evidenceImage: data?.evidenceImage || "",
            resolvedAt: new Date().toISOString()
          }
        };

        localComplaints[complaintIdx] = updated;
        setLocalData(COMPLAINTS_STORAGE_KEY, localComplaints);

        // Refund updates if applicable
        if (refundAmount > 0 && complaint.orderId) {
          const localOrders = getLocalData(STORE_ORDERS_STORAGE_KEY, mockOrders);
          const order = localOrders.find(o => o._id === complaint.orderId);
          if (order) {
            order.paymentStatus = "refunded";
            order.orderStatus = "refunded";
            setLocalData(STORE_ORDERS_STORAGE_KEY, localOrders);

            const refunds = getLocalData(REFUNDS_STORAGE_KEY, []);
            const refundExists = refunds.some(r => r.orderId === order._id);
            if (!refundExists) {
              refunds.unshift({
                _id: `ref-${Math.floor(100 + Math.random() * 900)}`,
                orderId: order._id,
                orderNumber: order.orderNumber,
                reason: complaint.description || "Customer Complaint / Quality Issues",
                amount: refundAmount,
                status: "approved",
                approvedBy: resolvedBy,
                createdAt: new Date().toISOString()
              });
              setLocalData(REFUNDS_STORAGE_KEY, refunds);
            }
          }
        }

        return updated;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      queryClient.invalidateQueries({ queryKey: ["complaintDetails", variables.complaintId] });
      queryClient.invalidateQueries({ queryKey: ["customerOrders"] });
      toast.success("Complaint resolved successfully!");
    },
    onError: () => {
      toast.error("Failed to resolve complaint");
    }
  });
}
