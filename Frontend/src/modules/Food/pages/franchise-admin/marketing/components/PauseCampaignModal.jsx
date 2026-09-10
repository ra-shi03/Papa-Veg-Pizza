import React, { useState } from "react";
import { Modal } from "antd";
import { AlertCircle } from "lucide-react";

export default function PauseCampaignModal({ visible, onCancel, onConfirm, campaign }) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 text-amber-500 border-b border-amber-50 dark:border-amber-950/20">
          <AlertCircle size={18} />
          <span className="text-xs font-black uppercase tracking-wider">
            Pause Campaign Offer
          </span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            disabled={submitting}
            onClick={onCancel}
            className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg border-0 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-250 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={handleConfirm}
            className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg bg-amber-500 hover:bg-amber-600 text-white border-0 cursor-pointer shadow-md shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {submitting ? "Pausing..." : "Pause Campaign"}
          </button>
        </div>
      }
      width={450}
      centered
      destroyOnClose
    >
      <div className="py-4 font-['Poppins']">
        <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed">
          Pause this campaign?
        </p>
        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-2 leading-relaxed">
          Stores will stop using this campaign and customers will not be able to claim coupons/offers linked with <strong>{campaign?.campaignName || "this campaign"}</strong> until it is resumed.
        </p>
      </div>
    </Modal>
  );
}
