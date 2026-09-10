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
import { useUpdateStock } from "../hooks/useUpdateStock";
import { LayoutGrid, AlertCircle, RefreshCw } from "lucide-react";

export function UpdateStockModal({ isOpen, onClose, ingredientId }) {
  const { data, isLoading } = useIngredientDetails(ingredientId);
  const updateStockMutation = useUpdateStock();

  // Form State
  const [transactionType, setTransactionType] = useState("stock_in");
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Clean form states when open/close or data shifts
  useEffect(() => {
    if (isOpen) {
      setTransactionType("stock_in");
      setQuantity("");
      setReason("");
      setNotes("");
      setErrorMsg("");
    }
  }, [isOpen, ingredientId]);

  const ingredient = data?.ingredient;
  const currentStock = ingredient ? ingredient.currentStock : 0;
  const unit = ingredient ? ingredient.unit : "";

  // Dynamic calculations for preview
  const quantityNum = Number(quantity) || 0;
  let newStockPreview = currentStock;

  if (transactionType === "stock_in") {
    newStockPreview = currentStock + quantityNum;
  } else if (transactionType === "stock_out") {
    newStockPreview = Math.max(0, currentStock - quantityNum);
  } else if (transactionType === "adjustment") {
    newStockPreview = quantityNum;
  }

  // Handle quantity changes
  const handleQuantityChange = (val) => {
    const numeric = parseFloat(val);
    setQuantity(val);
    
    // Validations
    if (val === "") {
      setErrorMsg("");
      return;
    }
    if (isNaN(numeric) || numeric <= 0) {
      setErrorMsg("Quantity must be greater than 0");
    } else if (transactionType === "stock_out" && numeric > currentStock) {
      setErrorMsg(`Insufficient stock. Cannot issue more than ${currentStock} ${unit}.`);
    } else {
      setErrorMsg("");
    }
  };

  // Adjust validations when transaction type shifts
  const handleTypeChange = (val) => {
    setTransactionType(val);
    setQuantity("");
    setErrorMsg("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!ingredientId) return;

    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Please enter a valid quantity greater than 0");
      return;
    }

    if (transactionType === "stock_out" && qty > currentStock) {
      setErrorMsg("Cannot update: Stock output exceeds current stock.");
      return;
    }

    if (!reason.trim()) {
      setErrorMsg("Reason is required to audit stock transactions");
      return;
    }

    // Trigger Mutation
    updateStockMutation.mutate(
      {
        ingredientId,
        type: transactionType,
        quantity: qty,
        reason: reason.trim(),
        notes: notes.trim(),
        updatedBy: localStorage.getItem("store_user_name") || "Shubham Jamliya"
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
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <RefreshCw className="text-[var(--primary)] w-4 h-4 animate-spin-slow" />
            Update Ingredient Stock
          </DialogTitle>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Log manual updates, stock deliveries, issues, or write-offs. All fields are audited.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">Fetching current stock level...</p>
          </div>
        ) : !ingredient ? (
          <div className="flex-1 py-8 text-center text-zinc-400 dark:text-zinc-505 font-bold text-xs">
            No ingredient data loaded.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto space-y-4 pr-1 select-none">
            
            {/* Quick overview of current stock */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-800 dark:text-white leading-tight">{ingredient.ingredientName}</p>
                <p className="text-[9px] text-zinc-400 mt-0.5">Category: {ingredient.category} | Current Stock: {currentStock} {unit}</p>
              </div>
              <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded-lg">
                {unit}
              </span>
            </div>

            {/* Grid Layout fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              
              {/* Type Select */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Transaction Type</Label>
                <Select value={transactionType} onValueChange={handleTypeChange}>
                  <SelectTrigger className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg">
                    <SelectItem value="stock_in" className="text-xs font-semibold py-1.5">▲ Stock In (Delivery)</SelectItem>
                    <SelectItem value="stock_out" className="text-xs font-semibold py-1.5">▼ Stock Out (Waste)</SelectItem>
                    <SelectItem value="adjustment" className="text-xs font-semibold py-1.5">⚙ Adjustment (Audit)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quantity Input */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Quantity</Label>
                <div className="relative">
                  <Input 
                    type="number"
                    step="0.01"
                    placeholder="e.g. 10.5"
                    value={quantity}
                    onChange={(e) => handleQuantityChange(e.target.value)}
                    className="h-8 px-2.5 pr-8 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)]"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] font-bold text-zinc-400">
                    {unit}
                  </span>
                </div>
              </div>

              {/* Readonly current stock */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Current Stock (ReadOnly)</Label>
                <Input 
                  type="text"
                  value={`${currentStock} ${unit}`}
                  disabled
                  className="h-8 px-2.5 rounded-lg border border-zinc-100 dark:border-zinc-855 bg-slate-50 dark:bg-zinc-950 text-zinc-400 text-xs font-semibold"
                />
              </div>

              {/* Readonly stock preview */}
              <div className="space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Stock Preview</Label>
                <div className="flex items-center">
                  <Input 
                    type="text"
                    value={`${Number(newStockPreview.toFixed(2))} ${unit}`}
                    disabled
                    className={`h-8 px-2.5 rounded-lg border text-xs font-black ${
                      newStockPreview <= ingredient.minimumStock
                        ? "bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400"
                        : "bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400"
                    }`}
                  />
                </div>
              </div>

              {/* Reason Field */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for update</Label>
                <Textarea 
                  placeholder="Describe why this stock is being altered"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] min-h-[50px] resize-none"
                />
              </div>

              {/* Notes Field */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes (Optional)</Label>
                <Textarea 
                  placeholder="Additional audit or delivery slip notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] min-h-[40px] resize-none"
                />
              </div>
            </div>

            {/* Error Message banner */}
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
                disabled={updateStockMutation.isPending}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={!!errorMsg || updateStockMutation.isPending || !quantity || !reason}
                className="px-4 py-1.5 text-xs font-bold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
              >
                {updateStockMutation.isPending ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Updating...
                  </>
                ) : (
                  "Confirm Change"
                )}
              </button>
            </div>

          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
