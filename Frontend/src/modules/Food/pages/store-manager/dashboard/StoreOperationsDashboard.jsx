import React, { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { 
  Store, RefreshCw, AlertTriangle, ShieldCheck, Clock, Bell,
  Calendar, CheckCircle, Wifi, Play, Pause, AlertOctagon, HelpCircle
} from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/api/axios"
import { useOrderEvents } from "../api/storeOrdersApi"

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
  const [notifications, setNotifications] = useState([])

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

  // Real-time: every order_event of this store (pushed by the server over the socket) refreshes the widgets.
  // A burst of events (one order moving through several steps) is folded into one refresh.
  const refreshTimer = React.useRef(null)
  useOrderEvents(() => {
    clearTimeout(refreshTimer.current)
    refreshTimer.current = setTimeout(() => setRefreshKey((k) => k + 1), 1500)
  })
  useEffect(() => () => clearTimeout(refreshTimer.current), [])

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 min-h-screen text-slate-800 dark:text-zinc-100 transition-colors duration-300">
      
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
