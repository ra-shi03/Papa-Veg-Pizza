import React from "react";
import { AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@food/components/ui/dialog";
import { useUpdateStaffStatus, useStaffDetails } from "../hooks/useStaff";

export default function DeactivateStaffDialog({ isOpen, onClose, staffId }) {
  const { data: staff } = useStaffDetails(staffId);
  const updateStatusMutation = useUpdateStaffStatus();

  const handleDeactivate = async () => {
    try {
      await updateStatusMutation.mutateAsync({
        id: staffId,
        status: "inactive",
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
            <AlertTriangle size={20} className="text-amber-550 animate-pulse" />
            Deactivate Kitchen Staff
          </DialogTitle>
          <p className="text-xs text-zinc-400 dark:text-zinc-550 font-semibold mt-0.5">
            Temporarily disable staff member login and operations.
          </p>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <p className="text-xs font-semibold text-slate-700 dark:text-zinc-300 leading-relaxed">
            Are you sure you want to deactivate <strong className="text-slate-900 dark:text-white">{staff?.fullName}</strong>?
          </p>
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-semibold">
            Deactivating this user will suspend their daily roster operations, prevent them from logging in, and mark their status as inactive. You can reactivate their profile at any time.
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
            disabled={updateStatusMutation.isPending}
            className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-full text-xs hover:bg-amber-600 active:scale-95 transition-all cursor-pointer shadow-md hover:shadow-lg disabled:opacity-50"
          >
            {updateStatusMutation.isPending ? "Deactivating..." : "Deactivate Profile"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
