import React, { useState } from "react"
import { X, Download, FileSpreadsheet, FileText, CheckCircle } from "lucide-react"
import { adminAPI } from "@food/api"

export default function ExportScheduleModal({ isOpen, onClose }) {
  const [format, setFormat] = useState("excel")
  const [dateRange, setDateRange] = useState("all")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState(null)

  if (!isOpen) return null

  const handleExport = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const params = {
        format,
        dateRange,
        startDate: dateRange === "custom" ? customStart : undefined,
        endDate: dateRange === "custom" ? customEnd : undefined
      }

      const res = await adminAPI.exportOperatingHoursReport(params)
      setSuccess(true)

      // Simulate browser trigger download of a dummy CSV/Excel
      const dummyData = "Store Code,Store Name,Status,Monday,Tuesday,Wednesday,Thursday,Friday,Saturday,Sunday\n" +
        "store-1,Papa Veg Pizza - Vijay Nagar,Active,09:00 AM - 11:00 PM,09:00 AM - 11:00 PM,09:00 AM - 11:00 PM,09:00 AM - 11:00 PM,09:00 AM - 11:00 PM,09:00 AM - 11:00 PM,09:00 AM - 11:00 PM\n" +
        "store-2,Papa Veg Pizza - Palasia,Active,10:00 AM - 10:00 PM,10:00 AM - 10:00 PM,10:00 AM - 10:00 PM,10:00 AM - 10:00 PM,10:00 AM - 11:00 PM,10:00 AM - 11:00 PM,10:00 AM - 10:00 PM"
      
      const blob = new Blob([dummyData], { type: format === "csv" ? "text/csv" : "application/vnd.ms-excel" })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.setAttribute("href", url)
      a.setAttribute("download", `Operating_Hours_Report.${format === "pdf" ? "pdf" : format === "csv" ? "csv" : "xlsx"}`)
      a.click()

      setTimeout(() => {
        onClose()
      }, 1500)
    } catch (err) {
      setError("Failed to export report. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl p-6 transition-all scale-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Export Schedule Report</h3>
        <p className="text-xs text-slate-500 dark:text-slate-455 mb-6">
          Download store timing and weekly schedules compilation
        </p>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl text-xs text-rose-650 font-semibold">
            {error}
          </div>
        )}

        {success && (
          <div className="p-3 mb-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl text-xs text-emerald-650 font-bold flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
            <span>Export generated! Downloading file...</span>
          </div>
        )}

        <form onSubmit={handleExport} className="space-y-5">
          {/* Format selection */}
          <div>
            <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "excel", label: "Excel", desc: ".xlsx", icon: FileSpreadsheet, color: "text-emerald-600 border-emerald-200 bg-emerald-50/20" },
                { id: "csv", label: "CSV", desc: ".csv", icon: FileText, color: "text-blue-600 border-blue-200 bg-blue-50/20" },
                { id: "pdf", label: "PDF", desc: ".pdf", icon: FileText, color: "text-rose-600 border-rose-200 bg-rose-50/20" }
              ].map((item) => {
                const isSelected = format === item.id
                const Icon = item.icon
                return (
                  <label
                    key={item.id}
                    className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center cursor-pointer transition-all ${
                      isSelected
                        ? `${item.color} border-2 ring-1 ring-primary/10 shadow-sm`
                        : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="exportFormat"
                      value={item.id}
                      checked={isSelected}
                      onChange={() => setFormat(item.id)}
                      className="sr-only"
                    />
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-bold">{item.label}</span>
                    <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5">{item.desc}</span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Date range filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider mb-2">
              Date Coverage
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-1 focus:ring-primary focus:border-transparent transition-all"
            >
              <option value="all">All Dates / Current Schedules</option>
              <option value="today">Today's Schedules Only</option>
              <option value="custom">Custom Date Range</option>
            </select>
          </div>

          {/* Custom Date Ranges */}
          {dateRange === "custom" && (
            <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-top duration-200">
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1">From</label>
                <input
                  type="date"
                  required
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-400 mb-1">To</label>
                <input
                  type="date"
                  required
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  min={customStart}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-xs focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-655 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || success}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary-hover shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Download Report
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
