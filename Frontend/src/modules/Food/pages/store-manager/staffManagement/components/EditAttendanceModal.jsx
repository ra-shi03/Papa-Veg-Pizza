import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Calendar, Clock, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useStaffList } from "../hooks/useStaff";
import { useAttendanceDetails, useUpdateAttendance } from "../hooks/useAttendance";

const editAttendanceFormSchema = z.object({
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

export default function EditAttendanceModal({ isOpen, onClose, attendanceId }) {
  const { data: staffList = [] } = useStaffList();
  const { data: attendance, isLoading } = useAttendanceDetails(attendanceId);
  const updateMutation = useUpdateAttendance();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(editAttendanceFormSchema),
    defaultValues: {
      shiftId: "Morning",
      date: "",
      status: "present",
      checkIn: "",
      checkOut: "",
      notes: "",
    },
  });

  const selectedStatus = watch("status");
  const checkInVal = watch("checkIn");

  // Helper to convert 12h format ("09:00 AM") back to 24h format ("09:00") for HTML time input
  const convertTo24Hour = (time12) => {
    if (!time12) return "";
    const match = time12.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!match) return "";
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const ampm = match[3].toUpperCase();

    if (ampm === "PM" && hours < 12) {
      hours += 12;
    } else if (ampm === "AM" && hours === 12) {
      hours = 0;
    }

    return `${String(hours).padStart(2, "0")}:${minutes}`;
  };

  // Helper to convert 24h format to 12h format
  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [hoursStr, minutesStr] = time24.split(":");
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, "0")}:${minutesStr} ${ampm}`;
  };

  // Pre-populate form when attendance details are fetched
  useEffect(() => {
    if (attendance) {
      reset({
        shiftId: attendance.shiftId,
        date: attendance.date,
        status: attendance.status,
        checkIn: convertTo24Hour(attendance.checkIn),
        checkOut: convertTo24Hour(attendance.checkOut),
        notes: attendance.notes || "",
      });
    }
  }, [attendance, reset]);

  // Adjust defaults on status changes
  useEffect(() => {
    if (selectedStatus === "absent" || selectedStatus === "leave") {
      setValue("checkIn", "");
      setValue("checkOut", "");
    } else if (selectedStatus === "half_day" && !checkInVal) {
      setValue("checkIn", "09:00");
      setValue("checkOut", "13:00");
    } else if (selectedStatus === "present" && !checkInVal) {
      setValue("checkIn", "09:00");
      setValue("checkOut", "17:00");
    }
  }, [selectedStatus, setValue]);

  const staffMember = attendance ? staffList.find((s) => s._id === attendance.staffId) : null;

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
      shiftId: formData.shiftId,
      date: formData.date,
      checkIn: convertTo12Hour(formData.checkIn),
      checkOut: convertTo12Hour(formData.checkOut),
      totalHours,
      overtimeHours,
      status: formData.status,
      notes: formData.notes || "",
      markedBy: "Shubham Jamliya", // Simulator Store Manager
    };

    updateMutation.mutate({ id: attendanceId, payload }, {
      onSuccess: () => {
        onClose();
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-[92vw] bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl">
        <DialogHeader className="flex flex-row items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
          <DialogTitle className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200">
            Edit Attendance Log
          </DialogTitle>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer outline-none"
          >
            <X size={15} className="text-zinc-400" />
          </button>
        </DialogHeader>

        {isLoading ? (
          <div className="py-12 text-center text-xs font-bold text-zinc-400">Loading details...</div>
        ) : (
          <form onSubmit={handleSubmit(handleSave)} className="space-y-4 mt-4 text-xs font-semibold text-slate-700 dark:text-zinc-300">
            {/* Read-only Employee Badge */}
            {staffMember && (
              <div className="flex items-center gap-2.5 p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                <img
                  src={staffMember.profileImage || `https://api.dicebear.com/7.x/initials/svg?seed=${staffMember.fullName}`}
                  alt={staffMember.fullName}
                  className="w-9 h-9 rounded-full border border-zinc-250 dark:border-zinc-800 object-cover bg-zinc-100"
                />
                <div>
                  <p className="font-extrabold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                    {staffMember.fullName}
                    <span className="text-[8px] font-black uppercase text-zinc-400 bg-zinc-200/50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {staffMember.employeeCode}
                    </span>
                  </p>
                  <p className="text-[9px] text-zinc-450 font-bold uppercase">{staffMember.role}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {/* Shift Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Shift</label>
                <select
                  {...register("shiftId")}
                  className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
                >
                  <option value="Morning">Morning Shift</option>
                  <option value="Afternoon">Afternoon Shift</option>
                  <option value="Night">Night Shift</option>
                </select>
              </div>

              {/* Date Field */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute right-3.5 top-3 text-zinc-400" size={14} />
                  <input
                    type="date"
                    {...register("date")}
                    className="w-full pl-3 pr-9 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-850 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Status Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Attendance Status</label>
              <select
                {...register("status")}
                className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="half_day">Half Day</option>
                <option value="leave">On Leave</option>
              </select>
            </div>

            {/* Times (if applicable) */}
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

            {/* Notes Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Notes (Optional)</label>
              <textarea
                {...register("notes")}
                placeholder="Enter remarks or edits reason..."
                rows={2}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 focus:outline-none focus:border-primary shadow-inner text-xs font-semibold resize-none"
              />
            </div>

            {/* Actions */}
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
                disabled={updateMutation.isPending}
                className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white font-bold rounded-full active:scale-95 transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
              >
                {updateMutation.isPending ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Update Log</span>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
