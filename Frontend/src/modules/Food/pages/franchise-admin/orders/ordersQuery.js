import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { adminClient } from "@/services/api/axios";

const emptyStores = [];
const deliveryPartners = [];
const reorderAnalytics = {};
const cancelledAnalytics = { cancelledTodayCount: 0, customerCancellationsCount: 0, storeCancellationsCount: 0, refundPendingCount: 0, totalOrdersCount: 0, cancelledOrdersCount: 0, mostCommonReason: "", refundAmountThisMonth: 0, cancelledRevenue: 0, averageRefundTime: "", highestCancellationStore: "", highestCancellationStorePercentage: "" };
const emptyCancellationTrend = [];
const emptyCancellationReasons = [];
const emptyStoreCancellations = [];
const emptyRefundStatusDistribution = [];
const refundTransactions = [];
const refundAnalytics = { refundAmountToday: 0, refundAmountThisMonth: 0, highestRefundStore: "", averageRefundValue: 0, refundSuccessRate: "" };
const emptyRefundTrend = [];
const emptyStoreRefundChart = [];

// A franchise admin watches orders; the store changes them (accept, kitchen, rider, cancel). There is no franchise
// endpoint for these, so outside standalone mode the actions refuse instead of changing a local copy.
const READ_ONLY = "Orders are updated by the store. A franchise admin can view them but not change them.";

// Orders come from the backend (read-only for the franchise admin); refunds / issues below are still local.
let dbOrders = [];
// Wallet refunds the store managers of this franchise asked for (GET /food/franchise/refunds). Approving credits the
// customer's wallet at once; there is no later "process" step.
let dbRefundRequests = [];
const REFUND_UI_STATUS = { pending: "Pending", processing: "Pending", processed: "Processed", rejected: "Rejected", failed: "Failed" };
const mapRefundRequest = (r) => ({
  requestId: r.id,
  orderNumber: r.orderNumber,
  customer: { name: r.customerName || "Customer", phone: "" },
  store: { storeId: r.storeId || "", storeName: r.storeName || "", name: r.storeName || "" },
  refundAmount: Number(r.amount) || 0,
  refundStatus: REFUND_UI_STATUS[r.status] || r.status,
  requestedAt: r.createdAt,
  processedAt: r.processedAt || null,
  reason: r.reason || "",
  description: r.reason || "",
  attachments: [],
  approvedBy: r.status === "processed" ? "Franchise Admin" : "",
  paymentTransactionId: "",
  paymentInfo: { processedAmount: r.status === "processed" ? Number(r.amount) || 0 : 0, processingDate: r.processedAt || null },
  timeline: [
    { status: "Requested", updatedBy: "Store Manager", timestamp: r.createdAt, remarks: r.reason || "" },
    ...(r.status === "processed" ? [{ status: "Approved", updatedBy: "Franchise Admin", timestamp: r.processedAt, remarks: "Credited to the customer's wallet." }] : []),
    ...(r.status === "rejected" ? [{ status: "Rejected", updatedBy: "Franchise Admin", timestamp: r.processedAt, remarks: r.rejectionReason || "" }] : []),
  ],
});
export const syncRefundRequests = async () => {
  try {
    const res = await adminClient.get("/food/franchise/refunds", { params: { status: "All" }, _isFallback: true });
    const list = res?.data?.data?.refunds;
    dbRefundRequests = Array.isArray(list) ? list.map(mapRefundRequest) : [];
    notifyListeners();
  } catch (err) {
    toast.error(err?.response?.data?.message || "Could not load the refund requests");
  }
};
let dbRefundTransactions = [...refundTransactions];

// Simple Pub/Sub for Query Invalidation
const listeners = new Set();
const notifyListeners = () => {
  listeners.forEach((listener) => listener());
};

const FRANCHISE_STATUS = {
  payment_verified: "Pending",
  awaiting_confirmation: "Pending",
  confirmed: "Confirmed",
  preparing: "Preparing",
  baking: "Baking",
  packaging: "Packed",
  ready: "Ready For Pickup",
  out_for_delivery: "Out For Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const toFranchiseOrder = (o) => {
  const status = o.deliveryPartnerId && o.status === "ready" ? "Rider Assigned" : FRANCHISE_STATUS[o.status] || "Pending";
  const addr = o.deliveryAddress || {};
  const staffNames = Object.values(o.assignedStaff || {}).filter(Boolean).map((p) => p.name);
  const online = o.paymentMethod !== "COD";
  return {
    id: o._id,
    orderNumber: o.orderNumber,
    customer: {
      name: o.customer?.name || "Customer",
      phone: o.customer?.phone || "",
      email: o.customer?.email || "",
      avatar: "",
      address: [addr.houseNumber, addr.landmark, addr.city, addr.pincode].filter(Boolean).join(", "),
      coords: null,
    },
    store: { storeId: o.storeId, name: o.storeName || "Store" },
    orderType: "Delivery",
    placedAt: o.createdAt,
    estimatedDeliveryTime: o.expectedReadyAt || o.createdAt,
    orderStatus: status,
    pricing: {
      subtotal: o.subtotal,
      tax: o.taxes,
      deliveryFee: o.deliveryCharges,
      discount: o.discountAmount,
      total: o.grandTotal,
    },
    paymentMethod: online ? "Online" : "Cash",
    paymentStatus: o.paymentStatus === "paid" ? "Paid" : o.paymentStatus === "refunded" ? "Refunded" : "Pending",
    transactionId: "",
    couponApplied: null,
    deliveryPartner: o.deliveryPartnerId
      ? { riderId: o.deliveryPartnerId, name: o.deliveryPartner?.name || "Assigned rider", vehicleType: [o.deliveryPartner?.vehicleType, o.deliveryPartner?.vehicleName].filter(Boolean).join(" · "), phone: o.deliveryPartner?.phone || "" }
      : null,
    deliveryProof: o.delivery || null,
    items: (o.items || []).map((i) => ({
      productId: i.productId,
      productName: i.name,
      variant: [i.size, i.variant].filter(Boolean).join(" / "),
      quantity: i.quantity,
      price: i.unitPrice,
      image: i.image,
      specialInstructions: [...(i.customizations?.extraToppings || []).map((t) => `+ ${t}`), i.customizations?.specialInstructions].filter(Boolean).join(", "),
    })),
    timeline: (o.timeline || []).map((t) => ({ status: t.status, updatedBy: t.note || "System", timestamp: t.timestamp })),
    remarks: o.kitchenNote || "",
    kitchen: { supervisor: o.kitchenSupervisor?.name || "", staff: staffNames, stage: o.kitchenStage },
    ...(status === "Cancelled" ? {
      cancellation: {
        cancelledBy: o.orderStatus === "cancelled_by_user" ? "Customer" : "Store",
        role: o.orderStatus === "cancelled_by_user" ? "CUSTOMER" : "STORE",
        reason: o.cancelReason || "Cancelled",
        remarks: "",
        refundRequired: online && o.paymentStatus !== "pending",
        refundAmount: online ? o.grandTotal : 0,
        refundStatus: o.refundStatus === "processed" ? "Completed" : "Pending",
        createdAt: o.createdAt,
      },
    } : {}),
  };
};

let syncTimer = null;

export const syncFranchiseOrders = async () => {
  try {
    const res = await adminClient.get("/food/franchise/orders", { params: { limit: 200 }, _isFallback: true });
    const list = res?.data?.data;
    if (Array.isArray(list)) {
      dbOrders = list.map(toFranchiseOrder);
      notifyListeners();
    }
  } catch (err) {
    console.warn("Could not load franchise orders:", err?.message);
  }
};

// Polls while at least one screen is subscribed, so new orders and kitchen progress appear live.
const subscribe = (listener) => {
  listeners.add(listener);
  if (listeners.size === 1) {
    syncFranchiseOrders();
    syncTimer = setInterval(syncFranchiseOrders, 8000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  };
};

// Hook for Live Orders list query
export function useLiveOrders(filters = {}) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(() => {
    setIsLoading(true);
    // Simulate network delay
    const timer = setTimeout(() => {
      let filtered = [...dbOrders];

      // Filters
      if (filters.storeId && filters.storeId !== "all") {
        filtered = filtered.filter((o) => o.store.storeId === filters.storeId);
      }
      if (filters.status && filters.status !== "all") {
        filtered = filtered.filter((o) => o.orderStatus === filters.status);
      }
      if (filters.paymentStatus && filters.paymentStatus !== "all") {
        filtered = filtered.filter((o) => o.paymentStatus === filters.paymentStatus);
      }
      if (filters.riderId && filters.riderId !== "all") {
        if (filters.riderId === "unassigned") {
          filtered = filtered.filter((o) => !o.deliveryPartner);
        } else {
          filtered = filtered.filter((o) => o.deliveryPartner?.riderId === filters.riderId);
        }
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(query) ||
            o.customer.name.toLowerCase().includes(query) ||
            o.customer.phone.includes(query)
        );
      }

      setData(filtered);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [
    filters.storeId,
    filters.status,
    filters.paymentStatus,
    filters.riderId,
    filters.searchQuery,
  ]);

  useEffect(() => {
    fetchOrders();
    return subscribe(fetchOrders);
  }, [fetchOrders]);

  return {
    data,
    isLoading,
    refetch: fetchOrders,
  };
}

// Hook for fetching a single order details
export function useOrder(orderId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(() => {
    if (!orderId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const order = dbOrders.find((o) => o.id === orderId);
      if (order) {
        setData(order);
        setError(null);
      } else {
        setError(new Error("Order not found"));
        setData(null);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    return subscribe(fetchOrder);
  }, [fetchOrder]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchOrder,
  };
}

// Hook for fetching stores
export function useStores() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const update = () => {
      const seen = new Map();
      dbOrders.forEach((o) => seen.set(o.store.storeId, { storeId: o.store.storeId, storeName: o.store.name }));
      setData([...seen.values()]);
      setIsLoading(false);
    };
    update();
    return subscribe(update);
  }, []);

  return { data, isLoading };
}

// Hook for fetching delivery partners
export function useDeliveryPartners(availableOnly = false) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      let riders = [...deliveryPartners];
      if (availableOnly) {
        riders = riders.filter((r) => r.available);
      }
      setData(riders);
      setIsLoading(false);
    }, 200);
    return () => clearTimeout(timer);
  }, [availableOnly]);

  return { data, isLoading };
}

// Mutation: Update Order Status
export function useUpdateOrderStatus() {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ orderId, status, remarks, updatedBy = "Franchise Admin" }) => {
    throw new Error(READ_ONLY);
    
  };

  const mutate = (variables, options = {}) => {
    mutateAsync(variables)
      .then((data) => {
        if (options.onSuccess) options.onSuccess(data);
      })
      .catch((err) => {
        if (options.onError) options.onError(err);
      });
  };

  return { mutate, mutateAsync, isLoading };
}

// Mutation: Assign Rider
export function useAssignRider() {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ orderId, riderId, estimatedPickupTime, notes }) => {
    throw new Error(READ_ONLY);
    
  };

  const mutate = (variables, options = {}) => {
    mutateAsync(variables)
      .then((data) => {
        if (options.onSuccess) options.onSuccess(data);
      })
      .catch((err) => {
        if (options.onError) options.onError(err);
      });
  };

  return { mutate, mutateAsync, isLoading };
}

// Mutation: Cancel Order
export function useCancelOrder() {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ orderId, reason, remarks, notifyCustomer }) => {
    throw new Error(READ_ONLY);
    
  };

  const mutate = (variables, options = {}) => {
    mutateAsync(variables)
      .then((data) => {
        if (options.onSuccess) options.onSuccess(data);
      })
      .catch((err) => {
        if (options.onError) options.onError(err);
      });
  };

  return { mutate, mutateAsync, isLoading };
}


// Hook for Completed Orders list query
export function useCompletedOrders(filters = {}) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = dbOrders.filter((o) => o.orderStatus === "Delivered");

      // Filter by Store
      if (filters.storeId && filters.storeId !== "all") {
        filtered = filtered.filter((o) => o.store.storeId === filters.storeId);
      }
      // Filter by Rider
      if (filters.riderId && filters.riderId !== "all") {
        filtered = filtered.filter((o) => o.deliveryPartner?.riderId === filters.riderId);
      }
      // Filter by Rating
      if (filters.rating && filters.rating !== "all") {
        const targetRating = Number(filters.rating);
        filtered = filtered.filter((o) => o.rating?.rating === targetRating);
      }
      // Filter by Min / Max Amount
      if (filters.minAmount) {
        filtered = filtered.filter((o) => o.pricing.total >= Number(filters.minAmount));
      }
      if (filters.maxAmount) {
        filtered = filtered.filter((o) => o.pricing.total <= Number(filters.maxAmount));
      }
      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(query) ||
            o.customer.name.toLowerCase().includes(query) ||
            o.customer.phone.includes(query)
        );
      }

      setData(filtered);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [
    filters.storeId,
    filters.riderId,
    filters.rating,
    filters.minAmount,
    filters.maxAmount,
    filters.searchQuery,
  ]);

  useEffect(() => {
    fetchOrders();
    return subscribe(fetchOrders);
  }, [fetchOrders]);

  return {
    data,
    isLoading,
    refetch: fetchOrders,
  };
}

export function useOrderDetails(orderId) {
  return useOrder(orderId);
}

export function useOrderReview(orderId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      const order = dbOrders.find((o) => o.id === orderId);
      setData(order?.rating || null);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [orderId]);

  return { data, isLoading };
}

export function useInvoice(orderId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      const order = dbOrders.find((o) => o.id === orderId);
      setData(order || null);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [orderId]);

  return { data, isLoading };
}

export function useReorderAnalytics(orderId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      const analytics = reorderAnalytics[orderId] || {
        lifetimeOrders: 4,
        previousOrderCount: 3,
        avgSpend: 320,
        repeatFrequency: "Once every 10 days",
        favoriteCategory: "Margherita Crusts",
        recommendedUpsell: [
          { productName: "Cheesy Garlic Bread", price: 150, image: "https://images.unsplash.com/photo-1573145959986-a142c6e68ea8?w=100" }
        ],
        mostOrderedProducts: [
          { name: "Double Cheese Margherita Pizza", count: 3, spend: 1197 }
        ],
        chartData: [
          { month: "Apr", orders: 1 },
          { month: "May", orders: 2 },
          { month: "Jun", orders: 1 }
        ]
      };
      setData(analytics);
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [orderId]);

  return { data, isLoading };
}

// Hook for Cancelled Orders list query
export function useCancelledOrders(filters = {}) {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = dbOrders.filter((o) => o.orderStatus === "Cancelled");

      // Filter by Store
      if (filters.storeId && filters.storeId !== "all") {
        filtered = filtered.filter((o) => o.store.storeId === filters.storeId);
      }
      
      // Filter by Cancellation Type (role/cancellation.role or cancellation type)
      if (filters.cancellationType && filters.cancellationType !== "all") {
        const type = filters.cancellationType;
        if (type === "Cancelled By Customer") {
          filtered = filtered.filter((o) => o.cancellation?.role === "CUSTOMER" && o.cancellation?.reason !== "Payment Failure");
        } else if (type === "Cancelled By Store") {
          filtered = filtered.filter((o) => o.cancellation?.role === "STORE");
        } else if (type === "Cancelled By System") {
          filtered = filtered.filter((o) => o.cancellation?.role === "SYSTEM" && o.cancellation?.reason !== "Payment Failure");
        } else if (type === "Payment Failure") {
          filtered = filtered.filter((o) => o.cancellation?.reason === "Payment Failure");
        }
      }

      // Filter by Refund Status
      if (filters.refundStatus && filters.refundStatus !== "all") {
        filtered = filtered.filter((o) => o.cancellation?.refundStatus === filters.refundStatus);
      }

      // Filter by search query
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (o) =>
            o.orderNumber.toLowerCase().includes(query) ||
            o.customer.name.toLowerCase().includes(query) ||
            o.customer.phone.includes(query)
        );
      }

      setData(filtered);
      setIsLoading(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [
    filters.storeId,
    filters.cancellationType,
    filters.refundStatus,
    filters.searchQuery,
  ]);

  useEffect(() => {
    fetchOrders();
    return subscribe(fetchOrders);
  }, [fetchOrders]);

  return {
    data,
    isLoading,
    refetch: fetchOrders,
  };
}

// Hook for fetching a single cancelled order details
export function useCancelledOrderDetails(orderId) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrder = useCallback(() => {
    if (!orderId) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const timer = setTimeout(() => {
      const order = dbOrders.find((o) => o.id === orderId && o.orderStatus === "Cancelled");
      if (order) {
        setData(order);
        setError(null);
      } else {
        setError(new Error("Cancelled order not found"));
        setData(null);
      }
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
    return subscribe(fetchOrder);
  }, [fetchOrder]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchOrder,
  };
}

// Hook for fetching refund data summary
export function useRefundData() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      const cancelled = dbOrders.filter((o) => o.orderStatus === "Cancelled");
      const pendingRefunds = cancelled.filter((o) => o.cancellation?.refundStatus === "Pending");
      const initiatedRefunds = cancelled.filter((o) => o.cancellation?.refundStatus === "Initiated");
      const completedRefunds = cancelled.filter((o) => o.cancellation?.refundStatus === "Completed");
      const totalRefundAmount = completedRefunds.reduce((sum, o) => sum + (o.cancellation?.refundAmount || 0), 0);

      setData({
        pendingCount: pendingRefunds.length,
        initiatedCount: initiatedRefunds.length,
        completedCount: completedRefunds.length,
        totalAmount: totalRefundAmount,
        refundsList: cancelled.map(o => ({
          orderId: o.id,
          orderNumber: o.orderNumber,
          amount: o.cancellation?.refundAmount || 0,
          status: o.cancellation?.refundStatus || "None",
          method: o.refund?.refundMethod || "UPI"
        }))
      });
      setIsLoading(false);
    }, 205);
    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

// Hook for cancellation analytics and chart data
export function useCancellationAnalytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Aggregate dynamically from dbOrders
      const cancelled = dbOrders.filter((o) => o.orderStatus === "Cancelled");
      const customerCancellations = cancelled.filter((o) => o.cancellation?.role === "CUSTOMER" && o.cancellation?.reason !== "Payment Failure");
      const storeCancellations = cancelled.filter((o) => o.cancellation?.role === "STORE");
      const refundPending = cancelled.filter((o) => o.cancellation?.refundStatus === "Pending");
      
      const totalCount = dbOrders.length;
      const cancelledCount = cancelled.length;
      const cancellationRate = totalCount > 0 ? ((cancelledCount / totalCount) * 100).toFixed(1) : "0.0";

      // Sum of refunds processed
      const refundAmountThisMonth = cancelled
        .filter(o => o.cancellation?.refundStatus === "Completed")
        .reduce((sum, o) => sum + (o.cancellation?.refundAmount || 0), 0);

      // Total revenue lost
      const cancelledRevenue = cancelled.reduce((sum, o) => sum + o.pricing.total, 0);

      setData({
        kpis: {
          cancelledToday: cancelled.filter(o => {
            const orderDate = new Date(o.placedAt);
            const diffTime = Math.abs(new Date() - orderDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 1;
          }).length,
          customerCancellations: customerCancellations.length,
          storeCancellations: storeCancellations.length,
          refundPending: refundPending.length,
          cancellationPercentage: `${cancellationRate}%`,
          mostCommonReason: cancelledAnalytics.mostCommonReason,
          refundAmountThisMonth,
          cancelledRevenue,
          averageRefundTime: cancelledAnalytics.averageRefundTime,
          highestCancellationStore: cancelledAnalytics.highestCancellationStore,
          highestCancellationStorePercentage: cancelledAnalytics.highestCancellationStorePercentage
        },
        cancellationTrend: emptyCancellationTrend,
        cancellationReasons: emptyCancellationReasons,
        storeCancellations: emptyStoreCancellations,
        refundStatusDistribution: emptyRefundStatusDistribution
      });
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  return { data, isLoading };
}

// Mutation: Initiate Refund
export function useRefundRequests(filters = {}) {
  const [data, setData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRefundRequests = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...dbRefundRequests];

      // Filter by Status
      if (filters.status && filters.status !== "all") {
        filtered = filtered.filter((r) => r.refundStatus.toLowerCase() === filters.status.toLowerCase());
      }

      // Filter by Store
      if (filters.storeId && filters.storeId !== "all") {
        filtered = filtered.filter((r) => r.store.storeId === filters.storeId);
      }

      // Filter by Amount Range
      if (filters.minAmount) {
        filtered = filtered.filter((r) => r.refundAmount >= Number(filters.minAmount));
      }
      if (filters.maxAmount) {
        filtered = filtered.filter((r) => r.refundAmount <= Number(filters.maxAmount));
      }

      // Filter by Search Query (ID or Order Number)
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase().trim();
        filtered = filtered.filter(
          (r) =>
            r.requestId.toLowerCase().includes(query) ||
            r.orderNumber.toLowerCase().includes(query) ||
            r.customer.name.toLowerCase().includes(query) ||
            r.customer.phone.includes(query)
        );
      }

      // Filter by Date presets
      if (filters.datePreset && filters.datePreset !== "all") {
        const now = new Date();
        filtered = filtered.filter((r) => {
          const reqDate = new Date(r.requestedAt);
          const diffTime = Math.abs(now - reqDate);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (filters.datePreset === "today") return diffDays <= 1;
          if (filters.datePreset === "yesterday") return diffDays > 1 && diffDays <= 2;
          if (filters.datePreset === "week") return diffDays <= 7;
          if (filters.datePreset === "month") return diffDays <= 30;
          return true;
        });
      }

      // Sorting: default to requestedAt descending
      filtered.sort((a, b) => new Date(b.requestedAt) - new Date(a.requestedAt));

      setTotalCount(filtered.length);

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const startIndex = (page - 1) * limit;
      const paginated = filtered.slice(startIndex, startIndex + limit);

      setData(paginated);
      setIsLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [
    filters.status,
    filters.storeId,
    filters.minAmount,
    filters.maxAmount,
    filters.searchQuery,
    filters.datePreset,
    filters.page,
    filters.limit,
  ]);

  useEffect(() => {
    syncRefundRequests();
  }, []);

  useEffect(() => {
    fetchRefundRequests();
    return subscribe(fetchRefundRequests);
  }, [fetchRefundRequests]);

  return {
    data,
    totalCount,
    isLoading,
    refetch: fetchRefundRequests,
  };
}

// Hook for fetching a single refund request
export function useRefundRequest(id) {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRefundRequest = useCallback(() => {
    if (!id) {
      setData(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const timer = setTimeout(() => {
      const request = dbRefundRequests.find((r) => r.requestId === id);
      if (request) {
        setData(request);
        setError(null);
      } else {
        setError(new Error("Refund request not found"));
      }
      setIsLoading(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [id]);

  useEffect(() => {
    fetchRefundRequest();
    return subscribe(fetchRefundRequest);
  }, [fetchRefundRequest]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchRefundRequest,
  };
}

// Hook for fetching refund analytics totals
export function useRefundAnalytics() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      const pending = dbRefundRequests.filter((r) => r.refundStatus === "Pending").length;
      const approved = dbRefundRequests.filter((r) => r.refundStatus === "Approved").length;
      const processed = dbRefundRequests.filter((r) => r.refundStatus === "Processed").length;

      // Sum of refundAmount
      const refundAmountVal = dbRefundRequests
        .filter((r) => r.refundStatus !== "Rejected")
        .reduce((sum, r) => sum + r.refundAmount, 0);

      // Average Resolution Time (difference between processedAt and requestedAt)
      const processedRequests = dbRefundRequests.filter(
        (r) => r.refundStatus === "Processed" && r.processedAt && r.requestedAt
      );
      let avgResolutionDays = 0; // no processed refunds yet
      if (processedRequests.length > 0) {
        const totalMs = processedRequests.reduce((sum, r) => {
          const start = new Date(r.requestedAt);
          const end = new Date(r.processedAt);
          return sum + (end - start);
        }, 0);
        const avgMs = totalMs / processedRequests.length;
        const avgDays = avgMs / (1000 * 60 * 60 * 24);
        avgResolutionDays = Number(avgDays.toFixed(1));
      }

      // Add other properties
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const refundToday = dbRefundRequests
        .filter((r) => r.refundStatus === "Processed" && new Date(r.processedAt) >= todayStart)
        .reduce((sum, r) => sum + r.refundAmount, 0);

      setData({
        pendingCount: pending,
        approvedCount: approved,
        processedCount: processed,
        totalRefundAmount: refundAmountVal,
        avgResolutionTime: `${avgResolutionDays} Days`,
        refundAmountToday: refundToday || 0,
        refundAmountThisMonth: refundAnalytics.refundAmountThisMonth,
        highestRefundStore: refundAnalytics.highestRefundStore,
        averageRefundValue: refundAnalytics.averageRefundValue,
        refundSuccessRate: refundAnalytics.refundSuccessRate,
      });
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchAnalytics();
    return subscribe(fetchAnalytics);
  }, [fetchAnalytics]);

  return { data, isLoading };
}

// Hook for fetching chart-specific datasets
export function useRefundChartData() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchChartData = useCallback(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      // Build dynamic status distribution counts
      const pending = dbRefundRequests.filter((r) => r.refundStatus === "Pending").length;
      const approved = dbRefundRequests.filter((r) => r.refundStatus === "Approved").length;
      const rejected = dbRefundRequests.filter((r) => r.refundStatus === "Rejected").length;
      const processed = dbRefundRequests.filter((r) => r.refundStatus === "Processed").length;

      const dynamicStatusDist = [
        { name: "Pending", value: pending, fill: "#f97316" },
        { name: "Approved", value: approved, fill: "#3b82f6" },
        { name: "Rejected", value: rejected, fill: "#ef4444" },
        { name: "Processed", value: processed, fill: "#10b981" },
      ];

      // Build dynamic reasons counts
      const reasonCounts = {
        "Food Quality": 0,
        "Wrong Order": 0,
        "Late Delivery": 0,
        "Damaged Packaging": 0,
        "Missing Items": 0,
        "Other": 0,
      };

      dbRefundRequests.forEach((r) => {
        if (reasonCounts[r.reason] !== undefined) {
          reasonCounts[r.reason]++;
        } else {
          reasonCounts["Other"]++;
        }
      });

      const dynamicReasonsDist = Object.keys(reasonCounts).map((key, index) => {
        const colors = ["#f97316", "#3b82f6", "#eab308", "#a855f7", "#ef4444", "#6b7280"];
        return {
          name: key,
          value: reasonCounts[key],
          fill: colors[index % colors.length],
        };
      });

      setData({
        refundTrend: emptyRefundTrend,
        refundStatusDistribution: dynamicStatusDist,
        refundReasonsDistribution: dynamicReasonsDist,
        storeRefundChart: emptyStoreRefundChart,
      });
      setIsLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchChartData();
    return subscribe(fetchChartData);
  }, [fetchChartData]);

  return { data, isLoading };
}

// ==========================================
// REFUND MUTATIONS
// ==========================================

// Mutation: Approve Refund Request
export function useApproveRefund() {
  const [isLoading, setIsLoading] = useState(false);

  // Approving credits the customer's wallet with the amount the store manager asked for
  const mutateAsync = async ({ requestId }) => {
    setIsLoading(true);
    try {
      await adminClient.post(`/food/franchise/refunds/${requestId}/approve`, {});
      await syncRefundRequests();
      toast.success("Refund approved. The customer's wallet has been credited.");
      return { success: true };
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Could not approve the refund");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const mutate = (variables, options = {}) => {
    mutateAsync(variables).then((data) => options.onSuccess?.(data)).catch((err) => options.onError?.(err));
  };

  return { mutate, mutateAsync, isLoading };
}

// Mutation: Reject Refund Request
export function useRejectRefund() {
  const [isLoading, setIsLoading] = useState(false);

  const mutateAsync = async ({ requestId, rejectionReason, remarks }) => {
    setIsLoading(true);
    try {
      await adminClient.post(`/food/franchise/refunds/${requestId}/reject`, { reason: [rejectionReason, remarks].filter(Boolean).join(" - ") });
      await syncRefundRequests();
      toast.success("Refund request rejected.");
      return { success: true };
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Could not reject the refund");
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const mutate = (variables, options = {}) => {
    mutateAsync(variables).then((data) => options.onSuccess?.(data)).catch((err) => options.onError?.(err));
  };

  return { mutate, mutateAsync, isLoading };
}

// Mutation: Process Refund (Approved -> Processed)
