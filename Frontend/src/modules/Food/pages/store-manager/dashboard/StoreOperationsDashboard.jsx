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
