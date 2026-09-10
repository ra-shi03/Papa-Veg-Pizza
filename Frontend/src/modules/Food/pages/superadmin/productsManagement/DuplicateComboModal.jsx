import React, { useState, useEffect } from "react";
import { X, Copy, CheckSquare, Square } from "lucide-react";

export default function DuplicateComboModal({
  isOpen,
  onClose,
  combo,
  onConfirm
}) {
  const [newName, setNewName] = useState("");
  const [copyProducts, setCopyProducts] = useState(true);
  const [copyBanner, setCopyBanner] = useState(true);
  const [copyDiscountRules, setCopyDiscountRules] = useState(true);
  const [copyValidity, setCopyValidity] = useState(false);
  const [copyStores, setCopyStores] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen && combo) {
      setNewName(`${combo.name} - Copy`);
      setCopyProducts(true);
      setCopyBanner(true);
      setCopyDiscountRules(true);
      setCopyValidity(false);
      setCopyStores(false);
      setError("");
    }
  }, [isOpen, combo]);

  if (!isOpen || !combo) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newName.trim()) {
      setError("Please specify a name for the duplicated combo.");
      return;
    }
    setError("");
    onConfirm(newName, {
      copyProducts,
      copyBanner,
      copyDiscountRules,
      copyValidity,
      copyStores
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-x-4 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2 max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 z-[80] space-y-4 animate-in fade-in zoom-in-95 text-zinc-900 dark:text-zinc-100 select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-zinc-150 dark:border-zinc-850">
          <div className="flex items-center gap-1.5">
            <Copy size={16} className="text-[var(--primary)]" />
            <h4 className="font-black text-sm">Duplicate Combo Package</h4>
          </div>
          <button onClick={onClose} className="p-0.5 hover:bg-zinc-150 dark:hover:bg-zinc-805 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X size={15} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          {/* New Name */}
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Duplicate Combo Name *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
              placeholder="e.g. Solo Classic Treat - Special Copy"
              className={`px-3 py-2 border rounded-lg text-xs bg-zinc-50 dark:bg-zinc-950 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] font-bold text-zinc-850 dark:text-zinc-150 ${error ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'}`}
            />
            {error && <p className="text-[9px] font-bold text-red-500 mt-0.5">{error}</p>}
          </div>

          {/* Duplication Settings Checklist */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Select Attributes to Copy</label>
            
            <div className="border border-zinc-150 dark:border-zinc-800 p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 space-y-2 font-semibold text-zinc-700 dark:text-zinc-300">
              
              {/* Copy Products */}
              <div
                onClick={() => setCopyProducts(!copyProducts)}
                className="flex items-center justify-between py-1 cursor-pointer hover:text-black dark:hover:text-white"
              >
                <span>Include Linked Products list</span>
                {copyProducts ? (
                  <CheckSquare size={14} className="text-[var(--primary)] shrink-0" />
                ) : (
                  <Square size={14} className="text-zinc-400 shrink-0" />
                )}
              </div>

              {/* Copy Banner */}
              <div
                onClick={() => setCopyBanner(!copyBanner)}
                className="flex items-center justify-between py-1 cursor-pointer hover:text-black dark:hover:text-white"
              >
                <span>Copy Banner Image URL</span>
                {copyBanner ? (
                  <CheckSquare size={14} className="text-[var(--primary)] shrink-0" />
                ) : (
                  <Square size={14} className="text-zinc-400 shrink-0" />
                )}
              </div>

              {/* Copy Discount rules */}
              <div
                onClick={() => setCopyDiscountRules(!copyDiscountRules)}
                className="flex items-center justify-between py-1 cursor-pointer hover:text-black dark:hover:text-white"
              >
                <span>Copy Pricing Method & Discount Values</span>
                {copyDiscountRules ? (
                  <CheckSquare size={14} className="text-[var(--primary)] shrink-0" />
                ) : (
                  <Square size={14} className="text-zinc-400 shrink-0" />
                )}
              </div>

              {/* Copy Validity dates */}
              <div
                onClick={() => setCopyValidity(!copyValidity)}
                className="flex items-center justify-between py-1 cursor-pointer hover:text-black dark:hover:text-white"
              >
                <span>Copy Date & Time Validity settings</span>
                {copyValidity ? (
                  <CheckSquare size={14} className="text-[var(--primary)] shrink-0" />
                ) : (
                  <Square size={14} className="text-zinc-400 shrink-0" />
                )}
              </div>

              {/* Copy Stores assignment */}
              <div
                onClick={() => setCopyStores(!copyStores)}
                className="flex items-center justify-between py-1 cursor-pointer hover:text-black dark:hover:text-white"
              >
                <span>Copy Franchise & Store Assignments</span>
                {copyStores ? (
                  <CheckSquare size={14} className="text-[var(--primary)] shrink-0" />
                ) : (
                  <Square size={14} className="text-zinc-400 shrink-0" />
                )}
              </div>

            </div>
          </div>

          {/* Footer Actions */}
          <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-zinc-150 dark:border-zinc-855">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold shadow-md cursor-pointer"
            >
              Duplicate
            </button>
          </div>

        </form>
      </div>
    </>
  );
}
