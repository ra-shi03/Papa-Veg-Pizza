import React, { useState } from "react";
import { Modal, Select } from "antd";
import { PauseCircle, AlertTriangle } from "lucide-react";

export default function PausePreparationModal({ visible, onClose, item, onPause }) {
  const [reason, setReason] = useState("Equipment issue");
  const [notes, setNotes] = useState("");

  if (!item) return null;

  const handleSubmit = () => {
    onPause({ orderItemId: item._id, reason, notes: notes.trim() });
    setReason("Equipment issue");
    setNotes("");
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <PauseCircle size={18} className="text-amber-500" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Pause Preparation</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-0.5">
              Halt preparation timers for {item.name}
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
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Confirm Pause
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-3.5 text-xs">
        {/* Info label */}
        <div className="bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 p-2.5 rounded-xl text-[10px] font-bold border border-amber-100 dark:border-amber-900/30 flex gap-1.5 items-start">
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>Pausing will freeze the SLA timer and log an interruption reason in the manager dashboard.</span>
        </div>

        {/* Reason selector */}
        <div className="space-y-1.5">
          <label className="text-slate-450 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
            Halt Reason
          </label>
          <Select
            value={reason}
            onChange={(val) => setReason(val)}
            className="w-full text-xs font-bold"
            options={[
              { value: "Equipment issue", label: "Equipment issue (e.g. Oven down)" },
              { value: "Ingredient unavailable", label: "Ingredient unavailable" },
              { value: "Chef unavailable", label: "Chef unavailable" },
              { value: "Other", label: "Other Reasons" }
            ]}
            popupClassName="dark:bg-zinc-900"
          />
        </div>

        {/* Notes Textarea */}
        <div className="space-y-1.5">
          <label className="text-slate-450 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
            Additional Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Describe details of the delay..."
            rows={3}
            className="w-full p-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-amber-500 focus:border-amber-500 resize-none font-medium"
          />
        </div>
      </div>
    </Modal>
  );
}
