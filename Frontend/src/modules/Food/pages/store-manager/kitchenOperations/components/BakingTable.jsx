import React from "react";
import { Play, Pause, AlertOctagon, Check, ChefHat, ArrowRight, ExternalLink } from "lucide-react";
import { Tooltip } from "antd";
import RemainingTimer from "./RemainingTimer";
import BakingStatusBadge from "./BakingStatusBadge";

export default function BakingTable({
  items = [],
  ovens = [],
  staff = [],
  isLoading,
  onOpenStart,
  onOpenMove,
  onOpenPause,
  onOpenComplete,
  onOpenIssue
}) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeOvens = Array.isArray(ovens) ? ovens : [];
  const safeStaff = Array.isArray(staff) ? staff : [];

  const getStaffData = (staffId) => {
    return safeStaff.find((s) => s._id === staffId);
  };

  const getOvenData = (ovenId) => {
    return safeOvens.find((o) => o._id === ovenId);
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
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm transition-all duration-300">
      
      {/* Desktop/Tablet Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-555 border-b border-slate-100 dark:border-zinc-850 font-black uppercase tracking-widest text-[9px] sticky top-0">
              <th className="py-3.5 px-4">Item ID</th>
              <th className="py-3.5 px-4">Order ID</th>
              <th className="py-3.5 px-4">Pizza Name</th>
              <th className="py-3.5 px-4">Size/Crust</th>
              <th className="py-3.5 px-4">Oven Deck</th>
              <th className="py-3.5 px-4">Assigned Staff</th>
              <th className="py-3.5 px-4">Start Time</th>
              <th className="py-3.5 px-4">Target</th>
              <th className="py-3.5 px-4">Remaining Time</th>
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
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-28" /></td>
                  <td className="py-4 px-4"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-20" /></td>
                  <td className="py-4 px-4"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-14" /></td>
                  <td className="py-4 px-4"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-20" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-10" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-8" /></td>
                  <td className="py-4 px-4"><div className="h-3.5 bg-slate-200 dark:bg-zinc-850 rounded w-14" /></td>
                  <td className="py-4 px-4"><div className="h-5 bg-slate-200 dark:bg-zinc-850 rounded-full w-20" /></td>
                  <td className="py-4 px-4 text-right"><div className="h-8 bg-slate-200 dark:bg-zinc-850 rounded w-24 ml-auto" /></td>
                </tr>
              ))
            ) : safeItems.length === 0 ? (
              <tr>
                <td colSpan="11" className="py-12 text-center text-slate-400 dark:text-zinc-550 font-bold">
                  No pizzas currently in baking station.
                </td>
              </tr>
            ) : (
              safeItems.map((item) => {
                const oven = getOvenData(item.assigned_oven);
                const staffMember = getStaffData(item.assigned_staff);
                
                return (
                  <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-950/20 font-bold transition-all text-slate-800 dark:text-zinc-300">
                    <td className="py-3 px-4 font-black">{item._id.startsWith("bake-") ? `BI-${item._id.slice(-3).toUpperCase()}` : item._id}</td>
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
                    <td className="py-3 px-4">
                      {oven ? (
                        <span className="text-[10px] font-black bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
                          {oven.oven_number}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px] font-medium">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {staffMember ? (
                        <div className="flex items-center gap-1.5">
                          <img src={staffMember.avatar} alt={staffMember.name} className="w-5 h-5 rounded-full object-cover shrink-0 border border-slate-200 dark:border-zinc-800" />
                          <span className="text-[10px] truncate max-w-[80px]">{staffMember.name.split(" ").slice(-1)[0]}</span>
                        </div>
                      ) : (
                        <span className="text-slate-450 flex items-center gap-1 text-[10px] font-medium">
                          <ChefHat size={10} />
                          Unassigned
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-semibold">{formatTime(item.started_time)}</td>
                    <td className="py-3 px-4 text-slate-500">{item.expectedDuration || 8} min</td>
                    <td className="py-3 px-4">
                      <RemainingTimer
                        startedTime={item.started_time}
                        expectedDuration={item.expectedDuration || 8}
                      />
                    </td>
                    <td className="py-3 px-4">
                      <BakingStatusBadge status={item.baking_status} />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end items-center gap-2">
                        {/* Issue Log Trigger */}
                        {item.baking_status !== "ready_for_baking" && (
                          <Tooltip title="Report Baking Issue">
                            <button
                              onClick={() => onOpenIssue(item)}
                              className="w-8 h-8 flex items-center justify-center bg-rose-50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/35 text-rose-600 dark:text-rose-455 rounded-xl cursor-pointer transition-all border border-rose-100/50 dark:border-rose-900/20"
                            >
                              <AlertOctagon size={13} />
                            </button>
                          </Tooltip>
                        )}

                        {/* Status workflow triggers */}
                        {item.baking_status === "ready_for_baking" && (
                          <button
                            onClick={() => onOpenStart(item)}
                            className="h-8 px-3.5 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white rounded-xl flex items-center justify-center gap-1 font-black transition-all cursor-pointer shadow-sm text-[10px] uppercase tracking-wider"
                          >
                            <Play size={10} fill="white" />
                            <span>Start Baking</span>
                          </button>
                        )}

                        {item.baking_status === "baking_started" && (
                          <>
                            <Tooltip title="Shift Oven">
                              <button
                                onClick={() => onOpenMove(item)}
                                className="w-8 h-8 flex items-center justify-center bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-350 rounded-xl cursor-pointer transition-all border border-slate-150/50 dark:border-zinc-800"
                              >
                                <ArrowRight size={13} />
                              </button>
                            </Tooltip>

                            <Tooltip title="Pause Cooking">
                              <button
                                onClick={() => onOpenPause(item)}
                                className="w-8 h-8 flex items-center justify-center bg-amber-50 dark:bg-amber-950/20 hover:bg-amber-100 dark:hover:bg-amber-900/30 text-amber-600 dark:text-amber-555 rounded-xl cursor-pointer transition-all border border-amber-100/50 dark:border-amber-900/20"
                              >
                                <Pause size={13} />
                              </button>
                            </Tooltip>

                            <button
                              onClick={() => onOpenComplete(item)}
                              className="h-8 px-3 bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)] text-white rounded-xl flex items-center justify-center gap-1 font-black transition-all cursor-pointer shadow-sm text-[10px] uppercase tracking-wider"
                            >
                              <Check size={10} className="stroke-[3]" />
                              <span>Complete</span>
                            </button>
                          </>
                        )}

                        {item.baking_status === "baking_paused" && (
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

      {/* Mobile Card Layout */}
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
        ) : safeItems.length === 0 ? (
          <div className="py-6 text-center text-slate-400 dark:text-zinc-550 font-bold">
            No pizzas currently in baking station.
          </div>
        ) : (
          safeItems.map((item) => {
            const oven = getOvenData(item.assigned_oven);
            const staffMember = getStaffData(item.assigned_staff);
            const isOverdue = item.started_time && 
              (new Date() - new Date(item.started_time)) / 60000 > (item.expectedDuration || 8) && 
              item.baking_status !== "baking_completed";

            return (
              <div
                key={item._id}
                className={`bg-white dark:bg-zinc-900 border rounded-2.5xl p-3.5 space-y-3 shadow-sm relative ${
                  isOverdue ? "border-l-4 border-l-rose-500" : ""
                } ${item.baking_status === "baking_paused" ? "border-amber-250 bg-amber-50/5" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black text-slate-900 dark:text-white">
                      {item._id.startsWith("bake-") ? `BI-${item._id.slice(-3).toUpperCase()}` : item._id}
                    </span>
                    <span className="text-[9px] font-bold text-slate-450">
                      Order: #{item.orderNumber}
                    </span>
                  </div>
                  <BakingStatusBadge status={item.baking_status} />
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-900 dark:text-white">{item.name}</h4>
                  <p className="text-[9px] font-bold text-slate-450 mt-0.5">{item.size} • {item.crust} • Qty {item.quantity}</p>
                </div>

                <div className="flex justify-between items-center text-[10px] border-t border-slate-50 dark:border-zinc-850/50 pt-2 text-slate-500">
                  <div className="flex items-center gap-1.5">
                    {oven ? (
                      <span className="font-extrabold bg-amber-50 text-amber-700 dark:bg-amber-950/20 px-2 py-0.5 rounded border border-amber-100 dark:border-amber-900/30">
                        {oven.oven_number}
                      </span>
                    ) : (
                      <span>Oven: -</span>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {staffMember ? (
                      <div className="flex items-center gap-1">
                        <img src={staffMember.avatar} alt={staffMember.name} className="w-4 h-4 rounded-full object-cover shrink-0" />
                        <span className="font-extrabold">{staffMember.name.split(" ").slice(-1)[0]}</span>
                      </div>
                    ) : (
                      <span>Unassigned</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-slate-50 dark:border-zinc-850/50 font-bold">
                  <div className="flex items-center gap-1 text-slate-400">
                    <span>Started:</span>
                    <span className="text-slate-700 dark:text-zinc-300">{formatTime(item.started_time)}</span>
                  </div>
                  
                  <div className="flex items-center gap-2.5">
                    <span className="text-slate-400">Remaining:</span>
                    <RemainingTimer
                      startedTime={item.started_time}
                      expectedDuration={item.expectedDuration || 8}
                    />
                  </div>
                </div>

                {/* Mobile Action Buttons */}
                <div className="flex gap-1.5 pt-2 border-t border-slate-50 dark:border-zinc-850/50">
                  {item.baking_status !== "ready_for_baking" && (
                    <button
                      onClick={() => onOpenIssue(item)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                      title="Report Issue"
                    >
                      <AlertOctagon size={10} />
                    </button>
                  )}

                  {item.baking_status === "ready_for_baking" && (
                    <button
                      onClick={() => onOpenStart(item)}
                      className="flex-1 py-1.5 bg-[var(--primary)] text-white text-[9px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Play size={10} fill="white" />
                      Start Baking
                    </button>
                  )}

                  {item.baking_status === "baking_started" && (
                    <>
                      <button
                        onClick={() => onOpenMove(item)}
                        className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 text-slate-650 dark:text-zinc-350 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                        title="Move Oven"
                      >
                        <ArrowRight size={10} />
                      </button>
                      <button
                        onClick={() => onOpenPause(item)}
                        className="p-1.5 bg-amber-50 text-amber-600 dark:bg-amber-950/20 rounded-lg flex items-center justify-center shrink-0 cursor-pointer"
                        title="Pause Cooking"
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

                  {item.baking_status === "baking_paused" && (
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
