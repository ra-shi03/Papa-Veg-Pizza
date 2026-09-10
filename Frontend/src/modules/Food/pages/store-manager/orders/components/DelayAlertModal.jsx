import React, { useState, useEffect } from "react";
import { Modal, Select, Input, Button, Form } from "antd";
import { Clock, AlertTriangle, ChevronRight } from "lucide-react";
import { useLogDelay } from "../hooks/useActiveOrders";

export default function DelayAlertModal({ visible, onClose, order }) {
  const [delayMinutes, setDelayMinutes] = useState("10"); // "5", "10", "15", "20", "custom"
  const [customMinutes, setCustomMinutes] = useState(15);
  const [reason, setReason] = useState("Oven Congestion");
  const [notes, setNotes] = useState("");

  const [form] = Form.useForm();
  const logDelayMutation = useLogDelay();

  useEffect(() => {
    if (order) {
      setDelayMinutes("10");
      setCustomMinutes(15);
      setReason("Oven Congestion");
      setNotes("");
    }
  }, [order, visible]);

  if (!order) return null;

  const getMinutesValue = () => {
    return delayMinutes === "custom" ? Number(customMinutes || 0) : Number(delayMinutes);
  };

  const handleConfirm = async () => {
    const finalMinutes = getMinutesValue();

    if (finalMinutes <= 0) {
      form.setFields([
        {
          name: "customMinutes",
          errors: ["Delay time must be greater than 0 minutes."]
        }
      ]);
      return;
    }

    try {
      await logDelayMutation.mutateAsync({
        orderId: order._id,
        minutes: finalMinutes,
        reason: reason + (notes ? `: ${notes}` : "")
      });
      onClose();
    } catch (error) {
      // Handled by mutation toast
    }
  };

  const delayReasons = [
    "Oven Congestion",
    "High Order Volume",
    "Staff Shortage",
    "Power Failure",
    "Ingredient Prep Delay",
    "Custom Reason"
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 pr-8">
          <AlertTriangle size={18} className="text-red-500 animate-bounce" />
          <div>
            <h3 className="text-sm font-black text-slate-900 dark:text-white">Log Order Delay</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Extend preparation time estimate for Order {order.orderNumber}</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={460}
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
          loading={logDelayMutation.isPending}
          onClick={handleConfirm}
          className="!bg-red-600 hover:!bg-red-700 text-white rounded-full font-bold px-5 py-2 shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer text-xs"
        >
          Log Delay & Extend Time
        </Button>
      ]}
    >
      <div className="py-4 space-y-4">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 p-3 rounded-2xl flex gap-2.5 items-start">
          <Clock size={16} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-red-800 dark:text-red-400">Preparation Time Exceeded</p>
            <p className="text-[10px] text-red-700/80 dark:text-red-500 font-semibold mt-0.5">
              Order {order.orderNumber} is running behind schedule. Inform the kitchen and dispatch desks by logging the estimated delay.
            </p>
          </div>
        </div>

        {/* Minutes Radio Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Extend Preparation Time By
          </label>
          <div className="flex flex-wrap gap-2">
            {["5", "10", "15", "20", "custom"].map((minutes) => {
              const isSelected = delayMinutes === minutes;
              return (
                <button
                  key={minutes}
                  type="button"
                  onClick={() => setDelayMinutes(minutes)}
                  className={`text-xs font-bold px-4 py-2 rounded-full border cursor-pointer transition-all ${
                    isSelected
                      ? "bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 border-red-500 font-extrabold"
                      : "bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:border-red-300"
                  }`}
                >
                  {minutes === "custom" ? "Custom" : `+${minutes} Min`}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Minutes Input */}
        {delayMinutes === "custom" && (
          <Form form={form} layout="vertical" className="mt-1">
            <Form.Item
              name="customMinutes"
              label={<span className="text-xs font-bold text-slate-700 dark:text-zinc-300">Custom Delay Minutes</span>}
              rules={[{ required: true, message: "Please input delay minutes" }]}
            >
              <Input
                type="number"
                value={customMinutes}
                onChange={(e) => setCustomMinutes(Number(e.target.value))}
                min={1}
                max={120}
                className="rounded-xl h-10 text-xs"
              />
            </Form.Item>
          </Form>
        )}

        {/* Select Reason */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Delay Reason
          </label>
          <Select
            value={reason}
            onChange={(val) => setReason(val)}
            className="w-full h-10 rounded-xl"
          >
            {delayReasons.map((r) => (
              <Select.Option key={r} value={r}>
                {r}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-700 dark:text-zinc-300">
            Internal Note / Details
          </label>
          <Input.TextArea
            placeholder="Provide additional details regarding the delay..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs"
          />
        </div>
      </div>
    </Modal>
  );
}
