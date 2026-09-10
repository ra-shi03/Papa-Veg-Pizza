import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Plus, 
  Search, 
  MoreVertical, 
  Clock, 
  SlidersHorizontal,
  ChevronDown,
  X, 
  AlertCircle,
  Eye,
  Edit2,
  Trash2,
  UserPlus,
  RefreshCw,
  PowerOff
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@food/components/ui/dropdown-menu";
import { Skeleton } from "@food/components/ui/skeleton";

// Custom Hooks and Components
import { useShiftList } from "./hooks/useShifts";
import { useStaffList } from "./hooks/useStaff";
import ShiftStatsCards from "./components/ShiftStatsCards";
import CreateShiftModal from "./components/CreateShiftModal";
import EditShiftModal from "./components/EditShiftModal";
import AssignStaffModal from "./components/AssignStaffModal";
import ShiftDetailsModal from "./components/ShiftDetailsModal";
import DeactivateShiftDialog from "./components/DeactivateShiftDialog";
import DeleteShiftDialog from "./components/DeleteShiftDialog";

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

export default function ShiftManagement() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Dialog Trigger States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected Shift States
  const [selectedShiftId, setSelectedShiftId] = useState(null);

  // Filter settings synced from URL
  const statusFilter = searchParams.get("status") || "All";
  const searchInput = searchParams.get("search") || "";
  const debouncedSearch = useDebounce(searchInput, 300);

  const [localSearch, setLocalSearch] = useState(searchInput);
  useEffect(() => {
    setLocalSearch(searchInput);
  }, [searchInput]);

  // Fetch shifts list and staff database
  const filters = useMemo(() => ({
    status: statusFilter,
    search: debouncedSearch
  }), [statusFilter, debouncedSearch]);

  const { data: shiftsList = [], isLoading, isError, refetch } = useShiftList(filters);
  const { data: staffList = [] } = useStaffList({ status: "active" });

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

  const handleClearFilters = () => {
    setSearchParams({});
    setLocalSearch("");
  };

  const triggerAction = (action, shiftId) => {
    setSelectedShiftId(shiftId);
    if (action === "view") setIsDetailsOpen(true);
    if (action === "edit") setIsEditOpen(true);
    if (action === "assign") setIsAssignOpen(true);
    if (action === "deactivate") setIsDeactivateOpen(true);
    if (action === "delete") setIsDeleteOpen(true);
  };

  // Helper to calculate working hours: (endTime - startTime) - breakMinutes
  const calculateWorkingHours = (shift) => {
    if (!shift.startTime || !shift.endTime) return "0.0";

    const parseTimeToMinutes = (timeStr) => {
      const match = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
      if (!match) return 0;
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3].toUpperCase();

      if (ampm === "PM" && hours < 12) hours += 12;
      else if (ampm === "AM" && hours === 12) hours = 0;

      return hours * 60 + minutes;
    };

    const startMins = parseTimeToMinutes(shift.startTime);
    let endMins = parseTimeToMinutes(shift.endTime);

    if (endMins < startMins) {
      endMins += 24 * 60; // Crosses midnight
    }

    const netMins = endMins - startMins - (Number(shift.breakMinutes) || 0);
    return (Math.max(0, netMins) / 60).toFixed(1);
  };

  // Capacity Utilization percentage calculations
  const getCapacityPercent = (shift) => {
    const assignedCount = Array.isArray(shift.assignedStaff) ? shift.assignedStaff.length : 0;
    const maxCapacity = Number(shift.maxStaff) || 1;
    return Math.round((assignedCount / maxCapacity) * 100);
  };

  // Progress bar color assignments based on capacity percent thresholds
  const getProgressBarColor = (percent) => {
    if (percent < 70) return "bg-emerald-500";
    if (percent <= 90) return "bg-amber-500";
    return "bg-rose-500";
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full">
      {/* Header Panel */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Shift Management
          </h1>
          <p className="text-zinc-500 dark:text-zinc-450 text-xs mt-1">
            Create, manage, and assign employees to store shifts.
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-full active:scale-95 shadow-md hover:shadow-lg transition-all cursor-pointer self-start sm:self-center"
        >
          <Plus size={14} className="stroke-[2.5]" />
          <span>Create Shift</span>
        </button>
      </header>

      {/* Dashboard KPI cards */}
      <ShiftStatsCards shifts={shiftsList} staff={staffList} isLoading={isLoading} />

      {/* Filters ledger */}
      <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-3 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search shift name..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                updateFilter("search", e.target.value);
              }}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-primary text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Status Filter */}
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => updateFilter("status", e.target.value)}
                className="appearance-none pl-3 pr-8 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none text-xs font-semibold cursor-pointer"
              >
                <option value="All">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-2.5 text-zinc-450 pointer-events-none" size={12} />
            </div>

            {(searchInput || statusFilter !== "All") && (
              <button
                onClick={handleClearFilters}
                className="p-2 border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-805 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                title="Clear filters"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Shift Data Grid/Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-3xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 space-y-4">
            {Array.from({ length: 3 }).map((_, idx) => (
              <div key={idx} className="space-y-2.5">
                <Skeleton className="h-4 w-1/4 rounded" />
                <Skeleton className="h-3 w-1/2 rounded" />
                <Skeleton className="h-2 w-full rounded" />
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center space-y-3">
            <AlertCircle className="mx-auto text-red-500" size={24} />
            <p className="text-zinc-500 font-bold">Unable to load store shifts</p>
            <button
              onClick={() => refetch()}
              className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-full cursor-pointer shadow active:scale-95"
            >
              Retry Connection
            </button>
          </div>
        ) : shiftsList.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Clock className="mx-auto text-zinc-400" size={32} />
            <p className="text-zinc-500 font-black text-sm">No Store Shifts Configured</p>
            <p className="text-[10px] text-zinc-400 max-w-sm mx-auto">
              Get started by creating your first store shift to organize scheduling rosters and employee assignments.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2 bg-primary text-white text-xs font-bold rounded-full cursor-pointer shadow active:scale-95"
            >
              Create Shift
            </button>
          </div>
        ) : (
          <>
            {/* Desktop Table view */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-bold text-slate-700 dark:text-zinc-300">
                <thead>
                  <tr className="border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 text-[9px] uppercase tracking-wider text-zinc-400">
                    <th className="py-3.5 px-4 font-black">Shift Name</th>
                    <th className="py-3.5 px-4 font-black">Timings</th>
                    <th className="py-3.5 px-4 font-black">Working Hours</th>
                    <th className="py-3.5 px-4 font-black">Break Duration</th>
                    <th className="py-3.5 px-4 font-black">Roster Utilization</th>
                    <th className="py-3.5 px-4 font-black">Capacity</th>
                    <th className="py-3.5 px-4 font-black">Status</th>
                    <th className="py-3.5 px-4 font-black text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-805">
                  {shiftsList.map((shift) => {
                    const percent = getCapacityPercent(shift);
                    const hours = calculateWorkingHours(shift);
                    const assignedCount = Array.isArray(shift.assignedStaff) ? shift.assignedStaff.length : 0;

                    return (
                      <tr key={shift._id} className="hover:bg-zinc-50/40 dark:hover:bg-zinc-950/20 transition-all">
                        {/* 1. Shift Name */}
                        <td className="py-4 px-4 font-extrabold text-slate-900 dark:text-white">
                          {shift.shiftName}
                        </td>

                        {/* 2. Timings */}
                        <td className="py-4 px-4">
                          <span className="text-zinc-700 dark:text-zinc-200">
                            {shift.startTime} - {shift.endTime}
                          </span>
                        </td>

                        {/* 3. Working Hours */}
                        <td className="py-4 px-4 text-slate-800 dark:text-zinc-250">
                          {hours} Hours
                        </td>

                        {/* 4. Break Duration */}
                        <td className="py-4 px-4 text-zinc-500 dark:text-zinc-400">
                          {shift.breakMinutes} Mins
                        </td>

                        {/* 5. Utilization Progress */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2 max-w-[120px]">
                            <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/40 dark:border-zinc-700/50">
                              <div
                                className={`h-full rounded-full transition-all ${getProgressBarColor(percent)}`}
                                style={{ width: `${Math.min(100, percent)}%` }}
                              />
                            </div>
                            <span className="text-[10px] text-zinc-500 font-extrabold shrink-0">
                              {percent}%
                            </span>
                          </div>
                        </td>

                        {/* 6. Capacity */}
                        <td className="py-4 px-4 text-slate-700 dark:text-zinc-300">
                          {assignedCount} / {shift.maxStaff} Staff
                        </td>

                        {/* 7. Status */}
                        <td className="py-4 px-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                            shift.status === "active"
                              ? "bg-emerald-50 text-emerald-650 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                              : "bg-zinc-50 text-zinc-500 border-zinc-150 dark:bg-zinc-950 dark:text-zinc-400"
                          }`}>
                            {shift.status}
                          </span>
                        </td>

                        {/* 8. Actions */}
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end items-center gap-0.5">
                            <button
                              onClick={() => triggerAction("view", shift._id)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-550 hover:text-slate-800 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
                              title="View Details"
                            >
                              <Eye size={13} />
                            </button>
                            <button
                              onClick={() => triggerAction("assign", shift._id)}
                              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-550 hover:text-slate-850 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
                              title="Assign Staff"
                            >
                              <UserPlus size={13} />
                            </button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-805 rounded-lg outline-none cursor-pointer">
                                <MoreVertical size={13} className="text-zinc-550" />
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 w-32">
                                <DropdownMenuItem onClick={() => triggerAction("edit", shift._id)} className="cursor-pointer font-bold text-xs py-2 text-slate-800 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5">
                                  <Edit2 size={11} />
                                  <span>Edit details</span>
                                </DropdownMenuItem>
                                {shift.status === "active" && (
                                  <DropdownMenuItem onClick={() => triggerAction("deactivate", shift._id)} className="cursor-pointer font-bold text-xs py-2 text-amber-600 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5">
                                    <PowerOff size={11} />
                                    <span>Deactivate</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => triggerAction("delete", shift._id)} className="cursor-pointer font-bold text-xs py-2 text-red-655 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl flex items-center gap-1.5">
                                  <Trash2 size={11} />
                                  <span>Delete Shift</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards view */}
            <div className="block lg:hidden divide-y divide-zinc-100 dark:divide-zinc-800">
              {shiftsList.map((shift) => {
                const percent = getCapacityPercent(shift);
                const hours = calculateWorkingHours(shift);
                const assignedCount = Array.isArray(shift.assignedStaff) ? shift.assignedStaff.length : 0;

                return (
                  <div key={shift._id} className="p-4 space-y-3 hover:bg-zinc-50/20 dark:hover:bg-zinc-950/10">
                    <div className="flex items-center justify-between">
                      <h4 className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {shift.shiftName}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                        shift.status === "active"
                          ? "bg-emerald-50 text-emerald-650 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400"
                          : "bg-zinc-50 text-zinc-500 border-zinc-150 dark:bg-zinc-950 dark:text-zinc-450"
                      }`}>
                        {shift.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-800 dark:text-zinc-300 bg-zinc-50/50 dark:bg-zinc-950/40 p-2.5 rounded-2xl border border-zinc-150 dark:border-zinc-850">
                      <div>
                        <span className="text-zinc-400 block text-[8px] uppercase">Timings</span>
                        <span>{shift.startTime} - {shift.endTime}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[8px] uppercase">Hours Logged</span>
                        <span>{hours} hrs ({shift.breakMinutes}m break)</span>
                      </div>
                      <div className="mt-1 col-span-2">
                        <span className="text-zinc-400 block text-[8px] uppercase mb-0.5">Staff Allocation ({assignedCount} / {shift.maxStaff})</span>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/40">
                            <div
                              className={`h-full rounded-full transition-all ${getProgressBarColor(percent)}`}
                              style={{ width: `${Math.min(100, percent)}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-black text-zinc-500">{percent}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        onClick={() => triggerAction("view", shift._id)}
                        className="px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 rounded-full text-[9px] font-extrabold hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Eye size={10} /> View details
                      </button>
                      <button
                        onClick={() => triggerAction("assign", shift._id)}
                        className="px-3 py-1.5 bg-primary text-white rounded-full text-[9px] font-extrabold active:scale-95 flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus size={10} /> Assign Staff
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger className="p-1.5 border border-zinc-200 dark:border-zinc-800 rounded-full text-zinc-500 hover:text-zinc-850 hover:bg-zinc-55 outline-none cursor-pointer">
                          <MoreVertical size={11} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1 w-32">
                          <DropdownMenuItem onClick={() => triggerAction("edit", shift._id)} className="cursor-pointer font-bold text-xs py-2 text-slate-800 dark:text-zinc-300 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5">
                            <Edit2 size={11} />
                            <span>Edit Shift</span>
                          </DropdownMenuItem>
                          {shift.status === "active" && (
                            <DropdownMenuItem onClick={() => triggerAction("deactivate", shift._id)} className="cursor-pointer font-bold text-xs py-2 text-amber-600 rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-900 flex items-center gap-1.5">
                              <PowerOff size={11} />
                              <span>Deactivate</span>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => triggerAction("delete", shift._id)} className="cursor-pointer font-bold text-xs py-2 text-red-655 hover:bg-red-50 dark:hover:bg-red-955/20 rounded-xl flex items-center gap-1.5">
                            <Trash2 size={11} />
                            <span>Delete Shift</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Modal Dialog Mounts */}
      {isCreateOpen && (
        <CreateShiftModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
      )}
      {isEditOpen && selectedShiftId && (
        <EditShiftModal
          isOpen={isEditOpen}
          onClose={() => {
            setIsEditOpen(false);
            setSelectedShiftId(null);
          }}
          shiftId={selectedShiftId}
        />
      )}
      {isAssignOpen && selectedShiftId && (
        <AssignStaffModal
          isOpen={isAssignOpen}
          onClose={() => {
            setIsAssignOpen(false);
            setSelectedShiftId(null);
          }}
          shiftId={selectedShiftId}
        />
      )}
      {isDetailsOpen && selectedShiftId && (
        <ShiftDetailsModal
          isOpen={isDetailsOpen}
          onClose={() => {
            setIsDetailsOpen(false);
            setSelectedShiftId(null);
          }}
          shiftId={selectedShiftId}
        />
      )}
      {isDeactivateOpen && selectedShiftId && (
        <DeactivateShiftDialog
          isOpen={isDeactivateOpen}
          onClose={() => {
            setIsDeactivateOpen(false);
            setSelectedShiftId(null);
          }}
          shiftId={selectedShiftId}
        />
      )}
      {isDeleteOpen && selectedShiftId && (
        <DeleteShiftDialog
          isOpen={isDeleteOpen}
          onClose={() => {
            setIsDeleteOpen(false);
            setSelectedShiftId(null);
          }}
          shiftId={selectedShiftId}
        />
      )}
    </div>
  );
}
