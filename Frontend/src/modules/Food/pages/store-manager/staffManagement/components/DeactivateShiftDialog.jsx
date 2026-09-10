import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useShiftDetails, useUpdateShift } from "../hooks/useShifts";

export default function DeactivateShiftDialog({ isOpen, onClose, shiftId }) {
  const { data: shift } = useShiftDetails(shiftId);
  const updateMutation = useUpdateShift();

  const handleDeactivate = async () => {
    try {
      await updateMutation.mutateAsync({
        id: shiftId,
        payload: { status: "inactive" },
      });
      onClose();
    } catch (e) {
      // Mutation handles toast notifications on errors
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6">
        <DialogHeader className="border-b border-zinc-150 dark:border-zinc-800 pb-3 pr-8">
          <DialogTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <AlertTriangle size={20} className="text-amber-600 animate-pulse" />
            Deactivate Shift
          </DialogTitle>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 font-semibold mt-0.5">
            Temporarily disable check-ins for this shift.
          </p>
        </DialogHeader>

        <div className="py-4 space-y-3">
          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed">
            Are you sure you want to deactivate the shift <strong className="text-slate-900 dark:text-white">{shift?.shiftName}</strong>?
          </p>
          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-2xl border border-zinc-150 dark:border-zinc-850">
            Assigned employees will remain rostered on this shift but will be unable to log attendance check-ins or calculate timesheets until the shift status is set back to Active.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-full text-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDeactivate}
            disabled={updateMutation.isPending}
            className="px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {updateMutation.isPending ? "Deactivating..." : "Deactivate Shift"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
