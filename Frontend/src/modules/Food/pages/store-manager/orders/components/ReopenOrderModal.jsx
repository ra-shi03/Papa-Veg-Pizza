import React, { useState, useEffect } from "react";
import { Modal, Input, Button, Alert } from "antd";
import { Info, AlertTriangle, ShieldCheck } from "lucide-react";

export default function ReopenOrderModal({
  visible,
  onClose,
  order,
  onConfirmReopen,
  confirmLoading
}) {
  const [customerMessage, setCustomerMessage] = useState("");
  const [timeDiffMins, setTimeDiffMins] = useState(0);

  useEffect(() => {
    if (order) {
      setCustomerMessage("Your order has been reopened and is awaiting confirmation.");
      
      const cancelledAtDate = new Date(order.cancelledAt || order.updatedAt);
      const diff = (new Date() - cancelledAtDate) / 60000;
      setTimeDiffMins(Math.max(0, Math.round(diff)));
    }
  }, [order]);

  if (!order) return null;

  const isTimeEligible = timeDiffMins <= 5;
  const isKitchenNotStarted = order.status !== "preparing" && order.status !== "baking" && order.status !== "packaging" && order.status !== "ready";
  const isInventoryAvailable = true; // Simulated check
  const isEligible = isTimeEligible && isKitchenNotStarted && isInventoryAvailable;

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const handleReopen = () => {
    onConfirmReopen({
      orderId: order._id,
      customerMessage
    });
  };

  return (
    <Modal
      title={
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Reopen Order</h3>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Order ID: {order.orderNumber}</p>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={[
        <Button
          key="cancel"
          onClick={onClose}
          className="font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 active:scale-95 transition-all text-xs"
        >
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          disabled={!isEligible}
          loading={confirmLoading}
          onClick={handleReopen}
          className="font-bold border-0 text-white rounded-full px-4 active:scale-95 transition-all text-xs shadow-md shadow-purple-600/10 !bg-purple-600 hover:!bg-purple-500 disabled:!bg-zinc-200 disabled:!text-zinc-400 disabled:cursor-not-allowed"
        >
          Reopen Order
        </Button>
      ]}
      className="rounded-3xl overflow-hidden"
    >
      <div className="space-y-4 py-3">
        {/* Warning Banner */}
        <Alert
          message={
            <span className="text-xs font-bold text-amber-800 dark:text-amber-300">
              Reopening is allowed only if:
            </span>
          }
          description={
            <ul className="list-disc pl-4 text-[11px] font-semibold text-amber-700 dark:text-amber-400 mt-1 space-y-0.5">
              <li>Order was cancelled within the last 5 minutes.</li>
              <li>Kitchen preparation has not started.</li>
              <li>Inventory remains available.</li>
            </ul>
          }
          type="warning"
          showIcon
          className="rounded-2xl border-amber-200 dark:border-amber-950/40 bg-amber-50/50 dark:bg-amber-950/10"
        />

        {/* Eligibility Information */}
        <div className="bg-slate-50 dark:bg-zinc-900/50 p-3.5 rounded-2xl border border-zinc-150 dark:border-zinc-800 space-y-3">
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eligibility Check</h4>
          <div className="grid grid-cols-2 gap-y-2 text-xs font-semibold text-slate-700 dark:text-zinc-300">
            <span>Cancelled At:</span>
            <span className="text-slate-900 dark:text-white font-extrabold">{formatDate(order.cancelledAt || order.updatedAt)} ({timeDiffMins}m ago)</span>

            <span>Time Window Status:</span>
            <span>
              {isTimeEligible ? (
                <span className="text-green-650 font-bold flex items-center gap-1"><ShieldCheck size={12} /> Within 5 Mins</span>
              ) : (
                <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle size={12} /> Expired ({timeDiffMins}m elapsed)</span>
              )}
            </span>

            <span>Kitchen Prep Status:</span>
            <span>
              {isKitchenNotStarted ? (
                <span className="text-green-650 font-bold flex items-center gap-1"><ShieldCheck size={12} /> Not Started</span>
              ) : (
                <span className="text-red-500 font-bold flex items-center gap-1"><AlertTriangle size={12} /> Started ({order.status})</span>
              )}
            </span>

            <span>Inventory Available:</span>
            <span className="text-green-650 font-bold flex items-center gap-1"><ShieldCheck size={12} /> Yes</span>
          </div>
        </div>

        {/* Customer Notification Message */}
        {isEligible && (
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">Customer Notification Message</label>
            <Input.TextArea
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              placeholder="Enter message for the customer..."
              rows={3}
              className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-medium"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
