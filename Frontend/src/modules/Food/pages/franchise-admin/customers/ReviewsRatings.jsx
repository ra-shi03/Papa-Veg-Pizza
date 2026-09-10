import React, { useState, useEffect } from "react";
import { Search, Download, RefreshCw, RotateCcw, Send } from "lucide-react";
import { useReviews } from "./hooks/useReviews";
import ReviewDrawer from "./components/ReviewDrawer";
import ReviewsAnalytics from "./components/ReviewsAnalytics";
import ReviewTable from "./components/ReviewTable";
import { 
  ReplyReviewModal, 
  EditReplyModal, 
  HideReviewModal, 
  PublishReviewModal, 
  DeleteReviewModal, 
  CustomerHistoryModal,
  ExportReviewsModal 
} from "./components/ReviewModals";
import { mockStores } from "./mockData";

export default function ReviewsRatings() {
  const useReviewsHook = useReviews();
  const {
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
    replyReview,
    editReply,
    deleteReply,
    hideReview,
    publishReview,
    deleteReview,
    exportReviews,
    refetch
  } = useReviewsHook;

  // Local Search State for Debounce
  const [localSearch, setLocalSearch] = useState(search);
  
  // Modals Visibility
  const [showReply, setShowReply] = useState(false);
  const [showEditReply, setShowEditReply] = useState(false);
  const [showHide, setShowHide] = useState(false);
  const [showPublish, setShowPublish] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showExport, setShowExport] = useState(false);
  
  // Drawer Visibility
  const [showDrawer, setShowDrawer] = useState(false);

  // Active Context review
  const [activeReview, setActiveReview] = useState(null);

  // Debouncing Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
      setCurrentPage(1);
    }, 400);

    return () => clearTimeout(handler);
  }, [localSearch, setSearch, setCurrentPage]);

  const handleActionClick = (rev, action) => {
    setActiveReview(rev);

    if (action === "view") {
      setShowDrawer(true);
    } else if (action === "reply") {
      setShowReply(true);
    } else if (action === "edit-reply") {
      setShowEditReply(true);
    } else if (action === "delete-reply") {
      if (window.confirm("Are you sure you want to delete this reply?")) {
        deleteReply(rev._id);
      }
    } else if (action === "hide") {
      setShowHide(true);
    } else if (action === "publish") {
      setShowPublish(true);
    } else if (action === "customer-history") {
      setShowHistory(true);
    } else if (action === "delete") {
      setShowDelete(true);
    }
  };

  return (
    <div className="p-3 md:p-5 max-w-7xl mx-auto space-y-4 text-xs bg-slate-50 dark:bg-zinc-950 min-h-screen text-zinc-700 dark:text-zinc-300">
      
      {/* Top Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Reviews & Ratings Desk
            </h1>
            <span className="bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-purple-500/20">
              Live DB
            </span>
          </div>
          <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-semibold">
            Monitor customer feedback, manage store reputation, reply to reviews, and view rating charts.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => setShowExport(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg shadow-sm font-bold text-zinc-750 dark:text-zinc-200 transition-all cursor-pointer"
          >
            <Download size={13} className="text-[var(--primary)]" />
            <span>Export Reviews</span>
          </button>
          
          <button 
            onClick={() => {
              const unreplied = reviews.find(r => !r.adminReply);
              if (unreplied) {
                handleActionClick(unreplied, "reply");
              } else {
                alert("No reviews awaiting reply in current list.");
              }
            }}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-[var(--primary)] text-white hover:opacity-95 rounded-lg shadow-sm font-bold uppercase transition-all cursor-pointer text-[10px]"
          >
            <Send size={12} />
            <span>Reply Queue</span>
          </button>
          
          <button 
            onClick={() => { refetch(); }}
            className="p-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 rounded-lg transition-all text-zinc-650 dark:text-zinc-300 cursor-pointer"
            title="Refresh database"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </header>

      {/* Analytics & Stats (Rendered via separate component) */}
      <ReviewsAnalytics stats={stats} analytics={analytics} />

      {/* Filter Section (Sticky) */}
      <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs space-y-3 sticky top-16 z-20">
        
        {/* Row 1: Search and Dropdowns */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          
          {/* Debounced Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search Customer, Order, Review..."
              value={localSearch}
              onChange={e => setLocalSearch(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Rating Filter */}
          <div>
            <select
              value={rating}
              onChange={e => { setRating(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Star Ratings</option>
              <option value="5">5★ Rating</option>
              <option value="4">4★ Rating</option>
              <option value="3">3★ Rating</option>
              <option value="2">2★ Rating</option>
              <option value="1">1★ Rating</option>
            </select>
          </div>

          {/* Store Filter */}
          <div>
            <select
              value={storeId}
              onChange={e => { setStoreId(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Store Outlets</option>
              {mockStores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Statuses</option>
              <option value="Published">Published Reviews</option>
              <option value="Hidden">Hidden Reviews</option>
            </select>
          </div>

          {/* Reply Status Filter */}
          <div>
            <select
              value={replyStatus}
              onChange={e => { setReplyStatus(e.target.value); setCurrentPage(1); }}
              className="w-full p-2 text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 focus:outline-none font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer"
            >
              <option value="All">All Reply Statuses</option>
              <option value="Replied">Replied Reviews</option>
              <option value="Awaiting Reply">Awaiting Response</option>
            </select>
          </div>

        </div>

        {/* Row 2: Date Filters & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase text-zinc-450">Date Submitted:</span>
            <div className="flex gap-1">
              {["All", "Today", "This Week", "This Month", "Custom"].map(opt => (
                <button
                  key={opt}
                  onClick={() => {
                    setDateFilter(opt);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                    dateFilter === opt 
                      ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" 
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                  }`}
                >
                  {opt === "Custom" ? "Custom Range" : opt}
                </button>
              ))}
            </div>

            {/* Custom Range Inputs */}
            {dateFilter === "Custom" && (
              <div className="flex items-center gap-1.5 ml-2 animate-fade-down">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={e => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="p-1 text-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded outline-none"
                />
                <span className="text-zinc-400 font-bold">-</span>
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={e => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="p-1 text-[10px] border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 rounded outline-none"
                />
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => {
                setLocalSearch("");
                setSearch("");
                setStoreId("All");
                setRating("All");
                setStatus("All");
                setReplyStatus("All");
                setDateFilter("All");
                setCustomDateRange({ start: "", end: "" });
                setSortBy("createdAt");
                setSortOrder("desc");
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 rounded-lg border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 font-bold transition-all text-zinc-650 dark:text-zinc-300 flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw size={12} />
              Reset Filters
            </button>
          </div>
        </div>

      </section>

      {/* Database Table & Pagination */}
      <ReviewTable
        reviews={reviews}
        loading={loading}
        totalCount={totalCount}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        pageSize={pageSize}
        setPageSize={setPageSize}
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        handleActionClick={handleActionClick}
        deleteReply={deleteReply}
      />

      {/* Slideout Detail Drawer */}
      <ReviewDrawer
        isOpen={showDrawer}
        onClose={() => setShowDrawer(false)}
        reviewId={activeReview?._id}
        useReviewsHook={useReviewsHook}
        onReplyClick={(r) => handleActionClick(r, "reply")}
        onEditReplyClick={(r) => handleActionClick(r, "edit-reply")}
        onDeleteReplyClick={(id) => {
          if (window.confirm("Are you sure you want to remove the response?")) {
            deleteReply(id);
          }
        }}
        onHideClick={(r) => handleActionClick(r, "hide")}
        onPublishClick={(r) => handleActionClick(r, "publish")}
        onDeleteClick={(id) => {
          if (window.confirm("Are you sure you want to delete this review?")) {
            deleteReview(id);
            setShowDrawer(false);
          }
        }}
      />

      {/* Modals Containers */}
      <ReplyReviewModal
        isOpen={showReply}
        onClose={() => setShowReply(false)}
        review={activeReview}
        onSubmit={replyReview}
      />

      <EditReplyModal
        isOpen={showEditReply}
        onClose={() => setShowEditReply(false)}
        review={activeReview}
        onSubmit={editReply}
      />

      <HideReviewModal
        isOpen={showHide}
        onClose={() => setShowHide(false)}
        review={activeReview}
        onSubmit={hideReview}
      />

      <PublishReviewModal
        isOpen={showPublish}
        onClose={() => setShowPublish(false)}
        review={activeReview}
        onConfirm={publishReview}
      />

      <DeleteReviewModal
        isOpen={showDelete}
        onClose={() => setShowDelete(false)}
        reviewId={activeReview?._id}
        onConfirm={deleteReview}
      />

      <CustomerHistoryModal
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        customerId={activeReview?.customerId}
      />

      <ExportReviewsModal
        isOpen={showExport}
        onClose={() => setShowExport(false)}
        onExport={exportReviews}
      />

    </div>
  );
}
