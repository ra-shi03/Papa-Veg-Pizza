import React, { useState } from 'react';
import { X, CheckCircle, AlertOctagon, RefreshCw, AlertTriangle } from 'lucide-react';
import { useApprovePayout, useRejectPayout, useUpdatePayout } from '../hooks/usePayoutQuery';

// -------------------------------------------------------------
// APPROVE PAYOUT MODAL
// -------------------------------------------------------------
export function ApproveModal({ isOpen, onClose, id, amount, beneficiaryName, onSuccess }) {
  const { approvePayout, loading } = useApprovePayout();
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleApprove = async () => {
    const success = await approvePayout(id, remarks);
    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-800">
          <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
            <CheckCircle className="text-emerald-500" size={18} />
            Approve Outgoing Payout?
          </h4>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-500">Beneficiary:</span>
              <span className="font-extrabold text-zinc-900 dark:text-white">{beneficiaryName}</span>
            </div>
            <div className="flex justify-between text-xs pt-1.5 border-t border-zinc-200/50 dark:border-zinc-850">
              <span className="font-semibold text-zinc-500">Amount:</span>
              <span className="font-black text-[var(--primary)] font-mono">₹{amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Approval Notes / Remarks</label>
            <textarea
              rows={3}
              placeholder="Provide comments regarding billing clearance..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none text-black dark:text-white"
            ></textarea>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.8 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleApprove}
            disabled={loading}
            className="px-4 py-1.8 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            Approve Dispatch
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// REJECT PAYOUT MODAL
// -------------------------------------------------------------
export function RejectModal({ isOpen, onClose, id, amount, beneficiaryName, onSuccess }) {
  const { rejectPayout, loading } = useRejectPayout();
  const [reason, setReason] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState('');

  if (!isOpen) return null;

  const handleReject = async () => {
    if (!reason) {
      setErrors('Reason is required');
      return;
    }
    if (!remarks.trim()) {
      setErrors('Rejection Remarks are mandatory');
      return;
    }

    setErrors('');
    const success = await rejectPayout(id, reason, remarks);
    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-800">
          <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
            <AlertOctagon className="text-rose-500" size={18} />
            Reject Payout Request?
          </h4>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-500">Beneficiary:</span>
              <span className="font-bold text-zinc-900 dark:text-white">{beneficiaryName}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-zinc-200/50 dark:border-zinc-850">
              <span className="font-semibold text-zinc-500">Amount:</span>
              <span className="font-bold text-rose-600 font-mono">₹{amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Rejection Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
            >
              <option value="">Select a rejection reason...</option>
              <option value="Invalid Bank Details">Invalid Bank Details</option>
              <option value="Duplicate Request">Duplicate Request</option>
              <option value="Insufficient Balance">Insufficient Balance</option>
              <option value="Manual Rejection">Manual Rejection</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Audit Remarks (Mandatory)</label>
            <textarea
              rows={3}
              placeholder="State precise reason for rejection audits..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none text-black dark:text-white"
            ></textarea>
            {errors && <span className="text-[10px] text-rose-500 font-bold">{errors}</span>}
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.8 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleReject}
            disabled={loading}
            className="px-4 py-1.8 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// FAILED PAYOUT RETRY MODAL
// -------------------------------------------------------------
export function FailedPayoutModal({ isOpen, onClose, id, amount, beneficiaryName, onSuccess }) {
  const { updatePayoutStatus, loading } = useUpdatePayout();
  const [newRef, setNewRef] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errors, setErrors] = useState('');

  if (!isOpen) return null;

  const handleRetry = async () => {
    if (!newRef.trim()) {
      setErrors('New Reference/UTR transaction ID is required');
      return;
    }

    setErrors('');
    const success = await updatePayoutStatus(id, 'Processing', {
      remarks: remarks || 'Retrying transaction with new clearance details',
      referenceNo: newRef
    });

    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="w-full max-w-[420px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-3 border-b border-zinc-150 dark:border-zinc-800">
          <h4 className="text-sm font-bold text-black dark:text-white flex items-center gap-2">
            <RefreshCw className="text-amber-500" size={18} />
            Retry Failed Payout?
          </h4>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <div className="py-4 space-y-3">
          <div className="p-3 bg-amber-50 dark:bg-amber-955/20 rounded-xl border border-amber-100 dark:border-amber-900/35 flex items-start gap-2">
            <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
            <div className="text-xs text-amber-800 dark:text-amber-400 font-medium leading-relaxed">
              <strong>Failure Reason:</strong> Destination banking servers timed out. Retrying this payout will set its status back to <strong>Processing</strong>.
            </div>
          </div>

          <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-zinc-550">Beneficiary:</span>
              <span className="font-bold text-zinc-900 dark:text-white">{beneficiaryName}</span>
            </div>
            <div className="flex justify-between text-xs pt-1 border-t border-zinc-200/50 dark:border-zinc-850">
              <span className="font-semibold text-zinc-550">Amount:</span>
              <span className="font-bold text-[var(--primary)] font-mono">₹{amount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">New Reference Number / UTR</label>
            <input 
              type="text"
              placeholder="e.g. UTR-RETRIED-0092"
              value={newRef}
              onChange={(e) => setNewRef(e.target.value)}
              className="w-full px-3 h-9 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
            />
            {errors && <span className="text-[10px] text-rose-500 font-bold">{errors}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-450 uppercase tracking-wider">Retrial Notes</label>
            <textarea
              rows={2}
              placeholder="Optional notes regarding retry route..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none text-black dark:text-white"
            ></textarea>
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800 justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-1.8 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleRetry}
            disabled={loading}
            className="px-4 py-1.8 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
          >
            Re-initiate
          </button>
        </div>
      </div>
    </div>
  );
}
