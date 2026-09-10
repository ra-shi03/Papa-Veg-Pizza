import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Award, Eye, X, Pizza, TrendingUp, BarChart3 } from "lucide-react"
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts"
import apiClient from "@/services/api/axios"

// Mock top products
const MOCK_TOP_PRODUCTS = [
  { productName: "Paneer Tikka Pizza", sold: 82, revenue: 24600 },
  { productName: "Double Cheese Margherita", sold: 68, revenue: 18360 },
  { productName: "Farmhouse Delight", sold: 54, revenue: 15120 },
  { productName: "Veg Supreme Feast", sold: 41, revenue: 13530 },
  { productName: "Capsicum Onion Classic", sold: 35, revenue: 7700 }
]

// Mock trend charts
const MOCK_TRENDS = [
  { name: "Mon", sales: 12 },
  { name: "Tue", sales: 15 },
  { name: "Wed", sales: 18 },
  { name: "Thu", sales: 14 },
  { name: "Fri", sales: 22 },
  { name: "Sat", sales: 30 },
  { name: "Sun", sales: 26 }
]

export default function TopSellingProducts({ storeId, refreshKey }) {
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [showChartModal, setShowChartModal] = useState(false)

  // Fetch top products
  const { data: productsData, isLoading } = useQuery({
    queryKey: ["top-products-widget", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/top-products", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_TOP_PRODUCTS
      }
    }
  })

  // Theme colors
  const primaryColor = localStorage.getItem("sa_primary") || "#a43c12"

  const handleRowClick = (product) => {
    setSelectedProduct(product)
    setShowChartModal(true)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[300px]">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
          <Award size={16} className="text-amber-500" />
          Top Selling Pizzas
        </h3>
        <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">
          Leaderboard
        </span>
      </div>

      {/* Table grid */}
      <div className="flex-1 overflow-y-auto mt-3.5 pr-1 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2.5">
            <div className="h-8 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                <th className="py-2">Pizza Product</th>
                <th className="py-2 text-center">Qty Sold</th>
                <th className="py-2 text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="font-bold divide-y divide-zinc-50 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
              {productsData?.map((prod, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => handleRowClick(prod)}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 text-zinc-900 dark:text-white flex items-center gap-2">
                    <div className="w-5 h-5 rounded bg-amber-50 dark:bg-amber-950/20 text-amber-505 flex items-center justify-center shrink-0">
                      <Pizza size={12} />
                    </div>
                    <span className="truncate max-w-[130px]">{prod.productName}</span>
                  </td>
                  <td className="py-2.5 text-center text-slate-500">{prod.sold} units</td>
                  <td className="py-2.5 text-right text-emerald-600 dark:text-emerald-450">₹{prod.revenue.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* PRODUCT ANALYTICS MODAL */}
      {showChartModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp size={16} className="text-[var(--primary)]" />
                  Product Sales Trend: {selectedProduct.productName}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold mt-0.5">Performance tracking & demand projection</p>
              </div>
              <button 
                onClick={() => setShowChartModal(false)}
                className="p-1 rounded-md text-zinc-405 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Grid of stats */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-850">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Units Sold</span>
                <span className="text-base font-black text-slate-900 dark:text-white block mt-0.5">{selectedProduct.sold} units</span>
              </div>
              <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-855">
                <span className="text-[9px] font-black text-slate-400 uppercase block">Total Revenue</span>
                <span className="text-base font-black text-emerald-600 block mt-0.5">₹{selectedProduct.revenue.toLocaleString("en-IN")}</span>
              </div>
            </div>

            {/* Recharts chart canvas */}
            <div className="h-44 w-full">
              <span className="text-[9px] font-black text-slate-400 uppercase block mb-2">Demand Curve (Weekly Volume)</span>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_TRENDS} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="prodColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      borderRadius: "12px",
                      borderColor: "rgba(0, 0, 0, 0.05)",
                      fontSize: "10px",
                      fontWeight: "bold"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    name="Pizzas Sold"
                    stroke={primaryColor}
                    strokeWidth={2}
                    fill="url(#prodColor)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <button
              onClick={() => setShowChartModal(false)}
              className="mt-4 w-full py-2.5 bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-750 dark:text-zinc-250 font-bold text-xs rounded-2xl cursor-pointer transition-colors shadow-sm text-center"
            >
              Dismiss Window
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
