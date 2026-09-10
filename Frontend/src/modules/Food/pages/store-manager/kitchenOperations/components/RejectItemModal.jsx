import React, { useState } from "react";
import { Modal } from "antd";
import { AlertTriangle, BellRing } from "lucide-react";

export default function RejectItemModal({ visible, onClose, order, onReject }) {
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [reason, setReason] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  if (!order) return null;

  const handleToggleItem = (itemId) => {
    setSelectedItemIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSubmit = () => {
    if (selectedItemIds.length === 0 || !reason.trim()) return;

    onReject({
      orderId: order._id,
      itemIds: selectedItemIds,
      reason: reason.trim(),
      notifyCustomer
    });

    // Reset state and close
    setSelectedItemIds([]);
    setReason("");
    setNotifyCustomer(true);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <AlertTriangle size={18} className="text-rose-500" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Reject Items</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-0.5">
              Select items to reject from Order {order.orderNumber}
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={420}
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
            onClick={handleSubmit}
            disabled={selectedItemIds.length === 0 || !reason.trim()}
            className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              selectedItemIds.length > 0 && reason.trim()
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-650 cursor-not-allowed"
            }`}
          >
            Reject Selected
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Item Selector List */}
        <div className="space-y-2">
          <label className="text-slate-450 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
            Order Items
          </label>
          <div className="space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
            {order.items?.map((item) => {
              const isChecked = selectedItemIds.includes(item.orderItemId);
              return (
                <div
                  key={item.orderItemId}
                  onClick={() => handleToggleItem(item.orderItemId)}
                  className={`flex items-center gap-3 p-2.5 border rounded-xl cursor-pointer transition-all ${
                    isChecked
                      ? "border-rose-300 bg-rose-50/20 dark:border-rose-900/30 dark:bg-rose-950/10"
                      : "border-slate-100 dark:border-zinc-850 hover:border-slate-200 dark:hover:border-zinc-800 bg-slate-50/50 dark:bg-zinc-900/50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    readOnly
                    className="accent-rose-500 h-3.5 w-3.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between font-bold">
                      <span className="text-slate-900 dark:text-white">{item.name}</span>
                      <span className="text-slate-400 dark:text-zinc-500">Qty: {item.quantity}</span>
                    </div>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-550">
                      {item.size} • {item.crust}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Reason Textarea */}
        <div className="space-y-1.5">
          <label className="text-slate-450 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[9px] flex justify-between">
            <span>Reason for Rejection</span>
            <span className="text-rose-500 font-bold">*Required</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Specify reason (e.g., Cheese out of stock, oven malfunction, etc.)"
            rows={3}
            className="w-full p-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 resize-none font-medium"
          />
        </div>

        {/* Notify Checkbox */}
        <div
          onClick={() => setNotifyCustomer(!notifyCustomer)}
          className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-xl cursor-pointer"
        >
          <input
            type="checkbox"
            checked={notifyCustomer}
            onChange={() => {}} // handled by div click
            className="accent-[var(--primary)] h-3.5 w-3.5"
          />
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-300 font-bold select-none">
            <BellRing size={13} className="text-slate-450 dark:text-zinc-500" />
            <span>Notify customer immediately via SMS/Email</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
