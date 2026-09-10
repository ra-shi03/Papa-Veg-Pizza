import React, { useState, useEffect } from "react";
import { Modal, Select, InputNumber, Checkbox } from "antd";
import { AlertCircle, Bell, PlusCircle } from "lucide-react";
import { useIngredients } from "../hooks/usePreparationBoard";

export default function IngredientIssueModal({ visible, onClose, item, onSubmit }) {
  const { data: ingredients = [], isLoading } = useIngredients();

  const [selectedIngId, setSelectedIngId] = useState("");
  const [missingQty, setMissingQty] = useState(1);
  const [urgency, setUrgency] = useState("Medium");
  const [remarks, setRemarks] = useState("");
  const [notifyManager, setNotifyManager] = useState(true);

  // Auto-filled unit based on selected ingredient
  const selectedIng = ingredients.find((i) => i._id === selectedIngId);
  const unit = selectedIng ? selectedIng.unit : "units";

  // Reset selected ingredient when list loads
  useEffect(() => {
    if (ingredients.length > 0 && !selectedIngId) {
      setSelectedIngId(ingredients[0]._id);
    }
  }, [ingredients]);

  if (!item) return null;

  const handleSubmit = () => {
    if (!selectedIngId || missingQty <= 0) return;

    onSubmit({
      orderItemId: item._id,
      ingredientId: selectedIngId,
      missingQuantity: missingQty,
      urgency,
      remarks: remarks.trim(),
      notifyManager
    });

    // Reset state & close
    setMissingQty(1);
    setRemarks("");
    setNotifyManager(true);
    onClose();
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <AlertCircle size={18} className="text-rose-500" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Report Ingredient Issue</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 mt-0.5">
              Log shortage/depletion for "{item.name}" toppings
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={400}
      centered
      footer={
        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedIngId || missingQty <= 0}
            className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer ${
              selectedIngId && missingQty > 0
                ? "bg-rose-600 hover:bg-rose-500"
                : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-650 cursor-not-allowed"
            }`}
          >
            Submit Issue Report
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-3.5 text-xs">
        {/* Ingredient select */}
        <div className="space-y-1.5">
          <label className="text-slate-450 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
            Ingredient
          </label>
          <Select
            value={selectedIngId}
            onChange={(val) => setSelectedIngId(val)}
            className="w-full text-xs font-bold"
            loading={isLoading}
            options={ingredients.map((i) => ({
              value: i._id,
              label: `${i.name} (Stock: ${i.currentStock} ${i.unit})`
            }))}
            popupClassName="dark:bg-zinc-900"
          />
        </div>

        {/* Missing Quantity */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-slate-450 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
              Missing Quantity
            </label>
            <div className="flex items-center gap-2">
              <InputNumber
                value={missingQty}
                onChange={(val) => setMissingQty(val || 1)}
                min={0.1}
                step={0.5}
                className="w-full text-xs font-extrabold"
              />
              <span className="text-xs font-extrabold text-slate-500 bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 rounded-xl border border-slate-150 dark:border-zinc-850">
                {unit}
              </span>
            </div>
          </div>

          {/* Urgency */}
          <div className="space-y-1.5">
            <label className="text-slate-450 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
              Urgency Level
            </label>
            <Select
              value={urgency}
              onChange={(val) => setUrgency(val)}
              className="w-full text-xs font-bold"
              options={[
                { value: "Low", label: "Low" },
                { value: "Medium", label: "Medium" },
                { value: "High", label: "High" },
                { value: "Critical", label: "Critical" }
              ]}
              popupClassName="dark:bg-zinc-900"
            />
          </div>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label className="text-slate-450 dark:text-zinc-400 font-extrabold uppercase tracking-wider text-[9px]">
            Remarks / Reason
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="E.g. Spoiled stock, packaging defect..."
            rows={3}
            className="w-full p-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 focus:border-rose-500 resize-none font-medium"
          />
        </div>

        {/* Checkbox Notify Manager */}
        <div
          onClick={() => setNotifyManager(!notifyManager)}
          className="flex items-center gap-2.5 p-2 bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-xl cursor-pointer"
        >
          <input
            type="checkbox"
            checked={notifyManager}
            onChange={() => {}} // handled by click on div
            className="accent-rose-500 h-3.5 w-3.5"
          />
          <div className="flex items-center gap-1.5 text-slate-700 dark:text-zinc-350 font-bold select-none">
            <Bell size={13} className="text-slate-450 dark:text-zinc-550" />
            <span>Notify Store Manager immediately</span>
          </div>
        </div>
      </div>
    </Modal>
  );
}
