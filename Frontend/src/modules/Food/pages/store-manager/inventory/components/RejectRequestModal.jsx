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
import { useStockRequestDetails } from "../hooks/useStockRequestDetails";
import { useRejectRequest } from "../hooks/useRejectRequest";
import { XOctagon, AlertCircle } from "lucide-react";

export function RejectRequestModal({ isOpen, onClose, requestId }) {
  const { data, isLoading } = useStockRequestDetails(requestId);
  const rejectMutation = useRejectRequest();

  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const request = data?.request;

  useEffect(() => {
    if (isOpen) {
      setRemarks("");
      setErrorMsg("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestId) return;

    if (!remarks.trim()) {
      setErrorMsg("Please provide a reason or remark for rejecting the request");
      return;
    }

    rejectMutation.mutate(
      {
        requestId,
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
            <XOctagon className="text-rose-500 w-4 h-4" />
            Reject Stock Request
          </DialogTitle>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Confirm the rejection of this stock request. A reason is required for audit logs.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] text-zinc-505 dark:text-zinc-400 font-bold">Loading request detail...</p>
          </div>
        ) : !request ? (
          <div className="flex-1 py-8 text-center text-zinc-400 dark:text-zinc-505 font-bold text-xs">
            No request data loaded.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1 select-none">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-[11px] flex items-center gap-1.5 font-bold animate-pulse">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Request Summary Box */}
            <div className="p-3 rounded-xl bg-rose-50/10 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Request No</span>
                <span className="font-bold text-slate-800 dark:text-white">{request.requestNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Ingredient Name</span>
                <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">{request.ingredientName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Requested Qty</span>
                <span className="font-bold text-slate-850 dark:text-white">
                  {request.requestedQty}
                </span>
              </div>
            </div>

            {/* Rejection Remarks */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Rejection Reason *</Label>
              <Textarea
                placeholder="e.g. Storage capacity exceeded..."
                value={remarks}
                onChange={(e) => {
                  setRemarks(e.target.value);
                  setErrorMsg("");
                }}
                className="min-h-[60px] rounded-lg border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 text-xs font-semibold resize-none focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-855 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={rejectMutation.isPending}
                className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {rejectMutation.isPending ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Rejecting...
                  </>
                ) : (
                  "Confirm Rejection"
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
