import React, { useState, useEffect } from "react";
import { Modal, Select, Input, Button } from "antd";
import { AlertOctagon, AlertTriangle, ShieldAlert } from "lucide-react";
import { useEscalateOrder } from "../hooks/useReadyOrders";

export default function EscalateOrderModal({ visible, onClose, order }) {
  const [reason, setReason] = useState("No Rider Available");
  const [notes, setNotes] = useState("");

  const escalateOrderMutation = useEscalateOrder();

  useEffect(() => {
    if (order) {
      setReason("No Rider Available");
      setNotes("");
    }
  }, [order, visible]);

  if (!order) return null;

  const handleEscalate = async () => {
    try {
      await escalateOrderMutation.mutateAsync({
        orderId: order._id,
        reason,
        notes
      });
      onClose();
    } catch (e) {
      // Handled by mutation toast
    }
  };

  const escalationReasons = [
    "No Rider Available",
    "Rider Declined Pickup",
    "Traffic Delay",
    "High Order Volume",
    "Customer Address Issue",
    "Other Reason"
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <ShieldAlert size={18} className="text-red-650 animate-pulse" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Escalate Dispatch Delay</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Report critical waiting times for Order {order.orderNumber}</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={450}
      centered
      destroyOnClose
      footer={[
        <Button
          key="cancel"
          onClick={onClose}
          className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          danger
          loading={escalateOrderMutation.isPending}
          onClick={handleEscalate}
          className="!bg-red-650 hover:!bg-red-700 text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs"
        >
          Escalate Order
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        
        {/* Warning card */}
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 rounded-2xl flex gap-2.5 items-start">
          <AlertOctagon className="text-red-650 shrink-0 mt-0.5" size={16} />
          <div>
            <p className="text-xs font-bold text-red-800 dark:text-red-400">Trigger Manager Escalation</p>
            <p className="text-[10px] text-red-700/80 dark:text-red-500 font-semibold mt-0.5">
              This will flag the order with an Escalation tag on the console, alert operations managers, and log an audit note.
            </p>
          </div>
        </div>

        {/* Reason Select */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Escalation Category
          </label>
          <Select
            value={reason}
            onChange={(val) => setReason(val)}
            className="w-full h-10 rounded-xl"
          >
            {escalationReasons.map((r) => (
              <Select.Option key={r} value={r}>
                {r}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Text Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Escalation Details / Notes
          </label>
          <Input.TextArea
            placeholder="Explain the reason for escalation (e.g. Rider didn't show up after 15 mins, calling customer support)..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold"
          />
        </div>
      </div>
    </Modal>
  );
}
