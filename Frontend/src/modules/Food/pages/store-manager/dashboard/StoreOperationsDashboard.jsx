import React, { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { 
  Store, RefreshCw, AlertTriangle, ShieldCheck, Clock, Bell,
  Calendar, CheckCircle, Wifi, Play, Pause, AlertOctagon, HelpCircle
} from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/api/axios"

// Import modular components
import KpiCards from "./components/KpiCards"
import SalesAnalytics from "./components/SalesAnalytics"
import OrderStatusDonut from "./components/OrderStatusDonut"
import LiveOrderBoard from "./components/LiveOrderBoard"
import KitchenPerformance from "./components/KitchenPerformance"
import DeliveryOverview from "./components/DeliveryOverview"
import InventoryAlerts from "./components/InventoryAlerts"
import StaffOverview from "./components/StaffOverview"
import TopSellingProducts from "./components/TopSellingProducts"
import CustomerComplaints from "./components/CustomerComplaints"
import ActivityTimeline from "./components/ActivityTimeline"
import NotificationsDrawer from "./components/NotificationsDrawer"

export default function StoreOperationsDashboard() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Primary States
  const [storeList, setStoreList] = useState([
    { _id: "st-indore-01", name: "Indore Central (Vijay Nagar)" },
    { _id: "st-bhopal-01", name: "Bhopal Hub (Arera Colony)" },
    { _id: "st-ujjain-01", name: "Ujjain Express (Nanakheda)" }
  ])
  const [selectedStoreId, setSelectedStoreId] = useState(() => {
    return localStorage.getItem("store_active_id") || "st-indore-01"
  })
  const [shiftStatus, setShiftStatus] = useState("Open") // Open, Closed, Busy
  const [currentTime, setCurrentTime] = useState(new Date())
  const [refreshKey, setRefreshKey] = useState(0)
  
  // Real-Time Notification State
  const [showNotifDrawer, setShowNotifDrawer] = useState(false)
  const [notifications, setNotifications] = useState([
    { id: 1, title: "Low Cheese Stock", message: "Processed Mozzarella Cheese is under 3kg threshold", type: "Critical", time: "Just now", unread: true },
    { id: 2, title: "Order PV-8839 Delayed", message: "Double Cheese Margherita has exceeded baking duration by 6m", type: "Warning", time: "5m ago", unread: true },
    { id: 3, title: "Rider Delayed", message: "Rider Amit Kumar is stuck in traffic on Order PV-8830", type: "Warning", time: "12m ago", unread: true },
    { id: 4, title: "New Stock Request Approved", message: "10kg Capsicum approved by franchise warehouse manager", type: "Info", time: "40m ago", unread: false }
  ])

  // Live Socket.IO Simulator Data State
  const [liveOrdersCount, setLiveOrdersCount] = useState({
    incoming: 3,
    preparing: 8,
    ready: 4,
    delivery: 2
  })

  const [liveActivities, setLiveActivities] = useState([
    { id: 1, action: "Order PV-8842 accepted", user: "Manager (Shubham)", type: "order", timestamp: "1m ago" },
    { id: 2, action: "Margherita pizza moved to Baking", user: "Chef (Vijay)", type: "kitchen", timestamp: "5m ago" },
    { id: 3, action: "Low stock alert triggered: Paneer", user: "System", type: "inventory", timestamp: "14m ago" },
    { id: 4, action: "Rider assigned: Ramesh Singh", user: "Auto-Dispatch", type: "delivery", timestamp: "20m ago" }
  ])

  // Clock Update
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // API Call: Fetch stores
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await apiClient.get("/stores/list")
        if (response.data?.stores) {
          setStoreList(response.data.stores)
        }
      } catch (err) {
        console.warn("Failed to fetch stores list from API, using high-fidelity mock list.", err)
      }
    }
    fetchStores()
  }, [])

  // Socket.IO event simulation for real-time dashboard updates
  useEffect(() => {
    const socketInterval = setInterval(() => {
      const events = [
        { type: "orderCreated", title: "New Order Received", msg: "Order PV-8850 placed by Rohan Malhotra (₹640)", cat: "incoming" },
        { type: "orderAccepted", title: "Order Confirmed", msg: "Order PV-8845 accepted and sent to kitchen", cat: "preparing" },
        { type: "orderPreparing", title: "Baking Started", msg: "Paneer Supreme Pizza entered oven", cat: "preparing" },
        { type: "orderReady", title: "Order Ready", msg: "Order PV-8839 is packed and ready", cat: "ready" },
        { type: "deliveryAssigned", title: "Rider Allocated", msg: "Rider Ramesh Kumar is picking up Order PV-8839", cat: "delivery" }
      ]

      const chosenEvent = events[Math.floor(Math.random() * events.length)]
      
      // Update Counts
      setLiveOrdersCount(prev => {
        const next = { ...prev }
        if (chosenEvent.type === "orderCreated") {
          next.incoming += 1
        } else if (chosenEvent.type === "orderAccepted") {
          next.incoming = Math.max(0, next.incoming - 1)
          next.preparing += 1
        } else if (chosenEvent.type === "orderReady") {
          next.preparing = Math.max(0, next.preparing - 1)
          next.ready += 1
        } else if (chosenEvent.type === "deliveryAssigned") {
          next.ready = Math.max(0, next.ready - 1)
          next.delivery += 1
        }
        return next
      })

      // Add Notification
      const newNotif = {
        id: Date.now(),
        title: chosenEvent.title,
        message: chosenEvent.msg,
        type: chosenEvent.type === "orderCreated" ? "Info" : "Warning",
        time: "Just now",
        unread: true
      }
      setNotifications(prev => [newNotif, ...prev])

      // Add Activity Log
      const newAct = {
        id: Date.now(),
        action: chosenEvent.msg,
        user: chosenEvent.type === "deliveryAssigned" ? "Auto-Dispatch" : "System",
        type: chosenEvent.type.includes("delivery") ? "delivery" : chosenEvent.type.includes("order") ? "order" : "kitchen",
        timestamp: "Just now"
      }
      setLiveActivities(prev => [newAct, ...prev.slice(0, 8)])

      toast.info(`[Realtime: ${chosenEvent.type}] ${chosenEvent.title}`, {
        description: chosenEvent.msg
      })

    }, 35000) // Simulated socket fires every 35s to prevent crowding, but keep UI alive

    return () => clearInterval(socketInterval)
  }, [])

  const handleStoreChange = (e) => {
    const newStoreId = e.target.value
    setSelectedStoreId(newStoreId)
    localStorage.setItem("store_active_id", newStoreId)
    setRefreshKey(prev => prev + 1)
    toast.success("Active store updated. Refreshing all dashboard metrics...")
  }

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    toast.success("Dashboard metrics refreshed successfully")
  }

  const unreadCount = notifications.filter(n => n.unread).length

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 min-h-screen text-slate-800 dark:text-zinc-100 transition-colors duration-300">
      
      {/* Header section with specific Papa Veg styling */}
      <div className="border-b border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 z-30 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          
          {/* Store Selector & Info */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center shadow-md shadow-[var(--primary)]/20 shrink-0">
                <Store size={16} />
              </div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Store Operations
              </h2>
            </div>
            
            {/* Store Select Dropdown */}
            <div className="flex items-center gap-2">
              <select
                value={selectedStoreId}
                onChange={handleStoreChange}
                className="text-xs font-bold bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-[var(--primary)] text-slate-700 dark:text-zinc-300 cursor-pointer shadow-sm"
              >
                {storeList.map(st => (
                  <option key={st._id} value={st._id}>{st.name}</option>
                ))}
              </select>

              {/* Live Connection indicator */}
              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                <Wifi size={10} className="animate-pulse" />
                Live Sync
              </span>
            </div>
          </div>

          {/* Shift control, Date/Time, Alert triggers */}
          <div className="flex items-center justify-end gap-3 flex-wrap">
            
            {/* Current Shift Badge */}
            <div className="flex items-center gap-1 bg-slate-50 dark:bg-zinc-950 px-2 py-1 rounded-xl border border-zinc-200 dark:border-zinc-850 shadow-sm">
              <span className="text-[9px] font-black uppercase text-zinc-400">Shift:</span>
              <button
                onClick={() => {
                  const nextStatus = shiftStatus === "Open" ? "Busy" : shiftStatus === "Busy" ? "Closed" : "Open"
                  setShiftStatus(nextStatus)
                  toast.success(`Shift status changed to ${nextStatus}`)
                }}
                className={`text-[10px] font-black px-2 py-0.5 rounded-lg transition-all ${
                  shiftStatus === "Open" 
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                    : shiftStatus === "Busy"
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400"
                      : "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                }`}
              >
                {shiftStatus}
              </button>
            </div>

            {/* DateTime Display */}
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-zinc-450">
              <Calendar size={12} />
              <span>{currentTime.toLocaleDateString("en-IN", { weekday: "short", day: "2-digit", month: "short" })}</span>
              <Clock size={12} className="ml-1" />
              <span>{currentTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>

            <div className="h-4 w-px bg-zinc-200 dark:bg-zinc-800" />

            {/* Notification bell */}
            <button
              onClick={() => setShowNotifDrawer(true)}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 relative text-slate-600 dark:text-zinc-300 transition-all cursor-pointer shadow-sm"
              title="View system alerts"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full flex items-center justify-center text-[8px] font-extrabold ring-2 ring-white dark:ring-zinc-900">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-350 transition-all cursor-pointer shadow-sm flex items-center gap-1 text-[10px] font-bold"
              title="Reload dashboard data"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

          </div>

        </div>
      </div>

      {/* Main dashboard content area - compact layout */}
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        
        {/* SECTION 1: 8 KPI Cards Grid */}
        <KpiCards storeId={selectedStoreId} refreshKey={refreshKey} />

        {/* Column layout for sales & statuses */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION 2: Sales Analytics (2 columns) */}
          <div className="lg:col-span-2">
            <SalesAnalytics storeId={selectedStoreId} refreshKey={refreshKey} />
          </div>
          {/* SECTION 3: Order Status Donut (1 column) */}
          <div className="lg:col-span-1">
            <OrderStatusDonut storeId={selectedStoreId} refreshKey={refreshKey} />
          </div>
        </div>

        {/* SECTION 4: Live Order Status Board (Incoming, Preparing, Ready, Out For Delivery) */}
        <LiveOrderBoard 
          storeId={selectedStoreId} 
          refreshKey={refreshKey} 
          liveCounts={liveOrdersCount} 
        />

        {/* Column layout for Kitchen & Delivery */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION 5: Kitchen Performance */}
          <KitchenPerformance storeId={selectedStoreId} refreshKey={refreshKey} />
          
          {/* SECTION 6: Delivery Overview */}
          <DeliveryOverview storeId={selectedStoreId} refreshKey={refreshKey} />
        </div>

        {/* Column layout for Inventory & Attendance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION 7: Inventory Alerts */}
          <InventoryAlerts storeId={selectedStoreId} refreshKey={refreshKey} />

          {/* SECTION 8: Staff Overview */}
          <StaffOverview storeId={selectedStoreId} refreshKey={refreshKey} />
        </div>

        {/* Column layout for Top Products & Customer Complaints */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* SECTION 9: Top Selling Products */}
          <TopSellingProducts storeId={selectedStoreId} refreshKey={refreshKey} />

          {/* SECTION 10: Recent Customer Complaints */}
          <CustomerComplaints storeId={selectedStoreId} refreshKey={refreshKey} />
        </div>

        {/* SECTION 11: Activity Timeline */}
        <ActivityTimeline 
          storeId={selectedStoreId} 
          refreshKey={refreshKey} 
          activities={liveActivities} 
        />

      </div>

      {/* SECTION 12: Notification Slide-out Drawer */}
      <NotificationsDrawer 
        isOpen={showNotifDrawer} 
        onClose={() => setShowNotifDrawer(false)} 
        notifications={notifications} 
        setNotifications={setNotifications} 
      />

    </div>
  )
}
