import React from "react";
import { ShieldAlert, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useDeleteStaff, useStaffDetails } from "../hooks/useStaff";

export default function DeleteStaffDialog({ isOpen, onClose, staffId }) {
  const { data: staff } = useStaffDetails(staffId);
  const deleteStaffMutation = useDeleteStaff();

  const handleDelete = async () => {
    try {
      await deleteStaffMutation.mutateAsync(staffId);
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
            <ShieldAlert size={20} className="text-red-650 animate-bounce" />
            Delete Kitchen Staff Profile
          </DialogTitle>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 font-semibold mt-0.5">
            Permanently delete staff assignment from store.
          </p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 rounded-2xl flex gap-2.5 items-start">
            <Trash2 className="text-red-650 shrink-0 mt-0.5" size={16} />
            <div>
              <p className="text-xs font-bold text-red-800 dark:text-red-400">Critical Action Warning</p>
              <p className="text-[10px] text-red-700/80 dark:text-red-500 font-semibold mt-0.5">
                Deleting staff will remove their store assignment immediately. However, their historical order preparation logs, shift cards, and sales records will be preserved for store auditing.
              </p>
            </div>
          </div>

          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed">
            Are you sure you want to permanently delete the profile of <strong className="text-slate-900 dark:text-white">{staff?.fullName}</strong>?
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
            onClick={handleDelete}
            disabled={deleteStaffMutation.isPending}
            className="px-6 py-2.5 bg-red-655 hover:bg-red-700 text-white font-bold rounded-full text-xs active:scale-95 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {deleteStaffMutation.isPending ? "Deleting..." : "Delete Staff"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
