import React from "react";
import { Flame, Settings, AlertTriangle, Power, Pizza } from "lucide-react";
import RemainingTimer from "./RemainingTimer";

export default function OvenStatusPanel({ ovens = [], items = [] }) {
  const safeOvens = Array.isArray(ovens) ? ovens : [];
  const safeItems = Array.isArray(items) ? items : [];

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30">
            Available
          </span>
        );
      case "busy":
        return (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 animate-pulse">
            Busy
          </span>
        );
      case "maintenance":
        return (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30">
            Maintenance
          </span>
        );
      case "offline":
      default:
        return (
          <span className="text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider bg-slate-50 text-slate-555 dark:bg-zinc-800 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
            Offline
          </span>
        );
    }
  };

  const getOvenIcon = (status) => {
    switch (status) {
      case "available":
        return <Pizza className="text-emerald-500 shrink-0" size={16} />;
      case "busy":
        return <Flame className="text-amber-500 animate-pulse shrink-0" size={16} />;
      case "maintenance":
        return <Settings className="text-rose-500 shrink-0" size={16} />;
      case "offline":
      default:
        return <Power className="text-slate-400 shrink-0" size={16} />;
    }
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-4 rounded-3xl space-y-3.5 shadow-sm transition-all duration-300">
      <div className="flex items-center justify-between border-b border-slate-50 dark:border-zinc-850 pb-2.5">
        <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
          <Flame size={15} className="text-[var(--primary)]" />
          <span>Oven Status Panel</span>
        </h3>
        <span className="text-[9px] font-black text-slate-400 dark:text-zinc-555 uppercase">
          {safeOvens.length} Decks Configured
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3.5">
        {safeOvens.map((oven) => {
          // Look up corresponding active pizza item in this oven
          const activePizza = safeItems.find(
            (item) => item.assigned_oven === oven._id && ["baking_started", "baking_paused"].includes(item.baking_status)
          );

          const isBusy = oven.status === "busy";
          const isMaintenance = oven.status === "maintenance";
          const isOffline = oven.status === "offline";

          return (
            <div
              key={oven._id}
              className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between gap-2.5 ${
                isBusy
                  ? "bg-amber-50/10 border-amber-100 dark:border-amber-900/30"
                  : isMaintenance
                  ? "bg-rose-50/10 border-rose-100 dark:border-rose-900/30"
                  : isOffline
                  ? "bg-slate-50/10 border-slate-100 dark:border-zinc-850"
                  : "bg-emerald-50/5 border-emerald-100/50 dark:border-emerald-900/10"
              }`}
            >
              {/* Top Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getOvenIcon(oven.status)}
                  <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                    {oven.oven_number}
                  </span>
                </div>
                {getStatusBadge(oven.status)}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-slate-50 dark:border-zinc-850/50 pt-2">
                <div>
                  <span className="text-slate-400 dark:text-zinc-555 block font-bold uppercase text-[9px]">
                    Deck Temp
                  </span>
                  <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                    {oven.temperature}°C
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 dark:text-zinc-555 block font-bold uppercase text-[9px]">
                    Timer
                  </span>
                  {activePizza ? (
                    <RemainingTimer
                      startedTime={activePizza.started_time}
                      expectedDuration={activePizza.expectedDuration || 8}
                    />
                  ) : (
                    <span className="text-xs font-black text-slate-450 dark:text-zinc-500">
                      --:--
                    </span>
                  )}
                </div>
              </div>

              {/* Footer current pizza info */}
              {isBusy && activePizza && (
                <div className="bg-slate-50 dark:bg-zinc-950 p-2 rounded-xl border border-slate-100 dark:border-zinc-850 flex items-center justify-between gap-1.5">
                  <div className="truncate">
                    <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500 block uppercase leading-none mb-0.5">
                      Baking Pizza
                    </span>
                    <span className="text-[10px] font-black text-slate-800 dark:text-zinc-200 block truncate leading-tight">
                      {activePizza.name}
                    </span>
                  </div>
                  <span className="text-[8px] font-extrabold text-[var(--primary)] bg-red-50 dark:bg-red-950/20 px-1.5 py-0.5 rounded border border-red-100 dark:border-red-900/30 shrink-0">
                    {activePizza.size}
                  </span>
                </div>
              )}

              {isMaintenance && (
                <div className="bg-rose-50/50 dark:bg-rose-950/20 p-2 rounded-xl border border-rose-100/50 dark:border-rose-900/30 flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                  <AlertTriangle size={11} className="shrink-0" />
                  <span className="text-[9px] font-bold">
                    Deck requires heating core calibration.
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
