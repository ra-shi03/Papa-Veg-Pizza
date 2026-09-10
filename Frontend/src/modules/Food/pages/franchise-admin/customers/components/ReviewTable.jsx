import React, { useState, useEffect, useRef } from "react";
import { 
  Star, Eye, Trash2, ArrowUpDown, MoreVertical, 
  Send, UserPlus, Check, AlertTriangle, ChevronLeft, 
  ChevronRight, Edit 
} from "lucide-react";

export default function ReviewTable({
  reviews,
  loading,
  totalCount,
  currentPage,
  setCurrentPage,
  pageSize,
  setPageSize,
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  handleActionClick,
  deleteReply
}) {
  // Actions menu state
  const [activeMenuId, setActiveMenuId] = useState(null);
  const menuRef = useRef(null);

  // Click outside listener for actions menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortOrder("desc");
    }
    setCurrentPage(1);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
      });
    } catch {
      return dateStr;
    }
  };

  const getRatingStars = (r) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={10} fill={i < r ? "currentColor" : "none"} />
        ))}
      </div>
    );
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleMenuAction = (rev, action) => {
    setActiveMenuId(null);
    handleActionClick(rev, action);
  };

  return (
    <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
      
      <div className="overflow-x-auto">
        <table className="w-full text-left min-w-[1000px]">
          <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-850 text-[10px] uppercase font-bold text-zinc-450 tracking-wider">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Related Order</th>
              <th className="px-4 py-3">Store Outlet</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("rating")}>
                <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                  Rating
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3">Review Feedback Text</th>
              <th className="px-4 py-3 cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                <div className="flex items-center gap-1 hover:text-zinc-700 dark:hover:text-zinc-250">
                  Date Created
                  <ArrowUpDown size={11} />
                </div>
              </th>
              <th className="px-4 py-3">Reply Status</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/85">
            {loading ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-450">
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                    <span className="font-semibold text-xs">Querying MongoDB Feedback...</span>
                  </div>
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-zinc-400 font-semibold">
                  No customer feedback entries match active search queries.
                </td>
              </tr>
            ) : (
              reviews.map((rev) => (
                <tr key={rev._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 text-zinc-750 dark:text-zinc-355 transition-colors">
                  {/* Customer */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-[10px]">
                        {rev.customerName?.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "CU"}
                      </div>
                      <div>
                        <div className="font-bold text-zinc-850 dark:text-zinc-200">{rev.customerName}</div>
                        <div className="text-[9px] text-zinc-400 font-semibold mt-0.5">{rev.customerPhone}</div>
                      </div>
                    </div>
                  </td>

                  {/* Order ID */}
                  <td className="px-4 py-3 font-bold text-zinc-650 dark:text-zinc-400 text-[10px]">
                    {rev.orderId}
                  </td>

                  {/* Store Name */}
                  <td className="px-4 py-3 font-bold text-zinc-700 dark:text-zinc-350">
                    {rev.storeName}
                  </td>

                  {/* Rating stars */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="font-extrabold text-[10px] text-amber-500">{rev.rating} ★</span>
                      {getRatingStars(rev.rating)}
                    </div>
                  </td>

                  {/* Review text snippet */}
                  <td className="px-4 py-3 max-w-xs md:max-w-sm">
                    <div>
                      <p className="italic text-zinc-650 dark:text-zinc-300 truncate" title={rev.reviewText}>
                        "{rev.reviewText || 'No text content'}"
                      </p>
                      {rev.tags?.length > 0 && (
                        <div className="flex gap-1.5 mt-1">
                          {rev.tags.slice(0, 2).map(t => (
                            <span key={t} className="text-[8px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 px-1 py-0.2 rounded font-bold">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Created Date */}
                  <td className="px-4 py-3 font-semibold text-zinc-450 dark:text-zinc-400">
                    {formatDate(rev.createdAt || rev.date)}
                  </td>

                  {/* Reply Status */}
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${
                      rev.adminReply 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                        : "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    }`}>
                      {rev.adminReply ? "Replied" : "Awaiting Reply"}
                    </span>
                  </td>

                  {/* Status visibility */}
                  <td className="px-4 py-3">
                    <span className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase ${
                      rev.status === "Published" 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                        : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                    }`}>
                      {rev.status}
                    </span>
                  </td>

                  {/* Actions Menu */}
                  <td className="px-4 py-3 text-right relative">
                    <div className="flex justify-end items-center gap-1.5">
                      
                      <button
                        onClick={() => handleActionClick(rev, "view")}
                        className="p-1 text-zinc-400 hover:text-[var(--primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        title="View Details Drawer"
                      >
                        <Eye size={14} />
                      </button>

                      <div className="relative">
                        <button
                          onClick={() => setActiveMenuId(activeMenuId === rev._id ? null : rev._id)}
                          className="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        >
                          <MoreVertical size={14} />
                        </button>

                        {activeMenuId === rev._id && (
                          <div 
                            ref={menuRef} 
                            className="absolute right-0 mt-1 w-38 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 animate-fade-down duration-100"
                          >
                            <div className="py-1">
                              <button
                                onClick={() => handleMenuAction(rev, "view")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-355 cursor-pointer font-semibold"
                              >
                                <Eye size={12} />
                                <span>View Drawer</span>
                              </button>
                              
                              {!rev.adminReply ? (
                                <button
                                  onClick={() => handleMenuAction(rev, "reply")}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-355 cursor-pointer font-semibold"
                                >
                                  <Send size={12} className="text-emerald-500" />
                                  <span>Reply Review</span>
                                </button>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleMenuAction(rev, "edit-reply")}
                                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-355 cursor-pointer font-semibold"
                                  >
                                    <Edit size={12} />
                                    <span>Edit Reply</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      if (window.confirm("Are you sure you want to delete this reply?")) {
                                        deleteReply(rev._id);
                                      }
                                    }}
                                    className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-355 cursor-pointer font-semibold text-rose-500"
                                  >
                                    <Trash2 size={12} />
                                    <span>Delete Reply</span>
                                  </button>
                                </>
                              )}
                            </div>

                            <div className="py-1">
                              {rev.status === "Published" ? (
                                <button
                                  onClick={() => handleMenuAction(rev, "hide")}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-355 cursor-pointer font-semibold"
                                >
                                  <AlertTriangle size={12} className="text-amber-500" />
                                  <span>Hide review</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleMenuAction(rev, "publish")}
                                  className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-355 cursor-pointer font-semibold"
                                >
                                  <Check size={12} className="text-emerald-500" />
                                  <span>Publish review</span>
                                </button>
                              )}

                              <button
                                onClick={() => handleMenuAction(rev, "customer-history")}
                                className="w-full text-left px-3 py-1.5 hover:bg-zinc-55 dark:hover:bg-zinc-850 flex items-center gap-1.5 text-zinc-650 dark:text-zinc-355 cursor-pointer font-semibold"
                              >
                                <UserPlus size={12} />
                                <span>Customer History</span>
                              </button>
                            </div>

                            <div className="py-1 bg-rose-500/5">
                              <button
                                onClick={() => handleMenuAction(rev, "delete")}
                                className="w-full text-left px-3 py-1.5 hover:bg-rose-500/10 flex items-center gap-1.5 text-rose-600 cursor-pointer font-semibold"
                              >
                                <Trash2 size={12} />
                                <span>Delete Review</span>
                              </button>
                            </div>
                          </div>
                        )}

                      </div>

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Section */}
      {totalPages > 0 && (
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-zinc-450 dark:text-zinc-400 font-semibold select-none">
          
          <div className="flex items-center gap-2 text-[10px]">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="p-1 rounded border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-700 dark:text-zinc-300 outline-none text-[10px] font-bold cursor-pointer"
            >
              {[5, 10, 20, 50].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span>Showing {Math.min(totalCount, (currentPage - 1) * pageSize + 1)}-{Math.min(totalCount, currentPage * pageSize)} of {totalCount} records</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronLeft size={13} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-6 h-6 rounded-lg text-[10px] font-extrabold flex items-center justify-center border transition-all cursor-pointer ${
                    currentPage === page
                      ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-xs"
                      : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-855"
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-855 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
            >
              <ChevronRight size={13} />
            </button>
          </div>

        </div>
      )}

    </section>
  );
}
