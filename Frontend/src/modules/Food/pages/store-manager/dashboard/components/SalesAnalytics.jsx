import React, { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell 
} from "recharts"
import { 
  Calendar, FileText, Download, Printer, X, Sliders, ChevronDown, Check, TrendingUp
} from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/api/axios"

// Mock Sales Data
const MOCK_SALES_HOURLY = [
  { hour: "10 AM", sales: 3200 },
  { hour: "11 AM", sales: 4800 },
  { hour: "12 PM", sales: 8500 },
  { hour: "01 PM", sales: 12000 },
  { hour: "02 PM", sales: 9400 },
  { hour: "03 PM", sales: 5500 },
  { hour: "04 PM", sales: 4200 },
  { hour: "05 PM", sales: 6800 },
  { hour: "06 PM", sales: 11000 },
  { hour: "07 PM", sales: 18500 },
  { hour: "08 PM", sales: 24000 },
  { hour: "09 PM", sales: 19000 },
  { hour: "10 PM", sales: 12500 },
  { hour: "11 PM", sales: 6200 }
]

const MOCK_SALES_WEEKLY = [
  { hour: "Mon", sales: 42000 },
  { hour: "Tue", sales: 48000 },
  { hour: "Wed", sales: 51000 },
  { hour: "Thu", sales: 58000 },
  { hour: "Fri", sales: 74000 },
  { hour: "Sat", sales: 92000 },
  { hour: "Sun", sales: 86000 }
]

const MOCK_SALES_MONTHLY = [
  { hour: "Jan", sales: 1420000 },
  { hour: "Feb", sales: 1550000 },
  { hour: "Mar", sales: 1680000 },
  { hour: "Apr", sales: 1820000 },
  { hour: "May", sales: 2010000 },
  { hour: "Jun", sales: 1980000 }
]

export default function SalesAnalytics({ storeId, refreshKey }) {
  const [filterType, setFilterType] = useState("daily") // daily, weekly, monthly
  const [showReportModal, setShowReportModal] = useState(false)

  // Date Range States for Modal
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Fetch Sales Data using React Query
  const { data: salesData, isLoading } = useQuery({
    queryKey: ["hourly-sales", storeId, filterType, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/hourly-sales", { 
          params: { storeId, filter: filterType } 
        })
        return response.data?.data || response.data
      } catch (e) {
        return filterType === "daily" 
          ? MOCK_SALES_HOURLY 
          : filterType === "weekly" 
            ? MOCK_SALES_WEEKLY 
            : MOCK_SALES_MONTHLY
      }
    }
  })

  // Theme primary color from root CSS
  const primaryColor = localStorage.getItem("sa_primary") || "#a43c12"

  const handleExport = (format) => {
    toast.success(`Exporting Sales Report as ${format}...`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[300px]">
      
      {/* Widget Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
            <TrendingUp size={16} className="text-[var(--primary)]" />
            Sales Analytics
          </h3>
        </div>

        {/* Filters & Export Options */}
        <div className="flex items-center gap-2">
          {/* Daily / Weekly / Monthly Switcher */}
          <div className="flex bg-slate-50 dark:bg-zinc-950 p-0.5 rounded-xl border border-zinc-200/50 dark:border-zinc-850">
            {["daily", "weekly", "monthly"].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all duration-200 cursor-pointer ${
                  filterType === type
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                {type === "daily" ? "Daily" : type === "weekly" ? "Weekly" : "Monthly"}
              </button>
            ))}
          </div>

          {/* Full Report Button */}
          <button
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-1 px-2.5 py-1.5 text-[9px] font-black uppercase bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl hover:bg-slate-100 dark:hover:bg-zinc-850 transition-all text-slate-650 dark:text-zinc-350 cursor-pointer shadow-sm"
          >
            <FileText size={11} className="text-[var(--primary)]" />
            <span>Full Report</span>
          </button>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="flex-1 min-h-0 w-full mt-3">
        {isLoading ? (
          <div className="w-full h-full bg-slate-100/50 dark:bg-zinc-950/20 rounded-2xl animate-pulse flex items-center justify-center">
            <div className="h-4 w-24 bg-slate-200 dark:bg-zinc-800 rounded" />
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={salesData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="hour" 
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                dy={4}
              />
              <YAxis 
                stroke="#94a3b8" 
                fontSize={9} 
                tickLine={false} 
                axisLine={false}
                tickFormatter={(val) => `₹${val >= 100000 ? `${val / 100000}L` : val >= 1000 ? `${val / 1000}k` : val}`}
              />
              <Tooltip 
                cursor={{ fill: "rgba(0, 0, 0, 0.02)" }}
                contentStyle={{
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  borderRadius: "12px",
                  borderColor: "rgba(0, 0, 0, 0.05)",
                  fontSize: "10px",
                  fontWeight: "bold",
                  boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.05)"
                }}
                formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Sales"]}
              />
              <Bar 
                dataKey="sales" 
                radius={[4, 4, 0, 0]}
              >
                {salesData?.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={primaryColor} 
                    fillOpacity={0.9} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* SALES REPORT MODAL */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                <FileText size={15} className="text-[var(--primary)]" />
                View Full Sales Report
              </h3>
              <button 
                onClick={() => setShowReportModal(false)}
                className="p-1 rounded-md text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Date Filters Form */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block ml-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full p-2 text-xs font-bold bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl outline-none focus:border-[var(--primary)] text-slate-800 dark:text-zinc-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest block ml-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full p-2 text-xs font-bold bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl outline-none focus:border-[var(--primary)] text-slate-800 dark:text-zinc-100"
                  />
                </div>
              </div>

              {/* Action Buttons with Dynamic Themes */}
              <div className="space-y-2 pt-2">
                <button
                  onClick={() => handleExport("CSV")}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-250 font-bold text-xs rounded-2xl cursor-pointer transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Download size={13} className="text-emerald-500" />
                    Export CSV Report
                  </span>
                  <ChevronDown size={11} className="opacity-50" />
                </button>

                <button
                  onClick={() => handleExport("Excel")}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 dark:hover:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-250 font-bold text-xs rounded-2xl cursor-pointer transition-colors shadow-sm"
                >
                  <span className="flex items-center gap-2">
                    <Download size={13} className="text-blue-500" />
                    Export Excel Sheet
                  </span>
                  <ChevronDown size={11} className="opacity-50" />
                </button>

                <button
                  onClick={handlePrint}
                  className="w-full flex items-center justify-center gap-2 px-3.5 py-3 bg-[var(--primary)] hover:opacity-90 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-md shadow-[var(--primary)]/10 transition-opacity"
                >
                  <Printer size={14} />
                  Print Active Sales Report
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  )
}
