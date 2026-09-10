import React, { useState } from "react";
import { Modal, Input, InputNumber, Checkbox, Select, message } from "antd";
import { CheckCircle2 } from "lucide-react";
import useRiders from "../hooks/useRiders";
import useResolveIssue from "../hooks/useResolveIssue";

const { TextArea } = Input;

export default function ResolveIssueModal({ visible, onClose, issueId, onResolveSuccess }) {
  const [form, setForm] = useState({
    resolution: "",
    refundAmount: 0,
    penaltyAmount: 0,
    reassignRider: false,
    reassignRiderId: "",
    sendNotification: true
  });

  const { data: riders = [], isLoading: isLoadingRiders } = useRiders();
  const resolveMutation = useResolveIssue();

  const handleSubmit = () => {
    if (!form.resolution.trim()) {
      message.error("Please enter resolution notes");
      return;
    }
    if (form.reassignRider && !form.reassignRiderId) {
      message.error("Please select a rider to reassign");
      return;
    }

    const payload = {
      status: "resolved",
      resolution: form.resolution,
      refundAmount: form.refundAmount || 0,
      penaltyAmount: form.penaltyAmount || 0,
      reassignRiderId: form.reassignRider ? form.reassignRiderId : null
    };

    resolveMutation.mutate(
      { issueId, data: payload },
      {
        onSuccess: () => {
          message.success("Ticket resolved successfully.");
          // Clear form
          setForm({
            resolution: "",
            refundAmount: 0,
            penaltyAmount: 0,
            reassignRider: false,
            reassignRiderId: "",
            sendNotification: true
          });
          onResolveSuccess();
          onClose();
        },
        onError: () => {
          message.error("Failed to resolve issue ticket.");
        }
      }
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3 select-none">
          <CheckCircle2 size={16} className="text-emerald-500" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Resolve Delivery Ticket</h3>
            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Confirm resolution, issue refunds, or apply driver penalties.
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      centered
      width={460}
      footer={
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={resolveMutation.isPending}
            style={{ backgroundColor: "var(--primary)" }}
            className="px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {resolveMutation.isPending ? "Confirming..." : "Confirm Resolution"}
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs font-bold">
        
        {/* Resolution Notes */}
        <div className="space-y-1.5 text-left">
          <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px]">Resolution Actions taken *</span>
          <TextArea
            rows={3}
            placeholder="What actions were taken to clear this exception..."
            value={form.resolution}
            onChange={(e) => setForm(prev => ({ ...prev, resolution: e.target.value }))}
            className="rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-855 text-slate-800 dark:text-white"
          />
        </div>

        {/* Row: Refund & Penalty */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px]">Customer Refund (₹)</span>
            <InputNumber
              min={0}
              placeholder="₹ 0.00"
              value={form.refundAmount}
              onChange={(val) => setForm(prev => ({ ...prev, refundAmount: val }))}
              className="rounded-xl text-xs h-9 w-full bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-855 text-slate-800 dark:text-white font-mono flex items-center"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px]">Rider Penalty (₹)</span>
            <InputNumber
              min={0}
              placeholder="₹ 0.00"
              value={form.penaltyAmount}
              onChange={(val) => setForm(prev => ({ ...prev, penaltyAmount: val }))}
              className="rounded-xl text-xs h-9 w-full bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-855 text-slate-800 dark:text-white font-mono flex items-center"
            />
          </div>
        </div>

        {/* Checkbox Reassign Rider */}
        <div className="space-y-2 border-t border-slate-150/40 dark:border-zinc-800/40 pt-3 text-left">
          <Checkbox
            checked={form.reassignRider}
            onChange={(e) => setForm(prev => ({ ...prev, reassignRider: e.target.checked }))}
            className="text-xs font-bold text-slate-700 dark:text-zinc-300"
          >
            Reassign Delivery Rider
          </Checkbox>

          {form.reassignRider && (
            <div className="space-y-1 mt-2">
              <span className="text-slate-400 dark:text-zinc-555 uppercase text-[8px] font-black">Select New Rider</span>
              <Select
                placeholder="Choose a backup rider"
                value={form.reassignRiderId || undefined}
                onChange={(val) => setForm(prev => ({ ...prev, reassignRiderId: val }))}
                className="sa-select w-full h-9"
                loading={isLoadingRiders}
                options={riders
                  .filter(r => r.availability === "online" && r.currentStatus === "idle")
                  .map((r) => ({ value: r._id, label: `${r.name} (${r.vehicleType} - Idle)` }))
                }
              />
            </div>
          )}
        </div>

        {/* Checkbox Notify Customer */}
        <div className="text-left select-none">
          <Checkbox
            checked={form.sendNotification}
            onChange={(e) => setForm(prev => ({ ...prev, sendNotification: e.target.checked }))}
            className="text-[10px] font-semibold text-slate-400 dark:text-zinc-500"
          >
            Send automated status alert to Customer & Rider
          </Checkbox>
        </div>

      </div>
    </Modal>
  );
}
