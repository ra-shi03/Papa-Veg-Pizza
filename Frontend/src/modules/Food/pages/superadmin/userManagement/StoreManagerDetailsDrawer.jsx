import React, { useState, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  User,
  Store,
  MapPin,
  TrendingUp,
  ClipboardList,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  ArrowUpRight,
  MessageSquare,
  MoreVertical,
  CheckCircle,
  Clock,
  ShieldAlert,
  TrendingDown,
  Star,
  Activity,
  AlertTriangle,
  Award,
  BellRing
} from "lucide-react"
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"

// Mock database for specific detailed metrics for each manager to create an ultra high-fidelity experience
const MANAGER_DETAILS_DB = {
  "PV-882": {
    assignedStore: "Mumbai - Andheri West",
    storeId: "MH-001",
    storeGroup: "Papa Veg Mumbai",
    assignedDate: "Oct 12, 2021",
    dailyRevenue: 4280.50,
    monthlyRevenue: 124000,
    ordersCount: 142,
    rating: 4.8,
    revenueGrowth: "+12.4% vs LY",
    revenueGrowthIsPositive: true,
    revenueTrend: [
      { month: "May", revenue: 45000, orders: 110 },
      { month: "Jun", revenue: 58000, orders: 130 },
      { month: "Jul", revenue: 52000, orders: 120 },
      { month: "Aug", revenue: 76000, orders: 155 },
      { month: "Sep", revenue: 94000, orders: 180 },
      { month: "Oct", revenue: 112000, orders: 190 },
      { month: "Nov", revenue: 124000, orders: 210 }
    ],
    team: [
      { name: "Ravi Sharma", role: "Head Chef", status: "Active", email: "r.sharma@papaveg.com", avatar: "RS" },
      { name: "Neha Singh", role: "Floor Supervisor", status: "Active", email: "n.singh@papaveg.com", avatar: "NS" },
      { name: "Amit Patel", role: "Senior Courier", status: "Away", email: "a.patel@papaveg.com", avatar: "AP" },
      { name: "Priya Desai", role: "Pastry Chef", status: "Active", email: "p.desai@papaveg.com", avatar: "PD" }
    ],
    attendance: {
      presentDays: 22,
      lateCheckins: 1,
      absentDays: 0,
      history: [
        { day: "Nov 1", status: "present", checkin: "08:45 AM" },
        { day: "Nov 2", status: "present", checkin: "08:52 AM" },
        { day: "Nov 3", status: "present", checkin: "08:48 AM" },
        { day: "Nov 4", status: "present", checkin: "08:55 AM" },
        { day: "Nov 5", status: "present", checkin: "08:50 AM" },
        { day: "Nov 6", status: "weekend", checkin: "--" },
        { day: "Nov 7", status: "weekend", checkin: "--" },
        { day: "Nov 8", status: "present", checkin: "08:43 AM" },
        { day: "Nov 9", status: "present", checkin: "08:41 AM" },
        { day: "Nov 10", status: "late", checkin: "09:12 AM" },
        { day: "Nov 11", status: "present", checkin: "08:49 AM" },
        { day: "Nov 12", status: "present", checkin: "08:46 AM" }
      ]
    }
  },
  "PV-714": {
    assignedStore: "Delhi - Connaught Place",
    storeId: "DL-002",
    storeGroup: "Papa Veg Delhi",
    assignedDate: "Jan 18, 2022",
    dailyRevenue: 3150.00,
    monthlyRevenue: 92000,
    ordersCount: 110,
    rating: 4.6,
    revenueGrowth: "+4.2% vs LY",
    revenueGrowthIsPositive: true,
    revenueTrend: [
      { month: "May", revenue: 38000, orders: 90 },
      { month: "Jun", revenue: 42000, orders: 100 },
      { month: "Jul", revenue: 40000, orders: 95 },
      { month: "Aug", revenue: 61000, orders: 125 },
      { month: "Sep", revenue: 78000, orders: 145 },
      { month: "Oct", revenue: 86000, orders: 155 },
      { month: "Nov", revenue: 92000, orders: 165 }
    ],
    team: [
      { name: "Rahul Verma", role: "Head Chef", status: "Active", email: "r.verma@papaveg.com", avatar: "RV" },
      { name: "Sneha Kapoor", role: "Floor Supervisor", status: "Active", email: "s.kapoor@papaveg.com", avatar: "SK" },
      { name: "Vikram Rathore", role: "Courier", status: "Active", email: "v.rathore@papaveg.com", avatar: "VR" }
    ],
    attendance: {
      presentDays: 15,
      lateCheckins: 0,
      absentDays: 2,
      history: [
        { day: "Nov 1", status: "present", checkin: "08:55 AM" },
        { day: "Nov 2", status: "present", checkin: "08:51 AM" },
        { day: "Nov 3", status: "present", checkin: "08:58 AM" },
        { day: "Nov 4", status: "present", checkin: "08:52 AM" },
        { day: "Nov 5", status: "present", checkin: "08:57 AM" },
        { day: "Nov 6", status: "weekend", checkin: "--" },
        { day: "Nov 7", status: "weekend", checkin: "--" },
        { day: "Nov 8", status: "present", checkin: "08:50 AM" },
        { day: "Nov 9", status: "present", checkin: "08:53 AM" },
        { day: "Nov 10", status: "present", checkin: "08:56 AM" },
        { day: "Nov 11", status: "absent", checkin: "--" },
        { day: "Nov 12", status: "absent", checkin: "--" }
      ]
    }
  },
  "PV-630": {
    assignedStore: "Pune - Koregaon Park",
    storeId: "MH-003",
    storeGroup: "Papa Veg Pune",
    assignedDate: "Jun 04, 2023",
    dailyRevenue: 1200.00,
    monthlyRevenue: 34000,
    ordersCount: 54,
    rating: 4.2,
    revenueGrowth: "-8.5% vs LY",
    revenueGrowthIsPositive: false,
    revenueTrend: [
      { month: "May", revenue: 42000, orders: 85 },
      { month: "Jun", revenue: 39000, orders: 80 },
      { month: "Jul", revenue: 35000, orders: 75 },
      { month: "Aug", revenue: 37000, orders: 78 },
      { month: "Sep", revenue: 32000, orders: 65 },
      { month: "Oct", revenue: 35000, orders: 70 },
      { month: "Nov", revenue: 34000, orders: 68 }
    ],
    team: [
      { name: "Suresh Kumar", role: "Head Chef", status: "Active", email: "s.kumar@papaveg.com", avatar: "SK" },
      { name: "Anita Desai", role: "Floor Supervisor", status: "Active", email: "a.desai@papaveg.com", avatar: "AD" },
      { name: "Karan Singh", role: "Courier", status: "Suspended", email: "k.singh@papaveg.com", avatar: "KS" }
    ],
    attendance: {
      presentDays: 8,
      lateCheckins: 4,
      absentDays: 3,
      history: [
        { day: "Nov 1", status: "late", checkin: "09:15 AM" },
        { day: "Nov 2", status: "present", checkin: "08:59 AM" },
        { day: "Nov 3", status: "late", checkin: "09:20 AM" },
        { day: "Nov 4", status: "weekend", checkin: "--" },
        { day: "Nov 5", status: "weekend", checkin: "--" },
        { day: "Nov 6", status: "late", checkin: "09:05 AM" },
        { day: "Nov 7", status: "present", checkin: "08:58 AM" },
        { day: "Nov 8", status: "late", checkin: "09:12 AM" },
        { day: "Nov 9", status: "absent", checkin: "--" },
        { day: "Nov 10", status: "absent", checkin: "--" },
        { day: "Nov 11", status: "absent", checkin: "--" },
        { day: "Nov 12", status: "present", checkin: "08:50 AM" }
      ]
    }
  },
  "PV-904": {
    assignedStore: "Bangalore - Indiranagar",
    storeId: "KA-004",
    storeGroup: "Papa Veg Bangalore",
    assignedDate: "Mar 10, 2021",
    dailyRevenue: 5120.00,
    monthlyRevenue: 148000,
    ordersCount: 182,
    rating: 4.9,
    revenueGrowth: "+18.2% vs LY",
    revenueGrowthIsPositive: true,
    revenueTrend: [
      { month: "May", revenue: 98000, orders: 190 },
      { month: "Jun", revenue: 104000, orders: 200 },
      { month: "Jul", revenue: 110000, orders: 210 },
      { month: "Aug", revenue: 122000, orders: 235 },
      { month: "Sep", revenue: 135000, orders: 250 },
      { month: "Oct", revenue: 142000, orders: 270 },
      { month: "Nov", revenue: 148000, orders: 280 }
    ],
    team: [
      { name: "Sanjay Gupta", role: "Head Chef", status: "Active", email: "s.gupta@papaveg.com", avatar: "SG" },
      { name: "Pooja Hegde", role: "Floor Supervisor", status: "Active", email: "p.hegde@papaveg.com", avatar: "PH" },
      { name: "Arjun Reddy", role: "Courier", status: "Active", email: "a.reddy@papaveg.com", avatar: "AR" }
    ],
    attendance: {
      presentDays: 23,
      lateCheckins: 0,
      absentDays: 0,
      history: [
        { day: "Nov 1", status: "present", checkin: "08:42 AM" },
        { day: "Nov 2", status: "present", checkin: "08:44 AM" },
        { day: "Nov 3", status: "present", checkin: "08:40 AM" },
        { day: "Nov 4", status: "present", checkin: "08:48 AM" },
        { day: "Nov 5", status: "present", checkin: "08:45 AM" },
        { day: "Nov 6", status: "weekend", checkin: "--" },
        { day: "Nov 7", status: "weekend", checkin: "--" },
        { day: "Nov 8", status: "present", checkin: "08:41 AM" },
        { day: "Nov 9", status: "present", checkin: "08:43 AM" },
        { day: "Nov 10", status: "present", checkin: "08:42 AM" },
        { day: "Nov 11", status: "present", checkin: "08:40 AM" },
        { day: "Nov 12", status: "present", checkin: "08:45 AM" }
      ]
    }
  }
}

export default function StoreManagerDetailsDrawer({ isOpen, onClose, manager, onEdit }) {
  const [activeTab, setActiveTab] = useState("Overview")

  // Safe fallback to Marco Santoro PV-882 details
  const details = useMemo(() => {
    if (!manager) return null
    return MANAGER_DETAILS_DB[manager.id] || MANAGER_DETAILS_DB["PV-882"]
  }, [manager])

  const tabs = [
    { id: "Overview", label: "Overview", icon: User },
    { id: "Store", label: "Store", icon: Store },
    { id: "Performance", label: "Analytics", icon: TrendingUp },
    { id: "Team", label: "Staff Roster", icon: ClipboardList },
    { id: "Attendance", label: "Attendance", icon: Calendar }
  ]

  if (!manager || !details) return null

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
      case "ACTIVE":
        return "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
      case "On Leave":
      case "ON LEAVE":
        return "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-500/20"
      case "Suspended":
      case "SUSPENDED":
        return "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-500/20"
      default:
        return "bg-zinc-50 dark:bg-zinc-950/20 text-zinc-500 border border-zinc-500/20"
    }
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
          />

          {/* Sliding Drawer Container */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed inset-y-0 right-0 w-full max-w-sm md:max-w-md bg-zinc-50 dark:bg-zinc-950 border-l border-zinc-155 dark:border-zinc-855 z-[105] shadow-2xl flex flex-col h-full"
          >
            {/* Header section with profile name and main CTA */}
            <div className="px-4 py-2.5 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)]/20 to-[var(--primary)]/5 text-[var(--primary)] flex items-center justify-center font-black text-xs border border-[var(--primary)]/10 shadow-inner">
                  {manager.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h3 className="text-xs font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                    {manager.name}
                  </h3>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-505 font-semibold flex items-center gap-1.5 mt-0.5">
                    <span>{manager.id}</span>
                    <span>•</span>
                    <span>{details.storeGroup}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 active:scale-95 transition-all cursor-pointer"
                aria-label="Close drawer"
              >
                <X size={14} />
              </button>
            </div>

            {/* Navigation Tab Headers */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-850 px-3 py-1 bg-white dark:bg-zinc-900 scrollbar-none select-none flex-shrink-0 gap-1 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-bold transition-all flex-shrink-0 cursor-pointer ${
                      isActive
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    }`}
                  >
                    <Icon size={12} className="stroke-[2.2]" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Main scrollable body area */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 scrollbar-thin">
              <AnimatePresence mode="wait">
                
                {/* TAB 1: OVERVIEW */}
                {activeTab === "Overview" && (
                  <motion.div
                    key="Overview"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-4"
                  >
                    {/* General Profile Overview Card */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm flex flex-col items-center text-center">
                      <div className="relative mb-3.5">
                        {manager.avatar ? (
                          <img
                            alt={manager.name}
                            src={manager.avatar}
                            className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-4 border-zinc-50 dark:border-zinc-850 shadow-md"
                          />
                        ) : (
                          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-[var(--primary)] to-amber-500 text-white flex items-center justify-center font-bold text-base shadow-md border-4 border-zinc-50 dark:border-zinc-850">
                            {manager.name.split(" ").map(n => n[0]).join("")}
                          </div>
                        )}
                        <span className={`absolute bottom-0.5 right-0.5 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-900 shadow-sm ${
                          manager.status === "Active" ? "bg-emerald-500" : manager.status === "On Leave" ? "bg-amber-500" : "bg-rose-500"
                        }`} />
                      </div>

                      <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-50 leading-tight">
                        {manager.name}
                      </h4>
                      
                      <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider mt-1.5 ${getStatusColor(manager.status)}`}>
                        {manager.status}
                      </span>

                      {/* Contact fields list */}
                      <div className="w-full space-y-2.5 text-left pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-4">
                        <div className="flex items-center gap-2.5">
                          <Mail size={14} className="text-zinc-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</p>
                            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 truncate mt-0.5">{manager.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Phone size={14} className="text-zinc-400 flex-shrink-0" />
                          <div>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Phone number</p>
                            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 mt-0.5">{manager.phone}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Calendar size={14} className="text-zinc-400 flex-shrink-0" />
                          <div>
                            <p className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Since</p>
                            <p className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350 mt-0.5">{details.assignedDate}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Quick setting info block */}
                    <div className="p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-850 flex items-start gap-2">
                      <ShieldAlert size={14} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-200">Administrative Authority</p>
                        <p className="text-[9px] text-zinc-450 dark:text-zinc-400 leading-normal font-medium">
                          Store managers possess permission to modify store operations hours, approve local driver shifts, and initiate order refunds under ₹50.00.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: STORE ASSIGNMENT */}
                {activeTab === "Store" && (
                  <motion.div
                    key="Store"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-4"
                  >
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center flex-shrink-0">
                            <Store size={16} className="stroke-[2.2]" />
                          </div>
                          <div>
                            <h4 className="text-xs font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                              {details.assignedStore}
                            </h4>
                            <p className="text-[8px] text-zinc-400 font-bold mt-0.5">
                              ID: {details.storeId} • {details.storeGroup}
                            </p>
                          </div>
                        </div>
                        <span className="text-[8px] font-bold text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                          STORE LIVE
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 py-3 border-y border-zinc-100 dark:border-zinc-800">
                        <div>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Assigned Since</p>
                          <p className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5">
                            {details.assignedDate}
                          </p>
                        </div>
                        <div>
                          <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Daily Store Revenue</p>
                          <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                            ₹{details.dailyRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2 text-[9px] text-zinc-450 dark:text-zinc-400 font-medium leading-relaxed">
                        <MapPin size={13} className="text-zinc-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-xs text-zinc-850 dark:text-zinc-50">{details.assignedStore} Hub</p>
                          <p className="mt-0.5">101 Main Street, {details.assignedStore.split(' - ')[0]}, IN 400001</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 3: PERFORMANCE ANALYTICS */}
                {activeTab === "Performance" && (
                  <motion.div
                    key="Performance"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-4"
                  >
                    {/* Metrics Overview Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl text-center">
                        <p className="text-[8px] text-zinc-400 font-bold uppercase">Orders Count</p>
                        <p className="text-xs font-black text-[var(--primary)] mt-0.5">{details.ordersCount}</p>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl text-center">
                        <p className="text-[8px] text-zinc-400 font-bold uppercase">Revenue H1</p>
                        <p className="text-xs font-black text-zinc-800 dark:text-zinc-100 mt-0.5">
                          ₹{(details.monthlyRevenue / 1000).toFixed(0)}k
                        </p>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl text-center">
                        <p className="text-[8px] text-zinc-400 font-bold uppercase">Rating</p>
                        <p className="text-xs font-black text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center justify-center gap-0.5">
                          <Star size={10} className="fill-emerald-500 stroke-none" />
                          {details.rating}
                        </p>
                      </div>
                    </div>

                    {/* Area Growth Chart */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3">
                      <div className="flex justify-between items-center">
                        <h4 className="text-[9px] font-extrabold text-zinc-450 dark:text-zinc-355 uppercase tracking-wider flex items-center gap-1.5">
                          <Activity size={11} className="text-[var(--primary)]" />
                          H1 Revenue Growth Trend
                        </h4>
                        <span className={`text-[9px] font-black flex items-center gap-0.5 ${details.revenueGrowthIsPositive ? "text-emerald-500" : "text-rose-500"}`}>
                          {details.revenueGrowthIsPositive ? <ArrowUpRight size={10} /> : <TrendingDown size={10} />}
                          {details.revenueGrowth}
                        </span>
                      </div>

                      <div className="w-full h-36 pt-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={details.revenueTrend} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                            <defs>
                              <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" className="dark:stroke-zinc-850" />
                            <XAxis dataKey="month" tick={{ fontSize: 8, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 8, fill: "#a1a1aa" }} axisLine={false} tickLine={false} />
                            <Tooltip
                              content={({ active, payload, label }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-zinc-950 text-white dark:bg-zinc-800 px-2.5 py-1.5 rounded-lg border border-zinc-700/50 shadow-xl text-[9px] font-bold">
                                      <p className="opacity-60">{label}</p>
                                      <p className="text-[var(--primary)] mt-0.5">Sales: ₹{payload[0].value.toLocaleString()}</p>
                                      <p className="text-emerald-400 mt-0.5">Orders: {payload[0].payload.orders}</p>
                                    </div>
                                  )
                                }
                                return null
                              }}
                            />
                            <Area
                              type="monotone"
                              dataKey="revenue"
                              stroke="var(--primary)"
                              strokeWidth={2.5}
                              fillOpacity={1}
                              fill="url(#colorRevenue)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 4: TEAM OVERVIEW */}
                {activeTab === "Team" && (
                  <motion.div
                    key="Team"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-4"
                  >
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-3.5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20">
                        <h4 className="text-[9px] font-extrabold text-zinc-450 dark:text-zinc-350 uppercase tracking-widest flex items-center gap-1.5">
                          <Briefcase size={11} className="text-[var(--primary)]" />
                          Local Staff Roster
                        </h4>
                        <span className="text-[7px] font-extrabold text-zinc-400">{details.team.length} Active Members</span>
                      </div>

                      <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
                        {details.team.map((member, i) => (
                          <div key={i} className="py-2.5 px-3.5 flex items-center justify-between hover:bg-zinc-50/40 dark:hover:bg-zinc-850/30 transition-colors">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7.5 h-7.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[9px] font-bold text-zinc-650 dark:text-zinc-355 flex items-center justify-center border border-zinc-200/20 shadow-sm shrink-0">
                                {member.avatar}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[10px] font-bold text-zinc-850 dark:text-zinc-100 truncate">{member.name}</p>
                                <p className="text-[8px] text-zinc-450 font-semibold mt-0.5 truncate">{member.role} • {member.email}</p>
                              </div>
                            </div>
                            <span className={`text-[7px] font-black px-1.5 py-0.5 rounded-full ${
                              member.status === "Active"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-500/10"
                                : "bg-amber-50 dark:bg-amber-950/20 text-amber-600 border border-amber-500/10"
                            }`}>
                              {member.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 5: DETAILED ATTENDANCE */}
                {activeTab === "Attendance" && (
                  <motion.div
                    key="Attendance"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="space-y-6"
                  >
                    {/* Stats summary */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3">
                      <h4 className="text-[9px] font-extrabold text-zinc-455 uppercase tracking-widest flex items-center gap-1.5">
                        <Calendar size={11} className="text-[var(--primary)]" />
                        Check-in Analytics
                      </h4>

                      <div className="grid grid-cols-3 gap-2.5 p-2.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-850 text-center">
                        <div className="border-r border-zinc-200 dark:border-zinc-800">
                          <p className="text-sm font-black text-zinc-800 dark:text-zinc-50">{details.attendance.presentDays}</p>
                          <p className="text-[7px] text-zinc-400 font-bold uppercase mt-0.5">Present</p>
                        </div>
                        <div className="border-r border-zinc-200 dark:border-zinc-800">
                          <p className={`text-sm font-black ${details.attendance.lateCheckins > 0 ? "text-rose-500" : "text-zinc-800 dark:text-zinc-50"}`}>
                            {details.attendance.lateCheckins}
                          </p>
                          <p className="text-[7px] text-zinc-400 font-bold uppercase mt-0.5">Late</p>
                        </div>
                        <div>
                          <p className={`text-sm font-black ${details.attendance.absentDays > 0 ? "text-amber-500" : "text-zinc-800 dark:text-zinc-50"}`}>
                            {details.attendance.absentDays}
                          </p>
                          <p className="text-[7px] text-zinc-400 font-bold uppercase mt-0.5">Absences</p>
                        </div>
                      </div>

                      {/* Day block visualization */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1 h-7.5 px-1.5 bg-zinc-50 dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-850">
                          {details.attendance.history.map((record, i) => (
                            <div
                              key={i}
                              className={`flex-1 rounded-md h-5 my-auto ${
                                record.status === "present"
                                  ? "bg-emerald-500/80 hover:bg-emerald-500"
                                  : record.status === "late"
                                  ? "bg-rose-500 hover:bg-rose-600"
                                  : record.status === "weekend"
                                  ? "bg-zinc-200 dark:bg-zinc-800/85 h-2.5 opacity-60"
                                  : "bg-amber-500 hover:bg-amber-600 h-4"
                              }`}
                              title={`${record.day}: ${record.status}`}
                            />
                          ))}
                        </div>
                        <div className="flex justify-between text-[8px] font-bold text-zinc-450 px-1">
                          <span>Nov 1st</span>
                          <span>Nov 12th</span>
                        </div>
                      </div>
                    </div>

                    {/* Detailed punchcard list */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden shadow-sm">
                      <div className="px-3.5 py-2.5 border-b border-zinc-100 dark:border-zinc-800 flex items-center gap-1.5 bg-zinc-50/50 dark:bg-zinc-950/20">
                        <Clock size={11} className="text-[var(--primary)]" />
                        <h4 className="text-[9px] font-extrabold text-zinc-450 dark:text-zinc-350 uppercase tracking-widest">
                          Recent Punch Records
                        </h4>
                      </div>

                      <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
                        {details.attendance.history.slice(0, 8).map((record, i) => (
                          <div key={i} className="py-2 px-3 flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-350">{record.day}</span>
                              <span className="text-[8px] text-zinc-400">Shift standard: 09:00 AM</span>
                            </div>
                            <div className="flex items-center gap-2.5">
                              <span className="text-[10px] font-mono font-bold text-zinc-800 dark:text-zinc-200">
                                {record.checkin}
                              </span>
                              <span className={`text-[7px] font-black px-1.5 py-0.5 rounded ${
                                record.status === "present"
                                  ? "bg-green-50 dark:bg-green-950/20 text-green-600"
                                  : record.status === "late"
                                  ? "bg-rose-50 dark:bg-rose-950/20 text-rose-600 animate-pulse"
                                  : record.status === "weekend"
                                  ? "bg-zinc-100 dark:bg-zinc-850 text-zinc-400"
                                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-600"
                              }`}>
                                {record.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

            {/* Sticky Action Footer buttons */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800 flex gap-2 z-10 flex-shrink-0">
              <button
                onClick={() => {
                  window.location.href = `mailto:${manager.email}`
                }}
                className="flex-1 bg-[var(--primary)] hover:bg-[var(--primary)]/95 text-white py-1.5 rounded-lg font-bold text-xs shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare size={14} className="stroke-[2.2]" />
                <span>Message Manager</span>
              </button>
              <button className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-all cursor-pointer">
                <MoreVertical size={16} />
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
