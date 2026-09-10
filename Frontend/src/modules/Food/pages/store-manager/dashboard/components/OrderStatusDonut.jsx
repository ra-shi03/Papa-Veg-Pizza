import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts"
import { X, Search, ChevronUp, ChevronDown, ClipboardList } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/api/axios"

// Mock order status breakdown
const MOCK_STATUS_DATA = {
  incoming: 5,
  preparing: 8,
  baking: 3,
  packaging: 4,
  ready: 2,
  delivered: 70,
  cancelled: 5
}

// Mock orders for status list drill-down
const MOCK_ORDERS = [
  { orderNumber: "PV-8842", customer: "Rohan Malhotra", status: "preparing", createdTime: "10:30 AM" },
  { orderNumber: "PV-8841", customer: "Isha Sharma", status: "preparing", createdTime: "10:32 AM" },
  { orderNumber: "PV-8840", customer: "Amit Verma", status: "preparing", createdTime: "10:35 AM" },
  { orderNumber: "PV-8839", customer: "Pooja Patel", status: "preparing", createdTime: "10:38 AM" },
  { orderNumber: "PV-8838", customer: "Deepak Rawat", status: "preparing", createdTime: "10:40 AM" },
  { orderNumber: "PV-8837", customer: "Karan Singh", status: "preparing", createdTime: "10:42 AM" },
  { orderNumber: "PV-8836", customer: "Sanjay Jha", status: "preparing", createdTime: "10:45 AM" },
  { orderNumber: "PV-8835", customer: "Neha Sen", status: "preparing", createdTime: "10:48 AM" },
  
  { orderNumber: "PV-8850", customer: "Ravi Kumar", status: "incoming", createdTime: "10:55 AM" },
  { orderNumber: "PV-8849", customer: "Alok Gupta", status: "incoming", createdTime: "10:56 AM" },
  
  { orderNumber: "PV-8830", customer: "Sunil Dutt", status: "delivered", createdTime: "09:15 AM" },
  { orderNumber: "PV-8828", customer: "Kriti Sen", status: "delivered", createdTime: "09:20 AM" },
  
  { orderNumber: "PV-8812", customer: "Manish Dev", status: "cancelled", createdTime: "08:40 AM" }
]

export default function OrderStatusDonut({ storeId, refreshKey }) {
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState("all")

  // Modal Table States
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState("orderNumber")
  const [sortOrder, setSortOrder] = useState("desc") // asc, desc

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchVal])

  // Fetch status breakdown using React Query
  const { data: statusData, isLoading } = useQuery({
    queryKey: ["order-status", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/order-status", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_STATUS_DATA
      }
    }
  })

  // Format Recharts data
  const chartData = [
    { name: "Incoming", value: statusData?.incoming ?? 0, color: "#3b82f6" },
    { name: "Preparing", value: statusData?.preparing ?? 0, color: "#f97316" },
    { name: "Baking", value: statusData?.baking ?? 0, color: "#eab308" },
    { name: "Packaging", value: statusData?.packaging ?? 0, color: "#ec4899" },
    { name: "Ready", value: statusData?.ready ?? 0, color: "#10b981" },
    { name: "Delivered", value: statusData?.delivered ?? 0, color: "#6366f1" },
    { name: "Cancelled", value: statusData?.cancelled ?? 0, color: "#ef4444" }
  ].filter(item => item.value > 0)

  // Calculate percentages for Tooltips
  const totalOrders = chartData.reduce((acc, curr) => acc + curr.value, 0)

  const handleCellClick = (entry) => {
    setSelectedStatus(entry.name.toLowerCase())
    setShowStatusModal(true)
  }

  // Filter & Sort Table rows
  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const matchesStatus = selectedStatus === "all" || order.status === selectedStatus
    const matchesSearch = 
      order.orderNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      order.customer.toLowerCase().includes(debouncedSearch.toLowerCase())
    return matchesStatus && matchesSearch
  })

  // Sort logic
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    const valA = a[sortField]
    const valB = b[sortField]
    if (valA < valB) return sortOrder === "asc" ? -1 : 1
    if (valA > valB) return sortOrder === "asc" ? 1 : -1
    return 0
  })

  // Pagination parameters
  const itemsPerPage = 5
  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage)
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortOrder("desc")
    }
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[300px]">
      
      {/* Widget Title */}
      <div>
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
          <ClipboardList size={16} className="text-[var(--primary)]" />
          Order Status Distribution
        </h3>
      </div>

      {/* Donut Chart Canvas */}
      <div className="flex-1 flex items-center justify-center relative min-h-0 mt-2">
        {isLoading ? (
          <div className="w-28 h-28 rounded-full border-4 border-slate-100 border-t-[var(--primary)] animate-spin" />
        ) : (
          <>
            <div className="w-full h-full max-h-[170px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {chartData.map((entry, idx) => (
                      <Cell 
                        key={`cell-${idx}`} 
                        fill={entry.color} 
                        className="cursor-pointer hover:opacity-85 transition-opacity outline-none"
                        onClick={() => handleCellClick(entry)}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const { name, value, color } = payload[0];
                        const pct = totalOrders > 0 ? ((value / totalOrders) * 100).toFixed(1) : 0;
                        return (
                          <div className="bg-white dark:bg-zinc-800 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-700 shadow-md text-[10px] font-bold">
                            <span className="flex items-center gap-1.5" style={{ color }}>
                              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                              {name}: {value} ({pct}%)
                            </span>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            {/* Center Info Text */}
            <div className="absolute text-center select-none pointer-events-none">
              <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block">Total</span>
              <span className="text-lg font-black text-slate-900 dark:text-white leading-none block mt-0.5">{totalOrders}</span>
            </div>
          </>
        )}
      </div>

      {/* Legend Indicator */}
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[9px] font-black text-slate-500 dark:text-zinc-400 mt-2">
        {chartData.map((item, idx) => (
          <button
            key={idx}
            onClick={() => { setSelectedStatus(item.name.toLowerCase()); setShowStatusModal(true); }}
            className="flex items-center gap-1 hover:opacity-80 transition-all cursor-pointer"
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
            <span>{item.name} ({item.value})</span>
          </button>
        ))}
      </div>

      {/* ORDER STATUS MODAL TABLE */}
      {showStatusModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                  Orders: {selectedStatus.toUpperCase()}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">Showing matching active logs in system</p>
              </div>
              <button 
                onClick={() => setShowStatusModal(false)}
                className="p-1 rounded-md text-zinc-405 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Filter Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
              <input
                type="text"
                placeholder="Search by order or customer..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950/50 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-bold placeholder-zinc-450"
              />
            </div>

            {/* Modal Table content */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    <th className="py-2 cursor-pointer select-none" onClick={() => handleSort("orderNumber")}>
                      <span className="flex items-center gap-1">
                        Order Number
                        {sortField === "orderNumber" && (sortOrder === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                      </span>
                    </th>
                    <th className="py-2 cursor-pointer select-none" onClick={() => handleSort("customer")}>
                      <span className="flex items-center gap-1">
                        Customer
                        {sortField === "customer" && (sortOrder === "asc" ? <ChevronUp size={11} /> : <ChevronDown size={11} />)}
                      </span>
                    </th>
                    <th className="py-2">Status</th>
                    <th className="py-2 text-right">Created Time</th>
                  </tr>
                </thead>
                <tbody className="font-bold divide-y divide-zinc-50 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
                  {paginatedOrders.length > 0 ? (
                    paginatedOrders.map((ord) => (
                      <tr key={ord.orderNumber} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/50">
                        <td className="py-2.5 text-zinc-900 dark:text-white">{ord.orderNumber}</td>
                        <td className="py-2.5">{ord.customer}</td>
                        <td className="py-2.5">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border capitalize font-black ${
                            ord.status === "delivered" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450"
                              : ord.status === "cancelled"
                                ? "bg-rose-50 text-rose-750 border-rose-100 dark:bg-rose-950/20 dark:text-rose-450"
                                : "bg-orange-50 text-orange-700 border-orange-100 dark:bg-orange-950/20 dark:text-orange-450"
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                        <td className="py-2.5 text-right text-slate-400 dark:text-zinc-500">{ord.createdTime}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="text-center py-8 text-zinc-400 font-bold">No matching records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-800 pt-3.5 mt-4">
                <span className="text-[10px] text-slate-400 font-bold">
                  Page {currentPage} of {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    className="px-3 py-1 text-[10px] bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-350 font-black rounded-lg disabled:opacity-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className="px-3 py-1 text-[10px] bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-slate-650 dark:text-zinc-350 font-black rounded-lg disabled:opacity-50 hover:bg-slate-100 cursor-pointer transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

    </div>
  )
}
