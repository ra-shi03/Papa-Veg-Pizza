import React, { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle, Info, Sliders } from 'lucide-react';

export default function UpdateFeatureModal({ isOpen, onClose, feature, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    key: '',
    enabled: false,
    description: '',
    enableNotification: true,
    rolloutPercentage: 100
  });
  const [error, setError] = useState('');

  useEffect(() => {
    if (feature) {
      setFormData({
        name: feature.name || '',
        key: feature.key || '',
        enabled: feature.enabled || false,
        description: feature.description || '',
        enableNotification: feature.enableNotification ?? true,
        rolloutPercentage: feature.rolloutPercentage ?? 100
      });
    }
  }, [feature, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSaving(true);
    setError('');

    // Simulate API request (PUT /api/configurations/features)
    setTimeout(() => {
      setIsSaving(false);
      onSave(formData);
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm transition-all duration-350 p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[80vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50">Update Feature</h3>
            <p className="text-[10px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Edit status, rollout percentage, and parameters for this platform feature</p>
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

          <form id="updateFeatureForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Feature Name (Readonly) */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                Feature Name
              </label>
              <input 
                type="text" 
                readOnly
                value={formData.name}
                className="w-full h-8.5 px-3 border border-zinc-205 dark:border-zinc-750 rounded-lg bg-zinc-100 dark:bg-zinc-800/40 text-xs text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 cursor-not-allowed outline-none font-bold"
              />
            </div>

            {/* Current Status Toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Current Status</p>
                <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Toggle this feature module globally</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.enabled}
                  onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer" 
                />
                <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                Feature Description
              </label>
              <textarea 
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief explanation of this feature..."
                className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none resize-none text-zinc-900 dark:text-zinc-150"
              ></textarea>
            </div>

            {/* Enable Notification Checkbox */}
            <label className="flex items-center p-3 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-202 dark:border-zinc-800 rounded-lg cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors">
              <input 
                type="checkbox"
                checked={formData.enableNotification}
                onChange={(e) => setFormData(prev => ({ ...prev, enableNotification: e.target.checked }))}
                className="w-3.5 h-3.5 rounded border-zinc-300 text-[var(--primary)] focus:ring-[var(--primary)]" 
              />
              <div className="ml-2.5">
                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Notify System Operators</span>
                <p className="text-[9px] text-black dark:text-zinc-100 mt-0.5">Send a slack/email notification to devs upon feature toggle changes</p>
              </div>
            </label>

            {/* Rollout Percentage Slider */}
            <div className="space-y-2 p-3 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-202 dark:border-zinc-800 rounded-lg">
              <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100">
                <span>Rollout Percentage</span>
                <span className="text-[var(--primary)] font-black text-xs font-mono">{formData.rolloutPercentage}%</span>
              </div>
              <div className="flex items-center gap-3">
                <input 
                  type="range"
                  min="0"
                  max="100"
                  value={formData.rolloutPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, rolloutPercentage: parseInt(e.target.value) || 0 }))}
                  className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[var(--primary)]"
                />
              </div>
              <p className="text-[9px] text-black dark:text-zinc-100 leading-normal">
                Restricts access of this feature to a subset of clients for incremental rollouts (A/B testing).
              </p>
            </div>

            {/* Warning Info */}
            <div className="bg-zinc-50 dark:bg-zinc-800 rounded-lg p-2.5 flex gap-2 border border-zinc-200 dark:border-zinc-700">
              <Info className="text-[var(--primary)] shrink-0 mt-0.5" size={14} />
              <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 leading-relaxed">
                Toggling feature flags updates redis caches immediately. Client apps refresh configs in the background.
              </p>
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
            form="updateFeatureForm"
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            {isSaving ? 'Updating...' : 'Save Changes'}
          </button>
        </footer>
      </div>
    </div>
  );
}
