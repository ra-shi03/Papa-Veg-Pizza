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
import { useFulfillRequest } from "../hooks/useFulfillRequest";
import { Truck, AlertCircle } from "lucide-react";

export function FulfillRequestModal({ isOpen, onClose, requestId }) {
  const { data, isLoading } = useStockRequestDetails(requestId);
  const fulfillMutation = useFulfillRequest();

  const [deliveredQty, setDeliveredQty] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const request = data?.request;
  const ingredient = data?.ingredient;

  useEffect(() => {
    if (isOpen && request) {
      setDeliveredQty(request.approvedQty.toString() || request.requestedQty.toString());
      setRemarks("");
      setErrorMsg("");
    }
  }, [isOpen, request]);

  const currentStock = ingredient ? ingredient.currentStock : 0;
  const unit = ingredient ? ingredient.unit : "";
  const qtyNum = Number(deliveredQty) || 0;
  
  // Calculate remaining stock preview (Stock decreases upon fulfillment/dispatch to kitchen)
  const remainingStockPreview = currentStock - qtyNum;

  // Handle live validation
  const handleDeliveredChange = (val) => {
    setDeliveredQty(val);
    const numeric = parseFloat(val);

    if (val === "") {
      setErrorMsg("");
      return;
    }

    if (isNaN(numeric) || numeric <= 0) {
      setErrorMsg("Delivered quantity must be greater than 0");
    } else if (currentStock - numeric < 0) {
      setErrorMsg(`Insufficient stock. Delivering ${numeric} ${unit} will drop stock below zero (Current: ${currentStock} ${unit}).`);
    } else {
      setErrorMsg("");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!requestId) return;

    const qty = parseFloat(deliveredQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Please enter a valid delivered quantity greater than 0");
      return;
    }

    if (currentStock - qty < 0) {
      setErrorMsg("Cannot fulfill request: Negative stock result is not allowed.");
      return;
    }

    fulfillMutation.mutate(
      {
        requestId,
        deliveredQty: qty,
        remarks: remarks.trim(),
        fulfilledBy: localStorage.getItem("store_user_name") || "Shubham Jamliya"
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
            <Truck className="text-indigo-500 w-4 h-4" />
            Fulfill Stock Request
          </DialogTitle>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Confirm the delivery of stock to the kitchen. This will deduct the quantity from the core ingredient inventory.
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

            {/* Fulfill Details Overview */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Request No</span>
                <span className="font-bold text-slate-800 dark:text-white">{request.requestNo}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Ingredient</span>
                <span className="font-bold text-slate-800 dark:text-white truncate max-w-[180px]">{request.ingredientName}</span>
              </div>
              <div className="flex justify-between text-xs border-t border-slate-200/50 dark:border-zinc-800 pt-1.5">
                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Approved Qty</span>
                <span className="font-bold text-slate-800 dark:text-white">
                  {request.approvedQty || request.requestedQty} {unit}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-400 font-bold uppercase tracking-wider text-[10px]">Current Store Stock</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {currentStock} {unit}
                </span>
              </div>
            </div>

            {/* Delivered Quantity */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Delivered Quantity *</Label>
              <div className="relative">
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={deliveredQty}
                  onChange={(e) => handleDeliveredChange(e.target.value)}
                  className="h-8 rounded-lg border-zinc-200 dark:border-zinc-800 pr-10 dark:bg-zinc-950 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-zinc-400 uppercase">
                  {unit}
                </span>
              </div>
            </div>

            {/* Remaining Stock Live Calculation Preview */}
            <div className="p-3 rounded-xl bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">
                  Calculated Remaining Stock Preview
                </p>
                <p className="text-[9px] text-zinc-400 mt-0.5 leading-none">
                  Current ({currentStock}) - Delivered ({qtyNum})
                </p>
              </div>
              <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                remainingStockPreview < 0 
                  ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20" 
                  : "text-indigo-700 bg-indigo-50 dark:bg-indigo-950/20"
              }`}>
                {remainingStockPreview.toFixed(2)} {unit}
              </span>
            </div>

            {/* Remarks */}
            <div className="space-y-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Fulfillment Remarks</Label>
              <Textarea
                placeholder="e.g. Dispatched to kitchen..."
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
                disabled={fulfillMutation.isPending || remainingStockPreview < 0}
                className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
              >
                {fulfillMutation.isPending ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Fulfilling...
                  </>
                ) : (
                  "Confirm Fulfillment"
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
