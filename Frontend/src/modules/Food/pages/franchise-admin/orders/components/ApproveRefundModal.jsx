import React, { useState, useEffect } from "react";
import { X, CheckCircle, Info, BellRing } from "lucide-react";
import { useApproveRefund } from "../ordersQuery";

export default function ApproveRefundModal({ isOpen, onClose, request }) {
  const { mutateAsync: approveRefund, isLoading } = useApproveRefund();
  const [approvedAmount, setApprovedAmount] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [error, setError] = useState("");

  // Pre-fill amount when request changes
  useEffect(() => {
    if (request) {
      setApprovedAmount(request.refundAmount.toString());
      setRemarks("");
      setError("");
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  const requestedAmount = request.refundAmount || 0;
  const parsedApproved = parseFloat(approvedAmount) || 0;
  const difference = requestedAmount - parsedApproved;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (parsedApproved <= 0) {
      setError("Approved amount must be greater than 0");
      return;
    }

    if (parsedApproved > requestedAmount) {
      setError(`Approved amount cannot exceed requested amount (₹${requestedAmount})`);
      return;
    }

    try {
      await approveRefund({
        requestId: request.requestId,
        approvedAmount: parsedApproved,
        remarks,
        notifyCustomer,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to approve refund");
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
        
        {/* Modal Container: 650px Max Width */}
        <form 
          onSubmit={handleSubmit}
          className="relative w-full max-w-[650px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-scale-up text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-blue-500" size={18} />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Approve Refund Request
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Confirm approved payout amount for request {request.requestId}
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
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Order Number</p>
                <p className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">{request.orderNumber}</p>
                <p className="text-[10px] text-zinc-450 mt-0.5">Store: {request.store?.name}</p>
              </div>
            </div>

            {/* Side-by-Side Payout Preview */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-zinc-50/30 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-850 rounded-xl text-center space-y-1">
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Requested</p>
                <p className="font-black text-sm text-zinc-800 dark:text-zinc-200">₹{requestedAmount.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-blue-50/30 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/20 rounded-xl text-center space-y-1">
                <p className="text-[9px] uppercase font-bold text-blue-500 tracking-wide">Approved</p>
                <p className="font-black text-sm text-blue-600">₹{parsedApproved.toFixed(2)}</p>
              </div>
              <div className="p-3 bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 rounded-xl text-center space-y-1">
                <p className="text-[9px] uppercase font-bold text-rose-500 tracking-wide">Withheld Difference</p>
                <p className="font-black text-sm text-rose-600">₹{difference.toFixed(2)}</p>
              </div>
            </div>

            {/* Approved Amount Numeric Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Approved Refund Amount (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 font-extrabold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={requestedAmount}
                  value={approvedAmount}
                  onChange={(e) => setApprovedAmount(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  placeholder="0.00"
                  required
                />
              </div>
              <p className="text-[9.5px] text-zinc-450 italic mt-0.5">
                Note: You can approve a partial refund but it cannot exceed the requested amount of ₹{requestedAmount}.
              </p>
            </div>

            {/* Remarks Textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Approval Remarks / Internal Notes
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-250 placeholder-zinc-450 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                placeholder="Write reasons for approval, justification for difference if partial refund..."
                required
              />
            </div>

            {/* Notify Customer Checkbox */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="text-zinc-400" size={14} />
                <div>
                  <p className="font-extrabold text-[10px] text-zinc-800 dark:text-zinc-200">Notify Customer</p>
                  <p className="text-[9px] text-zinc-450">Send real-time SMS and App Push updates on approval status.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500" />
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
              className="px-5 py-2 bg-blue-600 hover:bg-blue-750 text-white font-bold rounded-xl shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? "Processing..." : "Approve Refund"}
            </button>
          </footer>
        </form>

      </div>
    </div>
  );
}
