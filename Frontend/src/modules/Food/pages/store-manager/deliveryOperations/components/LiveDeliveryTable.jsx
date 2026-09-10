import React from "react";
import { Navigation, Clock, User } from "lucide-react";

export default function LiveDeliveryTable({ deliveries = [], isLoading, onTrack }) {
  const safeDeliveries = Array.isArray(deliveries) ? deliveries : [];

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "assigned":
        return "bg-slate-50 text-slate-600 border-slate-100 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-850";
      case "accepted":
        return "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/15 dark:text-blue-400 dark:border-blue-900/30";
      case "picked_up":
        return "bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/15 dark:text-amber-400 dark:border-amber-900/30";
      case "out_for_delivery":
        return "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/10 dark:text-orange-400 dark:border-orange-900/20";
      case "delivered":
        return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/30";
      default:
        return "bg-slate-50 text-slate-500 border-slate-100 dark:bg-zinc-800 dark:text-zinc-400";
    }
  };

  const getStatusLabel = (status) => {
    return status ? status.replace(/_/g, " ").toUpperCase() : "UNKNOWN";
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "--:--";
    try {
      const d = new Date(timeStr);
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch (_) {
      return timeStr;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 w-full">
      {/* Desktop/Tablet Table */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full border-collapse text-left text-xs table-auto">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-555 border-b border-slate-100 dark:border-zinc-855 font-black uppercase tracking-widest text-[9px]">
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Customer</th>
              <th className="py-3.5 px-4">Rider</th>
              <th className="py-3.5 px-4">Pickup Time</th>
              <th className="py-3.5 px-4">ETA</th>
              <th className="py-3.5 px-4">Current Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <tr key={n} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-20" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-md w-24" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-16 ml-auto" /></td>
                </tr>
              ))
            ) : safeDeliveries.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-12 text-center text-slate-400 dark:text-zinc-550 font-black text-sm">
                  No active deliveries found.
                </td>
              </tr>
            ) : (
              safeDeliveries.map((delivery) => (
                <tr
                  key={delivery._id}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 font-bold transition-all text-slate-800 dark:text-zinc-300"
                >
                  <td className="py-3 px-4 font-extrabold text-slate-900 dark:text-white">
                    {delivery.orderId}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-700 dark:text-zinc-300">
                    {delivery.customerName || "Walk-in Customer"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 text-slate-600 dark:text-zinc-400">
                      <User size={12} className="text-slate-400" />
                      <span>{delivery.riderName || "Not Assigned"}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-500">
                    {formatTime(delivery.pickupTime)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      <span className={delivery.deliveryStatus === "delivered" ? "text-emerald-500 font-extrabold" : "text-slate-900 dark:text-white"}>
                        {delivery.eta || "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md border ${getStatusBadge(delivery.deliveryStatus)}`}>
                      {getStatusLabel(delivery.deliveryStatus)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => onTrack(delivery.orderId)}
                      disabled={delivery.deliveryStatus === "delivered"}
                      style={delivery.deliveryStatus !== "delivered" ? { backgroundColor: "var(--primary)" } : {}}
                      className={`h-8 px-3 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all shadow-sm flex items-center gap-1 ml-auto cursor-pointer ${
                        delivery.deliveryStatus === "delivered"
                          ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 border border-slate-200 dark:border-zinc-800 cursor-not-allowed"
                          : "text-white hover:opacity-90"
                      }`}
                    >
                      <Navigation size={11} className={delivery.deliveryStatus === "delivered" ? "" : "animate-pulse"} />
                      <span>Track</span>
                    </button>
                  </td>
                </tr>
              ))
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
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-16" />
              </div>
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-32" />
              <div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-full" />
            </div>
          ))
        ) : safeDeliveries.length === 0 ? (
          <div className="py-12 text-center text-slate-455 dark:text-zinc-550 font-black text-xs">
            No active deliveries found.
          </div>
        ) : (
          safeDeliveries.map((delivery) => (
            <div key={delivery._id} className="p-4 space-y-3 font-bold text-xs">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-slate-900 dark:text-white font-extrabold text-sm block">
                    {delivery.orderId}
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold mt-0.5 block">
                    Cust: {delivery.customerName}
                  </span>
                </div>
                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${getStatusBadge(delivery.deliveryStatus)}`}>
                  {getStatusLabel(delivery.deliveryStatus)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-855 text-slate-600 dark:text-zinc-400">
                <div>
                  <span className="text-slate-400 block uppercase text-[8px] font-black">Rider:</span>
                  <span className="font-bold text-slate-800 dark:text-white">{delivery.riderName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase text-[8px] font-black">ETA:</span>
                  <span className="font-bold text-slate-800 dark:text-white flex items-center gap-0.5">
                    <Clock size={10} />
                    {delivery.eta}
                  </span>
                </div>
              </div>

              <button
                onClick={() => onTrack(delivery.orderId)}
                disabled={delivery.deliveryStatus === "delivered"}
                style={delivery.deliveryStatus !== "delivered" ? { backgroundColor: "var(--primary)" } : {}}
                className={`w-full h-9 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer ${
                  delivery.deliveryStatus === "delivered"
                    ? "bg-slate-100 dark:bg-zinc-800 text-slate-400 border border-slate-200 dark:border-zinc-800 cursor-not-allowed"
                    : "text-white hover:opacity-90"
                }`}
              >
                <Navigation size={12} className={delivery.deliveryStatus === "delivered" ? "" : "animate-pulse"} />
                <span>Track Live Order</span>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
