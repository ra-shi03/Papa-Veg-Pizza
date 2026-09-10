// InitiateRefundModal.jsx
import React, { useState, useEffect } from 'react';
import { X, CreditCard, RefreshCw } from 'lucide-react';
import { initiateRefundApi } from '../AllOrdersData';

export default function InitiateRefundModal({ isOpen, onClose, order, onSuccess }) {
  const [refundType, setRefundType] = useState('Full');
  const [refundAmount, setRefundAmount] = useState('0');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setRefundAmount(order.grandTotal ? order.grandTotal.toString() : '0');
    }
  }, [order, isOpen]);

  useEffect(() => {
    if (order && refundType === 'Full') {
      setRefundAmount(order.grandTotal ? order.grandTotal.toString() : '0');
    }
  }, [refundType, order]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;
    if (parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > order.grandTotal) return;

    setLoading(true);
    try {
      const gateway = order.payment?.gateway || 'Razorpay';
      const result = await initiateRefundApi(order._id, refundType, parseFloat(refundAmount), reason, gateway);
      if (result.success) {
        onSuccess(`Refund of ₹${refundAmount} initiated successfully via ${gateway}.`);
        onClose();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 select-none text-zinc-800 dark:text-zinc-150">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <CreditCard size={16} className="text-blue-500" />
            Initiate Payment Refund
          </h3>
          <button 
            className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-widest">
                Payment Gateway
              </label>
              <input 
                type="text" 
                readOnly
                value={order.payment?.gateway || 'Razorpay'}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-3 text-xs text-zinc-500 outline-none font-bold"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-widest">
                Transaction ID
              </label>
              <input 
                type="text" 
                readOnly
                value={order.payment?.txnId || 'N/A'}
                className="w-full bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg h-9 px-3 text-xs text-zinc-500 outline-none font-mono font-bold truncate"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-widest">
              Refund Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRefundType('Full')}
                className={`h-9 rounded-lg text-xs font-bold border transition-all ${
                  refundType === 'Full' 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Full Refund
              </button>
              <button
                type="button"
                onClick={() => setRefundType('Partial')}
                className={`h-9 rounded-lg text-xs font-bold border transition-all ${
                  refundType === 'Partial' 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
              >
                Partial Refund
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-widest">
              Refund Amount (INR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">₹</span>
              <input 
                type="number"
                value={refundAmount}
                disabled={refundType === 'Full'}
                onChange={(e) => setRefundAmount(e.target.value)}
                max={order.grandTotal}
                min="1"
                className="w-full pl-7 pr-3 h-9 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all font-mono font-bold disabled:opacity-75"
              />
            </div>
            <span className="text-[9px] text-zinc-400 font-semibold">
              Original Paid amount: ₹{order.grandTotal}
            </span>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-widest">
              Refund Reason *
            </label>
            <textarea 
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-955 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all resize-none font-semibold" 
              placeholder="Explain the reason for refund request..." 
              rows="3"
            />
          </div>

          <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 h-9 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button 
              type="submit"
              disabled={loading || !reason.trim() || parseFloat(refundAmount) <= 0 || parseFloat(refundAmount) > order.grandTotal}
              className="flex-1 bg-blue-600 text-white h-9 rounded-lg text-xs font-bold hover:bg-blue-700 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : 'Initiate Refund'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
