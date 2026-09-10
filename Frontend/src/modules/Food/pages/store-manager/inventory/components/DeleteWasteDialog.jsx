import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { useDeleteWaste } from "../hooks/useDeleteWaste";
import { Trash2, AlertTriangle } from "lucide-react";

export function DeleteWasteDialog({ isOpen, onClose, wasteId }) {
  const deleteMutation = useDeleteWaste();

  const handleDelete = () => {
    if (!wasteId) return;

    deleteMutation.mutate(
      { wasteId },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden select-none text-xs">
        
        <DialogHeader className="mb-2">
          <DialogTitle className="text-sm font-black text-rose-600 dark:text-rose-400 tracking-tight flex items-center gap-1.5">
            <Trash2 className="w-4 h-4" />
            Delete Waste Record
          </DialogTitle>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            This operation is permanent and irreversible. Please confirm.
          </DialogDescription>
        </DialogHeader>

        {/* Warning card */}
        <div className="p-3 my-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100/40 dark:border-rose-950/20 text-rose-700 dark:text-rose-400 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-[10px] uppercase tracking-wider leading-tight">Danger Action Warning</p>
            <p className="text-[11px] mt-1 font-semibold leading-relaxed">
              Are you sure you want to permanently delete this waste record? The audit logs for this spillage/loss event will be removed from manager logs.
            </p>
          </div>
        </div>

        {/* Actions bar */}
        <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            disabled={deleteMutation.isPending}
            className="px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            {deleteMutation.isPending ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Deleting...
              </>
            ) : (
              "Permanently Delete"
            )}
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
