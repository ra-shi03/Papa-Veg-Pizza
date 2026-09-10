import React, { useState, useEffect } from "react";
import { Tooltip } from "antd";
import { UserCheck, Clock, ExternalLink, ShoppingBag } from "lucide-react";
import { getStaffName } from "../../kitchenOperations/hooks/useDelayedOrders";

export default function ReadyOrdersTable({
  orders = [],
  isLoading,
  onOpenAssign,
  riders = []
}) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  const safeRiders = Array.isArray(riders) ? riders : [];

  const [now, setNow] = useState(Date.now());

  // Update wait times every 30 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setNow(Date.now());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const getRiderName = (riderId) => {
    if (!riderId) return "-";
    const rider = safeRiders.find(r => r._id === riderId || r.id === riderId);
    if (rider) return rider.name;
    const mockRidersMap = {
      "rider-001": "Ramesh Kumar",
      "rider-002": "Sunita Patil",
      "rider-003": "Karan Singh",
      "rider-1": "Rahul Singh",
      "rider-2": "Amit Patel",
      "rider-3": "Suresh Pillai"
    };
    return mockRidersMap[riderId] || "Assigned Rider";
  };

  const getWaitTimeAndColor = (completedAt) => {
    if (!completedAt) return { text: "-", color: "text-slate-400 bg-slate-50 border-slate-100" };
    const diffMs = now - new Date(completedAt).getTime();
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));

    let color = "text-emerald-700 bg-emerald-50 border-emerald-100 dark:text-emerald-400 dark:bg-emerald-950/15 dark:border-emerald-900/30";
    if (diffMins > 10) {
      color = "text-rose-700 bg-rose-50 border-rose-100 dark:text-rose-400 dark:bg-rose-950/15 dark:border-rose-900/30 animate-pulse";
    } else if (diffMins >= 5) {
      color = "text-amber-700 bg-amber-50 border-amber-100 dark:text-amber-400 dark:bg-amber-950/15 dark:border-amber-900/30";
    }

    return {
      text: `${diffMins} min`,
      color
    };
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
      return new Date(timeStr).toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    } catch (e) {
      return "-";
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 w-full">
      {/* Desktop/Tablet Table */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full border-collapse text-left text-xs table-auto">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-555 border-b border-slate-100 dark:border-zinc-850 font-black uppercase tracking-widest text-[9px]">
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Amount</th>
              <th className="py-3.5 px-4">Ready Time</th>
              <th className="py-3.5 px-4">Wait Duration</th>
              <th className="py-3.5 px-4">Assigned Rider</th>
              <th className="py-3.5 px-4">Assignment Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <tr key={n} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-28" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-12" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-14" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded w-12" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-20" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-md w-16" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-24 ml-auto" /></td>
                </tr>
              ))
            ) : safeOrders.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400 dark:text-zinc-550 font-black text-sm">
                  No ready orders available.
                </td>
              </tr>
            ) : (
              safeOrders.map((order) => {
                const wait = getWaitTimeAndColor(order.packagingCompletedAt || order.readyAt || order.createdAt);
                const isAssigned = !!(order.assignedRiderId || order.deliveryPartnerId);

                let statusBadge = "bg-slate-50 text-slate-700 border-slate-100 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-850";
                const dStatus = (order.deliveryStatus || (isAssigned ? "assigned" : "waiting")).toLowerCase();
                if (dStatus === "assigned") {
                  statusBadge = "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/15 dark:text-blue-400 dark:border-blue-900/30";
                } else if (dStatus === "accepted" || dStatus === "picked_up") {
                  statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/30";
                } else {
                  statusBadge = "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/10 dark:text-orange-400 dark:border-orange-900/20";
                }

                return (
                  <tr key={order._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 font-bold transition-all text-slate-800 dark:text-zinc-300">
                    <td className="py-3 px-4 font-black">
                      <span className="text-[var(--primary)] flex items-center gap-0.5">
                        {order.orderNumber}
                        <ExternalLink size={9} className="text-slate-450" />
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">
                          {order.customerName || order.customer?.name || "Customer"}
                        </div>
                        <div className="text-[9px] font-bold text-slate-455">
                          {order.customerPhone || order.customer?.phone || "-"}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-black">
                      ₹{order.totalAmount || order.grandTotal || 0}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">
                      {formatTime(order.packagingCompletedAt || order.readyAt || order.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-md border ${wait.color}`}>
                        {wait.text}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-extrabold">
                      {isAssigned ? (
                        <div className="flex items-center gap-1 text-slate-900 dark:text-white">
                          <UserCheck size={11} className="text-blue-500" />
                          <span>{getRiderName(order.assignedRiderId || order.deliveryPartnerId)}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-medium">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${statusBadge}`}>
                        {order.deliveryStatus || (isAssigned ? "assigned" : "waiting")}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onOpenAssign(order)}
                        disabled={isAssigned}
                        className={`h-8 px-3.5 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all shadow-sm cursor-pointer ${
                          isAssigned
                            ? "bg-slate-100 text-slate-450 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-650 dark:border-zinc-850 cursor-not-allowed"
                            : "bg-[var(--primary)] text-white hover:bg-[var(--sa-primary-hover)]"
                        }`}
                      >
                        {isAssigned ? "Assigned" : "Assign Rider"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-slate-100 dark:divide-zinc-850 p-1">
        {isLoading ? (
          [1, 2].map((n) => (
            <div key={n} className="p-4 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-20" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-14" />
              </div>
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-32" />
              <div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-full" />
            </div>
          ))
        ) : safeOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-455 dark:text-zinc-550 font-black text-xs">
            No ready orders available.
          </div>
        ) : (
          safeOrders.map((order) => {
            const wait = getWaitTimeAndColor(order.packagingCompletedAt || order.readyAt || order.createdAt);
            const isAssigned = !!(order.assignedRiderId || order.deliveryPartnerId);

            return (
              <div key={order._id} className="p-4 space-y-3 font-bold">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[var(--primary)] font-black text-sm">
                      {order.orderNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold ml-1.5">
                      ({order.customerName || order.customer?.name || "Customer"})
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-800 dark:text-white font-black">
                    ₹{order.totalAmount || order.grandTotal || 0}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-600 dark:text-zinc-400">
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Ready Time</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                      {formatTime(order.packagingCompletedAt || order.readyAt || order.createdAt)}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Wait Duration</span>
                    <span className={`font-black ${wait.color} px-1.5 py-0.2 rounded border inline-block`}>
                      {wait.text}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Rider Status</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                      {isAssigned ? getRiderName(order.assignedRiderId || order.deliveryPartnerId) : "Unassigned"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Delivery Status</span>
                    <span className="font-black uppercase text-[var(--secondary)]">
                      {order.deliveryStatus || (isAssigned ? "assigned" : "waiting")}
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-50 dark:border-zinc-850 pt-2.5">
                  <button
                    onClick={() => onOpenAssign(order)}
                    disabled={isAssigned}
                    className={`w-full h-8 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all shadow-sm cursor-pointer ${
                      isAssigned
                        ? "bg-slate-100 text-slate-450 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-650 dark:border-zinc-850 cursor-not-allowed"
                        : "bg-[var(--primary)] text-white hover:bg-[var(--sa-primary-hover)]"
                    }`}
                  >
                    {isAssigned ? "Rider Assigned" : "Assign Rider"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
