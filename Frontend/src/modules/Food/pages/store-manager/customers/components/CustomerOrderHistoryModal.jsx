import React from "react";
import { X, Calendar, FileText, Eye, Info, RefreshCcw } from "lucide-react";
import { useCustomerProfile } from "../hooks/useCustomerOrders";
import { Skeleton } from "@food/components/ui/skeleton";
import { toast } from "sonner";

export default function CustomerOrderHistoryModal({ visible, onClose, customerId, onViewOrder, onDownloadInvoice, userRole }) {
  const { data, isLoading, isError, refetch } = useCustomerProfile(customerId);

  if (!visible) return null;

  const { customerProfile = {}, recentOrders = [] } = data || {};
  const isReadOnly = userRole === "assistant_manager";

  const getOrderStatusStyle = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "delivered":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "preparing":
      case "ready":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "cancelled":
      case "refunded":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
    }
  };

  const getPaymentStatusStyle = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "paid":
        return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
      case "pending":
        return "bg-amber-500/10 text-amber-700 dark:text-amber-400";
      case "refunded":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400";
      default:
        return "bg-zinc-500/10 text-zinc-650 dark:text-zinc-400";
    }
  };

  return (
    <div className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">
              Customer Purchase Ledger
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-semibold mt-0.5">
              Full chronological order log for customer: <strong className="text-[var(--primary)]">{customerProfile.name || ""}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-805 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : isError ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-[var(--primary)] rounded-full flex items-center justify-center">
                <Info size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">Failed to Load Order History</h4>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <RefreshCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="py-12 text-center text-zinc-400 dark:text-zinc-650 text-xs font-semibold">
              No orders registered in the system.
            </div>
          ) : (
            <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
              <table className="w-full text-left text-xs font-semibold">
                <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-550 tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Order Number</th>
                    <th className="px-5 py-3">Order Date</th>
                    <th className="px-5 py-3">Total Amount</th>
                    <th className="px-5 py-3">Payment Status</th>
                    <th className="px-5 py-3">Order Status</th>
                    <th className="px-5 py-3">Delivery Type</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
                  {recentOrders.map((ord) => (
                    <tr key={ord._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                      <td className="px-5 py-3 font-mono font-extrabold text-zinc-900 dark:text-white">
                        {ord.orderNumber}
                      </td>
                      <td className="px-5 py-3 text-zinc-500 dark:text-zinc-450">
                        <span className="flex items-center gap-1">
                          <Calendar size={11} />
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-extrabold text-zinc-900 dark:text-white">
                        ₹{ord.totalAmount}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${getPaymentStatusStyle(ord.paymentStatus)}`}>
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <span className={`px-2.5 py-0.8 rounded-full text-[9px] font-black uppercase tracking-wider ${getOrderStatusStyle(ord.orderStatus)}`}>
                          {ord.orderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3 capitalize text-zinc-500 dark:text-zinc-400 font-bold">
                        {ord.deliveryType}
                      </td>
                      <td className="px-5 py-3 text-right space-x-1.5 shrink-0">
                        <button
                          onClick={() => onViewOrder?.(ord._id)}
                          className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-850 hover:bg-[var(--primary)] hover:text-white border border-zinc-150 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 font-bold rounded-lg text-[10px] transition-all cursor-pointer inline-flex items-center gap-1"
                        >
                          <Eye size={10} />
                          <span>Details</span>
                        </button>
                        <button
                          onClick={() => {
                            if (isReadOnly) {
                              toast.error("Assistant Manager is in Read-Only mode.");
                            } else {
                              onDownloadInvoice?.(ord);
                            }
                          }}
                          className={`px-2.5 py-1 bg-zinc-50 dark:bg-zinc-850 hover:bg-[var(--secondary)] hover:text-white border border-zinc-150 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 font-bold rounded-lg text-[10px] transition-all cursor-pointer inline-flex items-center gap-1 ${
                            isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                        >
                          <FileText size={10} />
                          <span>Invoice</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-150 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl text-xs transition-all cursor-pointer"
          >
            Close Ledgers
          </button>
        </div>
      </div>
    </div>
  );
}
