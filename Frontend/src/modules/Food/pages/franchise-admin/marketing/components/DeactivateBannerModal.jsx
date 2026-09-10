import React from "react";
import { Modal } from "antd";
import { Pause } from "lucide-react";

export default function DeactivateBannerModal({ open, onCancel, onConfirm, banner }) {
  if (!banner) return null;

  return (
    <Modal
      title={null}
      open={open}
      onCancel={onCancel}
      footer={null}
      width={450}
      centered
      className="font-['Poppins']"
    >
      <div className="flex flex-col items-center text-center p-2">
        <div className="p-3 rounded-full bg-amber-50 text-amber-500 mb-4 shadow-sm">
          <Pause className="h-8 w-8 fill-current" />
        </div>
        
        <h3 className="text-base font-black text-slate-900 dark:text-white mb-2 uppercase tracking-wide">
          Deactivate Banner
        </h3>
        
        <p className="text-zinc-600 dark:text-zinc-400 text-xs font-semibold leading-relaxed mb-6">
          Are you sure you want to <span className="font-bold text-amber-600">deactivate</span> the promotional banner <span className="font-bold text-slate-900 dark:text-white">"{banner.title}"</span>?
          <span className="block mt-1">Customers will no longer see this banner in the client application.</span>
        </p>

        <div className="flex items-center gap-3 w-full">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors text-[10px] cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-extrabold uppercase rounded-lg transition-all text-[10px] cursor-pointer shadow-md"
          >
            Deactivate Banner
          </button>
        </div>
      </div>
    </Modal>
  );
}
