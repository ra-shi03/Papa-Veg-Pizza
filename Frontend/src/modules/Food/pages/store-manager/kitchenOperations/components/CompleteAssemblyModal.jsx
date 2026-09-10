import React, { useState, useEffect } from "react";
import { Modal } from "antd";
import { CheckCircle2, Clock } from "lucide-react";

export default function CompleteAssemblyModal({ visible, onClose, item, onConfirm }) {
  const [elapsed, setElapsed] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (item && item.assembly_started_time) {
      const start = new Date(item.assembly_started_time);
      const diff = Math.floor((new Date() - start) / 60000);
      setElapsed(Math.max(0, diff));
    }
  }, [item, visible]);

  if (!item) return null;

  const handleConfirm = () => {
    onConfirm({ orderItemId: item._id, notes: notes.trim() });
    setNotes("");
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <CheckCircle2 size={18} className="text-emerald-500" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Complete Pizza Assembly</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 mt-0.5">
              Ready pizza items for baking line
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
            onClick={handleConfirm}
            className="px-4 py-2 bg-emerald-650 hover:bg-emerald-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Complete Assembly
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        <div className="text-center bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1.5">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {item.name}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            {item.size} • {item.crust} • Qty {item.quantity}
          </p>
          
          <div className="flex items-center justify-center gap-1 text-[10px] font-black text-slate-600 dark:text-zinc-400 mt-2 bg-white dark:bg-zinc-900 px-3 py-1 rounded-full border border-slate-150 dark:border-zinc-850 w-fit mx-auto">
            <Clock size={12} className="text-slate-400" />
            <span>Time Taken: {elapsed} minutes</span>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-slate-450 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
            Quality Check / Assembly Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="E.g. Cheese loaded, herbs seasoned, ready for baking..."
            rows={3}
            className="w-full p-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 resize-none font-medium"
          />
        </div>
      </div>
    </Modal>
  );
}
