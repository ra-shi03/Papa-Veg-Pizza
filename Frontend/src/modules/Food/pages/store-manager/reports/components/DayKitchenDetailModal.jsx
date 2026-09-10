import React, { useEffect } from "react";
import { X, Calendar, ClipboardList, ChefHat, Activity, Package, AlertTriangle, AlertCircle, Trash2, Loader2 } from "lucide-react";
import { useKitchenDayDetails } from "../hooks/useKitchenDayDetails";

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

export default function DayKitchenDetailModal({ isOpen, onClose, date }) {
  const { data, isLoading, isError } = useKitchenDayDetails(date);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] overflow-x-hidden overflow-y-auto outline-none transition-all">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-5xl mx-4 my-8 z-50 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-fade-down duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <ClipboardList size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Kitchen Operational Details
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                {date ? formatDate(date) : "Daily Logs"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Container */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 scrollbar-thin">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3">
              <Loader2 className="animate-spin text-[var(--primary)]" size={32} />
              <span className="text-xs font-bold text-zinc-400">Loading daily metrics...</span>
            </div>
          ) : isError ? (
            <div className="py-12 text-center text-rose-500 font-bold text-xs">
              Failed to load daily kitchen operational details. Please try again.
            </div>
          ) : (
            <>
              {/* SECTION 1: Orders Processed */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Orders", val: data.ordersProcessed?.total, style: "text-zinc-900 dark:text-white" },
                  { label: "Completed Orders", val: data.ordersProcessed?.completed, style: "text-emerald-500" },
                  { label: "Delayed Orders", val: data.ordersProcessed?.delayed, style: "text-amber-500" },
                  { label: "Cancelled Orders", val: data.ordersProcessed?.cancelled, style: "text-rose-500" }
                ].map((s, idx) => (
                  <div key={idx} className="bg-neutral-50/50 dark:bg-zinc-950/40 p-4 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider block mb-1">
                      {s.label}
                    </span>
                    <span className={`text-xl font-black ${s.style}`}>{s.val}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* SECTION 2: Staff On Duty */}
                <div className="lg:col-span-8 space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                    <ChefHat size={12} className="text-[var(--primary)]" />
                    Staff On Duty
                  </h3>
                  <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Staff Member</th>
                          <th className="px-4 py-2 text-left">Role</th>
                          <th className="px-4 py-2 text-center">Orders Handled</th>
                          <th className="px-4 py-2 text-right">Avg Prep Time</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {data.staffOnDuty?.map((staff, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-950/20">
                            <td className="px-4 py-2.5 text-zinc-900 dark:text-white">{staff.name}</td>
                            <td className="px-4 py-2.5 text-zinc-455">{staff.role}</td>
                            <td className="px-4 py-2.5 text-center">{staff.ordersHandled}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-500">{staff.avgPrepTime} mins</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 3: Station Utilization */}
                <div className="lg:col-span-4 space-y-3.5 bg-neutral-50/30 dark:bg-zinc-950/10 p-4 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                  <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                    <Activity size={12} className="text-[var(--primary)]" />
                    Station Utilization
                  </h3>
                  <div className="space-y-3">
                    {[
                      { name: "Pizza Station", val: data.stationUtilization?.pizza },
                      { name: "Baking Station", val: data.stationUtilization?.baking },
                      { name: "Packaging Station", val: data.stationUtilization?.packaging }
                    ].map((stat, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-xs font-bold">
                          <span className="text-zinc-700 dark:text-zinc-300">{stat.name}</span>
                          <span className="text-[var(--primary)]">{stat.val}%</span>
                        </div>
                        <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-[var(--primary)] h-full rounded-full transition-all duration-500" 
                            style={{ width: `${stat.val}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SECTION 4: Ingredient Usage */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                    <Package size={12} className="text-[var(--primary)]" />
                    Ingredient Usage Log
                  </h3>
                  <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Ingredient</th>
                          <th className="px-4 py-2 text-center">Used Qty</th>
                          <th className="px-4 py-2 text-right">Remaining Stock</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {data.ingredientUsage?.map((ing, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-950/20">
                            <td className="px-4 py-2.5 text-zinc-900 dark:text-white">{ing.name}</td>
                            <td className="px-4 py-2.5 text-center">{ing.usedQty}</td>
                            <td className="px-4 py-2.5 text-right text-zinc-500">{ing.remainingQty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 5: Delays */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                    <AlertTriangle size={12} className="text-amber-500" />
                    Active Preparation Delays
                  </h3>
                  <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Order ID</th>
                          <th className="px-4 py-2 text-center">Duration</th>
                          <th className="px-4 py-2 text-left">Reason / Bottleneck</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {data.delays?.map((delay, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-950/20">
                            <td className="px-4 py-2.5 text-[var(--primary)]">{delay.orderId}</td>
                            <td className="px-4 py-2.5 text-center text-rose-500">{delay.duration} mins</td>
                            <td className="px-4 py-2.5 text-zinc-550 truncate max-w-xs">{delay.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* SECTION 6: Customer Complaints */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                    <AlertCircle size={12} className="text-rose-500" />
                    Customer Food Complaints
                  </h3>
                  <div className="space-y-3.5">
                    {data.complaints?.map((comp, idx) => (
                      <div 
                        key={idx} 
                        className="p-4 bg-rose-50/30 dark:bg-rose-950/10 border border-rose-100/50 dark:border-rose-950/20 rounded-2xl space-y-1.5"
                      >
                        <div className="flex justify-between items-center text-xs font-extrabold">
                          <span className="text-rose-550">{comp.type}</span>
                          <span className="text-zinc-400">Order: {comp.orderId}</span>
                        </div>
                        <p className="text-zinc-600 dark:text-zinc-455 text-[11px] leading-relaxed">
                          {comp.description}
                        </p>
                        <div className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 pt-1">
                          Status: {comp.status}
                        </div>
                      </div>
                    ))}
                    {(!data.complaints || data.complaints.length === 0) && (
                      <div className="p-4 bg-neutral-50/50 border rounded-2xl text-center text-zinc-400 text-xs">
                        No food preparation complaints registered today.
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 7: Waste Records */}
                <div className="space-y-2">
                  <h3 className="text-xs font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-1">
                    <Trash2 size={12} className="text-rose-500" />
                    Daily Waste Records
                  </h3>
                  <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850">
                      <thead className="bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] font-black uppercase text-zinc-400 dark:text-zinc-500">
                        <tr>
                          <th className="px-4 py-2 text-left">Ingredient</th>
                          <th className="px-4 py-2 text-center">Wasted Qty</th>
                          <th className="px-4 py-2 text-right">Cost (INR)</th>
                          <th className="px-4 py-2 text-left">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        {data.wasteRecords?.map((waste, idx) => (
                          <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-zinc-950/20">
                            <td className="px-4 py-2.5 text-zinc-900 dark:text-white">{waste.ingredient}</td>
                            <td className="px-4 py-2.5 text-center text-rose-500">{waste.quantity}</td>
                            <td className="px-4 py-2.5 text-right font-black text-rose-650">{formatINR(waste.cost)}</td>
                            <td className="px-4 py-2.5 text-zinc-500 truncate max-w-[120px]">{waste.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-4 border-t border-zinc-100 dark:border-zinc-850 shrink-0 bg-neutral-50/40 dark:bg-zinc-950/20">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
