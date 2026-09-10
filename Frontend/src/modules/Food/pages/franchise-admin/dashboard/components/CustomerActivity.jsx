import React from "react"
import { Users, UserPlus, Heart, Award, ArrowUpRight } from "lucide-react"

export default function CustomerActivity({ customerData, loading }) {
  const data = customerData || {
    newCustomers: 0,
    repeatCustomers: 0,
    loyaltyMembers: 0,
    avgRating: 0
  }

  const cards = [
    { label: "New Registrations", value: data.newCustomers, sub: "New accounts today", icon: UserPlus, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
    { label: "Repeat Customers", value: data.repeatCustomers, sub: "Loyal buyers (re-ordered)", icon: Heart, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
    { label: "Loyalty Members", value: data.loyaltyMembers, sub: "Members on PVP rewards club", icon: Award, color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20" },
    { label: "Average Retention", value: "76%", sub: "Higher than central avg (72%)", icon: Users, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" }
  ]

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-4 rounded-3xl animate-pulse h-[320px]" />
    )
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[320px]">
      <div className="shrink-0 mb-3">
        <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
          <Users size={14} className="text-[var(--primary)]" />
          Customer Activity
        </h3>
        <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Franchise customer base engagement indicators</p>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-3">
        {cards.map((card, idx) => {
          const Icon = card.icon
          return (
            <div key={idx} className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex flex-col justify-between hover:shadow-inner hover:border-zinc-200 dark:hover:border-zinc-800 transition-all duration-200">
              <div className="flex justify-between items-start">
                <div className={`p-2 rounded-xl shrink-0 ${card.color}`}>
                  <Icon size={14} />
                </div>
                <ArrowUpRight size={12} className="text-zinc-400 opacity-60" />
              </div>
              <div className="mt-2.5">
                <p className="text-lg font-black text-zinc-900 dark:text-white">{card.value}</p>
                <p className="text-[9px] font-bold text-zinc-800 dark:text-zinc-200 mt-1 leading-tight">{card.label}</p>
                <p className="text-[8px] text-zinc-400 font-medium truncate mt-0.5">{card.sub}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
