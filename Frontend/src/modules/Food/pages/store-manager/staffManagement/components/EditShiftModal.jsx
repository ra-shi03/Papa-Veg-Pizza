import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { X, Clock, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useShiftDetails, useUpdateShift } from "../hooks/useShifts";

const shiftFormSchema = z.object({
  shiftName: z.string().min(1, "Shift name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  breakMinutes: z.coerce.number().min(0, "Break minutes cannot be negative").max(120, "Break cannot exceed 120 minutes"),
  maxStaff: z.coerce.number().min(1, "Maximum staff capacity must be at least 1").max(50, "Capacity cannot exceed 50 staff"),
  status: z.enum(["active", "inactive"]),
  description: z.string().optional(),
}).refine((data) => {
  return data.startTime !== data.endTime;
}, {
  message: "End time cannot be identical to start time",
  path: ["endTime"]
});

export default function EditShiftModal({ isOpen, onClose, shiftId }) {
  const { data: shift, isLoading } = useShiftDetails(shiftId);
  const updateMutation = useUpdateShift();

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(shiftFormSchema),
    defaultValues: {
      shiftName: "",
      startTime: "",
      endTime: "",
      breakMinutes: 30,
      maxStaff: 10,
      status: "active",
      description: "",
    },
  });

  // Convert 12h AM/PM ("09:00 AM") format to 24h HTML time format ("09:00")
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

  // Convert HTML 24h format to 12h AM/PM format
  const convertTo12Hour = (time24) => {
    if (!time24) return "";
    const [hoursStr, minutesStr] = time24.split(":");
    const hours = parseInt(hoursStr, 10);
    const ampm = hours >= 12 ? "PM" : "AM";
    const hours12 = hours % 12 || 12;
    return `${String(hours12).padStart(2, "0")}:${minutesStr} ${ampm}`;
  };

  useEffect(() => {
    if (shift) {
      reset({
        shiftName: shift.shiftName,
        startTime: convertTo24Hour(shift.startTime),
        endTime: convertTo24Hour(shift.endTime),
        breakMinutes: shift.breakMinutes,
        maxStaff: shift.maxStaff,
        status: shift.status || "active",
        description: shift.description || "",
      });
    }
  }, [shift, reset]);

  const handleSave = (formData) => {
    const payload = {
      shiftName: formData.shiftName,
      startTime: convertTo12Hour(formData.startTime),
      endTime: convertTo12Hour(formData.endTime),
      breakMinutes: formData.breakMinutes,
      maxStaff: formData.maxStaff,
      status: formData.status,
      description: formData.description || "",
    };

    updateMutation.mutate({ id: shiftId, payload }, {
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
            Edit Shift details
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
            {/* Shift Name */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Shift Name</label>
              <input
                type="text"
                placeholder="e.g. Morning Shift, Night Operations..."
                {...register("shiftName")}
                className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-primary shadow-inner"
              />
              {errors.shiftName && (
                <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-0.5 pl-1"><AlertCircle size={10} /> {errors.shiftName.message}</p>
              )}
            </div>

            {/* Timings */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-zinc-50/50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-850">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-555 uppercase tracking-widest pl-1">Start Time</label>
                <div className="relative">
                  <Clock className="absolute right-3.5 top-3 text-zinc-400" size={13} />
                  <input
                    type="time"
                    {...register("startTime")}
                    className="w-full pl-3 pr-9 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-850 focus:outline-none"
                  />
                </div>
                {errors.startTime && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-0.5"><AlertCircle size={9} /> {errors.startTime.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-555 uppercase tracking-widest pl-1">End Time</label>
                <div className="relative">
                  <Clock className="absolute right-3.5 top-3 text-zinc-400" size={13} />
                  <input
                    type="time"
                    {...register("endTime")}
                    className="w-full pl-3 pr-9 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-850 focus:outline-none"
                  />
                </div>
                {errors.endTime && (
                  <p className="text-[9px] text-rose-500 font-bold flex items-center gap-1 mt-0.5"><AlertCircle size={9} /> {errors.endTime.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Break Minutes */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Break Duration (Mins)</label>
                <input
                  type="number"
                  {...register("breakMinutes")}
                  className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 focus:outline-none focus:border-primary shadow-inner"
                />
                {errors.breakMinutes && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {errors.breakMinutes.message}</p>
                )}
              </div>

              {/* Max Capacity */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Max Staff Count</label>
                <input
                  type="number"
                  {...register("maxStaff")}
                  className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 focus:outline-none focus:border-primary shadow-inner"
                />
                {errors.maxStaff && (
                  <p className="text-[10px] text-rose-500 font-bold flex items-center gap-1 mt-0.5"><AlertCircle size={10} /> {errors.maxStaff.message}</p>
                )}
              </div>
            </div>

            {/* Status Field */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-555 uppercase tracking-widest pl-1">Status</label>
              <select
                {...register("status")}
                className="w-full px-3 py-2.5 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="text-[10px] font-extrabold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest pl-1">Description (Optional)</label>
              <textarea
                {...register("description")}
                placeholder="e.g. Prep shifts, cleanup routines..."
                rows={2}
                className="w-full px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 focus:outline-none focus:border-primary shadow-inner resize-none"
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
                    <span>Updating...</span>
                  </>
                ) : (
                  <span>Update Shift</span>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
