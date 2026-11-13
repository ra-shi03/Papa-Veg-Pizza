import React from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  TrendingUp, ShoppingBag, Flame, Clock, Truck, 
  AlertTriangle, Users, Star, IndianRupee 
} from "lucide-react"
import apiClient from "@/services/api/axios"

// A kitchen supervisor sees the kitchen numbers of their own orders. Sales, stock, staff and ratings are the store
// manager's: the server refuses them to a supervisor, so they are not asked for and not shown.
const MANAGER_ONLY_CARDS = ["Today's Sales", "Low Stock Items", "Staff On Duty", "Customer Rating"]

export default function KpiCards({ storeId, refreshKey, role = "store_manager" }) {
  const isManager = role === "store_manager"
  // Today's Sales Query
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["today-sales", storeId, refreshKey],
    enabled: isManager,
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/today-sales", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        throw e
      }
    }
  })

  // Today's Orders Query
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["today-orders", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/today-orders", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        throw e
      }
    }
  })

  // Active Orders Query
  const { data: activeData, isLoading: activeLoading } = useQuery({
    queryKey: ["active-orders", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/active-orders", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        throw e
      }
    }
  })

  // Prep Time Query
  const { data: prepData, isLoading: prepLoading } = useQuery({
    queryKey: ["prep-time", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/prep-time", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        throw e
      }
    }
  })

  // Pending Deliveries Query
  const { data: deliveryData, isLoading: deliveryLoading } = useQuery({
    queryKey: ["pending-deliveries", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/pending-deliveries", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        throw e
      }
    }
  })

  // Low Stock Query
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["low-stock", storeId, refreshKey],
    enabled: isManager,
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/low-stock", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        throw e
      }
    }
  })

  // Staff Query
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["staff-duty", storeId, refreshKey],
    enabled: isManager,
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/staff-duty", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        throw e
      }
    }
  })

  // Rating Query
  const { data: ratingData, isLoading: ratingLoading } = useQuery({
    queryKey: ["customer-rating", storeId, refreshKey],
    enabled: isManager,
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/customer-rating", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        throw e
      }
    }
  })

  const isLoading = salesLoading || ordersLoading || activeLoading || prepLoading || deliveryLoading || stockLoading || staffLoading || ratingLoading

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="h-20 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 animate-pulse p-3 flex flex-col justify-between">
            <div className="h-3 w-16 bg-slate-200 dark:bg-zinc-800 rounded" />
            <div className="h-5 w-24 bg-slate-200 dark:bg-zinc-800 rounded mt-1" />
          </div>
        ))}
      </div>
    )
  }

  const salesVal = salesData?.todaySales ?? 0
  const salesChange = salesData?.percentageChange ?? 0
  const ordersVal = ordersData?.totalOrders ?? 0
  const activeVal = activeData?.activeOrders ?? 0
  const prepVal = prepData?.avgPrepTime ?? 0
  const deliveryVal = deliveryData?.pendingDeliveries ?? 0
  const stockVal = stockData?.lowStockItems ?? 0
  const staffVal = staffData?.staffOnDuty ?? 0
  const ratingVal = ratingData?.rating ?? 0

  const cards = [
    {
      title: "Today's Sales",
      value: `₹${salesVal.toLocaleString("en-IN")}`,
      subtext: `+${salesChange}% vs yesterday`,
      icon: TrendingUp,
      color: "text-[var(--primary)] bg-[var(--primary)]/10"
    },
    {
      title: "Today's Orders",
      value: ordersVal,
      subtext: "Completed & processing",
      icon: ShoppingBag,
      color: "text-[var(--primary)] bg-[var(--primary)]/10"
    },
    {
      title: "Active Orders",
      value: activeVal,
      subtext: "Live in kitchen queue",
      icon: Flame,
      color: "text-[var(--primary)] bg-[var(--primary)]/10"
    },
    {
      title: "Avg. Prep Time",
      value: `${prepVal} min`,
      subtext: "Target: under 15 min",
      icon: Clock,
      color: "text-[var(--primary)] bg-[var(--primary)]/10"
    },
    {
      title: "Pending Deliveries",
      value: deliveryVal,
      subtext: "Awaiting rider dispatch",
      icon: Truck,
      color: "text-[var(--primary)] bg-[var(--primary)]/10"
    },
    {
      title: "Low Stock Items",
      value: stockVal,
      subtext: stockVal > 0 ? `${stockVal} items require attention` : "All stocks healthy",
      icon: AlertTriangle,
      color: stockVal > 0 
        ? "text-white bg-rose-500 dark:bg-rose-900 border-rose-600 shadow-lg shadow-rose-500/10" 
        : "text-slate-500 bg-slate-50 dark:bg-zinc-800"
    },
    {
      title: "Staff On Duty",
      value: staffVal,
      subtext: "Active in current shift",
      icon: Users,
      color: "text-[var(--primary)] bg-[var(--primary)]/10"
    },
    {
      title: "Customer Rating",
      value: `${ratingVal} / 5.0`,
      subtext: "Based on store reviews",
      icon: Star,
      color: "text-[var(--primary)] bg-[var(--primary)]/10"
    }
  ]

  const visibleCards = isManager ? cards : cards.filter((card) => !MANAGER_ONLY_CARDS.includes(card.title))

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {visibleCards.map((card, i) => {
        const Icon = card.icon
        const isLowStockAlert = card.title === "Low Stock Items" && stockVal > 0

        return (
          <div
            key={i}
            className={`border rounded-2xl p-3 flex items-center justify-between transition-all duration-300 hover:scale-[1.02] shadow-sm select-none ${
              isLowStockAlert 
                ? "bg-rose-500 border-rose-600 text-white dark:bg-rose-950 dark:border-rose-900" 
                : "bg-white dark:bg-zinc-900 border-zinc-150 dark:border-zinc-850 text-slate-800 dark:text-zinc-100"
            }`}
          >
            <div className="min-w-0 flex-1">
              <span className={`text-[9px] font-black uppercase tracking-wider block ${
                isLowStockAlert ? "text-rose-100" : "text-slate-400 dark:text-zinc-500"
              }`}>
                {card.title}
              </span>
              <span className="text-lg font-black tracking-tight mt-0.5 block leading-tight">
                {card.value}
              </span>
              <span className={`text-[8px] font-bold mt-0.5 block truncate ${
                isLowStockAlert ? "text-rose-200" : card.subtext.startsWith("+") ? "text-emerald-500" : "text-slate-400 dark:text-zinc-500"
              }`}>
                {card.subtext}
              </span>
            </div>
            
            <div className={`w-7.5 h-7.5 rounded-xl flex items-center justify-center shrink-0 ml-2 shadow-sm ${
              isLowStockAlert ? "bg-rose-600 dark:bg-rose-900 text-white" : card.color
            }`}>
              <Icon size={14} className="stroke-[2.5]" />
            </div>
          </div>
        )
      })}
    </div>
  )
}
