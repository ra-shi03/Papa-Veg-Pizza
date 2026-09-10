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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@food/components/ui/select";
import { useIngredientDetails } from "../hooks/useIngredientDetails";
import { useCreateStockRequest } from "../hooks/useCreateStockRequest";
import { PlusCircle, AlertCircle } from "lucide-react";

export function AlertCreateRequestModal({ isOpen, onClose, alert, currentUser }) {
  const { data: detailData, isLoading: isLoadingIngredient } = useIngredientDetails(alert?.ingredientId);
  const createRequestMutation = useCreateStockRequest();

  // Form State
  const [requestedQty, setRequestedQty] = useState("");
  const [urgency, setUrgency] = useState("medium");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const ingredient = detailData?.ingredient;
  const currentStock = alert?.currentStock ?? 0;
  const reorderLevel = ingredient?.reorderLevel ?? alert?.minimumStock ?? 0;
  const unit = ingredient?.unit ?? "KG";

  // Calculate recommended qty
  const recommendedQty = Math.max(0, reorderLevel - currentStock);

  useEffect(() => {
    if (isOpen && alert) {
      // Map alert severity to urgency
      let prefilledUrgency = "medium";
      if (alert.severity === "critical") prefilledUrgency = "critical";
      else if (alert.severity === "high") prefilledUrgency = "high";
      else if (alert.severity === "medium") prefilledUrgency = "medium";
      else if (alert.severity === "low") prefilledUrgency = "low";

      setUrgency(prefilledUrgency);
      setReason(`Low Stock Alert Ref: ${alert._id.substring(0, 8)} - ${alert.ingredientName} is below minimum stock threshold.`);
      setNotes("");
      setErrorMsg("");
    }
  }, [isOpen, alert]);

  // Set the requested qty to recommendedQty once details load
  useEffect(() => {
    if (isOpen && recommendedQty > 0 && !requestedQty) {
      setRequestedQty(recommendedQty.toString());
    }
  }, [isOpen, recommendedQty]);

  if (!alert) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    const qty = parseFloat(requestedQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Please enter a valid requested quantity greater than 0");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Please provide a reason for the request");
      return;
    }

    createRequestMutation.mutate(
      {
        ingredientId: alert.ingredientId,
        requestedQty: qty,
        urgency,
        reason: reason.trim(),
        notes: notes.trim(),
        requestedBy: currentUser || localStorage.getItem("store_user_name") || "Aman Verma"
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
      <DialogContent className="w-[calc(100vw-32px)] sm:w-full max-w-lg lg:max-w-[calc(100vw-340px)] xl:max-w-lg lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[90vh] md:max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <PlusCircle className="text-[var(--primary)] w-4 h-4" />
            Raise Stock Request from Alert
          </DialogTitle>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Prefilled with low-stock alert metrics. Review quantity recommendation and submit to store manager for approval.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-3.5 pr-1 select-none">
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-707 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 text-[11px] flex items-center gap-1.5 font-bold animate-pulse">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {errorMsg}
            </div>
          )}

          {/* Quick stock status card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 grid grid-cols-3 gap-3">
            <div>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Ingredient</p>
              <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5 truncate">
                {alert.ingredientName}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Current Stock</p>
              <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">
                {currentStock} {unit}
              </p>
            </div>
            <div>
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Reorder Level</p>
              <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">
                {reorderLevel} {unit}
              </p>
            </div>
          </div>

          {/* Qty & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Requested Qty *</Label>
                {recommendedQty > 0 && (
                  <button
                    type="button"
                    onClick={() => setRequestedQty(recommendedQty.toString())}
                    className="text-[9px] text-[var(--primary)] font-bold hover:underline cursor-pointer"
                  >
                    Use Rec ({recommendedQty} {unit})
                  </button>
                )}
              </div>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="e.g. 10.50"
                  value={requestedQty}
                  onChange={(e) => {
                    setRequestedQty(e.target.value);
                    setErrorMsg("");
                  }}
                  className="h-8 rounded-lg border-zinc-200 dark:border-zinc-800 pr-10 dark:bg-zinc-950 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">
                  {unit}
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Urgency Level *</Label>
              <Select value={urgency} onValueChange={(val) => setUrgency(val)}>
                <SelectTrigger className="w-full h-8 rounded-lg border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-950">
                  <SelectItem value="low" className="text-xs font-medium py-1.5">Low</SelectItem>
                  <SelectItem value="medium" className="text-xs font-medium py-1.5">Medium</SelectItem>
                  <SelectItem value="high" className="text-xs font-medium py-1.5">High</SelectItem>
                  <SelectItem value="critical" className="text-xs font-medium py-1.5">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Reason for Request *</Label>
            <Input
              type="text"
              placeholder="e.g. Low stock alert / Weekend prep buffer"
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setErrorMsg("");
              }}
              className="h-8 rounded-lg border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
            />
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Remarks / Notes</Label>
            <Textarea
              placeholder="Any details or notes for the store manager..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[50px] rounded-lg border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 text-xs font-semibold resize-none focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
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
              disabled={createRequestMutation.isPending || isLoadingIngredient}
              className="px-4 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {createRequestMutation.isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting...
                </>
              ) : (
                "Raise Request"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
