import React, { useState, useEffect } from "react"
import { X, ShoppingBag, CheckCircle, XCircle, Activity, Clock, RefreshCw } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from "recharts"
import { adminAPI } from "@food/api"

export default function OrdersAnalyticsModal({ isOpen, onClose, store }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isOpen || !store) return

    const fetchOrdersDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await adminAPI.getStoreSpecificOrders(store._id)
        setData(res?.data?.data || null)
      } catch (err) {
        setError("Failed to load orders analytics. Please retry.")
      } finally {
        setLoading(false)
      }
    }

    fetchOrdersDetails()
  }, [isOpen, store])

  if (!isOpen || !store) return null

  // Visual Palette
  const colors = ["#10b981", "#ef4444", "#ff7f50"]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl h-[80vh] flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl overflow-hidden transition-all scale-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Orders Analytics - {store.storeName.replace("Papa Veg Pizza - ", "")}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Track fulfillment status, cancel logs, and peak hour distributions</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/10">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
              <span className="text-xs font-medium">Analyzing fulfillment history...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-xl text-center text-red-650 text-sm font-semibold">
              {error}
            </div>
          ) : !data ? (
            <div className="text-center py-12 text-slate-400">
              No orders logs found for this store.
            </div>
          ) : (
            <>
              {/* KPIs Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Total Orders Today", val: data.totalOrders, desc: "Total transactions", icon: ShoppingBag, color: "text-primary bg-primary/5" },
                  { label: "Completed Orders", val: data.completedOrders, desc: "Successfully delivered", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Cancelled Orders", val: data.cancelledOrders, desc: "Failed / Rejected", icon: XCircle, color: "text-rose-650 bg-rose-50 dark:bg-rose-950/20" },
                  { label: "Completion Rate", val: `${data.completionRate}%`, desc: "Fulfillment score", icon: Activity, color: "text-blue-650 bg-blue-50 dark:bg-blue-950/20" }
                ].map((card, i) => (
                  <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[90px]">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                        {card.label}
                      </span>
                      <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                        {card.val}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-50 dark:border-slate-850 text-[10px] font-semibold text-slate-400">
                      <span>{card.desc}</span>
                      <div className={`p-1 rounded-md ${card.color}`}>
                        <card.icon className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 1. Daily Fulfillment Line Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider">Daily Orders Trends</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.dailyOrders} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                        <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} />
                        <Tooltip contentStyle={{ fontSize: 10 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="completed" name="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="cancelled" name="Cancelled" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Status Distribution Pie Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                  <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider">Status Distribution</h4>
                  <div className="h-48 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={data.statusDistribution}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {data.statusDistribution.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={colors[idx % colors.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `${value}%`} contentStyle={{ fontSize: 10 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Legend list */}
                  <div className="grid grid-cols-1 gap-1.5 pt-2 border-t border-slate-50 dark:border-slate-850 text-xs font-semibold text-slate-500">
                    {data.statusDistribution.map((entry, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                          <span className="truncate max-w-[140px]">{entry.name}</span>
                        </div>
                        <span className="font-bold text-slate-800 dark:text-slate-200">{entry.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Peak Hours Distribution Bar Chart */}
              <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider">Orders Peak Hours Density</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.peakHours} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                      <XAxis dataKey="hour" stroke="#64748b" fontSize={9} />
                      <YAxis stroke="#64748b" fontSize={9} />
                      <Tooltip contentStyle={{ fontSize: 10 }} />
                      <Bar dataKey="count" name="Orders Count" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end p-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-350 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  )
}
