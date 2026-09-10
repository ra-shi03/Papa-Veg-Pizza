import React from "react";
import { Eye, Calendar } from "lucide-react";

export default function RecentOrdersTable({ orders = [], onViewOrder }) {
  if (orders.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-400 dark:text-zinc-650 text-xs font-semibold">
        No orders found for this customer.
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "delivered":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
      case "preparing":
      case "ready":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
      case "pending":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400";
      case "cancelled":
      case "refunded":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400";
      default:
        return "bg-zinc-500/10 text-zinc-500 dark:text-zinc-400";
    }
  };

  return (
    <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
      <table className="w-full text-left text-xs font-semibold">
        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
          <tr>
            <th className="px-4 py-2.5">Order Number</th>
            <th className="px-4 py-2.5">Date</th>
            <th className="px-4 py-2.5">Amount</th>
            <th className="px-4 py-2.5">Status</th>
            <th className="px-4 py-2.5 text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
          {orders.map((ord) => (
            <tr key={ord._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
              <td className="px-4 py-2.5 font-mono font-extrabold text-zinc-900 dark:text-white">
                {ord.orderNumber}
              </td>
              <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-450">
                {new Date(ord.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </td>
              <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-white">
                ₹{ord.totalAmount}
              </td>
              <td className="px-4 py-2.5">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${getStatusBadge(ord.orderStatus)}`}>
                  {ord.orderStatus}
                </span>
              </td>
              <td className="px-4 py-2.5 text-right">
                <button
                  onClick={() => onViewOrder?.(ord._id)}
                  className="px-2 py-1 bg-zinc-100 dark:bg-zinc-850 hover:bg-[var(--primary)] hover:text-white text-zinc-600 dark:text-zinc-350 font-bold rounded-lg text-[10px] transition-all cursor-pointer"
                >
                  View Details
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
