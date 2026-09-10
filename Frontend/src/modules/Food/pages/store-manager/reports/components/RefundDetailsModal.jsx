import React, { useEffect } from "react";
import { X, RefreshCw, AlertTriangle, UserCheck, Calendar } from "lucide-react";
import { useRefundDetails } from "../hooks/useRefundDetails";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function RefundDetailsModal({ isOpen, onClose, orderId }) {
  const { data, isLoading, isError } = useRefundDetails(orderId);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const {
    refundAmount = 0,
    reason = "",
    approvedBy = "",
    status = "",
    createdAt = ""
  } = data || {};

  const getStatusBadge = (refundStatus) => {
    const norm = refundStatus?.toLowerCase() || "";
    if (norm === "processed") {
      return (
        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/35 uppercase tracking-wider">
          Processed
        </span>
      );
    }
    if (norm === "approved") {
      return (
        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border border-blue-100 dark:border-blue-900/35 uppercase tracking-wider">
          Approved
        </span>
      );
    }
    if (norm === "rejected") {
      return (
        <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 border border-rose-100 dark:border-rose-900/35 uppercase tracking-wider">
          Rejected
        </span>
      );
    }
    return (
      <span className="text-[10px] font-extrabold px-3 py-1 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-100 dark:border-amber-900/35 uppercase tracking-wider animate-pulse">
        Pending
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] overflow-x-hidden overflow-y-auto outline-none transition-all">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md mx-3 my-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-fade-down duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <RefreshCw size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Refund Details
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                Audit transcript for Order Reversal
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-4 animate-pulse py-4">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full w-2/3" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full w-1/2" />
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-full w-5/6" />
            </div>
          ) : isError ? (
            <div className="text-center py-6 space-y-2">
              <AlertTriangle className="mx-auto text-rose-500" size={24} />
              <p className="text-xs font-black text-zinc-800 dark:text-white">No Refund Details Available</p>
            </div>
          ) : (
            <div className="space-y-4.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
              
              {/* Refund Status */}
              <div className="flex justify-between items-center border-b border-zinc-50 dark:border-zinc-850 pb-3">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold">Audit Status</span>
                {getStatusBadge(status)}
              </div>

              {/* Refund Amount */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold">Reversal Amount</span>
                <span className="text-sm font-black text-rose-600">{formatINR(refundAmount)}</span>
              </div>

              {/* Reason */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold">Reversal Reason</span>
                <p className="text-zinc-900 dark:text-white font-black bg-neutral-50 dark:bg-zinc-950/30 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850 leading-relaxed">
                  {reason || "None specified"}
                </p>
              </div>

              {/* Approved By */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                  <UserCheck size={11} />
                  Approved By
                </span>
                <span className="text-zinc-900 dark:text-white font-extrabold">{approvedBy || "System Auto"}</span>
              </div>

              {/* Created At */}
              <div className="flex justify-between items-center">
                <span className="text-[10px] text-zinc-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
                  <Calendar size={11} />
                  Initiated Date
                </span>
                <span className="text-zinc-500 font-semibold">{formatDate(createdAt)}</span>
              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-850 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-full text-xs active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Close Audit
          </button>
        </div>

      </div>
    </div>
  );
}
