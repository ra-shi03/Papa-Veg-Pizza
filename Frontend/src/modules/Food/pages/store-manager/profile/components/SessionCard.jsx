import React from "react";
import { Laptop, Smartphone, Globe, ShieldCheck, LogOut, Loader2 } from "lucide-react";

export default function SessionCard({
  session = {},
  onTerminate = () => {},
  terminatingId = null,
}) {
  const isTerminating = terminatingId === session.id;

  const getDeviceIcon = (deviceStr = "") => {
    const d = deviceStr.toLowerCase();
    if (d.includes("phone") || d.includes("mobile") || d.includes("android") || d.includes("ios")) {
      return Smartphone;
    }
    return Laptop;
  };

  const Icon = getDeviceIcon(session.device);

  return (
    <div className="bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-4 rounded-xl shadow-sm flex items-start justify-between gap-4">
      <div className="flex gap-3 items-start min-w-0">
        <div className="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 text-[var(--primary)] shrink-0 flex items-center justify-center">
          <Icon size={16} className="stroke-[2.2]" />
        </div>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 truncate">
              {session.device || "Unknown Device"}
            </span>
            {session.current && (
              <span className="text-[8px] font-extrabold px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-0.5 whitespace-nowrap">
                <ShieldCheck size={9} />
                <span>Current Session</span>
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 gap-0.5 text-[10px] font-semibold text-slate-450 dark:text-zinc-500">
            <p className="flex items-center gap-1">
              <Globe size={11} className="shrink-0" />
              <span className="truncate">{session.browser || "Unknown Browser"} &bull; {session.ipAddress || "0.0.0.0"}</span>
            </p>
            <p>
              Last Active: <strong className="text-slate-650 dark:text-zinc-400">{session.lastActive || "N/A"}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* TERMINATE BUTTON */}
      {!session.current && (
        <button
          onClick={() => onTerminate(session.id)}
          disabled={!!terminatingId}
          className="p-1.5 rounded-lg border border-zinc-250 dark:border-zinc-700 text-slate-500 hover:text-red-600 hover:border-red-200 dark:hover:text-red-400 dark:hover:border-red-950/40 hover:bg-red-50 dark:hover:bg-red-950/10 transition-all shrink-0 disabled:opacity-50"
          title="Logout session"
        >
          {isTerminating ? (
            <Loader2 size={13} className="animate-spin text-red-500" />
          ) : (
            <LogOut size={13} />
          )}
        </button>
      )}
    </div>
  );
}
