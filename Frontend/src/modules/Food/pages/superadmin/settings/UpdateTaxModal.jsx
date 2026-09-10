import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Percent } from 'lucide-react';

export default function UpdateTaxModal({ isOpen, onClose, initialData, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    gstPercent: 5,
    serviceTaxPercent: 2,
    packagingCharge: 0,
    taxIncluded: false
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        gstPercent: initialData.gstPercent ?? 5,
        serviceTaxPercent: initialData.serviceTaxPercent ?? 2,
        packagingCharge: initialData.packagingCharge ?? 0,
        taxIncluded: initialData.taxIncluded ?? false
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const { gstPercent, serviceTaxPercent, packagingCharge } = formData;

    if (gstPercent < 0 || gstPercent > 100) {
      setError('GST Percentage must be between 0 and 100.');
      return;
    }
    if (serviceTaxPercent < 0 || serviceTaxPercent > 100) {
      setError('Service Charge Percentage must be between 0 and 100.');
      return;
    }
    if (packagingCharge < 0) {
      setError('Packaging Charge cannot be negative.');
      return;
    }

    setIsSaving(true);
    setError('');

    // Simulate API request (PUT /api/system/settings/tax)
    setTimeout(() => {
      setIsSaving(false);
      onSave(formData);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-955/60 backdrop-blur-sm transition-all duration-350 p-0 md:p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[75vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50">Update Tax Settings</h3>
            <p className="text-[10px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Manage global tax and charges policies for calculations</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-black dark:text-zinc-100 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-[11px] font-semibold text-red-600 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="updateTaxForm" onSubmit={handleSubmit} className="space-y-4">
            {/* GST Percent */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                GST (Goods & Services Tax) %
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  required
                  min="0"
                  max="100"
                  value={formData.gstPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, gstPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full h-8.5 pl-3 pr-8 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-150"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 text-xs">
                  %
                </div>
              </div>
            </div>

            {/* Service Charge Percent */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                Service Charge %
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="0.01"
                  required
                  min="0"
                  max="100"
                  value={formData.serviceTaxPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, serviceTaxPercent: parseFloat(e.target.value) || 0 }))}
                  className="w-full h-8.5 pl-3 pr-8 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-150"
                />
                <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 text-xs">
                  %
                </div>
              </div>
            </div>

            {/* Packaging Charge */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                Packaging Charge (Fixed)
              </label>
              <div className="relative">
                <input 
                  type="number" 
                  step="1"
                  required
                  min="0"
                  value={formData.packagingCharge}
                  onChange={(e) => setFormData(prev => ({ ...prev, packagingCharge: parseFloat(e.target.value) || 0 }))}
                  className="w-full h-8.5 pl-7 pr-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-150"
                />
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 text-xs font-bold">
                  ₹
                </div>
              </div>
            </div>

            {/* Tax Included Toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Prices Include Tax</p>
                <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Toggle if product prices show taxes included</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.taxIncluded}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxIncluded: e.target.checked }))}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="updateTaxForm"
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            {isSaving ? 'Updating...' : 'Save Settings'}
          </button>
        </footer>
      </div>
    </div>
  );
}
