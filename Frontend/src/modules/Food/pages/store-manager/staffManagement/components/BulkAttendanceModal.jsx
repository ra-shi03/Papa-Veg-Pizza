import React, { useState, useEffect } from "react";
import { X, Calendar, Users, CheckCircle, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useStaffList } from "../hooks/useStaff";
import { useBulkMarkAttendance } from "../hooks/useAttendance";

export default function BulkAttendanceModal({ isOpen, onClose }) {
  const { data: staffList = [], isLoading: isLoadingStaff } = useStaffList({ status: "active" });
  const bulkMarkMutation = useBulkMarkAttendance();

  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [shiftId, setShiftId] = useState("Morning");
  const [attendanceStates, setAttendanceStates] = useState({});

  // Filter staff by the selected shift
  const filteredStaff = staffList.filter((s) => s.shiftId === shiftId && s.status === "active");

  // Initialize/Reset local attendance states when shift or staff list changes
  useEffect(() => {
    const initialStates = {};
    filteredStaff.forEach((staff) => {
      initialStates[staff._id] = "present"; // Default status is present
    });
    setAttendanceStates(initialStates);
  }, [shiftId, staffList]);

  const handleStatusChange = (staffId, status) => {
    setAttendanceStates((prev) => ({
      ...prev,
      [staffId]: status,
    }));
  };

  const handleMarkAll = (status) => {
    const updated = {};
    filteredStaff.forEach((staff) => {
      updated[staff._id] = status;
    });
    setAttendanceStates(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (filteredStaff.length === 0) return;

    const attendances = filteredStaff.map((staff) => ({
      staffId: staff._id,
      status: attendanceStates[staff._id] || "present",
    }));

    const payload = {
      storeId: "store-indore-01",
      shiftId,
      date,
      attendances,
      markedBy: "Shubham Jamliya", // Simulated logged-in Store Manager
    };

    bulkMarkMutation.mutate(payload, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-[95vw] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
            <Users size={16} className="text-primary" />
            Bulk Shift Attendance
          </DialogTitle>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer outline-none"
          >
            <X size={15} className="text-zinc-400" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4 text-xs font-semibold text-slate-700 dark:text-zinc-355">
          {/* Filters Row */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50/50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Roster Date</label>
              <div className="relative">
                <Calendar className="absolute right-3.5 top-3 text-zinc-400" size={14} />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-3 pr-9 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-850 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Roster Shift</label>
              <select
                value={shiftId}
                onChange={(e) => setShiftId(e.target.value)}
                className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-250 focus:outline-none"
              >
                <option value="Morning">Morning Shift</option>
                <option value="Afternoon">Afternoon Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>
          </div>

          {/* Quick Mark Toolbar */}
          {filteredStaff.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider">
                Roster Size: {filteredStaff.length} Employees
              </span>
              <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-full border border-zinc-200/50 dark:border-zinc-700/50">
                <button
                  type="button"
                  onClick={() => handleMarkAll("present")}
                  className="px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full bg-white dark:bg-zinc-900 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all cursor-pointer shadow-sm"
                >
                  All Present
                </button>
                <button
                  type="button"
                  onClick={() => handleMarkAll("absent")}
                  className="px-2.5 py-1 text-[9px] font-extrabold uppercase rounded-full bg-white dark:bg-zinc-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all cursor-pointer shadow-sm"
                >
                  All Absent
                </button>
              </div>
            </div>
          )}

          {/* Employee Roster List */}
          <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden max-h-80 overflow-y-auto bg-zinc-50/20 dark:bg-zinc-950/20">
            {isLoadingStaff ? (
              <div className="p-8 text-center text-zinc-450 font-medium">Loading roster staff...</div>
            ) : filteredStaff.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <AlertCircle className="mx-auto text-zinc-400" size={24} />
                <p className="text-zinc-500 font-bold">No active staff assigned to the {shiftId} Shift</p>
                <p className="text-[10px] text-zinc-400">Assign staff shifts in Kitchen Staff tab before marking roster.</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {filteredStaff.map((staff) => {
                  const currentStatus = attendanceStates[staff._id] || "present";
                  return (
                    <div
                      key={staff._id}
                      className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={staff.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${staff.fullName}`}
                          alt={staff.fullName}
                          className="w-8 h-8 rounded-full border border-zinc-200 dark:border-zinc-850 object-cover bg-zinc-100"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            {staff.fullName}
                            <span className="text-[8px] font-black uppercase text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                              {staff.employeeCode}
                            </span>
                          </p>
                          <p className="text-[9px] text-zinc-450 font-bold uppercase">{staff.role}</p>
                        </div>
                      </div>

                      {/* Status selector */}
                      <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-0.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800">
                        {[
                          { val: "present", label: "Present", color: "text-emerald-650 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-100 dark:border-emerald-900/40" },
                          { val: "absent", label: "Absent", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/40" },
                          { val: "half_day", label: "Half Day", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/40" },
                          { val: "leave", label: "Leave", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-100 dark:border-blue-900/40" },
                        ].map((btn) => {
                          const isSelected = currentStatus === btn.val;
                          return (
                            <button
                              key={btn.val}
                              type="button"
                              onClick={() => handleStatusChange(staff._id, btn.val)}
                              className={`px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase transition-all cursor-pointer border ${
                                isSelected
                                  ? `${btn.color} font-black shadow-sm scale-[1.03]`
                                  : "text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300 border-transparent bg-transparent"
                              }`}
                            >
                              {btn.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-900 active:scale-95 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={bulkMarkMutation.isPending || filteredStaff.length === 0}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-full active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bulkMarkMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} />
                  <span>Submit Roster ({filteredStaff.length})</span>
                </>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
