import React, { useState, useEffect } from 'react';
import { X, CheckCircle, ShieldCheck, Loader2, DollarSign } from 'lucide-react';
import { approveRefund } from '../RefundRequestsData';
import { toast } from 'sonner';

export default function ApproveRefundModal({ isOpen, onClose, refund, onSuccess }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [refundType, setRefundType] = useState('full'); // full or partial
  const [refundAmount, setRefundAmount] = useState(0);
  const [adminNotes, setAdminNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
      if (refund) {
        setRefundAmount(refund.refundAmount || 0);
        setRefundType('full');
        setAdminNotes('');
      }
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, refund]);

  useEffect(() => {
    if (!refund) return;
    if (refundType === 'full') {
      setRefundAmount(refund.order?.grandTotal || refund.refundAmount || 0);
    }
  }, [refundType, refund]);

  if (!isRendered || !refund) return null;

  const handleProcessRefund = async (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(refundAmount);
    
    // Validations
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }

    const maxLimit = refund.payment?.paymentAmount || refund.refundAmount || 0;
    if (parsedAmount > maxLimit) {
      toast.error(`Refund amount cannot exceed the original payment amount of ₹${maxLimit.toFixed(2)}`);
      return;
    }

    setIsProcessing(true);
    try {
      const response = await approveRefund(refund._id, parsedAmount, adminNotes);
      if (response.success) {
        toast.success(`Refund processed successfully. Status: ${response.refund.status.toUpperCase()}`);
        onSuccess(response.refund);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to process refund through gateway');
    } finally {
      setIsProcessing(false);
    }
  };

  const paymentAmt = refund.payment?.paymentAmount || refund.refundAmount || 0;
  const availableBal = refund.payment?.availableBalance ?? paymentAmt;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl relative z-10 transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} overflow-hidden`}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="text-emerald-500" size={18} />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Process Refund</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Disburse payment back to original customer account.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleProcessRefund}>
          {/* Body */}
          <div className="p-4 space-y-4 text-xs font-semibold">
            {/* Refund Type Selection */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Refund Type</label>
              <div className="grid grid-cols-2 gap-3">
                <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                  refundType === 'full' 
                    ? 'border-[var(--primary)] bg-red-500/5 text-[var(--primary)]' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                }`}>
                  <input 
                    type="radio" 
                    name="refundType" 
                    value="full"
                    checked={refundType === 'full'}
                    onChange={() => setRefundType('full')}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold">Full Refund</span>
                </label>

                <label className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border-2 cursor-pointer transition-all ${
                  refundType === 'partial' 
                    ? 'border-[var(--primary)] bg-red-500/5 text-[var(--primary)]' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/30'
                }`}>
                  <input 
                    type="radio" 
                    name="refundType" 
                    value="partial"
                    checked={refundType === 'partial'}
                    onChange={() => setRefundType('partial')}
                    className="sr-only"
                  />
                  <span className="text-xs font-bold">Partial Refund</span>
                </label>
              </div>
            </div>

            {/* Input Refund Amount */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Refund Amount (INR)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-450 font-bold">₹</span>
                <input 
                  type="number"
                  step="0.01"
                  disabled={refundType === 'full'}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full h-9 pl-7 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--primary)] disabled:opacity-75 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            {/* Gateway Information (Read-only) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Payment Gateway</label>
                <input 
                  type="text"
                  readOnly
                  value={refund.payment?.gatewayName || 'Razorpay'}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none text-zinc-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Transaction ID</label>
                <input 
                  type="text"
                  readOnly
                  value={refund.payment?.transactionId || 'N/A'}
                  className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold outline-none text-zinc-500"
                />
              </div>
            </div>

            {/* Gateway Telemetry Preview */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850 space-y-2">
              <h4 className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-850 pb-1.5 flex items-center gap-1">
                <DollarSign size={12} /> Gateway Balance Telemetry
              </h4>
              <div className="grid grid-cols-2 gap-y-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                <span>Original Order Paid:</span>
                <span className="text-right text-zinc-900 dark:text-zinc-100 font-mono">₹{paymentAmt.toFixed(2)}</span>

                <span>Available Gateway Balance:</span>
                <span className="text-right text-zinc-900 dark:text-zinc-100 font-mono">₹{availableBal.toFixed(2)}</span>

                <div className="col-span-2 border-t border-zinc-200 dark:border-zinc-850 my-1 pt-1.5 flex justify-between font-bold text-xs text-emerald-600">
                  <span>Authorized Disbursement:</span>
                  <span className="font-mono">₹{parseFloat(refundAmount || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Admin Notes */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Admin Notes / Reason for Release</label>
              <textarea 
                rows="2"
                placeholder="Include approval code, client ticket ID, or policy exceptions..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-400"
              />
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
              className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Processing Gateway...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={13} />
                  <span>Process Refund</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
