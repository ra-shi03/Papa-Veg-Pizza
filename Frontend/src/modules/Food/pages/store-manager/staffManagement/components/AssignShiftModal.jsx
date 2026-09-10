import React, { useState, useEffect } from "react";
import { Clock, Calendar, FileText, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useAssignShift, useStaffDetails } from "../hooks/useStaff";

export default function AssignShiftModal({ isOpen, onClose, staffId }) {
  const { data: staff } = useStaffDetails(staffId);
  const assignShiftMutation = useAssignShift();

  const [shiftId, setShiftId] = useState("Morning");
  const [startDate, setStartDate] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (staff && isOpen) {
      setShiftId(staff.shiftId || "Morning");
      const today = new Date().toISOString().split("T")[0];
      setStartDate(today);
      setEffectiveDate(today);
      setNotes("");
      setError("");
    }
  }, [staff, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!startDate || !effectiveDate) {
      setError("Please fill in both dates.");
      return;
    }
    setError("");

    try {
      await assignShiftMutation.mutateAsync({
        id: staffId,
        payload: {
          shiftId,
          startDate,
          effectiveDate,
          notes,
        },
      });
      onClose();
    } catch (e) {
      // Mutation handles error toasts
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <DialogHeader className="border-b border-zinc-150 dark:border-zinc-800 pb-3 pr-8">
          <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            Assign Shift
          </DialogTitle>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 font-semibold mt-0.5">
            Update active shifts or schedule upcoming rotations for {staff?.fullName}.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-2.5 rounded-xl flex items-center gap-2 text-xs font-bold text-red-700 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Shift Select */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              <Clock size={12} className="text-zinc-400" />
              Select Shift
            </label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="w-full h-10 px-2.5 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
            >
              <option value="Morning">Morning (06:00 AM - 02:00 PM)</option>
              <option value="Afternoon">Afternoon (02:00 PM - 10:00 PM)</option>
              <option value="Night">Night (10:00 PM - 06:00 AM)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Start Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                <Calendar size={12} className="text-zinc-400" />
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>

            {/* Effective Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                <Calendar size={12} className="text-zinc-400" />
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full h-10 px-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
              <FileText size={12} className="text-zinc-400" />
              Notes / Remarks
            </label>
            <textarea
              placeholder="e.g. Swapping shift with Priya for weekend coverage."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full p-3 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white focus:outline-none focus:border-primary transition-all"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-full text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer shadow-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={assignShiftMutation.isPending}
              className="px-6 py-2.5 bg-primary text-white font-bold rounded-full text-xs hover:bg-primary-hover active:scale-95 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {assignShiftMutation.isPending ? "Assigning..." : "Assign Shift"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
