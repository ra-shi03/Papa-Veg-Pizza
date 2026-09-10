import React, { useState, useEffect } from "react"
import { Building2, X, RefreshCw, Star, TrendingUp, ShoppingBag, Users, Clock, MessageSquare, ArrowUpRight, DollarSign } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, Cell } from "recharts"
import { adminAPI } from "@food/api"

export default function StoreDetailsDrawer({ isOpen, onClose, store, defaultTab = "overview" }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [tabData, setTabData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Reset tab to defaultTab when drawer opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  // Fetch tab-specific data when activeTab changes
  useEffect(() => {
    if (!store || !isOpen) return

    if (activeTab === "overview") {
      setTabData(null)
      return
    }

    const fetchTabData = async () => {
      try {
        setLoading(true)
        setError(null)
        let response
        if (activeTab === "orders") {
          response = await adminAPI.getStoreOrders(store._id)
        } else if (activeTab === "inventory") {
          response = await adminAPI.getStoreInventory(store._id)
        } else if (activeTab === "staff") {
          response = await adminAPI.getStoreStaff(store._id)
        } else if (activeTab === "performance") {
          response = await adminAPI.getStorePerformance(store._id)
        } else if (activeTab === "hours") {
          response = await adminAPI.getStoreHours(store._id)
        } else if (activeTab === "reviews") {
          response = await adminAPI.getStoreReviews(store._id)
        }

        setTabData(response?.data?.data || null)
      } catch (err) {
        setError("Failed to fetch records. Please try again.")
      } finally {
        setLoading(false)
      }
    }

    fetchTabData()
  }, [activeTab, store, isOpen])

  if (!isOpen || !store) return null

  // Status Classes helper
  const getStatusBadge = (status) => {
    if (status === "Active") return "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
    if (status === "Inactive") return "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
    return "bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400"
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Backdrop Click */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Slideout Panel */}
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-primary">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">{store.storeName}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(store.status)}`}>
                  {store.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Code: {store.storeCode} | Type: {store.storeType}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Tab Selectors */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-100 dark:border-slate-850 overflow-x-auto bg-slate-50/50 dark:bg-slate-950/20">
          {[
            { id: "overview", label: "Overview", icon: Building2 },
            { id: "orders", label: "Orders", icon: TrendingUp },
            { id: "inventory", label: "Inventory", icon: ShoppingBag },
            { id: "staff", label: "Staff", icon: Users },
            { id: "performance", label: "Performance", icon: ArrowUpRight },
            { id: "hours", label: "Hours", icon: Clock },
            { id: "reviews", label: "Reviews", icon: MessageSquare }
          ].map((t) => {
            const Icon = t.icon
            const isActive = activeTab === t.id
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-3 text-xs font-semibold border-b-2 transition-all shrink-0 ${
                  isActive
                    ? "border-primary text-primary"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-350"
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30 dark:bg-slate-950/10">
          
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-primary mb-3" />
              <span className="text-sm font-medium">Loading tab details...</span>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center h-48 text-center bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/20 rounded-2xl p-5">
              <span className="text-sm font-semibold text-red-650 dark:text-red-400">{error}</span>
            </div>
          )}

          {!loading && !error && (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === "overview" && (
                <div className="space-y-6">
                  {/* Grid Informational Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: "Store Name", value: store.storeName },
                      { label: "Store Code", value: store.storeCode },
                      { label: "Type", value: store.storeType },
                      { label: "Phone", value: store.phone || "N/A" },
                      { label: "Email", value: store.email || "N/A" },
                      { label: "Opening Date", value: store.openingDate || "N/A" },
                      { label: "Current Capacity", value: `${store.currentCapacity || 0}%` },
                      { label: "Total Orders", value: store.totalOrders?.toLocaleString("en-IN") || "0" }
                    ].map((card, i) => (
                      <div key={i} className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
                        <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">
                          {card.label}
                        </span>
                        <span className="text-sm font-semibold text-slate-850 dark:text-slate-200">
                          {card.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Address Section */}
                  <div className="p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl shadow-xs">
                    <span className="block text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                      Store Address
                    </span>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {store.address?.line1}, {store.address?.city}, {store.address?.state} - {store.address?.pincode}
                    </p>
                    <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span>Latitude: {store.address?.coordinates?.[1] || "N/A"}</span>
                      <span>Longitude: {store.address?.coordinates?.[0] || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: RECENT ORDERS */}
              {activeTab === "orders" && tabData && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        <th className="px-4 py-3">Order ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Amount</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Created Time</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      {Array.isArray(tabData) && tabData.map((ord) => (
                        <tr key={ord.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                          <td className="px-4 py-3 font-semibold text-primary">{ord.id}</td>
                          <td className="px-4 py-3 font-medium">{ord.customer}</td>
                          <td className="px-4 py-3 font-bold text-slate-900 dark:text-white">₹{ord.amount}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              ord.status === "delivered"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                                : ord.status === "preparing"
                                  ? "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                                  : "bg-red-50 dark:bg-red-950/20 text-red-650"
                            }`}>
                              {ord.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right text-slate-400">
                            {new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: INVENTORY */}
              {activeTab === "inventory" && tabData && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">Quantity</th>
                        <th className="px-4 py-3">Threshold</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      {Array.isArray(tabData) && tabData.map((inv, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                          <td className="px-4 py-3 font-semibold text-slate-850 dark:text-slate-200">{inv.item}</td>
                          <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">{inv.quantity}</td>
                          <td className="px-4 py-3 text-slate-500">{inv.threshold}</td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              inv.status === "Low Stock"
                                ? "bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400"
                                : "bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400"
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: STAFF */}
              {activeTab === "staff" && tabData && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        <th className="px-4 py-3">Name</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      {Array.isArray(tabData) && tabData.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                          <td className="px-4 py-3 font-semibold text-slate-850 dark:text-slate-200">{emp.name}</td>
                          <td className="px-4 py-3 font-medium text-slate-655 dark:text-slate-455">{emp.role}</td>
                          <td className="px-4 py-3 text-slate-500">{emp.phone}</td>
                          <td className="px-4 py-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650">
                              {emp.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 5: PERFORMANCE */}
              {activeTab === "performance" && tabData && (
                <div className="space-y-6">
                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { label: "Orders Today", value: tabData.ordersToday, color: "text-primary" },
                      { label: "Weekly Orders", value: tabData.weeklyOrders, color: "text-blue-650" },
                      { label: "Average Rating", value: `${tabData.averageRating} ★`, color: "text-yellow-600" }
                    ].map((stat, i) => (
                      <div key={i} className="p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl text-center shadow-xs">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                          {stat.label}
                        </span>
                        <span className={`text-base font-extrabold ${stat.color}`}>
                          {stat.value}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Revenue Trend Area Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3">Revenue Trend (₹)</h4>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={tabData.revenueTrend} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2} />
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                          <YAxis stroke="#64748b" fontSize={9} />
                          <Tooltip contentStyle={{ fontSize: 10 }} />
                          <Area type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={1.5} fillOpacity={1} fill="url(#colorRev)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Orders Trend Bar Chart */}
                  <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-xs">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-300 uppercase tracking-wider mb-3">Orders Trend</h4>
                    <div className="h-44 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tabData.ordersTrend} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                          <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                          <YAxis stroke="#64748b" fontSize={9} />
                          <Tooltip contentStyle={{ fontSize: 10 }} />
                          <Bar dataKey="orders" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                            {tabData.ordersTrend?.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "var(--primary)" : "var(--secondary)"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: OPERATING HOURS */}
              {activeTab === "hours" && tabData && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-450 uppercase tracking-wider">
                        <th className="px-4 py-3">Day</th>
                        <th className="px-4 py-3">Timings</th>
                        <th className="px-4 py-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
                      {Array.isArray(tabData) && tabData.map((sched, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-850/30">
                          <td className="px-4 py-3 font-semibold text-slate-850 dark:text-slate-200">{sched.day}</td>
                          <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400">
                            {sched.isHoliday ? "N/A" : `${sched.openTime} - ${sched.closeTime}`}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                              sched.isHoliday
                                ? "bg-red-50 dark:bg-red-950/20 text-red-650"
                                : "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                            }`}>
                              {sched.isHoliday ? "Closed (Holiday)" : "Open"}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 7: REVIEWS */}
              {activeTab === "reviews" && tabData && (
                <div className="space-y-3">
                  {Array.isArray(tabData) && tabData.map((rev, idx) => (
                    <div key={idx} className="p-4 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-250">{rev.customer}</span>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 dark:text-slate-800'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-650 dark:text-slate-350 italic">"{rev.comment}"</p>
                      <span className="block text-[9px] text-slate-400 dark:text-slate-500 font-medium">Date: {rev.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  )
}
