import React from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useShiftDetails, useDeleteShift } from "../hooks/useShifts";

export default function DeleteShiftDialog({ isOpen, onClose, shiftId }) {
  const { data: shift } = useShiftDetails(shiftId);
  const deleteMutation = useDeleteShift();

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(shiftId);
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
            <ShieldAlert size={20} className="text-red-650 animate-bounce" />
            Delete Store Shift
          </DialogTitle>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 font-semibold mt-0.5">
            Permanently delete this shift configuration.
          </p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 rounded-2xl flex gap-2.5 items-start">
            <Trash2 className="text-red-655 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-red-400">Critical Action Warning</p>
              <p className="text-[10px] text-red-700/80 dark:text-red-500 font-semibold mt-0.5">
                Deleting this shift configuration will remove it permanently. Any assigned employees will automatically become Unassigned and should be scheduled onto another active shift to prevent timesheet disruptions.
              </p>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed">
            Are you sure you want to permanently delete <strong className="text-slate-900 dark:text-white">{shift?.shiftName}</strong>?
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-300 font-bold rounded-full text-xs hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-6 py-2.5 bg-red-655 hover:bg-red-700 text-white font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {deleteMutation.isPending ? "Deleting..." : "Delete Shift"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
