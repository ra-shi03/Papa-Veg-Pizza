import React, { useState } from "react"
import { Bell, ShoppingBag, ShieldAlert, RotateCcw, Star, AlertTriangle, Store, RefreshCw, Circle } from "lucide-react"

export default function NotificationFeed({ notifications, onRefresh, loading }) {
  const [items, setItems] = useState(notifications || [])

  React.useEffect(() => {
    setItems(notifications || [])
  }, [notifications])

  const handleMarkRead = (id) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, unread: false } : item))
  }

  const getIcon = (type) => {
    switch (type) {
      case "low_stock":
        return <AlertTriangle size={13} className="text-orange-500" />
      case "complaint":
        return <ShieldAlert size={13} className="text-rose-500" />
      case "refund":
        return <RotateCcw size={13} className="text-rose-400" />
      case "review":
        return <Star size={13} className="text-amber-500 fill-amber-500" />
      case "offline":
        return <Store size={13} className="text-red-500 animate-pulse" />
      default:
        return <Bell size={13} className="text-[var(--primary)]" />
    }
  }

  const getBg = (type) => {
    switch (type) {
      case "offline":
        return "bg-red-500/[0.03]"
      case "complaint":
        return "bg-rose-500/[0.03]"
      default:
        return "bg-zinc-50/50 dark:bg-zinc-950/20"
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
            <Bell size={14} className="text-[var(--primary)]" />
            Operations Alerts Feed
          </h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Real-time alerts log for franchise stores</p>
        </div>

        <button onClick={onRefresh} className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-800 animate-pulse flex items-center gap-3">
              <div className="w-5 h-5 bg-zinc-200 dark:bg-zinc-800 rounded-lg shrink-0" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                <div className="h-2 w-3/4 bg-zinc-200 dark:bg-zinc-800 rounded" />
              </div>
            </div>
          ))
        ) : items.length > 0 ? (
          items.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkRead(item.id)}
              className={`p-2.5 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex items-start gap-2.5 hover:shadow-sm cursor-pointer transition-all duration-300 ${getBg(item.type)} ${
                item.unread ? "ring-1 ring-[var(--primary)]/20 bg-[var(--primary)]/[0.01]" : ""
              }`}
            >
              <div className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl shrink-0 mt-0.5 shadow-sm">
                {getIcon(item.type)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-900 dark:text-white truncate">{item.title}</span>
                  <span className="text-[8px] text-zinc-400 font-bold shrink-0">{item.time}</span>
                </div>
                <p className="text-[9px] text-zinc-500 font-medium leading-relaxed mt-1 break-words">
                  {item.detail}
                </p>
              </div>

              {item.unread && (
                <Circle size={6} className="fill-[var(--primary)] text-[var(--primary)] shrink-0 mt-1.5" />
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-zinc-400">
            <Bell size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5] mb-2" />
            No recent operational notifications
          </div>
        )}
      </div>
    </div>
  )
}
