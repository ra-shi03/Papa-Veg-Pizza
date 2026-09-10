import React, { useState } from "react";
import { MoreVertical, User, Calendar, CreditCard, ChevronDown, ChevronUp, History, Info, HelpCircle, FileText, CheckCircle2, ShieldAlert } from "lucide-react";
import { Skeleton } from "@food/components/ui/skeleton";
import ComplaintStatusBadge from "./ComplaintStatusBadge";
import ComplaintPriorityBadge from "./ComplaintPriorityBadge";
import { toast } from "sonner";

export default function ComplaintsTable({
  complaints = [],
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

  // Close menus on click away
  React.useEffect(() => {
    const handleOutsideClick = () => setActiveMenuId(null);
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  const handleMenuToggle = (e, id) => {
    e.stopPropagation();
    setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleSort = (columnKey) => {
    let order = "asc";
    if (sortBy === columnKey) {
      order = sortOrder === "asc" ? "desc" : "asc";
    }
    onSortChange?.(columnKey, order);
  };

  // Render sort indicators
  const renderSortArrow = (columnKey) => {
    if (sortBy !== columnKey) return null;
    return sortOrder === "asc" ? (
      <ChevronUp size={12} className="inline ml-1 text-[var(--primary)]" />
    ) : (
      <ChevronDown size={12} className="inline ml-1 text-[var(--primary)]" />
    );
  };

  const isReadOnly = userRole === "assistant_manager";

  const getIssueTypeLabel = (type) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "missing_items": return "Missing Items";
      case "late_delivery": return "Late Delivery";
      case "food_quality": return "Food Quality";
      case "wrong_order": return "Wrong Order";
      case "rider_behavior": return "Rider Behavior";
      case "other": return "Other";
      default: return type;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
      {/* Table container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10">Complaint ID</th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("customerName")}>
                Customer {renderSortArrow("customerName")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10">Order ID</th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("complaintType")}>
                Issue Type {renderSortArrow("complaintType")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("priority")}>
                Priority {renderSortArrow("priority")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("status")}>
                Resolution Status {renderSortArrow("status")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("createdAt")}>
                Created At {renderSortArrow("createdAt")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10">Resolved By</th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="h-14">
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-16 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-24 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-16 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-20 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-5.5 w-14 rounded-full" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-5.5 w-16 rounded-full" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-24 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-20 rounded" /></td>
                  <td className="px-5 py-3 text-right"><Skeleton className="h-7 w-7 rounded-lg inline-block" /></td>
                </tr>
              ))
            ) : complaints.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan="9" className="px-5 py-12 text-center text-zinc-400 dark:text-zinc-650">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Info size={32} className="stroke-[1.5] text-zinc-300 dark:text-zinc-800" />
                    <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No Complaints Found</p>
                    <p className="text-[10px] text-zinc-400">Try adjusting your filters or search terms</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Active rows
              complaints.map((comp) => {
                const isResolved = comp.status === "resolved";
                return (
                  <tr key={comp._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors group">
                    {/* Complaint ID */}
                    <td className="px-5 py-3">
                      <span className="bg-zinc-150 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold text-zinc-600 dark:text-zinc-400">
                        {comp._id}
                      </span>
                    </td>

                    {/* Customer */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-50 text-[var(--primary)] dark:bg-red-950/20 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100/40 dark:border-red-900/10">
                          <User size={13} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="font-extrabold text-zinc-900 dark:text-white truncate max-w-[120px]">{comp.customerName}</p>
                          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold leading-none mt-0.5">{comp.customerMobile}</p>
                        </div>
                      </div>
                    </td>

                    {/* Order Number */}
                    <td className="px-5 py-3">
                      <span className="bg-neutral-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono text-[10px] font-bold">
                        {comp.orderNumber || "N/A"}
                      </span>
                    </td>

                    {/* Issue Type */}
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-400 font-bold capitalize">
                      {getIssueTypeLabel(comp.complaintType)}
                    </td>

                    {/* Priority */}
                    <td className="px-5 py-3">
                      <ComplaintPriorityBadge priority={comp.priority} />
                    </td>

                    {/* Status */}
                    <td className="px-5 py-3">
                      <ComplaintStatusBadge status={comp.status} />
                    </td>

                    {/* Created Date */}
                    <td className="px-5 py-3 font-semibold text-zinc-500 dark:text-zinc-450">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(comp.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </td>

                    {/* Resolved By */}
                    <td className="px-5 py-3 font-bold text-zinc-600 dark:text-zinc-400">
                      {comp.resolvedBy ? (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-450">
                          <CheckCircle2 size={11} className="shrink-0" />
                          <span className="truncate max-w-[100px]">{comp.resolvedBy}</span>
                        </span>
                      ) : (
                        <span className="text-zinc-400">--</span>
                      )}
                    </td>

                    {/* Actions Menu */}
                    <td className="px-5 py-3 text-right relative">
                      <button
                        onClick={(e) => handleMenuToggle(e, comp._id)}
                        className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all cursor-pointer inline-block"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Dropdown Box */}
                      {activeMenuId === comp._id && (
                        <div className="absolute right-12 mt-1 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-30 animate-in fade-in duration-100 text-left font-bold text-xs text-zinc-700 dark:text-zinc-350">
                          <button
                            onClick={() => onActionClick?.("viewDetails", comp._id)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                          >
                            <Info size={13} className="text-zinc-400" />
                            <span>View Details</span>
                          </button>

                          {!isResolved && (
                            <button
                              onClick={() => {
                                if (isReadOnly) {
                                  toast.error("Access Denied", {
                                    description: "Assistant Manager role is in Read-Only mode."
                                  });
                                } else {
                                  onActionClick?.("resolve", comp._id);
                                }
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors border-t border-zinc-100 dark:border-zinc-850 mt-1 pt-1.5 cursor-pointer ${
                                isReadOnly ? "text-zinc-400" : "text-emerald-600 dark:text-emerald-450"
                              }`}
                            >
                              <CheckCircle2 size={13} className={isReadOnly ? "text-zinc-300" : "text-emerald-500"} />
                              <span>Resolve Issue</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      {pagination && pagination.pages > 1 && (
        <div className="px-5 py-4.5 bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
          <span className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">
            Page {pagination.page} of {pagination.pages} ({pagination.total} total items)
          </span>

          <div className="flex items-center gap-2">
            <button
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-650 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Previous
            </button>
            <button
              disabled={pagination.page >= pagination.pages}
              onClick={() => onPageChange?.(pagination.page + 1)}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-650 hover:bg-neutral-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
