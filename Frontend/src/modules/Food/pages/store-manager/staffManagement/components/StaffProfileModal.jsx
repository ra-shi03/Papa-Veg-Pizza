import React from "react";
import { 
  User, 
  Mail, 
  Phone as PhoneIcon, 
  Calendar, 
  ShieldAlert, 
  Briefcase, 
  Activity, 
  Clock, 
  Coins, 
  Trophy, 
  CheckCircle2, 
  AlertTriangle,
  History,
  Info
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useStaffDetails } from "../hooks/useStaff";
import { Skeleton } from "@food/components/ui/skeleton";

// Custom SVG Circular Progress Component
const CircularProgress = ({ value, label = "", suffix = "%", size = 70, strokeWidth = 6, color = "text-primary" }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Cap percentage at 100 for visual offset calculation
  const numericValue = typeof value === "number" ? value : 0;
  const clampedPercent = Math.min(100, Math.max(0, numericValue));
  const offset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl shadow-inner">
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${size} ${size}`}>
          {/* Track Circle */}
          <circle
            className="text-zinc-200 dark:text-zinc-800"
            strokeWidth={strokeWidth}
            stroke="currentColor"
            fill="transparent"
            r={radius}
            cx={size / 2}
            cy={size / 2}
          />
          {/* Indicator Circle */}
          <circle
            className={color}
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
        <span className="absolute text-[11px] font-black text-slate-800 dark:text-zinc-200">
          {value}{suffix}
        </span>
      </div>
      <span className="text-[9px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider mt-2 text-center">
        {label}
      </span>
    </div>
  );
};

export default function StaffProfileModal({ isOpen, onClose, staffId }) {
  const { data: staff, isLoading } = useStaffDetails(staffId);

  // Fallback initial letters for Avatar
  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "Kitchen Supervisor":
        return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/25 dark:text-purple-400 dark:border-purple-900/35";
      case "Pizza Maker":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/25 dark:text-emerald-400 dark:border-emerald-900/35";
      case "Baker":
        return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/25 dark:text-orange-400 dark:border-orange-900/35";
      case "Packager":
        return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/25 dark:text-blue-400 dark:border-blue-900/35";
      default:
        return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800";
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "inactive":
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
      case "suspended":
        return "bg-rose-500/10 text-rose-600 border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border-zinc-500/20";
    }
  };

  const getActivityIcon = (type, status) => {
    if (status === "severe") return <AlertTriangle className="text-red-500 shrink-0" size={13} />;
    if (status === "warning") return <AlertTriangle className="text-amber-500 shrink-0" size={13} />;
    
    switch (type) {
      case "Completed Orders":
        return <CheckCircle2 className="text-emerald-500 shrink-0" size={13} />;
      case "Shift Changes":
        return <Clock className="text-blue-500 shrink-0" size={13} />;
      case "Attendance Logs":
        return <Calendar className="text-purple-500 shrink-0" size={13} />;
      default:
        return <Info className="text-zinc-400 shrink-0" size={13} />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 overflow-y-auto max-h-[90vh] scrollbar-thin">
        <DialogHeader className="border-b border-zinc-150 dark:border-zinc-800 pb-3 pr-8">
          <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <User size={20} className="text-primary" />
            Kitchen Staff Profile
          </DialogTitle>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
            Operational and personal staff dashboard card.
          </p>
        </DialogHeader>

        {isLoading ? (
          <div className="py-6 space-y-6 animate-pulse">
            <div className="flex items-center gap-4">
              <Skeleton className="w-16 h-16 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-20 rounded-2xl" />
              <Skeleton className="h-20 rounded-2xl" />
            </div>
          </div>
        ) : !staff ? (
          <div className="py-8 text-center text-zinc-500">Staff profile could not be retrieved.</div>
        ) : (
          <div className="py-4 space-y-6">
            
            {/* SECTION 1: PERSONAL INFORMATION */}
            <section className="flex flex-col sm:flex-row items-center sm:items-start gap-5 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              {/* Profile Image / AvatarFallback */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center shrink-0 shadow-sm">
                {staff.profileImage ? (
                  <img
                    src={staff.profileImage}
                    alt={staff.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-xl font-black text-primary">
                    {getInitials(staff.fullName)}
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-slate-900 dark:text-white">
                      {staff.fullName}
                    </h3>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">
                      Emp ID: {staff.employeeCode}
                    </p>
                  </div>

                  <div className="flex flex-wrap justify-center sm:justify-start gap-1.5 self-center">
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border ${getRoleBadgeColor(staff.role)}`}>
                      {staff.role}
                    </span>
                    <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border capitalize ${getStatusBadgeColor(staff.status)}`}>
                      {staff.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-semibold text-slate-600 dark:text-zinc-400 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                  <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <PhoneIcon size={12} className="text-zinc-400" />
                    <span>+91 {staff.phone}</span>
                  </p>
                  <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <Mail size={12} className="text-zinc-400" />
                    <span className="truncate">{staff.email}</span>
                  </p>
                  <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <Calendar size={12} className="text-zinc-400" />
                    <span>Joined: {new Date(staff.joiningDate).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}</span>
                  </p>
                  <p className="flex items-center gap-1.5 justify-center sm:justify-start">
                    <ShieldAlert size={12} className="text-zinc-400 shrink-0" />
                    <span className="truncate" title={staff.emergencyContact}>Emerg: {staff.emergencyContact}</span>
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 2: PROFESSIONAL DETAILS */}
            <section className="space-y-2.5">
              <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Briefcase size={12} /> Professional Details
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Experience</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{staff.experience} Years</p>
                </div>
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Current Shift</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{staff.shiftId || "Unassigned"}</p>
                </div>
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Salary Type</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">{staff.salaryType}</p>
                </div>
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Salary</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">
                    ₹{staff.salary?.toLocaleString("en-IN")}{staff.salaryType === "Hourly" ? "/hr" : ""}
                  </p>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="flex items-start gap-2 pt-1.5">
                <span className="text-[10px] font-black text-slate-700 dark:text-zinc-300 uppercase tracking-wider pt-1 shrink-0">Skills:</span>
                <div className="flex flex-wrap gap-1.5">
                  {staff.skills && staff.skills.length > 0 ? (
                    staff.skills.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-0.5 rounded-md text-[9px] font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-205 dark:border-zinc-800/40"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-zinc-400 italic">No skills listed</span>
                  )}
                </div>
              </div>
            </section>

            {/* SECTION 3: PERFORMANCE STATS */}
            <section className="space-y-2.5">
              <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <Trophy size={12} className="text-amber-500" /> Performance Statistics
              </h4>
              
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Orders Prepared</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                    {staff.stats?.ordersCompleted || 0}
                  </p>
                </div>
                
                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Avg Prep Speed</p>
                  <p className="text-lg font-black text-slate-800 dark:text-white mt-1">
                    {staff.stats?.avgPrepTime || "--"} <span className="text-[10px] font-extrabold text-zinc-400">mins</span>
                  </p>
                </div>

                <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl flex flex-col justify-between">
                  <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Delayed Orders</p>
                  <p className="text-lg font-black text-red-650 mt-1">
                    {staff.stats?.delayedOrders || 0}
                  </p>
                </div>

                {/* Radial gauges */}
                <CircularProgress 
                  value={staff.stats?.attendance || 100} 
                  label="Attendance" 
                  color="text-emerald-500"
                />

                <CircularProgress 
                  value={staff.performanceScore || 0} 
                  label="Perf. Rating" 
                  color="text-primary"
                />
              </div>
            </section>

            {/* SECTION 4: RECENT ACTIVITIES */}
            <section className="space-y-2.5 pt-1.5">
              <h4 className="text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                <History size={12} /> Recent Activities
              </h4>
              
              <div className="bg-zinc-50/50 dark:bg-zinc-950/10 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl max-h-[160px] overflow-y-auto scrollbar-thin">
                {staff.activities && staff.activities.length > 0 ? (
                  <div className="relative border-l border-zinc-200 dark:border-zinc-800 pl-4 ml-2.5 space-y-3.5">
                    {staff.activities.map((act) => (
                      <div key={act.id} className="relative text-xs">
                        {/* Dot indicator */}
                        <span className="absolute -left-[23px] top-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-full z-10 flex items-center justify-center">
                          {getActivityIcon(act.type, act.status)}
                        </span>
                        
                        <div className="flex justify-between items-start gap-4">
                          <p className="font-bold text-slate-800 dark:text-zinc-200">{act.title}</p>
                          <span className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-650 shrink-0">{act.time}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 font-semibold uppercase mt-0.5 tracking-wider">{act.type}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-xs font-semibold text-zinc-400">
                    No recent activities logged for this staff member.
                  </div>
                )}
              </div>
            </section>

            {/* Close Button */}
            <div className="flex items-center justify-end pt-3 border-t border-zinc-150 dark:border-zinc-850">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-primary text-white font-bold rounded-full text-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-md"
              >
                Close Profile
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
