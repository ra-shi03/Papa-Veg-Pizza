import React from "react";
import { Modal } from "antd";
import { Trash2 } from "lucide-react";

export default function DeleteConfirmationModal({ visible, onCancel, onConfirm, coupon, usageCount = 0 }) {
  if (!coupon) return null;

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={450}
      centered
      className="font-['Poppins']"
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="p-3 rounded-full bg-rose-50 text-rose-500 mb-4 animate-bounce">
          <Trash2 size={32} />
        </div>
        
        <h3 className="text-base font-black text-rose-600 mb-2 uppercase tracking-wide">
          Warning: Delete Coupon
        </h3>
        
        <p className="text-zinc-650 dark:text-zinc-400 text-xs font-semibold leading-relaxed mb-6">
          Are you sure you want to permanently delete the coupon <span className="font-bold text-slate-900 dark:text-white">"{coupon.couponCode}"</span>?
          This action cannot be undone.
        </p>

        {/* Info panel */}
        <div className="w-full bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 mb-6 text-left space-y-2">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-zinc-400 uppercase">Coupon Code:</span>
            <span className="font-bold text-slate-900 dark:text-white font-mono">{coupon.couponCode}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-zinc-400 uppercase">Coupon Title:</span>
            <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">{coupon.title}</span>
          </div>
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-bold text-zinc-400 uppercase">Usage Count:</span>
            <span className="font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded">{usageCount} Times Used</span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase rounded-lg hover:bg-zinc-50 transition-colors text-[10px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-750 text-white font-extrabold uppercase rounded-lg transition-all text-[10px] cursor-pointer shadow-md"
          >
            Delete Coupon
          </button>
        </div>
      </div>
    </Modal>
  );
}
