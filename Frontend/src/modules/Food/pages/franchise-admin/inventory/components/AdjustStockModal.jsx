import React, { useState, useEffect } from "react";
import { X, AlertCircle, ArrowUpRight, ArrowDownRight, UploadCloud, FileText } from "lucide-react";
import { useAdjustStock } from "../hooks/useStock";

export default function AdjustStockModal({ isOpen, onClose, stockRecord }) {
  const [type, setType] = useState("INCREASE"); // INCREASE or DECREASE
  const [quantity, setQuantity] = useState("");
  const [reason, setReason] = useState("Manual Correction");
  const [remarks, setRemarks] = useState("");
  const [refNumber, setRefNumber] = useState("");
  const [file, setFile] = useState(null);
  
  // Confirmation state
  const [showConfirm, setShowConfirm] = useState(false);
  const [validationError, setValidationError] = useState("");

  const adjustMutation = useAdjustStock();

  useEffect(() => {
    if (isOpen) {
      setType("INCREASE");
      setQuantity("");
      setReason("Manual Correction");
      setRemarks("");
      setRefNumber("");
      setFile(null);
      setShowConfirm(false);
      setValidationError("");
    }
  }, [isOpen]);

  if (!isOpen || !stockRecord) return null;

  const currentStock = stockRecord.currentStock;
  const unit = stockRecord.ingredient?.unit || stockRecord.unit;
  const name = stockRecord.ingredient?.name || "Raw Material";
  const store = stockRecord.storeName || "Store Outlet";

  // Calculate live preview stock values
  const qtyNumber = Number(quantity) || 0;
  const newStock = type === "INCREASE" ? currentStock + qtyNumber : currentStock - qtyNumber;

  const handleQtyChange = (e) => {
    const val = e.target.value;
    if (val === "" || /^\d*\.?\d*$/.test(val)) {
      setQuantity(val);
      setValidationError("");
    }
  };

  const handleSaveClick = (e) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      setValidationError("Please enter a valid quantity greater than 0.");
      return;
    }
    if (type === "DECREASE" && newStock < 0) {
      setValidationError("Stock cannot be reduced below zero.");
      return;
    }
    setValidationError("");
    setShowConfirm(true);
  };

  const handleConfirmSubmit = () => {
    adjustMutation.mutate({
      stockId: stockRecord._id,
      type,
      quantity: Number(quantity),
      reason,
      remarks,
      referenceNumber: refNumber
    }, {
      onSuccess: () => {
        setShowConfirm(false);
        onClose();
      }
    });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  return (
    <>
      <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

        {/* Modal Window Container */}
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleSaveClick}
            className="w-full max-w-[700px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up"
          >
            {/* Header */}
            <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  Adjust Inventory
                </h3>
                <p className="text-[9.5px] text-zinc-400 font-bold mt-0.5">
                  Update stock levels for <span className="text-[var(--primary)]">{name}</span> at <span className="text-zinc-650 dark:text-zinc-200">{store}</span>
                </p>
              </div>
              <button type="button" onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
                <X size={15} />
              </button>
            </header>

            {/* Content Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 max-h-[70vh] scrollbar-thin bg-white dark:bg-zinc-950">
              
              {/* Row: Quick Stats */}
              <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-900/30 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850">
                <div>
                  <span className="text-[9px] uppercase text-zinc-400 font-extrabold block">Current Stock</span>
                  <span className="text-sm font-black text-zinc-800 dark:text-white mt-1 block">
                    {currentStock} {unit}
                  </span>
                </div>
                <div>
                  <span className="text-[9px] uppercase text-zinc-400 font-extrabold block">Available Stock</span>
                  <span className="text-sm font-black text-[var(--primary)] mt-1 block">
                    {stockRecord.availableStock} {unit}
                  </span>
                </div>
              </div>

              {/* Input: Adjustment Type */}
              <div className="space-y-2">
                <span className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Adjustment Type</span>
                <div className="grid grid-cols-2 gap-3">
                  <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                    type === "INCREASE" 
                      ? "border-emerald-500 bg-emerald-500/5 text-emerald-650 dark:text-emerald-450" 
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="adjType" 
                        checked={type === "INCREASE"}
                        onChange={() => setType("INCREASE")}
                        className="accent-emerald-500"
                      />
                      <div>
                        <span className="font-extrabold block text-xs">Increase Stock</span>
                        <span className="text-[9.5px] text-zinc-400 font-bold block mt-0.5">Add inventory received or found</span>
                      </div>
                    </div>
                    <ArrowUpRight size={16} className={type === "INCREASE" ? "text-emerald-500" : "text-zinc-300"} />
                  </label>

                  <label className={`flex items-center justify-between p-3 border rounded-xl cursor-pointer transition-all ${
                    type === "DECREASE" 
                      ? "border-rose-500 bg-rose-500/5 text-rose-650 dark:text-rose-450" 
                      : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                  }`}>
                    <div className="flex items-center gap-2">
                      <input 
                        type="radio" 
                        name="adjType" 
                        checked={type === "DECREASE"}
                        onChange={() => setType("DECREASE")}
                        className="accent-rose-500"
                      />
                      <div>
                        <span className="font-extrabold block text-xs">Decrease Stock</span>
                        <span className="text-[9.5px] text-zinc-400 font-bold block mt-0.5">Remove waste, damage, or discrepancy</span>
                      </div>
                    </div>
                    <ArrowDownRight size={16} className={type === "DECREASE" ? "text-rose-500" : "text-zinc-300"} />
                  </label>
                </div>
              </div>

              {/* Quantity */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Quantity to Adjust *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="0.00"
                    value={quantity}
                    onChange={handleQtyChange}
                    className="w-full px-3 py-2.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white pr-12 focus:border-[var(--primary)] outline-none transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 font-extrabold text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 text-[10px]">
                    {unit}
                  </span>
                </div>
                {validationError && (
                  <p className="text-[10px] text-rose-600 font-extrabold flex items-center gap-1 mt-1 animate-shake">
                    <AlertCircle size={10} />
                    <span>{validationError}</span>
                  </p>
                )}
              </div>

              {/* Row: Reason & Ref Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Reason *</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none"
                  >
                    <option value="Damage">Damage</option>
                    <option value="Manual Correction">Manual Correction</option>
                    <option value="Expired">Expired</option>
                    <option value="Transfer">Transfer</option>
                    <option value="Waste">Waste</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Reference Number</label>
                  <input
                    type="text"
                    placeholder="e.g. PO-8840, WST-903"
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none"
                  />
                </div>
              </div>

              {/* Remarks Textarea */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Remarks</label>
                <textarea
                  placeholder="Describe the reason for adjustment (max 500 characters)..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value.slice(0, 500))}
                  rows={3}
                  className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none resize-none"
                />
                <div className="flex justify-end">
                  <span className="text-[8.5px] text-zinc-400 font-bold">{remarks.length}/500</span>
                </div>
              </div>

              {/* Attachment Upload */}
              <div className="space-y-1.5">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block">Attachment (Optional)</label>
                <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)]/50 rounded-xl p-4 flex flex-col items-center justify-center gap-2 cursor-pointer transition-all bg-zinc-50/20 dark:bg-zinc-900/10 relative">
                  <input 
                    type="file" 
                    accept=".jpg,.jpeg,.png,.pdf" 
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                  />
                  {file ? (
                    <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
                      <FileText size={20} className="text-[var(--primary)]" />
                      <div className="text-left">
                        <p className="font-extrabold text-[10.5px] max-w-[200px] truncate">{file.name}</p>
                        <p className="text-[8.5px] text-zinc-400 font-bold">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={20} className="text-zinc-400" />
                      <div className="text-center">
                        <p className="text-[10px] text-zinc-650 dark:text-zinc-350">
                          Click to upload or drag & drop files
                        </p>
                        <p className="text-[8.5px] text-zinc-400 font-bold mt-0.5">
                          Supports JPG, PNG, PDF (Max 5MB)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Live Preview Calculations Panel */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-2">
                <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Live Calculation Preview</span>
                <div className="flex items-center justify-between font-bold text-[10.5px] text-zinc-650 dark:text-zinc-350">
                  <div className="flex flex-col items-center">
                    <span className="text-[8.5px] text-zinc-400">Previous Stock</span>
                    <span className="font-mono text-xs text-zinc-700 dark:text-zinc-350">{currentStock} {unit}</span>
                  </div>
                  <div className="text-zinc-400 font-extrabold text-xs">+ / -</div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8.5px] text-zinc-400">Adjustment</span>
                    <span className={`font-mono text-xs ${
                      qtyNumber === 0 
                        ? "text-zinc-450" 
                        : type === "INCREASE" 
                          ? "text-emerald-600" 
                          : "text-rose-600"
                    }`}>
                      {qtyNumber === 0 ? "" : type === "INCREASE" ? "+" : "-"}{qtyNumber} {unit}
                    </span>
                  </div>
                  <div className="text-zinc-400 font-extrabold text-xs">=</div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8.5px] text-zinc-400">New Stock</span>
                    <span className="font-mono text-xs font-black text-zinc-900 dark:text-white">
                      {newStock} {unit}
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Footer Buttons */}
            <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end gap-2 bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={adjustMutation.isPending}
                className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md active:scale-98 transition-all cursor-pointer disabled:opacity-50"
              >
                {adjustMutation.isPending ? "Updating..." : "Save Adjustment"}
              </button>
            </footer>
          </form>
        </div>
      </div>

      {/* Confirmation Dialog Box */}
      {showConfirm && (
        <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-[60] overflow-hidden text-xs">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setShowConfirm(false)} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-5 rounded-2xl shadow-2xl max-w-sm w-full space-y-4 font-semibold animate-scale-up">
              <div className="flex gap-3">
                <span className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl shrink-0">
                  <AlertCircle size={18} />
                </span>
                <div>
                  <h3 className="text-zinc-900 dark:text-white font-extrabold text-sm">
                    Confirm Stock Update
                  </h3>
                  <p className="text-zinc-450 mt-1 leading-normal">
                    Are you sure you want to update stock level to <span className="text-zinc-900 dark:text-white font-black">{newStock} {unit}</span>?
                  </p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirm(false)}
                  className="px-3.5 py-2 border border-zinc-250 dark:border-zinc-800 rounded-xl font-bold hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-500 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={adjustMutation.isPending}
                  className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md cursor-pointer disabled:opacity-50"
                >
                  {adjustMutation.isPending ? "Confirming..." : "Confirm Change"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
