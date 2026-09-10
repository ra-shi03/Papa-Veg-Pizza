import React, { useState } from 'react';
import { X, Landmark, Percent } from 'lucide-react';
import { toast } from 'sonner';

export default function RefundModal({ isOpen, onClose, complaint, onRefundSuccess }) {
  const orderAmount = complaint?.orderAmount || 650;
  const previousRefunds = complaint?.previousRefunds || 0;
  const eligibleAmount = orderAmount - previousRefunds;

  const [refundAmount, setRefundAmount] = useState(eligibleAmount.toString());
  const [reason, setReason] = useState('Incorrect Items / Quality Issue');
  const [method, setMethod] = useState('UPI / Original Payment Mode');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(refundAmount);
    
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid refund amount');
      return;
    }
    if (amount > eligibleAmount) {
      toast.error(`Refund amount cannot exceed eligible balance of ₹${eligibleAmount}`);
      return;
    }

    setLoading(true);
    // Simulate POST /api/refunds
    setTimeout(() => {
      setLoading(false);
      toast.success(`Refund of ₹${amount} initiated successfully via ${method}`);
      if (onRefundSuccess) {
        onRefundSuccess(amount, reason, method);
      }
      onClose();
    }, 1200);
  };

  const refundReasons = [
    'Incorrect Items Delivered',
    'Bad Food Quality / Undercooked',
    'Missing Item from Order',
    'Late Delivery (>45 Minutes delay)',
    'Rider Spilled / Damaged Package',
    'Custom Operational Adjustment'
  ];

  const paymentMethods = [
    'UPI / Original Payment Mode (Google Pay/PhonePe/Paytm)',
    'Papa Store Wallet Credits',
    'Bank Transfer (NEFT/RTGS)'
  ];

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm animate-in fade-in duration-250">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-250" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Issue Refund</h2>
            <p className="text-[10px] text-zinc-500">Order: {complaint?.orderNumber || 'PV-9042'} • ID: {complaint?.complaintNumber || 'CMP-1049'}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Order Details Metrics */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-150 dark:border-zinc-800">
            <div className="text-center">
              <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Order Value</p>
              <p className="text-sm font-extrabold text-zinc-850 dark:text-zinc-100 mt-0.5">₹{orderAmount}</p>
            </div>
            <div className="text-center border-x border-zinc-200 dark:border-zinc-700">
              <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Prev Refunds</p>
              <p className="text-sm font-extrabold text-red-600 dark:text-red-400 mt-0.5">₹{previousRefunds}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-bold text-zinc-500 dark:text-zinc-400 uppercase">Eligible Max</p>
              <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{eligibleAmount}</p>
            </div>
          </div>

          {/* Refund Amount */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Refund Amount (INR)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-zinc-500">₹</span>
              <input
                type="number"
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={eligibleAmount}
                min="1"
                step="0.01"
                required
                className="w-full h-9 pl-7 pr-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs font-bold text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
              />
            </div>
          </div>

          {/* Method Selection */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Refund Settlement Method</label>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              {paymentMethods.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          {/* Refund Reason */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Refund Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
            >
              {refundReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Notification Info banner */}
          <div className="p-2.5 rounded-lg border border-[var(--primary)]/20 bg-[var(--primary)]/5 flex items-start gap-2">
            <Landmark className="w-4 h-4 text-[var(--primary)] shrink-0 mt-0.5" />
            <p className="text-[9px] text-zinc-650 dark:text-zinc-400 leading-normal">
              Note: This action calls the gateway api (`POST /api/refunds`). It automatically updates refund fields on the complaint ticket and notifies the customer via SMS/Email/Push alerts.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-8 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-8 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading ? 'Processing...' : (
                <>
                  <Percent className="w-3.5 h-3.5" />
                  Confirm & Issue Refund
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
