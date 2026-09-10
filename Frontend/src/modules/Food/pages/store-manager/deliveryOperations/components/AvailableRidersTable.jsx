import React from "react";
import { Star, Navigation, MapPin } from "lucide-react";

export default function AvailableRidersTable({ riders = [], onSelectRider, isLoading }) {
  const safeRiders = Array.isArray(riders) ? riders : [];

  const getStatusBadge = (status, availability) => {
    if (status === "offline") {
      return "bg-slate-100 text-slate-550 border-slate-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-850";
    }
    if (availability === "busy") {
      return "bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/15 dark:text-rose-450 dark:border-rose-900/30";
    }
    return "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/30";
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2.5xl overflow-hidden shadow-xs w-full max-h-[380px] overflow-y-auto">
      <table className="w-full border-collapse text-left text-xs table-auto">
        <thead>
          <tr className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-555 border-b border-slate-100 dark:border-zinc-850 font-black uppercase tracking-widest text-[9px] sticky top-0 z-10">
            <th className="py-2.5 px-3">Rider Name</th>
            <th className="py-2.5 px-3">Vehicle</th>
            <th className="py-2.5 px-3">Distance</th>
            <th className="py-2.5 px-3">Active Loads</th>
            <th className="py-2.5 px-3">Rating</th>
            <th className="py-2.5 px-3">Status</th>
            <th className="py-2.5 px-3 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
          {isLoading ? (
            [1, 2, 3].map((n) => (
              <tr key={n} className="animate-pulse">
                <td className="py-3 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-20" /></td>
                <td className="py-3 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-10" /></td>
                <td className="py-3 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-14" /></td>
                <td className="py-3 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-8" /></td>
                <td className="py-3 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-12" /></td>
                <td className="py-3 px-3"><div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-14" /></td>
                <td className="py-3 px-3 text-right"><div className="h-7 bg-slate-200 dark:bg-zinc-850 rounded w-14 ml-auto" /></td>
              </tr>
            ))
          ) : safeRiders.length === 0 ? (
            <tr>
              <td colSpan="7" className="py-8 text-center text-slate-400 dark:text-zinc-550 font-bold">
                No available delivery partners online.
              </td>
            </tr>
          ) : (
            safeRiders.map((rider) => {
              const statusDisplay = rider.currentStatus === "offline" ? "Offline" : (rider.availability === "busy" ? "Busy" : "Online");
              const isEligible = rider.currentStatus === "online" && rider.availability === "idle";

              return (
                <tr key={rider._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 font-bold transition-all text-slate-800 dark:text-zinc-300">
                  <td className="py-2.5 px-3">
                    <div className="font-extrabold text-slate-900 dark:text-white">{rider.name}</div>
                    <div className="text-[9px] font-bold text-slate-400">{rider.mobile}</div>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-500">{rider.vehicleType}</td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center gap-0.5 text-slate-600 dark:text-zinc-400">
                      <MapPin size={9} className="text-slate-400" />
                      <span>{rider.distanceFromStore} km</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 font-semibold">{rider.activeOrders} orders</td>
                  <td className="py-2.5 px-3">
                    <span className="flex items-center gap-0.5 text-amber-500 font-black">
                      <Star size={10} fill="currentColor" className="stroke-[2.5]" />
                      <span>{rider.rating}</span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${getStatusBadge(rider.currentStatus, rider.availability)}`}>
                      {statusDisplay}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onSelectRider(rider)}
                      disabled={!isEligible}
                      className={`h-7 px-3.5 rounded-xl text-[9px] uppercase font-black tracking-wider transition-all shadow-xs cursor-pointer ${
                        isEligible
                          ? "bg-[var(--primary)] text-white hover:bg-[var(--sa-primary-hover)]"
                          : "bg-slate-100 text-slate-400 border border-slate-200 dark:bg-zinc-800 dark:text-zinc-650 dark:border-zinc-850 cursor-not-allowed"
                      }`}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
