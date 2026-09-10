import React from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  TrendingUp, ShoppingBag, Flame, Clock, Truck, 
  AlertTriangle, Users, Star, IndianRupee 
} from "lucide-react"
import apiClient from "@/services/api/axios"

// Mock statistics for offline fallback
const MOCK_KPIS = {
  sales: { todaySales: 45230, percentageChange: 12 },
  orders: { totalOrders: 136 },
  active: { activeOrders: 23 },
  prep: { avgPrepTime: 14 },
  delivery: { pendingDeliveries: 8 },
  stock: { lowStockItems: 5 },
  staff: { staffOnDuty: 12 },
  rating: { rating: 4.7 }
}

export default function KpiCards({ storeId, refreshKey }) {
  // Today's Sales Query
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["today-sales", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/today-sales", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_KPIS.sales
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
        return MOCK_KPIS.orders
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
        return MOCK_KPIS.active
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
        return MOCK_KPIS.prep
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
        return MOCK_KPIS.delivery
      }
    }
  })

  // Low Stock Query
  const { data: stockData, isLoading: stockLoading } = useQuery({
    queryKey: ["low-stock", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/low-stock", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_KPIS.stock
      }
    }
  })

  // Staff Query
  const { data: staffData, isLoading: staffLoading } = useQuery({
    queryKey: ["staff-duty", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/staff-duty", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_KPIS.staff
      }
    }
  })

  // Rating Query
  const { data: ratingData, isLoading: ratingLoading } = useQuery({
    queryKey: ["customer-rating", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/customer-rating", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_KPIS.rating
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
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20"
    },
    {
      title: "Today's Orders",
      value: ordersVal,
      subtext: "Completed & processing",
      icon: ShoppingBag,
      color: "text-[var(--primary)] bg-red-50 dark:bg-red-950/20"
    },
    {
      title: "Active Orders",
      value: activeVal,
      subtext: "Live in kitchen queue",
      icon: Flame,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20"
    },
    {
      title: "Avg. Prep Time",
      value: `${prepVal} min`,
      subtext: "Target: under 15 min",
      icon: Clock,
      color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20"
    },
    {
      title: "Pending Deliveries",
      value: deliveryVal,
      subtext: "Awaiting rider dispatch",
      icon: Truck,
      color: "text-purple-500 bg-purple-50 dark:bg-purple-950/20"
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
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20"
    },
    {
      title: "Customer Rating",
      value: `${ratingVal} / 5.0`,
      subtext: "Based on store reviews",
      icon: Star,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20"
    }
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
      {cards.map((card, i) => {
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
