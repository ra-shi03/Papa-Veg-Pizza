import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, Info } from 'lucide-react';

export default function ForceUpdateModal({ isOpen, onClose, currentVersions, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    androidVersion: currentVersions?.androidVersion || '2.4.1',
    iosVersion: currentVersions?.iosVersion || '2.4.0',
    customerAppVersion: currentVersions?.customerAppVersion || '2.4.2',
    forceUpdate: currentVersions?.forceUpdate || false,
    releaseNotes: "We've added UPI payment routing fixes and optimized real-time map drawing buffers.",
    updateMessage: "A critical patch is ready. Please update your Papa Veg Pizza app to continue ordering.",
    effectiveDate: new Date().toISOString().slice(0, 16)
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.androidVersion.trim() || !formData.iosVersion.trim()) {
      setError('Android and iOS target versions are required.');
      return;
    }

    setIsSaving(true);
    setError('');

    // Simulate API request (PUT /api/configurations)
    setTimeout(() => {
      setIsSaving(false);
      onSave(formData);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm transition-all duration-350 p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
              <AlertTriangle className="text-red-505 shrink-0" size={18} />
              Force Application Update
            </h3>
            <p className="text-[10px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Push mandatory update specifications to customer mobile applications</p>
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
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-[11px] font-semibold text-red-650 dark:text-red-400">
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="forceUpdateForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Warning Banner */}
            <div className="bg-red-500/5 dark:bg-red-950/15 border-2 border-dashed border-red-500/20 rounded-xl p-3.5 flex gap-3 text-zinc-850 dark:text-zinc-200">
              <AlertTriangle size={20} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-red-800 dark:text-red-400">Mandatory Action Warning</h4>
                <p className="text-[10px] leading-relaxed text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-1 font-medium">
                  Users below the required versions specified below will be forced to update. They will not be able to bypass the update screen on customer apps.
                </p>
              </div>
            </div>

            {/* Version Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Customer App Version
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.customerAppVersion}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerAppVersion: e.target.value }))}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-150"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Android Target Build
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.androidVersion}
                  onChange={(e) => setFormData(prev => ({ ...prev, androidVersion: e.target.value }))}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-150"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  iOS Target Build
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.iosVersion}
                  onChange={(e) => setFormData(prev => ({ ...prev, iosVersion: e.target.value }))}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-150"
                />
              </div>
            </div>

            {/* Mandatory Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Mandatory Update Flag</p>
                <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Toggle if the update blocks app usage</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.forceUpdate}
                  onChange={(e) => setFormData(prev => ({ ...prev, forceUpdate: e.target.checked }))}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            {/* Update Message */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                Update Display Message
              </label>
              <input 
                type="text" 
                required
                value={formData.updateMessage}
                onChange={(e) => setFormData(prev => ({ ...prev, updateMessage: e.target.value }))}
                className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-150"
              />
            </div>

            {/* Release Notes */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                Release Notes / Changelog
              </label>
              <textarea 
                required 
                rows="3"
                value={formData.releaseNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, releaseNotes: e.target.value }))}
                className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none resize-none text-zinc-900 dark:text-zinc-150"
              ></textarea>
            </div>

            {/* Effective Date */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                Effective Rollout Date
              </label>
              <input 
                type="datetime-local" 
                required
                value={formData.effectiveDate}
                onChange={(e) => setFormData(prev => ({ ...prev, effectiveDate: e.target.value }))}
                className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-150"
              />
            </div>

          </form>
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-750 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="forceUpdateForm"
            disabled={isSaving}
            className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            {isSaving ? 'Saving Update...' : 'Save & Publish Update'}
          </button>
        </footer>
      </div>
    </div>
  );
}
