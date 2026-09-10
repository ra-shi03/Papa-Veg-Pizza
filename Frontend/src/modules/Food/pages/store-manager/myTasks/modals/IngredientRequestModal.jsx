import React, { useState } from "react";
import { ShoppingCart, X, Loader2 } from "lucide-react";

export default function IngredientRequestModal({
  isOpen = false,
  onClose = () => {},
  onConfirm = () => {},
  loading = false,
}) {
  const [ingredientName, setIngredientName] = useState("Processed Mozzarella Cheese");
  const [quantity, setQuantity] = useState(2);
  const [unit, setUnit] = useState("kg");
  const [reason, setReason] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      ingredientName,
      quantity,
      unit,
      reason,
    });
  };

  const ingredients = [
    "Processed Mozzarella Cheese",
    "Diced Cheddar Cheese",
    "Classic Marinara Pizza Sauce",
    "Diced Paneer Cubes",
    "Sliced Button Mushrooms",
    "Sliced Red Onions",
    "Sliced Green Capsicums",
    "Garlic Herb Butter",
    "Oregano Seasoning Packets",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-955/45 dark:bg-zinc-955/65 backdrop-blur-xs animate-fade">
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-xl max-w-sm w-full space-y-4 animate-scale">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 pb-3">
          <div className="flex items-center gap-1.5 text-slate-900 dark:text-white">
            <ShoppingCart size={15} className="text-[var(--secondary)]" />
            <span className="text-xs font-black uppercase tracking-wider">Request Ingredients</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 dark:text-zinc-550 hover:bg-zinc-50 dark:hover:bg-zinc-850"
          >
            <X size={14} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Ingredient dropdown */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Select Ingredient
            </label>
            <select
              value={ingredientName}
              onChange={(e) => setIngredientName(e.target.value)}
              disabled={loading}
              className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
            >
              {ingredients.map((ing) => (
                <option key={ing} value={ing}>
                  {ing}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                min={0.1}
                step={0.1}
                required
                disabled={loading}
                className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
                Unit
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                disabled={loading}
                className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all cursor-pointer"
              >
                <option value="kg">kilograms (kg)</option>
                <option value="g">grams (g)</option>
                <option value="liters">liters (L)</option>
                <option value="pcs">pieces (pcs)</option>
              </select>
            </div>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider">
              Reason / Usage Station
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Preparing large dinner orders at Station 2, container empty..."
              rows={2}
              required
              disabled={loading}
              className="w-full text-xs font-semibold px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] transition-all disabled:opacity-50"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-50 dark:border-zinc-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 text-slate-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="text-[10px] font-bold px-4 py-2 rounded-lg bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] active:scale-[0.98] transition-all shadow-sm flex items-center gap-1 disabled:opacity-50 cursor-pointer"
            >
              {loading && <Loader2 size={12} className="animate-spin" />}
              <span>Send Request</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
