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
import { useResolveShortage } from "../hooks/useResolveShortage";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ResolveShortageModal({ isOpen, onClose, shortage }) {
  const resolveShortageMutation = useResolveShortage();
  const [actionTaken, setActionTaken] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setActionTaken("");
      setNotes("");
      setErrorMsg("");
    }
  }, [isOpen, shortage]);

  if (!shortage) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!actionTaken.trim()) {
      setErrorMsg("Action Taken description is required");
      return;
    }

    resolveShortageMutation.mutate(
      {
        shortageId: shortage._id,
        actionTaken: actionTaken.trim(),
        notes: notes.trim()
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
      <DialogContent className="w-[calc(100vw-40px)] max-w-lg lg:max-w-[calc(100vw-340px)] xl:max-w-lg lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[90vh] md:max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <CheckCircle2 className="text-emerald-500 w-4.5 h-4.5" />
            Resolve Ingredient Shortage
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-[10px]">
            Record resolution details to clear the active shortage delay from customer orders and restore normal baking ops.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 pr-1 select-none text-xs">
          {/* Summary Box */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850">
            <p className="font-bold text-slate-900 dark:text-white leading-none">
              {shortage.ingredientName}
            </p>
            <p className="text-[10px] text-zinc-400 mt-1">
              Shortage Quantity: <span className="font-bold text-rose-500">{shortage.shortageQty} {shortage.ingredientId === "ing-013" ? "Pcs" : "KG"}</span> | 
              Affected Orders: <span className="font-bold text-slate-800 dark:text-zinc-300">{shortage.affectedOrders} Orders</span>
            </p>
          </div>

          {/* Action Taken */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Action Taken *</Label>
            <Textarea 
              placeholder="e.g. Completed stock transfer of 15 KG from Palasia Store / Express replenishment arrived from supplier"
              value={actionTaken}
              onChange={(e) => {
                setActionTaken(e.target.value);
                setErrorMsg("");
              }}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] min-h-[70px] resize-none"
              required
            />
          </div>

          {/* Resolution Notes */}
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Resolution Notes (Optional)</Label>
            <Textarea 
              placeholder="Provide any additional comments or audit findings..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] min-h-[50px] resize-none"
            />
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 text-[11px] font-bold flex items-center gap-1.5">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all"
              disabled={resolveShortageMutation.isPending}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!actionTaken.trim() || resolveShortageMutation.isPending}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              {resolveShortageMutation.isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resolving...
                </>
              ) : (
                "Confirm Resolution"
              )}
            </button>
          </div>

        </form>

      </DialogContent>
    </Dialog>
  );
}
