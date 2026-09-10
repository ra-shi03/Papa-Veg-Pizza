import React, { useState } from "react";
import { X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useCancelOrder } from "../ordersQuery";

export default function CancelOrderModal({ isOpen, onClose, order }) {
  const [reason, setReason] = useState("Customer Request");
  const [remarks, setRemarks] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  const { mutate, isLoading } = useCancelOrder();

  if (!isOpen || !order) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const confirmed = window.confirm(`Are you sure you want to cancel order ${order.orderNumber}?`);
    if (!confirmed) return;

    mutate(
      {
        orderId: order.id,
        reason,
        remarks,
        notifyCustomer,
      },
      {
        onSuccess: () => {
          toast.success("Order cancelled successfully.");
          setReason("Customer Request");
          setRemarks("");
          setNotifyCustomer(true);
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to cancel order.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-[600px] bg-white dark:bg-zinc-955 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-rose-50/10 dark:bg-rose-950/5">
          <div className="flex items-center gap-2 text-rose-650 dark:text-rose-455">
            <AlertTriangle size={18} className="shrink-0" />
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Cancel Order — {order.orderNumber}
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Warning Banner */}
        <div className="p-4 bg-rose-50/20 dark:bg-rose-950/10 border-b border-rose-100 dark:border-rose-950/20 text-xs text-rose-700 dark:text-rose-400 font-semibold leading-relaxed">
          Warning: Cancelling this order is an irreversible action. It will instantly update the kitchen screen, release any allocated rider, and process appropriate refund flags if paid.
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Reason Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Cancellation Reason
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
              >
                <option value="Customer Request">Customer Request</option>
                <option value="Out Of Stock">Out Of Stock</option>
                <option value="Kitchen Issue">Kitchen Issue</option>
                <option value="Payment Failure">Payment Failure</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Notify Customer checkbox */}
            <div className="flex items-center mt-4">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs font-bold text-zinc-700 dark:text-zinc-300">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-zinc-250 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                Notify Customer (SMS / Push)
              </label>
            </div>
          </div>

          {/* Remarks input */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Cancellation Remarks
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide exact cancellation remarks for store records..."
              rows={3}
              required={reason === "Other"}
              className="w-full p-3 rounded-xl border border-zinc-205 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-rose-500"
            />
          </div>

          {/* Action buttons */}
          <footer className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-zinc-200 disabled:dark:bg-zinc-850 disabled:text-zinc-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/15 active:scale-95 transition-all"
            >
              {isLoading ? "Cancelling..." : "Cancel Order"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
