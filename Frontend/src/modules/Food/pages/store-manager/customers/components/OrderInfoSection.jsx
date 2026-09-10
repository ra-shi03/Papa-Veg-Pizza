import React from "react";
import { Pizza, Receipt, Clock, CreditCard, ShoppingBag } from "lucide-react";

export default function OrderInfoSection({ order }) {
  if (!order) {
    return (
      <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 text-center font-semibold text-xs text-zinc-400 py-8">
        No order details associated with this complaint.
      </div>
    );
  }

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const items = order.items || [];

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <Receipt size={15} className="text-[var(--primary)]" />
        Order Summary
      </h4>

      <div className="grid grid-cols-2 gap-3 pb-2.5 border-b border-zinc-100 dark:border-zinc-850">
        <div>
          <span className="text-[10px] text-zinc-400 block mb-0.5">Order Number</span>
          <span className="font-mono text-zinc-850 dark:text-zinc-200 font-bold bg-zinc-200/50 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-[10px]">
            {order.orderNumber}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block mb-0.5">Amount</span>
          <span className="font-extrabold text-zinc-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block mb-0.5">Order Status</span>
          <span className="capitalize font-bold text-zinc-700 dark:text-zinc-300">{order.orderStatus}</span>
        </div>
        <div>
          <span className="text-[10px] text-zinc-400 block mb-0.5">Payment Method</span>
          <span className="capitalize font-bold text-zinc-700 dark:text-zinc-300">{order.paymentMethod}</span>
        </div>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-extrabold">Ordered Items</label>
        {items.length === 0 ? (
          <div className="text-zinc-400 italic text-[11px] font-semibold">No items listed.</div>
        ) : (
          <div className="space-y-2.5 max-h-[140px] overflow-y-auto pr-1">
            {items.map((item) => (
              <div key={item._id} className="flex justify-between items-start gap-2 bg-white dark:bg-zinc-900 p-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                <div className="space-y-0.5 flex-1">
                  <div className="flex items-center gap-1">
                    <Pizza size={11} className="text-emerald-500 shrink-0" />
                    <span className="font-extrabold text-zinc-850 dark:text-zinc-200">{item.name}</span>
                    <span className="text-zinc-400 font-bold">x{item.quantity}</span>
                  </div>
                  {item.customizations && (
                    <p className="text-[9px] text-zinc-400 leading-normal pl-4 font-semibold italic">{item.customizations}</p>
                  )}
                </div>
                <span className="font-bold text-zinc-800 dark:text-zinc-300 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
