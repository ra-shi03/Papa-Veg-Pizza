import React, { useState, useEffect } from "react";
import { Play, Pause, AlertOctagon, BookOpen, Check, ChefHat, ExternalLink, RefreshCw } from "lucide-react";
import { Tooltip, Tag } from "antd";

// Live Ticker Component for the Table rows
const ElapsedTimer = ({ startTime, targetTime, paused, completedTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    const updateTime = () => {
      const endTime = completedTime ? new Date(completedTime) : new Date();
      const diff = Math.floor((endTime - new Date(startTime)) / 60000);
      setElapsed(Math.max(0, diff));
    };
    updateTime();
    if (!completedTime && !paused) {
      const interval = setInterval(updateTime, 30000);
      return () => clearInterval(interval);
    }
  }, [startTime, paused, completedTime]);

  if (!startTime) return <span className="text-slate-400 dark:text-zinc-600 font-bold">-</span>;

  const isOverdue = elapsed > targetTime && !completedTime;

  return (
    <span className={`font-black text-xs ${
      isOverdue 
        ? "text-rose-500 font-extrabold" 
        : completedTime 
        ? "text-emerald-500" 
        : "text-slate-700 dark:text-zinc-300"
    }`}>
      {elapsed} min
    </span>
  );
};

export default function PizzaStationTable({
  items = [],
  isLoading,
  chefs = [],
  onOpenStart,
  onOpenPause,
  onOpenComplete,
  onOpenRecipe,
  onOpenIssue
}) {
  const getStatusBadge = (status, paused) => {
    if (paused) {
      return (
        <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white px-2 py-0.5 rounded-full border border-amber-400">
          PAUSED
        </span>
      );
    }

    switch (status) {
      case "assigned":
        return (
          <span className="text-[9px] font-black uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/30">
            ASSIGNED
          </span>
        );
      case "assembly_started":
        return (
          <span className="text-[9px] font-black uppercase tracking-wider bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/30 animate-pulse">
            STARTED
          </span>
        );
      case "assembly_completed":
      case "ready_for_baking":
        return (
          <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
            COMPLETED
          </span>
        );
      default:
        return (
          <span className="text-[9px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-zinc-700">
            {status}
          </span>
        );
    }
  };

  const getChefData = (chefId) => {
    return chefs.find((c) => c._id === chefId);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
      
      {/* Desktop/Tablet Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-550 border-b border-slate-100 dark:border-zinc-850 font-black uppercase tracking-widest text-[9px] sticky top-0">
              <th className="py-3.5 px-4">Pizza ID</th>
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Pizza Name</th>
              <th className="py-3.5 px-4">Size/Crust</th>
              <th className="py-3.5 px-4">Toppings</th>
              <th className="py-3.5 px-4">Assigned Chef</th>
              <th className="py-3.5 px-4">Elapsed</th>
              <th className="py-3.5 px-4">Target</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 dark:divide-zinc-850">
            {isLoading ? (
              [1, 2, 3].map((n) => (
                <tr key={n} className="animate-pulse">
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-12" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-250 dark:bg-zinc-850 rounded w-28" /></td>
                  <td className="py-4 px-4"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-20" /></td>
                  <td className="py-4 px-4"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-full w-20" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-10" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-8" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded w-14" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-24 ml-auto" /></td>
                </tr>
              ))
            ) : items.length === 0 ? (
              <tr>
                <td colSpan="10" className="py-12 text-center text-slate-400 dark:text-zinc-550 font-bold">
                  No pizzas assigned at this station.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const chef = getChefData(item.assigned_chef);
                const visibleToppings = item.toppings?.slice(0, 3) || [];
                const hiddenToppingsCount = (item.toppings?.length || 0) - 3;

                return (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 font-bold transition-all text-slate-800 dark:text-zinc-300">
                    <td className="py-3 px-4 font-black">{item.pizzaId || `PIZ-${item._id.slice(-3)}`}</td>
                    <td className="py-3 px-4">
                      <span className="text-[var(--primary)] cursor-pointer hover:underline flex items-center gap-0.5">
                        #{item.orderNumber}
                        <ExternalLink size={10} className="text-slate-400" />
                      </span>
                    </td>
                    <td className="py-3 px-4 font-black text-slate-900 dark:text-white">{item.name}</td>
                    <td className="py-3 px-4">
                      <span>{item.size} • <span className="text-[10px] text-slate-500">{item.crust}</span></span>
                    </td>
                    <td className="py-3 px-4 max-w-[150px]">
                      <div className="flex flex-wrap gap-1">
                        {visibleToppings.map((t, idx) => (
                          <span key={idx} className="text-[8px] bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400 px-1 py-0.2 rounded border border-slate-200/50 dark:border-zinc-800">
                            {t}
                          </span>
                        ))}
                        {hiddenToppingsCount > 0 && (
                          <span className="text-[8px] text-[var(--primary)] font-black">+{hiddenToppingsCount}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {chef ? (
                        <div className="flex items-center gap-1.5">
                          <img src={chef.avatar} alt={chef.name} className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-800" />
                          <span className="text-[10px] truncate max-w-[80px]">{chef.name.split(" ").slice(-1)[0]}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 flex items-center gap-1 text-[10px] font-medium">
                          <ChefHat size={10} />
                          Not Assigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <ElapsedTimer 
                        startTime={item.assembly_started_time} 
                        targetTime={item.target_time} 
                        paused={item.paused}
                        completedTime={item.completed_time}
                      />
                    </td>
                    <td className="py-3 px-4 text-slate-500">{item.target_time || 10} min</td>
                    <td className="py-3 px-4">{getStatusBadge(item.assembly_status, item.paused)}</td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Recipe view */}
                        <button
                          onClick={() => onOpenRecipe(item)}
                          className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-350 rounded-xl cursor-pointer transition-all border border-slate-150/50 dark:border-zinc-800"
                          title="View Recipe"
                        >
                          <BookOpen size={13} />
                        </button>

                        {/* Report Shortage */}
                        <button
                          onClick={() => onOpenIssue(item)}
                          className="w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/35 text-rose-600 dark:text-rose-455 rounded-xl cursor-pointer transition-all border border-rose-100/50 dark:border-rose-900/20"
                          title="Report Shortage"
                        >
                          <AlertOctagon size={13} />
                        </button>

                        {/* Status change actions */}
                        {item.assembly_status === "assigned" && (
                          <button
                            onClick={() => onOpenStart(item)}
                            className="h-8 px-3.5 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white rounded-xl flex items-center justify-center gap-1 font-black transition-all cursor-pointer shadow-sm text-[10px] uppercase tracking-wider"
                          >
                            <Play size={10} fill="white" />
                            <span>Start Assembly</span>
                          </button>
                        )}

                        {item.assembly_status === "assembly_started" && (
                          <>
                            <button
                              onClick={() => onOpenPause(item)}
                              className="w-8 h-8 flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-xl cursor-pointer transition-all border border-amber-100/50 dark:border-amber-900/20"
                              title="Pause Assembly"
                            >
                              <Pause size={13} />
                            </button>
                            <button
                              onClick={() => onOpenComplete(item)}
                              className="h-8 px-3 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white rounded-xl flex items-center justify-center gap-1 font-black transition-all cursor-pointer shadow-sm text-[10px] uppercase tracking-wider"
                            >
                              <Check size={10} className="stroke-[3]" />
                              <span>Complete</span>
                            </button>
                          </>
                        )}

                        {item.assembly_status === "assembly_paused" && (
                          <button
                            onClick={() => onOpenStart(item)}
                            className="h-8 px-3.5 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white rounded-xl flex items-center justify-center gap-1 font-black transition-all cursor-pointer shadow-sm text-[10px] uppercase tracking-wider"
                          >
                            <Play size={10} fill="white" />
                            <span>Resume</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Grid Layout (only visible below MD breakpoint) */}
      <div className="block md:hidden p-3 space-y-3 bg-slate-50/50 dark:bg-zinc-950/20">
        {isLoading ? (
          [1, 2].map((n) => (
            <div key={n} className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-2.5xl p-3.5 space-y-3 animate-pulse">
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-16" />
                <div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-10" />
              </div>
              <div className="h-3.5 bg-slate-250 dark:bg-zinc-850 rounded w-full pt-1" />
              <div className="h-3 bg-slate-250 dark:bg-zinc-850 rounded w-2/3" />
            </div>
          ))
        ) : items.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-zinc-550 font-bold">
            No pizzas assigned at this station.
          </div>
        ) : (
          items.map((item) => {
            const chef = getChefData(item.assigned_chef);
            const isOverdue = item.assembly_started_time && 
              (new Date() - new Date(item.assembly_started_time)) / 60000 > (item.target_time || 10) && 
              item.assembly_status !== "assembly_completed";

            return (
              <div key={item._id} className={`bg-white dark:bg-zinc-900 border rounded-2.5xl p-3 space-y-2.5 shadow-sm relative ${
                isOverdue ? "border-l-4 border-l-rose-500" : ""
              } ${item.paused ? "border-amber-250 bg-amber-50/5" : ""}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-900 dark:text-white">
                      {item.pizzaId || `PIZ-${item._id.slice(-3)}`}
                    </span>
                    <span className="text-[9px] font-bold text-slate-450">
                      Order: #{item.orderNumber}
                    </span>
                  </div>
                  {getStatusBadge(item.assembly_status, item.paused)}
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.name}</h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-0.5">{item.size} • {item.crust} • Qty {item.quantity}</p>
                </div>

                {/* Toppings list */}
                <div className="flex flex-wrap gap-1 border-t border-slate-50 dark:border-zinc-850 pt-1.5">
                  {item.toppings?.map((t, idx) => (
                    <span key={idx} className="text-[8px] bg-slate-100 dark:bg-zinc-850 text-slate-500 dark:text-zinc-400 px-1.5 py-0.2 rounded">
                      {t}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between text-[9px] font-bold text-slate-450 pt-1 border-t border-slate-50 dark:border-zinc-850">
                  <div className="flex items-center gap-1.5">
                    {chef ? (
                      <>
                        <img src={chef.avatar} alt={chef.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                        <span>{chef.name.split(" ").slice(-1)[0]}</span>
                      </>
                    ) : (
                      <span className="text-slate-400">Unassigned</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span>Elapsed: <ElapsedTimer startTime={item.assembly_started_time} targetTime={item.target_time} paused={item.paused} completedTime={item.completed_time} /></span>
                    <span className="text-slate-400">Target: {item.target_time || 10} min</span>
                  </div>
                </div>

                {/* Action Buttons for Mobile */}
                <div className="flex gap-1.5 pt-1.5 border-t border-slate-50 dark:border-zinc-850">
                  <button
                    onClick={() => onOpenRecipe(item)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-350 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <BookOpen size={10} />
                  </button>
                  <button
                    onClick={() => onOpenIssue(item)}
                    className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                  >
                    <AlertOctagon size={10} />
                  </button>

                  {item.assembly_status === "assigned" && (
                    <button
                      onClick={() => onOpenStart(item)}
                      className="flex-1 py-1.5 bg-[var(--primary)] text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play size={10} fill="white" />
                      Start Assembly
                    </button>
                  )}

                  {item.assembly_status === "assembly_started" && (
                    <>
                      <button
                        onClick={() => onOpenPause(item)}
                        className="p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-950/20 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Pause size={10} />
                      </button>
                      <button
                        onClick={() => onOpenComplete(item)}
                        className="flex-1 py-1.5 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Check size={10} className="stroke-[3]" />
                        Complete
                      </button>
                    </>
                  )}

                  {item.assembly_status === "assembly_paused" && (
                    <button
                      onClick={() => onOpenStart(item)}
                      className="flex-1 py-1.5 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play size={10} fill="white" />
                      Resume
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}
