import React, { useState, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import { Activity, Sliders, Calendar, ArrowUpRight, Pizza, Search, Star, MessageSquare } from "lucide-react"
import { adminAPI } from "@food/api"

// Child Widget Components
import KpiCards from "./components/KpiCards"
import DashboardCharts from "./components/DashboardCharts"
import LiveOrders from "./components/LiveOrders"
import StorePerformance from "./components/StorePerformance"
import InventoryAlerts from "./components/InventoryAlerts"
import DeliveryPerformance from "./components/DeliveryPerformance"
import CustomerActivity from "./components/CustomerActivity"
import RecentReviews from "./components/RecentReviews"
import RefundRequests from "./components/RefundRequests"
import RecentComplaints from "./components/RecentComplaints"
import NotificationFeed from "./components/NotificationFeed"
import QuickActions from "./components/QuickActions"

export default function FranchiseAdminDashboard() {
  const [searchParams] = useSearchParams()
  const searchQuery = searchParams.get("q") || ""
  const dateFilter = searchParams.get("date") || "today"
  const startDate = searchParams.get("start") || ""
  const endDate = searchParams.get("end") || ""

  // Operational states
  const [loading, setLoading] = useState(true)
  const [kpiData, setKpiData] = useState(null)
  const [revenueTrend, setRevenueTrend] = useState([])
  const [liveOrders, setLiveOrders] = useState([])
  const [storesPerformance, setStoresPerformance] = useState([])
  const [inventoryAlerts, setInventoryAlerts] = useState([])
  const [deliveryData, setDeliveryData] = useState(null)
  const [customerData, setCustomerData] = useState(null)

  // Local state for interactive tables
  const [reviewsList, setReviewsList] = useState([
    { id: 1, customer: "Rashi Kumar", store: "Papa Veg Pizza - Indore Central", rating: 5, review: "Amazing taste! The Paneer Tikka pizza was baked to perfection.", reply: "" },
    { id: 2, customer: "Amit Sharma", store: "Papa Veg Pizza - Bhopal Zone", rating: 4.5, review: "Hot and cheesy, delivery took 15 mins. Great packaging.", reply: "Thank you Amit for the rating!" },
    { id: 3, customer: "Sonia Verma", store: "Papa Veg Pizza - Ujjain Branch", rating: 3, review: "Base was a bit hard, toppings were fresh though.", reply: "" }
  ])

  const [complaintsList, setComplaintsList] = useState([
    { id: "TKT-8940", customer: "Vijay Patel", store: "Papa Veg Pizza - Indore Central", priority: "critical", description: "Received non-veg topping on veg order! Customer is extremely upset.", status: "open" },
    { id: "TKT-8939", customer: "Sunita Gupta", store: "Papa Veg Pizza - Bhopal Zone", priority: "high", description: "Charged twice on UPI app but order showing failed. Need refund.", status: "open" },
    { id: "TKT-8935", customer: "Rider Karan", store: "Papa Veg Pizza - Ujjain Branch", priority: "medium", description: "Customer location incorrect on app. Spent 30 mins locating.", status: "open" }
  ])

  const [notificationsFeed, setNotificationsFeed] = useState([
    { id: 1, title: "Low Stock Alert: Cheese", detail: "Processed Cheese below reorder level at Indore Central outlet.", type: "low_stock", time: "2 mins ago", unread: true },
    { id: 2, title: "New Refund Ticket Created", detail: "Customer Vijay Patel requested refund of ₹450 for Order PVP-1092.", type: "refund", time: "15 mins ago", unread: true },
    { id: 3, title: "Critical Complaint Registered", detail: "Ticket #TKT-8940 created: Non-veg topping complaint.", type: "complaint", time: "30 mins ago", unread: true },
    { id: 4, title: "New Store Review Received", detail: "Customer Sonia Verma rated Ujjain Branch 3 stars.", type: "review", time: "1 hour ago", unread: false },
    { id: 5, title: "Bhopal Store Offline Alert", detail: "Vite server disconnected or outlet power cut occurred.", type: "offline", time: "4 hours ago", unread: false }
  ])

  const [refundsList, setRefundsList] = useState([
    { id: "PVP-9042", customer: "Rohan Malhotra", amount: 450, reason: "Late delivery by rider (55 mins delay)", status: "pending" },
    { id: "PVP-9041", customer: "Isha Sharma", amount: 590, reason: "Item missing from bag (Garlic bread missing)", status: "pending" }
  ])

  // Fetch Dashboard Metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true)
      const [kpis, rev, orders, stores, inventory, delivery, customers] = await Promise.all([
        adminAPI.getDashboardSummary(),
        adminAPI.getDashboardRevenue(),
        adminAPI.getDashboardLiveOrders(),
        adminAPI.getDashboardStorePerformance(),
        adminAPI.getDashboardInventoryAlerts(),
        adminAPI.getDashboardDeliveryPerformance(),
        adminAPI.getDashboardCustomerActivity()
      ])

      setKpiData(kpis.data?.data || null)
      setRevenueTrend(rev.data?.data || [])
      setLiveOrders(orders.data?.data || [])
      setStoresPerformance(stores.data?.data || [])
      setInventoryAlerts(inventory.data?.data || [])
      setDeliveryData(delivery.data?.data || null)
      setCustomerData(customers.data?.data || null)

    } catch (e) {
      console.error("Error loading dashboard metrics:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [dateFilter, startDate, endDate])

  // Apply search query filtering across widgets locally
  const getFilteredLiveOrders = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return liveOrders
    return liveOrders.filter(o => 
      o.id.toLowerCase().includes(q) ||
      o.customer.toLowerCase().includes(q) ||
      o.store.toLowerCase().includes(q)
    )
  }

  const getFilteredStores = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return storesPerformance
    return storesPerformance.filter(s => s.name.toLowerCase().includes(q))
  }

  const getFilteredInventoryAlerts = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return inventoryAlerts
    return inventoryAlerts.filter(i => 
      i.ingredient.toLowerCase().includes(q) ||
      i.store.toLowerCase().includes(q)
    )
  }

  const getFilteredReviews = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return reviewsList
    return reviewsList.filter(r => 
      r.customer.toLowerCase().includes(q) ||
      r.review.toLowerCase().includes(q) ||
      r.store.toLowerCase().includes(q)
    )
  }

  const getFilteredRefunds = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return refundsList
    return refundsList.filter(r => 
      r.id.toLowerCase().includes(q) ||
      r.customer.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q)
    )
  }

  const getFilteredComplaints = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return complaintsList
    return complaintsList.filter(c => 
      c.id.toLowerCase().includes(q) ||
      c.customer.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q)
    )
  }

  const getFilteredNotifications = () => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return notificationsFeed
    return notificationsFeed.filter(n => 
      n.title.toLowerCase().includes(q) ||
      n.detail.toLowerCase().includes(q)
    )
  }

  // Quick Action Triggers
  const handleAddNewStore = () => {
    fetchMetrics()
  }

  const handleAddNewManager = () => {
    fetchMetrics()
  }

  const handleAddNewBroadcastAlert = (newAlert) => {
    setNotificationsFeed(prev => [newAlert, ...prev])
  }

  const orderMixStats = {
    confirmed: getFilteredLiveOrders().filter(o => o.status === "confirmed").length,
    preparing: getFilteredLiveOrders().filter(o => o.status === "preparing").length,
    baking: getFilteredLiveOrders().filter(o => o.status === "baking").length,
    packed: getFilteredLiveOrders().filter(o => o.status === "packed").length,
    out_for_delivery: getFilteredLiveOrders().filter(o => o.status === "out_for_delivery").length,
    delivered: 215, // Mock historical count
    cancelled: 2   // Mock historical count
  }

  return (
    <div className="px-4 pb-12 pt-4 bg-zinc-55 dark:bg-zinc-950/20">
      
      {/* Upper Status Line */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 mt-1">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              Franchise Operations Console
            </h2>
            <span className="animate-pulse bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-500/20">
              Live Radar
            </span>
          </div>
          <p className="text-zinc-450 dark:text-zinc-500 text-xs font-semibold mt-0.5">
            Currently monitoring live operational feeds from your franchise store network.
          </p>
        </div>

        {/* Dynamic Filters summary */}
        <div className="flex items-center gap-1.5 self-start sm:self-center">
          <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-lg shadow-sm">
            <Calendar size={12} className="text-[var(--primary)] shrink-0" />
            <span>Range: {dateFilter === "custom" ? `${startDate} to ${endDate}` : dateFilter.toUpperCase()}</span>
          </div>
          {searchQuery && (
            <div className="flex items-center gap-1 px-2.5 py-1 text-[10px] bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-500 font-bold rounded-lg shadow-sm">
              <Search size={12} className="shrink-0" />
              <span>Query: "{searchQuery}"</span>
            </div>
          )}
        </div>
      </div>

      {/* KPI Bento Grid Section */}
      <section className="mb-6">
        <KpiCards data={kpiData} loading={loading} />
      </section>

      {/* 12-Column Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Row 1: Charts Section (Revenue Line + Donut Chart) */}
        <div className="lg:col-span-12">
          <DashboardCharts 
            revenueData={revenueTrend} 
            orderStatusData={orderMixStats} 
            loading={loading} 
          />
        </div>

        {/* Row 2: Live Orders (8 cols) & Store Performance (4 cols) */}
        <div className="lg:col-span-8">
          <LiveOrders 
            orders={getFilteredLiveOrders()} 
            onRefresh={fetchMetrics} 
            loading={loading} 
          />
        </div>
        <div className="lg:col-span-4">
          <StorePerformance 
            stores={getFilteredStores()} 
            loading={loading} 
          />
        </div>

        {/* Row 3: Inventory Alerts (6 cols) & Delivery Metrics (6 cols) */}
        <div className="lg:col-span-6">
          <InventoryAlerts 
            alerts={getFilteredInventoryAlerts()} 
            onRefresh={fetchMetrics} 
            loading={loading} 
          />
        </div>
        <div className="lg:col-span-6">
          <DeliveryPerformance 
            deliveryData={deliveryData} 
            loading={loading} 
          />
        </div>

        {/* Row 4: Customer Activity (6 cols) & Reviews (6 cols) */}
        <div className="lg:col-span-6">
          <CustomerActivity 
            customerData={customerData} 
            loading={loading} 
          />
        </div>
        <div className="lg:col-span-6">
          <RecentReviews 
            reviews={getFilteredReviews()} 
            onRefresh={fetchMetrics} 
            loading={loading} 
          />
        </div>

        {/* Row 5: Refunds Widget (6 cols) & Complaints (6 cols) */}
        <div className="lg:col-span-6">
          <RefundRequests 
            refunds={getFilteredRefunds()} 
            onRefresh={fetchMetrics} 
            loading={loading} 
          />
        </div>
        <div className="lg:col-span-6">
          <RecentComplaints 
            complaints={getFilteredComplaints()} 
            onRefresh={fetchMetrics} 
            loading={loading} 
          />
        </div>

        {/* Row 6: Notifications Alert Feed (6 cols) & Quick Actions Shortcuts (6 cols) */}
        <div className="lg:col-span-6">
          <NotificationFeed 
            notifications={getFilteredNotifications()} 
            onRefresh={fetchMetrics} 
            loading={loading} 
          />
        </div>
        <div className="lg:col-span-6">
          <QuickActions 
            onAddStore={handleAddNewStore} 
            onAddManager={handleAddNewManager} 
            onAddAlert={handleAddNewBroadcastAlert} 
          />
        </div>

      </div>

    </div>
  )
}
