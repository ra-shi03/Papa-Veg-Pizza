import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Search, Calendar, Clock, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useStaffList } from "../hooks/useStaff";
import { useMarkAttendance } from "../hooks/useAttendance";

const attendanceFormSchema = z.object({
  staffId: z.string().min(1, "Employee is required"),
  shiftId: z.string().min(1, "Shift is required"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["present", "absent", "half_day", "leave"]),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  notes: z.string().optional(),
}).refine((data) => {
  if ((data.status === "present" || data.status === "half_day") && !data.checkIn) {
    return false;
  }
  return true;
}, {
  message: "Check-in time is required for present/half-day status",
  path: ["checkIn"]
});

export default function MarkAttendanceModal({ isOpen, onClose }) {
  const { data: staffList = [] } = useStaffList({ status: "active" });
  const markAttendanceMutation = useMarkAttendance();
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(attendanceFormSchema),
    defaultValues: {
      staffId: "",
      shiftId: "Morning",
      date: new Date().toISOString().split("T")[0],
      status: "present",
      checkIn: "09:00",
      checkOut: "17:00",
      notes: "",
    },
  });

  const selectedStaffId = watch("staffId");
  const selectedStatus = watch("status");
  const checkInVal = watch("checkIn");
  const checkOutVal = watch("checkOut");

  // Auto-populate shift when employee is selected
  useEffect(() => {
    if (selectedStaffId) {
      const staffMember = staffList.find((s) => s._id === selectedStaffId);
      if (staffMember && staffMember.shiftId) {
        setValue("shiftId", staffMember.shiftId);
        
        // Adjust default times based on shift
        if (staffMember.shiftId === "Afternoon") {
          setValue("checkIn", "16:00");
          setValue("checkOut", "00:00");
        } else if (staffMember.shiftId === "Night") {
          setValue("checkIn", "23:00");
          setValue("checkOut", "07:00");
        } else {
          setValue("checkIn", "09:00");
          setValue("checkOut", "17:00");
        }
      }
    }
  }, [selectedStaffId, staffList, setValue]);

  // Handle status change default values
  useEffect(() => {
    if (selectedStatus === "absent" || selectedStatus === "leave") {
      setValue("checkIn", "");
      setValue("checkOut", "");
    } else if (selectedStatus === "half_day") {
      setValue("checkIn", "09:00");
      setValue("checkOut", "13:00");
    } else if (selectedStatus === "present" && !checkInVal) {
      setValue("checkIn", "09:00");
      setValue("checkOut", "17:00");
    }
  }, [selectedStatus, setValue]);

  const filteredStaff = staffList.filter(
    (s) =>
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedStaffName = staffList.find((s) => s._id === selectedStaffId)?.fullName || "";

  // Helper to format 24h input to 12h AM/PM
  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [hoursStr, minutesStr] = time24.split(":");
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, "0")}:${minutesStr} ${ampm}`;
  };

  const handleSave = (formData) => {
    let totalHours = 0;
    let overtimeHours = 0;

    if (formData.status === "present" || formData.status === "half_day") {
      if (formData.checkIn && formData.checkOut) {
        const [inH, inM] = formData.checkIn.split(":").map(Number);
        const [outH, outM] = formData.checkOut.split(":").map(Number);

        let inMinutes = inH * 60 + inM;
        let outMinutes = outH * 60 + outM;

        if (outMinutes < inMinutes) {
          outMinutes += 24 * 60; // Crosses midnight
        }

        const workingMinutes = outMinutes - inMinutes;
        totalHours = Math.round((workingMinutes / 60) * 100) / 100;
        overtimeHours = Math.max(0, Math.round((totalHours - 8.0) * 100) / 100);
      } else if (formData.status === "half_day") {
        totalHours = 4.0;
        overtimeHours = 0;
      }
    }

    const payload = {
      staffId: formData.staffId,
      shiftId: formData.shiftId,
      date: formData.date,
      checkIn: convertTo12Hour(formData.checkIn),
      checkOut: convertTo12Hour(formData.checkOut),
      totalHours,
      overtimeHours,
      status: formData.status,
      markedBy: "Shubham Jamliya", // Logged-in Manager simulation
      notes: formData.notes || "",
    };

    markAttendanceMutation.mutate(payload, {
      onSuccess: () => {
        reset();
        setSearchTerm("");
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[92vw] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">
            Mark Attendance
          </DialogTitle>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer outline-none"
          >
            <X size={15} className="text-zinc-400" />
          </button>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleSave)} className="space-y-4 mt-4 text-xs font-semibold text-slate-700 dark:text-zinc-300">
          {/* Employee search field */}
          <div className="space-y-1 relative">
            <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Employee</label>
            <div className="relative">
              <Search className="absolute left-3 top-3 text-zinc-400" size={14} />
              <input
                type="text"
                placeholder={selectedStaffName || "Search employee name or code..."}
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                className="w-full pl-9 pr-4 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-primary shadow-inner"
              />
            </div>
            
            {showDropdown && (
              <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg max-h-40 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-900">
                {filteredStaff.length === 0 ? (
                  <p className="p-2.5 text-zinc-400 text-center">No active staff found</p>
                ) : (
                  filteredStaff.map((staff) => (
                    <div
                      key={staff._id}
                      onClick={() => {
                        setValue("staffId", staff._id);
                        setSearchTerm("");
                        setShowDropdown(false);
                      }}
                      className="p-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer flex items-center justify-between transition-colors"
                    >
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white">{staff.fullName}</p>
                        <p className="text-[9px] text-zinc-400 font-bold uppercase">{staff.employeeCode}</p>
                      </div>
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-650">
                        {staff.role}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
            {errors.staffId && (
              <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-0.5 pl-1"><AlertCircle size={10} /> {errors.staffId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Shift Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Shift</label>
              <select
                {...register("shiftId")}
                className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none"
              >
                <option value="Morning">Morning Shift</option>
                <option value="Afternoon">Afternoon Shift</option>
                <option value="Night">Night Shift</option>
              </select>
            </div>

            {/* Date Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Date</label>
              <div className="relative">
                <Calendar className="absolute right-3.5 top-3 text-zinc-400" size={14} />
                <input
                  type="date"
                  {...register("date")}
                  className="w-full pl-3 pr-9 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Status field */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest pl-1">Attendance Status</label>
            <select
              {...register("status")}
              className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none"
            >
              <option value="present">Present</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="leave">On Leave</option>
            </select>
          </div>

          {/* Times Fields (only if present or half day) */}
          {(selectedStatus === "present" || selectedStatus === "half_day") && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50/50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Check In Time</label>
                <div className="relative">
                  <Clock className="absolute right-3.5 top-3 text-zinc-400" size={13} />
                  <input
                    type="time"
                    {...register("checkIn")}
                    className="w-full pl-3 pr-9 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-850 focus:outline-none"
                  />
                </div>
                {errors.checkIn && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-0.5"><AlertCircle size={9} /> {errors.checkIn.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Check Out Time</label>
                <div className="relative">
                  <Clock className="absolute right-3.5 top-3 text-zinc-400" size={13} />
                  <input
                    type="time"
                    {...register("checkOut")}
                    className="w-full pl-3 pr-9 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-850 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes field */}
          <div className="space-y-1">
            <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Notes (Optional)</label>
            <textarea
              {...register("notes")}
              placeholder="Enter attendance remarks or reasons..."
              rows={2}
              className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 focus:outline-none focus:border-primary shadow-inner text-xs font-semibold resize-none"
            />
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
              disabled={markAttendanceMutation.isPending}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-full active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
            >
              {markAttendanceMutation.isPending ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                <span>Save Attendance</span>
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
