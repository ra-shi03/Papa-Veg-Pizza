import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { Label } from "@food/components/ui/label";
import { Input } from "@food/components/ui/input";
import { Textarea } from "@food/components/ui/textarea";
import { useStockRequestDetails } from "../hooks/useStockRequestDetails";
import { useApproveRequest } from "../hooks/useApproveRequest";
import { CheckCircle, AlertCircle } from "lucide-react";

export function ApproveRequestModal({ isOpen, onClose, requestId }) {
  const { data, isLoading } = useStockRequestDetails(requestId);
  const approveMutation = useApproveRequest();

  const [approvedQty, setApprovedQty] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const request = data?.request;
  const ingredient = data?.ingredient;

  useEffect(() => {
    if (isOpen && request) {
      setApprovedQty(request.requestedQty.toString());
      setRemarks("");
      setErrorMsg("");
    }
  }, [isOpen, request]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestId) return;

    const qty = parseFloat(approvedQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Approved quantity must be a valid number greater than 0");
      return;
    }

    if (qty > request.requestedQty) {
      setErrorMsg(`Approved quantity cannot exceed requested quantity (${request.requestedQty} ${ingredient?.unit})`);
      return;
    }

    approveMutation.mutate(
      {
        requestId,
        approvedQty: qty,
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
            <CheckCircle className="text-emerald-500 w-4 h-4" />
            Approve Stock Request
          </DialogTitle>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Review requested stock amount. You may decrease the approved quantity if needed.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] text-zinc-505 dark:text-zinc-400 font-bold">Loading request detail...</p>
          </div>
        ) : !request ? (
          <div className="flex-1 py-8 text-center text-zinc-400 dark:text-zinc-500 text-xs font-bold">
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

            {/* Quick Summary Box */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Request No</span>
                <span className="font-bold text-slate-800 dark:text-white">{request.requestNo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Ingredient Name</span>
                <span className="font-bold text-slate-800 dark:text-white text-right truncate max-w-[180px]">{request.ingredientName}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Requested By</span>
                <span className="font-bold text-slate-800 dark:text-white">{request.requestedBy}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/50 dark:border-zinc-800 pt-1.5 text-xs">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider font-semibold">Requested Qty</span>
                <span className="font-black text-slate-850 dark:text-white">
                  {request.requestedQty} {ingredient?.unit}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[10px] text-zinc-400 uppercase font-bold tracking-wider">Store Current Stock</span>
                <span className="font-bold text-slate-700 dark:text-zinc-300">
                  {ingredient ? ingredient.currentStock : 0} {ingredient?.unit}
                </span>
              </div>
            </div>

            {/* Approved Quantity */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Approved Quantity *</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={request.requestedQty}
                  value={approvedQty}
                  onChange={(e) => {
                    setApprovedQty(e.target.value);
                    setErrorMsg("");
                  }}
                  className="h-8 rounded-lg border-zinc-200 dark:border-zinc-800 pr-10 dark:bg-zinc-950 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400 uppercase">
                  {ingredient?.unit}
                </span>
              </div>
              <p className="text-[9px] text-zinc-400 leading-none mt-1">
                You can reduce the quantity if the requested stock exceeds local kitchen capacity.
              </p>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Approval Remarks</Label>
              <Textarea
                placeholder="e.g. Approved. Fulfill from main shelf batch #A..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="min-h-[55px] rounded-lg border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 text-xs font-semibold resize-none focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={approveMutation.isPending}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {approveMutation.isPending ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Approving...
                  </>
                ) : (
                  "Confirm Approval"
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
