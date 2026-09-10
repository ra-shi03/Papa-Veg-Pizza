import React, { useState } from "react";
import { X, AlertCircle, CheckCircle, Wallet, User, ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { useInitiateRefund } from "../ordersQuery";

export default function InitiateRefundModal({ isOpen, onClose, order }) {
  const { mutateAsync: initiateRefund, isLoading } = useInitiateRefund();
  
  // Form fields state
  const [refundAmount, setRefundAmount] = useState(order?.pricing?.total || 0);
  const [refundMethod, setRefundMethod] = useState("UPI");
  const [reason, setReason] = useState("Out of Stock topping substitution rejected");
  const [remarks, setRemarks] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!refundAmount || refundAmount <= 0) {
      toast.error("Please enter a valid refund amount.");
      return;
    }
    if (refundAmount > order.pricing.total) {
      toast.error(`Refund amount cannot exceed total order value of ₹${order.pricing.total}.`);
      return;
    }

    try {
      await initiateRefund({
        orderId: order.id,
        refundAmount,
        refundMethod,
        reason,
        remarks,
        notifyCustomer
      });
      toast.success("Refund initiated successfully.");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to initiate refund.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Content (700px Width) */}
      <div className="relative w-full max-w-[700px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-up">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <Wallet className="text-[var(--primary)]" size={18} />
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Initiate Refund Process
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 max-h-[80vh] text-xs">
          
          {/* Top warning if payment failed */}
          {order.paymentStatus === "Failed" && (
            <div className="p-3 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Caution: Payment was marked as FAILED</p>
                <p className="text-[10px] mt-0.5">Please check your payment gateway dashboard to confirm if the user was double-debited before issuing a manual refund.</p>
              </div>
            </div>
          )}

          {/* Section 1: Customer Details */}
          <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2 bg-zinc-50/20 dark:bg-zinc-900/10">
            <h4 className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider flex items-center gap-1">
              <User size={12} />
              Customer Details
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-zinc-400">Name: </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{order.customer.name}</span>
              </div>
              <div>
                <span className="text-zinc-400">Phone: </span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200">{order.customer.phone}</span>
              </div>
            </div>
          </div>

          {/* Section 2: Order Details */}
          <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2">
            <h4 className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider flex items-center gap-1">
              <ShoppingBag size={12} />
              Order Details
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Order Number</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-100">{order.orderNumber}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Store Branch</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-100">{order.store.name}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Total Price Paid</span>
                <span className="font-bold text-[var(--primary)]">₹{order.pricing.total.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Original Source</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-100">{order.paymentMethod}</span>
              </div>
              <div>
                <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Original Status</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-100">{order.paymentStatus}</span>
              </div>
            </div>
          </div>

          {/* Section 3: Refund Configuration */}
          <div className="space-y-4 pt-2">
            <h4 className="font-bold text-[10px] uppercase text-zinc-400 tracking-wider">
              Refund Summary & Settings
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Refund Amount */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-zinc-700 dark:text-zinc-350">Refund Amount (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold">₹</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={order.pricing.total}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Number(e.target.value))}
                    className="w-full pl-7 pr-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none focus:border-[var(--primary)]"
                  />
                </div>
                <p className="text-[10px] text-zinc-400">Total eligible refund: ₹{order.pricing.total.toFixed(2)}</p>
              </div>

              {/* Refund Method */}
              <div className="flex flex-col gap-1.5">
                <label className="font-semibold text-zinc-700 dark:text-zinc-350">Refund Payout Mode</label>
                <select
                  value={refundMethod}
                  onChange={(e) => setRefundMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none focus:border-[var(--primary)]"
                >
                  <option value="UPI">UPI Payout</option>
                  <option value="Bank Transfer">Bank Transfer (IMPS/NEFT)</option>
                  <option value="Wallet">Papa Veg Pizza Wallet Credit</option>
                  <option value="Original Payment Source">Original Payment Source ({order.paymentMethod})</option>
                </select>
              </div>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-350">Primary Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="Out of Stock topping substitution rejected">Out of Stock topping substitution rejected</option>
                <option value="Kitchen equipment issue - oven malfunction">Kitchen equipment issue - oven malfunction</option>
                <option value="Delivery rider not allocated in time">Delivery rider not allocated in time</option>
                <option value="Double payment charged on checkout timeout">Double payment charged on checkout timeout</option>
                <option value="Customer request cancellation window match">Customer request cancellation window match</option>
              </select>
            </div>

            {/* Remarks */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-350">Internal Audit Remarks (Optional)</label>
              <textarea
                rows={2}
                placeholder="Provide details about transaction confirmations, client chats, or approval notes..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] resize-none"
              />
            </div>

            {/* Notification Checkbox */}
            <div className="flex items-center gap-2.5 p-3 rounded-xl border border-dashed border-zinc-150 dark:border-zinc-800 bg-zinc-50/10 dark:bg-zinc-900/5">
              <input
                id="notify"
                type="checkbox"
                checked={notifyCustomer}
                onChange={(e) => setNotifyCustomer(e.target.checked)}
                className="h-4 w-4 rounded-sm text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
              />
              <label htmlFor="notify" className="font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                Send SMS & Email notifications to customer automatically on dispatch
              </label>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-55 cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? "Initiating..." : "Initiate Refund"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
