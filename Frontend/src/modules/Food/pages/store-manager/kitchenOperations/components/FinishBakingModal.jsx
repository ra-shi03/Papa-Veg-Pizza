import React, { useState, useEffect } from "react";
import { Modal, Input } from "antd";
import { CheckCircle2, Clock, Flame, Info } from "lucide-react";

const { TextArea } = Input;

export default function FinishBakingModal({ visible, onClose, item, onConfirm }) {
  const [remarks, setRemarks] = useState("");
  const [elapsedText, setElapsedText] = useState("0m 0s");

  // Reset remarks and calculate initial elapsed time
  useEffect(() => {
    if (item && visible) {
      setRemarks(item.remarks || "");
      
      const calculateElapsed = () => {
        if (!item.started_time) return "N/A";
        const diffMs = new Date() - new Date(item.started_time);
        const diffSecs = Math.floor(diffMs / 1000);
        const mins = Math.floor(diffSecs / 60);
        const secs = diffSecs % 60;
        return `${mins}m ${secs}s`;
      };
      
      setElapsedText(calculateElapsed());

      const timer = setInterval(() => {
        setElapsedText(calculateElapsed());
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [item, visible]);

  if (!item) return null;

  const handleSubmit = () => {
    onConfirm({
      orderItemId: item._id,
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
            <h3 className="text-base font-black text-slate-900 dark:text-white">Complete Baking</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Confirm this pizza is fully baked and ready for packaging
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
            Complete & Packaging
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Pizza Details card */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-2">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {item.name}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            {item.size} • {item.crust} • Qty {item.quantity} (Order #{item.orderNumber})
          </p>
        </div>

        {/* Oven parameters display */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50/50 dark:bg-zinc-950/50 p-3 rounded-xl border border-slate-100/50 dark:border-zinc-850/50">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase">
              Oven Deck
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
              <Flame size={12} className="text-[var(--primary)]" />
              {item.assigned_oven ? `OVEN-${item.assigned_oven.slice(-2).toUpperCase()}` : "N/A"}
            </span>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 block uppercase">
              Elapsed Time
            </span>
            <span className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
              <Clock size={12} className="text-emerald-500 animate-spin-slow" />
              {elapsedText}
            </span>
          </div>
        </div>

        {/* Remarks Input */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Final Baking Notes / Remarks
          </label>
          <TextArea
            placeholder="Add any final bake notes (e.g. perfect golden crust, light toppings toast)..."
            rows={2.5}
            className="text-xs"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
          />
        </div>

        {/* Info footer */}
        <div className="flex items-start gap-1.5 p-2 bg-emerald-50/50 dark:bg-emerald-950/10 text-[10px] text-emerald-655 dark:text-emerald-400 rounded-lg border border-emerald-100/40 dark:border-emerald-900/20 leading-normal">
          <Info size={12} className="mt-0.5 flex-shrink-0" />
          <span>Completing this step will notify the Packaging Station to prepare for slicing and boxed dispatch.</span>
        </div>
      </div>
    </Modal>
  );
}
