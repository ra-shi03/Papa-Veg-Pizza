import React from "react";
import { Modal } from "antd";
import { AlertTriangle } from "lucide-react";

export default function ActivateDeactivateModal({ visible, onCancel, onConfirm, coupon }) {
  if (!coupon) return null;

  const isActive = coupon.status === "active";
  const actionText = isActive ? "deactivate" : "activate";

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
        <div className={`p-3 rounded-full ${isActive ? "bg-amber-50 text-amber-500" : "bg-emerald-50 text-emerald-500"} mb-4`}>
          <AlertTriangle size={32} />
        </div>
        
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
          Confirm Coupon Status Change
        </h3>
        
        <p className="text-zinc-650 dark:text-zinc-400 text-xs font-semibold leading-relaxed mb-6">
          Are you sure you want to <span className="font-bold">{actionText}</span> the coupon code <span className="font-bold text-slate-900 dark:text-white">"{coupon.couponCode}"</span>?
          {isActive ? (
            <span className="block mt-1">Customers will no longer be able to use it during checkout.</span>
          ) : (
            <span className="block mt-1">Customers will be able to apply this discount code immediately at checkout.</span>
          )}
        </p>

        <div className="flex items-center gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase rounded-lg hover:bg-zinc-50 transition-colors text-[10px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 px-4 text-white font-extrabold uppercase rounded-lg transition-all text-[10px] cursor-pointer shadow-md ${
              isActive 
                ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)]" 
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            Confirm {isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
