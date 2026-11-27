import React, { useState } from "react"
import { useQuery, keepPreviousData } from "@tanstack/react-query"
import {
  ShoppingBag, Scale, Truck, Receipt, Tag, Percent, Clock, Flame, Bike, CheckCircle, XCircle,
  Timer, AlertTriangle, Users, MessageSquareWarning, Star,
} from "lucide-react"
import apiClient from "@/services/api/axios"
import { StatsPanel, StatSection, MetricCard } from "@food/components/StatCards"

const SO = "/store-operations"
const PERIODS = [
  { value: "today", label: "Today" },
  { value: "yesterday", label: "Yesterday" },
  { value: "week", label: "Last 7 days" },
  { value: "month", label: "Last 30 days" },
]

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`
const count = (n) => Number(n || 0).toLocaleString("en-IN")

// The store manager's stats cards (Jharkhand Rasoi admin layout), from /store/dashboard/stats.
export default function KpiCards({ storeId, refreshKey }) {
  const [period, setPeriod] = useState("today")
  const periodLabel = PERIODS.find((p) => p.value === period)?.label || "Today"

  const { data: stats, isLoading, isFetching } = useQuery({
    queryKey: ["store-stats", storeId, period, refreshKey],
    queryFn: async () => {
      const response = await apiClient.get("/store/dashboard/stats", { params: { storeId, date: period } })
      return response.data?.data || null
    },
    placeholderData: keepPreviousData, // keep the cards filled while another period loads
  })

  return (
    <StatsPanel
      eyebrow="Store Overview"
      title="Operations Command"
      loading={isLoading || isFetching}
      actions={
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="min-w-[140px] rounded-md border border-neutral-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-neutral-300"
        >
          {PERIODS.map((p) => (
            <option key={p.value} value={p.value}>{p.label}</option>
          ))}
        </select>
      }
    >
      {/* Financial Overview (3x2) */}
      <StatSection title="Financial Overview" subtitle="Sales, fees, discounts and commission from delivered orders" className="sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard title="Gross revenue" value={money(stats?.revenue)} helper={`${periodLabel}: delivered order value`} icon={ShoppingBag} iconClass="text-emerald-600" accent="bg-emerald-200/40" path={`${SO}/orders/completed`} />
        <MetricCard title="Avg order value" value={money(stats?.avgOrderValue)} helper="Per delivered order" icon={Scale} iconClass="text-indigo-600" accent="bg-indigo-200/40" path={`${SO}/orders/completed`} />
        <MetricCard title="Delivery fee (from users)" value={money(stats?.deliveryFee)} helper={`Customer paid delivery: ${periodLabel}`} icon={Truck} iconClass="text-blue-600" accent="bg-blue-200/40" path={`${SO}/orders/completed`} />
        <MetricCard title="GST" value={money(stats?.gst)} helper={`Total tax collected: ${periodLabel}`} icon={Receipt} iconClass="text-orange-600" accent="bg-orange-200/40" path={`${SO}/orders/completed`} />
        <MetricCard title="Discounts given" value={money(stats?.discount)} helper={`Coupons and offers: ${periodLabel}`} icon={Tag} iconClass="text-pink-600" accent="bg-pink-200/40" path={`${SO}/orders/completed`} />
        <MetricCard title="Store commission" value={money(stats?.commission)} helper={`Commission on your sales: ${periodLabel}`} icon={Percent} iconClass="text-emerald-600" accent="bg-emerald-200/50 border border-emerald-300/50" path={`${SO}/payouts`} />
      </StatSection>

      {/* Store Operations (5x2) */}
      <StatSection title="Store Operations" subtitle="Order pipeline, kitchen, stock, staff and customers" className="sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
        <MetricCard title="Pending orders" value={count(stats?.orders?.pending)} helper="Waiting to be accepted" icon={Clock} iconClass="text-red-600" accent="bg-red-200/40" path={`${SO}/orders/incoming`} />
        <MetricCard title="In kitchen" value={count(stats?.orders?.inKitchen)} helper="Being prepared or ready" icon={Flame} iconClass="text-amber-600" accent="bg-amber-200/40" path={`${SO}/orders/active`} />
        <MetricCard title="Out for delivery" value={count(stats?.orders?.outForDelivery)} helper="With a rider now" icon={Bike} iconClass="text-indigo-600" accent="bg-indigo-200/40" path={`${SO}/delivery/tracking`} />
        <MetricCard title="Completed orders" value={count(stats?.orders?.completed)} helper="Successfully delivered" icon={CheckCircle} iconClass="text-emerald-600" accent="bg-emerald-200/40" path={`${SO}/orders/completed`} />
        <MetricCard title="Cancelled orders" value={count(stats?.orders?.cancelled)} helper="Cancelled by customer, store or admin" icon={XCircle} iconClass="text-rose-600" accent="bg-rose-200/40" path={`${SO}/orders/cancelled`} />
        <MetricCard title="Avg prep time" value={`${stats?.avgPrepTime || 0} min`} helper="Today, accepted to ready (target 15)" icon={Timer} iconClass="text-blue-600" accent="bg-blue-200/40" path={`${SO}/kitchen/delayed-orders`} />
        <MetricCard title="Low stock items" value={count(stats?.lowStockItems)} helper={stats?.lowStockItems ? "Need restocking" : "All stocks healthy"} icon={AlertTriangle} iconClass="text-yellow-600" accent="bg-yellow-200/40" path={`${SO}/inventory/low-stock`} />
        <MetricCard title="Staff on duty" value={count(stats?.staffOnDuty)} helper="Clocked in right now" icon={Users} iconClass="text-cyan-600" accent="bg-cyan-200/40" path={`${SO}/staff/attendance`} />
        <MetricCard title="Open complaints" value={count(stats?.openComplaints)} helper="Waiting for a resolution" icon={MessageSquareWarning} iconClass="text-orange-600" accent="bg-orange-200/40" path={`${SO}/customers/complaints`} />
        <MetricCard title="Customer rating" value={`${stats?.rating || 0} / 5`} helper="Average rating, last 30 days" icon={Star} iconClass="text-purple-600" accent="bg-purple-200/40" path={`${SO}/customers/reviews`} />
      </StatSection>
    </StatsPanel>
  )
}
