import React, { useState, useEffect } from "react";
import { Modal, Select, Input, Button } from "antd";
import { Play, Pause, AlertTriangle } from "lucide-react";
import { usePauseOrder } from "../hooks/useActiveOrders";

export default function PauseOrderModal({ visible, onClose, order }) {
  const [reason, setReason] = useState("Busy Kitchen");
  const [notes, setNotes] = useState("");
  const pauseOrderMutation = usePauseOrder();

  const isAlreadyPaused = order?.isPaused || false;

  useEffect(() => {
    if (order) {
      setReason(order.pauseReason || "Busy Kitchen");
      setNotes("");
    }
  }, [order, visible]);

  if (!order) return null;

  const handleSave = async () => {
    try {
      await pauseOrderMutation.mutateAsync({
        orderId: order._id,
        isPaused: !isAlreadyPaused,
        reason: !isAlreadyPaused ? reason + (notes ? `: ${notes}` : "") : ""
      });
      onClose();
    } catch (error) {
      // Handled by mutation toast
    }
  };

  const pauseReasons = [
    "Busy Kitchen",
    "Ingredient Delay",
    "Equipment Problem",
    "Staff Shortage",
    "Customer Requested",
    "Other"
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          {isAlreadyPaused ? (
            <Play size={18} className="text-green-500" />
          ) : (
            <Pause size={18} className="text-amber-500" />
          )}
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              {isAlreadyPaused ? "Resume Order Preparation" : "Pause Order Preparation"}
            </h3>
            <p className="text-[10px] text-zinc-400 font-semibold">
              {isAlreadyPaused 
                ? "Restart preparation timer for this order" 
                : "Temporarily halt preparation and stop prep timer"}
            </p>
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
          danger={!isAlreadyPaused}
          loading={pauseOrderMutation.isPending}
          onClick={handleSave}
          className={`rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs ${
            isAlreadyPaused 
              ? "!bg-green-600 hover:!bg-green-700 text-white" 
              : "!bg-amber-500 hover:!bg-amber-600 text-white"
          }`}
        >
          {isAlreadyPaused ? "Resume Prep" : "Pause Prep"}
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        {isAlreadyPaused ? (
          <div className="flex items-start gap-2.5 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 p-3 rounded-2xl">
            <AlertTriangle className="text-green-600 mt-0.5 shrink-0" size={16} />
            <div>
              <p className="text-xs font-bold text-green-800 dark:text-green-400">Order is Currently Paused</p>
              <p className="text-[10px] text-green-700/80 dark:text-green-500 font-semibold mt-0.5">
                Reason: {order.pauseReason || "N/A"}. Resuming will restart the timer.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 p-3 rounded-2xl">
              <AlertTriangle className="text-amber-600 mt-0.5 shrink-0" size={16} />
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-400">Halting Active Preparation</p>
                <p className="text-[10px] text-amber-700/80 dark:text-amber-500 font-semibold mt-0.5">
                  Pausing this order will update the timeline and pause countdown timers.
                </p>
              </div>
            </div>

            {/* Select Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Reason for Pause
              </label>
              <Select
                value={reason}
                onChange={(val) => setReason(val)}
                className="w-full h-10 rounded-xl"
              >
                {pauseReasons.map((r) => (
                  <Select.Option key={r} value={r}>
                    {r}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
                Additional Notes (Optional)
              </label>
              <Input.TextArea
                placeholder="Add details about the pause..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs"
              />
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
