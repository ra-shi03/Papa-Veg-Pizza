import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { 
  mockReviewsExpanded, 
  mockReviewLogs, 
  mockStores
} from "../mockData";

// Initialize Local Mock DB in localStorage if it doesn't exist
const initReviewsDB = () => {
  if (!localStorage.getItem("pv_reviews_initialized")) {
    localStorage.setItem("pv_reviews", JSON.stringify(mockReviewsExpanded));
    localStorage.setItem("pv_review_logs", JSON.stringify(mockReviewLogs));
    localStorage.setItem("pv_reviews_initialized", "true");
  }
};

const getDB = (key) => JSON.parse(localStorage.getItem(key) || "[]");
const setDB = (key, data) => localStorage.setItem(key, JSON.stringify(data));

export function useReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search & Filter State
  const [search, setSearch] = useState("");
  const [storeId, setStoreId] = useState("All");
  const [rating, setRating] = useState("All");
  const [status, setStatus] = useState("All");
  const [replyStatus, setReplyStatus] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [customDateRange, setCustomDateRange] = useState({ start: "", end: "" });
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Stats State
  const [stats, setStats] = useState({
    totalReviews: 0,
    avgRating: 0,
    fiveStarCount: 0,
    hiddenCount: 0,
    awaitingReplyCount: 0,
    reputationScore: 0
  });

  // Analytics Chart Data
  const [analytics, setAnalytics] = useState({
    ratingTrend: [],
    starDistribution: [],
    storeRatings: []
  });

  // Detailed Review view
  const [reviewDetails, setReviewDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    initReviewsDB();
    fetchStatsAndAnalytics();
    fetchReviewsList();
  }, []);

  // Compute stats and compile Recharts data
  const fetchStatsAndAnalytics = useCallback(() => {
    initReviewsDB();
    const list = getDB("pv_reviews");
    const stores = mockStores;

    // Core Metrics
    const totalReviews = list.length;
    const ratingsSum = list.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = totalReviews > 0 ? parseFloat((ratingsSum / totalReviews).toFixed(1)) : 0;
    const fiveStarCount = list.filter(r => r.rating === 5).length;
    const hiddenCount = list.filter(r => r.status === "Hidden").length;
    const awaitingReplyCount = list.filter(r => !r.adminReply).length;

    // Reputation Score: weighted index (e.g. out of 100) based on ratings. 5★=100, 4★=80, 3★=60, 2★=30, 1★=0
    const weightedSum = list.reduce((sum, r) => {
      if (r.rating === 5) return sum + 100;
      if (r.rating === 4) return sum + 80;
      if (r.rating === 3) return sum + 60;
      if (r.rating === 2) return sum + 30;
      return sum; // 1 star gets 0 points
    }, 0);
    const reputationScore = totalReviews > 0 ? Math.round(weightedSum / totalReviews) : 0;

    setStats({
      totalReviews,
      avgRating,
      fiveStarCount,
      hiddenCount,
      awaitingReplyCount,
      reputationScore
    });

    // 1. Star Distribution pie chart data
    const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    list.forEach(r => {
      if (starCounts[r.rating] !== undefined) {
        starCounts[r.rating]++;
      }
    });
    const starDistribution = Object.keys(starCounts)
      .map(star => ({
        name: `${star}★`,
        value: starCounts[star],
        percentage: totalReviews > 0 ? Math.round((starCounts[star] / totalReviews) * 100) : 0
      }))
      .reverse(); // 5★ first

    // 2. Store-wise Ratings bar chart data
    const storeRatings = stores.map(store => {
      const storeReviews = list.filter(r => r.storeId === store.id);
      const storeAvg = storeReviews.length > 0
        ? parseFloat((storeReviews.reduce((sum, r) => sum + r.rating, 0) / storeReviews.length).toFixed(1))
        : 0;
      return {
        name: store.name.replace(" Branch", "").replace(" Zone", "").replace(" Hub", "").replace(" Central", ""),
        avgRating: storeAvg,
        total: storeReviews.length
      };
    });

    // 3. Ratings Trend line chart data (past 7 days daily averages)
    const ratingTrend = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      const dateString = date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      
      const dayReviews = list.filter(r => {
        const rDate = new Date(r.createdAt || r.date);
        return rDate.toDateString() === date.toDateString();
      });

      const dayAvg = dayReviews.length > 0
        ? parseFloat((dayReviews.reduce((sum, r) => sum + r.rating, 0) / dayReviews.length).toFixed(1))
        : 4.2; // default fallback for trend continuity in mock
      
      ratingTrend.push({
        date: dateString,
        avgRating: dayAvg
      });
    }

    setAnalytics({
      ratingTrend,
      starDistribution,
      storeRatings
    });
  }, []);

  // Fetch reviews list with filters
  const fetchReviewsList = useCallback(() => {
    setLoading(true);
    initReviewsDB();

    setTimeout(() => {
      const list = getDB("pv_reviews");
      const users = getDB("pv_users");
      const stores = mockStores;

      // Join customer information
      let result = list.map(r => {
        const cust = getDB("pv_customers").find(cu => cu._id === r.customerId) || {};
        const user = users.find(u => u._id === cust.userId) || {};
        const store = stores.find(s => s.id === r.storeId) || {};
        return {
          ...r,
          customerName: user.fullName || "Guest Customer",
          customerPhone: user.mobile || "N/A",
          customerEmail: user.email || "N/A",
          customerImage: user.profileImage || "",
          storeName: store.name || "N/A"
        };
      });

      // Filter by Search Query (Customer Name, Order ID, Review Text, Store Name)
      if (search.trim()) {
        const term = search.toLowerCase();
        result = result.filter(item => 
          item.customerName?.toLowerCase().includes(term) ||
          item.orderId?.toLowerCase().includes(term) ||
          item.reviewText?.toLowerCase().includes(term) ||
          item.storeName?.toLowerCase().includes(term)
        );
      }

      // Dropdown filters
      if (storeId !== "All") {
        result = result.filter(item => item.storeId === storeId);
      }
      if (rating !== "All") {
        result = result.filter(item => item.rating === Number(rating));
      }
      if (status !== "All") {
        result = result.filter(item => item.status === status);
      }
      if (replyStatus !== "All") {
        if (replyStatus === "Replied") {
          result = result.filter(item => !!item.adminReply);
        } else {
          result = result.filter(item => !item.adminReply);
        }
      }

      // Filter by Date Created Range
      if (dateFilter !== "All") {
        const now = new Date();
        const todayStr = now.toDateString();
        
        result = result.filter(item => {
          const created = new Date(item.createdAt || item.date);
          const diffTime = Math.abs(now - created);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          if (dateFilter === "Today") {
            return created.toDateString() === todayStr;
          }
          if (dateFilter === "This Week") {
            return diffDays <= 7;
          }
          if (dateFilter === "This Month") {
            return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
          }
          if (dateFilter === "Custom" && customDateRange.start && customDateRange.end) {
            const start = new Date(customDateRange.start);
            const end = new Date(customDateRange.end);
            end.setHours(23, 59, 59, 999);
            return created >= start && created <= end;
          }
          return true;
        });
      }

      // Sort
      result.sort((a, b) => {
        let valA = a[sortBy];
        let valB = b[sortBy];

        if (sortBy === "createdAt") {
          return sortOrder === "asc" 
            ? new Date(valA) - new Date(valB)
            : new Date(valB) - new Date(valA);
        }

        if (sortBy === "rating") {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }

        valA = String(valA || "").toLowerCase();
        valB = String(valB || "").toLowerCase();
        return sortOrder === "asc" ? valA.localeCompare(valB) : valB.localeCompare(valA);
      });

      // Pagination
      setTotalCount(result.length);
      const startIndex = (currentPage - 1) * pageSize;
      const paginatedList = result.slice(startIndex, startIndex + pageSize);
      setReviews(paginatedList);
      setLoading(false);
    }, 450);
  }, [search, storeId, rating, status, replyStatus, dateFilter, customDateRange, sortBy, sortOrder, currentPage, pageSize]);

  // Re-fetch when filters change
  useEffect(() => {
    fetchReviewsList();
  }, [fetchReviewsList]);

  // Fetch populated review details
  const fetchReviewDetails = useCallback((id) => {
    setLoadingDetails(true);
    initReviewsDB();

    setTimeout(() => {
      const list = getDB("pv_reviews");
      const users = getDB("pv_users");
      const orders = getDB("pv_orders");
      const stores = mockStores;
      const logs = getDB("pv_review_logs");

      const review = list.find(r => r._id === id);
      if (!review) {
        toast.error("Review not found");
        setLoadingDetails(false);
        return;
      }

      // Customer Info
      const cust = getDB("pv_customers").find(cu => cu._id === review.customerId) || {};
      const user = users.find(u => u._id === cust.userId) || {};
      const customerPopulated = {
        ...cust,
        ...user,
        _id: cust._id,
        userId: cust.userId
      };

      // Order Info
      const orderPopulated = orders.find(o => o.orderNumber === review.orderId || o._id === review.orderId) || null;

      // Filter logs
      const reviewLogs = logs.filter(l => l.reviewId === id);
      const storeObj = stores.find(s => s.id === review.storeId) || {};

      // Previous reviews by same customer
      const previousReviews = list.filter(r => r.customerId === review.customerId && r._id !== id);

      setReviewDetails({
        ...review,
        storeName: storeObj.name || "N/A",
        customer: customerPopulated,
        order: orderPopulated,
        logs: reviewLogs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
        previousReviews: previousReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });

      setLoadingDetails(false);
    }, 300);
  }, []);

  // 1. Reply to Review
  const replyReview = useCallback((id, data) => {
    initReviewsDB();
    const list = getDB("pv_reviews");
    const logs = getDB("pv_review_logs");

    const index = list.findIndex(r => r._id === id);
    if (index === -1) return false;

    list[index].adminReply = {
      message: data.replyMessage,
      date: new Date().toISOString(),
      createdBy: "Admin Shubham"
    };
    setDB("pv_reviews", list);

    logs.push({
      _id: `rlog-${Date.now()}`,
      reviewId: id,
      action: "Reply Added",
      oldValue: "",
      newValue: "Replied",
      performedBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_review_logs", logs);

    fetchReviewsList();
    fetchStatsAndAnalytics();
    fetchReviewDetails(id);

    toast.success("Response posted to review successfully");
    return true;
  }, [fetchReviewsList, fetchStatsAndAnalytics, fetchReviewDetails]);

  // 2. Edit Reply
  const editReply = useCallback((id, data) => {
    initReviewsDB();
    const list = getDB("pv_reviews");
    const logs = getDB("pv_review_logs");

    const index = list.findIndex(r => r._id === id);
    if (index === -1) return false;

    const oldMsg = list[index].adminReply?.message || "";
    list[index].adminReply = {
      ...list[index].adminReply,
      message: data.replyMessage,
      date: new Date().toISOString()
    };
    setDB("pv_reviews", list);

    logs.push({
      _id: `rlog-${Date.now()}`,
      reviewId: id,
      action: "Reply Edited",
      oldValue: oldMsg,
      newValue: data.replyMessage,
      performedBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_review_logs", logs);

    fetchReviewsList();
    fetchStatsAndAnalytics();
    fetchReviewDetails(id);

    toast.success("Review reply updated");
    return true;
  }, [fetchReviewsList, fetchStatsAndAnalytics, fetchReviewDetails]);

  // 3. Delete Reply
  const deleteReply = useCallback((id) => {
    initReviewsDB();
    const list = getDB("pv_reviews");
    const logs = getDB("pv_review_logs");

    const index = list.findIndex(r => r._id === id);
    if (index === -1) return false;

    const oldMsg = list[index].adminReply?.message || "";
    list[index].adminReply = null;
    setDB("pv_reviews", list);

    logs.push({
      _id: `rlog-${Date.now()}`,
      reviewId: id,
      action: "Reply Deleted",
      oldValue: oldMsg,
      newValue: "",
      performedBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_review_logs", logs);

    fetchReviewsList();
    fetchStatsAndAnalytics();
    fetchReviewDetails(id);

    toast.error("Review reply removed");
    return true;
  }, [fetchReviewsList, fetchStatsAndAnalytics, fetchReviewDetails]);

  // 4. Hide Review
  const hideReview = useCallback((id, data) => {
    initReviewsDB();
    const list = getDB("pv_reviews");
    const logs = getDB("pv_review_logs");

    const index = list.findIndex(r => r._id === id);
    if (index === -1) return false;

    const oldStatus = list[index].status;
    list[index].status = "Hidden";
    setDB("pv_reviews", list);

    logs.push({
      _id: `rlog-${Date.now()}`,
      reviewId: id,
      action: "Review Hidden",
      oldValue: oldStatus,
      newValue: "Hidden",
      performedBy: `Admin Shubham (${data.reason})`,
      createdAt: new Date().toISOString()
    });
    setDB("pv_review_logs", logs);

    fetchReviewsList();
    fetchStatsAndAnalytics();
    fetchReviewDetails(id);

    toast.warning("Review hidden from public feed");
    return true;
  }, [fetchReviewsList, fetchStatsAndAnalytics, fetchReviewDetails]);

  // 5. Publish Review
  const publishReview = useCallback((id) => {
    initReviewsDB();
    const list = getDB("pv_reviews");
    const logs = getDB("pv_review_logs");

    const index = list.findIndex(r => r._id === id);
    if (index === -1) return false;

    const oldStatus = list[index].status;
    list[index].status = "Published";
    setDB("pv_reviews", list);

    logs.push({
      _id: `rlog-${Date.now()}`,
      reviewId: id,
      action: "Review Published",
      oldValue: oldStatus,
      newValue: "Published",
      performedBy: "Admin Shubham",
      createdAt: new Date().toISOString()
    });
    setDB("pv_review_logs", logs);

    fetchReviewsList();
    fetchStatsAndAnalytics();
    fetchReviewDetails(id);

    toast.success("Review restored to public feed");
    return true;
  }, [fetchReviewsList, fetchStatsAndAnalytics, fetchReviewDetails]);

  // 6. Delete Review (Soft Delete)
  const deleteReview = useCallback((id, data) => {
    initReviewsDB();
    const list = getDB("pv_reviews");
    const logs = getDB("pv_review_logs");

    const filtered = list.filter(r => r._id !== id);
    setDB("pv_reviews", filtered);

    logs.push({
      _id: `rlog-${Date.now()}`,
      reviewId: id,
      action: "Review Deleted",
      oldValue: "Active",
      newValue: "Soft Deleted",
      performedBy: `Admin Shubham (${data?.reason || 'System request'})`,
      createdAt: new Date().toISOString()
    });
    setDB("pv_review_logs", logs);

    fetchReviewsList();
    fetchStatsAndAnalytics();
    toast.error("Review removed from database");
    return true;
  }, [fetchReviewsList, fetchStatsAndAnalytics]);

  // Export Reviews
  const exportReviews = useCallback((format, exportFilters) => {
    const list = getDB("pv_reviews");
    const users = getDB("pv_users");
    const stores = mockStores;

    let result = list.map(r => {
      const cust = getDB("pv_customers").find(cu => cu._id === r.customerId) || {};
      const user = users.find(u => u._id === cust.userId) || {};
      const storeObj = stores.find(s => s.id === r.storeId) || {};
      return {
        ...r,
        customerName: user.fullName || "Guest",
        storeName: storeObj.name || "N/A"
      };
    });

    if (exportFilters.storeId && exportFilters.storeId !== "All") {
      result = result.filter(item => item.storeId === exportFilters.storeId);
    }
    if (exportFilters.rating && exportFilters.rating !== "All") {
      result = result.filter(item => item.rating === Number(exportFilters.rating));
    }
    if (exportFilters.replyStatus && exportFilters.replyStatus !== "All") {
      if (exportFilters.replyStatus === "Replied") {
        result = result.filter(item => !!item.adminReply);
      } else {
        result = result.filter(item => !item.adminReply);
      }
    }
    if (exportFilters.dateRange && exportFilters.dateRange.start && exportFilters.dateRange.end) {
      const start = new Date(exportFilters.dateRange.start);
      const end = new Date(exportFilters.dateRange.end);
      end.setHours(23, 59, 59, 999);
      result = result.filter(item => {
        const created = new Date(item.createdAt);
        return created >= start && created <= end;
      });
    }

    if (result.length === 0) {
      toast.error("No reviews matches export filter criteria");
      return;
    }

    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `reviews_export_${timestamp}`;

    if (format === "CSV") {
      const headers = ["Review ID", "Customer", "Order ID", "Store", "Rating", "Review Text", "Tags", "Status", "Reply Date", "Admin Reply"];
      const csvContent = [
        headers.join(","),
        ...result.map(r => [
          r._id,
          `"${r.customerName.replace(/"/g, '""')}"`,
          r.orderId,
          r.storeName,
          r.rating,
          `"${(r.reviewText || "").replace(/"/g, '""')}"`,
          `"${(r.tags || []).join(", ")}"`,
          r.status,
          r.adminReply ? new Date(r.adminReply.date).toLocaleDateString("en-IN") : "Awaiting Reply",
          `"${(r.adminReply?.message || "").replace(/"/g, '""')}"`
        ].join(","))
      ].join("\n");

      const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("CSV download completed");
    } else if (format === "Excel") {
      const headers = ["Review ID", "Customer", "Order ID", "Store", "Rating", "Review Text", "Tags", "Status", "Reply Status", "Admin Reply"];
      const tableRows = result.map(r => `
        <tr>
          <td>${r._id}</td>
          <td>${r.customerName}</td>
          <td>${r.orderId}</td>
          <td>${r.storeName}</td>
          <td>${r.rating}★</td>
          <td>${r.reviewText || ""}</td>
          <td>${(r.tags || []).join(", ")}</td>
          <td>${r.status}</td>
          <td>${r.adminReply ? 'Replied' : 'Awaiting Reply'}</td>
          <td>${r.adminReply?.message || ""}</td>
        </tr>
      `).join("");

      const html = `
        <html>
          <head><meta charset="utf-8"></head>
          <body>
            <table border="1">
              <tr style="background:#f2f2f2; font-weight:bold;">
                ${headers.map(h => `<th>${h}</th>`).join("")}
              </tr>
              ${tableRows}
            </table>
          </body>
        </html>
      `;

      const blob = new Blob([html], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}.xls`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast.success("Excel download completed");
    } else if (format === "PDF") {
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTable }) => {
          const doc = new jsPDF({ orientation: 'landscape' });
          doc.setFontSize(16);
          doc.text('Customer Reviews & Ratings Report', 14, 15);
          doc.setFontSize(10);
          doc.text(`Generated: ${new Date().toLocaleString("en-IN")} | Total Records: ${result.length}`, 14, 22);

          const bodyData = result.map(r => [
            r._id,
            r.customerName,
            r.orderId,
            r.storeName,
            `${r.rating} Star`,
            r.reviewText || "No text review",
            (r.tags || []).join(", "),
            r.status,
            r.adminReply ? "Replied" : "Pending"
          ]);

          autoTable(doc, {
            head: [["ID", "Customer", "Order ID", "Store", "Rating", "Review Content", "Tags", "Status", "Reply"]],
            body: bodyData,
            startY: 28,
            styles: { fontSize: 8 }
          });

          doc.save(`${filename}.pdf`);
          toast.success("PDF download completed");
        });
      });
    }
  }, []);

  return {
    reviews,
    loading,
    totalCount,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    search,
    setSearch,
    storeId,
    setStoreId,
    rating,
    setRating,
    status,
    setStatus,
    replyStatus,
    setReplyStatus,
    dateFilter,
    setDateFilter,
    customDateRange,
    setCustomDateRange,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    stats,
    analytics,
    reviewDetails,
    loadingDetails,
    fetchReviewDetails,
    replyReview,
    editReply,
    deleteReply,
    hideReview,
    publishReview,
    deleteReview,
    exportReviews,
    refetch: fetchReviewsList
  };
}
