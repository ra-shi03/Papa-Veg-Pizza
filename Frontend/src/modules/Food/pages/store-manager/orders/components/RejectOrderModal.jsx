import React, { useState, useEffect } from "react";
import { Modal, Select, Input, Switch, Button, Alert } from "antd";
import { AlertOctagon, HelpCircle, HeartHandshake, ShieldAlert, CreditCard } from "lucide-react";

export default function RejectOrderModal({ visible, onClose, order, onConfirm, loading }) {
  const [reason, setReason] = useState("Ingredient Unavailable");
  const [otherReason, setOtherReason] = useState("");
  const [initiateRefund, setInitiateRefund] = useState(true);
  const [customerMessage, setCustomerMessage] = useState("");

  useEffect(() => {
    // Generate default customer message based on selected reason
    let msg = "";
    if (reason === "Store Closed") {
      msg = "We are sorry, but our store has closed for the day. Your payment will be refunded immediately.";
    } else if (reason === "Ingredient Unavailable") {
      msg = "Apologies, some fresh ingredients required for your pizza are currently out of stock. We have initiated your refund.";
    } else if (reason === "Technical Issue") {
      msg = "Due to a technical failure in our kitchen, we cannot fulfill your order. Sorry for the inconvenience.";
    } else if (reason === "High Order Load") {
      msg = "We are currently experiencing extremely high order volume and are unable to deliver your order in time. Sorry!";
    } else if (reason === "Delivery Not Available") {
      msg = "No delivery riders are available in your sector right now. You may place a pickup order instead.";
    } else {
      msg = "Your order was rejected due to operational challenges at the store. Refund is being processed.";
    }
    setCustomerMessage(msg);
  }, [reason]);

  if (!order) return null;

  const handleConfirm = () => {
    const finalReason = reason === "Other" ? otherReason : reason;
    if (reason === "Other" && !otherReason.trim()) {
      return;
    }
    
    onConfirm({
      cancelReason: finalReason,
      initiateRefund,
      customerMessage
    });
  };

  const reasonsList = [
    "Store Closed",
    "Ingredient Unavailable",
    "Technical Issue",
    "High Order Load",
    "Delivery Not Available",
    "Other"
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-border pb-3 pr-8">
          <AlertOctagon size={18} className="text-rose-500" />
          <div>
            <h3 className="text-sm font-black text-foreground">Reject Order</h3>
            <p className="text-[10px] text-zinc-400 font-semibold">Cancel order and process refund settings</p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={500}
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
          key="reject"
          danger
          type="primary"
          loading={loading}
          onClick={handleConfirm}
          className="text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-full px-4 py-2 border-0 shadow-md shadow-rose-600/15 active:scale-95 transition-all cursor-pointer"
        >
          Reject Order
        </Button>
      ]}
    >
      <div className="py-2.5 space-y-4 text-xs max-h-[60vh] overflow-y-auto pr-1">
        {/* Warning Banner */}
        <Alert
          message={
            <span className="font-extrabold text-[11px] text-rose-800 dark:text-rose-455">
              Warning: Rejecting an order may initiate an automatic customer refund.
            </span>
          }
          type="warning"
          showIcon
          className="rounded-2xl border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/10"
        />

        {/* 1. Reason Selection */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-foreground uppercase tracking-wider flex items-center gap-1">
            <HelpCircle size={12} className="text-slate-400" />
            1. Reason for Rejection
          </label>
          <Select
            value={reason}
            onChange={setReason}
            className="w-full custom-select-round"
            popupClassName="custom-select-dropdown"
          >
            {reasonsList.map((r) => (
              <Select.Option key={r} value={r}>
                {r}
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Custom Textarea for "Other" reason */}
        {reason === "Other" && (
          <div className="space-y-1 animate-fade-down">
            <label className="text-[9px] font-black text-zinc-400 uppercase tracking-wider">
              Specify Reason
            </label>
            <Input.TextArea
              placeholder="Explain the custom reason for cancellation..."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              className="rounded-2xl border-border bg-muted font-semibold text-xs py-2"
              rows={2}
            />
          </div>
        )}

        {/* 2. Refund Controls */}
        <div className="space-y-3 p-4 bg-muted border border-border rounded-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <HeartHandshake size={15} />
              </div>
              <div>
                <p className="font-extrabold text-foreground leading-tight">Initiate Refund</p>
                <p className="text-[9px] text-zinc-400 font-semibold">Process digital refund for online paid items</p>
              </div>
            </div>
            <Switch
              checked={initiateRefund}
              onChange={setInitiateRefund}
              className="custom-switch-primary"
              disabled={order.paymentStatus !== "paid"} // No refund if order not paid (e.g. COD pending)
            />
          </div>

          {initiateRefund && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border animate-fade-down">
              <div>
                <p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Refund Amount</p>
                <p className="text-foreground font-black text-sm">
                  ₹{order.grandTotal}
                </p>
              </div>
              <div>
                <p className="text-zinc-400 font-bold uppercase text-[9px] mb-0.5">Refund Method</p>
                <p className="text-foreground font-bold text-xs flex items-center gap-1">
                  <CreditCard size={12} className="text-zinc-400" />
                  Original Source
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 3. Customer Notification Text Area */}
        <div className="space-y-1.5">
          <label className="text-[10px] font-black text-foreground uppercase tracking-wider flex items-center gap-1">
            <ShieldAlert size={12} className="text-slate-400" />
            2. Customer Message
          </label>
          <Input.TextArea
            placeholder="Type a message to inform the customer about rejection..."
            value={customerMessage}
            onChange={(e) => setCustomerMessage(e.target.value)}
            className="rounded-2xl border-border bg-muted font-semibold text-xs py-2 focus:border-primary"
            rows={3}
          />
        </div>
      </div>
    </Modal>
  );
}
