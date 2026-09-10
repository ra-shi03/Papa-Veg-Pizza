import React, { useState, useEffect } from "react";
import { Modal, Input } from "antd";
import { CheckCircle2, Clock, ShieldCheck, Clipboard } from "lucide-react";

const { TextArea } = Input;

export default function SealPackageModal({ visible, onClose, order, onConfirm }) {
  const [remarks, setRemarks] = useState("");
  const [durationText, setDurationText] = useState("0m 0s");

  useEffect(() => {
    if (order && visible) {
      setRemarks("");
      
      const calculateDuration = () => {
        if (!order.packaging_start_time) return "N/A";
        const diffMs = new Date() - new Date(order.packaging_start_time);
        const diffSec = Math.floor(diffMs / 1000);
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        return `${mins}m ${secs}s`;
      };

      setDurationText(calculateDuration());

      const timer = setInterval(() => {
        setDurationText(calculateDuration());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [order, visible]);

  if (!order) return null;

  const handleSubmit = () => {
    onConfirm({
      orderId: order._id,
      remarks,
    });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <CheckCircle2 size={18} className="text-emerald-500 animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Seal Packaging</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Lock order boxes with hygiene seal stickers
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={380}
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
            onClick={handleSubmit}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Confirm & Seal Package
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Order Info Card */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            Order #{order.orderNumber}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            {order.customer?.name} • Qty {order.items?.length || 0} items
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-zinc-950/50 p-3 rounded-xl border border-slate-100/50 dark:border-zinc-850/50">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase">
              Checklist
            </span>
            <span className="text-xs font-black text-emerald-650 dark:text-emerald-400 flex items-center gap-1">
              <ShieldCheck size={12} />
              100% Verified
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase">
              Packaging Time
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
              <Clock size={12} className="text-[var(--primary)] animate-spin-slow" />
              {durationText}
            </span>
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-555 uppercase tracking-wider block">
            Sealing Remarks / Notes
          </label>
          <TextArea
            placeholder="Add any sealing notes (e.g. triple tapes applied, safety seal attached)..."
            rows={2.5}
            className="text-xs"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
