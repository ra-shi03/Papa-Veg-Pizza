import React, { useState } from "react";
import { MoreVertical, Eye, MessageSquare, History, ShoppingBag, Download, ArrowUpDown, ChevronLeft, ChevronRight, Inbox, Image } from "lucide-react";
import RatingStars from "./RatingStars";
import SentimentBadge from "./SentimentBadge";
import ReviewStatusBadge from "./ReviewStatusBadge";
import { Skeleton } from "@food/components/ui/skeleton";

export default function ReviewsTable({
  reviews = [],
  pagination = {},
  isLoading,
  sortBy,
  sortOrder,
  onSortChange,
  onPageChange,
  onActionClick,
  userRole
}) {
  const [activeMenuId, setActiveMenuId] = useState(null);
  const isReadOnly = userRole === "assistant_manager";

  const handleSort = (field) => {
    const order = sortBy === field && sortOrder === "desc" ? "asc" : "desc";
    onSortChange(field, order);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const toggleMenu = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Close menus on click outside
  React.useEffect(() => {
    const closeAll = () => setActiveMenuId(null);
    window.addEventListener("click", closeAll);
    return () => window.removeEventListener("click", closeAll);
  }, []);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[420px] transition-all">
      {/* Table Container */}
      <div className="flex-1 overflow-x-auto relative">
        <table className="w-full text-left text-xs font-semibold border-collapse">
          {/* Sticky Header */}
          <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider sticky top-0 z-10">
            <tr>
              <th className="px-5 py-3 cursor-pointer select-none" onClick={() => handleSort("customerName")}>
                <div className="flex items-center gap-1">
                  <span>Customer</span>
                  <ArrowUpDown size={10} className="text-zinc-400" />
                </div>
              </th>
              <th className="px-5 py-3">Order Number</th>
              <th className="px-5 py-3 cursor-pointer select-none" onClick={() => handleSort("rating")}>
                <div className="flex items-center gap-1">
                  <span>Rating</span>
                  <ArrowUpDown size={10} className="text-zinc-400" />
                </div>
              </th>
              <th className="px-5 py-3">Review</th>
              <th className="px-5 py-3 cursor-pointer select-none" onClick={() => handleSort("sentiment")}>
                <div className="flex items-center gap-1">
                  <span>Sentiment</span>
                  <ArrowUpDown size={10} className="text-zinc-400" />
                </div>
              </th>
              <th className="px-5 py-3">Reply Status</th>
              <th className="px-5 py-3 cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                <div className="flex items-center gap-1">
                  <span>Created Date</span>
                  <ArrowUpDown size={10} className="text-zinc-400" />
                </div>
              </th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-5 py-4"><Skeleton className="h-4 w-28 rounded-md" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-16 rounded-md" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-12 rounded-md" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-44 rounded-md" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-14 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-16 rounded-full" /></td>
                  <td className="px-5 py-4"><Skeleton className="h-4 w-20 rounded-md" /></td>
                  <td className="px-5 py-4 text-right"><Skeleton className="h-7 w-7 rounded-lg inline-block" /></td>
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-24 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <div className="w-12 h-12 bg-zinc-50 dark:bg-zinc-800 text-zinc-400 rounded-full flex items-center justify-center">
                      <Inbox size={22} className="stroke-[1.5]" />
                    </div>
                    <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">No Reviews Found</h4>
                    <p className="text-[10px] text-zinc-400 max-w-sm leading-relaxed font-semibold">
                      We couldn't find any customer reviews matching the current filters or query terms.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              reviews.map((rev) => (
                <tr
                  key={rev._id}
                  className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/5 transition-colors cursor-pointer group"
                  onClick={() => onActionClick("viewReview", rev._id)}
                >
                  {/* Customer Context */}
                  <td className="px-5 py-3.5">
                    <div className="flex flex-col">
                      <span className="font-extrabold text-zinc-900 dark:text-white group-hover:text-[var(--primary)] transition-colors">
                        {rev.customerName}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-semibold">{rev.customerMobile}</span>
                    </div>
                  </td>

                  {/* Order Number */}
                  <td className="px-5 py-3.5">
                    <span 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (rev.orderId) onActionClick("viewOrder", rev.orderId);
                      }}
                      className="font-mono font-extrabold text-[10px] text-zinc-850 dark:text-zinc-300 hover:text-[var(--primary)] hover:underline"
                    >
                      {rev.orderNumber}
                    </span>
                  </td>

                  {/* Rating Stars */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <span className="font-black text-amber-500">{rev.rating}</span>
                      <RatingStars rating={rev.rating} size={10} />
                    </div>
                  </td>

                  {/* Review Text Box (Truncated with Image Indicator) */}
                  <td className="px-5 py-3.5 max-w-[280px]">
                    <div className="flex flex-col gap-1">
                      <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 leading-normal truncate" title={rev.reviewText}>
                        "{rev.reviewText}"
                      </p>
                      {rev.images && rev.images.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 self-start">
                          <Image size={9} />
                          <span>Includes Evidence ({rev.images.length})</span>
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Sentiment Badge */}
                  <td className="px-5 py-3.5">
                    <SentimentBadge sentiment={rev.sentiment} />
                  </td>

                  {/* Reply Status */}
                  <td className="px-5 py-3.5">
                    <ReviewStatusBadge hasReply={!!rev.reply} />
                  </td>

                  {/* Date Created */}
                  <td className="px-5 py-3.5 font-bold text-zinc-400 dark:text-zinc-500 text-[10px]">
                    {formatDate(rev.createdAt)}
                  </td>

                  {/* Actions Menu */}
                  <td className="px-5 py-3.5 text-right relative">
                    <button
                      onClick={(e) => toggleMenu(e, rev._id)}
                      className="p-1.5 bg-neutral-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400 rounded-lg transition-colors cursor-pointer inline-flex items-center"
                    >
                      <MoreVertical size={13} />
                    </button>

                    {/* Actions Dropdown */}
                    {activeMenuId === rev._id && (
                      <div 
                        className="absolute right-12 top-2 z-20 w-44 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl shadow-xl py-2 animate-in fade-in slide-in-from-top-1 duration-100 text-left font-semibold text-xs text-zinc-750 dark:text-zinc-350"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onActionClick("viewReview", rev._id);
                          }}
                          className="w-full px-4 py-2 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-900 dark:text-white"
                        >
                          <Eye size={12} className="text-zinc-400" />
                          <span>View Review</span>
                        </button>
                        
                        {!rev.reply && (
                          <button
                            disabled={isReadOnly}
                            onClick={() => {
                              setActiveMenuId(null);
                              onActionClick("reply", rev._id);
                            }}
                            className={`w-full px-4 py-2 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-900 dark:text-white ${
                              isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                            }`}
                          >
                            <MessageSquare size={12} className="text-zinc-400" />
                            <span>Reply to Review</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onActionClick("viewHistory", rev.customerId);
                          }}
                          className="w-full px-4 py-2 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-900 dark:text-white"
                        >
                          <History size={12} className="text-zinc-400" />
                          <span>Customer History</span>
                        </button>

                        {rev.orderId && (
                          <button
                            onClick={() => {
                              setActiveMenuId(null);
                              onActionClick("viewOrder", rev.orderId);
                            }}
                            className="w-full px-4 py-2 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center gap-2 text-zinc-900 dark:text-white"
                          >
                            <ShoppingBag size={12} className="text-zinc-400" />
                            <span>View Order Details</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setActiveMenuId(null);
                            onActionClick("downloadReport", rev._id);
                          }}
                          className="w-full px-4 py-2 hover:bg-neutral-50 dark:hover:bg-zinc-800 flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-850 mt-1 pt-2 text-zinc-900 dark:text-white"
                        >
                          <Download size={12} className="text-zinc-400" />
                          <span>Download Report</span>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!isLoading && reviews.length > 0 && (
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-4 text-xs font-semibold text-zinc-500">
          <div>
            Showing <strong className="text-zinc-900 dark:text-white">{(pagination.page - 1) * pagination.limit + 1}</strong> to{" "}
            <strong className="text-zinc-900 dark:text-white">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </strong>{" "}
            of <strong className="text-zinc-900 dark:text-white">{pagination.total}</strong> reviews
          </div>
          
          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange(pagination.page - 1)}
              className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={13} />
            </button>
            
            <div className="text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-xl bg-zinc-200/50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
              Page {pagination.page} / {pagination.pages}
            </div>

            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange(pagination.page + 1)}
              className="p-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={13} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
