import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { Label } from "@food/components/ui/label";
import { Textarea } from "@food/components/ui/textarea";
import { useApproveWaste } from "../hooks/useApproveWaste";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ApproveWasteModal({ isOpen, onClose, wasteId }) {
  const approveMutation = useApproveWaste();
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setRemarks("");
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!wasteId) return;

    approveMutation.mutate(
      {
        wasteId,
        remarks: remarks.trim(),
        approvedBy: localStorage.getItem("store_user_name") || "Shubham Jamliya"
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg lg:max-w-[calc(100vw-340px)] xl:max-w-lg lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[95vh] flex flex-col">
        
        <DialogHeader className="mb-3">
          <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <CheckCircle2 className="text-emerald-500 w-4 h-4" />
            Approve Waste Report
          </DialogTitle>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Confirm the audit of this ingredient wastage log. Approved items will be written off permanently.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 space-y-3.5 select-none text-xs">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-[11px] flex items-center gap-1.5 font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Remarks input */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Approval Remarks / Countermeasures</Label>
            <Textarea
              placeholder="e.g. Approved. Storage seal policies revised. Countertops cleaned..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="min-h-[60px] rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] bg-white dark:bg-zinc-900 resize-none py-1.5"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={approveMutation.isPending}
              className="px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={approveMutation.isPending}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-650 hover:bg-emerald-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              {approveMutation.isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Approving...
                </>
              ) : (
                "Approve Record"
              )}
            </button>
          </div>
        </form>

      </DialogContent>
    </Dialog>
  );
}
