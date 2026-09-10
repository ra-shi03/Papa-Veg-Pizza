import React, { useState, useEffect } from "react";
import { Modal, Input, Button } from "antd";
import { AlertCircle, ShieldAlert, Sparkles, AlertOctagon } from "lucide-react";
import { useChangePriority } from "../hooks/useActiveOrders";

export default function ChangePriorityModal({ visible, onClose, order }) {
  const [priority, setPriority] = useState("normal");
  const [reason, setReason] = useState("");
  const changePriorityMutation = useChangePriority();

  useEffect(() => {
    if (order) {
      setPriority(order.priority || "normal");
      setReason(order.priorityReason || "");
    }
  }, [order, visible]);

  if (!order) return null;

  const handleSave = async () => {
    try {
      await changePriorityMutation.mutateAsync({
        orderId: order._id,
        priority,
        reason
      });
      onClose();
    } catch (error) {
      // Handled by mutation toast
    }
  };

  const getPriorityCardStyle = (value) => {
    const isSelected = priority === value;
    
    let activeBorderColor = "border-zinc-400 text-zinc-700 bg-zinc-50 dark:bg-zinc-800 dark:text-zinc-300";
    if (value === "urgent") activeBorderColor = "border-amber-500 text-amber-700 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400";
    if (value === "vip") activeBorderColor = "border-yellow-500 text-yellow-700 bg-yellow-50 dark:bg-yellow-950/20 dark:text-yellow-400";

    return `flex-1 border p-4 rounded-2xl cursor-pointer hover:scale-[1.02] active:scale-95 transition-all flex flex-col justify-center items-center text-center gap-2 ${
      isSelected
        ? `border-2 font-black shadow-md ${activeBorderColor}`
        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400"
    }`;
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <AlertCircle size={18} className="text-primary" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Change Order Priority</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Elevate kitchen processing queue speed</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={480}
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
          loading={changePriorityMutation.isPending}
          onClick={handleSave}
          className="!bg-primary hover:!bg-primary-hover text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs"
        >
          Update Priority
        </Button>
      ]}
    >
      <div className="py-4 space-y-5">
        {/* Cards container */}
        <div className="flex gap-3">
          {/* Normal Option */}
          <div onClick={() => setPriority("normal")} className={getPriorityCardStyle("normal")}>
            <AlertOctagon size={20} className={priority === "normal" ? "text-zinc-500" : "text-zinc-400"} />
            <div>
              <p className="text-xs font-bold">Normal</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">Standard prep sequence</p>
            </div>
          </div>

          {/* Urgent Option */}
          <div onClick={() => setPriority("urgent")} className={getPriorityCardStyle("urgent")}>
            <ShieldAlert size={20} className={priority === "urgent" ? "text-amber-500" : "text-zinc-400"} />
            <div>
              <p className="text-xs font-bold">Urgent</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">High speed preparation</p>
            </div>
          </div>

          {/* VIP Option */}
          <div onClick={() => setPriority("vip")} className={getPriorityCardStyle("vip")}>
            <Sparkles size={20} className={priority === "vip" ? "text-yellow-500" : "text-zinc-400"} />
            <div>
              <p className="text-xs font-bold">VIP</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">Top-priority, extra care</p>
            </div>
          </div>
        </div>

        {/* Reason Field */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Audit Reason (Optional)
          </label>
          <Input.TextArea
            placeholder="Explain why the priority is being changed..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs"
          />
        </div>
      </div>
    </Modal>
  );
}
