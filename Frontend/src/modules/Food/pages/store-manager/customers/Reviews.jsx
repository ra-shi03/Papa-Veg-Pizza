import React, { useState, useMemo, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { RefreshCw, FileDown, Download, Check } from "lucide-react";
import { toast } from "sonner";

// Custom Hooks & Sub-components
import { useReviewsList } from "./hooks/useReviews";
import ReviewStatsCards from "./components/ReviewStatsCards";
import ReviewFilters from "./components/ReviewFilters";
import ReviewsTable from "./components/ReviewsTable";

// Modals
import ReviewDetailsModal from "./components/ReviewDetailsModal";
import ReplyToReviewModal from "./components/ReplyToReviewModal";
import CustomerHistoryModal from "./components/CustomerHistoryModal";
import OrderDetailsModal from "./components/OrderDetailsModal";

// Local fallback mock database imports for real-time stats calculation
import { mockReviews, mockCustomers, mockOrders, mockOrderItems } from "./mockData";

export default function Reviews() {
  const { role } = useOutletContext(); // Retrieve user role from outlet context

  // Auto-seed database if empty on mount to ensure user sees frontend reviews
  useEffect(() => {
    try {
      const val = localStorage.getItem("mock_db_customer_reviews");
      if (!val || val === "[]") {
        localStorage.setItem("mock_db_customer_reviews", JSON.stringify(mockReviews));
        localStorage.setItem("mock_db_customers", JSON.stringify(mockCustomers));
        localStorage.setItem("mock_db_store_orders", JSON.stringify(mockOrders));
        localStorage.setItem("mock_db_order_items", JSON.stringify(mockOrderItems));
        refetch();
      }
    } catch (_) {}
  }, []);

  // ----------------------------------------------------
  // States: Filters, Pagination & Sorting
  // ----------------------------------------------------
  const [filters, setFilters] = useState({
    search: "",
    rating: "All",
    sentiment: "All",
    replyStatus: "All",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
    sortBy: "createdAt",
    sortOrder: "desc"
  });

  // ----------------------------------------------------
  // States: Modal Visibility & Selected Items
  // ----------------------------------------------------
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const [modalVisibility, setModalVisibility] = useState({
    details: false,
    reply: false,
    history: false,
    order: false
  });

  // Fetch reviews data list using TanStack React Query
  const { data, isLoading, isError, refetch } = useReviewsList(filters);

  // ----------------------------------------------------
  // Dynamic Real-time Stats Calculation (Independent of table filters)
  // ----------------------------------------------------
  const stats = useMemo(() => {
    // Read from localStorage to reflect updates in real-time
    const localReviews = (() => {
      try {
        const val = localStorage.getItem("mock_db_customer_reviews");
        return val ? JSON.parse(val) : mockReviews;
      } catch (_) {
        return mockReviews;
      }
    })();

    const totalCount = localReviews.length;
    const totalRating = localReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalCount > 0 ? (totalRating / totalCount).toFixed(1) : "0.0";
    const fiveStarCount = localReviews.filter(r => r.rating === 5).length;
    const negativeCount = localReviews.filter(r => r.sentiment?.toLowerCase() === "negative").length;
    
    // Reviews in current active demo month (June 2026)
    const monthCount = localReviews.filter(r => r.createdAt.startsWith("2026-06")).length;
    const repliedCount = localReviews.filter(r => r.reply !== null && r.reply !== undefined).length;
    const pendingReplyCount = localReviews.filter(r => r.reply === null || r.reply === undefined).length;

    return {
      averageRating,
      fiveStarCount,
      negativeCount,
      monthCount,
      repliedCount,
      pendingReplyCount
    };
  }, [data]); // Re-calculate when query data changes (e.g. after invalidation/refetch)

  // ----------------------------------------------------
  // Callbacks: Filters, Pagination, & Sorting
  // ----------------------------------------------------
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (sortBy, sortOrder) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder,
      page: 1
    }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({
      ...prev,
      page: newPage
    }));
  };

  // ----------------------------------------------------
  // Interactive Dashboard Click Logic
  // ----------------------------------------------------
  const handleCardClick = (cardId) => {
    if (cardId === "fiveStar") {
      setFilters(prev => ({
        ...prev,
        rating: prev.rating === "5" ? "All" : "5",
        page: 1
      }));
      toast.success(filters.rating === "5" ? "Cleared 5 Star Filter" : "Filtered by 5 Star Reviews");
    } else if (cardId === "negative") {
      setFilters(prev => ({
        ...prev,
        sentiment: prev.sentiment === "Negative" ? "All" : "Negative",
        page: 1
      }));
      toast.success(filters.sentiment === "Negative" ? "Cleared Sentiment Filter" : "Filtered by Negative Sentiment");
    } else if (cardId === "replied") {
      setFilters(prev => ({
        ...prev,
        replyStatus: prev.replyStatus === "replied" ? "All" : "replied",
        page: 1
      }));
      toast.success(filters.replyStatus === "replied" ? "Cleared Reply Status Filter" : "Filtered by Replied Reviews");
    } else if (cardId === "pendingReply") {
      setFilters(prev => ({
        ...prev,
        replyStatus: prev.replyStatus === "pending" || prev.replyStatus === "pending_reply" ? "All" : "pending",
        page: 1
      }));
      toast.success(
        filters.replyStatus === "pending" || filters.replyStatus === "pending_reply"
          ? "Cleared Pending Status Filter"
          : "Filtered by Pending Replies"
      );
    }
  };

  // ----------------------------------------------------
  // Action Handlers (modals binding)
  // ----------------------------------------------------
  const handleActionClick = (action, payload) => {
    if (action === "viewReview") {
      setSelectedReviewId(payload);
      setModalVisibility(prev => ({ ...prev, details: true }));
    } else if (action === "reply") {
      if (role === "assistant_manager") {
        toast.error("Access Denied", {
          description: "Assistant Manager is restricted from responding to reviews."
        });
        return;
      }
      setSelectedReviewId(payload);
      setModalVisibility(prev => ({ ...prev, reply: true }));
    } else if (action === "viewHistory") {
      setSelectedCustomerId(payload);
      setModalVisibility(prev => ({ ...prev, history: true }));
    } else if (action === "viewOrder") {
      setSelectedOrderId(payload);
      setModalVisibility(prev => ({ ...prev, order: true }));
    } else if (action === "downloadReport") {
      toast.success("Downloading PDF Review Report...", {
        description: `Review dossier generated for ID: ${payload}`
      });
    }
  };

  const handleInnerReplyTrigger = (reviewId) => {
    setSelectedReviewId(reviewId);
    setModalVisibility(prev => ({
      ...prev,
      details: false,
      reply: true
    }));
  };

  // Export handlers
  const handleExportCSV = () => {
    toast.success("Generating CSV Data...", {
      description: "Downloading reviews spreadsheet breakdown."
    });
  };

  const handleDownloadReports = () => {
    toast.success("Compiling Review Sentiment PDF...", {
      description: "PDF report compiling for store owner."
    });
  };

  const handleRefresh = () => {
    try {
      localStorage.setItem("mock_db_customer_reviews", JSON.stringify(mockReviews));
      localStorage.setItem("mock_db_customers", JSON.stringify(mockCustomers));
      localStorage.setItem("mock_db_store_orders", JSON.stringify(mockOrders));
      localStorage.setItem("mock_db_order_items", JSON.stringify(mockOrderItems));
    } catch (_) {}
    refetch();
    toast.success("Reviews database re-seeded & synced successfully.");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Customer Reviews
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs mt-1 font-semibold leading-normal">
            Monitor customer feedback, sentiment analysis, food quality, and customer satisfaction.
          </p>
        </div>
        
        {/* Actions Button Grid */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-neutral-50 dark:bg-zinc-850 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
          >
            <FileDown size={13} className="text-zinc-400" />
            <span>Export Reviews</span>
          </button>

          <button
            onClick={handleDownloadReports}
            className="flex items-center gap-1.5 px-4.5 py-2.5 bg-neutral-50 dark:bg-zinc-850 hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-805 transition-all cursor-pointer shadow-sm"
          >
            <Download size={13} className="text-zinc-400" />
            <span>Download Reports</span>
          </button>

          <button
            onClick={handleRefresh}
            className="p-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-2xl transition-all cursor-pointer shadow-sm shadow-[var(--primary)]/10"
            title="Refresh Data"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* DASHBOARD CARDS */}
      <ReviewStatsCards
        stats={stats}
        isLoading={isLoading}
        onCardClick={handleCardClick}
        activeFilters={filters}
      />

      {/* FILTER SECTION */}
      <ReviewFilters
        filters={filters}
        onFilterChange={handleFilterChange}
      />

      {/* REVIEWS TABLE */}
      <ReviewsTable
        reviews={data?.reviews || []}
        pagination={data?.pagination || {}}
        isLoading={isLoading}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        onSortChange={handleSortChange}
        onPageChange={handlePageChange}
        onActionClick={handleActionClick}
        userRole={role}
      />

      {/* ----------------------------------------------------
          MODALS INTEGRATION
      ---------------------------------------------------- */}
      {/* 1. Review Details Modal */}
      <ReviewDetailsModal
        visible={modalVisibility.details}
        onClose={() => setModalVisibility(prev => ({ ...prev, details: false }))}
        reviewId={selectedReviewId}
        onReplyTrigger={handleInnerReplyTrigger}
        userRole={role}
      />

      {/* 2. Reply to Review Modal */}
      <ReplyToReviewModal
        visible={modalVisibility.reply}
        onClose={() => setModalVisibility(prev => ({ ...prev, reply: false }))}
        reviewId={selectedReviewId}
        userRole={role}
      />

      {/* 3. Customer History Modal */}
      <CustomerHistoryModal
        visible={modalVisibility.history}
        onClose={() => setModalVisibility(prev => ({ ...prev, history: false }))}
        customerId={selectedCustomerId}
        onViewOrder={(orderId) => {
          setSelectedOrderId(orderId);
          setModalVisibility(prev => ({
            ...prev,
            history: false,
            order: true
          }));
        }}
      />

      {/* 4. Connected Order Details Modal */}
      <OrderDetailsModal
        visible={modalVisibility.order}
        onClose={() => setModalVisibility(prev => ({ ...prev, order: false }))}
        orderId={selectedOrderId}
      />
    </div>
  );
}
