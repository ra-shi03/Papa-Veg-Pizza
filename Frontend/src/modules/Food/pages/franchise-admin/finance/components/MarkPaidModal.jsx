import React, { useState, useEffect } from "react";
import { Modal, Select, Input, DatePicker, Tag } from "antd";
import { CheckCircle, X } from "lucide-react";
import dayjs from "dayjs";

export default function MarkPaidModal({ isOpen, onClose, payoutDetails, onConfirm }) {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("UPI");
  const [transactionId, setTransactionId] = useState("");
  const [paidDate, setPaidDate] = useState(dayjs());
  const [remarks, setRemarks] = useState("");

  useEffect(() => {
    // Reset values on open
    if (isOpen) {
      setPaymentMethod("UPI");
      setTransactionId("");
      setPaidDate(dayjs());
      setRemarks("");
    }
  }, [isOpen]);

  const handleConfirmSubmit = async () => {
    setLoading(true);
    try {
      const details = {
        paymentMethod,
        transactionId,
        paidDate,
        remarks
      };

      await onConfirm(payoutDetails._id, details);
      setLoading(false);
      onClose();
    } catch (err) {
      setLoading(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (!payoutDetails) return null;

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b pb-2 text-zinc-800 dark:text-zinc-100 font-extrabold text-sm uppercase">
          <CheckCircle size={16} className="text-emerald-500" />
          <span>Confirm Rider Payment</span>
        </div>
      }
      open={isOpen}
      onCancel={loading ? null : onClose}
      closeIcon={<X size={16} />}
      width={700}
      footer={[
        <button
          key="cancel"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all disabled:opacity-50 cursor-pointer text-xs"
        >
          Cancel
        </button>,
        <button
          key="submit"
          onClick={handleConfirmSubmit}
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm font-bold transition-all disabled:opacity-50 cursor-pointer text-xs ml-2 border-0"
        >
          {loading ? (
            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : null}
          <span>Confirm Payment</span>
        </button>
      ]}
    >
      <div className="py-4 space-y-5 text-xs text-zinc-700 dark:text-zinc-300 font-['Poppins']">
        <style>{`
          .ant-modal, .ant-modal-title, .ant-select, .ant-select-item, .ant-picker, .ant-picker-input > input, .ant-input, .ant-input-textarea {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
        `}</style>

        {/* Payment Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
          <div>
            <span className="text-zinc-400 uppercase text-[8.5px] font-bold block">Delivery Partner</span>
            <span className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-1 block">{payoutDetails.riderName}</span>
          </div>

          <div>
            <span className="text-zinc-400 uppercase text-[8.5px] font-bold block">Payout Number</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-200 mt-1 block">{payoutDetails.payoutNumber}</span>
          </div>

          <div>
            <span className="text-zinc-400 uppercase text-[8.5px] font-bold block">Total Net Amount</span>
            <span className="font-black text-emerald-600 mt-1 block">{formatCurrency(payoutDetails.totalAmount)}</span>
          </div>

          <div>
            <span className="text-zinc-400 uppercase text-[8.5px] font-bold block">Current Status</span>
            <Tag color="warning" className="font-extrabold text-[8.5px] uppercase mt-1">
              {payoutDetails.paymentStatus}
            </Tag>
          </div>
        </div>

        {/* Input Fields */}
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Payment Method */}
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Payment Method *</span>
              <Select value={paymentMethod} onChange={val => setPaymentMethod(val)} className="w-full font-semibold h-[34px]">
                <Select.Option value="UPI">UPI (GPay / PhonePe / Paytm)</Select.Option>
                <Select.Option value="Bank Transfer">Bank Net Banking (IMPS/NEFT)</Select.Option>
                <Select.Option value="Cash">Cash Handout</Select.Option>
                <Select.Option value="Wallet">Rider Store Wallet</Select.Option>
              </Select>
            </div>

            {/* Paid Date */}
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Payment Release Date *</span>
              <DatePicker
                value={paidDate}
                onChange={val => setPaidDate(val || dayjs())}
                className="w-full font-semibold h-[34px]"
              />
            </div>
          </div>

          {/* Transaction ID */}
          {paymentMethod !== "Cash" && (
            <div className="flex flex-col gap-1.5">
              <span className="font-bold text-zinc-500 uppercase text-[10px]">Transaction reference ID (Optional)</span>
              <Input
                placeholder="Enter UPI Transaction UTR or Bank Ref Number..."
                value={transactionId}
                onChange={e => setTransactionId(e.target.value)}
                className="font-semibold h-[34px]"
              />
            </div>
          )}

          {/* Remarks */}
          <div className="flex flex-col gap-1.5">
            <span className="font-bold text-zinc-500 uppercase text-[10px]">Auditing Remarks / Notes (Max 300 characters)</span>
            <Input.TextArea
              rows={3}
              maxLength={300}
              placeholder="Add payment approval notes, bank slip confirmations, etc..."
              value={remarks}
              onChange={e => setRemarks(e.target.value)}
              className="font-semibold"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
