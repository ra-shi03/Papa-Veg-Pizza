import React, { useState, useMemo, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import {
  ArrowLeft,
  Search,
  ChevronDown,
  ListFilter,
  MoreVertical,
  User,
  Eye,
  Edit,
  History,
  Ban,
  UserCheck,
  X,
  Star,
  CheckCircle,
  AlertCircle
} from "lucide-react"

import EditUserProfile from "./EditUserProfile"
import OrdersTransactionModal from "./OrdersTransactionModal"
import SuspendCustomerModal from "./SuspendCustomerModal"
import UserDetailsModal from "./UserDetailsModal"

// Rich Mock Customers Data for robust filtering
const INITIAL_CUSTOMERS = [
  {
    id: "CUST-9842",
    name: "Marco Rossi",
    email: "marco.r@example.com",
    phone: "+39 333 456 7890",
    status: "ACTIVE",
    loyalty: "Gold Tier",
    orders: 14,
    spent: 1250,
    memberSince: "Oct 12, 2023",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh75eq_s9eg7xnwZQcweM7ldZvNc3ToQs4NGIReb_UgvLSGQnJfAZLHzsW-oFaE7kSdmx-5FCwFlTW4jLwsiMwSDm3LkauPnHcQNLLIHCIKbRaD4XmGQopNE_WtKDpVBKyt2HMVTctdCoOzOrplhsnwdLHrjss29Gq6m2qFyscXr-pZCd2d6MC3J_C8WeHh4BaM02aPHt-vBlRTITRokmD0AvKuG6tGel5STb4VKb2Ir2yjICGcgDs59l4ofn389Nw8XvHNJ_SQcoS"
  },
  {
    id: "CUST-7215",
    name: "Elena Vance",
    email: "elena.v@example.com",
    phone: "+39 342 112 0044",
    status: "BLOCKED",
    loyalty: "Silver Tier",
    orders: 8,
    spent: 720,
    memberSince: "Sep 15, 2023",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuA6n4i4OqmTeyK-H0oq23VRRrSr1yhXRFFvHwCKd7u_bH_34RtmKQq0_lsfGxNd4Nnd-HdPct9xcvqPFdGomJO33cw3CSJnTqYTNahxg4LFhDaNs5sf_iBcwt5_cF-21mbpQd5ivvJ_W5hvbT-jE2hWn_KLZjLMXmNkopAdMum1UwCR8pW3aUMCcy5GlRqbR1uziSRABGtiHcuGjDCQXeLGV4Dexv6oLTDnO0lIagYabizec_qJ7KCEijke0H795e-zS-dSZGWzz93B"
  },
  {
    id: "CUST-5501",
    name: "Luca Moretti",
    email: "luca.m@example.com",
    phone: "+39 321 009 8877",
    status: "SUSPENDED",
    loyalty: "Platinum Tier",
    orders: 28,
    spent: 2450,
    memberSince: "Nov 02, 2022",
    avatar: ""
  },
  {
    id: "CUST-2234",
    name: "Alice Smith",
    email: "alice.s@example.com",
    phone: "+1 234 567 8910",
    status: "ACTIVE",
    loyalty: "Platinum Tier",
    orders: 34,
    spent: 3100,
    memberSince: "Jun 04, 2022",
    avatar: ""
  },
  {
    id: "CUST-4112",
    name: "Chloe Bennett",
    email: "chloe.b@example.com",
    phone: "+1 415 982 1204",
    status: "ACTIVE",
    loyalty: "Gold Tier",
    orders: 11,
    spent: 980,
    memberSince: "Jan 20, 2024",
    avatar: ""
  },
  {
    id: "CUST-1049",
    name: "David Miller",
    email: "david.m@example.com",
    phone: "+1 617 384 9081",
    status: "SUSPENDED",
    loyalty: "Silver Tier",
    orders: 2,
    spent: 150,
    memberSince: "Feb 10, 2024",
    avatar: ""
  },
  {
    id: "CUST-8831",
    name: "Sophia Martinez",
    email: "sophia.m@example.com",
    phone: "+1 305 771 9082",
    status: "ACTIVE",
    loyalty: "Gold Tier",
    orders: 16,
    spent: 1420,
    memberSince: "Dec 01, 2023",
    avatar: ""
  }
]

export default function CustomerList() {
  const navigate = useNavigate()

  // State Management
  const [customers, setCustomers] = useState(INITIAL_CUSTOMERS)
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All Statuses")
  const [loyaltyFilter, setLoyaltyFilter] = useState("All Tiers")
  const [sortBy, setSortBy] = useState("Name A-Z")

  // Applied Filters State (updates only on "Apply")
  const [appliedFilters, setAppliedFilters] = useState({
    status: "All Statuses",
    loyalty: "All Tiers",
    sortBy: "Name A-Z"
  })
  
  // Custom Debounce Implementation for Search Bar
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, 500) // 500ms debounce delay
    return () => clearTimeout(handler)
  }, [searchQuery])
  
  // Dropdown states for premium UI toggles
  const [showStatusDropdown, setShowStatusDropdown] = useState(false)
  const [showLoyaltyDropdown, setShowLoyaltyDropdown] = useState(false)
  const [showSortDropdown, setShowSortDropdown] = useState(false)

  // Selected customer for Bottom Sheet Actions Drawer
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  
  // Selected customer for Edit Modal
  const [editingCustomer, setEditingCustomer] = useState(null)
  
  // Selected customer for History Modal
  const [historyCustomer, setHistoryCustomer] = useState(null)
  
  // Selected customer for Suspend Modal
  const [suspendingCustomer, setSuspendingCustomer] = useState(null)
  
  // Toast notifications for mock actions
  const [toast, setToast] = useState(null)

  const showToast = (message, type = "success") => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleSaveCustomer = (updatedCustomer) => {
    setCustomers((prev) => prev.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)))
    showToast(`Profile for ${updatedCustomer.name} updated successfully!`)
  }

  // Filter & Sort Logic
  const filteredAndSortedCustomers = useMemo(() => {
    return customers
      .filter((cust) => {
        // Search Filter
        const query = debouncedSearchQuery.toLowerCase()
        const matchesSearch =
          cust.name.toLowerCase().includes(query) ||
          cust.email.toLowerCase().includes(query) ||
          cust.phone.includes(query) ||
          cust.id.toLowerCase().includes(query)

        // Status Filter
        const matchesStatus =
          appliedFilters.status === "All Statuses" || cust.status === appliedFilters.status

        // Loyalty Filter
        const matchesLoyalty =
          appliedFilters.loyalty === "All Tiers" || cust.loyalty === appliedFilters.loyalty

        return matchesSearch && matchesStatus && matchesLoyalty
      })
      .sort((a, b) => {
        if (appliedFilters.sortBy === "Name A-Z") {
          return a.name.localeCompare(b.name)
        }
        if (appliedFilters.sortBy === "Name Z-A") {
          return b.name.localeCompare(a.name)
        }
        if (appliedFilters.sortBy === "Orders Count") {
          return b.orders - a.orders
        }
        if (appliedFilters.sortBy === "Revenue Spent") {
          return b.spent - a.spent
        }
        return 0
      })
  }, [customers, debouncedSearchQuery, appliedFilters])

  // Handle Apply Filters Action
  const handleApplyFilters = () => {
    setAppliedFilters({
      status: statusFilter,
      loyalty: loyaltyFilter,
      sortBy: sortBy
    })
    showToast("Filters applied successfully!", "success")
  }

  // Account suspension toggler inside list state
  const handleToggleSuspension = (id) => {
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === id) {
          const isCurrentlyActive = cust.status === "ACTIVE"
          const nextStatus = isCurrentlyActive ? "SUSPENDED" : "ACTIVE"
          showToast(
            `${cust.name}'s account is now ${nextStatus === "ACTIVE" ? "Activated" : "Suspended"}!`,
            nextStatus === "ACTIVE" ? "success" : "warning"
          )
          return { ...cust, status: nextStatus }
        }
        return cust
      })
    )
    setSelectedCustomer(null)
  }

  const handleSuspendAction = (id, reason, notes) => {
    setCustomers((prev) =>
      prev.map((cust) => {
        if (cust.id === id) {
          return { ...cust, status: "SUSPENDED" }
        }
        return cust
      })
    )
    const customerName = customers.find(c => c.id === id)?.name || id
    showToast(`${customerName}'s account has been Suspended.`, "warning")
  }

  return (
    <div className="pb-24 max-w-7xl mx-auto px-4 md:px-8">
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

      {/* Top Navigation & Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pt-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/food/superadmin/customers")}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white transition-colors cursor-pointer"
            aria-label="Back to Analysis Overview"
          >
            <ArrowLeft size={14} />
          </button>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-black dark:text-white leading-tight">
              Customer Directory
            </h1>
            <p className="text-black dark:text-white font-semibold text-xs mt-0.5">
              Manage accounts, loyalty tiers, and status configurations.
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Search & Filters Row */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center justify-between mb-4">
        {/* Search Bar Input */}
        <div className="relative md:col-span-6 lg:col-span-5 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-black dark:text-white" size={14} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, phone or ID..."
            className="w-full text-xs pl-9 pr-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-black dark:text-white focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-transparent transition-all shadow-sm placeholder-zinc-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-black dark:text-white hover:opacity-80"
            >
              <X size={12} />
            </button>
          )}
        </div>

        {/* Filters Select Dropdowns */}
        <div className="md:col-span-6 lg:col-span-7 flex flex-wrap pb-1 gap-2 w-full justify-start md:justify-end select-none z-10 relative">
          {/* Status Filter Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown)
                setShowLoyaltyDropdown(false)
                setShowSortDropdown(false)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 rounded-full text-xs font-semibold text-black dark:text-white shadow-sm transition-colors cursor-pointer"
            >
              <span>{statusFilter}</span>
              <ChevronDown size={12} className={`opacity-80 transition-transform ${showStatusDropdown ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showStatusDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowStatusDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1 w-40 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 shadow-xl z-40 p-1"
                  >
                    {["All Statuses", "ACTIVE", "BLOCKED", "SUSPENDED"].map((st) => (
                      <button
                        key={st}
                        onClick={() => {
                          setStatusFilter(st)
                          setShowStatusDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          statusFilter === st ? "text-[var(--primary)] font-bold bg-[var(--primary)]/5" : "text-black dark:text-white"
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Loyalty Tier Filter Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                setShowLoyaltyDropdown(!showLoyaltyDropdown)
                setShowStatusDropdown(false)
                setShowSortDropdown(false)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 rounded-full text-xs font-semibold text-black dark:text-white shadow-sm transition-colors cursor-pointer"
            >
              <span>{loyaltyFilter}</span>
              <ChevronDown size={12} className={`opacity-80 transition-transform ${showLoyaltyDropdown ? "rotate-180" : ""}`} />
            </button>
            <AnimatePresence>
              {showLoyaltyDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowLoyaltyDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute left-0 sm:right-0 sm:left-auto top-full mt-1 w-40 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 shadow-xl z-40 p-1"
                  >
                    {["All Tiers", "Gold Tier", "Silver Tier", "Platinum Tier"].map((t) => (
                      <button
                        key={t}
                        onClick={() => {
                          setLoyaltyFilter(t)
                          setShowLoyaltyDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          loyaltyFilter === t ? "text-[var(--primary)] font-bold bg-[var(--primary)]/5" : "text-black dark:text-white"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Sort By Filter Dropdown */}
          <div className="relative flex-shrink-0">
            <button
              onClick={() => {
                setShowSortDropdown(!showSortDropdown)
                setShowStatusDropdown(false)
                setShowLoyaltyDropdown(false)
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <ListFilter size={12} />
              <span>Sort By: {sortBy}</span>
              <ChevronDown size={12} className="opacity-80" />
            </button>
            <AnimatePresence>
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowSortDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 4, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-1 w-44 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 shadow-xl z-40 p-1"
                  >
                    {["Name A-Z", "Name Z-A", "Orders Count", "Revenue Spent"].map((sort) => (
                      <button
                        key={sort}
                        onClick={() => {
                          setSortBy(sort)
                          setShowSortDropdown(false)
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                          sortBy === sort ? "text-[var(--primary)] font-bold bg-[var(--primary)]/5" : "text-black dark:text-white"
                        }`}
                      >
                        {sort}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Apply Filters Button */}
          {(statusFilter !== appliedFilters.status || loyaltyFilter !== appliedFilters.loyalty || sortBy !== appliedFilters.sortBy) && (
            <div className="relative flex-shrink-0">
              <button
                onClick={handleApplyFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle size={12} />
                <span>Apply</span>
              </button>
            </div>
          )}

          {/* Reset Filters Button */}
          {(searchQuery || appliedFilters.status !== "All Statuses" || appliedFilters.loyalty !== "All Tiers" || appliedFilters.sortBy !== "Name A-Z" || statusFilter !== "All Statuses" || loyaltyFilter !== "All Tiers" || sortBy !== "Name A-Z") && (
            <div className="relative flex-shrink-0">
              <button
                onClick={() => {
                  setSearchQuery("")
                  setStatusFilter("All Statuses")
                  setLoyaltyFilter("All Tiers")
                  setSortBy("Name A-Z")
                  setAppliedFilters({
                    status: "All Statuses",
                    loyalty: "All Tiers",
                    sortBy: "Name A-Z"
                  })
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 rounded-full text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <History size={12} />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Customers List Directory Area */}
      <section className="space-y-2">
        {filteredAndSortedCustomers.length > 0 ? (
          <div className="grid grid-cols-1 gap-2">
            {filteredAndSortedCustomers.map((cust) => (
              <motion.div
                key={cust.id}
                layoutId={`customer-card-${cust.id}`}
                className="group bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)]/30 p-2.5 rounded-lg hover:shadow-sm transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
                  {cust.avatar ? (
                    <img
                      src={cust.avatar}
                      alt={cust.name}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-250 dark:border-zinc-800 group-hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-300 dark:from-zinc-800 dark:to-zinc-700 text-black dark:text-white flex items-center justify-center font-bold text-[10px] shadow-inner">
                      {cust.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-xs text-black dark:text-white truncate group-hover:text-[var(--primary)] transition-colors">
                      {cust.name}
                    </h4>
                    <div className="text-[9px] text-black dark:text-white font-semibold flex flex-wrap items-center gap-1.5 mt-0.5">
                      <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1 py-0.2 rounded text-black dark:text-white">
                        {cust.id}
                      </span>
                      <span className="hidden md:inline">•</span>
                      <span>{cust.email}</span>
                      <span className="hidden md:inline">•</span>
                      <span>{cust.phone}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t border-zinc-100 dark:border-zinc-800 sm:border-0 flex-shrink-0">
                  {/* Status Badge */}
                  <span
                    className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${
                      cust.status === "ACTIVE"
                        ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30"
                        : cust.status === "BLOCKED"
                        ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                        : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                    }`}
                  >
                    {cust.status}
                  </span>

                  <div className="flex flex-col text-left sm:text-right">
                    <p className="text-[9px] font-bold text-black dark:text-white">₹{cust.spent} spent</p>
                    <p className="text-[8px] text-black dark:text-white font-semibold mt-0.5">{cust.orders} orders</p>
                  </div>

                  {/* Actions eye button */}
                  <button
                    onClick={() => setSelectedCustomer(cust)}
                    className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-black dark:text-white hover:text-[var(--primary)] active:scale-90 transition-all cursor-pointer"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-black/50 dark:text-white/50 text-xs font-semibold">
            No customers found matching your criteria.
          </div>
        )}
      </section>

      <EditUserProfile
        isOpen={!!editingCustomer}
        onClose={() => setEditingCustomer(null)}
        customer={editingCustomer}
        onSave={handleSaveCustomer}
      />

      <OrdersTransactionModal
        isOpen={!!historyCustomer}
        onClose={() => setHistoryCustomer(null)}
        customer={historyCustomer}
      />

      <SuspendCustomerModal
        isOpen={!!suspendingCustomer}
        onClose={() => setSuspendingCustomer(null)}
        customer={suspendingCustomer}
        onSuspend={handleSuspendAction}
      />

      <UserDetailsModal
        isOpen={!!selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        customer={selectedCustomer}
      />
    </div>
  )
}
