import React, { useState, useEffect } from "react";
import { Modal, Checkbox, Input } from "antd";
import { ClipboardCheck, Sparkles, User, AlertCircle } from "lucide-react";

const { TextArea } = Input;

export default function PackagingChecklistModal({ visible, onClose, order, onSubmit }) {
  const [checklist, setChecklist] = useState({
    pizzaCountVerified: false,
    saucesIncluded: false,
    cutleryIncluded: false,
    billAttached: false,
    qualityVerified: false,
    packagingSealed: false
  });
  
  const [notes, setNotes] = useState("");

  // Reset checklist on order or modal changes
  useEffect(() => {
    if (order && visible) {
      setChecklist({
        pizzaCountVerified: false,
        saucesIncluded: false,
        cutleryIncluded: false,
        billAttached: false,
        qualityVerified: false,
        packagingSealed: false
      });
      setNotes("");
    }
  }, [order, visible]);

  if (!order) return null;

  const handleCheckboxChange = (key, val) => {
    setChecklist((prev) => ({ ...prev, [key]: val }));
  };

  const isAllChecked = Object.values(checklist).every((val) => val === true);

  const handleSubmit = () => {
    if (!isAllChecked) return;
    
    onSubmit({
      orderId: order._id,
      ...checklist,
      notes
    });
    
    onClose();
  };

  const checklistItems = [
    { key: "pizzaCountVerified", label: "Pizza Count Verified", desc: "Verify total pizzas against order invoice." },
    { key: "saucesIncluded", label: "Oregano & Chili Flakes Included", desc: "Ensure sufficient seasoning sachets are provided." },
    { key: "cutleryIncluded", label: "Cutlery / Napkins Included", desc: "Provide wooden spoons and tissues." },
    { key: "billAttached", label: "Tax Invoice / Bill Attached", desc: "Securely stick thermal invoice on box." },
    { key: "qualityVerified", label: "Bake Quality Verified", desc: "Confirm correct toppings, bake golden crust, no burns." },
    { key: "packagingSealed", label: "Boxes Taped / Sealed", desc: "Apply safety hygiene seal sticker." }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <ClipboardCheck size={18} className="text-[var(--primary)]" />
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white">Quality QA Checklist</h3>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
              Verify packing criteria for Order #{order.orderNumber}
            </p>
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={420}
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
            disabled={!isAllChecked}
            className={`px-4 py-2 text-white font-extrabold rounded-xl text-xs transition-all shadow-sm cursor-pointer flex items-center gap-1.5 ${
              isAllChecked
                ? "bg-[var(--primary)] hover:bg-[var(--sa-primary-hover)]"
                : "bg-slate-200 dark:bg-zinc-800 text-slate-400 dark:text-zinc-600 cursor-not-allowed"
            }`}
          >
            <Sparkles size={12} />
            Log Verification
          </button>
        </div>
      }
    >
      <div className="py-4 space-y-4 text-xs">
        {/* Verification lists */}
        <div className="space-y-3 pr-1 max-h-[300px] overflow-y-auto">
          {checklistItems.map((item) => (
            <label
              key={item.key}
              className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all duration-300 cursor-pointer ${
                checklist[item.key]
                  ? "bg-emerald-50/20 border-emerald-200/50 dark:border-emerald-900/30"
                  : "bg-slate-50/50 dark:bg-zinc-950/20 border-slate-100 dark:border-zinc-850"
              }`}
            >
              <Checkbox
                checked={checklist[item.key]}
                onChange={(e) => handleCheckboxChange(item.key, e.target.checked)}
                className="mt-0.5 accent-emerald-500 scale-105"
              />
              <div>
                <span className={`font-black block text-xs ${checklist[item.key] ? "text-emerald-700 dark:text-emerald-450" : "text-slate-800 dark:text-zinc-200"}`}>
                  {item.label}
                </span>
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-555 block mt-0.5 leading-tight">
                  {item.desc}
                </span>
              </div>
            </label>
          ))}
        </div>

        {/* Text area */}
        <div className="space-y-1">
          <label className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">
            QA Packaging Remarks / Notes
          </label>
          <TextArea
            placeholder="Add packaging notes (e.g. customized boxes used, extra oregano packs included)..."
            rows={2}
            className="text-xs"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        {/* Auto filled staff footer */}
        <div className="flex items-center justify-between p-2.5 bg-slate-50 dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-850">
          <div className="flex items-center gap-1.5 font-bold text-slate-500">
            <User size={13} className="text-slate-400" />
            <span>Inspection Officer:</span>
          </div>
          <span className="font-black text-slate-900 dark:text-white">Karan Johar (QA)</span>
        </div>

        {!isAllChecked && (
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 dark:text-amber-500 font-bold justify-center pt-1 animate-pulse">
            <AlertCircle size={12} />
            <span>All packaging checklists must be checked to confirm.</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
