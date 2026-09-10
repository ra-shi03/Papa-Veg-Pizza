import React from "react";
import { Eye, Smartphone, Bike, CheckCircle, Clock } from "lucide-react";

export default function RidersTable({ riders = [], isLoading, onViewRider }) {
  const safeRiders = Array.isArray(riders) ? riders : [];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300 w-full">
      {/* Desktop/Tablet Table */}
      <div className="hidden md:block overflow-x-auto w-full">
        <table className="w-full border-collapse text-left text-xs table-auto">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-555 border-b border-slate-100 dark:border-zinc-855 font-black uppercase tracking-widest text-[9px]">
              <th className="py-3.5 px-4">Rider</th>
              <th className="py-3.5 px-4">Vehicle</th>
              <th className="py-3.5 px-4">Availability</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4">Active Orders</th>
              <th className="py-3.5 px-4">Today's Deliveries</th>
              <th className="py-3.5 px-4">Avg Delivery Time</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <tr key={n} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-28" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-md w-16" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-md w-16" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-10" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-10" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-16 ml-auto" /></td>
                </tr>
              ))
            ) : safeRiders.length === 0 ? (
              <tr>
                <td colSpan="8" className="py-12 text-center text-slate-400 dark:text-zinc-550 font-black text-sm">
                  No delivery partners found.
                </td>
              </tr>
            ) : (
              safeRiders.map((rider) => {
                const isOnline = rider.availability === "online";
                const isIdle = rider.currentStatus === "idle";

                const availabilityBadge = isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/30"
                  : "bg-slate-50 text-slate-700 border-slate-100 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-850";

                const statusBadge = isIdle
                  ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/15 dark:text-blue-400 dark:border-blue-900/30"
                  : "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/10 dark:text-orange-400 dark:border-orange-900/20";

                return (
                  <tr key={rider._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 font-bold transition-all text-slate-800 dark:text-zinc-300">
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <div className="font-extrabold text-slate-900 dark:text-white">{rider.name}</div>
                        <div className="text-[9px] font-bold text-slate-455 flex items-center gap-1">
                          <Smartphone size={10} />
                          <span>{rider.mobile}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">{rider.vehicleType}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${availabilityBadge}`}>
                        {rider.availability || "Offline"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${statusBadge}`}>
                        {rider.currentStatus || "Idle"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-900 dark:text-white font-black">{rider.activeOrders}</td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">{rider.todayDeliveries}</td>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-0.5 text-slate-900 dark:text-white">
                        <Clock size={11} className="text-slate-400" />
                        <span>{rider.averageDeliveryTime} mins</span>
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onViewRider(rider)}
                        className="h-8 px-3 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all shadow-sm cursor-pointer bg-[var(--primary)] text-white hover:bg-[var(--sa-primary-hover)] flex items-center gap-1 ml-auto"
                      >
                        <Eye size={12} />
                        <span>View</span>
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
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-24" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-14" />
              </div>
              <div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-32" />
              <div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-full" />
            </div>
          ))
        ) : safeRiders.length === 0 ? (
          <div className="py-12 text-center text-slate-455 dark:text-zinc-550 font-black text-xs">
            No delivery partners found.
          </div>
        ) : (
          safeRiders.map((rider) => {
            const isOnline = rider.availability === "online";
            const isIdle = rider.currentStatus === "idle";

            const availabilityBadge = isOnline
              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/15 dark:text-emerald-400 dark:border-emerald-900/30"
              : "bg-slate-50 text-slate-700 border-slate-100 dark:bg-zinc-850 dark:text-zinc-400 dark:border-zinc-850";

            const statusBadge = isIdle
              ? "bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/15 dark:text-blue-400 dark:border-blue-900/30"
              : "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/10 dark:text-orange-400 dark:border-orange-900/20";

            return (
              <div key={rider._id} className="p-4 space-y-3 font-bold text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-slate-900 dark:text-white font-extrabold text-sm block">
                      {rider.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold flex items-center gap-0.5 mt-0.5">
                      <Smartphone size={10} />
                      {rider.mobile}
                    </span>
                  </div>
                  <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${availabilityBadge}`}>
                    {rider.availability || "Offline"}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-655 dark:text-zinc-400">
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Vehicle Type</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                      {rider.vehicleType}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Duty Status</span>
                    <span className={`font-black px-1.5 py-0.2 rounded border inline-block ${statusBadge}`}>
                      {rider.currentStatus || "Idle"}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Active Orders</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                      {rider.activeOrders} active
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase text-[8px]">Avg Delivery Time</span>
                    <span className="font-extrabold text-slate-800 dark:text-zinc-200 flex items-center gap-0.5">
                      <Clock size={10} className="text-slate-400" />
                      {rider.averageDeliveryTime} mins
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-50 dark:border-zinc-850 pt-2.5">
                  <button
                    onClick={() => onViewRider(rider)}
                    className="w-full h-8 rounded-xl text-[10px] uppercase font-black tracking-wider transition-all shadow-sm cursor-pointer bg-[var(--primary)] text-white hover:bg-[var(--sa-primary-hover)] flex items-center justify-center gap-1"
                  >
                    <Eye size={12} />
                    <span>View Details</span>
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
