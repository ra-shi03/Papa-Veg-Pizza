import React, { useState } from "react";
import { Modal } from "antd";
import { Play } from "lucide-react";

export default function ResumeCampaignModal({ visible, onCancel, onConfirm, campaign }) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    await onConfirm();
    setSubmitting(false);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 text-emerald-600 border-b border-emerald-50 dark:border-emerald-950/20">
          <Play size={16} fill="currentColor" />
          <span className="text-xs font-black uppercase tracking-wider">
            Resume Campaign Offer
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
            className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg bg-emerald-650 hover:bg-emerald-705 text-white border-0 cursor-pointer bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {submitting ? "Resuming..." : "Resume Campaign"}
          </button>
        </div>
      }
      width={450}
      centered
      destroyOnClose
    >
      <div className="py-4 font-['Poppins']">
        <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed">
          Resume campaign?
        </p>
        <p className="text-[10px] text-zinc-450 dark:text-zinc-500 mt-2 leading-relaxed">
          This will set the status of <strong>{campaign?.campaignName || "this campaign"}</strong> to <strong>Active</strong>. Stores will immediately start offering this campaign to checkouts.
        </p>
      </div>
    </Modal>
  );
}
