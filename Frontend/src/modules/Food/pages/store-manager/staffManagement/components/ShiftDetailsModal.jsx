import React, { useState, useMemo } from "react";
import { X, Clock, Calendar, Users, Award, Briefcase, Activity, Trash2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useShiftDetails, useAssignStaffToShift } from "../hooks/useShifts";
import { useStaffList } from "../hooks/useStaff";

const CircularProgress = ({ score }) => {
  const radius = 18;
  const stroke = 3;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center shrink-0">
      <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
        <circle
          stroke="rgba(0,0,0,0.06)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <circle
          stroke="var(--primary)"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute text-[8px] font-black text-slate-800 dark:text-zinc-200">{score}%</span>
    </div>
  );
};

export default function ShiftDetailsModal({ isOpen, onClose, shiftId, onViewStaffProfile }) {
  const { data: shift, isLoading: isLoadingShift } = useShiftDetails(shiftId);
  const { data: staffList = [] } = useStaffList();
  const assignMutation = useAssignStaffToShift();
  const [activeTab, setActiveTab] = useState("info");

  // Map employee list assigned to this shift
  const assignedEmployees = useMemo(() => {
    if (!shift || !Array.isArray(shift.assignedStaff)) return [];
    return staffList.filter((s) => shift.assignedStaff.includes(s._id));
  }, [shift, staffList]);

  // Working Hours calculation: (endTime - startTime) - breakMinutes
  const workingHours = useMemo(() => {
    if (!shift || !shift.startTime || !shift.endTime) return "0.0";

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
      endMins += 24 * 60; // Overnight shift crossing midnight
    }

    const netMins = endMins - startMins - (Number(shift.breakMinutes) || 0);
    return (Math.max(0, netMins) / 60).toFixed(1);
  }, [shift]);

  // Remove individual staff from shift roster
  const handleRemoveStaff = (staffIdToRemove) => {
    if (!shift) return;
    const updatedStaffIds = shift.assignedStaff.filter((id) => id !== staffIdToRemove);
    const payload = {
      staffIds: updatedStaffIds,
      effectiveFrom: new Date().toISOString().split("T")[0],
      notes: "Employee removed from shift roster",
    };

    assignMutation.mutate({ shiftId, payload });
  };

  const getRoleBadgeStyle = (role) => {
    const normalized = (role || "").toLowerCase();
    if (normalized.includes("supervisor")) {
      return "bg-purple-50 text-purple-755 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30";
    }
    if (normalized.includes("pizza") || normalized.includes("maker")) {
      return "bg-emerald-50 text-emerald-755 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30";
    }
    if (normalized.includes("baker")) {
      return "bg-orange-50 text-orange-755 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30";
    }
    if (normalized.includes("packager")) {
      return "bg-blue-50 text-blue-755 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30";
    }
    return "bg-zinc-50 text-zinc-550 border-zinc-150 dark:bg-zinc-800 dark:text-zinc-350";
  };

  // Mocked activities timeline for demonstration purposes
  const mockActivities = useMemo(() => {
    if (!shift) return [];
    return [
      { id: "act-1", type: "assignment", title: `Roster updated: ${assignedEmployees.length} staff active`, time: "Just Now", desc: "Updated via Manager Console." },
      { id: "act-2", type: "audit", title: "Shift settings configured", time: "1 week ago", desc: "Break minutes adjusted to 30 mins." },
      { id: "act-3", type: "system", title: "Shift created", time: "Created on " + new Date(shift.createdAt || Date.now()).toLocaleDateString("en-IN"), desc: `Created by ${shift.createdBy || "System"}` }
    ];
  }, [shift, assignedEmployees]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">
            Shift Details & Roster
          </DialogTitle>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer outline-none"
          >
            <X size={15} className="text-zinc-400" />
          </button>
        </DialogHeader>

        {isLoadingShift ? (
          <div className="py-12 text-center text-xs font-bold text-zinc-400">Loading details...</div>
        ) : (
          <div className="mt-4 text-xs font-semibold text-slate-700 dark:text-zinc-300 space-y-4">
            {/* Header Identity */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  {shift?.shiftName}
                  <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    shift?.status === "active"
                      ? "bg-emerald-50 border-emerald-100 text-emerald-650 dark:bg-emerald-950/20 dark:text-emerald-400"
                      : "bg-zinc-100 border-zinc-200 text-zinc-450 dark:bg-zinc-800 dark:text-zinc-400"
                  }`}>
                    {shift?.status}
                  </span>
                </h3>
                <p className="text-[10px] text-zinc-450 font-bold mt-0.5 italic">"{shift?.description || "No description set"}"</p>
              </div>
              <div className="text-left sm:text-right shrink-0">
                <p className="text-[9px] text-zinc-400 font-extrabold uppercase">Roster Capacity</p>
                <p className="font-black text-slate-900 dark:text-white text-xs">{assignedEmployees.length} / {shift?.maxStaff} Assigned</p>
              </div>
            </div>

            {/* Aesthetic Tabs Bar */}
            <div className="flex border-b border-zinc-150 dark:border-zinc-800 pb-px text-[10px] font-extrabold uppercase tracking-wider gap-5">
              {[
                { id: "info", label: "Shift Info" },
                { id: "staff", label: `Assigned Staff (${assignedEmployees.length})` },
                { id: "timeline", label: "Roster Log" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "border-b-2 border-primary text-primary font-black scale-102"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB CONTENTS */}
            <div className="min-h-[220px]">
              {/* Tab 1: Info */}
              {activeTab === "info" && (
                <div className="space-y-4 pt-1">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 p-3 rounded-xl">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Start Time</span>
                      <span className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                        <Clock size={12} className="text-primary" /> {shift?.startTime}
                      </span>
                    </div>
                    <div className="bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 p-3 rounded-xl">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">End Time</span>
                      <span className="text-xs font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                        <Clock size={12} className="text-primary" /> {shift?.endTime}
                      </span>
                    </div>
                    <div className="bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 p-3 rounded-xl">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Break Minutes</span>
                      <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
                        {shift?.breakMinutes} mins
                      </span>
                    </div>
                    <div className="bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-150 dark:border-zinc-850 p-3 rounded-xl">
                      <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest block mb-0.5">Working Hours</span>
                      <span className="text-xs font-black text-primary">
                        {workingHours} Hours
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50/30 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-2">
                    <h4 className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest block">Capacity Utilization</h4>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden border border-zinc-200/50 dark:border-zinc-700/50">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-300"
                          style={{ width: `${Math.min(100, (assignedEmployees.length / (shift?.maxStaff || 10)) * 100)}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-slate-800 dark:text-zinc-200">
                        {Math.round((assignedEmployees.length / (shift?.maxStaff || 10)) * 100)}%
                      </span>
                    </div>
                  </div>

                  <div className="text-[9px] font-bold text-zinc-450 space-y-1.5 pl-1.5">
                    <p>Created By: {shift?.createdBy || "Shubham Jamliya"}</p>
                    <p>Created At: {new Date(shift?.createdAt || Date.now()).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                  </div>
                </div>
              )}

              {/* Tab 2: Assigned Staff */}
              {activeTab === "staff" && (
                <div className="space-y-2 pt-1 max-h-[300px] overflow-y-auto">
                  {assignedEmployees.length === 0 ? (
                    <div className="py-12 text-center text-zinc-450 font-bold">
                      No employees assigned to this shift yet.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-100 dark:divide-zinc-850 border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden bg-zinc-50/20 dark:bg-zinc-950/10">
                      {assignedEmployees.map((staff) => (
                        <div key={staff._id} className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                          <div className="flex items-center gap-3">
                            <img
                              src={staff.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${staff.fullName}`}
                              alt={staff.fullName}
                              className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover bg-zinc-50"
                            />
                            <div>
                              <p className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                                {staff.fullName}
                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getRoleBadgeStyle(staff.role)}`}>
                                  {staff.role}
                                </span>
                              </p>
                              <p className="text-[9px] text-zinc-450 font-bold uppercase mt-0.5">Code: {staff.employeeCode} • {staff.experience} Years Exp</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-5">
                            {/* Attendance % */}
                            <div className="hidden sm:block text-right">
                              <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Attendance</span>
                              <div className="flex items-center gap-1.5">
                                <span className="font-extrabold text-slate-800 dark:text-zinc-200">{staff.stats?.attendance || 90}%</span>
                              </div>
                            </div>

                            {/* Performance Score */}
                            <div className="shrink-0">
                              <CircularProgress score={staff.performanceScore || 90} />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1">
                              {onViewStaffProfile && (
                                <button
                                  type="button"
                                  onClick={() => onViewStaffProfile(staff._id)}
                                  className="p-1.5 hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-450 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                                  title="View Profile"
                                >
                                  <ArrowRight size={13} />
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveStaff(staff._id)}
                                disabled={assignMutation.isPending}
                                className="p-1.5 hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-650 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Remove Roster"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Timeline Activities */}
              {activeTab === "timeline" && (
                <div className="space-y-3 pt-2 max-h-[300px] overflow-y-auto pl-2">
                  <div className="relative border-l border-zinc-200 dark:border-zinc-800 space-y-4 pb-4">
                    {mockActivities.map((act) => (
                      <div key={act.id} className="relative pl-6">
                        {/* Dot */}
                        <span className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-zinc-200 dark:bg-zinc-800 border-2 border-white dark:border-zinc-900 flex items-center justify-center">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                        </span>
                        
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-extrabold text-slate-850 dark:text-zinc-200">{act.title}</span>
                            <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{act.time}</span>
                          </div>
                          <p className="text-[10px] text-zinc-450 mt-0.5 font-bold italic">"{act.desc}"</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
