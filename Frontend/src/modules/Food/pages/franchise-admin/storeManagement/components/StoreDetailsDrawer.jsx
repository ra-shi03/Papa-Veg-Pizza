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
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatusBadge(store.isActive ? "Active" : "Inactive")}`}>
                  {store.isActive ? "Active" : "Inactive"}
                </span>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Code: {store.code} | Type: {store.storeType}</p>
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
            { id: "overview", label: "Overview", icon: Building2 }
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
                      { label: "Store Code", value: store.code },
                      { label: "Type", value: store.storeType },
                      { label: "Fulfillment", value: Array.isArray(store.fulfillmentModes) ? store.fulfillmentModes.join(', ') : (store.fulfillmentModes || "N/A") },
                      { label: "Region", value: store.regionId?.name || store.city || "N/A" },
                      { label: "Zone", value: store.zoneId?.name || store.state || "N/A" },
                      { label: "Territory", value: store.territoryId?.name || "N/A" },
                      { label: "Pincode", value: store.pincode || "N/A" },
                      { label: "Phone", value: store.phone || "N/A" },
                      { label: "Email", value: store.email || "N/A" },
                      { label: "Created By", value: store.createdBy || "Unknown" },
                      { label: "Created At", value: store.createdAt ? new Date(store.createdAt).toLocaleString() : "N/A" },
                      { label: "Updated At", value: store.updatedAt ? new Date(store.updatedAt).toLocaleString() : "N/A" }
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
                      {store.address}, {store.city}, {store.state} - {store.pincode}
                    </p>
                    <div className="flex gap-4 mt-3 text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850">
                      <span>Latitude: {store.latitude || "N/A"}</span>
                      <span>Longitude: {store.longitude || "N/A"}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

        </div>

      </div>
    </div>
  )
}
