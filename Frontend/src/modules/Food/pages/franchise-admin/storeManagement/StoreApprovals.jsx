import React, { useState, useEffect, useCallback } from "react"
import {
  Search,
  RefreshCw,
  MoreVertical,
  Star,
  Trash2,
  Eye,
  Settings,
  Clock,
  ArrowUpDown,
  User,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  ShoppingBag,
  Users,
  AlertCircle,
  Building2,
  FileCheck,
  CheckCircle,
  XCircle,
  Download,
  AlertTriangle
} from "lucide-react"
import { adminAPI } from "@food/api"

// Import Sub-components
import ApprovalDetailsDrawer from "./components/ApprovalDetailsDrawer"
import ApproveModal from "./components/ApproveModal"
import RejectModal from "./components/RejectModal"
import ContactManagerModal from "./components/ContactManagerModal"

export default function StoreApprovals() {
  // Lists & Loading State
  const [approvals, setApprovals] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // KPI Stats
  const [kpis, setKpis] = useState(null)
  const [loadingKpis, setLoadingKpis] = useState(true)

  // Filters State
  const [searchVal, setSearchVal] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [cityFilter, setCityFilter] = useState("All")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")

  // Table Pagination & Sorting
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [sortKey, setSortKey] = useState("createdAt")
  const [sortOrder, setSortOrder] = useState("desc") // "asc" | "desc"

  // Dropdowns/Active Row state
  const [activeMenuId, setActiveMenuId] = useState(null)

  // Modal and Drawer Controls
  const [isApproveOpen, setIsApproveOpen] = useState(false)
  const [isRejectOpen, setIsRejectOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedApproval, setSelectedApproval] = useState(null)
  const [drawerTab, setDrawerTab] = useState("store")

  // Toast Notification Simulation State
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // 1. Debouncing logic for search (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchVal)
      setPage(1) // Reset page on search change
    }, 300)
    return () => clearTimeout(handler)
  }, [searchVal])

  // 2. Fetch KPIs from mock server
  const fetchKPIs = useCallback(async () => {
    try {
      setLoadingKpis(true)
      const res = await adminAPI.getStoreApprovalsDashboard()
      setKpis(res?.data?.data || null)
    } catch (_) {
      // Quiet fail or placeholder set
    } finally {
      setLoadingKpis(false)
    }
  }, [])

  // 3. Fetch Approvals from mock server
  const fetchApprovals = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = {
        page,
        limit,
        search: debouncedSearch,
        status: statusFilter,
        city: cityFilter === "All" ? "" : cityFilter,
        startDate,
        endDate,
        sort: sortKey,
        order: sortOrder
      }
      const res = await adminAPI.getStoreApprovals(params)
      setApprovals(res?.data?.data?.approvals || [])
      setTotalCount(res?.data?.data?.totalCount || 0)
    } catch (err) {
      setError("Failed to load store approvals requests. Please try again.")
      setApprovals([])
      setTotalCount(0)
    } finally {
      setLoading(false)
    }
  }, [page, limit, debouncedSearch, statusFilter, cityFilter, startDate, endDate, sortKey, sortOrder])

  // Initial trigger & updates
  useEffect(() => {
    fetchApprovals()
  }, [fetchApprovals])

  useEffect(() => {
    fetchKPIs()
  }, [fetchKPIs])

  // WebSocket Live simulation (mock ticks every 12 seconds to fluctuate metrics)
  useEffect(() => {
    const wsInterval = setInterval(() => {
      setKpis(prev => {
        if (!prev) return null
        // Randomly simulate a new incoming request
        const rand = Math.random()
        if (rand > 0.75) {
          showToast("New store approval request received!", "info")
          fetchApprovals()
          return {
            ...prev,
            pendingApprovals: prev.pendingApprovals + 1
          }
        }
        return prev
      })
    }, 15000)

    return () => clearInterval(wsInterval)
  }, [fetchApprovals])

  // Reset Filters handler
  const handleResetFilters = () => {
    setSearchVal("")
    setStatusFilter("All")
    setCityFilter("All")
    setStartDate("")
    setEndDate("")
    setPage(1)
  }

  // Handle Export report
  const handleExport = () => {
    showToast("Exporting approvals spreadsheet... Download started.")
  }

  // Handle Approve Confirm
  const handleApproveConfirm = async (remarks) => {
    if (!selectedApproval) return
    try {
      await adminAPI.approveStoreApproval(selectedApproval._id, remarks)
      showToast(`Store "${selectedApproval.storeName}" has been approved and activated!`, "success")
      setIsApproveOpen(false)
      setSelectedApproval(null)
      fetchApprovals()
      fetchKPIs()
    } catch (_) {
      showToast("Failed to approve the store. Please try again.", "error")
    }
  }

  // Handle Reject Confirm
  const handleRejectConfirm = async (payload) => {
    if (!selectedApproval) return
    try {
      await adminAPI.rejectStoreApproval(selectedApproval._id, payload)
      showToast(`Store application "${selectedApproval.storeName}" has been rejected.`, "success")
      setIsRejectOpen(false)
      setSelectedApproval(null)
      fetchApprovals()
      fetchKPIs()
    } catch (_) {
      showToast("Failed to reject the store application.", "error")
    }
  }

  // Handle Document ZIP Download
  const handleDownloadAllDocs = async (approvalId, storeName) => {
    try {
      showToast(`Building Zip folder for ${storeName} documents...`, "info")
      await adminAPI.getStoreApprovalDocumentsZip(approvalId)
      setTimeout(() => {
        showToast("Documents zip downloaded successfully!", "success")
      }, 1500)
    } catch (_) {
      showToast("Download failed. Please try again.", "error")
    }
  }

  // Sort helpers
  const handleSort = (key) => {
    if (sortKey === key) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortOrder("desc")
    }
    setPage(1)
  }

  // Relative Time formatter
  const getRelativeTime = (isoString) => {
    if (!isoString) return "N/A"
    const diffMs = Date.now() - new Date(isoString).getTime()
    const diffSec = Math.floor(diffMs / 1000)
    const diffMin = Math.floor(diffSec / 60)
    const diffHr = Math.floor(diffMin / 60)
    const diffDays = Math.floor(diffHr / 24)

    if (diffSec < 60) return "Just now"
    if (diffMin < 60) return `${diffMin}m ago`
    if (diffHr < 24) return `${diffHr}h ago`
    return `${diffDays}d ago`
  }

  return (
    <div className="flex-1 px-4 pb-4 pt-4 space-y-4 max-w-[1400px] mx-auto min-h-screen bg-slate-50/50 dark:bg-slate-950/20 text-slate-800 dark:text-slate-100">
      
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">Store Approvals</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Review and approve newly submitted store applications.</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-55 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Report
          </button>
          <button
            onClick={() => { fetchApprovals(); fetchKPIs(); }}
            className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-55 rounded-lg transition-colors cursor-pointer"
            title="Refresh Grid"
          >
            <RefreshCw className="w-4 h-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Pending Approvals", val: kpis?.pendingApprovals, sub: "18 Requests", icon: FileCheck, color: "text-amber-600 bg-amber-50 dark:bg-amber-950/20" },
          { label: "Approved Today", val: kpis?.approvedToday, sub: "7 Stores", icon: CheckCircle, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" },
          { label: "Rejected Stores", val: kpis?.rejectedStores, sub: "4 Stores", icon: XCircle, color: "text-rose-600 bg-rose-50 dark:bg-rose-950/20" },
          { label: "Average Approval Time", val: kpis ? `${kpis.avgApprovalTime} Hrs` : null, sub: "3.2 Hours avg", icon: Clock, color: "text-blue-600 bg-blue-50 dark:bg-blue-950/20" }
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-850 rounded-xl p-3 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[85px]">
            {loadingKpis ? (
              <div className="space-y-1.5 animate-pulse">
                <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded" />
                <div className="h-5 w-20 bg-slate-300 dark:bg-slate-700 rounded" />
              </div>
            ) : (
              <>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
                    {card.label}
                  </span>
                  <span className="text-base font-black text-slate-900 dark:text-white">
                    {card.val ?? 0}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-50 dark:border-slate-850 text-[9px] font-semibold text-slate-400">
                  <span>{card.sub}</span>
                  <div className={`p-1 rounded-md ${card.color}`}>
                    <card.icon className="w-3.5 h-3.5" />
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* FILTER BAR SECTION */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl p-3 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2.5">
          
          {/* Global Approvals Search Bar */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search store name, request ID, manager..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>

          {/* Status Dropdown */}
          <div className="w-[115px]">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">Status: All</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>

          {/* City Dropdown */}
          <div className="w-[115px]">
            <select
              value={cityFilter}
              onChange={(e) => { setCityFilter(e.target.value); setPage(1); }}
              className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-xs font-semibold focus:outline-none"
            >
              <option value="All">City: All</option>
              <option value="Indore">Indore</option>
              <option value="Bhopal">Bhopal</option>
              <option value="Ujjain">Ujjain</option>
            </select>
          </div>

          {/* Date Pickers */}
          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-[10px] font-semibold focus:outline-none text-slate-500"
              title="Start Date"
            />
            <span className="text-slate-400 text-xs">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-950 text-[10px] font-semibold focus:outline-none text-slate-500"
              title="End Date"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="px-2.5 py-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:bg-slate-55 rounded-lg text-xs font-bold transition-all cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

        </div>
      </div>

      {/* APPROVALS DATA LIST TABLE */}
      <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-850 rounded-xl p-3 shadow-xs relative">
        {loading ? (
          /* TABLE LOADING SKELETONS */
          <div className="space-y-4 py-4">
            <div className="h-6 bg-slate-100 dark:bg-slate-950/50 rounded-lg animate-pulse w-full" />
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <div className="h-4 w-1/12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-2/12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-2/12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-1/12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-2/12 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-1/12 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
                <div className="h-4 w-1/12 bg-slate-300 dark:bg-slate-700 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* ERROR BOUNDARY */
          <div className="py-12 text-center space-y-4">
            <div className="w-14 h-14 mx-auto bg-red-50 dark:bg-red-950/20 text-red-655 rounded-full flex items-center justify-center border border-red-150 dark:border-red-900/30">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-855 dark:text-slate-200">{error}</h4>
              <p className="text-xs text-slate-455 mt-1">Check your network connection and try again.</p>
            </div>
            <button
              onClick={fetchApprovals}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
            >
              Retry Load
            </button>
          </div>
        ) : approvals.length === 0 ? (
          /* EMPTY STATE */
          <div className="py-16 text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center border text-primary opacity-70">
              <FileCheck className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-855 dark:text-slate-200">No requests found</h3>
              <p className="text-sm text-slate-455 dark:text-slate-400 mt-1">There are no store applications matching the criteria.</p>
            </div>
            <button
              onClick={() => { fetchApprovals(); fetchKPIs(); }}
              className="px-5 py-2.5 bg-primary text-white font-bold rounded-xl text-sm shadow-md"
            >
              Refresh Table
            </button>
          </div>
        ) : (
          /* COMPACT APPROVALS TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-850 text-[9px] font-bold text-slate-450 dark:text-slate-400 uppercase tracking-wider">
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("_id")}>
                    <div className="flex items-center gap-1">
                      Request ID
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("storeName")}>
                    <div className="flex items-center gap-1">
                      Store Name
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2">Manager</th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("city")}>
                    <div className="flex items-center gap-1">
                      City
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2 cursor-pointer select-none" onClick={() => handleSort("createdAt")}>
                    <div className="flex items-center gap-1">
                      Submitted Date
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    </div>
                  </th>
                  <th className="px-2.5 py-2">Documents</th>
                  <th className="px-2.5 py-2">Status</th>
                  <th className="px-2.5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850 text-[11px] text-slate-700 dark:text-slate-350">
                {approvals.map((app) => (
                  <tr key={app._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 group">
                    <td className="px-2.5 py-2 font-semibold text-slate-900 dark:text-white">{app._id}</td>
                    <td className="px-2.5 py-2 font-bold text-primary">{app.storeName}</td>
                    <td className="px-2.5 py-2 font-medium text-slate-655 dark:text-slate-300">
                      {app.managerName}
                    </td>
                    <td className="px-2.5 py-2 font-semibold">{app.address?.city || "N/A"}</td>
                    <td className="px-2.5 py-2 text-slate-500">
                      {getRelativeTime(app.createdAt)}
                    </td>
                    <td className="px-2.5 py-2 font-bold text-slate-500">
                      {app.documents?.length || 0} Files
                    </td>
                    <td className="px-2.5 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                        app.status === "Approved"
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                          : app.status === "Pending"
                            ? "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                            : "bg-red-50 dark:bg-red-950/20 text-red-650"
                      }`}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-2.5 py-2 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === app._id ? null : app._id)}
                        className="p-1 rounded-md text-slate-400 hover:text-slate-655 hover:bg-slate-55 dark:hover:bg-slate-900 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Floating Row Actions Popover */}
                      {activeMenuId === app._id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-4 mt-1 w-44 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl shadow-xl z-25 overflow-hidden divide-y divide-slate-100 dark:divide-slate-850 text-left">
                            <div className="py-1">
                              <button
                                onClick={() => { setSelectedApproval(app); setDrawerTab("store"); setIsDrawerOpen(true); setActiveMenuId(null); }}
                                className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-850 flex items-center gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-400" />
                                View Application
                              </button>
                              
                              {app.status === "Pending" && (
                                <>
                                  <button
                                    onClick={() => { setSelectedApproval(app); setIsApproveOpen(true); setActiveMenuId(null); }}
                                    className="w-full px-4 py-1.5 text-xs text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/10 flex items-center gap-1.5 font-semibold"
                                  >
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                    Approve Store
                                  </button>
                                  <button
                                    onClick={() => { setSelectedApproval(app); setIsRejectOpen(true); setActiveMenuId(null); }}
                                    className="w-full px-4 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/10 flex items-center gap-1.5 font-semibold"
                                  >
                                    <XCircle className="w-3.5 h-3.5 text-rose-500" />
                                    Reject Store
                                  </button>
                                </>
                              )}
                            </div>
                            
                            <div className="py-1">
                              <button
                                onClick={() => { handleDownloadAllDocs(app._id, app.storeName); setActiveMenuId(null); }}
                                className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-855 flex items-center gap-1.5"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-400" />
                                Download Zip
                              </button>
                              <button
                                onClick={() => { setSelectedApproval(app); setIsContactOpen(true); setActiveMenuId(null); }}
                                className="w-full px-4 py-1.5 text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-55 dark:hover:bg-slate-855 flex items-center gap-1.5"
                              >
                                <User className="w-3.5 h-3.5 text-slate-400" />
                                Contact Manager
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* PAGINATION FOOTER */}
        {!loading && approvals.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-850 pt-3 mt-1.5 text-xs font-semibold text-slate-500">
            <span>
              Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, totalCount)} of {totalCount} applications
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-855 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4.5 h-4.5" />
              </button>
              <span className="text-slate-800 dark:text-slate-200">Page {page} of {Math.ceil(totalCount / limit) || 1}</span>
              <button
                onClick={() => setPage((prev) => Math.min(prev + 1, Math.ceil(totalCount / limit)))}
                disabled={page >= Math.ceil(totalCount / limit)}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-55 dark:hover:bg-slate-855 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 1. APPLICATION DETAILS DRAWER */}
      <ApprovalDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        approval={selectedApproval}
      />

      {/* 2. APPROVE MODAL */}
      <ApproveModal
        isOpen={isApproveOpen}
        onClose={() => { setIsApproveOpen(false); setSelectedApproval(null); }}
        onConfirm={handleApproveConfirm}
        approval={selectedApproval}
      />

      {/* 3. REJECT MODAL */}
      <RejectModal
        isOpen={isRejectOpen}
        onClose={() => { setIsRejectOpen(false); setSelectedApproval(null); }}
        onConfirm={handleRejectConfirm}
        approval={selectedApproval}
      />

      {/* 4. CONTACT MANAGER POPUP */}
      <ContactManagerModal
        isOpen={isContactOpen}
        onClose={() => { setIsContactOpen(false); setSelectedApproval(null); }}
        manager={selectedApproval ? { name: selectedApproval.managerName, phone: selectedApproval.phone, email: selectedApproval.email } : null}
      />

      {/* Toast Notification Banner */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl border shadow-xl flex items-center gap-2 animate-bounce ${
          toast.type === "error"
            ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200"
            : toast.type === "info"
              ? "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 border-blue-200"
              : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-650 dark:text-emerald-400 border-emerald-200"
        }`}>
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

    </div>
  )
}
