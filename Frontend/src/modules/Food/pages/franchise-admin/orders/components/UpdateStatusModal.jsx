import React, { useState, useEffect } from "react";
import { X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useUpdateOrderStatus } from "../ordersQuery";

export default function UpdateStatusModal({ isOpen, onClose, order }) {
  const [newStatus, setNewStatus] = useState("");
  const [remarks, setRemarks] = useState("");
  const { mutate, isLoading } = useUpdateOrderStatus();

  useEffect(() => {
    if (order) {
      setNewStatus(order.orderStatus);
      setRemarks("");
    }
  }, [order]);

  if (!isOpen || !order) return null;

  const statuses = [
    "Pending", "Confirmed", "Preparing", "Baking", 
    "Packed", "Ready For Pickup", "Rider Assigned", "Out For Delivery", "Delivered"
  ];

  const allowedTransitions = {
    "Pending": ["Confirmed"],
    "Confirmed": ["Preparing"],
    "Preparing": ["Baking"],
    "Baking": ["Packed"],
    "Packed": ["Ready For Pickup"],
    "Ready For Pickup": ["Rider Assigned"],
    "Rider Assigned": ["Out For Delivery"],
    "Out For Delivery": ["Delivered"],
  };

  const currentStatus = order.orderStatus;
  const recommendedNext = allowedTransitions[currentStatus] || [];
  const isValidTransition = currentStatus === newStatus || recommendedNext.includes(newStatus);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newStatus === currentStatus) {
      toast.error("Please select a new status to update.");
      return;
    }

    mutate(
      {
        orderId: order.id,
        status: newStatus,
        remarks,
        updatedBy: "Franchise Admin",
      },
      {
        onSuccess: () => {
          toast.success("Order status updated successfully.");
          onClose();
        },
        onError: (err) => {
          toast.error(err.message || "Failed to update order status.");
        },
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-[600px] bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scale-up">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
            Update Order Status — {order.orderNumber}
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-600 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Current Status */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                Current Status
              </label>
              <input
                type="text"
                value={currentStatus}
                readOnly
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-600 dark:text-zinc-400 focus:outline-none"
              />
            </div>

            {/* New Status Select */}
            <div>
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                New Status
              </label>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
              >
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s} {recommendedNext.includes(s) ? "(Recommended Next)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Validation Warning Display */}
          {!isValidTransition && (
            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-start gap-2.5 text-xs">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold">Out-of-Sequence Status Transition Warning</p>
                <p className="font-medium mt-0.5 opacity-90">
                  Changing status directly from <span className="font-bold">"{currentStatus}"</span> to <span className="font-bold">"{newStatus}"</span> skips intermediate operational steps. This might affect push alerts and kitchen display schedules.
                </p>
              </div>
            </div>
          )}

          {/* Remarks text area */}
          <div>
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
              Remarks & Kitchen Notes
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="E.g., Crust baked slightly crispier, or custom ingredient notes..."
              rows={3}
              className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>

          {/* Action buttons */}
          <footer className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || newStatus === currentStatus}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-zinc-200 disabled:dark:bg-zinc-800 disabled:text-zinc-400 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/15 active:scale-95 transition-all flex items-center gap-1.5"
            >
              {isLoading ? "Updating..." : "Update Status"}
            </button>
          </footer>
        </form>
      </div>
    </div>
  );
}
