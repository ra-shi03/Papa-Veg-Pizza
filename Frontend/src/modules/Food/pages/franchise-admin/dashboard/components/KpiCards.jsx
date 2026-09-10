import React from "react"
import { DollarSign, ShoppingBag, Store, Truck, RotateCcw, AlertTriangle, Scale, Star, ArrowUpRight, ArrowDownRight } from "lucide-react"

export default function KpiCards({ data, loading }) {
  const cards = [
    {
      title: "Today's Revenue",
      value: `₹${Number(data?.revenue || 0).toLocaleString("en-IN")}`,
      trend: "+12.4%",
      up: true,
      icon: DollarSign,
      color: "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20",
    },
    {
      title: "Today's Orders",
      value: `${data?.orders || 0} Orders`,
      trend: "+8.2%",
      up: true,
      icon: ShoppingBag,
      color: "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20",
    },
    {
      title: "Active Stores",
      value: `${data?.activeStores || 0} Stores`,
      trend: "0.0%",
      up: true,
      icon: Store,
      color: "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20",
    },
    {
      title: "Online Riders",
      value: `${data?.activeRiders || 0} Partners`,
      trend: "+4.1%",
      up: true,
      icon: Truck,
      color: "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20",
    },
    {
      title: "Pending Refunds",
      value: `${data?.refunds || 0} Requests`,
      trend: "+1.2%",
      up: false,
      icon: RotateCcw,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
      critical: true
    },
    {
      title: "Low Stock Alerts",
      value: `${data?.lowStock || 0} Alerts`,
      trend: "Critical",
      up: false,
      icon: AlertTriangle,
      color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/30",
      warning: true
    },
    {
      title: "Avg Order Value",
      value: `₹${data?.avgOrderValue || 0}`,
      trend: "+2.5%",
      up: true,
      icon: Scale,
      color: "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20",
    },
    {
      title: "Cust. Satisfaction",
      value: `${data?.customerSatisfaction || 0} / 5`,
      trend: "Excellent",
      up: true,
      icon: Star,
      color: "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20",
    }
  ]

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-3 rounded-2xl animate-pulse space-y-2">
            <div className="h-2.5 w-1/2 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-5 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
            <div className="h-2 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon
        return (
          <div
            key={idx}
            className={`p-3 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex flex-col justify-between shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden ${
              card.critical ? "ring-1 ring-rose-500/20" : card.warning ? "ring-1 ring-orange-500/20" : ""
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider truncate mr-1">
                {card.title}
              </span>
              <div className={`p-1 rounded-lg border ${card.color} shrink-0`}>
                <Icon size={12} className="stroke-[2.5]" />
              </div>
            </div>
            
            <div>
              <p className="text-sm sm:text-base font-black text-zinc-900 dark:text-white leading-tight">
                {card.value}
              </p>
              <div className="flex items-center gap-0.5 mt-1">
                {card.up ? (
                  <ArrowUpRight size={10} className="text-emerald-500 shrink-0" />
                ) : (
                  <ArrowDownRight size={10} className="text-rose-500 shrink-0" />
                )}
                <span className={`text-[8px] font-bold ${
                  card.trend === "Critical" ? "text-orange-500" :
                  card.trend === "Excellent" ? "text-purple-500" :
                  card.up ? "text-emerald-500" : "text-rose-500"
                }`}>
                  {card.trend}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
