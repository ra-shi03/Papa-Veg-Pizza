import React, { useState, useEffect } from "react"
import { Building2, X, RefreshCw, Star, TrendingUp, ShoppingBag, Users, Clock, ArrowUpRight, DollarSign, Layers, Pizza, UserCheck, CheckCircle } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell, PieChart, Pie, Legend } from "recharts"
import { adminAPI } from "@food/api"

export default function StorePerformanceDrawer({ isOpen, onClose, store, defaultTab = "revenue" }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [tabData, setTabData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reset tab to default when drawer opens or store changes
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
      setTabData(null)
    }
  }, [isOpen, defaultTab, store])

  // Fetch tab-specific data when activeTab changes
  useEffect(() => {
    if (!store || !isOpen) return

    const fetchTabData = async () => {
      try {
        setLoading(true)
        setError(null)
        setTabData(null)
        let res

        if (activeTab === "revenue") {
          res = await adminAPI.getStoreSpecificRevenue(store.storeId)
        } else if (activeTab === "orders") {
          res = await adminAPI.getStoreSpecificOrders(store.storeId)
        } else if (activeTab === "ratings") {
          res = await adminAPI.getStoreSpecificRatings(store.storeId)
        } else if (activeTab === "inventory") {
          res = await adminAPI.getStoreSpecificInventory(store.storeId)
        } else if (activeTab === "products") {
          res = await adminAPI.getStoreSpecificProducts(store.storeId)
        } else if (activeTab === "staff") {
          res = await adminAPI.getStoreSpecificStaff(store.storeId)
        }

        setTabData(res?.data?.data || null)
      } catch (err) {
        setError("Failed to fetch detailed metrics. Please retry.")
      } finally {
        setLoading(false)
      }
    }

    fetchTabData()
  }, [activeTab, store, isOpen])

  if (!isOpen || !store) return null

  // Indian Rupee formatting
  const formatINR = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val)
  }

  // Predefined chart palettes
  const colorPalette = ["#a43c12", "#ff7f50", "#22c55e", "#3b82f6", "#a855f7", "#ec4899"]

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Backdrop Click */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Slideout Panel */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-primary">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{store.storeName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  store.performanceScore >= 90
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                    : store.performanceScore >= 75
                      ? "bg-blue-50 dark:bg-blue-950/20 text-blue-650"
                      : "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                }`}>
                  Score: {store.performanceScore}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Code: {store.storeId} | {store.city} | {store.storeType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Tabs */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-100 dark:border-slate-850 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/20 scrollbar-hide">
          {[
            { id: "revenue", label: "Revenue", icon: DollarSign },
            { id: "orders", label: "Orders", icon: TrendingUp },
            { id: "ratings", label: "Ratings", icon: Star },
            { id: "inventory", label: "Inventory", icon: Layers },
            { id: "products", label: "Top Products", icon: Pizza },
            { id: "staff", label: "Staff Performance", icon: Users }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setTabData(null); }}
                className={`flex items-center gap-1.5 px-4 py-3.5 text-xs font-bold border-b-2 transition-all shrink-0 cursor-pointer ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/10">
          
          {loading && (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
              <span className="text-xs font-semibold">Fetching detailed metrics...</span>
            </div>
          )}

          {error && !loading && (
            <div className="p-5 text-center bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-900/30 rounded-xl text-red-650 font-semibold text-sm">
              {error}
            </div>
          )}

          {!loading && !error && tabData && (
            <div className="space-y-6">
              
              {/* TAB 1: REVENUE */}
              {activeTab === "revenue" && tabData.paymentMethods && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Today's Revenue", val: formatINR(tabData.todayRevenue), icon: DollarSign, color: "text-primary bg-primary/5" },
                      { label: "Weekly Revenue", val: formatINR(tabData.weeklyRevenue), icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
                      { label: "Monthly Revenue", val: formatINR(tabData.monthlyRevenue), icon: Clock, color: "text-blue-650 bg-blue-50 dark:bg-blue-950/20" },
                      { label: "Avg Order Value", val: formatINR(tabData.avgOrderValue), icon: Star, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" }
                    ].map((card, i) => (
                      <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-xs flex flex-col justify-between min-h-[90px]">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white mt-1">{card.val}</span>
                        <div className="flex justify-end mt-2">
                          <div className={`p-1 rounded-md ${card.color}`}>
                            <card.icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider mb-4">Revenue Trend (₹)</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={tabData.trend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorDrawerRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip formatter={(v) => formatINR(v)} contentStyle={{ fontSize: 10 }} />
                            <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorDrawerRev)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider mb-4">Payment Methods Share</h4>
                      <div className="h-44 relative flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie data={tabData.paymentMethods || []} cx="50%" cy="50%" innerRadius={40} outerRadius={60} paddingAngle={2} dataKey="value">
                              {tabData.paymentMethods?.map((e, idx) => (
                                <Cell key={`cell-${idx}`} fill={colorPalette[idx % colorPalette.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ fontSize: 10 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-3 gap-1 pt-3 border-t border-slate-50 dark:border-slate-855 text-[10px] font-semibold text-slate-400">
                        {tabData.paymentMethods?.map((e, idx) => (
                          <div key={idx} className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: colorPalette[idx % colorPalette.length] }} />
                            <span className="truncate">{e.name}: {e.value}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 2: ORDERS */}
              {activeTab === "orders" && tabData.dailyOrders && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Total Orders", val: tabData.totalOrders, icon: ShoppingBag, color: "text-primary bg-primary/5" },
                      { label: "Completed Orders", val: tabData.completedOrders, icon: UserCheck, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
                      { label: "Cancelled Orders", val: tabData.cancelledOrders, icon: X, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20" },
                      { label: "Completion Rate", val: `${tabData.completionRate}%`, icon: Clock, color: "text-blue-650 bg-blue-50 dark:bg-blue-950/20" }
                    ].map((card, i) => (
                      <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-xs flex flex-col justify-between min-h-[90px]">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white mt-1">{card.val}</span>
                        <div className="flex justify-end mt-2">
                          <div className={`p-1 rounded-md ${card.color}`}>
                            <card.icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider mb-4">Daily Orders Fulfillment</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tabData.dailyOrders} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ fontSize: 10 }} />
                            <Bar dataKey="completed" fill="#10b981" radius={[3, 3, 0, 0]} />
                            <Bar dataKey="cancelled" fill="#ef4444" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider mb-4">Peak Orders Hours</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tabData.peakHours} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <XAxis dataKey="hour" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ fontSize: 10 }} />
                            <Bar dataKey="count" fill="var(--primary)" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 3: CUSTOMER RATINGS */}
              {activeTab === "ratings" && tabData.recentReviews && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Average Rating", val: `${tabData.avgRating} ★`, icon: Star, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" },
                      { label: "Total Reviews", val: tabData.totalReviews, icon: ShoppingBag, color: "text-slate-655 bg-slate-50 dark:bg-slate-900" },
                      { label: "Positive Reviews", val: tabData.positiveReviews, icon: UserCheck, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
                      { label: "Negative Reviews", val: tabData.negativeReviews, icon: X, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20" }
                    ].map((card, i) => (
                      <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-xs flex flex-col justify-between min-h-[90px]">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white mt-1">{card.val}</span>
                        <div className="flex justify-end mt-2">
                          <div className={`p-1 rounded-md ${card.color}`}>
                            <card.icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-3">
                      <h4 className="text-xs font-bold text-slate-855 dark:text-slate-355 uppercase tracking-wider">Recent Reviews Log</h4>
                      <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-55 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                              <th className="px-3 py-2.5">Customer</th>
                              <th className="px-3 py-2.5">Rating</th>
                              <th className="px-3 py-2.5">Comment</th>
                              <th className="px-3 py-2.5 text-right">Date</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] text-slate-655 dark:text-slate-300">
                            {tabData.recentReviews?.map((rev, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                <td className="px-3 py-2.5 font-bold">{rev.customer}</td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center gap-0.5 text-yellow-500 font-bold">
                                    <span>{rev.rating}</span>
                                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 max-w-[200px] truncate italic">"{rev.comment}"</td>
                                <td className="px-3 py-2.5 text-right text-slate-400">{rev.date}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider">Rating Distribution</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={tabData.distribution} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                            <XAxis type="number" stroke="#64748b" fontSize={8} />
                            <YAxis dataKey="rating" type="category" stroke="#64748b" fontSize={8} />
                            <Tooltip contentStyle={{ fontSize: 9 }} />
                            <Bar dataKey="count" fill="#eab308" radius={[0, 3, 3, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 4: INVENTORY */}
              {activeTab === "inventory" && tabData.consumption && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: "Waste %", val: `${tabData.wastePercent}%`, icon: Layers, color: "text-rose-650 bg-rose-50 dark:bg-rose-950/20" },
                      { label: "Out of Stock Items", val: tabData.outOfStockItems, icon: ShoppingBag, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
                      { label: "Stock Turnover Ratio", val: tabData.stockTurnover, icon: TrendingUp, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
                      { label: "Low Stock Alerts", val: tabData.lowStockAlerts, icon: Clock, color: "text-purple-650 bg-purple-50" }
                    ].map((card, i) => (
                      <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-xs flex flex-col justify-between min-h-[90px]">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white mt-1">{card.val}</span>
                        <div className="flex justify-end mt-2">
                          <div className={`p-1 rounded-md ${card.color}`}>
                            <card.icon className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider mb-4">Daily Ingredient Waste Trend</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={tabData.wasteTrend || []} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorWaste" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="time" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ fontSize: 10 }} />
                            <Area type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorWaste)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-3">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider">Critical Inventory Items</h4>
                      <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-55 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                              <th className="px-3 py-2.5">Ingredient</th>
                              <th className="px-3 py-2.5">Consumed today</th>
                              <th className="px-3 py-2.5 text-right">Action Needed</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] text-slate-655 dark:text-slate-300">
                            {tabData.consumption?.map((item, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                <td className="px-3 py-2.5 font-bold">{item.ingredient}</td>
                                <td className="px-3 py-2.5">{item.consumed}%</td>
                                <td className="px-3 py-2.5 text-right">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                    item.reorder
                                      ? "bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-455"
                                      : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-455"
                                  }`}>
                                    {item.reorder ? "Reorder Alert" : "Healthy"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* TAB 5: TOP PRODUCTS */}
              {activeTab === "products" && tabData.list && (
                <>
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Top Products Table */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-4">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-355 uppercase tracking-wider">Popular Items Selling Rank</h4>
                      <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-55 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                              <th className="px-3 py-2.5">Product Name</th>
                              <th className="px-3 py-2.5">Quantity Sold</th>
                              <th className="px-3 py-2.5">Revenue</th>
                              <th className="px-3 py-2.5">Rating</th>
                              <th className="px-3 py-2.5 text-right">Popularity Score</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] text-slate-655 dark:text-slate-300">
                            {tabData.list?.map((prod, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                <td className="px-3 py-2.5 font-bold text-primary">{prod.product}</td>
                                <td className="px-3 py-2.5 font-semibold">{prod.sold.toLocaleString("en-IN")} units</td>
                                <td className="px-3 py-2.5 font-bold text-slate-900 dark:text-white">{formatINR(prod.revenue)}</td>
                                <td className="px-3 py-2.5 font-medium text-yellow-600">{prod.rating} ★</td>
                                <td className="px-3 py-2.5 text-right">
                                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-blue-50 dark:bg-blue-950/20 text-blue-650">
                                    {prod.popularity}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Products chart */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider">Sales Distribution (Units)</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart layout="vertical" data={tabData.chart} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                            <XAxis type="number" stroke="#64748b" fontSize={8} />
                            <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={8} />
                            <Tooltip contentStyle={{ fontSize: 9 }} />
                            <Bar dataKey="sold" fill="var(--primary)" radius={[0, 3, 3, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                  </div>
                </>
              )}

              {/* TAB 6: STAFF PERFORMANCE */}
              {activeTab === "staff" && tabData.performance && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { label: "Orders Processed", val: tabData.ordersProcessed, icon: CheckCircle, color: "text-emerald-650 bg-emerald-50 dark:bg-emerald-950/20" },
                      { label: "Average Preparation Speed", val: `${tabData.avgPrepTime} min`, icon: Clock, color: "text-primary bg-primary/5" },
                      { label: "Staff Efficiency Score", val: `${tabData.efficiencyScore}%`, icon: UserCheck, color: "text-blue-650 bg-blue-50" }
                    ].map((card, i) => (
                      <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-2xl shadow-xs flex flex-col justify-between min-h-[90px]">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</span>
                        <span className="text-lg font-black text-slate-900 dark:text-white mt-1">{card.val}</span>
                        <div className="flex justify-end mt-2">
                          <div className={`p-1 rounded-md ${card.color}`}>
                            {i === 0 ? <Clock className="w-3.5 h-3.5" /> : <card.icon className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs lg:col-span-2 space-y-3">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider">Staff Roster Efficiency Metrics</h4>
                      <div className="border border-slate-150 dark:border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-55 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 text-[9px] font-bold text-slate-450 uppercase tracking-wider">
                              <th className="px-3 py-2.5">Staff Name</th>
                              <th className="px-3 py-2.5">Completed Tasks</th>
                              <th className="px-3 py-2.5 text-right">Customer Rating</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-[11px] text-slate-655 dark:text-slate-300">
                            {tabData.performance?.map((staff, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20">
                                <td className="px-3 py-2.5 font-bold">{staff.name}</td>
                                <td className="px-3 py-2.5 font-semibold text-slate-500">{staff.orders} orders</td>
                                <td className="px-3 py-2.5 text-right font-black text-yellow-600">{staff.rating} ★</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
                      <h4 className="text-xs font-bold text-slate-850 dark:text-slate-350 uppercase tracking-wider">Kitchen Productivity Speed</h4>
                      <div className="h-56">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={tabData.productivity} margin={{ top: 5, right: 5, left: -30, bottom: 5 }}>
                            <XAxis dataKey="hour" stroke="#64748b" fontSize={9} />
                            <YAxis stroke="#64748b" fontSize={9} />
                            <Tooltip contentStyle={{ fontSize: 10 }} />
                            <Bar dataKey="speed" name="Productivity %" fill="var(--secondary)" radius={[3, 3, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  )
}
