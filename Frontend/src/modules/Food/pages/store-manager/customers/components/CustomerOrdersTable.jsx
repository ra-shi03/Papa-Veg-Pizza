import React, { useState } from "react";
import { MoreVertical, User, Calendar, CreditCard, ChevronDown, ChevronUp, History, Info, AlertOctagon, HelpCircle, FileText, ArrowRight } from "lucide-react";
import { Skeleton } from "@food/components/ui/skeleton";

export default function CustomerOrdersTable({
  customers = [],
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

  // Status Style Helpers
  const getOrderStatusStyle = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "delivered":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "preparing":
      case "ready":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "pending":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
      case "cancelled":
      case "refunded":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400 border border-zinc-550/20";
    }
  };

  const getPaymentStatusStyle = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-extrabold";
      case "pending":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400 font-extrabold";
      case "refunded":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 font-extrabold";
      case "failed":
        return "bg-rose-500/10 text-rose-700 dark:text-rose-400 font-extrabold";
      default:
        return "bg-zinc-500/10 text-zinc-650 dark:text-zinc-400";
    }
  };

  const isReadOnly = userRole === "assistant_manager";

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm flex flex-col">
      {/* Table container */}
      <div className="overflow-x-auto min-h-[300px]">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("name")}>
                Customer Name {renderSortArrow("name")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("mobile")}>
                Mobile {renderSortArrow("mobile")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10">Order Number</th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("lastOrderDate")}>
                Order Date {renderSortArrow("lastOrderDate")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("orderAmount")}>
                Order Amount {renderSortArrow("orderAmount")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10">Payment Status</th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10">Delivery Type</th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10">Order Status</th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 cursor-pointer select-none hover:text-zinc-600" onClick={() => handleSort("totalOrders")}>
                Total Orders {renderSortArrow("totalOrders")}
              </th>
              <th className="px-5 py-3.5 sticky top-0 bg-white dark:bg-zinc-900 z-10 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {isLoading ? (
              // Loading Skeleton State
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={idx} className="h-14">
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-24 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-20 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-16 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-24 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-14 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-5 w-14 rounded-full" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-16 rounded" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-5.5 w-16 rounded-full" /></td>
                  <td className="px-5 py-3"><Skeleton className="h-4.5 w-10 rounded" /></td>
                  <td className="px-5 py-3 text-right"><Skeleton className="h-7 w-7 rounded-lg inline-block" /></td>
                </tr>
              ))
            ) : customers.length === 0 ? (
              // Empty State
              <tr>
                <td colSpan="10" className="px-5 py-12 text-center text-zinc-400 dark:text-zinc-650">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Info size={32} className="stroke-[1.5] text-zinc-300 dark:text-zinc-800" />
                    <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">No Customers Found</p>
                    <p className="text-[10px] text-zinc-400">Try adjusting your filters or search terms</p>
                  </div>
                </td>
              </tr>
            ) : (
              // Active Customers Rows
              customers.map((cust) => {
                const recent = cust.recentOrder;
                return (
                  <tr key={cust._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors group">
                    {/* Name */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-50 text-[var(--primary)] dark:bg-red-950/20 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-100/40 dark:border-red-900/10">
                          <User size={13} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <p className="font-extrabold text-zinc-900 dark:text-white truncate max-w-[120px]">{cust.name}</p>
                          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold leading-none mt-0.5">{cust.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Mobile */}
                    <td className="px-5 py-3 text-zinc-600 dark:text-zinc-450 font-bold">{cust.mobile}</td>

                    {/* Order Number */}
                    <td className="px-5 py-3 font-extrabold text-zinc-850 dark:text-zinc-200">
                      {recent ? (
                        <span className="bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-mono text-[10px]">
                          {recent.orderNumber}
                        </span>
                      ) : (
                        <span className="text-zinc-400">--</span>
                      )}
                    </td>

                    {/* Last Order Date */}
                    <td className="px-5 py-3 font-semibold text-zinc-500 dark:text-zinc-450">
                      {recent ? (
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(recent.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric"
                          })}
                        </span>
                      ) : (
                        <span className="text-zinc-400">--</span>
                      )}
                    </td>

                    {/* Order Amount */}
                    <td className="px-5 py-3 font-bold text-zinc-900 dark:text-white">
                      {recent ? `₹${recent.totalAmount}` : "--"}
                    </td>

                    {/* Payment Status */}
                    <td className="px-5 py-3">
                      {recent ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] leading-none uppercase tracking-wide ${getPaymentStatusStyle(recent.paymentStatus)}`}>
                          {recent.paymentStatus}
                        </span>
                      ) : (
                        <span className="text-zinc-400">--</span>
                      )}
                    </td>

                    {/* Delivery Type */}
                    <td className="px-5 py-3 text-zinc-500 dark:text-zinc-400 font-bold capitalize">
                      {recent ? recent.deliveryType : "--"}
                    </td>

                    {/* Order Status */}
                    <td className="px-5 py-3">
                      {recent ? (
                        <span className={`px-2.5 py-0.8 rounded-full text-[9px] font-black uppercase tracking-wider ${getOrderStatusStyle(recent.orderStatus)}`}>
                          {recent.orderStatus}
                        </span>
                      ) : (
                        <span className="text-zinc-400">--</span>
                      )}
                    </td>

                    {/* Total Orders */}
                    <td className="px-5 py-3 text-zinc-900 dark:text-white font-extrabold pl-8">{cust.totalOrders}</td>

                    {/* Actions Menu */}
                    <td className="px-5 py-3 text-right relative">
                      <button
                        onClick={(e) => handleMenuToggle(e, cust._id)}
                        className="p-1 rounded-lg hover:bg-neutral-100 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-all cursor-pointer inline-block"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {/* Dropdown Box */}
                      {activeMenuId === cust._id && (
                        <div className="absolute right-12 mt-1 w-44 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-xl py-1.5 z-30 animate-in fade-in duration-100 text-left font-bold text-xs text-zinc-700 dark:text-zinc-350">
                          <button
                            onClick={() => onActionClick?.("viewCustomer", cust._id)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors"
                          >
                            <User size={13} className="text-zinc-400" />
                            <span>View Profile</span>
                          </button>

                          <button
                            onClick={() => onActionClick?.("viewOrders", cust._id)}
                            className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors"
                          >
                            <History size={13} className="text-zinc-400" />
                            <span>View Orders</span>
                          </button>

                          {recent && (
                            <>
                              <button
                                onClick={() => onActionClick?.("timeline", recent._id)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors"
                              >
                                <ArrowRight size={13} className="text-zinc-400" />
                                <span>Order Timeline</span>
                              </button>

                              <button
                                onClick={() => onActionClick?.("refundHistory", recent._id)}
                                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors"
                              >
                                <CreditCard size={13} className="text-zinc-400" />
                                <span>Refund History</span>
                              </button>

                              <button
                                onClick={() => {
                                  if (isReadOnly) {
                                    toast.error("Assistant Manager is in Read-Only mode.");
                                  } else {
                                    onActionClick?.("downloadInvoice", recent);
                                  }
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-left transition-colors border-t border-zinc-100 dark:border-zinc-850 mt-1 pt-1.5 ${
                                  isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                                }`}
                              >
                                <FileText size={13} className="text-zinc-400" />
                                <span>Download Invoice</span>
                              </button>
                            </>
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
