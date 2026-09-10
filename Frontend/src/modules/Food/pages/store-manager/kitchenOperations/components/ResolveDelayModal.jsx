import React, { useState, useEffect } from "react";
import { Modal, Input } from "antd";
import { CheckCircle, Info, FileText } from "lucide-react";

const { TextArea } = Input;

export default function ResolveDelayModal({ visible, onClose, order, onConfirm }) {
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      setNotes("");
    }
  }, [order, visible]);

  if (!order) return null;

  const handleConfirm = () => {
    onConfirm({
      orderId: order._id,
      resolutionNotes: notes
    });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <CheckCircle size={18} className="text-emerald-500" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Resolve Delay Warning</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Confirm resolution of SLA warning for Order #{order.orderNumber}
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={400}
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Confirm Resolution
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Delay Details summary */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-850 grid grid-cols-3 gap-2 font-bold text-slate-700 dark:text-zinc-300 text-center">
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-2 rounded-xl">
            <span className="text-[8px] text-slate-400 dark:text-zinc-555 block mb-0.5 uppercase">Order ID</span>
            <span className="font-extrabold text-[10px] text-slate-800 dark:text-white">{order.orderNumber}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-2 rounded-xl">
            <span className="text-[8px] text-slate-400 dark:text-zinc-555 block mb-0.5 uppercase">Current Stage</span>
            <span className="font-extrabold text-[10px] uppercase text-[var(--secondary)]">{order.status}</span>
          </div>
          <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-2 rounded-xl">
            <span className="text-[8px] text-slate-400 dark:text-zinc-555 block mb-0.5 uppercase">Breach Duration</span>
            <span className="font-extrabold text-[10px] text-rose-500">{order.delay_duration} min</span>
          </div>
        </div>

        {/* Resolution Notes field */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider flex items-center gap-1.5">
            <FileText size={10} /> Resolution Notes
          </label>
          <TextArea
            placeholder="Document what resolved the delay (e.g., Staff assigned, oven cleared, extra chef shifted)..."
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="text-xs"
          />
        </div>

        {/* Warning info */}
        <div className="flex gap-2 p-2.5 bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-950/20 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold leading-normal text-[10px]">
          <Info size={12} className="shrink-0 mt-0.5" />
          <span>Resolving this issue marks the order as non-delayed and removes it from the active warning display.</span>
        </div>
      </div>
    </Modal>
  );
}
