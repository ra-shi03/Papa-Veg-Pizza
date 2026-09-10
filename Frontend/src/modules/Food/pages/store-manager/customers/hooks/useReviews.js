import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";
import { mockReviews, mockCustomers, mockOrders, mockOrderItems } from "../mockData";

// Local Storage Keys
const REVIEWS_STORAGE_KEY = "mock_db_customer_reviews";
const CUSTOMER_STORAGE_KEY = "mock_db_customers";
const STORE_ORDERS_STORAGE_KEY = "mock_db_store_orders";
const ORDER_ITEMS_STORAGE_KEY = "mock_db_order_items";

const getLocalData = (key, defaultVal) => {
  try {
    const val = localStorage.getItem(key);
    if (val) {
      const parsed = JSON.parse(val);
      // Self-healing migration for reviews
      if (key === REVIEWS_STORAGE_KEY && parsed.length > 0 && !parsed.some(r => r.sentiment)) {
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

// 1. Fetch Reviews List
export function useReviewsList(filters = {}) {
  return useQuery({
    queryKey: ["reviews", filters],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/reviews", {
          params: filters,
        });
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        console.warn("Backend Reviews API offline, applying local mock filters");

        const localReviews = getLocalData(REVIEWS_STORAGE_KEY, mockReviews);
        const localCustomers = getLocalData(CUSTOMER_STORAGE_KEY, mockCustomers);
        const localOrders = getLocalData(STORE_ORDERS_STORAGE_KEY, mockOrders);

        const search = filters.search || "";
        const rating = filters.rating || "All";
        const sentiment = filters.sentiment || "All";
        const replyStatus = filters.replyStatus || "All";
        const startDate = filters.startDate || "";
        const endDate = filters.endDate || "";
        const page = Number(filters.page) || 1;
        const limit = Number(filters.limit) || 10;
        const sortBy = filters.sortBy || "createdAt";
        const sortOrder = filters.sortOrder || "desc";

        let filtered = [...localReviews];

        // Search
        if (search) {
          const q = search.toLowerCase();
          filtered = filtered.filter(r => {
            const customer = localCustomers.find(cust => cust._id === r.customerId);
            return customer && (
              customer.name.toLowerCase().includes(q) ||
              customer.email.toLowerCase().includes(q) ||
              customer.mobile.includes(q)
            );
          });
        }

        // Rating
        if (rating && rating !== "All") {
          const ratingNum = Number(rating.replace(/[^0-9]/g, ""));
          if (!isNaN(ratingNum)) {
            filtered = filtered.filter(r => r.rating === ratingNum);
          }
        }

        // Sentiment
        if (sentiment && sentiment !== "All") {
          filtered = filtered.filter(r => r.sentiment.toLowerCase() === sentiment.toLowerCase());
        }

        // Reply status
        if (replyStatus && replyStatus !== "All") {
          if (replyStatus.toLowerCase() === "replied") {
            filtered = filtered.filter(r => r.reply !== null && r.reply !== undefined);
          } else if (replyStatus.toLowerCase() === "pending" || replyStatus.toLowerCase() === "pending_reply") {
            filtered = filtered.filter(r => r.reply === null || r.reply === undefined);
          }
        }

        // Date range
        if (startDate && endDate) {
          const start = new Date(startDate).getTime();
          const end = new Date(endDate).getTime();
          filtered = filtered.filter(r => {
            const d = new Date(r.createdAt).getTime();
            return d >= start && d <= end;
          });
        }

        // Joins
        const reviewsWithDetails = filtered.map(r => {
          const customer = localCustomers.find(cust => cust._id === r.customerId);
          const order = localOrders.find(ord => ord._id === r.orderId);
          return {
            ...r,
            customerName: customer ? customer.name : "Unknown",
            customerMobile: customer ? customer.mobile : "",
            customerEmail: customer ? customer.email : "",
            orderNumber: order ? order.orderNumber : "N/A"
          };
        });

        // Sorting
        reviewsWithDetails.sort((a, b) => {
          let valA, valB;
          if (sortBy === "createdAt") {
            valA = new Date(a.createdAt).getTime();
            valB = new Date(b.createdAt).getTime();
            return sortOrder === "asc" ? valA - valB : valB - valA;
          } else if (sortBy === "rating") {
            valA = a.rating;
            valB = b.rating;
          } else if (sortBy === "sentiment") {
            valA = a.sentiment;
            valB = b.sentiment;
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

        const totalCount = reviewsWithDetails.length;
        const pages = Math.ceil(totalCount / limit);
        const start = (page - 1) * limit;
        const paginated = reviewsWithDetails.slice(start, start + limit);

        return {
          reviews: paginated,
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

// 2. Fetch Single Review Details
export function useReviewDetails(reviewId) {
  return useQuery({
    queryKey: ["reviewDetails", reviewId],
    queryFn: async () => {
      try {
        const response = await apiClient.get(`/store/reviews/${reviewId}`);
        if (response.data?.success && response.data?.data) {
          return response.data.data;
        }
        throw new Error("Invalid API format");
      } catch (err) {
        console.warn("Backend Review Details API offline, applying local mock query");

        const localReviews = getLocalData(REVIEWS_STORAGE_KEY, mockReviews);
        const localCustomers = getLocalData(CUSTOMER_STORAGE_KEY, mockCustomers);
        const localOrders = getLocalData(STORE_ORDERS_STORAGE_KEY, mockOrders);
        const localItems = getLocalData(ORDER_ITEMS_STORAGE_KEY, mockOrderItems);

        const review = localReviews.find(r => r._id === reviewId);
        if (!review) throw new Error("Review not found");

        const customer = localCustomers.find(cust => cust._id === review.customerId) || null;
        const order = localOrders.find(ord => ord._id === review.orderId) || null;
        let orderItems = [];
        if (order) {
          orderItems = localItems.filter(it => it.orderId === order._id);
        }

        // Stats
        let customerStatistics = { totalOrders: 0, totalSpent: 0, loyaltyPoints: 0, averageRatingGiven: 0 };
        if (customer) {
          const allCustReviews = localReviews.filter(r => r.customerId === customer._id);
          const totalCustRating = allCustReviews.reduce((sum, r) => sum + r.rating, 0);
          customerStatistics = {
            totalOrders: customer.totalOrders,
            totalSpent: customer.totalSpent,
            loyaltyPoints: customer.loyaltyPoints,
            averageRatingGiven: allCustReviews.length > 0 ? (totalCustRating / allCustReviews.length).toFixed(1) : 0
          };
        }

        return {
          review,
          customer,
          order,
          orderItems,
          customerStatistics
        };
      }
    },
    enabled: !!reviewId
  });
}

// 3. Reply to Review Mutation
export function useReplyToReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, text, repliedBy }) => {
      try {
        const response = await apiClient.post(`/store/reviews/${reviewId}/reply`, { text, repliedBy });
        return response.data?.data || response.data;
      } catch (err) {
        console.warn("Backend Reply Review API offline, updating local mock state");

        const localReviews = getLocalData(REVIEWS_STORAGE_KEY, mockReviews);
        const reviewIdx = localReviews.findIndex(r => r._id === reviewId);
        if (reviewIdx === -1) throw new Error("Review not found");

        const review = localReviews[reviewIdx];
        const updated = {
          ...review,
          reply: {
            text,
            repliedBy: repliedBy || "Store Manager",
            repliedAt: new Date().toISOString()
          }
        };

        localReviews[reviewIdx] = updated;
        setLocalData(REVIEWS_STORAGE_KEY, localReviews);

        return updated;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviewDetails", variables.reviewId] });
      toast.success("Manager reply published successfully!");
    },
    onError: () => {
      toast.error("Failed to publish reply");
    }
  });
}
