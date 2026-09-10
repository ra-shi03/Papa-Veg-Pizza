import React, { useState, useEffect } from 'react';
import { X, Plus, Save, RefreshCw, Trash2, Award } from 'lucide-react';
import { api } from './LoyaltyData';
import { toast } from 'sonner';

export default function EditTierModal({ isOpen, onClose, tierData, onSaveSuccess }) {
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [minSpent, setMinSpent] = useState(0);
  const [multiplier, setMultiplier] = useState(1.0);
  const [benefits, setBenefits] = useState([]);
  const [isActive, setIsActive] = useState(true);
  const [newBenefitInput, setNewBenefitInput] = useState('');

  useEffect(() => {
    if (isOpen && tierData) {
      setName(tierData.name || '');
      setMinSpent(tierData.minSpent || 0);
      setMultiplier(tierData.multiplier || 1.0);
      setBenefits(tierData.benefits || []);
      setIsActive(tierData.isActive !== undefined ? tierData.isActive : true);
      setNewBenefitInput('');
    }
  }, [isOpen, tierData]);

  const handleAddBenefit = (e) => {
    e.preventDefault();
    const benefit = newBenefitInput.trim();
    if (!benefit) return;
    if (benefits.includes(benefit)) {
      toast.error("Benefit is already added.");
      return;
    }
    setBenefits([...benefits, benefit]);
    setNewBenefitInput('');
  };

  const handleRemoveBenefit = (indexToRemove) => {
    setBenefits(benefits.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Tier Name is required.");
      return;
    }
    if (minSpent < 0 || multiplier < 0) {
      toast.error("Values must be non-negative.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateTier(tierData._id, {
        name,
        minSpent: Number(minSpent),
        multiplier: Number(multiplier),
        benefits,
        isActive
      });

      if (res.success) {
        toast.success("Loyalty tier updated successfully!");
        onSaveSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.message || "Failed to update tier.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[280px] z-[65] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[600px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-850 dark:text-zinc-100 max-h-[85vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Award className="text-[var(--primary)]" size={18} />
            <h2 className="text-sm font-black text-black dark:text-white">Edit Loyalty Tier: {tierData?.name}</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-650"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs font-semibold">
          
          {/* Tier Name */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tier Name</label>
            <input 
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
              required
            />
          </div>

          {/* Min Spent & Point Multiplier */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Min Spend (₹)</label>
              <input 
                type="number"
                value={minSpent}
                onChange={(e) => setMinSpent(e.target.value)}
                className="h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-mono font-bold"
                min="0"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Point Multiplier</label>
              <input 
                type="number"
                value={multiplier}
                onChange={(e) => setMultiplier(e.target.value)}
                className="h-9 px-3 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-mono font-bold"
                min="1"
                step="0.1"
                required
              />
            </div>
          </div>

          {/* Benefits Tag Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Tier Benefits</label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="e.g. Free Delivery, Priority Support..."
                value={newBenefitInput}
                onChange={(e) => setNewBenefitInput(e.target.value)}
                className="flex-1 h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
              />
              <button 
                type="button"
                onClick={handleAddBenefit}
                className="px-3 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 rounded-lg border border-zinc-250 dark:border-zinc-700 flex items-center justify-center gap-1 hover:text-black hover:dark:text-white cursor-pointer"
              >
                <Plus size={14} />
                Add
              </button>
            </div>

            {/* Render added tags */}
            <div className="flex flex-wrap gap-1.5 p-2.5 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-950/20 min-h-[60px]">
              {benefits.length === 0 ? (
                <span className="text-[10px] text-zinc-450 italic font-medium my-auto mx-auto select-none">No benefits registered. Add some items above.</span>
              ) : (
                benefits.map((benefit, idx) => (
                  <span 
                    key={idx}
                    className="flex items-center gap-1 px-2 py-0.5 rounded bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] font-bold border border-[var(--primary)]/15 animate-in zoom-in-95 duration-100"
                  >
                    {benefit}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveBenefit(idx)}
                      className="hover:bg-[var(--primary)]/20 rounded p-0.5"
                    >
                      <X size={10} className="stroke-[2.5]" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-zinc-150 dark:border-zinc-800 bg-zinc-50/30 dark:bg-zinc-950/10">
            <div>
              <p className="font-bold text-xs text-zinc-800 dark:text-zinc-150">Active Status</p>
              <p className="text-[10px] text-zinc-450 font-medium">Inactive tiers prevent customers from receiving its multiplier benefits.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsActive(!isActive)}
              className={`w-12 h-6.5 rounded-full p-0.5 transition-colors duration-250 focus:outline-none ${isActive ? 'bg-emerald-500' : 'bg-zinc-300 dark:bg-zinc-700'}`}
            >
              <div className={`w-5.5 h-5.5 rounded-full bg-white shadow transition-transform duration-250 ${isActive ? 'translate-x-5.5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
            <button 
              type="button" 
              onClick={onClose}
              className="h-9 px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="h-9 px-4 bg-[var(--primary)] text-white font-extrabold rounded-lg hover:bg-[var(--primary)]/90 shadow flex items-center justify-center gap-1.5 cursor-pointer"
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={12} />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
