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
import { useResolveAlert } from "../hooks/useResolveAlert";
import { CheckCircle2, AlertCircle } from "lucide-react";

export function ResolveAlertModal({ isOpen, onClose, alert }) {
  const resolveAlertMutation = useResolveAlert();
  const [resolutionNote, setResolutionNote] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      setResolutionNote("");
      setErrorMsg("");
    }
  }, [isOpen, alert]);

  if (!alert) return null;

  const handleNoteChange = (e) => {
    const val = e.target.value;
    if (val.length > 500) return; // Character limit constraint
    setResolutionNote(val);
    if (val.trim().length === 0) {
      setErrorMsg("Resolution note is required");
    } else {
      setErrorMsg("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNote.trim()) {
      setErrorMsg("Resolution note is required");
      return;
    }

    resolveAlertMutation.mutate(
      {
        alertId: alert._id,
        resolutionNote: resolutionNote.trim(),
        resolvedBy: localStorage.getItem("store_user_name") || "Shubham Jamliya"
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
            <CheckCircle2 className="text-emerald-500 w-4.5 h-4.5" />
            Resolve Low Stock Alert
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-[10px]">
            Manually mark this alert as resolved. You must document what action was taken (e.g., expedited purchase, stock adjustment, etc.).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 space-y-4 pr-1 select-none">
          {/* Quick Info card */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850">
            <p className="text-xs font-black text-slate-800 dark:text-white leading-tight">
              {alert.ingredientName}
            </p>
            <p className="text-[10px] text-zinc-400 mt-0.5">
              Current Stock: <span className="font-bold text-slate-700 dark:text-slate-350">{alert.currentStock}</span> | 
              Minimum Stock: <span className="font-bold text-slate-705 dark:text-slate-350">{alert.minimumStock}</span>
            </p>
          </div>

          {/* Resolution Note Field */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Resolution Note
              </Label>
              <span className="text-[9px] font-bold text-zinc-400">
                {resolutionNote.length}/500
              </span>
            </div>
            <Textarea 
              placeholder="Describe how the stock issue was resolved (e.g., 'Transferred 10kg from warehouse' or 'Emergency shipment arrived')"
              value={resolutionNote}
              onChange={handleNoteChange}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] min-h-[100px] resize-none"
              required
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
              disabled={resolveAlertMutation.isPending}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={!resolutionNote.trim() || resolveAlertMutation.isPending}
              className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            >
              {resolveAlertMutation.isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Resolving...
                </>
              ) : (
                "Resolve Alert"
              )}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
