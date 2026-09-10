import React, { useState, useEffect } from "react";
import { Modal, Select, Input } from "antd";
import { PauseCircle, AlertTriangle, FileText } from "lucide-react";

const { TextArea } = Input;

export default function PauseBakingModal({ visible, onClose, item, onPause }) {
  const [reason, setReason] = useState("Machine issue");
  const [notes, setNotes] = useState("");

  // Reset inputs when item or modal state changes
  useEffect(() => {
    if (item) {
      setReason("Machine issue");
      setNotes("");
    }
  }, [item, visible]);

  if (!item) return null;

  const handleSubmit = () => {
    if (!reason) return;
    onPause({
      orderItemId: item._id,
      reason,
      notes,
    });
    onClose();
  };

  const reasonOptions = [
    { value: "Machine issue", label: "Machine issue" },
    { value: "Power failure", label: "Power failure" },
    { value: "Maintenance", label: "Maintenance" },
    { value: "Emergency stop", label: "Emergency stop" },
    { value: "Other", label: "Other" }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <PauseCircle size={18} className="text-amber-500 animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Pause Baking Operation</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Temporarily halt oven cooking for this item
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
            className="px-4 py-2 bg-amber-500 hover:bg-amber-605 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Pause Operation
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Item Summary Card */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {item.name}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            {item.size} • {item.crust} • Qty {item.quantity} (Order #{item.orderNumber})
          </p>
        </div>

        {/* Halt Selection Form */}
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle size={10} className="text-amber-500" /> Pause Reason
            </label>
            <Select
              className="w-full h-9 text-xs"
              value={reason}
              onChange={(val) => setReason(val)}
              popupClassName="dark:bg-zinc-900"
              options={reasonOptions}
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <FileText size={10} /> Additional Notes
            </label>
            <TextArea
              placeholder="Provide context regarding the halt (e.g. thermostat malfunction, visual inspection pause)..."
              rows={3}
              className="text-xs"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
