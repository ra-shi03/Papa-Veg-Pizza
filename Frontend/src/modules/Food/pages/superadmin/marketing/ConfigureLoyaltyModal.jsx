import React, { useState, useEffect } from 'react';
import { X, Save, RefreshCw, Settings, Info, HelpCircle } from 'lucide-react';
import { api } from './LoyaltyData';
import { toast } from 'sonner';

export default function ConfigureLoyaltyModal({ isOpen, onClose, onSaveSuccess }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    pointPerRupee: 1,
    pointValue: 0.25,
    minimumRedeemPoints: 100,
    maximumRedeemPercent: 50,
    expiryDays: 365
  });

  useEffect(() => {
    if (isOpen) {
      fetchSettings();
    }
  }, [isOpen]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const data = await api.getSettings();
      setSettings(data);
    } catch (err) {
      toast.error("Failed to load loyalty settings.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, val) => {
    setSettings(prev => ({
      ...prev,
      [field]: Number(val) || 0
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (settings.pointPerRupee <= 0 || settings.pointValue <= 0 || settings.minimumRedeemPoints < 0 || settings.maximumRedeemPercent < 0 || settings.expiryDays <= 0) {
      toast.error("Please enter valid positive values for all fields.");
      return;
    }
    if (settings.maximumRedeemPercent > 100) {
      toast.error("Maximum redemption percentage cannot exceed 100%.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.updateSettings(settings);
      if (res.success) {
        toast.success("Loyalty settings updated successfully!");
        onSaveSuccess();
        onClose();
      }
    } catch (err) {
      toast.error("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[1000px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-800 dark:text-zinc-100 max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[var(--primary)]/10 rounded-lg text-[var(--primary)]">
              <Settings size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-black dark:text-white">Configure Loyalty Program</h2>
              <p className="text-[10px] text-zinc-500 font-medium">Manage conversion rules, minimum redemption bounds, and expiry limits.</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Container */}
        {loading ? (
          <div className="flex-1 py-20 flex flex-col items-center justify-center gap-3">
            <RefreshCw size={24} className="text-[var(--primary)] animate-spin" />
            <p className="text-xs font-bold text-zinc-400">Loading settings schema...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Alert info box */}
            <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl flex gap-3 text-xs">
              <Info size={18} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold text-amber-800 dark:text-amber-400">Rules Engine Alert</p>
                <p className="text-[11px] text-amber-700/90 dark:text-zinc-300 leading-relaxed font-semibold">
                  Changes to these settings apply immediately to all active order transactions. It does not retroactively modify historically finalized point ledger records.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Point Earning conversion */}
              <div className="p-5 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-950/20 flex flex-col gap-4">
                <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center justify-between">
                  <span>Earning Rule</span>
                  <HelpCircle size={13} className="text-zinc-400" title="Conversion value of rupee spent to points earned." />
                </h3>
                
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-zinc-500">Points Ratio (₹1 Spend = X Points)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-750">₹1 Spend =</span>
                    <input 
                      type="number"
                      value={settings.pointPerRupee}
                      onChange={(e) => handleInputChange('pointPerRupee', e.target.value)}
                      className="flex-1 h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:border-[var(--primary)] outline-none text-black dark:text-white font-mono font-bold"
                      min="0.1"
                      step="any"
                      required
                    />
                    <span className="text-xs font-bold text-zinc-500">Points</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">Example: A customer spending ₹400 earns {400 * settings.pointPerRupee} points.</p>
                </div>
              </div>

              {/* Point redemption conversion */}
              <div className="p-5 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-950/20 flex flex-col gap-4">
                <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2 flex items-center justify-between">
                  <span>Redemption Value</span>
                  <HelpCircle size={13} className="text-zinc-400" title="Cash equivalent of 1 loyalty point during checkout." />
                </h3>

                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-zinc-500">Point Value (1 Point = ₹ Value)</label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-750">1 Point =</span>
                    <input 
                      type="number"
                      value={settings.pointValue}
                      onChange={(e) => handleInputChange('pointValue', e.target.value)}
                      className="flex-1 h-10 px-3 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:border-[var(--primary)] outline-none text-black dark:text-white font-mono font-bold"
                      min="0.01"
                      step="any"
                      required
                    />
                    <span className="text-xs font-bold text-zinc-500">INR</span>
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1">Example: Redeeming 1000 points grants ₹{1000 * settings.pointValue} checkout discount.</p>
                </div>
              </div>

              {/* Redemption Limits */}
              <div className="p-5 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/30 dark:bg-zinc-955/20 flex flex-col gap-4 md:col-span-2">
                <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-2">Redemption Limits &amp; Expiry</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-500">Minimum Redeem Points</label>
                    <input 
                      type="number"
                      value={settings.minimumRedeemPoints}
                      onChange={(e) => handleInputChange('minimumRedeemPoints', e.target.value)}
                      className="h-10 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:border-[var(--primary)] outline-none text-black dark:text-white font-mono font-bold"
                      min="0"
                      required
                    />
                    <span className="text-[9px] text-zinc-400">Min point balance needed to enable redemption.</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-500">Maximum Redemption %</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.maximumRedeemPercent}
                        onChange={(e) => handleInputChange('maximumRedeemPercent', e.target.value)}
                        className="w-full h-10 pl-3 pr-8 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:border-[var(--primary)] outline-none text-black dark:text-white font-mono font-bold"
                        min="1"
                        max="100"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-400">%</span>
                    </div>
                    <span className="text-[9px] text-zinc-400">Max percentage of bill amount redeemable.</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-zinc-500">Point Expiry Days</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={settings.expiryDays}
                        onChange={(e) => handleInputChange('expiryDays', e.target.value)}
                        className="w-full h-10 pl-3 pr-12 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-sm focus:border-[var(--primary)] outline-none text-black dark:text-white font-mono font-bold"
                        min="1"
                        required
                      />
                      <span className="absolute right-3 top-2.5 text-xs font-bold text-zinc-400">Days</span>
                    </div>
                    <span className="text-[9px] text-zinc-400">Points expire automatically after X days.</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Form Footer Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-150 dark:border-zinc-800">
              <button 
                type="button" 
                onClick={onClose}
                className="h-10 px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 transition-colors"
                disabled={saving}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="h-10 px-5 bg-[var(--primary)] text-white text-xs font-extrabold rounded-lg hover:bg-[var(--primary)]/90 shadow-md flex items-center justify-center gap-1.5 active:scale-98 transition-all"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw size={13} className="animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save size={13} />
                    Save Settings
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
