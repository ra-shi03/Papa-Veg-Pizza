import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Info, BellRing } from "lucide-react";
import { useRejectRefund } from "../ordersQuery";

export default function RejectRefundModal({ isOpen, onClose, request }) {
  const { mutateAsync: rejectRefund, isLoading } = useRejectRefund();
  const [rejectionReason, setRejectionReason] = useState("Invalid Claim");
  const [remarks, setRemarks] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (request) {
      setRejectionReason("Invalid Claim");
      setRemarks("");
      setError("");
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!remarks.trim()) {
      setError("Please provide detailed remarks justifying the rejection");
      return;
    }

    try {
      await rejectRefund({
        requestId: request.requestId,
        rejectionReason,
        remarks,
        notifyCustomer,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to reject refund request");
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Center Wrapper shifted to prevent sidebar overlap */}
      <div className="fixed inset-0 lg:left-[280px] flex items-center justify-center p-4 z-10 pointer-events-none">
        
        {/* Modal Container: 600px Max Width */}
        <form 
          onSubmit={handleSubmit}
          className="relative w-full max-w-[600px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-scale-up text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <AlertTriangle className="text-red-500" size={18} />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Reject Refund Request
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Decline customer payout for request {request.requestId}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {/* Form Content */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-thin">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 text-[11px] font-bold flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Context Summary */}
            <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Customer Details</p>
                <p className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{request.customer?.name}</p>
                <p className="text-[10px] text-zinc-400 mt-0.5">{request.customer?.phone}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Requested Amount</p>
                <p className="font-extrabold text-red-500 mt-0.5 text-sm">₹{(request.refundAmount || 0).toFixed(2)}</p>
                <p className="text-[10px] text-zinc-450 mt-0.5">Reason: {request.reason}</p>
              </div>
            </div>

            {/* Rejection Reason Dropdown */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Primary Rejection Reason
              </label>
              <select
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all cursor-pointer"
              >
                <option value="Duplicate Request">Duplicate Request</option>
                <option value="Invalid Claim">Invalid Claim</option>
                <option value="Policy Violation">Policy Violation</option>
                <option value="Already Refunded">Already Refunded</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Remarks Textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Detailed Rejection remarks (Sent to customer)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={4}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-250 placeholder-zinc-450 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                placeholder="State the exact reasons why this claim is being declined. Customer will be able to read this text."
                required
              />
            </div>

            {/* Notify Customer Checkbox */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="text-zinc-400" size={14} />
                <div>
                  <p className="font-extrabold text-[10px] text-zinc-800 dark:text-zinc-200">Notify Customer</p>
                  <p className="text-[9px] text-zinc-455">Notify customer immediately via SMS/App push regarding rejection.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-500" />
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-3 bg-zinc-50/30 dark:bg-zinc-900/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-red-600 hover:bg-red-750 text-white font-bold rounded-xl shadow-md shadow-red-500/10 hover:shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? "Processing..." : "Reject Refund"}
            </button>
          </footer>
        </form>

      </div>
    </div>
  );
}
