import React from "react";
import { Modal } from "antd";
import { CheckCircle2, User, Clock, AlertTriangle } from "lucide-react";

export default function MarkReadyModal({ visible, onClose, order, onConfirm }) {
  if (!order) return null;

  let totalTimeText = "5 mins";
  if (order.packaging_start_time) {
    const end = order.packaging_end_time ? new Date(order.packaging_end_time) : new Date();
    const diffMs = end - new Date(order.packaging_start_time);
    const mins = Math.max(1, Math.round(diffMs / 60000));
    totalTimeText = `${mins} min${mins > 1 ? "s" : ""}`;
  }

  const handleConfirm = () => {
    onConfirm({ orderId: order._id });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <CheckCircle2 size={18} className="text-emerald-500 animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Mark Ready For Pickup</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Confirm order is ready at dispatch counter
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={360}
      centered
      footer={
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Mark Ready
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Order Card */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1.5 text-center">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            Order #{order.orderNumber}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            {order.deliveryType} • {order.customer?.name}
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-450 font-bold">
            <span>Packaging Officer:</span>
            <span className="text-slate-900 dark:text-white font-black flex items-center gap-1">
              <User size={12} className="text-slate-400" />
              Karan Johar
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-450 font-bold">
            <span>Total Packaging Duration:</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-black flex items-center gap-1">
              <Clock size={12} />
              {totalTimeText}
            </span>
          </div>
        </div>

        {/* Warning notification */}
        <div className="flex items-start gap-1.5 p-2.5 bg-amber-50/50 dark:bg-amber-950/10 text-[10px] text-amber-655 dark:text-amber-400 rounded-xl border border-amber-150/40 dark:border-amber-900/20 leading-relaxed">
          <AlertTriangle size={13} className="shrink-0 mt-0.5 text-amber-500 animate-pulse" />
          <span>Marking this order as ready will instantly trigger SMS alerts and dispatch updates to the customer, delivery team, and store monitors.</span>
        </div>
      </div>
    </Modal>
  );
}
