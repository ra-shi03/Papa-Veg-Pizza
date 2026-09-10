import React, { useState, useEffect } from "react";
import { X, AlertTriangle } from "lucide-react";
import { useRejectPurchaseRequestMutation } from "../hooks/usePurchaseRequests";

export default function RejectRequestModal({ isOpen, onClose, requestId, requestNumber }) {
  const rejectMutation = useRejectPurchaseRequestMutation();

  const [reason, setReason] = useState("Insufficient Budget");
  const [comments, setComments] = useState("");
  const [validationError, setValidationError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setReason("Insufficient Budget");
      setComments("");
      setValidationError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!comments.trim()) {
      setValidationError("Comments are required to reject the purchase requisition.");
      return;
    }

    rejectMutation.mutate({
      requestId,
      rejectionReason: reason,
      comments: comments.trim()
    }, {
      onSuccess: () => {
        onClose();
      }
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <form 
          onSubmit={handleSubmit}
          className="w-full max-w-[600px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
        >
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-rose-500/10 text-rose-650 rounded-xl">
                <AlertTriangle size={18} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  Reject Purchase Requisition
                </h3>
                <p className="text-[9.5px] text-zinc-450 font-bold mt-0.5">
                  Decline purchase requisition <span className="font-extrabold text-zinc-700 dark:text-zinc-200">{requestNumber}</span>
                </p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          {/* Body */}
          <div className="p-5 space-y-4 bg-white dark:bg-zinc-950">
            {/* Input: Rejection Reason */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Rejection Reason *</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none"
              >
                <option value="Insufficient Budget">Insufficient Budget</option>
                <option value="Out Of Stock">Out Of Stock</option>
                <option value="Duplicate Request">Duplicate Request</option>
                <option value="Wrong Quantity">Wrong Quantity</option>
                <option value="Vendor Unavailable">Vendor Unavailable</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Input: Comments */}
            <div className="space-y-1.5">
              <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Explanation / Comments *</label>
              <textarea
                placeholder="Describe the reason for declining this request (required)..."
                value={comments}
                onChange={(e) => { setComments(e.target.value); setValidationError(""); }}
                rows={4}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none resize-none"
              />
              <div className="flex justify-between items-center text-[8.5px]">
                <span className="text-rose-500 font-extrabold">{validationError}</span>
                <span className="text-zinc-450 font-bold">{comments.length} characters</span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="p-3 bg-rose-50 dark:bg-rose-950/10 text-rose-800 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30 rounded-xl flex gap-2">
              <AlertTriangle size={15} className="shrink-0 mt-0.5 text-rose-500" />
              <div>
                <p className="font-extrabold text-[10.5px]">Irreversible Action</p>
                <p className="text-[9.5px] font-bold mt-0.5 leading-normal">
                  Rejecting this request will mark it permanently as Rejected. The store manager will be notified of the reason and must create a new request to reopen procurement.
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={rejectMutation.isPending}
              className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
            >
              {rejectMutation.isPending ? "Declining..." : "Reject Request"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
