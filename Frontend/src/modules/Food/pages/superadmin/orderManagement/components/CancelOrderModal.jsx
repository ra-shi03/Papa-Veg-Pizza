// CancelOrderModal.jsx
import React, { useState } from 'react';
import { toast } from 'sonner';
import { X, AlertTriangle, RefreshCw } from 'lucide-react';
import { cancelOrderApi } from '../AllOrdersData';

export default function CancelOrderModal({ isOpen, onClose, order, onSuccess }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!reason.trim()) return;

    setLoading(true);
    try {
      const result = await cancelOrderApi(order._id, reason);
      if (result.success) {
        onSuccess(`Order ${order.orderNumber} cancelled successfully.`);
        onClose();
      }
    } catch (err) {
      toast.error(err.message);
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
          <h3 className="text-sm font-bold text-red-650 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle size={16} />
            Confirm Order Cancellation
          </h3>
          <button 
            className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200/30 rounded-xl p-3 text-xs text-red-800 dark:text-red-400 leading-normal font-semibold">
            Warning: Cancelling this order is an irreversible action. This will stop the kitchen prep flow and notify the customer.
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-400 uppercase tracking-widest">
              Cancellation Reason *
            </label>
            <textarea 
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all resize-none font-semibold" 
              placeholder="Provide cancellation details (e.g. Out of stock ingredients, Customer request)..." 
              rows="3"
            />
          </div>

          {order.paymentStatus === 'Paid' && (
            <p className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400">
              This order is paid (₹{order.grandTotal}). Cancelling it refunds the customer in full, automatically.
            </p>
          )}

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
              disabled={loading || !reason.trim()}
              className="flex-1 bg-red-600 text-white h-9 rounded-lg text-xs font-bold hover:bg-red-700 shadow-sm active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? <RefreshCw size={12} className="animate-spin" /> : 'Confirm Cancellation'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
