import React from "react";
import { Modal } from "antd";
import { ArrowRight, Flame } from "lucide-react";

export default function MoveStageModal({ visible, onClose, item, onConfirm }) {
  if (!item) return null;

  const nextStages = {
    assigned: "dough_prep",
    dough_prep: "sauce",
    sauce: "toppings",
    toppings: "ready_for_baking"
  };

  const stageLabels = {
    assigned: "Assigned",
    dough_prep: "Dough Prep",
    sauce: "Sauce",
    toppings: "Toppings",
    ready_for_baking: "Ready for Baking"
  };

  const nextStage = nextStages[item.current_stage];

  const handleConfirm = () => {
    onConfirm({ orderItemId: item._id, stage: nextStage });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <Flame size={18} className="text-[var(--primary)]" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Advance Preparation Stage</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-0.5">
              Confirm movement in the kitchen workflow
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
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Advance Stage
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs text-center">
        <div>
          <h4 className="text-sm font-black text-slate-900 dark:text-white">
            {item.name}
          </h4>
          <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-0.5">
            {item.size} • {item.crust} • Qty {item.quantity} (Order #{item.orderNumber})
          </p>
        </div>

        {/* Visual Stepper Indicators */}
        <div className="flex items-center justify-center gap-4 bg-slate-50 dark:bg-zinc-950 p-4 rounded-2xl border border-slate-100 dark:border-zinc-850">
          <div className="text-center">
            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">
              From
            </span>
            <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 font-black rounded-lg border border-amber-100 dark:border-amber-900/30 text-[10px]">
              {stageLabels[item.current_stage]}
            </span>
          </div>

          <ArrowRight size={16} className="text-slate-400 shrink-0 mt-3" />

          <div className="text-center">
            <span className="text-[8px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block mb-1">
              To
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-black rounded-lg border border-emerald-100 dark:border-emerald-900/30 text-[10px]">
              {stageLabels[nextStage]}
            </span>
          </div>
        </div>

        <p className="text-[10px] font-medium text-slate-500 dark:text-zinc-400 px-2 leading-relaxed">
          Updating this item will inform the assigned chef and automatically refresh the dashboard columns for the crew.
        </p>
      </div>
    </Modal>
  );
}
