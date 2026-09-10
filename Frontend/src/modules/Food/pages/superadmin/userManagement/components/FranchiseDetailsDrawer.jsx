import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  User,
  Store,
  MapPin,
  TrendingUp,
  ShieldAlert,
  ClipboardList,
  Mail,
  Phone,
  Calendar,
  Layers,
  ArrowUpRight,
  TrendingDown,
  Clock,
  Briefcase
} from "lucide-react"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts"



export default function FranchiseDetailsDrawer({ isOpen, onClose, admin }) {
  const [activeTab, setActiveTab] = useState("Personal")

  if (!admin) return null
  const tabs = [
    { name: "Personal", icon: User },
    { name: "Franchise", icon: Store }
  ]

  // Reusable custom chart tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-950 text-white dark:bg-zinc-800 p-3 rounded-xl border border-zinc-700/50 shadow-xl text-[10px] font-bold">
          <p className="opacity-60">{label}</p>
          <p className="text-[var(--primary)] mt-1">Revenue: ₹{payload[0].value.toLocaleString()}</p>
          {payload[1] && <p className="text-emerald-400 mt-0.5">Orders: {payload[1].value}</p>}
        </div>
      )
    }
    return null
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] cursor-pointer"
          />          {/* Sliding Details Drawer Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm md:max-w-md bg-zinc-50 dark:bg-zinc-955 border-l border-zinc-150 dark:border-zinc-850 z-[105] shadow-2xl flex flex-col h-full"
          >
            {/* Drawer Header */}
            <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[var(--primary)]/20 to-[var(--primary)]/5 text-[var(--primary)] flex items-center justify-center font-extrabold text-xs border border-[var(--primary)]/20 shadow-inner">
                  {admin.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-50 leading-tight">
                    {admin.name}
                  </h3>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span>{admin.id}</span>
                    <span>•</span>
                    <span className="font-bold text-zinc-650 text-zinc-700 dark:text-zinc-350 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {admin.franchiseName}
                    </span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 active:scale-95 transition-all cursor-pointer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Horizontal Tabs Row */}
            <div className="bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-855 flex items-center gap-1 overflow-x-auto pb-0 px-3 py-1.5 flex-shrink-0 scrollbar-none select-none">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.name
                return (
                  <button
                    key={tab.name}
                    onClick={() => setActiveTab(tab.name)}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all flex-shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon size={12} className="stroke-[2.2]" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Main Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
              <AnimatePresence mode="wait">
                {/* TAB 1: PERSONAL INFORMATION */}
                {activeTab === "Personal" && (
                  <motion.div
                    key="Personal"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3.5 space-y-4 shadow-sm">
                      <h4 className="text-[10px] font-extrabold text-[var(--primary)] uppercase tracking-wider">
                        Personal Info Details
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 text-zinc-400 rounded-xl">
                            <Mail size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-400 font-semibold">Email Address</p>
                            <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{admin.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 text-zinc-400 rounded-xl">
                            <Phone size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-400 font-semibold">Phone Number</p>
                            <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{admin.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 text-zinc-400 rounded-xl">
                            <MapPin size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-400 font-semibold">Full Address</p>
                            <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                              {admin.address || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 text-zinc-400 rounded-xl">
                            <MapPin size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-400 font-semibold">Region Information</p>
                            <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                              {admin.zoneName ? `${admin.zoneName}, ${admin.regionName}` : "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 text-zinc-400 rounded-xl">
                            <ClipboardList size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-400 font-semibold">GST Number</p>
                            <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">
                              {admin.gstNumber || "N/A"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 text-zinc-400 rounded-xl">
                            <Calendar size={14} />
                          </div>
                          <div>
                            <p className="text-[9px] text-zinc-400 font-semibold">Date Registered</p>
                            <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{admin.joinedDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-4">
                      <h4 className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                        Operational Status
                      </h4>
                      <div className="flex items-center gap-4 pt-1">
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                            admin.status === "ACTIVE"
                              ? "bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30"
                              : admin.status === "INACTIVE"
                              ? "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
                              : "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30"
                          }`}
                        >
                          {admin.status}
                        </span>
                        <p className="text-[9px] text-zinc-400 font-medium leading-normal">
                          {admin.status === "ACTIVE"
                            ? "This administrator is currently active. All stores under their brand can process transactions and listings."
                            : admin.status === "INACTIVE"
                            ? "This administrator is currently disabled. Stores will remain listed but no modifications are allowed."
                            : "Account suspended due to policy violations. All consumer store listings are hidden."}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: FRANCHISE DETAILS */}
                {activeTab === "Franchise" && (
                  <motion.div
                    key="Franchise"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4"
                  >
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-3.5 space-y-4 shadow-sm">
                      <h4 className="text-[10px] font-extrabold text-[var(--primary)] uppercase tracking-wider">
                        Franchise Configuration
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                          <p className="text-[9px] text-zinc-400 font-semibold">Franchise Type</p>
                          <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">{admin.type}</p>
                        </div>

                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                          <p className="text-[9px] text-zinc-400 font-semibold">Total Stores Limit</p>
                          <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                            {admin.totalStores} {admin.totalStores === 1 ? "Store" : "Stores"}
                          </p>
                        </div>
                      </div>

                      <h4 className="text-[10px] font-extrabold text-[var(--primary)] uppercase tracking-wider pt-2">
                        Contract & Financial Details
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                          <p className="text-[9px] text-zinc-400 font-semibold">Franchise Duration</p>
                          <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                            {admin.franchiseDuration ? `${admin.franchiseDuration} Years` : "3 Years"}
                          </p>
                        </div>

                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                          <p className="text-[9px] text-zinc-400 font-semibold">Total Franchise Cost</p>
                          <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                            {admin.franchiseCost !== "" && admin.franchiseCost !== undefined ? `₹${Number(admin.franchiseCost).toLocaleString()}` : "—"}
                          </p>
                        </div>

                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-800 rounded-2xl">
                          <p className="text-[9px] text-zinc-400 font-semibold">Paid Amount</p>
                          <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                            {admin.paidAmount !== "" && admin.paidAmount !== undefined ? `₹${Number(admin.paidAmount).toLocaleString()}` : "—"}
                          </p>
                        </div>

                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-955 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                          <p className="text-[9px] text-zinc-400 font-semibold">Due Amount</p>
                          <p className="text-xs font-black text-zinc-800 dark:text-zinc-200 mt-1">
                            {admin.dueAmount !== "" && admin.dueAmount !== undefined ? `₹${Number(admin.dueAmount).toLocaleString()}` : "—"}
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-start gap-3 bg-zinc-50/50 dark:bg-zinc-900/50">
                        <ShieldAlert size={14} className="text-[var(--primary)] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">Legal Agreement & Limits</p>
                          <p className="text-[9px] text-zinc-400 font-semibold mt-1 leading-normal">
                            All franchise licenses require signed store approvals before setting up stores. Multi-Store operators are constrained to their configured limits. Request adjustments via global CMS panel.
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}


              </AnimatePresence>
            </div>

            {/* Footer buttons block */}
            <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex-shrink-0 flex items-center justify-end">
              <button
                onClick={onClose}
                className="w-full sm:w-auto px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-bold text-xs text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              >
                Close Drawer
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
