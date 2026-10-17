import React, { useState, useEffect } from "react";
import { X, Check, Loader2, Tag } from "lucide-react";
import { ICON_MAP, COLOR_OPTIONS } from "./AddTypeModal";

export default function EditTypeModal({ isOpen, onClose, typeData, onSave }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("Tag");
  const [color, setColor] = useState(COLOR_OPTIONS[0].value);
  const [status, setStatus] = useState("Active");
  const [sortOrder, setSortOrder] = useState(0);
  const [isDefault, setIsDefault] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeData && isOpen) {
      setName(typeData.name || "");
      setSlug(typeData.slug || "");
      setDescription(typeData.description || "");
      setIcon(typeData.icon || "Tag");
      setColor(typeData.color || COLOR_OPTIONS[0].value);
      setStatus(typeData.status || "Active");
      setSortOrder(typeData.sortOrder ?? 0);
      setIsDefault(Boolean(typeData.isDefault));
      setLoading(false);
    }
  }, [typeData, isOpen]);

  if (!isOpen || !typeData) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      alert("Type name is required");
      return;
    }

    setLoading(true);
    await onSave({
      _id: typeData._id,
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
              <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Edit Add-on Type</h2>
              <p className="text-xs text-zinc-500">Update configuration for {typeData.name}.</p>
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
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-700 dark:text-zinc-300 mb-1">Slug / Key</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
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
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              Update Type
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

