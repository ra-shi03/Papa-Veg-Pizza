import React, { useState, useMemo, useEffect } from "react";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  User, 
  Clock, 
  Award, 
  TrendingUp,
  UserCheck,
  CalendarCheck,
  XCircle,
  Briefcase,
  AlertCircle,
  Phone,
  Mail,
  ChevronDown,
  Calendar,
  Sparkles
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@food/components/ui/dropdown-menu";
import { Skeleton } from "@food/components/ui/skeleton";

// Custom Hooks and Components
import { useStaffList } from "./hooks/useStaff";
import AddStaffModal from "./components/AddStaffModal";
import EditStaffModal from "./components/EditStaffModal";
import StaffProfileModal from "./components/StaffProfileModal";
import AssignShiftModal from "./components/AssignShiftModal";
import MarkLeaveModal from "./components/MarkLeaveModal";
import DeactivateStaffDialog from "./components/DeactivateStaffDialog";
import DeleteStaffDialog from "./components/DeleteStaffDialog";

// Simple state debounce helper hook
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function KitchenStaff() {
  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isShiftOpen, setIsShiftOpen] = useState(false);
  const [isLeaveOpen, setIsLeaveOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("All");
  const [selectedShift, setSelectedShift] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch data
  const filters = useMemo(() => ({
    search: debouncedSearch,
    role: selectedRole,
    shiftId: selectedShift,
    status: selectedStatus
  }), [debouncedSearch, selectedRole, selectedShift, selectedStatus]);

  const { data: staffList = [], isLoading, isError, refetch } = useStaffList(filters);

  // Dashboard summary figures
  const summary = useMemo(() => {
    if (!staffList || staffList.length === 0) {
      return { total: 0, active: 0, leave: 0, absent: 0, avgPerf: 0 };
    }
    const total = staffList.length;
    const active = staffList.filter(s => s.status === "active").length;
    const leave = staffList.filter(s => s.todayStatus === "leave").length;
    const absent = staffList.filter(s => s.todayStatus === "absent").length;
    
    const performanceScores = staffList.map(s => s.performanceScore || 0);
    const avgPerf = performanceScores.length > 0 
      ? Math.round(performanceScores.reduce((a, b) => a + b, 0) / performanceScores.length) 
      : 0;

    return { total, active, leave, absent, avgPerf };
  }, [staffList]);

  // Handle modal trigger helper
  const triggerAction = (action, staffId) => {
    setSelectedStaffId(staffId);
    if (action === "view") setIsProfileOpen(true);
    if (action === "edit") setIsEditOpen(true);
    if (action === "shift") setIsShiftOpen(true);
    if (action === "leave") setIsLeaveOpen(true);
    if (action === "deactivate") setIsDeactivateOpen(true);
    if (action === "delete") setIsDeleteOpen(true);
  };

  // Badge rendering helpers
  const displayRole = (role) => {
    if (!role) return "Staff";
    return role
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const formatJoiningDate = (dateStr) => {
    if (!dateStr) return "--";
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  };

  const getRoleBadgeStyle = (role) => {
    const normalized = (role || "").replace(/_/g, " ").toLowerCase();
    if (normalized.includes("supervisor")) {
      return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
    }
    if (normalized.includes("pizza") || normalized.includes("chef") || normalized.includes("maker")) {
      return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
    }
    if (normalized.includes("baker") || normalized.includes("oven")) {
      return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30";
    }
    if (normalized.includes("packager") || normalized.includes("helper")) {
      return "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
    }
    return "bg-zinc-50 text-zinc-700 border-zinc-200 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-800";
  };

  const getStatusBadgeStyle = (status) => {
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

  const getTodayStatusBadge = (todayStatus) => {
    switch (todayStatus) {
      case "present":
        return "bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "leave":
        return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      case "absent":
        return "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
      case "late":
        return "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30";
      default:
        return "bg-zinc-50 text-zinc-550 border-zinc-150 dark:bg-zinc-950 dark:text-zinc-450 dark:border-zinc-850";
    }
  };

  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      {/* 1. Header Layout */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Kitchen Staff
          </h1>
          <p className="text-zinc-500 dark:text-zinc-450 text-xs mt-1">
            Manage all kitchen employees and their shifts, skills, and performance KPIs.
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-hover active:scale-95 shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>Add Staff</span>
        </button>
      </header>

      {/* 2. Dashboard Cards Section */}
      <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, idx) => (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-4 rounded-2xl space-y-2.5 animate-pulse">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-7 w-12" />
            </div>
          ))
        ) : (
          <>
            {/* Card 1: Total Staff */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Total Staff</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">{summary.total}</span>
              </div>
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                <User size={16} className="text-primary" />
              </div>
            </div>

            {/* Card 2: Active Staff */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Active Staff</span>
                <span className="text-xl font-black text-emerald-600">{summary.active}</span>
              </div>
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                <UserCheck size={16} className="text-emerald-500" />
              </div>
            </div>

            {/* Card 3: On Leave Today */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">On Leave Today</span>
                <span className="text-xl font-black text-amber-500">{summary.leave}</span>
              </div>
              <div className="p-2.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 rounded-xl">
                <CalendarCheck size={16} className="text-amber-500" />
              </div>
            </div>

            {/* Card 4: Absent Today */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Absent Today</span>
                <span className="text-xl font-black text-rose-600">{summary.absent}</span>
              </div>
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl">
                <XCircle size={16} className="text-rose-500" />
              </div>
            </div>

            {/* Card 5: Avg Performance */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-2xl flex items-center justify-between shadow-sm">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest block">Avg Performance</span>
                <span className="text-xl font-black text-primary">{summary.avgPerf}%</span>
              </div>
              <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-800 rounded-xl">
                <Award size={16} className="text-primary" />
              </div>
            </div>
          </>
        )}
      </section>

      {/* 3. Search and Filters Section */}
      <section className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-3.5 text-zinc-400 dark:text-zinc-550" size={14} />
          <input
            type="text"
            placeholder="Search Name or Employee ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-850 rounded-2xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all shadow-inner"
          />
        </div>

        {/* Dropdown filters */}
        <div className="flex flex-wrap gap-2.5">
          {/* Role Filter */}
          <div className="flex flex-col gap-0.5 min-w-[120px]">
            <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider pl-1">Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="h-9 px-2.5 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none"
            >
              <option value="All">All Roles</option>
              <option value="Pizza Maker">Pizza Maker</option>
              <option value="Baker">Baker</option>
              <option value="Packager">Packager</option>
              <option value="Kitchen Supervisor">Kitchen Supervisor</option>
            </select>
          </div>

          {/* Shift Filter */}
          <div className="flex flex-col gap-0.5 min-w-[120px]">
            <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider pl-1">Shift</label>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="h-9 px-2.5 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none"
            >
              <option value="All">All Shifts</option>
              <option value="Morning">Morning</option>
              <option value="Afternoon">Afternoon</option>
              <option value="Night">Night</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex flex-col gap-0.5 min-w-[120px]">
            <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider pl-1">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="h-9 px-2.5 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none"
            >
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </section>

      {/* 4. Table or Card list depending on device size */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-3xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <Skeleton className="w-10 h-10 rounded-full shrink-0 animate-pulse" />
                <Skeleton className="h-6 w-full rounded-md animate-pulse" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-8 text-center space-y-4">
            <AlertCircle className="mx-auto text-rose-500" size={32} />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">API Sync Failure</h3>
              <p className="text-xs text-zinc-400 font-semibold mt-1">Failed to fetch store staff records from backend server.</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-full text-xs shadow-md cursor-pointer transition-all active:scale-95"
            >
              Retry Sync
            </button>
          </div>
        ) : staffList.length === 0 ? (
          /* Empty State */
          <div className="p-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-50 dark:bg-red-950/20 text-primary rounded-2xl flex items-center justify-center">
              <User size={32} className="stroke-[1.5]" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">No Kitchen Staff Found</h3>
              <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold max-w-sm mt-1">
                There are no kitchen employees matching these filters. Add your first crew member to get started.
              </p>
            </div>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-full text-xs hover:bg-primary-hover active:scale-95 shadow-md cursor-pointer transition-all"
            >
              Add First Staff Member
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-850 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                    <th className="py-3 px-4 font-black">Photo</th>
                    <th className="py-3 px-4 font-black">Employee ID</th>
                    <th className="py-3 px-4 font-black">Name</th>
                    <th className="py-3 px-4 font-black">Role</th>
                    <th className="py-3 px-4 font-black">Current Shift</th>
                    <th className="py-3 px-4 font-black">Experience</th>
                    <th className="py-3 px-4 font-black">Performance</th>
                    <th className="py-3 px-4 font-black">Today's Status</th>
                    <th className="py-3 px-4 font-black">Joining Date</th>
                    <th className="py-3 px-4 font-black">Status</th>
                    <th className="py-3 px-4 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-semibold text-slate-700 dark:text-zinc-300">
                  {staffList.map((staff) => (
                    <tr key={staff._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                      {/* 1. Photo */}
                      <td className="py-3 px-4">
                        <div className="w-9 h-9 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center shadow-inner">
                          {(staff.profileImage || staff.avatar) ? (
                            <img
                              src={staff.profileImage || staff.avatar}
                              alt={staff.fullName || staff.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="text-xs font-black text-primary">
                              {getInitials(staff.fullName || staff.name)}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 2. Employee ID */}
                      <td className="py-3 px-4 font-mono font-bold uppercase tracking-wider text-slate-500">
                        {staff.employeeCode || staff.employeeId || `EMP-PV-${staff._id}`}
                      </td>

                      {/* 3. Name */}
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-white">
                        {staff.fullName || staff.name || "Unknown Staff"}
                      </td>

                      {/* 4. Role */}
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold border uppercase ${getRoleBadgeStyle(staff.role)}`}>
                          {displayRole(staff.role)}
                        </span>
                      </td>

                      {/* 5. Current Shift */}
                      <td className="py-3 px-4 text-zinc-500">
                        {staff.shiftId || "Morning"}
                      </td>

                      {/* 6. Experience */}
                      <td className="py-3 px-4 text-zinc-500">
                        {staff.experience ?? 3} Years
                      </td>

                      {/* 7. Performance Score */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="w-8 shrink-0 text-slate-800 dark:text-zinc-200 text-[10px] font-black">{staff.performanceScore ?? 85}%</span>
                          <div className="w-20 h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${staff.performanceScore ?? 85}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* 8. Today's Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border capitalize ${getTodayStatusBadge(staff.todayStatus || "present")}`}>
                          {staff.todayStatus || "present"}
                        </span>
                      </td>

                      {/* 9. Joining Date */}
                      <td className="py-3 px-4 text-zinc-500">
                        {formatJoiningDate(staff.joiningDate)}
                      </td>

                      {/* 10. Status */}
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold border capitalize ${getStatusBadgeStyle(staff.status || "active")}`}>
                          {staff.status || "active"}
                        </span>
                      </td>

                      {/* 11. Actions */}
                      <td className="py-3 px-4 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg outline-none cursor-pointer">
                            <MoreVertical size={16} className="text-zinc-400 dark:text-zinc-550" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-md">
                            <DropdownMenuItem 
                              onClick={() => triggerAction("view", staff._id)}
                              className="text-[11px] font-bold py-2 px-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-slate-800 dark:text-zinc-200"
                            >
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => triggerAction("edit", staff._id)}
                              className="text-[11px] font-bold py-2 px-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-slate-800 dark:text-zinc-200"
                            >
                              Edit Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => triggerAction("shift", staff._id)}
                              className="text-[11px] font-bold py-2 px-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-slate-800 dark:text-zinc-200"
                            >
                              Assign Shift
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => triggerAction("leave", staff._id)}
                              className="text-[11px] font-bold py-2 px-2.5 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer text-slate-800 dark:text-zinc-200"
                            >
                              Mark Leave
                            </DropdownMenuItem>
                            {staff.status === "active" && (
                              <DropdownMenuItem 
                                onClick={() => triggerAction("deactivate", staff._id)}
                                className="text-[11px] font-bold py-2 px-2.5 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950/20 text-amber-600 cursor-pointer"
                              >
                                Deactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem 
                              onClick={() => triggerAction("delete", staff._id)}
                              className="text-[11px] font-bold py-2 px-2.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-red-600 cursor-pointer"
                            >
                              Delete Staff
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile/Tablet Card-Based View */}
            <div className="block lg:hidden divide-y divide-zinc-100 dark:divide-zinc-850 p-4 space-y-4">
              {staffList.map((staff) => (
                <div key={staff._id} className="pt-4 first:pt-0 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Photo */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-center shrink-0 shadow-sm">
                        {(staff.profileImage || staff.avatar) ? (
                          <img
                            src={staff.profileImage || staff.avatar}
                            alt={staff.fullName || staff.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-sm font-black text-primary">
                            {getInitials(staff.fullName || staff.name)}
                          </div>
                        )}
                      </div>
                      
                      {/* Basic details */}
                      <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white">{staff.fullName || staff.name || "Unknown Staff"}</h3>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">{staff.employeeCode || staff.employeeId || `EMP-PV-${staff._id}`}</p>
                      </div>
                    </div>

                    {/* Actions Trigger for Mobile */}
                    <DropdownMenu>
                      <DropdownMenuTrigger className="p-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl cursor-pointer">
                        <MoreVertical size={15} className="text-zinc-550" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl p-1 shadow-md">
                        <DropdownMenuItem onClick={() => triggerAction("view", staff._id)} className="text-[11px] font-bold py-2 px-2.5 rounded-lg text-slate-800 dark:text-zinc-200">View Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => triggerAction("edit", staff._id)} className="text-[11px] font-bold py-2 px-2.5 rounded-lg text-slate-800 dark:text-zinc-200">Edit Profile</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => triggerAction("shift", staff._id)} className="text-[11px] font-bold py-2 px-2.5 rounded-lg text-slate-800 dark:text-zinc-200">Assign Shift</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => triggerAction("leave", staff._id)} className="text-[11px] font-bold py-2 px-2.5 rounded-lg text-slate-800 dark:text-zinc-200">Mark Leave</DropdownMenuItem>
                        {staff.status === "active" && (
                          <DropdownMenuItem onClick={() => triggerAction("deactivate", staff._id)} className="text-[11px] font-bold py-2 px-2.5 rounded-lg text-amber-600">Deactivate</DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => triggerAction("delete", staff._id)} className="text-[11px] font-bold py-2 px-2.5 rounded-lg text-red-600">Delete Staff</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Operational indicators grid */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500 dark:text-zinc-400 bg-zinc-50/50 dark:bg-zinc-950/20 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-850">
                    <p className="flex justify-between">
                      <span className="text-zinc-400">Role:</span>
                      <span className={`px-1.5 py-0.2 rounded-full border text-[8px] uppercase font-extrabold ${getRoleBadgeStyle(staff.role)}`}>{displayRole(staff.role)}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-400">Shift:</span>
                      <span className="text-slate-800 dark:text-zinc-200 font-extrabold">{staff.shiftId || "Morning"}</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-400">Perf:</span>
                      <span className="text-primary font-black">{staff.performanceScore ?? 85}%</span>
                    </p>
                    <p className="flex justify-between">
                      <span className="text-zinc-400">Status:</span>
                      <span className={`px-1.5 py-0.2 rounded-full border text-[8px] uppercase font-extrabold ${getTodayStatusBadge(staff.todayStatus || "present")}`}>{staff.todayStatus || "present"}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* 5. Seven Action Modals */}
      <AddStaffModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
      />

      <EditStaffModal 
        isOpen={isEditOpen} 
        onClose={() => {
          setIsEditOpen(false);
          setSelectedStaffId(null);
        }} 
        staffId={selectedStaffId} 
      />

      <StaffProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => {
          setIsProfileOpen(false);
          setSelectedStaffId(null);
        }} 
        staffId={selectedStaffId} 
      />

      <AssignShiftModal 
        isOpen={isShiftOpen} 
        onClose={() => {
          setIsShiftOpen(false);
          setSelectedStaffId(null);
        }} 
        staffId={selectedStaffId} 
      />

      <MarkLeaveModal 
        isOpen={isLeaveOpen} 
        onClose={() => {
          setIsLeaveOpen(false);
          setSelectedStaffId(null);
        }} 
        staffId={selectedStaffId} 
      />

      <DeactivateStaffDialog 
        isOpen={isDeactivateOpen} 
        onClose={() => {
          setIsDeactivateOpen(false);
          setSelectedStaffId(null);
        }} 
        staffId={selectedStaffId} 
      />

      <DeleteStaffDialog 
        isOpen={isDeleteOpen} 
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedStaffId(null);
        }} 
        staffId={selectedStaffId} 
      />
    </div>
  );
}
