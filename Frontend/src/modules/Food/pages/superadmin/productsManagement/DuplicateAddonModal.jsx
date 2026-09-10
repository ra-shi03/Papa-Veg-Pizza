import React, { useState, useEffect } from "react";
import { Copy, X, CheckSquare, Square, RefreshCw } from "lucide-react";

export default function DuplicateAddonModal({ isOpen, onClose, addon, onConfirm }) {
  const [options, setOptions] = useState({
    productMappings: true,
    categoryMappings: true,
    pricing: true,
    image: true,
    generateName: true
  });
  const [newName, setNewName] = useState("");
  const [isDuplicating, setIsDuplicating] = useState(false);

  useEffect(() => {
    if (isOpen && addon) {
      setNewName(addon.name ? `${addon.name} (Copy)` : "");
      setOptions({
        productMappings: true,
        categoryMappings: true,
        pricing: true,
        image: true,
        generateName: true
      });
    }
  }, [isOpen, addon]);

  if (!isOpen || !addon) return null;

  const handleToggle = (key) => {
    setOptions((prev) => {
      const nextOpts = { ...prev, [key]: !prev[key] };
      // If generateName changes, automatically update the newName text field helper
      if (key === "generateName") {
        setNewName(nextOpts.generateName ? `${addon.name} (Copy)` : addon.name);
      }
      return nextOpts;
    });
  };

  const handleDuplicate = () => {
    if (!newName.trim()) {
      alert("Name is required for duplication.");
      return;
    }
    setIsDuplicating(true);
    setTimeout(() => {
      setIsDuplicating(false);
      onConfirm?.(addon, newName, options);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-2">
            <Copy size={16} className="text-[var(--primary)]" />
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Duplicate Add-on
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors text-zinc-500"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-lg border border-zinc-150 dark:border-zinc-800">
            <p className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">
              Duplicating: <span className="font-bold text-[var(--primary)]">{addon.name}</span>
            </p>
            <p className="text-[10px] text-zinc-500 mt-1 leading-normal">
              Select which attributes and mappings you want to copy into the duplicate.
            </p>
          </div>

          {/* New Name field */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">
              Duplicate Add-on Name
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g. Paneer Tikka (Extra)"
              className="w-full h-9 px-3 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-xs font-bold outline-none focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] text-zinc-900 dark:text-zinc-100"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries({
              productMappings: "Copy Product Mappings",
              categoryMappings: "Copy Category Mappings",
              pricing: "Copy Pricing Rules",
              image: "Copy Image Asset",
              generateName: "Auto New Name suffix"
            }).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleToggle(key)}
                className="flex items-center gap-2 p-2 rounded-lg border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-left transition-all"
              >
                {options[key] ? (
                  <CheckSquare size={16} className="text-[var(--primary)] shrink-0" fill="var(--primary)" color="white" />
                ) : (
                  <Square size={16} className="text-zinc-350 dark:text-zinc-650 shrink-0" />
                )}
                <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isDuplicating}
            className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-lg hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleDuplicate}
            disabled={isDuplicating}
            className="px-4 py-1.5 bg-[var(--primary)] text-white font-bold text-xs rounded-lg shadow-md hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 disabled:opacity-75"
          >
            {isDuplicating ? (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Duplicating...</span>
              </>
            ) : (
              <span>Duplicate Add-on</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
