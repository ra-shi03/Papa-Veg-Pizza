import React from "react";
import { Modal } from "antd";
import { PlayCircle, ChefHat } from "lucide-react";

export default function StartAssemblyModal({ visible, onClose, item, chefs = [], onConfirm }) {
  if (!item) return null;

  const chef = chefs.find((c) => c._id === item.assigned_chef);

  const handleConfirm = () => {
    onConfirm({ orderItemId: item._id });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <PlayCircle size={18} className="text-[var(--primary)] animate-pulse" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Start Pizza Assembly</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 mt-0.5">
              Confirm start of toppings prep on workstation
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
            Start Assembly
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-3.5 text-xs">
        <div className="text-center bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1.5">
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {item.name}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
            {item.size} • {item.crust} • Qty {item.quantity} (Order #{item.orderNumber})
          </p>
        </div>

        <div className="space-y-2 px-1">
          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-450 font-bold">
            <span>Assigned Chef:</span>
            <span className="text-slate-900 dark:text-white font-black flex items-center gap-1">
              <ChefHat size={12} className="text-slate-400" />
              {chef ? chef.name : "Not Assigned"}
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-500 dark:text-zinc-450 font-bold">
            <span>Target Preparation Time:</span>
            <span className="text-[var(--primary)] font-black">
              {item.target_time || 10} minutes
            </span>
          </div>
        </div>

        <p className="text-[10px] font-medium text-slate-450 dark:text-zinc-500 text-center leading-relaxed pt-1.5 border-t border-slate-50 dark:border-zinc-850">
          This will trigger a live preparation timer and alert the supervisor that assembly has commenced.
        </p>
      </div>
    </Modal>
  );
}
