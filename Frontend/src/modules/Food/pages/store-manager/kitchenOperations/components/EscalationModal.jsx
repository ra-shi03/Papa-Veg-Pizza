import React, { useState, useEffect } from "react";
import { Modal, Select, Input } from "antd";
import { AlertOctagon, Info, ShieldAlert } from "lucide-react";
import { mockManagementStaff } from "../mockData";

const { TextArea } = Input;

export default function EscalationModal({ visible, onClose, order, onConfirm }) {
  const [severity, setSeverity] = useState("High");
  const [reason, setReason] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      setSeverity("High");
      setReason(order.reason || "");
      setAssignedTo("");
      setNotes("");
    }
  }, [order, visible]);

  if (!order) return null;

  const handleConfirm = () => {
    if (!reason || !assignedTo) return;
    onConfirm({
      orderId: order._id,
      severity,
      reason,
      assignedTo,
      notes
    });
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <ShieldAlert size={18} className="text-rose-500 animate-bounce" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Escalate Order #{order.orderNumber}</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Escalate operational bottleneck to supervisor/management staff
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={400}
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
            disabled={!reason || !assignedTo}
            className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              reason && assignedTo
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
            }`}
          >
            Create Escalation
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Severity selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Severity Level
          </label>
          <Select
            className="w-full h-9"
            value={severity}
            onChange={(val) => setSeverity(val)}
            classNames={{ popup: { root: "dark:bg-zinc-900" } }}
            options={[
              { value: "Low", label: "🟢 Low Severity" },
              { value: "Medium", label: "🟡 Medium Severity" },
              { value: "High", label: "🟠 High Severity" },
              { value: "Critical", label: "🔴 Critical Severity" }
            ]}
          />
        </div>

        {/* Assigned Manager selection */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Assign To
          </label>
          <Select
            placeholder="Select manager/supervisor..."
            className="w-full h-9"
            value={assignedTo || undefined}
            onChange={(val) => setAssignedTo(val)}
            classNames={{ popup: { root: "dark:bg-zinc-900" } }}
            options={mockManagementStaff.map(s => ({
              value: s._id,
              label: `${s.name} (${s.role})`
            }))}
          />
        </div>

        {/* Reason for escalation */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Reason for Escalation
          </label>
          <TextArea
            placeholder="Specify reason (e.g., Oven offline, ingredient outage)..."
            rows={2}
            className="text-xs"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Additional notes */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            Internal Notes
          </label>
          <TextArea
            placeholder="Add operational details, suggested resources to shift..."
            rows={2}
            className="text-xs"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}
