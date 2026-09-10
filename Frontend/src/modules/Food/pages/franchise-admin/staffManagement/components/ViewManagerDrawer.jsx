import React, { useState } from "react"
import {
  X, User, TrendingUp, Calendar, DollarSign, Activity,
  ShoppingBag, Clock, Star, Target, Shield, MapPin, Phone,
  PlusCircle, MinusCircle, AlertCircle, FileCheck, CalendarDays,
  CheckCircle2
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from "recharts"
import {
  initialStores,
  getManagerPerformance,
  getManagerAttendance,
  getManagerSalary,
  getManagerAuditLogs
} from "../mockManagersData"

export default function ViewManagerDrawer({ isOpen, onClose, manager, defaultTab = "profile" }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [perfInterval, setPerfInterval] = useState("daily") // daily | weekly | monthly

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  if (!isOpen || !manager) return null

  const assignedStore = initialStores.find((s) => s._id === manager.storeId)

  // Fetch sub-data sets
  const perf = getManagerPerformance(manager.id)
  const att = getManagerAttendance(manager.id)
  const sal = getManagerSalary(manager.id, manager.personalDetails?.salary || 45000)
  const logs = getManagerAuditLogs(manager.id)

  const activeChartData = perfInterval === "daily"
    ? perf.trends.daily
    : perfInterval === "weekly"
      ? perf.trends.weekly
      : perf.trends.monthly

  // Helper date formatter
  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  // Attendance block styles
  const attColors = {
    Present: "bg-emerald-500 text-white",
    Late: "bg-amber-500 text-white",
    Leave: "bg-blue-500 text-white",
    Absent: "bg-rose-500 text-white"
  }

  return (
    <>
      {/* Backdrop restricted to content area */}
      <div
        className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Inset Drawer Page Container */}
      <div className="fixed z-50 flex flex-col bg-zinc-50 dark:bg-zinc-950 shadow-2xl transition-all duration-300 animate-slide-in-right right-0 top-[64px] bottom-0 w-full h-[calc(100vh-64px)] rounded-none border-l border-zinc-200 dark:border-zinc-800 lg:top-[80px] lg:bottom-6 lg:right-6 lg:w-[calc(100vw-312px)] lg:max-w-[1200px] lg:h-[calc(100vh-104px)] lg:rounded-2xl lg:border lg:border-zinc-200">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 shrink-0 lg:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <img
              src={manager.profileImage}
              alt={manager.name}
              className="w-11 h-11 rounded-xl object-cover border border-zinc-200 dark:border-zinc-850"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">{manager.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  manager.status === "Active"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                    : manager.status === "On Leave"
                      ? "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                      : "bg-red-50 dark:bg-red-950/20 text-red-650"
                }`}>
                  {manager.status}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                Employee Code: {manager.employeeCode} • Store Assignment: {assignedStore ? assignedStore.storeName : "None"}
              </p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs bar */}
        <div className="flex bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 px-4 gap-1 shrink-0 overflow-x-auto scrollbar-none">
          {[
            { id: "profile", label: "Profile", icon: User },
            { id: "performance", label: "Performance", icon: TrendingUp },
            { id: "attendance", label: "Attendance Ledger", icon: Calendar },
            { id: "salary", label: "Salary Records", icon: DollarSign },
            { id: "activity", label: "Activity Logs", icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-200 dark:hover:text-zinc-350"
                }`}
              >
                <Icon size={13} className={isActive ? "text-[var(--primary)]" : "text-zinc-400"} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab content area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in">
              {/* Left card */}
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 text-center shadow-xs">
                  <img
                    src={manager.profileImage}
                    alt={manager.name}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-zinc-200 dark:border-zinc-800 shadow-md"
                  />
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white mt-3 uppercase tracking-wider">{manager.name}</h3>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Franchise Store Manager</p>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-around text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Experience</span>
                      <span className="text-[11px] font-black text-[var(--primary)] mt-0.5 block">{manager.experience}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-zinc-100 dark:bg-zinc-800" />
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Joined Date</span>
                      <span className="text-[11px] font-black text-zinc-800 dark:text-white mt-0.5 block">{formatDate(manager.joinedDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 shadow-xs space-y-2">
                  <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Emergency Contact</span>
                  <div className="flex gap-2 items-center text-xs font-semibold text-zinc-750 dark:text-zinc-300">
                    <Phone size={13} className="text-zinc-400 shrink-0" />
                    <p className="text-[11px]">{manager.personalDetails?.emergencyContact || "No contact listed"}</p>
                  </div>
                </div>
              </div>

              {/* Right column details */}
              <div className="md:col-span-2 space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-1.5">Employment Profile Overview</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Full Name</span>
                      <span className="text-[11px] font-extrabold text-zinc-900 dark:text-white">{manager.name}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</span>
                      <span className="text-[11px] font-extrabold">{manager.email}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Phone</span>
                      <span className="text-[11px] font-extrabold">{manager.phone}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Employee ID</span>
                      <span className="text-[11px] font-extrabold">{manager.employeeCode}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Store</span>
                      <span className="text-[11px] font-extrabold text-[var(--primary)]">{assignedStore ? assignedStore.storeName : "None"}</span>
                    </div>
                    <div className="space-y-0.5 col-span-2">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Home Address</span>
                      <span className="text-[11px] font-medium leading-normal flex items-start gap-1">
                        <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                        {manager.personalDetails?.address || "Address not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permissions Credentials tags */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-1.5">Granted Access Permissions</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {manager.permissions && manager.permissions.length > 0 ? (
                      manager.permissions.map((perm) => (
                        <span
                          key={perm}
                          className="px-2.5 py-1 text-[9px] font-bold text-zinc-650 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-350 border border-zinc-150 dark:border-zinc-800 rounded-md flex items-center gap-1"
                        >
                          <Shield size={9} className="text-[var(--primary)]" />
                          {perm.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-zinc-400 font-semibold italic">No custom permissions granted. Manager has base read access only.</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERFORMANCE */}
          {activeTab === "performance" && (
            <div className="space-y-6 animate-fade-in">
              {/* Performance indicators */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Orders Managed Today", val: Math.floor(perf.ordersHandled / 7), sub: "Daily target met", icon: ShoppingBag, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Total Orders Managed", val: perf.ordersHandled, sub: "Month to date", icon: FileCheck, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Avg Prep Time", val: `${perf.avgPrepTime} mins`, sub: "Store average: 15m", icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                  { label: "Customer Feedback Rating", val: `${perf.customerRating}★`, sub: "4.7★ Overall", icon: Star, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" },
                  { label: "Inventory Accuracy", val: `${perf.inventoryAccuracy}%`, sub: "Healthy level", icon: Target, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-3 shadow-xs flex flex-col justify-between min-h-[85px]">
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-0.5">{stat.label}</span>
                      <span className="text-sm font-black text-zinc-800 dark:text-white">{stat.val}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 mt-1 pt-1 text-[8px] font-bold text-zinc-400">
                      <span>{stat.sub}</span>
                      <div className={`p-0.5 rounded ${stat.color}`}>
                        <stat.icon size={11} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recharts trend graphs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Orders trend chart */}
                <div className="lg:col-span-2 border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-between min-h-[300px]">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Orders Managed Trend</h4>
                      <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Orders processed successfully by manager's store outlet</p>
                    </div>
                    <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg">
                      {["daily", "weekly", "monthly"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setPerfInterval(tab)}
                          className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold capitalize transition-all cursor-pointer ${
                            perfInterval === tab
                              ? "bg-[var(--primary)] text-white shadow-sm"
                              : "text-zinc-500 hover:text-zinc-700"
                          }`}
                        >
                          {tab}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-[210px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeChartData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorDrawerOrders" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey={perfInterval === "daily" ? "day" : "label"} fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis fontSize={8} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: 9 }} />
                        <Area type="monotone" dataKey="orders" stroke="var(--primary)" fillOpacity={1} fill="url(#colorDrawerOrders)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Area Customer rating trend */}
                <div className="border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Store Rating Trend</h4>
                    <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Average customer feedback score index</p>
                  </div>

                  <div className="h-[210px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={perf.trends.rating} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="label" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis domain={[3.0, 5.0]} fontSize={8} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: 9 }} />
                        <Line type="monotone" dataKey="rating" stroke="#eab308" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 3: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Attendance Rate", val: `${att.attendanceRate}%`, desc: "Required limit: >90%", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Late Days", val: att.lateCount, desc: "Late punch-ins", icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                  { label: "Leaves Approved", val: att.leavesTaken, desc: "Paid sick/vacation", icon: CalendarDays, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Absents", val: att.absentCount, desc: "Unexcused absents", icon: AlertCircle, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[85px]">
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-0.5">{stat.label}</span>
                      <span className="text-sm font-black text-zinc-800 dark:text-white">{stat.val}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 mt-1 pt-1 text-[8px] font-bold text-zinc-400">
                      <span>{stat.desc}</span>
                      <div className={`p-0.5 rounded ${stat.color}`}>
                        <stat.icon size={11} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Calendar heatmap block */}
              <div className="border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-850">
                  <span>Attendance History (Last 30 Days)</span>
                  <span>Left (Oldest) → Right (Today)</span>
                </div>

                <div className="grid grid-cols-10 md:grid-cols-15 gap-2 bg-zinc-50/50 dark:bg-zinc-950/30 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                  {att.calendarLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-black cursor-pointer transition-all duration-300 hover:scale-105 shadow-inner ${
                        attColors[log.status] || "bg-zinc-200"
                      }`}
                      title={`${formatDate(log.date)}: ${log.status}`}
                    >
                      <span>{idx + 1}</span>
                    </div>
                  ))}
                </div>

                {/* Indicators key */}
                <div className="flex items-center justify-center gap-5 text-[9px] font-bold text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Present</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500" />
                    <span>Late Arrival</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500" />
                    <span>On Approved Leave</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500" />
                    <span>Absent</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SALARY */}
          {activeTab === "salary" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Base Salary (Monthly)", val: `₹${sal.monthlySalary.toLocaleString("en-IN")}`, desc: "Agreed contract", icon: PlusCircle, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Bonus Earned", val: `₹${sal.bonus.toLocaleString("en-IN")}`, desc: "Performance incentive", icon: PlusCircle, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Deductions", val: `₹${sal.deductions.toLocaleString("en-IN")}`, desc: "Leaves/Taxes", icon: MinusCircle, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
                  { label: "Net Salary Payable", val: `₹${sal.netSalary.toLocaleString("en-IN")}`, desc: "Credited to bank", icon: FileCheck, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 shadow-xs flex flex-col justify-between min-h-[85px]">
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-0.5">{stat.label}</span>
                      <span className="text-sm font-black text-zinc-800 dark:text-white">{stat.val}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 mt-1 pt-1 text-[8px] font-bold text-zinc-400">
                      <span>{stat.desc}</span>
                      <div className={`p-0.5 rounded ${stat.color}`}>
                        <stat.icon size={11} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Salary History Table */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Salary Payout History</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-850 text-[9px] font-bold text-zinc-450 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Month</th>
                        <th className="px-4 py-2.5">Base Salary</th>
                        <th className="px-4 py-2.5">Bonus</th>
                        <th className="px-4 py-2.5">Deduction</th>
                        <th className="px-4 py-2.5">Net Disbursed</th>
                        <th className="px-4 py-2.5 text-right">Payment Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-[11px] text-zinc-700 dark:text-zinc-350">
                      {sal.history.map((record, index) => (
                        <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25">
                          <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-white">{record.month}</td>
                          <td className="px-4 py-2.5 font-semibold">₹{record.baseSalary.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 font-semibold text-emerald-600">+₹{record.bonus.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 font-semibold text-rose-500">-₹{record.deduction.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 font-black text-zinc-900 dark:text-white">₹{record.net.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
                              {record.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ACTIVITY LOGS */}
          {activeTab === "activity" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-6 animate-fade-in">
              <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-1.5">Manager Activity Timeline</h4>
              
              <div className="relative border-l-2 border-zinc-100 dark:border-zinc-850 ml-3 pl-5 space-y-6">
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    {/* Timeline dot */}
                    <span className="absolute -left-[27px] top-0 w-3 h-3 rounded-full border bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                    </span>
                    
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold text-zinc-400 block">{log.date}</span>
                      <span className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200">{log.action}</span>
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold leading-normal">{log.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>
    </>
  )
}
