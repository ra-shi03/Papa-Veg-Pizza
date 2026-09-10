import React from "react";
import { Modal } from "antd";
import { PlayCircle, ShieldCheck, User } from "lucide-react";

export default function StartPackagingModal({ visible, onClose, order, onConfirm }) {
  if (!order) return null;

  const totalItemsCount = order.items?.reduce((acc, curr) => acc + curr.quantity, 0) || 0;

  const handleConfirm = () => {
    onConfirm({ orderId: order._id });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <PlayCircle size={18} className="text-[var(--primary)] animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Start Order Packaging</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Initiate packaging sequence and quality checklists
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
            Start Packaging
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Order details panel */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1.5 text-center">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            Order #{order.orderNumber}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            {order.deliveryType} • {totalItemsCount} total items
          </p>
        </div>

        {/* Breakdown */}
        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-450 font-bold">
            <span>Customer Name:</span>
            <span className="text-slate-900 dark:text-white font-black">{order.customer?.name}</span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-450 font-bold">
            <span>Assigned Officer:</span>
            <span className="text-slate-900 dark:text-white font-black flex items-center gap-1">
              <User size={12} className="text-slate-400" />
              Karan Johar (Pack Lead)
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-450 font-bold">
            <span>SLA Target:</span>
            <span className="text-[var(--primary)] font-black">5 minutes sealing</span>
          </div>
        </div>

        <div className="flex items-start gap-1.5 p-2.5 bg-blue-50/50 dark:bg-blue-950/10 text-[10px] text-blue-655 dark:text-blue-400 rounded-xl border border-blue-150/40 dark:border-blue-900/20 leading-relaxed">
          <ShieldCheck size={13} className="shrink-0 mt-0.5 text-blue-500" />
          <span>Starting this order will open the operational checklist where you verify the items, sauces, bill attachment, and box sealing.</span>
        </div>
      </div>
    </Modal>
  );
}
