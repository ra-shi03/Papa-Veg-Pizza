import React, { useState } from "react"
import {
  X, User, TrendingUp, Calendar, DollarSign, Activity,
  Clock, PlusCircle, MinusCircle, AlertCircle, CalendarDays,
  CheckCircle2, MapPin, Phone, Award, Zap, Shield, Truck, Navigation, FileCheck, Eye, Download, Battery, Wifi, Star
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
  getDeliveryPartnerPerformance,
  getDeliveryPartnerAttendance,
  getDeliveryPartnerWallet,
  getDeliveryPartnerLiveTracking,
  getDeliveryPartnerSalary,
  getDeliveryPartnerAuditLogs
} from "../mockManagersData"

export default function ViewDeliveryPartnerDrawer({ isOpen, onClose, rider, defaultTab = "profile" }) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const [perfInterval, setPerfInterval] = useState("daily")
  const [docList, setDocList] = useState({
    drivingLicense: { status: "Verified", expiry: "2029-12-31" },
    vehicleRC: { status: "Verified", expiry: "2032-05-15" },
    insurance: { status: "Pending", expiry: "2026-07-20" },
    aadhaar: { status: "Verified", expiry: "N/A" },
    panCard: { status: "Verified", expiry: "N/A" },
    bankProof: { status: "Verified", expiry: "N/A" }
  })

  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(defaultTab)
    }
  }, [isOpen, defaultTab])

  if (!isOpen || !rider) return null

  const assignedStore = initialStores.find((s) => s._id === rider.storeId)

  // Fetch sub-data sets
  const perf = getDeliveryPartnerPerformance(rider.id)
  const att = getDeliveryPartnerAttendance(rider.id)
  const wallet = getDeliveryPartnerWallet(rider.id)
  const live = getDeliveryPartnerLiveTracking(rider.id)
  const sal = getDeliveryPartnerSalary(rider.id, rider.personalDetails?.salary || 18000)
  const logs = getDeliveryPartnerAuditLogs(rider.id)

  const activeChartData = perfInterval === "daily"
    ? perf.trends.daily
    : perfInterval === "weekly"
      ? perf.trends.weekly
      : perf.trends.monthly

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
  }

  const attColors = {
    Present: "bg-emerald-500 text-white",
    Late: "bg-amber-500 text-white",
    Leave: "bg-blue-500 text-white",
    Absent: "bg-rose-500 text-white"
  }

  const handleDocVerify = (docKey, status) => {
    setDocList(prev => ({
      ...prev,
      [docKey]: { ...prev[docKey], status }
    }))
  };

  return (
    <>
      {/* Backdrop restricted to content area */}
      <div
        className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-40 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Inset Drawer Page Container */}
      <div className="fixed z-50 flex flex-col bg-zinc-50 dark:bg-zinc-950 shadow-2xl transition-all duration-300 animate-slide-in-right right-0 top-[64px] bottom-0 w-full h-[calc(100vh-64px)] rounded-none border-l border-zinc-200 dark:border-zinc-800 lg:top-[80px] lg:bottom-6 lg:right-6 lg:w-[calc(100vw-312px)] lg:max-w-[1400px] lg:h-[calc(100vh-104px)] lg:rounded-2xl lg:border lg:border-zinc-200 dark:lg:border-zinc-800">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 shrink-0 lg:rounded-t-2xl">
          <div className="flex items-center gap-3">
            <img
              src={rider.profileImage}
              alt={rider.name}
              className="w-11 h-11 rounded-xl object-cover border border-zinc-200 dark:border-zinc-850"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">{rider.name}</h2>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  rider.status === "Online"
                    ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                    : rider.status === "Busy"
                      ? "bg-blue-50 dark:bg-blue-955/20 text-blue-650"
                      : rider.status === "Suspended"
                        ? "bg-red-50 dark:bg-red-950/20 text-red-650"
                        : "bg-zinc-50 dark:bg-zinc-950/20 text-zinc-500"
                }`}>
                  {rider.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                  rider.availability === "Available"
                    ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800"
                    : "bg-zinc-100 dark:bg-zinc-850 text-zinc-400"
                }`}>
                  {rider.availability}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">
                Rider ID: {rider.employeeCode} • Store Hub: {assignedStore ? assignedStore.storeName : "None"} • Vehicle: {rider.vehicleType} ({rider.vehicleNumber})
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
            { id: "performance", label: "Performance Metrics", icon: TrendingUp },
            { id: "documents", label: "Documents", icon: FileCheck },
            { id: "attendance", label: "Attendance Ledger", icon: Calendar },
            { id: "wallet", label: "Wallet & Transactions", icon: DollarSign },
            { id: "live", label: "Live Tracking Map", icon: Navigation },
            { id: "salary", label: "Salary Details", icon: DollarSign },
            { id: "activity", label: "Audit Timeline", icon: Activity }
          ].map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "border-orange-600 text-orange-600 dark:border-orange-550 dark:text-orange-500"
                    : "border-transparent text-zinc-500 hover:text-zinc-700 hover:border-zinc-200 dark:hover:text-zinc-350"
                }`}
              >
                <Icon size={13} className={isActive ? "text-orange-600 dark:text-orange-500" : "text-zinc-400"} />
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
              <div className="md:col-span-1 space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 text-center shadow-xs">
                  <img
                    src={rider.profileImage}
                    alt={rider.name}
                    className="w-24 h-24 rounded-2xl object-cover mx-auto border-2 border-zinc-200 dark:border-zinc-800 shadow-md"
                  />
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white mt-3 uppercase tracking-wider">{rider.name}</h3>
                  <p className="text-[10px] text-zinc-450 font-semibold mt-0.5">Delivery Partner Associate</p>
                  
                  <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-around text-xs font-bold text-zinc-750 dark:text-zinc-300">
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Experience</span>
                      <span className="text-[11px] font-black text-orange-600 dark:text-orange-500 mt-0.5 block">{rider.experience}</span>
                    </div>
                    <div className="w-[1px] h-6 bg-zinc-100 dark:bg-zinc-850" />
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Average Rating</span>
                      <span className="text-[11px] font-black text-amber-500 mt-0.5 block flex items-center gap-0.5 justify-center">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {rider.rating}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 shadow-xs space-y-3">
                  <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Emergency Contact</span>
                  <div className="flex gap-2 items-center text-xs font-semibold text-zinc-750 dark:text-zinc-300">
                    <Phone size={13} className="text-zinc-400 shrink-0" />
                    <p className="text-[11px] font-bold">{rider.personalDetails?.emergencyContact || "No contact listed"}</p>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-855 pb-1.5">Employment Profile Overview</h4>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-zinc-750 dark:text-zinc-300">
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Full Name</span>
                      <span className="text-[11px] font-extrabold text-zinc-900 dark:text-white">{rider.name}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Email Address</span>
                      <span className="text-[11px] font-extrabold">{rider.email}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Phone</span>
                      <span className="text-[11px] font-extrabold">{rider.phone}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Rider ID</span>
                      <span className="text-[11px] font-extrabold">{rider.employeeCode}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Assigned Store Hub</span>
                      <span className="text-[11px] font-extrabold text-orange-600 dark:text-orange-500">{assignedStore ? assignedStore.storeName : "None"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Vehicle Details</span>
                      <span className="text-[11px] font-extrabold">{rider.vehicleType} ({rider.vehicleNumber})</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Aadhaar UIDAI</span>
                      <span className="text-[11px] font-extrabold">{rider.personalDetails?.aadhaarNumber || "N/A"}</span>
                    </div>
                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Driving License</span>
                      <span className="text-[11px] font-extrabold">{rider.licenseNumber || "N/A"}</span>
                    </div>
                    <div className="space-y-0.5 col-span-2">
                      <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Residential Address</span>
                      <span className="text-[11px] font-medium leading-normal flex items-start gap-1">
                        <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                        {rider.personalDetails?.address || "Address not provided"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PERFORMANCE */}
          {activeTab === "performance" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
                {[
                  { label: "Total Deliveries MTD", val: perf.totalDeliveries, sub: "Month to date", icon: Truck, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Avg Delivery Speed", val: `${perf.avgDeliveryTime} mins`, sub: "Target: <25m", icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                  { label: "Distance Covered", val: `${perf.distanceCovered} km`, sub: "MTD travel logs", icon: Navigation, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Feedback Rating", val: `${perf.avgRating}★`, sub: "Top score index", icon: Star, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" },
                  { label: "Cancellation Rate", val: `${perf.cancellationRate}%`, sub: "Target: <1%", icon: AlertCircle, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
                  { label: "MTD Earnings", val: `₹${perf.earnings.toLocaleString("en-IN")}`, sub: "Rider commissions", icon: DollarSign, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" }
                ].map((stat, i) => (
                  <div key={i} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-3 shadow-xs flex flex-col justify-between min-h-[85px]">
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-wider mb-0.5">{stat.label}</span>
                      <span className="text-sm font-black text-zinc-800 dark:text-white">{stat.val}</span>
                    </div>
                    <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-850 mt-1 pt-1 text-[8px] font-bold text-zinc-400">
                      <span className="truncate">{stat.sub}</span>
                      <div className={`p-0.5 rounded ${stat.color}`}>
                        <stat.icon size={11} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-between min-h-[300px]">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Deliveries Output Trend</h4>
                      <p className="text-[9px] text-zinc-450 font-semibold mt-0.5">Deliveries dispatched successfully</p>
                    </div>
                    <div className="flex bg-zinc-100 dark:bg-zinc-950 p-0.5 rounded-lg">
                      {["daily", "weekly", "monthly"].map((tab) => (
                        <button
                          key={tab}
                          onClick={() => setPerfInterval(tab)}
                          className={`px-2.5 py-0.5 rounded-md text-[9px] font-extrabold capitalize transition-all cursor-pointer ${
                            perfInterval === tab
                              ? "bg-orange-600 text-white shadow-sm"
                              : "text-zinc-505 hover:text-zinc-700 dark:hover:text-zinc-300"
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
                          <linearGradient id="colorDrawerDeliveries" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey={perfInterval === "daily" ? "day" : "label"} fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis fontSize={8} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: 9 }} />
                        <Area type="monotone" dataKey="deliveries" stroke="var(--primary)" fillOpacity={1} fill="url(#colorDrawerDeliveries)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 rounded-2xl p-4 flex flex-col justify-between min-h-[300px]">
                  <div>
                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Rating Score Trend</h4>
                    <p className="text-[9px] text-zinc-450 font-semibold mt-0.5">Average customer feedback score index</p>
                  </div>

                  <div className="h-[210px] w-full text-xs">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={perf.trends.rating} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                        <XAxis dataKey="label" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis domain={[3.5, 5.0]} fontSize={8} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ fontSize: 9 }} />
                        <Line type="monotone" dataKey="rating" stroke="#eab308" strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DOCUMENTS */}
          {activeTab === "documents" && (
            <div className="space-y-6 animate-fade-in">
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-xl flex gap-3 text-amber-800 dark:text-amber-450 text-xs font-semibold leading-normal animate-fade-down">
                <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5 text-amber-650" />
                <div>
                  <p className="font-extrabold uppercase tracking-wide">Document Expiries Looming</p>
                  <p className="mt-0.5 font-medium">Vehicle Insurance policy is expiring in 30 days ({formatDate(docList.insurance.expiry)}). Please upload renewed insurance copy.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: "drivingLicense", label: "Driving License (DL)", icon: Shield, type: "Motor document" },
                  { key: "vehicleRC", label: "Vehicle Registration Certificate (RC)", icon: Truck, type: "Motor document" },
                  { key: "insurance", label: "Vehicle Insurance Copy", icon: Shield, type: "Insurance policy" },
                  { key: "aadhaar", label: "Aadhaar Card Copy", icon: User, type: "National KYC" },
                  { key: "panCard", label: "PAN Card Copy", icon: FileCheck, type: "Tax identity" },
                  { key: "bankProof", label: "Cancelled Cheque / Passbook Copy", icon: DollarSign, type: "Payout Bank Proof" }
                ].map((doc) => {
                  const state = docList[doc.key]
                  if (rider.vehicleType === "Cycle" && (doc.key === "drivingLicense" || doc.key === "vehicleRC" || doc.key === "insurance")) {
                    return null; // Bicycle riders don't need motor documents
                  }
                  return (
                    <div key={doc.key} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-4 flex flex-col justify-between min-h-[170px] shadow-xs">
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[10px] font-black text-zinc-800 dark:text-white uppercase tracking-wider block">{doc.label}</span>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                            state.status === "Verified"
                              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650"
                              : state.status === "Pending"
                                ? "bg-amber-50 dark:bg-amber-955/20 text-amber-650"
                                : "bg-red-50 dark:bg-red-950/20 text-red-650"
                          }`}>
                            {state.status}
                          </span>
                        </div>
                        <span className="text-[8px] text-zinc-400 font-bold block mt-1">Expiry: {state.expiry} • {doc.type}</span>
                      </div>

                      <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-850/50 flex gap-2">
                        <button className="flex-1 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-55 dark:hover:bg-zinc-950 rounded-xl text-[10px] font-black text-zinc-700 dark:text-zinc-300 flex items-center justify-center gap-1 cursor-pointer">
                          <Eye size={11} />
                          Preview File
                        </button>
                        <button className="py-1.5 px-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-55 dark:hover:bg-zinc-950 rounded-xl text-zinc-400 hover:text-zinc-650 cursor-pointer">
                          <Download size={11} />
                        </button>
                      </div>

                      {/* Admin override actions */}
                      <div className="mt-2 flex gap-1 justify-end">
                        <button onClick={() => handleDocVerify(doc.key, "Verified")} className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-100 text-emerald-650 text-[8px] font-black uppercase cursor-pointer">Verify</button>
                        <button onClick={() => handleDocVerify(doc.key, "Rejected")} className="px-2 py-0.5 rounded bg-rose-50 hover:bg-rose-100 text-rose-650 text-[8px] font-black uppercase cursor-pointer">Reject</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* TAB 4: ATTENDANCE */}
          {activeTab === "attendance" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Attendance Rate", val: `${att.attendanceRate}%`, desc: "Target limit: >92%", icon: CheckCircle2, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Days Worked", val: att.workingDays, desc: "Punched-in days", icon: Truck, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Late Arrivals", val: att.lateCount, desc: "Late punch-ins MTD", icon: Clock, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                  { label: "Leaves Approved", val: att.leavesTaken, desc: "Leaves taken MTD", icon: CalendarDays, color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20" },
                  { label: "Total Working Hours", val: `${att.hoursWorked} hrs`, desc: "Excluding overtime", icon: Zap, color: "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20" }
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
                      title={`${formatDate(log.date)}: ${log.status} (In: ${log.checkIn}, Out: ${log.checkOut})`}
                    >
                      <span>{idx + 1}</span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-center gap-5 text-[9px] font-bold text-zinc-550">
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
                    <span>On Leave</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-rose-500" />
                    <span>Absent</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WALLET */}
          {activeTab === "wallet" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Current Balance", val: `₹${wallet.balance.toLocaleString("en-IN")}`, desc: "Available for withdrawal", icon: DollarSign, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Today's Payouts", val: `₹${wallet.todayEarnings.toLocaleString("en-IN")}`, desc: "Earned today", icon: PlusCircle, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Weekly earnings", val: `₹${wallet.weeklyEarnings.toLocaleString("en-IN")}`, desc: "Running week", icon: PlusCircle, color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20" },
                  { label: "Monthly earnings", val: `₹${wallet.monthlyEarnings.toLocaleString("en-IN")}`, desc: "Current month", icon: PlusCircle, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" },
                  { label: "Total Bonuses", val: `₹${wallet.bonuses.toLocaleString("en-IN")}`, desc: "Performance rewards", icon: Award, color: "text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20" }
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

              {/* Wallet Transactions Table */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-855 rounded-2xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20">
                  <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Wallet Transactions Ledger</h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-100 dark:border-zinc-850 text-[9px] font-bold text-zinc-455 uppercase tracking-wider">
                        <th className="px-4 py-2.5">Date</th>
                        <th className="px-4 py-2.5">Type</th>
                        <th className="px-4 py-2.5">Amount</th>
                        <th className="px-4 py-2.5">Reference ID</th>
                        <th className="px-4 py-2.5 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-[11px] text-zinc-700 dark:text-zinc-350">
                      {wallet.history.map((record, index) => (
                        <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/25">
                          <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-white">{record.date}</td>
                          <td className="px-4 py-2.5 font-semibold text-zinc-500">{record.type}</td>
                          <td className={`px-4 py-2.5 font-black ${
                            record.status === "Credited" ? "text-emerald-600" : "text-rose-500"
                          }`}>
                            {record.status === "Credited" ? "+" : "-"}₹{record.amount.toLocaleString("en-IN")}
                          </td>
                          <td className="px-4 py-2.5 font-semibold text-zinc-400">{record.refId}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                              record.status === "Credited" || record.status === "Processed"
                                ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 border-emerald-100"
                                : "bg-rose-50 dark:bg-rose-950/20 text-rose-650 border-rose-100"
                            }`}>
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

          {/* TAB 6: LIVE TRACKING */}
          {activeTab === "live" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
              <div className="lg:col-span-2 space-y-4">
                {/* Simulated SVG Interactive Map */}
                <div className="bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl aspect-video relative overflow-hidden flex flex-col justify-between shadow-xs">
                  
                  {/* Mock Map Vector graphics */}
                  <svg className="absolute inset-0 w-full h-full text-zinc-300 dark:text-zinc-800 opacity-40" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Grid lines resembling streets */}
                    <line x1="0" y1="20" x2="100" y2="20" stroke="currentColor" strokeWidth="1" />
                    <line x1="0" y1="40" x2="100" y2="40" stroke="currentColor" strokeWidth="1" />
                    <line x1="0" y1="60" x2="100" y2="60" stroke="currentColor" strokeWidth="1" />
                    <line x1="0" y1="80" x2="100" y2="80" stroke="currentColor" strokeWidth="1" />
                    <line x1="20" y1="0" x2="20" y2="100" stroke="currentColor" strokeWidth="1" />
                    <line x1="45" y1="0" x2="45" y2="100" stroke="currentColor" strokeWidth="1" />
                    <line x1="70" y1="0" x2="70" y2="100" stroke="currentColor" strokeWidth="1" />
                    
                    {/* Curved route line */}
                    <path d="M 20 20 Q 45 40 70 60 T 90 80" fill="none" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="3" className="animate-pulse" />
                  </svg>

                  {/* Top floating telemetry bar */}
                  <div className="relative z-10 m-3 p-3 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-md border border-zinc-200/50 dark:border-zinc-800 rounded-xl flex items-center justify-between text-[10px] font-bold">
                    <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                      <Wifi size={12} className="text-emerald-500 animate-pulse" />
                      <span>Network: {live.networkStatus}</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-750 dark:text-zinc-300">
                      <Battery size={12} className={live.battery < 20 ? "text-rose-500 animate-bounce" : "text-emerald-500"} />
                      <span>Battery: {live.battery}%</span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-750 dark:text-zinc-300">
                      <Navigation size={12} className="text-orange-600 rotate-45" />
                      <span>Speed: {live.speed}</span>
                    </div>
                  </div>

                  {/* SVG marker labels inside the map */}
                  <div className="absolute top-[25%] left-[20%] z-10 p-1.5 bg-zinc-950/80 rounded-md border border-zinc-700 text-[8px] font-bold text-white shadow-md flex items-center gap-1">
                    <MapPin size={9} className="text-[var(--primary)]" />
                    <span>Store Outlet</span>
                  </div>

                  <div className="absolute top-[52%] left-[45%] z-10 p-1.5 bg-orange-650 rounded-md text-[8px] font-bold text-white shadow-md flex items-center gap-1 animate-bounce">
                    <Truck size={10} />
                    <span>{rider.name}</span>
                  </div>

                  <div className="absolute top-[72%] left-[70%] z-10 p-1.5 bg-zinc-950/80 rounded-md border border-zinc-700 text-[8px] font-bold text-white shadow-md flex items-center gap-1">
                    <MapPin size={9} className="text-emerald-500" />
                    <span>Customer Point</span>
                  </div>

                  {/* Map Controls */}
                  <div className="relative z-10 m-3 flex justify-end">
                    <div className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[9px] font-black text-zinc-500">
                      Indore Telemetry Grid • Map scale 1:2500
                    </div>
                  </div>
                </div>
              </div>

              {/* Rider current delivery details */}
              <div className="space-y-4">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-4">
                  <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-1.5">Active Transit Order</h4>
                  
                  <div className="space-y-3.5 text-xs">
                    <div>
                      <span className="block text-[8px] font-bold text-zinc-450 uppercase tracking-wider">Order Reference ID</span>
                      <span className="text-xs font-black text-orange-600 dark:text-orange-500 mt-0.5 block">{live.currentOrder.orderNumber}</span>
                    </div>

                    <div>
                      <span className="block text-[8px] font-bold text-zinc-450 uppercase tracking-wider">Customer Name</span>
                      <span className="text-xs font-extrabold text-zinc-800 dark:text-white mt-0.5 block">{live.currentOrder.customerName}</span>
                    </div>

                    <div>
                      <span className="block text-[8px] font-bold text-zinc-450 uppercase tracking-wider">Est. Arrival Time (ETA)</span>
                      <span className="text-xs font-black text-zinc-900 dark:text-white mt-0.5 block flex items-center gap-1">
                        <Clock size={12} className="text-amber-500 animate-pulse" />
                        {live.eta}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[8px] font-bold text-zinc-450 uppercase tracking-wider">Remaining Distance</span>
                      <span className="text-xs font-extrabold text-zinc-700 dark:text-zinc-300 mt-0.5 block">{live.distanceRemaining}</span>
                    </div>

                    <div>
                      <span className="block text-[8px] font-bold text-zinc-450 tracking-wider uppercase">Destination Address</span>
                      <span className="text-[10.5px] font-medium text-zinc-500 leading-normal block mt-1 flex items-start gap-1">
                        <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                        {live.currentOrder.destination}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: SALARY */}
          {activeTab === "salary" && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: "Base Salary (Monthly)", val: `₹${sal.monthlySalary.toLocaleString("en-IN")}`, desc: "Contract base salary", icon: PlusCircle, color: "text-blue-500 bg-blue-50 dark:bg-blue-950/20" },
                  { label: "Commission Earned", val: `₹${sal.commission.toLocaleString("en-IN")}`, desc: "Order incentives", icon: PlusCircle, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" },
                  { label: "Bonus / Incentives", val: `₹${sal.bonus.toLocaleString("en-IN")}`, desc: "Weekly performance bonus", icon: PlusCircle, color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" },
                  { label: "Deductions", val: `₹${sal.deductions.toLocaleString("en-IN")}`, desc: "Penalties/Taxes", icon: MinusCircle, color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20" },
                  { label: "Net Disbursed", val: `₹${sal.netSalary.toLocaleString("en-IN")}`, desc: "MTD salary credited", icon: CheckCircle2, color: "text-indigo-650 bg-indigo-50 dark:bg-indigo-950/20" }
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
                        <th className="px-4 py-2.5">Commission</th>
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
                          <td className="px-4 py-2.5 font-semibold text-emerald-600">+₹{record.commission.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 font-semibold text-emerald-600">+₹{record.bonus.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 font-semibold text-rose-500">-₹{record.deduction.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 font-black text-zinc-900 dark:text-white">₹{record.net.toLocaleString("en-IN")}</td>
                          <td className="px-4 py-2.5 text-right">
                            <span className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-100 dark:border-emerald-900/30">
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

          {/* TAB 8: ACTIVITY LOGS */}
          {activeTab === "activity" && (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-2xl p-5 shadow-xs space-y-6 animate-fade-in">
              <h4 className="text-[10px] font-black text-zinc-450 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-850 pb-1.5">Rider Activity Timeline</h4>
              
              <div className="relative border-l-2 border-zinc-100 dark:border-zinc-850 ml-3 pl-5 space-y-6">
                {logs.map((log) => (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-[27px] top-0 w-3 h-3 rounded-full border bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-600" />
                    </span>
                    
                    <div className="space-y-0.5">
                      <span className="text-[8px] font-bold text-zinc-455 block">{log.date}</span>
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
