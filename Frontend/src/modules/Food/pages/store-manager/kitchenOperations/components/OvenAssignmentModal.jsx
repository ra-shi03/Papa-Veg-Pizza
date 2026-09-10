import React, { useState, useEffect } from "react";
import { Modal, Select, Input, InputNumber, Skeleton } from "antd";
import { PlayCircle, Flame, Clock, Clipboard } from "lucide-react";
import { useOvens } from "../hooks/useBakingStation";

const { TextArea } = Input;

export default function OvenAssignmentModal({ visible, onClose, item, onConfirm }) {
  const { data: ovens = [], isLoading } = useOvens("available");
  const safeOvens = Array.isArray(ovens) ? ovens : [];
  
  const [selectedOvenId, setSelectedOvenId] = useState("");
  const [temperature, setTemperature] = useState(250);
  const [expectedDuration, setExpectedDuration] = useState(8);
  const [remarks, setRemarks] = useState("");

  // Reset local state when item changes
  useEffect(() => {
    if (item) {
      setSelectedOvenId("");
      setTemperature(250);
      setExpectedDuration(item.target_time || 8);
      setRemarks(item.remarks || "");
    }
  }, [item, visible]);

  if (!item) return null;

  const handleConfirm = () => {
    if (!selectedOvenId) return;
    onConfirm({
      orderItemId: item._id,
      ovenId: selectedOvenId,
      temperature,
      expectedDuration,
      remarks,
    });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <PlayCircle size={18} className="text-[var(--primary)] animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Assign Oven & Start Baking</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Select an available oven deck to begin baking
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
            disabled={!selectedOvenId}
            className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              selectedOvenId
                ? "bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)]"
                : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
            }`}
          >
            Start Baking
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Pizza Details card */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {item.name}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            {item.size} • {item.crust} • Qty {item.quantity} (Order #{item.orderNumber})
          </p>
        </div>

        {/* Oven Selection Form */}
        <div className="space-y-3.5">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
              Select Oven
            </label>
            {isLoading ? (
              <Skeleton.Input active size="small" block />
            ) : (
              <Select
                placeholder="Choose available oven..."
                className="w-full h-9 text-xs"
                value={selectedOvenId || undefined}
                onChange={(val) => setSelectedOvenId(val)}
                popupClassName="dark:bg-zinc-900"
                options={safeOvens.map(o => ({
                  value: o._id,
                  label: `${o.oven_number} (${o.temperature}°C)`
                }))}
              />
            )}
            {!isLoading && safeOvens.length === 0 && (
              <p className="text-[10px] font-bold text-rose-500 mt-1">
                ⚠️ No ovens are currently available. Free up an oven or reassign first.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Flame size={10} /> Temperature (°C)
              </label>
              <InputNumber
                min={100}
                max={400}
                className="w-full h-9 flex items-center"
                value={temperature}
                onChange={(val) => setTemperature(val || 250)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Clock size={10} /> Duration (min)
              </label>
              <InputNumber
                min={1}
                max={60}
                className="w-full h-9 flex items-center"
                value={expectedDuration}
                onChange={(val) => setExpectedDuration(val || 8)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Clipboard size={10} /> Remarks / Special Instructions
            </label>
            <TextArea
              placeholder="Add any specific deck details or baking requests..."
              rows={2}
              className="text-xs"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
