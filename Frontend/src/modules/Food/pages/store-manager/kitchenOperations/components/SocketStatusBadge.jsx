import React from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function SocketStatusBadge({ connected }) {
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border transition-all ${
      connected
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
        : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 animate-pulse"
    }`}>
      {connected ? (
        <>
          <span className="relative flex h-1.5 w-1.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
          </span>
          <Wifi size={10} className="shrink-0" />
          <span>LIVE FEED</span>
        </>
      ) : (
        <>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500 shrink-0"></span>
          <WifiOff size={10} className="shrink-0" />
          <span>OFFLINE</span>
        </>
      )}
    </div>
  );
}
