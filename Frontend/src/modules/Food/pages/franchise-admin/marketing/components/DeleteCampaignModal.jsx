import React, { useState } from "react";
import { Modal } from "antd";
import { AlertTriangle } from "lucide-react";

export default function DeleteCampaignModal({ visible, onCancel, onConfirm, campaign, performance }) {
  const [deleting, setDeleting] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleConfirm = async () => {
    setDeleting(true);
    await onConfirm();
    setDeleting(false);
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 pb-2 text-rose-600 border-b border-rose-50 dark:border-rose-950/20">
          <AlertTriangle size={18} className="animate-pulse" />
          <span className="text-xs font-black uppercase tracking-wider">
            Confirm Campaign Deletion
          </span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      footer={
        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            disabled={deleting}
            onClick={onCancel}
            className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg border-0 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-250 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={deleting}
            onClick={handleConfirm}
            className="px-4 py-1.5 h-8 text-[10px] font-extrabold uppercase rounded-lg bg-rose-600 hover:bg-rose-700 text-white border-0 cursor-pointer shadow-md shadow-rose-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {deleting ? "Deleting..." : "Archive & Delete"}
          </button>
        </div>
      }
      width={500}
      centered
      destroyOnClose
    >
      <div className="py-4 space-y-4 font-['Poppins']">
        <p className="text-xs text-zinc-550 dark:text-zinc-400 font-semibold leading-relaxed">
          Are you sure you want to delete this campaign? This action performs a soft-delete which archives the campaign from the active list. Historical performance stats will remain archived in data reports.
        </p>

        {campaign && (
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/30 rounded-xl space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="block text-[8px] font-black uppercase text-zinc-400">Campaign Name</span>
                <span className="font-bold text-slate-805 dark:text-zinc-200">{campaign.campaignName}</span>
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase text-zinc-400">Campaign Type</span>
                <span className="font-bold text-slate-805 dark:text-zinc-200 capitalize">
                  {campaign.campaignType?.replace("_", " ")}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-rose-100/50 dark:border-rose-900/20">
              <div>
                <span className="block text-[8px] font-black uppercase text-zinc-400">Orders Generated</span>
                <span className="font-extrabold text-slate-900 dark:text-white">
                  {performance?.ordersGenerated?.toLocaleString("en-IN") || 0} Orders
                </span>
              </div>
              <div>
                <span className="block text-[8px] font-black uppercase text-zinc-400">Revenue Generated</span>
                <span className="font-extrabold text-emerald-600">
                  {formatCurrency(performance?.revenueGenerated || 0)}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
