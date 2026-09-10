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
import { useAvailableStores } from "../hooks/useAvailableStores";
import { useTransferStock } from "../hooks/useTransferStock";
import { Truck, AlertCircle, HelpCircle } from "lucide-react";

export function TransferStockModal({ isOpen, onClose, shortage }) {
  const { data: storesList = [], isLoading: isLoadingStores } = useAvailableStores(shortage?.ingredientId);
  const transferStockMutation = useTransferStock();

  // Form State
  const [sourceStoreId, setSourceStoreId] = useState("");
  const [transferQty, setTransferQty] = useState("");
  const [reason, setReason] = useState("");
  const [remarks, setRemarks] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const unit = shortage?.ingredientId === "ing-013" ? "Pcs" : "KG";

  const selectedStore = storesList.find(s => s.storeId === sourceStoreId);
  const availableSourceStock = selectedStore ? selectedStore.availableQty : 0;

  // Live calculations
  const shortageQty = shortage?.shortageQty || 0;
  const transferQtyNum = parseFloat(transferQty) || 0;
  const remainingShortage = Math.max(0, shortageQty - transferQtyNum);

  useEffect(() => {
    if (isOpen && shortage) {
      setSourceStoreId("");
      setTransferQty("");
      setReason(`Urgent inventory transfer request for ${shortage.ingredientName} to resolve active shortages affecting orders.`);
      setRemarks("");
      setErrorMsg("");
    }
  }, [isOpen, shortage]);

  if (!shortage) return null;

  const handleQtyChange = (val) => {
    setTransferQty(val);
    const num = parseFloat(val);

    if (val === "") {
      setErrorMsg("");
      return;
    }

    if (isNaN(num) || num <= 0) {
      setErrorMsg("Quantity must be greater than 0");
    } else if (sourceStoreId && num > availableSourceStock) {
      setErrorMsg(`Transfer quantity cannot exceed source store stock (${availableSourceStock} ${unit})`);
    } else {
      setErrorMsg("");
    }
  };

  const handleStoreChange = (storeId) => {
    setSourceStoreId(storeId);
    setTransferQty("");
    setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!sourceStoreId) {
      setErrorMsg("Please select a source store");
      return;
    }

    const qty = parseFloat(transferQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Please enter a valid transfer quantity");
      return;
    }

    if (qty > availableSourceStock) {
      setErrorMsg("Quantity exceeds source store stock limit");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Transfer justification reason is required");
      return;
    }

    transferStockMutation.mutate(
      {
        shortageId: shortage._id,
        fromStore: selectedStore.name,
        fromStoreId: sourceStoreId,
        toStore: "Indore Main Store",
        toStoreId: "st-indore-01",
        ingredientId: shortage.ingredientId,
        quantity: qty,
        reason: reason.trim(),
        remarks: remarks.trim()
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
      <DialogContent className="w-[calc(100vw-40px)] max-w-3xl lg:max-w-[calc(100vw-340px)] xl:max-w-3xl lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[90vh] md:max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Truck className="text-[var(--primary)] w-4.5 h-4.5" />
            Initiate Stock Transfer
          </DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-[10px]">
            Request ingredient stock dispatches from neighboring branches to bridge order preparation shortage gaps.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 select-none text-xs">
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Form Fields Section */}
            <div className="md:col-span-2 space-y-3.5">
              
              {/* Ingredient SKU Display (Readonly) */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Transfer Ingredient</Label>
                <Input 
                  type="text" 
                  value={`${shortage.ingredientName} (${shortage.ingredientId})`} 
                  disabled 
                  className="h-8 px-2.5 rounded-lg border-zinc-100 bg-slate-50 dark:bg-zinc-950 dark:border-zinc-850 text-zinc-550 font-bold"
                />
              </div>

              {/* Source Store Selector */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Source Store *</Label>
                <Select value={sourceStoreId} onValueChange={handleStoreChange} disabled={isLoadingStores}>
                  <SelectTrigger className="w-full h-8 rounded-lg border-zinc-200 dark:border-zinc-800 dark:bg-zinc-955 text-xs font-semibold">
                    <SelectValue placeholder={isLoadingStores ? "Loading stores list..." : "Select neighboring store..."} />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-zinc-950">
                    {storesList.map((store) => (
                      <SelectItem key={store.storeId} value={store.storeId} className="text-xs font-medium py-1.5">
                        {store.name} ({store.distance} km) - {store.availableQty} {unit} available
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Transfer Quantity */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Transfer Quantity *</Label>
                  {selectedStore && (
                    <span className="text-[9px] font-bold text-zinc-400">
                      Available Stock: {availableSourceStock} {unit}
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input 
                    type="number"
                    step="0.1"
                    min="0.1"
                    placeholder="e.g. 10.0"
                    value={transferQty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    disabled={!sourceStoreId}
                    className="h-8 rounded-lg border-zinc-200 dark:border-zinc-800 pr-10 dark:bg-zinc-950 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] disabled:opacity-50"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase">
                    {unit}
                  </span>
                </div>
              </div>

              {/* Reason justifying transfer */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Justification Reason *</Label>
                <Input 
                  type="text"
                  placeholder="Why is this transfer needed?"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="h-8 rounded-lg border-zinc-200 dark:border-zinc-800 dark:bg-zinc-950 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                />
              </div>

              {/* Remarks */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-bold">Logistics Remarks (Optional)</Label>
                <Textarea 
                  placeholder="Specify courier details, dispatch times, or delivery contacts..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] min-h-[50px] resize-none"
                />
              </div>

            </div>

            {/* Live Calculations Sidebar */}
            <div className="bg-slate-50 dark:bg-zinc-950 rounded-2xl p-4 border border-slate-100 dark:border-zinc-850 flex flex-col justify-between space-y-4">
              <div className="space-y-3.5">
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                  <HelpCircle size={11} className="text-[var(--primary)]" />
                  Live Calculations
                </h5>

                <div className="space-y-2 border-b border-slate-200/50 dark:border-zinc-800 pb-3">
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-medium">Current Deficit:</span>
                    <span className="font-bold text-slate-800 dark:text-zinc-200">{shortageQty} {unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400 font-medium">Transfer Qty:</span>
                    <span className="font-black text-blue-600 dark:text-blue-400">+{transferQtyNum} {unit}</span>
                  </div>
                </div>

                <div className="pt-1 flex justify-between items-center">
                  <span className="text-zinc-400 font-bold uppercase text-[9px] tracking-wider">Remaining Shortage:</span>
                  <span className={`text-sm font-black ${
                    remainingShortage === 0 
                      ? "text-emerald-600 dark:text-emerald-400 animate-pulse" 
                      : "text-rose-600 dark:text-rose-400"
                  }`}>
                    {remainingShortage} {unit}
                  </span>
                </div>
              </div>

              {/* Status helper text */}
              <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 text-[10px]">
                {remainingShortage === 0 ? (
                  <p className="text-emerald-600 dark:text-emerald-450 font-bold leading-normal">
                    ✓ This transfer quantity fully resolves the shortage deficit!
                  </p>
                ) : transferQtyNum > 0 ? (
                  <p className="text-amber-600 dark:text-amber-450 font-semibold leading-normal">
                    ⚠ A deficit of {remainingShortage} {unit} will still remain. Additional transfers might be required.
                  </p>
                ) : (
                  <p className="text-zinc-400 font-medium leading-normal">
                    Select a source branch and input transfer amount to recalculate remaining shortage.
                  </p>
                )}
              </div>

            </div>

          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-955/20 border border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-405 text-[11px] font-bold flex items-center gap-1.5">
              <AlertCircle size={13} className="flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors"
              disabled={transferStockMutation.isPending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={transferStockMutation.isPending || !sourceStoreId || !transferQty}
              className="px-4 py-1.5 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-xs font-bold text-white transition-all shadow-sm flex items-center justify-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {transferStockMutation.isPending ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Submitting Request...
                </>
              ) : (
                "Initiate Transfer"
              )}
            </button>
          </div>

        </form>

      </DialogContent>
    </Dialog>
  );
}
