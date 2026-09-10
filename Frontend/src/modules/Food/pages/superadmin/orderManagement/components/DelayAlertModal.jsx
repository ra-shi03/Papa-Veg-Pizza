// DelayAlertModal.jsx
import React, { useState } from 'react';
import { X, AlertTriangle, Send, Bell } from 'lucide-react';
import { postOrderDelayAlert } from '../AllOrdersData';
import { toast } from 'sonner';

export default function DelayAlertModal({ isOpen, onClose, order, onActionComplete }) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || !order) return null;

  const handleEscalate = async (type) => {
    if (!reason.trim()) {
      toast.error('Please enter escalation notes or reason');
      return;
    }
    setLoading(true);
    try {
      await postOrderDelayAlert(order.orderId || order._id, `${type.toUpperCase()} NOTIFICATION: ${reason}`);
      toast.success(`Escalation triggered: ${type} notified successfully.`);
      if (onActionComplete) onActionComplete();
      onClose();
    } catch (err) {
      toast.error('Failed to process escalation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 select-none text-zinc-800 dark:text-zinc-150">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-205 dark:border-zinc-800 bg-red-500/10 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-bold text-red-650 dark:text-red-400 flex items-center gap-1.5">
            <AlertTriangle size={16} className="text-red-500 animate-bounce" />
            CRITICAL DELAY ALERT
          </h3>
          <button 
            className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-3.5">
          {/* Order Details Brief */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold space-y-2">
            <div className="flex justify-between">
              <span className="text-zinc-450">Order Number:</span>
              <span className="font-mono text-[var(--primary)]">{order.orderNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-455">Current Stage:</span>
              <span className="text-orange-500">{order.orderStatus}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-455">Delay Duration:</span>
              <span className="text-red-600 font-extrabold">{order.delayText || '15 min delay'}</span>
            </div>
            <div className="flex justify-between border-t border-zinc-200 dark:border-zinc-800 pt-1.5">
              <span className="text-zinc-455">Rider Assigned:</span>
              <span>{order.rider?.name || 'Rahul Dev'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-zinc-455">Outlet Store:</span>
              <span>{order.store?.name}</span>
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-[10px] font-bold text-zinc-550 dark:text-zinc-450 uppercase tracking-widest">
              Escalation Remarks / Notes *
            </label>
            <textarea
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-zinc-300 dark:border-zinc-700 rounded-lg p-2 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all resize-none font-semibold" 
              placeholder="State the reason or remarks for delay action..." 
              rows="3"
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
            <button
              type="button"
              disabled={loading || !reason.trim()}
              onClick={() => handleEscalate('Store')}
              className="py-2 px-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 flex flex-col items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Bell size={14} />
              <span>Notify Store</span>
            </button>
            <button
              type="button"
              disabled={loading || !reason.trim()}
              onClick={() => handleEscalate('Rider')}
              className="py-2 px-1 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 flex flex-col items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <Send size={14} />
              <span>Notify Rider</span>
            </button>
            <button
              type="button"
              disabled={loading || !reason.trim()}
              onClick={() => handleEscalate('Admin')}
              className="py-2 px-1 bg-red-650 hover:bg-red-750 text-white rounded-lg text-[10px] font-bold transition-all active:scale-95 flex flex-col items-center gap-1 cursor-pointer disabled:opacity-50"
            >
              <AlertTriangle size={14} />
              <span>Escalate Admin</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end shrink-0">
          <button 
            className="h-8 px-4 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95"
            onClick={onClose}
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
