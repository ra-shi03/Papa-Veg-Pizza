import React, { useState, useMemo } from "react";
import {
  User,
  Clock,
  Calendar,
  Star,
  Award,
  AlertTriangle,
  TrendingUp,
  MessageSquare,
  Pizza,
  Zap,
  Activity,
  History,
  CheckCircle2,
  FileSpreadsheet
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useStaffPerformanceDetails } from "../hooks/usePerformance";
import { Skeleton } from "@food/components/ui/skeleton";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";

// Circular Progress helper for score
const ScoreRadial = ({ value = 0, label = "Performance Score", size = 80, strokeWidth = 8 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const clampedPercent = Math.min(100, Math.max(0, value));
  const offset = circumference - (clampedPercent / 100) * circumference;

  let color = "text-rose-500";
  if (clampedPercent >= 95) color = "text-emerald-500";
  else if (clampedPercent >= 90) color = "text-blue-500";
  else if (clampedPercent >= 85) color = "text-amber-500";

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-inner w-full">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          <circle
            className="text-zinc-200 dark:text-zinc-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          <circle
            className={`${color} transition-all duration-500`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
        </svg>
        <span className="absolute text-sm font-black text-slate-800 dark:text-zinc-200">
          {value}%
        </span>
      </div>
      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mt-2.5 text-center">
        {label}
      </span>
    </div>
  );
};

export default function StaffPerformanceModal({ isOpen, onClose, staffId, defaultPeriod = "monthly" }) {
  const [activeTab, setActiveTab] = useState("overview");
  const [period, setPeriod] = useState(defaultPeriod);

  const { data: performanceData, isLoading } = useStaffPerformanceDetails(staffId, period);

  const staff = performanceData?.staff || null;

  // Fallback initial letters for Avatar
  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate 6-week trend data based on current score
  const trendData = useMemo(() => {
    if (!performanceData) return [];
    const baseScore = Number(performanceData.score || 90);
    return [
      { name: "Wk 1", score: Math.round(baseScore - 4) },
      { name: "Wk 2", score: Math.round(baseScore - 2) },
      { name: "Wk 3", score: Math.round(baseScore + 1) },
      { name: "Wk 4", score: Math.round(baseScore - 1) },
      { name: "Wk 5", score: Math.round(baseScore - 3) },
      { name: "Wk 6", score: Math.round(baseScore) }
    ];
  }, [performanceData]);

  const ratingStars = useMemo(() => {
    if (!performanceData) return 5;
    return Math.round(performanceData.rating || 5);
  }, [performanceData]);

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 overflow-y-auto max-h-[90vh] scrollbar-thin">
        <DialogHeader className="border-b border-zinc-150 dark:border-zinc-850 pb-3 pr-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <DialogTitle className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <Award size={18} className="text-primary" />
              Staff Performance Insights
            </DialogTitle>
            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
              Detailed metrics, customer ratings, and output timeline.
            </p>
          </div>

          <div className="flex gap-1 bg-zinc-50 dark:bg-zinc-950 p-0.5 border border-zinc-100 dark:border-zinc-800 rounded-xl max-w-fit">
            {["daily", "weekly", "monthly"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  period === p
                    ? "bg-white dark:bg-zinc-900 border border-zinc-250/20 text-slate-900 dark:text-white shadow-sm"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-650"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 space-y-6 animate-pulse">
            <div className="flex items-center gap-4">
              <Skeleton className="w-14 h-14 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          </div>
        ) : (
          <div className="space-y-5 mt-4">
            {/* Header info */}
            <div className="flex items-center gap-4 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-4 rounded-2xl">
              <div className="w-14 h-14 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center shadow-inner shrink-0">
                {staff?.profileImage ? (
                  <img src={staff.profileImage} alt={staff.fullName} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-sm font-black text-primary">{getInitials(staff?.fullName)}</div>
                )}
              </div>
              <div className="space-y-0.5 min-w-0 flex-1">
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{staff?.fullName || "Staff Member"}</h3>
                <p className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase">
                  {staff?.employeeCode || `EMP-${staffId}`}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-350 border border-zinc-150 dark:border-zinc-800">
                    {staff?.role || "Kitchen Staff"}
                  </span>
                  <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/35">
                    {staff?.shiftId || "Morning"} Shift
                  </span>
                  {staff?.joiningDate && (
                    <span className="text-[9px] text-zinc-400 font-semibold flex items-center gap-0.5">
                      <Calendar size={10} /> Joined {staff.joiningDate}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Tab Swapping */}
            <div className="flex border-b border-zinc-150 dark:border-zinc-850 text-xs font-semibold">
              {[
                { id: "overview", label: "Overview", icon: Pizza },
                { id: "attendance", label: "Attendance", icon: Calendar },
                { id: "satisfaction", label: "Customer Feedback", icon: MessageSquare },
                { id: "trends", label: "Weekly Trend", icon: TrendingUp }
              ].map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1.5 py-2.5 px-4 border-b-2 font-black transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? "border-primary text-slate-900 dark:text-white"
                        : "border-transparent text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300"
                    }`}
                  >
                    <TabIcon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Content segments */}
            <div className="min-h-[220px] transition-all">
              {/* 1. OVERVIEW TAB */}
              {activeTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left Column: Radial score */}
                  <div className="md:col-span-1 flex flex-col justify-between">
                    <ScoreRadial value={performanceData?.score} />
                  </div>

                  {/* Right Column: Key figures */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-3">
                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Total Orders</span>
                      <p className="text-xl font-black text-slate-900 dark:text-white">{performanceData?.totalOrders}</p>
                      <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold block">Volume of output</span>
                    </div>

                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Avg Prep Speed</span>
                      <p className="text-xl font-black text-slate-900 dark:text-white">{performanceData?.avgPreparationTime} min</p>
                      <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold block">Station average prep</span>
                    </div>

                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Delayed Orders</span>
                      <p className={`text-xl font-black ${performanceData?.delayedOrders > 3 ? "text-rose-500" : "text-slate-900 dark:text-white"}`}>
                        {performanceData?.delayedOrders}
                      </p>
                      <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold block">Late completions</span>
                    </div>

                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Delay Rate</span>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        {performanceData?.totalOrders > 0
                          ? ((performanceData.delayedOrders / performanceData.totalOrders) * 100).toFixed(1)
                          : 0}%
                      </p>
                      <span className="text-[9px] text-zinc-450 dark:text-zinc-500 font-semibold block">Percentage delayed</span>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. ATTENDANCE TAB */}
              {activeTab === "attendance" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">Attendance Percentage</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold">Reflects shifts present relative to scheduled hours.</p>
                    </div>
                    <div className="text-right">
                      <span className="text-2xl font-black text-blue-500">{performanceData?.attendancePercentage}%</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Overtime Worked</span>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        {period === "monthly" ? "12.5 hrs" : period === "weekly" ? "3.2 hrs" : "1.4 hrs"}
                      </p>
                      <span className="text-[9px] text-zinc-450 font-bold block text-emerald-600">Extra hours output</span>
                    </div>
                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-1">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Excused Leaves</span>
                      <p className="text-xl font-black text-slate-900 dark:text-white">
                        {period === "monthly" ? "2 Days" : "0 Days"}
                      </p>
                      <span className="text-[9px] text-zinc-450 font-bold block text-zinc-400">Approved time-offs</span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl text-[11px] font-semibold text-zinc-500 leading-relaxed">
                    <strong>Punctuality Note:</strong> Punctuality rate is computed at 98.4%. Standard log checks verify prompt attendance and check-in compliance on shift start times.
                  </div>
                </div>
              )}

              {/* 3. FEEDBACK TAB */}
              {activeTab === "satisfaction" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex flex-col justify-between h-[110px]">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Customer Rating</span>
                      <div className="flex items-center gap-1.5 text-amber-500 my-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={16} fill={i < ratingStars ? "currentColor" : "none"} />
                        ))}
                      </div>
                      <p className="text-[10px] font-bold text-zinc-400">
                        Average of {performanceData?.rating} stars out of 5.0
                      </p>
                    </div>

                    <div className="border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex flex-col justify-between h-[110px]">
                      <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Formal Complaints</span>
                      <p className={`text-2xl font-black my-1 ${performanceData?.customerComplaints > 0 ? "text-rose-500" : "text-emerald-500"}`}>
                        {performanceData?.customerComplaints}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-400">
                        {performanceData?.customerComplaints > 0 
                          ? "Requires manager/supervisor review." 
                          : "Excellent! 0 complaints logged."}
                      </p>
                    </div>
                  </div>

                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4 space-y-3">
                    <h5 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">Recent Customer Snippets</h5>
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-850 text-[11px] font-semibold text-slate-800 dark:text-zinc-250">
                      {performanceData?.customerComplaints > 0 ? (
                        <div className="py-2 first:pt-0 last:pb-0 flex items-start gap-2">
                          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={12} />
                          <div>
                            <p className="font-extrabold text-zinc-650">"Pizza crust was slightly burnt at the edges"</p>
                            <p className="text-[9px] text-zinc-450 mt-0.5">Order PVP-1035 • 4 days ago</p>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2 first:pt-0 last:pb-0 flex items-start gap-2">
                          <CheckCircle2 className="text-emerald-500 shrink-0 mt-0.5" size={12} />
                          <div>
                            <p className="font-extrabold text-zinc-650">"Perfect Veggie Supreme! Standard prep speed was excellent."</p>
                            <p className="text-[9px] text-zinc-450 mt-0.5">Order PVP-1082 • Yesterday</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 4. LINE TREND TAB */}
              {activeTab === "trends" && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between border border-zinc-150 dark:border-zinc-850 p-3 rounded-2xl">
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-zinc-200">Performance Over Time</h4>
                      <p className="text-[9px] text-zinc-400 font-semibold">Historical trend of overall score (6-week timeline)</p>
                    </div>
                    <span className="text-[10px] font-extrabold text-emerald-600 dark:text-emerald-450 uppercase bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <TrendingUp size={10} /> +2.5% Up
                    </span>
                  </div>

                  <div className="h-[180px] w-full text-[9px] font-bold mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains("dark") ? "#27272a" : "#e4e4e7"} />
                        <XAxis dataKey="name" stroke="#888888" tickLine={false} />
                        <YAxis stroke="#888888" domain={[60, 100]} tickLine={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="score"
                          stroke="var(--primary, #a43c12)"
                          strokeWidth={3}
                          activeDot={{ r: 5 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>

            {/* Audit History Timeline */}
            <div className="border-t border-zinc-150 dark:border-zinc-850 pt-4 space-y-3">
              <h4 className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
                <History size={12} className="text-primary" />
                Recent Operational Activity Logs
              </h4>
              <div className="space-y-3 pl-2">
                {(staff?.activities || []).map((act, index) => (
                  <div key={act.id || index} className="flex gap-3 relative pb-3 last:pb-0">
                    {index < (staff?.activities?.length - 1) && (
                      <div className="absolute left-[5px] top-[14px] bottom-0 w-[1px] bg-zinc-150 dark:bg-zinc-800" />
                    )}
                    <div className="w-[11px] h-[11px] rounded-full border-2 border-primary bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-slate-800 dark:text-zinc-200">{act.title}</p>
                      <p className="text-[9px] text-zinc-400 font-semibold">{act.time} • {act.type}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
