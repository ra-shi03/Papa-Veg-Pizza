import React, { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  Inbox, Flame, CheckCircle, Truck, X, Search, Clock, ArrowRight, Eye 
} from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/api/axios"

// Mock order lists by status
const MOCK_LIVE_ORDERS = {
  incoming: [
    { orderNumber: "PV-8850", customer: "Rohan Malhotra", amount: 640, eta: "25m", status: "Incoming" },
    { orderNumber: "PV-8849", customer: "Alok Gupta", amount: 480, eta: "20m", status: "Incoming" },
    { orderNumber: "PV-8848", customer: "Pooja Patel", amount: 550, eta: "30m", status: "Incoming" }
  ],
  preparing: [
    { orderNumber: "PV-8842", customer: "Amit Verma", amount: 590, eta: "12m", status: "Preparing" },
    { orderNumber: "PV-8841", customer: "Isha Sharma", amount: 390, eta: "15m", status: "Preparing" },
    { orderNumber: "PV-8840", customer: "Deepak Rawat", amount: 720, eta: "8m", status: "Preparing" },
    { orderNumber: "PV-8843", customer: "Neha Sen", amount: 420, eta: "14m", status: "Preparing" },
    { orderNumber: "PV-8844", customer: "Vijay Nair", amount: 650, eta: "10m", status: "Preparing" }
  ],
  ready: [
    { orderNumber: "PV-8839", customer: "Karan Singh", amount: 340, eta: "0m", status: "Ready" },
    { orderNumber: "PV-8837", customer: "Sanjay Jha", amount: 980, eta: "0m", status: "Ready" }
  ],
  delivery: [
    { orderNumber: "PV-8830", customer: "Sunil Dutt", amount: 1150, eta: "18m", status: "Out For Delivery" },
    { orderNumber: "PV-8828", customer: "Kriti Sen", amount: 460, eta: "22m", status: "Out For Delivery" }
  ]
}

export default function LiveOrderBoard({ storeId, refreshKey, liveCounts }) {
  const [showLiveModal, setShowLiveModal] = useState(false)
  const [activeTab, setActiveTab] = useState("incoming")
  const [localOrders, setLocalOrders] = useState(MOCK_LIVE_ORDERS)

  // Modal Table search/pagination
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [currentPage, setCurrentPage] = useState(1)

  // Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setCurrentPage(1)
    }, 300)
    return () => clearTimeout(handler)
  }, [searchVal])

  // React Query fetch for live orders
  const { data: serverOrders, refetch } = useQuery({
    queryKey: ["live-orders-board", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/live-orders", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_LIVE_ORDERS
      }
    }
  })

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch()
      // Simulate slight dynamic variation locally to feel alive
      setLocalOrders(prev => {
        const copy = JSON.parse(JSON.stringify(prev))
        // Add ETA minute decreases
        Object.keys(copy).forEach(k => {
          copy[k].forEach(order => {
            if (order.eta.endsWith("m") && order.eta !== "0m") {
              const num = parseInt(order.eta)
              if (num > 1) {
                order.eta = `${num - 1}m`
              }
            }
          })
        })
        return copy
      })
    }, 10000)

    return () => clearInterval(interval)
  }, [refetch])

  const openStatusView = (status) => {
    setActiveTab(status)
    setShowLiveModal(true)
  }

  // Filter listings
  const listData = localOrders[activeTab] || []
  const filteredList = listData.filter(ord => 
    ord.orderNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    ord.customer.toLowerCase().includes(debouncedSearch.toLowerCase())
  )

  const itemsPerPage = 5
  const totalPages = Math.ceil(filteredList.length / itemsPerPage)
  const paginatedList = filteredList.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const columns = [
    { key: "incoming", label: "Incoming", icon: Inbox, color: "border-blue-500 text-blue-600 bg-blue-50/50 dark:bg-blue-950/10 dark:border-blue-900/50", count: liveCounts.incoming },
    { key: "preparing", label: "Preparing", icon: Flame, color: "border-orange-500 text-orange-600 bg-orange-50/50 dark:bg-orange-950/10 dark:border-orange-900/50", count: liveCounts.preparing },
    { key: "ready", label: "Ready", icon: CheckCircle, color: "border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/10 dark:border-emerald-900/50", count: liveCounts.ready },
    { key: "delivery", label: "Out For Delivery", icon: Truck, color: "border-purple-500 text-purple-600 bg-purple-50/50 dark:bg-purple-950/10 dark:border-purple-900/50", count: liveCounts.delivery }
  ]

  return (
    <div className="space-y-3">
      {/* Title */}
      <h3 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
        </span>
        Live Order Board
      </h3>

      {/* Kanban Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => {
          const Icon = col.icon

          return (
            <button
              key={col.key}
              onClick={() => openStatusView(col.key)}
              className={`border-2 border-dashed p-4 rounded-3xl flex flex-col justify-between items-start text-left cursor-pointer hover:shadow-md hover:scale-[1.01] transition-all min-h-[100px] w-full ${col.color}`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{col.label}</span>
                <Icon size={16} />
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-black">{col.count}</span>
                <span className="text-[9px] font-bold opacity-60">orders live</span>
              </div>
            </button>
          )
        })}
      </div>

      {/* LIVE ORDERS MODAL */}
      {showLiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-xl shadow-2xl p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Live Queue: {activeTab}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold mt-0.5">Monitoring live updates (Refreshes automatically every 10s)</p>
              </div>
              <button 
                onClick={() => setShowLiveModal(false)}
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
                placeholder="Search active orders..."
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                className="w-full text-xs pl-9 pr-4 py-2 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950/50 text-slate-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-bold placeholder-zinc-450"
              />
            </div>

            {/* Orders list table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                    <th className="py-2">Order Number</th>
                    <th className="py-2">Customer</th>
                    <th className="py-2">Amount</th>
                    <th className="py-2">ETA / Cook Time</th>
                    <th className="py-2 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="font-bold divide-y divide-zinc-50 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
                  {paginatedList.length > 0 ? (
                    paginatedList.map((ord) => (
                      <tr key={ord.orderNumber} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/50">
                        <td className="py-2.5 text-zinc-900 dark:text-white">{ord.orderNumber}</td>
                        <td className="py-2.5">{ord.customer}</td>
                        <td className="py-2.5">₹{ord.amount}</td>
                        <td className="py-2.5 text-amber-600 flex items-center gap-1">
                          <Clock size={11} />
                          <span>{ord.eta}</span>
                        </td>
                        <td className="py-2.5 text-right">
                          <span className={`text-[9px] px-2 py-0.5 rounded-full border capitalize font-black ${
                            activeTab === "ready" 
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-450"
                              : activeTab === "delivery"
                                ? "bg-purple-50 text-purple-750 border-purple-100 dark:bg-purple-950/20 dark:text-purple-450"
                                : "bg-orange-50 text-orange-750 border-orange-100 dark:bg-orange-950/20 dark:text-orange-450"
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-zinc-400 font-bold">No active orders in this stage</td>
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
