import React, { useState } from "react"
import {
  X, User, TrendingUp, Calendar, DollarSign, Activity,
  Clock, PlusCircle, MinusCircle, AlertCircle, CalendarDays,
  CheckCircle2, MapPin, Phone, Award, Zap, Shield, Flame, Utensils
} from "lucide-react"
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip
} from "recharts"
import {
  initialStores,
  getKitchenPerformance,
  getKitchenAttendance,
  getKitchenSalary,
  getKitchenAuditLogs,
  getKitchenShifts
} from "../mockManagersData"

// Helper to assign mock skills/stations based on staff id
const getSkillsForStaff = (staffId) => {
  const seed = parseInt(staffId.split("-")[1] || 1)
  const skills = [
    ["Oven Management", "Pizza Stretching", "Ingredient Prep", "Safety & Hygiene"],
    ["Sauce Dressing", "Assembly Line Speed", "Quality Control", "Prep Work"],
    ["KDS Screen Monitoring", "Dough Kneading", "Inventory Checking", "Sanitisation"],
    ["Toppings Placements", "Portioning Control", "Fast Baking", "First-in First-out (FIFO)"],
    ["Veggie Chopping", "Waste Minimisation", "Order Sorting", "Baking Equipment Care"]
  ]
  return skills[seed % skills.length]
}

export default function ViewKitchenStaffDrawer({ isOpen, onClose, staff, defaultTab = "profile" }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [perfInterval, setPerfInterval] = useState("daily")

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  if (!isOpen || !staff) return null

  const assignedStore = initialStores.find((s) => s._id === staff.storeId)

  // Fetch sub-data sets
  const perf = getKitchenPerformance(staff.id)
  const att = getKitchenAttendance(staff.id)
  const sal = getKitchenSalary(staff.id, staff.personalDetails?.salary || 25000)
  const logs = getKitchenAuditLogs(staff.id)
  const shiftInfo = getKitchenShifts(staff.id, staff.shiftType)

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

  const skills = getSkillsForStaff(staff.id)

  return (
    <>
      {/* Backdrop restricted to content area */}
      <div
        className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Inset Drawer Page Container */}
      <div className="fixed z-50 flex flex-col bg-zinc-50 dark:bg-zinc-950 shadow-2xl transition-all duration-300 animate-slide-in-right right-0 top-[64px] bottom-0 w-full h-[calc(100vh-64px)] rounded-none border-l border-zinc-200 dark:border-zinc-800 lg:top-[80px] lg:bottom-6 lg:right-6 lg:w-[calc(100vw-312px)] lg:max-w-[1200px] lg:h-[calc(100vh-104px)] lg:rounded-2xl lg:border lg:border-zinc-200 dark:lg:border-zinc-800">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 shrink-0 lg:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <img
              src={staff.profileImage}
              alt={staff.name}
              className="w-11 h-11 rounded-xl object-cover border border-zinc-200 dark:border-zinc-850"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">{staff.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  staff.status === "Active"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                    : staff.status === "On Leave"
                      ? "bg-amber-50 dark:bg-amber-950/20 text-amber-650"
                      : "bg-red-50 dark:bg-red-950/20 text-red-650"
                }`}>
                  {staff.status}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                Employee Code: {staff.employeeCode} • Store: {assignedStore ? assignedStore.storeName : "None"} • Shift: {staff.shiftType}
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
            { id: "performance", label: "KDS Performance", icon: TrendingUp },
            { id: "attendance", label: "Attendance History", icon: Calendar },
            { id: "shift", label: "Shift Schedule", icon: Clock },
            { id: "salary", label: "Salary Details", icon: DollarSign },
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
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 text-center shadow-xs animate-scale-up">
                  <img
                    src={staff.profileImage}
                    alt={staff.name}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-zinc-200 dark:border-zinc-800 shadow-md"
                  />
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white mt-3 uppercase tracking-wider">{staff.name}</h3>
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Kitchen Staff Associate</p>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-around text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Experience</span>
                      <span className="text-[11px] font-black text-[var(--primary)] mt-0.5 block">{staff.experience}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-zinc-100 dark:bg-zinc-850" />
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Joined Date</span>
                      <span className="text-[11px] font-black text-zinc-800 dark:text-white mt-0.5 block">{formatDate(staff.joinedDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Emergency Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 shadow-xs space-y-2">
                  <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Emergency Contact</span>
                  <div className="flex gap-2 items-center text-xs font-semibold text-zinc-750 dark:text-zinc-300">
                    <Phone size={13} className="text-zinc-400 shrink-0" />
                    <p className="text-[11px]">{staff.personalDetails?.emergencyContact || "No contact listed"}</p>
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
                      <span className="text-[11px] font-extrabold text-zinc-900 dark:text-white">{staff.name}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</span>
                      <span className="text-[11px] font-extrabold">{staff.email}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Phone</span>
                      <span className="text-[11px] font-extrabold">{staff.phone}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Employee ID</span>
                      <span className="text-[11px] font-extrabold">{staff.employeeCode}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Store</span>
                      <span className="text-[11px] font-extrabold text-[var(--primary)]">{assignedStore ? assignedStore.storeName : "None"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Primary Shift</span>
                      <span className="text-[11px] font-extrabold">{staff.shiftType} Shift</span>
                    </div>
                    <div className="space-y-0.5 col-span-2">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Residential Address</span>
                      <span className="text-[11px] font-medium leading-normal flex items-start gap-1">
                        <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                        {staff.personalDetails?.address || "Address not provided"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Skills & Stations tags */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-3">
                  <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-1.5">Kitchen Stations & Skills</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-[9px] font-bold text-zinc-650 bg-zinc-50 dark:bg-zinc-950 dark:text-zinc-350 border border-zinc-150 dark:border-zinc-800 rounded-md flex items-center gap-1"
                      >
                        <Award size={9} className="text-[var(--primary)]" />
                        {skill}
                      </span>
                    ))}
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
                  { label: "Pizzas Prepared (MTD)", val: perf.pizzasPrepared, sub: "Month to date", icon: Flame, color: "text-orange-500 bg-orange-50 dark:bg-orange-950/20" },
                  { label: "Avg Cooking Time", val: `${perf.avgCookingTime} mins`, sub: "Target: < 12 mins", icon: Clock, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Quality Score Index", val: `${perf.qualityScore}%`, sub: "Target: > 90%", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "KDS Screen Ratings", val: `${(perf.qualityScore / 20).toFixed(1)}/5.0`, sub: "Kitchen Lead approved", icon: Award, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" },
                  { label: "Cancelled Orders", val: perf.cancelledOrders, sub: "Prep mistakes", icon: AlertCircle, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" }
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
                
                {/* Pizzas Prepared Trend */}
                <div className="lg:col-span-2 border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-between min-h-[300px]">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Production Output Trend</h4>
                      <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Pizzas prepared successfully across shifts</p>
                    </div>
                    <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg">
                      {["daily", "weekly", "monthly"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setPerfInterval(tab)}
                          className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold capitalize transition-all cursor-pointer ${
                            perfInterval === tab
                              ? "bg-[var(--primary)] text-white shadow-sm"
                              : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
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
                          <linearGradient id="colorDrawerPizzas" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey={perfInterval === "daily" ? "day" : "label"} fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis fontSize={8} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: 9 }} />
                        <Area type="monotone" dataKey="pizzas" stroke="var(--primary)" fillOpacity={1} fill="url(#colorDrawerPizzas)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Prep Speed Trend */}
                <div className="border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Avg Prep Speed (Weekly)</h4>
                    <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Average minutes taken per order</p>
                  </div>

                  <div className="h-[210px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={perf.trends.cooking} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="label" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis domain={[5, 15]} fontSize={8} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: 9 }} />
                        <Line type="monotone" dataKey="mins" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
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
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Attendance Rate", val: `${att.attendanceRate}%`, desc: "Required threshold: >92%", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Days Worked", val: att.workingDays, desc: "Punched-in shifts", icon: Utensils, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Late Arrivals", val: att.lateCount, desc: "Grace limit: 3 days", icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                  { label: "Approved Leaves", val: att.leavesTaken, desc: "Leaves taken MTD", icon: CalendarDays, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" },
                  { label: "Overtime (Hours)", val: `${att.overtimeHours} hrs`, desc: "Extra cooking hours", icon: Zap, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" }
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

              {/* Heatmap */}
              <div className="border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 rounded-2xl p-5 space-y-4 shadow-xs">
                <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase tracking-wider pb-2 border-b border-zinc-100 dark:border-zinc-850">
                  <span>Daily Attendance Grid (Last 30 Days)</span>
                  <span>Left (Oldest) → Right (Today)</span>
                </div>

                <div className="grid grid-cols-10 md:grid-cols-15 gap-2 bg-zinc-50/50 dark:bg-zinc-950/30 p-5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                  {att.calendarLogs.map((log, idx) => (
                    <div
                      key={idx}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-[10px] font-black cursor-pointer transition-all duration-300 hover:scale-105 shadow-inner ${
                        attColors[log.status] || "bg-zinc-200"
                      }`}
                      title={`${formatDate(log.date)}: ${log.status} (In: ${log.checkIn}, Out: ${log.checkOut})`}
                    >
                      <span>{idx + 1}</span>
                    </div>
                  ))}
                </div>

                {/* Key indicators */}
                <div className="flex flex-wrap items-center justify-center gap-5 text-[9px] font-bold text-zinc-500">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500" />
                    <span>Present (On Time)</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-amber-500" />
                    <span>Late Arrival</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-blue-500" />
                    <span>Approved Leave</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500" />
                    <span>Absent</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SHIFT SCHEDULE */}
          {activeTab === "shift" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Current Shift Card */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="flex items-center gap-2 text-zinc-900 dark:text-white font-extrabold text-xs uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    <Clock size={14} className="text-[var(--primary)]" />
                    Current Scheduled Shift
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Shift Name</span>
                      <span className="text-sm font-black text-[var(--primary)] mt-0.5 block">{shiftInfo.current.type} Shift</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Start Time</span>
                        <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{shiftInfo.current.start}</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">End Time</span>
                        <span className="text-xs font-extrabold text-zinc-800 dark:text-zinc-200">{shiftInfo.current.end}</span>
                      </div>
                    </div>

                    <div>
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Working Days Checklist</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                          const isWorking = staff.weeklyDays.includes(day)
                          return (
                            <span
                              key={day}
                              className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                isWorking
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 border border-emerald-100 dark:border-emerald-900/30"
                                  : "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 border border-zinc-150 dark:border-zinc-850 line-through"
                              }`}
                            >
                              {day.slice(0, 3)}
                            </span>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shift History Timeline */}
                <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-4">
                  <div className="text-zinc-900 dark:text-white font-extrabold text-xs uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    Shift Assignment History
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-850 text-[9px] font-bold text-zinc-450 uppercase tracking-wider">
                          <th className="px-4 py-2.5">Time Period</th>
                          <th className="px-4 py-2.5">Shift Type</th>
                          <th className="px-4 py-2.5">Outlet Assigned</th>
                          <th className="px-4 py-2.5 text-right">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-[11px] text-zinc-700 dark:text-zinc-350">
                        {shiftInfo.history.map((hist, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25">
                            <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-white">{hist.period}</td>
                            <td className="px-4 py-2.5 font-semibold">{hist.shiftType} Shift</td>
                            <td className="px-4 py-2.5 font-semibold text-zinc-500">{hist.storeCode} ({assignedStore?.city || "Indore"})</td>
                            <td className="px-4 py-2.5 text-right">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                hist.status === "Active"
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 border border-emerald-100 dark:border-emerald-900/30"
                                  : "bg-zinc-50 dark:bg-zinc-950 text-zinc-400 border border-zinc-150 dark:border-zinc-850"
                              }`}>
                                {hist.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 5: SALARY */}
          {activeTab === "salary" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  { label: "Base Salary (Monthly)", val: `₹${sal.monthlySalary.toLocaleString("en-IN")}`, desc: "Contract amount", icon: PlusCircle, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Incentive/Bonus", val: `₹${sal.bonus.toLocaleString("en-IN")}`, desc: "Speed & hygiene bonus", icon: PlusCircle, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Deductions", val: `₹${sal.deductions.toLocaleString("en-IN")}`, desc: "Unpaid leaves/TDS", icon: MinusCircle, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
                  { label: "Net Payable", val: `₹${sal.netSalary.toLocaleString("en-IN")}`, desc: "Credited to bank", icon: CheckCircle2, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" }
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
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Salary Payout Ledger</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-850 text-[9px] font-bold text-zinc-450 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Payout Month</th>
                        <th className="px-4 py-2.5">Base Salary</th>
                        <th className="px-4 py-2.5">Bonus / Incentives</th>
                        <th className="px-4 py-2.5">Deductions</th>
                        <th className="px-4 py-2.5">Net Disbursed</th>
                        <th className="px-4 py-2.5 text-right">Payout Status</th>
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

          {/* TAB 6: ACTIVITY LOGS */}
          {activeTab === "activity" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-6 animate-fade-in">
              <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-1.5">Kitchen Staff Activity Timeline</h4>
              
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
