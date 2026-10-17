import React, { useState } from "react";
import {
  X,
  Plus,
  Loader2,
  Disc,
  Sparkles,
  Droplets,
  Flame,
  Layers,
  Tag,
  Coffee,
  Pizza,
  Utensils,
  Package,
  Box,
  Star,
  Heart,
  Bookmark,
  Shield,
  Zap
} from "lucide-react";

export const ICON_MAP = {
  Disc,
  Sparkles,
  Droplets,
  Flame,
  Layers,
  Tag,
  Coffee,
  Pizza,
  Utensils,
  Package,
  Box,
  Star,
  Heart,
  Bookmark,
  Shield,
  Zap
};

export const COLOR_OPTIONS = [
  { label: "Amber (Crusts)", value: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30", dot: "bg-amber-500" },
  { label: "Emerald (Toppings)", value: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30", dot: "bg-emerald-500" },
  { label: "Sky (Dips)", value: "text-sky-500 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/30", dot: "bg-sky-500" },
  { label: "Orange (Cheese)", value: "text-orange-500 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30", dot: "bg-orange-500" },
  { label: "Purple (Burst)", value: "text-purple-500 bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/30", dot: "bg-purple-500" },
  { label: "Indigo (Gourmet)", value: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900/30", dot: "bg-indigo-500" },
  { label: "Rose (Spicy)", value: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/30", dot: "bg-rose-500" },
  { label: "Teal (Sides)", value: "text-teal-500 bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/30", dot: "bg-teal-500" }
];

export default function AddTypeModal({ isOpen, onClose, onSave }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Tag");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [status, setStatus] = useState("Active");
  const [sortOrder, setSortOrder] = useState(0);
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleNameChange = (val) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/[^a-z0-9]/g, "-")) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-"));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Type name is required");
      return;
    }

    setLoading(true);
    await onSave({
      name: name.trim(),
      slug: (slug || name).toLowerCase().trim().replace(/[^a-z0-9]/g, "-"),
      description: description.trim(),
      icon,
      color,
      status,
      sortOrder: Number(sortOrder) || 0,
      isDefault
    });
    setLoading(false);
  };

  const SelectedIcon = ICON_MAP[icon] || Tag;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${color}`}>
              <SelectedIcon size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Create Add-on Type</h2>
              <p className="text-xs text-zinc-500">Define a new category of add-on (e.g. Crust, Toppings, Dips).</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Type Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Crust, Beverage Addon"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Slug / Key</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="e.g. crust, beverage-addon"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of this add-on category..."
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 resize-none"
            />
          </div>

          {/* Icon Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Choose Icon</label>
            <div className="grid grid-cols-8 gap-2 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              {Object.keys(ICON_MAP).map((iconKey) => {
                const ItemIcon = ICON_MAP[iconKey];
                const isSelected = icon === iconKey;
                return (
                  <button
                    key={iconKey}
                    type="button"
                    onClick={() => setIcon(iconKey)}
                    className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                      isSelected
                        ? "bg-[var(--primary)] text-white shadow-sm scale-110"
                        : "text-zinc-500 hover:bg-zinc-200/60 dark:hover:bg-zinc-800"
                    }`}
                    title={iconKey}
                  >
                    <ItemIcon size={16} />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Color Theme Selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1.5">Badge Color Palette</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {COLOR_OPTIONS.map((opt) => {
                const isSelected = color === opt.value;
                return (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setColor(opt.value)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer text-left ${
                      isSelected
                        ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/20 bg-orange-50/30 dark:bg-orange-950/20 font-bold"
                        : "border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950 hover:border-zinc-300"
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${opt.dot} shrink-0`} />
                    <span className="truncate text-[11px]">{opt.label.split(" ")[0]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Sort Order</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                placeholder="0"
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100"
              />
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold shadow-md hover:scale-[1.02] active:scale-95 transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Create Type
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

