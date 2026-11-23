import React, { useState, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  Search,
  ChevronDown,
  Eye,
  CheckCircle,
  AlertCircle,
  Download,
  Filter,
  RefreshCw
} from "lucide-react"
import UserDetailsModal from "./UserDetailsModal"

// Rich Customers Data matching UserProfile and CustomerList
const INITIAL_CUSTOMERS = []

export default function CustomerAnalysis() {
  const navigate = useNavigate()

  // State Management
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [showExportDropdown, setShowExportDropdown] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedCustomer, setSelectedCustomer] = useState(null)

  // Filter States
  const [tempFilters, setTempFilters] = useState({
    orderDate: "",
    joiningDate: "",
    status: "All",
    sortBy: "",
    chooseFirst: ""
  })

  // Show Toast helper
  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Handle Reset Filters
  const handleResetFilters = () => {
    const reset = {
      orderDate: "",
      joiningDate: "",
      status: "All",
      sortBy: "",
      chooseFirst: ""
    }
    setTempFilters(reset)
    setSearchQuery("")
    showToast("Filters and search reset.", "success")
  }

  // Toggle active status
  const handleToggleStatus = (id) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nextStatus = c.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE"
          showToast(`${c.name} is now ${nextStatus === "ACTIVE" ? "Active" : "Inactive"}.`)
          return { ...c, status: nextStatus }
        }
        return c
      })
    )
  }

  // Filter and Sort Customers logic
  const filteredCustomers = useMemo(() => {
    let result = [...customers]

    // 1. Search filter (interactive as you type)
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.id.toLowerCase().includes(q)
      )
    }

    // 2. Order date filter (based on tempFilters)
    if (tempFilters.orderDate) {
      const filterDateStr = new Date(tempFilters.orderDate).toDateString()
      result = result.filter((c) =>
        c.ordersList && c.ordersList.some((o) => new Date(o.date).toDateString() === filterDateStr)
      )
    }

    // 3. Joining date filter (based on tempFilters)
    if (tempFilters.joiningDate) {
      const filterDateStr = new Date(tempFilters.joiningDate).toDateString()
      result = result.filter(
        (c) => new Date(c.memberSince).toDateString() === filterDateStr
      )
    }

    // 4. Status filter (based on tempFilters)
    if (tempFilters.status && tempFilters.status !== "All") {
      result = result.filter((c) => c.status === tempFilters.status)
    }

    // 5. Sorting (based on tempFilters)
    if (tempFilters.sortBy) {
      if (tempFilters.sortBy === "Name A-Z") {
        result.sort((a, b) => a.name.localeCompare(b.name))
      } else if (tempFilters.sortBy === "Name Z-A") {
        result.sort((a, b) => b.name.localeCompare(a.name))
      } else if (tempFilters.sortBy === "Total Orders") {
        result.sort((a, b) => b.orders - a.orders)
      } else if (tempFilters.sortBy === "Total Order Amount") {
        result.sort((a, b) => b.spent - a.spent)
      }
    }

    // 6. Slicing/Limit filter (based on tempFilters)
    if (tempFilters.chooseFirst) {
      const count = parseInt(tempFilters.chooseFirst, 10)
      if (!isNaN(count) && count > 0) {
        result = result.slice(0, count)
      }
    }

    return result
  }, [customers, searchQuery, tempFilters])

  // Export functions
  const handleExportCSV = () => {
    const headers = [
      "SL",
      "Customer ID",
      "Name",
      "Email",
      "Phone",
      "Total Orders",
      "Total Order Amount (INR)",
      "Joining Date",
      "Status"
    ]
    const rows = filteredCustomers.map((c, index) => [
      index + 1,
      c.id,
      c.name,
      c.email,
      c.phone,
      c.orders,
      c.spent,
      c.memberSince,
      c.status
    ])

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((val) => `"${val}"`).join(","))].join("\n")

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement("a")
    link.setAttribute("href", encodedUri)
    link.setAttribute("download", `customer_export_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    setShowExportDropdown(false)
    showToast("CSV exported successfully!", "success")
  }

  const handleExportExcel = () => {
    // Generate Excel/XML or trigger CSV download with .xls extension
    handleExportCSV()
  }

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto w-full select-none">
      {/* Toast Alert Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 16, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-xl bg-zinc-900 text-white dark:bg-zinc-800 text-xs font-bold border border-zinc-700/50"
          >
            {toast.type === "success" ? (
              <CheckCircle size={16} className="text-emerald-500" />
            ) : (
              <AlertCircle size={16} className="text-rose-500" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pt-1">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-black dark:text-white leading-tight">
            Customer Directory
          </h1>
          <p className="text-black dark:text-white font-semibold text-xs mt-0.5 opacity-80">
            Monitor registration trends, adjust parameters, and configure active states.
          </p>
        </div>
      </div>

      {/* 1. Filter Box Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3.5 mb-4">
          {/* Order Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Order Date
            </label>
            <input
              type="date"
              value={tempFilters.orderDate}
              onChange={(e) => setTempFilters({ ...tempFilters, orderDate: e.target.value })}
              className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-inner"
            />
          </div>

          {/* Customer Joining Date */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Customer Joining Date
            </label>
            <input
              type="date"
              value={tempFilters.joiningDate}
              onChange={(e) => setTempFilters({ ...tempFilters, joiningDate: e.target.value })}
              className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-inner"
            />
          </div>

          {/* Customer status */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Customer status
            </label>
            <select
              value={tempFilters.status}
              onChange={(e) => setTempFilters({ ...tempFilters, status: e.target.value })}
              className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-inner cursor-pointer"
            >
              <option value="All">Select Status</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Sort By
            </label>
            <select
              value={tempFilters.sortBy}
              onChange={(e) => setTempFilters({ ...tempFilters, sortBy: e.target.value })}
              className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-inner cursor-pointer"
            >
              <option value="">Select Customer Sort</option>
              <option value="Name A-Z">Name A-Z</option>
              <option value="Name Z-A">Name Z-A</option>
              <option value="Total Orders">Total Orders</option>
              <option value="Total Order Amount">Total Order Amount</option>
            </select>
          </div>

          {/* Choose First */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
              Choose First
            </label>
            <input
              type="number"
              placeholder="Ex: 100"
              value={tempFilters.chooseFirst}
              onChange={(e) => setTempFilters({ ...tempFilters, chooseFirst: e.target.value })}
              className="w-full text-xs p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-inner"
            />
          </div>
        </div>

        {/* Buttons Row inside Filter Box */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <button
              onClick={handleResetFilters}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold py-2 px-4 rounded-lg active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              Reset Filters
            </button>
          </div>
          <div className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
            Showing {filteredCustomers.length} of {customers.length} customers
          </div>
        </div>
      </div>

      {/* 2. Customer List & Table Card */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden">
        {/* Table Toolbar Section */}
        <div className="p-4 flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-zinc-100 dark:border-zinc-800/60">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">Customer list</h2>
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-850 dark:text-zinc-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-750">
              {filteredCustomers.length}
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder="Ex: Search by name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-850 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-inner"
              />
            </div>

            {/* Export Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowExportDropdown(!showExportDropdown)}
                className="flex items-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer bg-white dark:bg-zinc-900"
              >
                <Download size={13} className="text-zinc-400" />
                <span>Export</span>
                <ChevronDown size={12} className="opacity-80 transition-transform" />
              </button>

              {showExportDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowExportDropdown(false)} />
                  <div className="absolute right-0 mt-1 w-32 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl z-40 p-1 flex flex-col gap-0.5">
                    <button
                      onClick={handleExportCSV}
                      className="w-full text-left px-3 py-1.5 rounded text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
                    >
                      Export CSV
                    </button>
                    <button
                      onClick={handleExportExcel}
                      className="w-full text-left px-3 py-1.5 rounded text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors"
                    >
                      Export Excel
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Responsive Table Container */}
        <div className="overflow-x-auto w-full scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          <table className="w-full text-left border-collapse text-xs whitespace-nowrap">
            <thead>
              <tr className="bg-zinc-50 dark:bg-zinc-950 text-[10px] font-black text-zinc-500 dark:text-zinc-400 uppercase border-b border-zinc-150 dark:border-zinc-850 tracking-wider">
                <th className="py-3 px-4">SL</th>
                <th className="py-3 px-4">NAME</th>
                <th className="py-3 px-4">CONTACT INFORMATION</th>
                <th className="py-3 px-4">TOTAL ORDER</th>
                <th className="py-3 px-4">TOTAL ORDER AMOUNT</th>
                <th className="py-3 px-4">JOINING DATE</th>
                <th className="py-3 px-4">ACTIVE/INACTIVE</th>
                <th className="py-3 px-4 text-center">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-semibold text-zinc-700 dark:text-zinc-300">
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((cust, idx) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors"
                  >
                    {/* Serial Number */}
                    <td className="py-3 px-4 font-bold text-zinc-400">{idx + 1}</td>

                    {/* Customer Name and Avatar */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        {cust.avatar ? (
                          <img
                            src={cust.avatar}
                            alt={cust.name}
                            className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-800"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 text-black dark:text-white flex items-center justify-center font-bold text-[10px]">
                            {cust.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </div>
                        )}
                        <span
                          onClick={() => setSelectedCustomer(cust)}
                          className="font-extrabold text-zinc-900 dark:text-zinc-100 hover:text-[var(--primary)] transition-colors cursor-pointer"
                        >
                          {cust.name}
                        </span>
                      </div>
                    </td>

                    {/* Contact Information */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                        <span className="font-bold">{cust.email}</span>
                        <span>{cust.phone}</span>
                      </div>
                    </td>

                    {/* Total Order */}
                    <td className="py-3 px-4 font-extrabold">{cust.orders}</td>

                    {/* Total Order Amount */}
                    <td className="py-3 px-4 font-black text-zinc-900 dark:text-zinc-100">
                      ₹{cust.spent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>

                    {/* Joining Date */}
                    <td className="py-3 px-4 font-bold text-zinc-500">{cust.memberSince}</td>

                    {/* Active/Inactive Toggle Switch */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleStatus(cust.id)}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          cust.status === "ACTIVE"
                            ? "bg-emerald-500"
                            : "bg-zinc-300 dark:bg-zinc-700"
                        }`}
                        aria-label={`Toggle status for ${cust.name}`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            cust.status === "ACTIVE" ? "translate-x-4" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </td>

                    {/* Actions Button */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:text-[var(--primary)] transition-all cursor-pointer"
                        title="View Customer Details"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-zinc-500 dark:text-zinc-400 font-bold">
                    No customers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Details Modal Popup */}
      <UserDetailsModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  )
}
