import React from "react"
import { Users, UserCheck, UserX, DollarSign, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function FranchiseKPIs({ stats }) {
  const kpiData = [
    {
      title: "Total Franchise Admins",
      value: stats.total,
      change: "+12.5%",
      isPositive: true,
      icon: Users,
      color: "text-black dark:text-white bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-800",
      sparkline: [20, 24, 22, 28, 26, 32, 30, 36, 35, 42]
    },
    {
      title: "Active Franchise Admins",
      value: stats.active,
      change: "+8.3%",
      isPositive: true,
      icon: UserCheck,
      color: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
      sparkline: [15, 18, 17, 21, 20, 24, 22, 27, 26, 30]
    },
    {
      title: "Inactive Franchise Admins",
      value: stats.inactive,
      change: "-4.2%",
      isPositive: false,
      icon: UserX,
      color: "text-black dark:text-white bg-zinc-100/50 dark:bg-zinc-800/30 border-zinc-200 dark:border-zinc-800/50",
      sparkline: [8, 9, 7, 8, 6, 8, 7, 9, 8, 6]
    },
    {
      title: "Total Franchise Revenue",
      value: `₹${stats.revenue.toLocaleString()}`,
      change: "+18.2%",
      isPositive: true,
      icon: DollarSign,
      color: "text-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 border-[var(--primary)]/20",
      sparkline: [120, 140, 135, 160, 155, 180, 175, 210, 200, 234]
    },
    {
      title: "Pending Approvals",
      value: stats.pending,
      change: "New",
      isPositive: true,
      icon: Clock,
      color: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
      sparkline: [2, 3, 2, 4, 3, 5, 4, 6, 5, 6]
    }
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 select-none">
      {kpiData.map((kpi, idx) => {
        const Icon = kpi.icon
        return (
          <div
            key={idx}
            className="group relative bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 p-3 rounded-lg shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden flex items-center justify-between"
          >
            {/* Background Glow */}
            <div className="absolute -right-6 -bottom-6 w-16 h-16 rounded-full bg-zinc-50 dark:bg-zinc-800/10 group-hover:scale-150 transition-transform duration-500 opacity-30 pointer-events-none" />

            <div className="flex flex-col gap-0.5 min-w-0 relative z-10">
              <span className="text-black dark:text-white text-[10px] font-bold uppercase tracking-wider truncate">
                {kpi.title}
              </span>
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <h3 className="text-lg font-black text-black dark:text-white tracking-tight leading-none">
                  {kpi.value}
                </h3>
                <span
                  className={`inline-flex items-center gap-0.5 text-[8px] font-extrabold px-1 py-0.2 rounded-full ${kpi.isPositive
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                    : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400"
                    }`}
                >
                  {kpi.change}
                </span>
              </div>

              {/* Responsive SVG Mini Trend Graph inside left panel */}
              <div className="w-16 h-4 opacity-75 mt-1.5">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 100 40">
                  <defs>
                    <linearGradient id={`sparkline-grad-${idx}`} x1="0" y1="0" x2="0" y2="1">
                      <stop
                        offset="0%"
                        stopColor={kpi.isPositive ? "#10b981" : "#f43f5e"}
                        stopOpacity="0.4"
                      />
                      <stop
                        offset="100%"
                        stopColor={kpi.isPositive ? "#10b981" : "#f43f5e"}
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>
                  {/* Fill path */}
                  <path
                    d={`M ${kpi.sparkline
                      .map((val, i) => `${(i * 100) / 9} ${40 - (val / 50) * 35}`)
                      .join(" L ")} L 100 40 L 0 40 Z`}
                    fill={`url(#sparkline-grad-${idx})`}
                  />
                  {/* Line path */}
                  <path
                    d={kpi.sparkline
                      .map((val, i) => `${i === 0 ? "M" : "L"} ${(i * 100) / 9} ${40 - (val / 50) * 35}`)
                      .join(" ")}
                    fill="none"
                    stroke={kpi.isPositive ? "#10b981" : "#f43f5e"}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            <div className={`p-1.5 rounded-md border border-zinc-100 dark:border-zinc-800 transition-transform group-hover:scale-105 duration-300 relative z-10 shrink-0 ${kpi.color}`}>
              <Icon size={14} className="stroke-[2.2]" />
            </div>
          </div>
        )
      })}
    </div>
  )
}

