import React, { useState } from "react";
import { Modal, Input, Select, Upload, message } from "antd";
import { Loader2, Plus, Camera } from "lucide-react";
import useRiders from "../hooks/useRiders";
import useCreateIssue from "../hooks/useCreateIssue";

const { TextArea } = Input;

export default function CreateIssueModal({ visible, onClose }) {
  const [form, setForm] = useState({
    orderId: "",
    riderId: "",
    issueType: "Late Delivery",
    severity: "medium",
    description: "",
    reportedBy: "Store Manager",
    image: ""
  });

  const { data: riders = [], isLoading: isLoadingRiders } = useRiders();
  const createIssueMutation = useCreateIssue();

  const issueTypes = [
    "Late Delivery",
    "Rider Not Responding",
    "Wrong Address",
    "Customer Unreachable",
    "Vehicle Breakdown",
    "Order Damaged",
    "Customer Complaint",
    "Payment Issue"
  ];

  const severities = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "critical", label: "Critical" }
  ];

  const reporters = [
    "Store Manager",
    "Customer",
    "Rider",
    "Kitchen Supervisor"
  ];

  const handleSubmit = () => {
    if (!form.orderId.trim()) {
      message.error("Please enter a valid Order ID");
      return;
    }
    if (!form.riderId) {
      message.error("Please select an assigned Rider");
      return;
    }
    if (!form.description.trim()) {
      message.error("Please provide an issue description");
      return;
    }

    createIssueMutation.mutate(form, {
      onSuccess: () => {
        message.success("Delivery issue ticket created successfully.");
        // Reset form
        setForm({
          orderId: "",
          riderId: "",
          issueType: "Late Delivery",
          severity: "medium",
          description: "",
          reportedBy: "Store Manager",
          image: ""
        });
        onClose();
      },
      onError: () => {
        message.error("Failed to create issue ticket.");
      }
    });
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3 select-none">
          <Plus size={16} className="text-[var(--primary)]" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Report New Exception</h3>
            <p className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Log active delivery exception ticket and assign severity level.
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      centered
      width={500}
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
            disabled={createIssueMutation.isPending}
            style={{ backgroundColor: "var(--primary)" }}
            className="px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm hover:opacity-90 cursor-pointer disabled:opacity-50"
          >
            {createIssueMutation.isPending ? "Creating..." : "Create Ticket"}
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs font-bold">
        
        {/* Row 1: Order ID & Rider */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px]">Order ID *</span>
            <Input
              placeholder="e.g. ORD-1025"
              value={form.orderId}
              onChange={(e) => setForm(prev => ({ ...prev, orderId: e.target.value.toUpperCase() }))}
              className="rounded-xl text-xs h-9 bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-855 text-slate-800 dark:text-white font-mono"
            />
          </div>

          <div className="space-y-1.5 text-left">
            <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px]">Assigned Rider *</span>
            <Select
              placeholder="Select Rider"
              value={form.riderId || undefined}
              onChange={(val) => setForm(prev => ({ ...prev, riderId: val }))}
              className="sa-select w-full h-9"
              loading={isLoadingRiders}
              options={riders.map((r) => ({ value: r._id, label: `${r.name} (${r.vehicleType})` }))}
            />
          </div>
        </div>

        {/* Row 2: Issue Type & Severity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5 text-left">
            <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px]">Issue Exception Type *</span>
            <Select
              value={form.issueType}
              onChange={(val) => setForm(prev => ({ ...prev, issueType: val }))}
              className="sa-select w-full h-9"
              options={issueTypes.map((t) => ({ value: t, label: t }))}
            />
          </div>

          <div className="space-y-1.5 text-left">
            <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px]">Severity *</span>
            <Select
              value={form.severity}
              onChange={(val) => setForm(prev => ({ ...prev, severity: val }))}
              className="sa-select w-full h-9"
              options={severities}
            />
          </div>
        </div>

        {/* Row 3: Reported By */}
        <div className="space-y-1.5 text-left">
          <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px]">Reported By *</span>
          <Select
            value={form.reportedBy}
            onChange={(val) => setForm(prev => ({ ...prev, reportedBy: val }))}
            className="sa-select w-full h-9"
            options={reporters.map((r) => ({ value: r, label: r }))}
          />
        </div>

        {/* Row 4: Description */}
        <div className="space-y-1.5 text-left">
          <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px]">Exception Description *</span>
          <TextArea
            rows={3}
            placeholder="Describe the operational issue in detail..."
            value={form.description}
            onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="rounded-xl text-xs bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-855 text-slate-800 dark:text-white"
          />
        </div>

        {/* Row 5: Attachment (Simulated) */}
        <div className="space-y-1.5 text-left">
          <span className="text-slate-400 dark:text-zinc-500 font-extrabold uppercase text-[9px] block">Attach Image Evidence</span>
          <div
            onClick={() => setForm(prev => ({ ...prev, image: "/mock-evidence.webp" }))}
            className={`border border-dashed p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all duration-300 ${
              form.image
                ? "border-emerald-500 bg-emerald-500/5 text-emerald-600"
                : "border-slate-200 dark:border-zinc-855 hover:border-[var(--primary)] bg-slate-50/50 dark:bg-zinc-950/20 text-slate-400"
            }`}
          >
            <Camera size={20} />
            <span className="text-[10px] font-bold">
              {form.image ? "Image attached (mock-evidence.webp)" : "Click to attach mock photo evidence"}
            </span>
          </div>
        </div>

      </div>
    </Modal>
  );
}
