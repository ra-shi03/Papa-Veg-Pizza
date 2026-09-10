import React, { useState } from "react"
import { X, Download, FileText, Settings, Calendar, CheckSquare, Square } from "lucide-react"
import { adminAPI } from "@food/api"

export default function ExportReportModal({ isOpen, onClose, stores = [], onExportSuccess }) {
  const [format, setFormat] = useState("pdf") // pdf, excel, csv
  const [dateRange, setDateRange] = useState("last7") // today, last7, last30, custom
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [selectedStores, setSelectedStores] = useState(["all"])
  const [includeCharts, setIncludeCharts] = useState(true)
  const [includeInventory, setIncludeInventory] = useState(true)
  const [includeStaff, setIncludeStaff] = useState(false)
  
  const [exporting, setExporting] = useState(false)

  if (!isOpen) return null

  const handleToggleStore = (storeId) => {
    if (storeId === "all") {
      setSelectedStores(["all"])
      return
    }

    setSelectedStores(prev => {
      const filtered = prev.filter(id => id !== "all")
      if (filtered.includes(storeId)) {
        const next = filtered.filter(id => id !== storeId)
        return next.length === 0 ? ["all"] : next
      }
      return [...filtered, storeId]
    })
  }

  const handleExportSubmit = async (e) => {
    e.preventDefault()
    setExporting(true)
    try {
      const params = {
        format,
        dateRange,
        startDate: dateRange === "custom" ? startDate : undefined,
        endDate: dateRange === "custom" ? endDate : undefined,
        storeIds: selectedStores.includes("all") ? "all" : selectedStores.join(","),
        includeCharts,
        includeInventory,
        includeStaff
      }

      const res = await adminAPI.exportStorePerformanceReport(params)
      
      // Simulate file download delay
      setTimeout(() => {
        setExporting(false)
        if (onExportSuccess) {
          onExportSuccess(res?.data?.message || "Report Export Successful. Your file will download automatically.")
        }
        onClose()
      }, 1500)
    } catch (_) {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-950 rounded-2xl border border-slate-150 dark:border-slate-800 shadow-2xl overflow-hidden transition-all scale-in duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Export Performance Report</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Customize and compile analytics for print or offline storage</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-655 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleExportSubmit} className="p-6 space-y-5">
          
          {/* Format Selector */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Report Format</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { id: "pdf", label: "Adobe PDF (.pdf)", desc: "Best for print & reports" },
                { id: "excel", label: "MS Excel (.xlsx)", desc: "Best for raw calculations" },
                { id: "csv", label: "Comma CSV (.csv)", desc: "Best for data migrations" }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setFormat(opt.id)}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between h-20 transition-all cursor-pointer ${
                    format === opt.id
                      ? "border-primary bg-primary/5 text-primary"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  <FileText className={`w-4 h-4 ${format === opt.id ? "text-primary" : "text-slate-400"}`} />
                  <div>
                    <span className="block text-xs font-bold">{opt.label}</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">{opt.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Date Range Selection */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Select Date Scope</label>
            <div className="flex gap-2">
              {[
                { id: "today", label: "Today" },
                { id: "last7", label: "Last 7 Days" },
                { id: "last30", label: "Last 30 Days" },
                { id: "custom", label: "Custom Range" }
              ].map(opt => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setDateRange(opt.id)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    dateRange === opt.id
                      ? "border-primary bg-primary text-white"
                      : "border-slate-250 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-655 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom Dates Inputs */}
            {dateRange === "custom" && (
              <div className="flex items-center gap-3 pt-2">
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <span className="text-slate-400 text-xs">to</span>
                <div className="flex-1 relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 rounded-xl text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Store Selection checkboxes */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outlets Scope</label>
            <div className="max-h-28 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/50 p-2.5 divide-y divide-slate-100 dark:divide-slate-850">
              <button
                type="button"
                onClick={() => handleToggleStore("all")}
                className="w-full py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer"
              >
                {selectedStores.includes("all") ? (
                  <CheckSquare className="w-4 h-4 text-primary fill-primary/10" />
                ) : (
                  <Square className="w-4 h-4 text-slate-455" />
                )}
                All Stores within Franchise
              </button>
              {stores.map(store => {
                const isChecked = selectedStores.includes(store._id)
                return (
                  <button
                    type="button"
                    key={store._id}
                    onClick={() => handleToggleStore(store._id)}
                    className="w-full py-1.5 flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-350 cursor-pointer"
                  >
                    {isChecked ? (
                      <CheckSquare className="w-4 h-4 text-primary fill-primary/10" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-455" />
                    )}
                    {store.storeName.replace("Papa Veg Pizza - ", "")}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom Include Checklist */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider">Data Settings</label>
            <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-850">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-655 dark:text-slate-350 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeCharts}
                  onChange={(e) => setIncludeCharts(e.target.checked)}
                  className="rounded text-primary focus:ring-primary border-slate-300 w-3.5 h-3.5"
                />
                Include Analytics Charts
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-655 dark:text-slate-350 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInventory}
                  onChange={(e) => setIncludeInventory(e.target.checked)}
                  className="rounded text-primary focus:ring-primary border-slate-300 w-3.5 h-3.5"
                />
                Include Inventory Waste
              </label>
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-655 dark:text-slate-350 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeStaff}
                  onChange={(e) => setIncludeStaff(e.target.checked)}
                  className="rounded text-primary focus:ring-primary border-slate-300 w-3.5 h-3.5"
                />
                Include Staff Roster Logs
              </label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-850">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={exporting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-primary/10 flex items-center gap-1.5"
            >
              {exporting ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                  Generating Report...
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  Compile & Export
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  )
}
