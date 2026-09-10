import React from "react";
import { Modal } from "antd";
import { AlertCircle, Loader2 } from "lucide-react";

export default function ConfirmationDialog({
  visible,
  onClose,
  onConfirm,
  rider,
  order,
  isPending
}) {
  if (!rider || !order) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <AlertCircle size={18} className="text-amber-500" />
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Assign Rider?</h3>
        </div>
      }
      open={visible}
      onCancel={isPending ? undefined : onClose}
      width={360}
      centered
      closable={!isPending}
      maskClosable={!isPending}
      footer={
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5 disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {isPending && <Loader2 size={12} className="animate-spin" />}
            <span>{isPending ? "Assigning..." : "Confirm Assignment"}</span>
          </button>
        </div>
      }
    >
      <div className="py-4 text-xs font-bold text-slate-700 dark:text-zinc-300 leading-relaxed">
        Are you sure you want to assign <strong className="text-slate-900 dark:text-white font-black">{rider.name}</strong> ({rider.vehicleType}) to order <strong className="text-[var(--primary)] font-black">#{order.orderNumber}</strong>?
      </div>
    </Modal>
  );
}
