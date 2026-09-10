import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Flame, Clock, AlertTriangle, AlertOctagon, X, Search, ChevronRight } from "lucide-react"
import apiClient from "@/services/api/axios"

// Mock kitchen data
const MOCK_KITCHEN_PERF = {
  avgPrepTime: 13,
  delayedOrders: 3,
  pizzaStation: 80, // percentage busy
  bakingStation: 50,
  packagingStation: 20
}

// Mock delayed orders
const MOCK_DELAYED_ORDERS = [
  { orderNumber: "PV-8839", expectedTime: "12m", actualTime: "18m", delayMinutes: 6 },
  { orderNumber: "PV-8835", expectedTime: "15m", actualTime: "22m", delayMinutes: 7 },
  { orderNumber: "PV-8830", expectedTime: "10m", actualTime: "14m", delayMinutes: 4 }
]

export default function KitchenPerformance({ storeId, refreshKey }) {
  const [showDelayModal, setShowDelayModal] = useState(false)

  // Fetch kitchen data via React Query
  const { data: kitchenData, isLoading } = useQuery({
    queryKey: ["kitchen-performance", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/kitchen-performance", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_KITCHEN_PERF
      }
    }
  })

  const avgPrep = kitchenData?.avgPrepTime ?? 0
  const delayedCount = kitchenData?.delayedOrders ?? 0
  const pizzaBusy = kitchenData?.pizzaStation ?? 0
  const bakingBusy = kitchenData?.bakingStation ?? 0
  const packagingBusy = kitchenData?.packagingStation ?? 0

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[300px]">
      
      {/* Header */}
      <div>
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
          <Flame size={16} className="text-[var(--primary)]" />
          Kitchen Performance
        </h3>
      </div>

      {/* Grid of metrics */}
      <div className="grid grid-cols-2 gap-4 mt-2">
        {/* Metric 1: Avg Prep Time */}
        <div className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-950/20 text-blue-500 flex items-center justify-center shrink-0">
            <Clock size={15} />
          </div>
          <div>
            <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Avg Prep Time</span>
            <span className="text-base font-black text-slate-900 dark:text-white mt-0.5 block">{avgPrep} mins</span>
          </div>
        </div>

        {/* Metric 2: Delayed Orders */}
        <button
          onClick={() => setShowDelayModal(true)}
          className="bg-slate-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-100 dark:border-zinc-850 flex items-center gap-2.5 text-left cursor-pointer hover:border-rose-500/20 hover:bg-rose-50/10 transition-all w-full"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center shrink-0">
            <AlertTriangle size={15} className={delayedCount > 0 ? "animate-pulse" : ""} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-widest block">Delayed Orders</span>
            <span className="text-base font-black text-rose-500 mt-0.5 flex items-center justify-between w-full">
              <span>{delayedCount} orders</span>
              <ChevronRight size={12} className="opacity-40" />
            </span>
          </div>
        </button>
      </div>

      {/* Progress Bars for Station Loads */}
      <div className="space-y-2.5 mt-3">
        <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Active Station Capacities</span>
        
        {/* Pizza Station */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-black text-slate-650 dark:text-zinc-400">
            <span>Pizza Station</span>
            <span className={pizzaBusy > 75 ? "text-rose-500" : "text-slate-500"}>{pizzaBusy}% Busy</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              style={{ width: `${pizzaBusy}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                pizzaBusy > 75 ? "bg-rose-500" : "bg-[var(--primary)]"
              }`}
            />
          </div>
        </div>

        {/* Baking Station */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-black text-slate-650 dark:text-zinc-400">
            <span>Baking Station</span>
            <span className={bakingBusy > 75 ? "text-rose-500" : "text-slate-500"}>{bakingBusy}% Busy</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              style={{ width: `${bakingBusy}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                bakingBusy > 75 ? "bg-rose-500" : "bg-[var(--primary)]"
              }`}
            />
          </div>
        </div>

        {/* Packaging Station */}
        <div className="space-y-1">
          <div className="flex justify-between text-[9px] font-black text-slate-650 dark:text-zinc-400">
            <span>Packaging Station</span>
            <span className={packagingBusy > 75 ? "text-rose-500" : "text-slate-500"}>{packagingBusy}% Busy</span>
          </div>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
            <div 
              style={{ width: `${packagingBusy}%` }}
              className={`h-full rounded-full transition-all duration-500 ${
                packagingBusy > 75 ? "bg-rose-500" : "bg-[var(--primary)]"
              }`}
            />
          </div>
        </div>
      </div>

      {/* DELAYED ORDERS MODAL */}
      {showDelayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertOctagon size={16} className="text-rose-500" />
                  Delayed Orders List
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">Orders exceeding prep targets</p>
              </div>
              <button 
                onClick={() => setShowDelayModal(false)}
                className="p-1 rounded-md text-zinc-405 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    <th className="py-2">Order Number</th>
                    <th className="py-2">Target</th>
                    <th className="py-2">Actual Cook</th>
                    <th className="py-2 text-right">Delay</th>
                  </tr>
                </thead>
                <tbody className="font-bold divide-y divide-zinc-50 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
                  {MOCK_DELAYED_ORDERS.map((ord) => (
                    <tr key={ord.orderNumber} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/50">
                      <td className="py-2.5 text-zinc-900 dark:text-white">{ord.orderNumber}</td>
                      <td className="py-2.5 text-slate-500">{ord.expectedTime}</td>
                      <td className="py-2.5 text-slate-700 dark:text-zinc-355">{ord.actualTime}</td>
                      <td className="py-2.5 text-right text-rose-500 font-black">+{ord.delayMinutes} mins</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setShowDelayModal(false)}
              className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-750 dark:text-zinc-250 font-bold text-xs rounded-2xl cursor-pointer transition-colors shadow-sm text-center"
            >
              Dismiss Window
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
