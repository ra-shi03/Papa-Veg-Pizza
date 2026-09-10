import React, { useState, useEffect } from "react";
import { X, Info } from "lucide-react";

export default function EditRegionModal({ isOpen, onClose, onSubmit, existingRegions = [], editRegion }) {
  const [regionName, setRegionName] = useState("");
  const [country, setCountry] = useState("India");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Active");
  const [error, setError] = useState("");

  useEffect(() => {
    if (editRegion) {
      setRegionName(editRegion.name || "");
      setCountry(editRegion.country || "India");
      setDescription(editRegion.description || "");
      setStatus(editRegion.status || "Active");
    }
    setError("");
  }, [editRegion, isOpen]);

  if (!isOpen || !editRegion) return null;

  const handleSave = () => {
    setError("");
    const trimmedName = regionName.trim();
    const trimmedCountry = country.trim();

    if (!trimmedName) {
      setError("Region name is required.");
      return;
    }
    if (!trimmedCountry) {
      setError("Country is required.");
      return;
    }

    // Check duplicate (exclude current region)
    const isDuplicate = existingRegions.some(
      (r) =>
        r.name.toLowerCase() === trimmedName.toLowerCase() &&
        r.country.toLowerCase() === trimmedCountry.toLowerCase() &&
        r.id !== editRegion.id
    );

    if (isDuplicate) {
      setError(`Region "${trimmedName}" already exists in ${trimmedCountry}.`);
      return;
    }

    onSubmit({
      ...editRegion,
      name: trimmedName,
      country: trimmedCountry,
      description,
      status: status
    });
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/55 backdrop-blur-sm lg:pl-[280px]" id="edit-region-modal">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
        {/* Header */}
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">
              Edit Region
            </h3>
            <p className="text-[10px] font-bold text-[var(--primary)] mt-0.5">
              Modifying {editRegion.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-black dark:text-zinc-300 hover:text-[var(--primary)] cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          {editRegion.zonesCount > 0 && status === "Inactive" && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-lg flex gap-2">
              <Info className="text-amber-600 shrink-0 mt-0.5" size={14} />
              <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400">
                Warning: This region contains {editRegion.zonesCount} linked zone(s) and associated stores. Making it inactive will disable future assignments.
              </p>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Region Name *</label>
            <input
              type="text"
              value={regionName}
              onChange={(e) => setRegionName(e.target.value)}
              placeholder="e.g. North India, West India"
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Country *</label>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="e.g. India"
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context on territories or cities in this region..."
              rows={3}
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)] resize-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between gap-3 select-none">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-lg text-xs font-bold hover:scale-[1.01] active:scale-95 transition-all cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
