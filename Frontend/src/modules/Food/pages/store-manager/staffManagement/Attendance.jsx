import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  UserCheck, 
  X, 
  SlidersHorizontal,
  ChevronDown,
  Calendar,
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  Users
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@food/components/ui/dropdown-menu";
import { Skeleton } from "@food/components/ui/skeleton";

// Custom Hooks and Components
import { useAttendanceList } from "./hooks/useAttendance";
import { useStaffList } from "./hooks/useStaff";
import AttendanceStatsCards from "./components/AttendanceStatsCards";
import MarkAttendanceModal from "./components/MarkAttendanceModal";
import BulkAttendanceModal from "./components/BulkAttendanceModal";
import EditAttendanceModal from "./components/EditAttendanceModal";
import AttendanceDetailsModal from "./components/AttendanceDetailsModal";
import DeleteAttendanceDialog from "./components/DeleteAttendanceDialog";

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

export default function Attendance() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Modal States
  const [isMarkOpen, setIsMarkOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected records
  const [selectedRecordId, setSelectedRecordId] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Get active filters from URL parameters, defaulting to sane defaults
  const dateFilter = searchParams.get("date") || new Date().toISOString().split("T")[0];
  const shiftFilter = searchParams.get("shift") || "All";
  const statusFilter = searchParams.get("status") || "All";
  const roleFilter = searchParams.get("role") || "All";
  const searchInput = searchParams.get("search") || "";

  const debouncedSearch = useDebounce(searchInput, 300);

  // Sync Search state with input
  const [localSearch, setLocalSearch] = useState(searchInput);
  useEffect(() => {
    setLocalSearch(searchInput);
  }, [searchInput]);

  const { data: staffList = [] } = useStaffList();

  const filters = useMemo(() => ({
    date: dateFilter,
    shiftId: shiftFilter,
    status: statusFilter,
    role: roleFilter,
    search: debouncedSearch
  }), [dateFilter, shiftFilter, statusFilter, roleFilter, debouncedSearch]);

  const { data: attendanceList = [], isLoading, isError, refetch } = useAttendanceList(filters);

  // Update a single filter query parameter
  const updateFilter = (key, value) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value && value !== "All") {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    });
  };

  // Reset all filters to today
  const handleClearFilters = () => {
    setSearchParams({ date: new Date().toISOString().split("T")[0] });
    setLocalSearch("");
  };

  const triggerAction = (action, record) => {
    setSelectedRecordId(record._id);
    setSelectedRecord(record);

    if (action === "view") setIsDetailsOpen(true);
    if (action === "edit") setIsEditOpen(true);
    if (action === "delete") setIsDeleteOpen(true);
  };

  // Staff information utility to lookup staff record
  const getStaffInfo = (staffId) => {
    return staffList.find((s) => s._id === staffId) || null;
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "present":
        return "bg-emerald-50 text-emerald-650 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
      case "leave":
        return "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
      case "absent":
        return "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30";
      case "half_day":
        return "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30";
      default:
        return "bg-zinc-50 text-zinc-500 border-zinc-150 dark:bg-zinc-950 dark:text-zinc-400 dark:border-zinc-850";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      {/* Header operations bar */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Daily Shift Attendance
          </h1>
          <p className="text-zinc-500 dark:text-zinc-450 text-xs mt-1">
            Monitor and record kitchen staff check-in details, working hours logs, and shift rosters.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsBulkOpen(true)}
            className="flex items-center justify-center gap-1.5 px-4 py-2 border border-zinc-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 bg-white dark:bg-zinc-900 text-xs font-bold rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 shadow-sm transition-all cursor-pointer"
          >
            <Users size={14} />
            <span>Bulk Attendance</span>
          </button>
          <button
            onClick={() => setIsMarkOpen(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary-hover active:scale-95 shadow-md hover:shadow-lg transition-all cursor-pointer"
          >
            <Plus size={14} className="stroke-[2.5]" />
            <span>Mark Log</span>
          </button>
        </div>
      </header>

      {/* Stats Summary cards */}
      <AttendanceStatsCards records={attendanceList} isLoading={isLoading} />

      {/* Filters ledger */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-3 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search employee name or code..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                updateFilter("search", e.target.value);
              }}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-primary text-xs font-semibold"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Date Picker */}
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 text-zinc-400" size={13} />
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => updateFilter("date", e.target.value)}
                className="pl-8 pr-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none text-xs font-semibold"
              />
            </div>

            {/* Shift dropdown */}
            <div className="relative">
              <select
                value={shiftFilter}
                onChange={(e) => updateFilter("shift", e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Shifts</option>
                <option value="Morning">Morning Shift</option>
                <option value="Afternoon">Afternoon Shift</option>
                <option value="Night">Night Shift</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 text-zinc-450 pointer-events-none" size={12} />
            </div>

            {/* Status dropdown */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => updateFilter("status", e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="leave">On Leave</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 text-zinc-450 pointer-events-none" size={12} />
            </div>

            {/* Role dropdown */}
            <div className="relative">
              <select
                value={roleFilter}
                onChange={(e) => updateFilter("role", e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Roles</option>
                <option value="Kitchen Supervisor">Kitchen Supervisor</option>
                <option value="Pizza Maker">Pizza Maker</option>
                <option value="Baker">Baker</option>
                <option value="Packager">Packager</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 text-zinc-450 pointer-events-none" size={12} />
            </div>

            {(searchInput || shiftFilter !== "All" || statusFilter !== "All" || roleFilter !== "All") && (
              <button
                onClick={handleClearFilters}
                className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                title="Clear filters"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main List / Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="flex gap-4 items-center">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-3 w-1/4 rounded" />
                  <Skeleton className="h-2 w-1/3 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="mx-auto text-red-500" size={24} />
            <p className="text-zinc-500 font-bold">Failed to load attendance logs</p>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-full cursor-pointer shadow active:scale-95"
            >
              Retry Connection
            </button>
          </div>
        ) : attendanceList.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <UserCheck className="mx-auto text-zinc-400" size={32} />
            <p className="text-zinc-500 font-black text-sm">No Attendance Logs Match Filters</p>
            <p className="text-[10px] text-zinc-400">
              Clear filters, select another date, or mark new logs using the actions above.
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-bold text-slate-700 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-[9px] uppercase tracking-wider text-zinc-400">
                    <th className="py-3.5 px-4 font-black">Employee</th>
                    <th className="py-3.5 px-4 font-black">Role</th>
                    <th className="py-3.5 px-4 font-black">Shift</th>
                    <th className="py-3.5 px-4 font-black">Check In</th>
                    <th className="py-3.5 px-4 font-black">Check Out</th>
                    <th className="py-3.5 px-4 font-black">Hours</th>
                    <th className="py-3.5 px-4 font-black">Overtime</th>
                    <th className="py-3.5 px-4 font-black">Status</th>
                    <th className="py-3.5 px-4 font-black">Marked By</th>
                    <th className="py-3.5 px-4 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {attendanceList.map((log) => {
                    const staff = getStaffInfo(log.staffId);
                    return (
                      <tr key={log._id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-950/20 transition-all">
                        {/* 1. Employee */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={staff?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${staff?.fullName || "ST"}`}
                              alt={staff?.fullName || "Employee"}
                              className="w-8 h-8 rounded-full border border-zinc-150 dark:border-zinc-800 object-cover bg-zinc-50"
                            />
                            <div>
                              <p className="text-slate-900 dark:text-white font-extrabold">{staff?.fullName || "Loading..."}</p>
                              <p className="text-[9px] text-zinc-400 font-extrabold uppercase">{staff?.employeeCode || "---"}</p>
                            </div>
                          </div>
                        </td>

                        {/* 2. Role */}
                        <td className="py-3 px-4">
                          <span className="text-[10px] text-zinc-500 font-extrabold uppercase tracking-wide">
                            {staff?.role || "---"}
                          </span>
                        </td>

                        {/* 3. Shift */}
                        <td className="py-3 px-4">
                          <span className="font-extrabold text-slate-800 dark:text-zinc-300">
                            {log.shiftId} Shift
                          </span>
                        </td>

                        {/* 4. Check In */}
                        <td className="py-3 px-4">
                          {log.checkIn ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                              <span className="font-extrabold text-slate-900 dark:text-zinc-200">{log.checkIn}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 font-semibold">--</span>
                          )}
                        </td>

                        {/* 5. Check Out */}
                        <td className="py-3 px-4">
                          {log.checkOut ? (
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                              <span className="font-extrabold text-slate-900 dark:text-zinc-200">{log.checkOut}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-450 font-semibold">{log.status === "present" ? "On Duty" : "--"}</span>
                          )}
                        </td>

                        {/* 6. Hours */}
                        <td className="py-3 px-4">
                          {log.totalHours > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700 text-slate-700 dark:text-zinc-300">
                              {log.totalHours} hrs
                            </span>
                          ) : (
                            <span className="text-zinc-400">--</span>
                          )}
                        </td>

                        {/* 7. Overtime */}
                        <td className="py-3 px-4">
                          {log.overtimeHours > 0 ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] bg-primary/10 border border-primary/20 text-primary font-black">
                              +{log.overtimeHours}h
                            </span>
                          ) : (
                            <span className="text-zinc-400 font-semibold">-</span>
                          )}
                        </td>

                        {/* 8. Status */}
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusBadgeStyle(log.status)}`}>
                            {log.status.replace("_", " ")}
                          </span>
                        </td>

                        {/* 9. Marked By */}
                        <td className="py-3 px-4 text-zinc-450 font-semibold">
                          {log.markedBy}
                        </td>

                        {/* 10. Actions */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex justify-end items-center gap-1">
                            <button
                              onClick={() => triggerAction("view", log)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-550 hover:text-slate-800 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
                              title="View Details"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => triggerAction("edit", log)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-550 hover:text-slate-800 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
                              title="Edit Log"
                            >
                              <Edit2 size={13} />
                            </button>
                            <button
                              onClick={() => triggerAction("delete", log)}
                              className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-650 rounded-lg cursor-pointer transition-colors"
                              title="Delete Record"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="block lg:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {attendanceList.map((log) => {
                const staff = getStaffInfo(log.staffId);
                return (
                  <div key={log._id} className="p-4 space-y-3 hover:bg-zinc-50/25 dark:hover:bg-zinc-950/10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={staff?.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${staff?.fullName || "ST"}`}
                          alt={staff?.fullName || "Employee"}
                          className="w-9 h-9 rounded-full border border-zinc-150 dark:border-zinc-800 object-cover"
                        />
                        <div>
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">{staff?.fullName || "Loading..."}</h4>
                          <p className="text-[9px] text-zinc-400 uppercase font-bold">{staff?.employeeCode}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${getStatusBadgeStyle(log.status)}`}>
                          {log.status.replace("_", " ")}
                        </span>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg outline-none cursor-pointer">
                            <MoreVertical size={14} className="text-zinc-550" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 w-32">
                            <DropdownMenuItem onClick={() => triggerAction("view", log)} className="cursor-pointer font-bold text-xs py-2 text-slate-800 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900">
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => triggerAction("edit", log)} className="cursor-pointer font-bold text-xs py-2 text-slate-800 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900">
                              Edit Log
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => triggerAction("delete", log)} className="cursor-pointer font-bold text-xs py-2 text-red-655 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl">
                              Delete Record
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-800 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-950/40 p-2.5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                      <div>
                        <span className="text-zinc-400 block text-[8px] uppercase">Shift</span>
                        <span>{log.shiftId} Shift</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[8px] uppercase">Hours Logged</span>
                        <span>{log.totalHours > 0 ? `${log.totalHours} hrs` : "--"}{log.overtimeHours > 0 && ` (+${log.overtimeHours}h OT)`}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-zinc-400 block text-[8px] uppercase">Check In</span>
                        <span>{log.checkIn || "--"}</span>
                      </div>
                      <div className="mt-1">
                        <span className="text-zinc-400 block text-[8px] uppercase">Check Out</span>
                        <span>{log.checkOut || (log.status === "present" ? "On Duty" : "--")}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Dialog Triggers */}
      {isMarkOpen && (
        <MarkAttendanceModal isOpen={isMarkOpen} onClose={() => setIsMarkOpen(false)} />
      )}
      {isBulkOpen && (
        <BulkAttendanceModal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} />
      )}
      {isEditOpen && selectedRecordId && (
        <EditAttendanceModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedRecordId(null);
            setSelectedRecord(null);
          }}
          attendanceId={selectedRecordId}
        />
      )}
      {isDetailsOpen && selectedRecord && (
        <AttendanceDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedRecordId(null);
            setSelectedRecord(null);
          }}
          attendanceRecord={selectedRecord}
        />
      )}
      {isDeleteOpen && selectedRecordId && (
        <DeleteAttendanceDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedRecordId(null);
            setSelectedRecord(null);
          }}
          attendanceId={selectedRecordId}
        />
      )}
    </div>
  );
}
