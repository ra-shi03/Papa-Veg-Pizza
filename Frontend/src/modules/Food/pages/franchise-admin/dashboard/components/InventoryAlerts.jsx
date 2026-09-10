import React, { useState } from "react"
import { AlertCircle, AlertTriangle, ShieldCheck, Mail, ShoppingCart, RefreshCw } from "lucide-react"
import { toast } from "sonner"

export default function InventoryAlerts({ alerts, onRefresh, loading }) {
  const [items, setItems] = useState(alerts || [])
  const [actionLoading, setActionLoading] = useState(null)

  React.useEffect(() => {
    setItems(alerts || [])
  }, [alerts])

  const handlePurchaseRequest = async (idx, item) => {
    setActionLoading(`pr-${idx}`)
    setTimeout(() => {
      toast.success(`Purchase Request created for ${item.ingredient} (${item.store})`)
      setActionLoading(null)
    }, 1500)
  }

  const handleNotifyManager = async (idx, item) => {
    setActionLoading(`notify-${idx}`)
    setTimeout(() => {
      toast.success(`Notification broadcasted to ${item.store} manager.`)
      setActionLoading(null)
    }, 1000)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
            <AlertTriangle size={14} className="text-orange-500 animate-pulse" />
            Inventory Alerts
          </h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Ingredients currently below reorder levels</p>
        </div>

        <button onClick={onRefresh} className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800 text-left">
          <thead>
            <tr className="text-[8px] font-extrabold uppercase text-zinc-400 tracking-wider">
              <th className="py-2 px-2.5">Ingredient</th>
              <th className="py-2 px-2.5">Outlet</th>
              <th className="py-2 px-2.5 text-center">Stock</th>
              <th className="py-2 px-2.5 text-center">Limit</th>
              <th className="py-2 px-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-2.5"><div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5 text-center"><div className="h-3 w-8 bg-zinc-100 dark:bg-zinc-800 rounded mx-auto" /></td>
                  <td className="py-3 px-2.5 text-center"><div className="h-3 w-8 bg-zinc-100 dark:bg-zinc-800 rounded mx-auto" /></td>
                  <td className="py-3 px-2.5 text-right"><div className="h-5 w-20 bg-zinc-100 dark:bg-zinc-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : items.length > 0 ? (
              items.map((item, idx) => {
                const isCritical = item.currentStock <= item.reorderLevel * 0.3
                return (
                  <tr key={idx} className={`transition-colors ${
                    isCritical ? "bg-rose-500/[0.03] hover:bg-rose-500/[0.05]" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10"
                  }`}>
                    <td className="py-2.5 px-2.5">
                      <div className="flex items-center gap-1.5">
                        {isCritical ? (
                          <AlertCircle size={12} className="text-rose-500 shrink-0" />
                        ) : (
                          <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                        )}
                        <span className={isCritical ? "font-bold text-zinc-900 dark:text-white" : ""}>
                          {item.ingredient}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-2.5 truncate max-w-[100px]">{item.store.replace("Papa Veg Pizza - ", "")}</td>
                    <td className={`py-2.5 px-2.5 text-center font-bold ${isCritical ? "text-rose-500 font-extrabold" : "text-zinc-900 dark:text-white"}`}>
                      {item.currentStock} {item.unit}
                    </td>
                    <td className="py-2.5 px-2.5 text-center text-zinc-400 font-medium">{item.reorderLevel} {item.unit}</td>
                    <td className="py-2.5 px-2.5 text-right">
                      <div className="flex gap-1 justify-end">
                        <button
                          disabled={actionLoading === `pr-${idx}`}
                          onClick={() => handlePurchaseRequest(idx, item)}
                          className="p-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:text-[var(--primary)] rounded-lg transition-all cursor-pointer"
                          title="Create Purchase Request"
                        >
                          {actionLoading === `pr-${idx}` ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            <ShoppingCart size={11} />
                          )}
                        </button>
                        <button
                          disabled={actionLoading === `notify-${idx}`}
                          onClick={() => handleNotifyManager(idx, item)}
                          className="p-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:text-blue-500 rounded-lg transition-all cursor-pointer"
                          title="Notify Store Manager"
                        >
                          {actionLoading === `notify-${idx}` ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            <Mail size={11} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-12 text-zinc-400">
                  <ShieldCheck size={32} className="mx-auto text-emerald-500 opacity-60 mb-2" />
                  All franchise store stocks are healthy
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
