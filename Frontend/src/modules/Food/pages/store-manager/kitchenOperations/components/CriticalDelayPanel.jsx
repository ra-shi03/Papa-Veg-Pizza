import React from "react";
import { ShieldAlert, ChevronRight } from "lucide-react";

export default function CriticalDelayPanel({ orders = [], onEscalate }) {
  const safeOrders = Array.isArray(orders) ? orders : [];
  
  // Filter for critical delays (> 20 mins)
  const criticalOrders = safeOrders
    .filter((o) => o.isDelayed && o.delay_duration > 20)
    .sort((a, b) => b.delay_duration - a.delay_duration);

  if (criticalOrders.length === 0) return null;

  return (
    <div className="bg-rose-50/20 dark:bg-rose-950/5 border border-rose-100 dark:border-rose-950/25 p-3 rounded-2.5xl space-y-2">
      <div className="flex items-center gap-1.5 text-rose-500 font-black text-[10px] uppercase tracking-widest px-1">
        <ShieldAlert size={12} className="animate-pulse" />
        <span>Critical SLA Violations Require Action</span>
      </div>

      <div className="flex flex-row overflow-x-auto gap-2.5 pb-1 select-none no-scrollbar">
        {criticalOrders.map((order) => {
          let warningText = "20+ Min Delay";
          let alertColor = "bg-rose-50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30";
          
          if (order.delay_duration > 45) {
            warningText = "45+ Min Critical Delay";
            alertColor = "bg-red-100 border-red-200 dark:bg-red-950/30 dark:border-red-900/50";
          } else if (order.delay_duration > 30) {
            warningText = "30+ Min Heavy Delay";
            alertColor = "bg-rose-100 border-rose-200 dark:bg-rose-950/25 dark:border-rose-900/40";
          }

          return (
            <div
              key={order._id}
              className={`flex-shrink-0 w-[240px] md:w-[260px] p-2.5 rounded-2xl border transition-all hover:scale-[1.01] flex items-center justify-between gap-2 shadow-sm ${alertColor}`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-black text-rose-600 dark:text-rose-400">
                    #{order.orderNumber}
                  </span>
                  <span className="text-[8px] font-bold text-slate-400 dark:text-zinc-500">•</span>
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-tight">
                    {warningText}
                  </span>
                </div>
                
                <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200 truncate max-w-[140px]">
                  {order.customer.name}
                </h4>
                
                <p className="text-[9px] text-slate-400 font-bold">
                  Stage: <strong className="text-slate-700 dark:text-zinc-300 uppercase">{order.status}</strong> • {order.delay_duration} min
                </p>
              </div>

              <button
                onClick={() => onEscalate(order)}
                className="h-7 px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-[9px] flex items-center gap-0.5 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <span>Escalate</span>
                <ChevronRight size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
