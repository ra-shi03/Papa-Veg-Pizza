import React, { useState, useEffect } from "react"
import { X, Sliders, ArrowUpDown, Star, TrendingUp, ShoppingBag, Clock, AlertTriangle, ShieldAlert } from "lucide-react"
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from "recharts"
import { adminAPI } from "@food/api"

export default function CompareStoresModal({ isOpen, onClose, stores = [] }) {
  const [selectedStoreIds, setSelectedStoreIds] = useState([])
  const [comparisonData, setComparisonData] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Auto-select first two active stores if available
  useEffect(() => {
    if (isOpen && stores.length > 0) {
      const activeStores = stores.filter(s => s.status === "Active")
      const initial = activeStores.slice(0, 2).map(s => s._id)
      setSelectedStoreIds(initial)
    }
  }, [isOpen, stores])

  // Fetch comparison data when selected stores change
  useEffect(() => {
    if (!isOpen || selectedStoreIds.length === 0) {
      setComparisonData([])
      return
    }

    const fetchComparison = async () => {
      try {
        setLoading(true)
        setError(null)
        const res = await adminAPI.getStorePerformanceCompare({
          storeIds: selectedStoreIds.join(",")
        })
        setComparisonData(res?.data?.data || [])
      } catch (err) {
        setError("Failed to generate store comparison. Please retry.")
      } finally {
        setLoading(false)
      }
    }

    fetchComparison()
  }, [selectedStoreIds, isOpen])

  if (!isOpen) return null

  const handleToggleStore = (storeId) => {
    setSelectedStoreIds(prev => {
      if (prev.includes(storeId)) {
        // Keep at least one store selected
        if (prev.length <= 1) return prev
        return prev.filter(id => id !== storeId)
      }
      return [...prev, storeId]
    })
  }

  // Formatting for Indian currency
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  // Predefined chart color palettes
  const chartColors = ["#a43c12", "#ff7f50", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"]

  // Build Radar Chart Data (Normalized to 100 max scale for visual rendering)
  // Metrics: Revenue (scale 100k), Orders (scale 1000), Rating (scale 5), Prep Time (lower is better, scale 30), Delivery Time (lower is better, scale 60)
  const maxVals = { revenue: 100000, orders: 500, rating: 5, prepTime: 30, deliveryTime: 60 }
  const radarMetrics = [
    { subject: "Revenue", key: "revenue" },
    { subject: "Orders", key: "totalOrders" },
    { subject: "Rating", key: "customerRating" },
    { subject: "Prep Efficiency", key: "avgPreparationTime", invert: true },
    { subject: "Delivery Speed", key: "avgDeliveryTime", invert: true }
  ]

  const radarData = radarMetrics.map(metric => {
    const item = { subject: metric.subject }
    comparisonData.forEach(store => {
      let rawVal = store[metric.key] || 0
      let normalized = 0
      if (metric.key === "revenue") {
        normalized = (rawVal / maxVals.revenue) * 100
      } else if (metric.key === "totalOrders") {
        normalized = (rawVal / maxVals.orders) * 100
      } else if (metric.key === "customerRating") {
        normalized = (rawVal / maxVals.rating) * 100
      } else if (metric.key === "avgPreparationTime") {
        // Invert: 0 is worst (30min), 100 is best (0min)
        normalized = Math.max(0, ((maxVals.prepTime - rawVal) / maxVals.prepTime) * 100)
      } else if (metric.key === "avgDeliveryTime") {
        // Invert: 0 is worst (60min), 100 is best (0min)
        normalized = Math.max(0, ((maxVals.deliveryTime - rawVal) / maxVals.deliveryTime) * 100)
      }
      item[store.storeName.replace("Papa Veg Pizza - ", "")] = Math.min(100, Math.round(normalized))
    })
    return item
  })
  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full lg:max-w-[calc(100vw-320px)] xl:max-w-5xl h-[85vh] flex flex-col bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl overflow-hidden transition-all scale-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Store Comparison Dashboard</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Select and compare operations across multiple outlets side-by-side</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inner Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/10">
          
          {/* Store Selection Chips */}
          <div className="space-y-2">
            <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Stores to Compare</span>
            <div className="flex flex-wrap gap-2">
              {stores.map(store => {
                const isSelected = selectedStoreIds.includes(store._id)
                return (
                  <button
                    key={store._id}
                    onClick={() => handleToggleStore(store._id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-primary border-primary text-white shadow-md shadow-primary/10"
                        : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                    }`}
                  >
                    {store.storeName.replace("Papa Veg Pizza - ", "")}
                  </button>
                )
              })}
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-3" />
              <span className="text-xs font-medium">Generating comparison analysis...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-xl text-center text-red-650 text-sm font-semibold">
              {error}
            </div>
          ) : comparisonData.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No store comparison data found.
            </div>
          ) : (
            <>
              {/* Metrics Grid Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {comparisonData.map((store, i) => (
                  <div
                    key={store._id}
                    className="p-5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-xs space-y-4 relative overflow-hidden"
                  >
                    {/* Colored indicator bar */}
                    <div
                      className="absolute left-0 top-0 bottom-0 w-1.5"
                      style={{ backgroundColor: chartColors[i % chartColors.length] }}
                    />
                    
                    <div>
                      <h4 className="font-extrabold text-sm text-slate-900 dark:text-white truncate pl-1">
                        {store.storeName.replace("Papa Veg Pizza - ", "")}
                      </h4>
                      <p className="text-[10px] text-slate-455 font-bold uppercase tracking-wider pl-1 mt-0.5">
                        Code: {store.storeId} | {store.city}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-x-2 gap-y-3 pt-2 border-t border-slate-50 dark:border-slate-850">
                      {[
                        { label: "Revenue", val: formatINR(store.revenue), icon: TrendingUp },
                        { label: "Orders Count", val: store.totalOrders, icon: ShoppingBag },
                        { label: "Prep / Delivery", val: `${store.avgPreparationTime}m / ${store.avgDeliveryTime}m`, icon: Clock },
                        { label: "Rating / Waste", val: `${store.customerRating}★ / ${store.inventoryWaste}%`, icon: Star }
                      ].map((item, idx) => (
                        <div key={idx} className="space-y-0.5">
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                            <item.icon className="w-3 h-3" />
                            {item.label}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {item.val}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Performance Score Circular indicator */}
                    <div className="flex items-center justify-between bg-slate-50/50 dark:bg-slate-950/20 p-2.5 rounded-xl border border-slate-100 dark:border-slate-850">
                      <span className="text-xs font-semibold text-slate-500">Overall Score:</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        store.performanceScore >= 90
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                          : store.performanceScore >= 75
                            ? "bg-blue-50 dark:bg-blue-950/20 text-blue-650"
                            : "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                      }`}>
                        {store.performanceScore} / 100
                      </span>
                    </div>

                  </div>
                ))}
              </div>

              {/* Visual Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* 1. Metric Comparison Grouped Bar Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase tracking-wider mb-4">Revenue & Orders Comparison</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={comparisonData.map(s => ({
                        name: s.storeName.replace("Papa Veg Pizza - ", ""),
                        Revenue: s.revenue,
                        Orders: s.totalOrders
                      }))} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                        <YAxis stroke="#64748b" fontSize={9} />
                        <Tooltip contentStyle={{ fontSize: 10 }} />
                        <Legend wrapperStyle={{ fontSize: 10 }} />
                        <Bar dataKey="Revenue" fill="var(--primary)" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Orders" fill="var(--secondary)" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Performance Coordinate Radar Chart */}
                <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-350 uppercase tracking-wider mb-4">Multi-Dimension Efficiency Comparison</h4>
                  <div className="h-64">
                    {comparisonData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                          <PolarGrid stroke="#e2e8f0" />
                          <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={9} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#64748b" fontSize={8} />
                          {comparisonData.map((store, i) => {
                            const name = store.storeName.replace("Papa Veg Pizza - ", "")
                            return (
                              <Radar
                                key={store._id}
                                name={name}
                                dataKey={name}
                                stroke={chartColors[i % chartColors.length]}
                                fill={chartColors[i % chartColors.length]}
                                fillOpacity={0.15}
                              />
                            )
                          })}
                          <Legend wrapperStyle={{ fontSize: 10 }} />
                          <Tooltip contentStyle={{ fontSize: 10 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-slate-400 text-xs">No stores to compare</div>
                    )}
                  </div>
                </div>

              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-655 dark:text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Close Dashboard
          </button>
        </div>

      </div>
    </div>
  )
}
