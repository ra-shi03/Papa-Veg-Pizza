import React from "react";
import { Percent, ShoppingBag, Star, Calendar } from "lucide-react";

export default function ProfileStats({
  attendanceSummary = {},
  performanceSummary = {},
  loading = false,
}) {
  const stats = [
    {
      title: "Attendance Rate",
      value: attendanceSummary?.attendanceRate ? `${attendanceSummary.attendanceRate}%` : "0%",
      subtext: `${attendanceSummary?.presentDays || 0} days present this month`,
      icon: Percent,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/35",
    },
    {
      title: "Orders Managed",
      value: performanceSummary?.ordersPrepared || performanceSummary?.ordersManaged || 0,
      subtext: "Total orders processed",
      icon: ShoppingBag,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/35",
    },
    {
      title: "Performance Rating",
      value: `${performanceSummary?.personalRating || performanceSummary?.performanceRating || 0.0} / 5.0`,
      subtext: "Quarterly manager rating",
      icon: Star,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/35",
    },
    {
      title: "Years of Service",
      value: performanceSummary?.yearsOfService ? `${performanceSummary.yearsOfService} Yrs` : "N/A",
      subtext: "Tenure at Papa Veg",
      icon: Calendar,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/35",
    },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm animate-pulse flex flex-col justify-between h-[100px]"
          >
            <div className="flex items-center justify-between">
              <div className="h-3 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="w-6 h-6 rounded-md bg-zinc-200 dark:bg-zinc-800" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
              <div className="h-2 w-28 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 w-full">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div
            key={index}
            className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3.5 rounded-xl flex flex-col justify-between hover:scale-[1.01] active:scale-[0.99] transition-all duration-300 shadow-sm h-[100px] group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`p-1 rounded-md border ${stat.color} flex items-center justify-center shrink-0`}>
                <Icon size={12} className="stroke-[2.5]" />
              </div>
            </div>
            <div className="flex flex-col gap-0.5 mt-2">
              <span className="text-lg font-black text-slate-900 dark:text-white">
                {stat.value}
              </span>
              <span className="text-[8px] font-medium text-slate-400 dark:text-zinc-500 truncate">
                {stat.subtext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
