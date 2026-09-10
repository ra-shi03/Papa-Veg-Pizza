import React, { useState, useEffect } from "react";
import { Modal, Form, InputNumber, Radio, Select, Input, Button } from "antd";
import { toast } from "sonner";

export default function ProcessRefundModal({
  visible,
  onClose,
  order,
  onConfirmRefund,
  confirmLoading
}) {
  const [form] = Form.FormInstance ? Form.useForm() : [null]; // Antd v4/v5 helper fallback
  const [useAntForm, setUseAntForm] = useState(true);
  
  // Custom states if form object isn't needed or for cleaner controlled inputs
  const [refundAmount, setRefundAmount] = useState(0);
  const [refundType, setRefundType] = useState("full");
  const [refundMethod, setRefundMethod] = useState("original_source");
  const [refundReason, setRefundReason] = useState("Customer Request");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (order) {
      setRefundAmount(order.grandTotal);
      setRefundType("full");
      setRefundMethod("original_source");
      setRefundReason("Customer Request");
      setNotes("");
    }
  }, [order]);

  const handleRefundTypeChange = (e) => {
    const val = e.target.value;
    setRefundType(val);
    if (val === "full" && order) {
      setRefundAmount(order.grandTotal);
    }
  };

  const handleSubmit = () => {
    if (refundAmount <= 0) {
      toast.error("Refund amount must be greater than 0");
      return;
    }
    if (refundAmount > order.grandTotal) {
      toast.error(`Refund amount cannot exceed the order total of ₹${order.grandTotal}`);
      return;
    }

    onConfirmRefund({
      orderId: order._id,
      refundAmount,
      refundType,
      refundMethod,
      reason: refundReason,
      notes
    });
  };

  if (!order) return null;

  return (
    <Modal
      title={
        <div>
          <h3 className="text-base font-black text-slate-900 dark:text-white">Process Refund</h3>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Order No: {order.orderNumber} • Total: ₹{order.grandTotal}</p>
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
          danger
          loading={confirmLoading}
          onClick={handleSubmit}
          className="font-bold rounded-full px-4 active:scale-95 transition-all text-xs shadow-md shadow-red-500/10"
        >
          Process Refund
        </Button>
      ]}
      className="rounded-3xl overflow-hidden"
    >
      <div className="space-y-4 py-3">
        {/* Refund Type */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">Refund Type</label>
          <Radio.Group value={refundType} onChange={handleRefundTypeChange} className="font-semibold text-xs">
            <Radio value="full">Full Refund</Radio>
            <Radio value="partial">Partial Refund</Radio>
          </Radio.Group>
        </div>

        {/* Refund Amount */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">Refund Amount (₹)</label>
          <InputNumber
            className="w-full rounded-xl border-zinc-200 dark:border-zinc-800 font-black text-xs"
            value={refundAmount}
            onChange={(val) => setRefundAmount(val || 0)}
            disabled={refundType === "full"}
            min={1}
            max={order.grandTotal}
          />
        </div>

        {/* Refund Method */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">Refund Method</label>
          <Radio.Group value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)} className="font-semibold text-xs flex flex-wrap gap-2">
            <Radio value="original_source">Original Source</Radio>
            <Radio value="wallet">Wallet</Radio>
            <Radio value="manual">Manual Transfer</Radio>
            <Radio value="cash">Cash</Radio>
          </Radio.Group>
        </div>

        {/* Refund Reason */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">Refund Reason</label>
          <Select
            value={refundReason}
            onChange={(val) => setRefundReason(val)}
            className="w-full rounded-xl font-semibold text-xs"
            options={[
              { value: "Customer Request", label: "Customer Request" },
              { value: "Store Rejection", label: "Store Rejection" },
              { value: "Ingredient Unavailable", label: "Ingredient Unavailable" },
              { value: "Technical Failure", label: "Technical Failure" },
              { value: "Duplicate Order", label: "Duplicate Order" },
              { value: "Other", label: "Other" }
            ]}
          />
        </div>

        {/* Additional Notes */}
        <div className="space-y-1.5">
          <label className="text-xs font-black text-slate-700 dark:text-zinc-300 block">Notes (Optional)</label>
          <Input.TextArea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter internal comments or details of manual transfer..."
            rows={3}
            className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-medium"
          />
        </div>
      </div>
    </Modal>
  );
}
