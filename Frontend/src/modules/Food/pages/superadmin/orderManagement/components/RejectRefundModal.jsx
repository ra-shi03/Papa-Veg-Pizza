import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { rejectRefund } from '../RefundRequestsData';
import { toast } from 'sonner';

export default function RejectRefundModal({ isOpen, onClose, refund, onSuccess }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [reason, setReason] = useState('Duplicate Request');
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
      setReason('Duplicate Request');
      setRemarks('');
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered || !refund) return null;

  const handleRejectRefund = async (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error('Remarks are required for rejection audit trail');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await rejectRefund(refund._id, reason, remarks);
      if (response.success) {
        toast.success(`Refund rejected successfully. Status: REJECTED`);
        onSuccess(response.refund);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to update rejection log');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl relative z-10 transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} overflow-hidden`}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-500 animate-pulse" size={18} />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Reject Refund Request</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Deny the refund request. This action is audited and non-reversible.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleRejectRefund}>
          {/* Body */}
          <div className="p-4 space-y-4 text-xs font-semibold">
            {/* Rejection Reason Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Rejection Reason Code</label>
              <select 
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--primary)] text-zinc-800 dark:text-zinc-100"
              >
                <option value="Duplicate Request">Duplicate Request</option>
                <option value="Invalid Claim">Invalid Claim</option>
                <option value="Policy Violation">Policy Violation</option>
                <option value="Payment Already Refunded">Payment Already Refunded</option>
                <option value="Other">Other (Specify below)</option>
              </select>
            </div>

            {/* Remarks Textarea */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Audit Remarks / Rejection Explanation <span className="text-red-500">*</span>
              </label>
              <textarea 
                rows="3"
                required
                placeholder="Explain why this request is denied. This message will be logged in the refund history logs and sent to the client support dispatch channel..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-400"
              />
            </div>

            <div className="p-2.5 bg-red-500/5 border border-red-500/10 rounded-lg text-[10px] text-red-650 dark:text-red-400 leading-normal flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Rejecting this request will set the refund status to <strong>REJECTED</strong>. A notification with these remarks will be logged and dispatched.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
            <button 
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="h-8 px-4 rounded-lg text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isProcessing}
              className="h-8 px-4 bg-red-650 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Submitting Audit...</span>
                </>
              ) : (
                <>
                  <X size={13} strokeWidth={2.5} />
                  <span>Reject Refund</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
