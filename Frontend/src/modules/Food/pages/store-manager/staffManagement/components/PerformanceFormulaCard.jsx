import React, { useState } from "react";
import { Sparkles, Pizza, Calendar, Flame, MessageSquare, Info } from "lucide-react";

export default function PerformanceFormulaCard() {
  const [activeWeight, setActiveWeight] = useState(null);

  const weights = [
    {
      id: "orders",
      percentage: 40,
      label: "Orders Completed",
      desc: "Measures volume of production. High volume indicates strong productivity and capability under peak hours.",
      icon: Pizza,
      colorClass: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
      accentBorder: "border-amber-400"
    },
    {
      id: "attendance",
      percentage: 30,
      label: "Attendance Rate",
      desc: "Reflects reliability and punctuality. Unexcused absences or late shifts penalize this score heavily.",
      icon: Calendar,
      colorClass: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30",
      accentBorder: "border-blue-400"
    },
    {
      id: "speed",
      percentage: 20,
      label: "Preparation Speed",
      desc: "Calculated based on average order prep times compared to station standards. Fast execution boosts this score.",
      icon: Flame,
      colorClass: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
      accentBorder: "border-rose-400"
    },
    {
      id: "feedback",
      percentage: 10,
      label: "Customer Feedback",
      desc: "Aggregates customer ratings and formal complaints. Negative reviews or order re-makes impact this metric.",
      icon: MessageSquare,
      colorClass: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
      accentBorder: "border-emerald-400"
    }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-5 rounded-3xl shadow-sm transition-all">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Sparkles size={16} className="text-orange-550" />
            Performance Score Calculation Formula
          </h4>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-455 mt-0.5">
            Hover or tap each metric to understand the underlying logic. Scores are recalculated in real-time.
          </p>
        </div>
        <div className="p-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-lg">
          <Info size={14} className="text-zinc-400" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {weights.map((w) => {
          const Icon = w.icon;
          const isSelected = activeWeight === w.id;
          
          return (
            <div
              key={w.id}
              onMouseEnter={() => setActiveWeight(w.id)}
              onMouseLeave={() => setActiveWeight(null)}
              className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between h-[130px] ${
                isSelected 
                  ? `border-slate-800 dark:border-zinc-600 bg-zinc-50/50 dark:bg-zinc-850/55 ${w.accentBorder} shadow-sm` 
                  : "border-zinc-150 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 border rounded-xl ${w.colorClass}`}>
                  <Icon size={16} />
                </div>
                <span className="text-lg font-black text-slate-900 dark:text-white">
                  {w.percentage}%
                </span>
              </div>
              <div className="mt-2 space-y-1">
                <p className="text-xs font-black text-slate-900 dark:text-white">{w.label}</p>
                <p className="text-[10px] text-zinc-450 dark:text-zinc-500 line-clamp-2 leading-relaxed">
                  {isSelected ? w.desc : "Hover for details..."}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
