import React, { useState, useEffect } from 'react';
import { X, Award, RefreshCw, AlertTriangle, ArrowUpRight } from 'lucide-react';
import { api } from './LoyaltyData';
import { toast } from 'sonner';

export default function UpgradeTierModal({ isOpen, onClose, customerData, onSaveSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [tiers, setTiers] = useState([]);
  const [selectedTier, setSelectedTier] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTiers();
      setReason('');
      if (customerData) {
        setSelectedTier(customerData.tier);
      }
    }
  }, [isOpen, customerData]);

  const fetchTiers = async () => {
    setLoading(true);
    try {
      const data = await api.getTiers();
      setTiers(data);
    } catch (err) {
      toast.error("Failed to load tiers list.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTier) {
      toast.error("Please select a target tier.");
      return;
    }
    if (selectedTier === customerData.tier) {
      toast.error("Customer is already in the selected tier.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter a reason for this tier modification.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.upgradeTier(customerData._id, selectedTier, reason);
      if (res.success) {
        toast.success(`Successfully updated ${customerData.name}'s tier to ${selectedTier}!`);
        onSaveSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.message || "Failed to upgrade tier.");
    } finally {
      setSubmitting(false);
    }
  };

  // Find configuration of selected tier to preview benefits
  const activeTierConfig = tiers.find(t => t.name.toLowerCase() === selectedTier.toLowerCase());

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[280px] z-[65] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[520px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-850 dark:text-zinc-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Award className="text-[var(--primary)]" size={16} />
            <h2 className="text-sm font-black text-black dark:text-white">Upgrade Customer Tier</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-650"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Form */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="text-[var(--primary)] animate-spin" />
            <p className="text-xs font-bold text-zinc-450">Loading tier privileges...</p>
          </div>
        ) : (
          <form onSubmit={handleUpgradeSubmit} className="p-5 space-y-4 text-xs font-semibold">
            
            {/* Customer Overview */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-[10px] text-zinc-450 uppercase tracking-widest leading-none">Customer</p>
                <p className="text-xs font-black text-black dark:text-white mt-1">{customerData?.name}</p>
                <p className="text-[10px] text-zinc-555 dark:text-zinc-400 mt-0.5">{customerData?.customerId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-450 uppercase tracking-widest leading-none">Current Tier</p>
                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border uppercase mt-1 ${
                  customerData?.tier.toLowerCase() === 'platinum'
                    ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40'
                    : customerData?.tier.toLowerCase() === 'gold'
                      ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                      : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-450 border-zinc-200 dark:border-zinc-800'
                }`}>
                  {customerData?.tier}
                </span>
              </div>
            </div>

            {/* Target Tier Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Select Target Tier</label>
              <select
                value={selectedTier}
                onChange={(e) => setSelectedTier(e.target.value)}
                className="w-full h-10 px-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white cursor-pointer font-bold"
                required
              >
                <option value="" disabled>Select tier...</option>
                {tiers.map(t => (
                  <option key={t._id} value={t.name}>{t.name} (Min Spend: ₹{t.minSpent.toLocaleString('en-IN')})</option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reason for modification</label>
              <textarea
                placeholder="Describe why this customer's tier is modified manually..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-16 p-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-medium resize-none"
                required
              />
            </div>

            {/* Target Tier Benefits Preview Panel */}
            {activeTierConfig && (
              <div className="p-4 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col gap-2.5 animate-in slide-in-from-top-1.5 duration-200">
                <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <ArrowUpRight size={13} className="text-emerald-500" />
                  Target Tier Privileges: {activeTierConfig.name}
                </h4>

                <div className="flex items-center justify-between pb-1.5 border-b border-dashed border-zinc-200 dark:border-zinc-800 text-[11px]">
                  <span className="text-zinc-500">Points Multiplier:</span>
                  <span className="font-bold text-zinc-900 dark:text-white">{activeTierConfig.multiplier}x Multiplier</span>
                </div>

                <div className="space-y-1">
                  <p className="text-[9px] font-black text-zinc-450 uppercase tracking-widest leading-none mb-1">Key Benefits:</p>
                  <ul className="space-y-1">
                    {activeTierConfig.benefits.map((b, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[10px] text-zinc-650 dark:text-zinc-450 font-medium">
                        <span className="text-emerald-500 shrink-0">•</span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Warning Message if Downgrading */}
            {customerData && activeTierConfig && tiers.findIndex(t => t.name === activeTierConfig.name) < tiers.findIndex(t => t.name === customerData.tier) && (
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/20 rounded-xl flex gap-2.5 text-[10px] leading-relaxed">
                <AlertTriangle size={15} className="text-rose-500 shrink-0 mt-0.5" />
                <span className="text-rose-700 dark:text-rose-400 font-bold uppercase tracking-wider">
                  Caution: You are downgrading this customer to a lower loyalty tier tier. Multipliers and rewards benefits will decrease.
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
              <button 
                type="button" 
                onClick={onClose}
                className="h-9 px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                disabled={submitting}
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="h-9 px-5 bg-[var(--primary)] text-white font-extrabold rounded-lg hover:bg-[var(--primary)]/90 shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  "Upgrade Tier"
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
