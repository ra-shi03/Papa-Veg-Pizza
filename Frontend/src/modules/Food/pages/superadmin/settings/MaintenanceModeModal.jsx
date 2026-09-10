import React, { useState } from 'react';
import { X, Loader2, AlertTriangle, Info } from 'lucide-react';

export default function MaintenanceModeModal({ isOpen, onClose, onConfirm }) {
  const [isActivating, setIsActivating] = useState(false);
  const [formData, setFormData] = useState({
    reason: "We are upgrading our databases to improve order processing times. We'll be back shortly!",
    startTime: new Date().toISOString().slice(0, 16),
    endTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString().slice(0, 16), // default +4 hours
    affectedModules: {
      Orders: true,
      Payments: true,
      Customers: true,
      Stores: false,
      Inventory: false,
      Marketing: false,
      Analytics: false,
      Notifications: false
    }
  });
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleModuleToggle = (moduleName) => {
    setFormData(prev => ({
      ...prev,
      affectedModules: {
        ...prev.affectedModules,
        [moduleName]: !prev.affectedModules[moduleName]
      }
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.reason.trim()) {
      setError('A reason for maintenance is required.');
      return;
    }

    const selectedModules = Object.keys(formData.affectedModules).filter(
      key => formData.affectedModules[key]
    );

    if (selectedModules.length === 0) {
      setError('Please select at least one affected module.');
      return;
    }

    setIsActivating(true);
    setError('');

    // Prepare payload
    const payload = {
      reason: formData.reason,
      startTime: formData.startTime,
      endTime: formData.endTime,
      affectedModules: selectedModules
    };

    // Simulate API request (PUT /api/system/settings/maintenance)
    setTimeout(() => {
      setIsActivating(false);
      onConfirm(payload);
      onClose();
    }, 1500);
  };

  const modulesList = ['Orders', 'Payments', 'Customers', 'Stores', 'Inventory', 'Marketing', 'Analytics', 'Notifications'];

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm transition-all duration-350 p-0 md:p-4">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-zinc-950 dark:text-zinc-50 flex items-center gap-1.5">
              <AlertTriangle className="text-amber-500 shrink-0" size={18} />
              Enable Platform Maintenance
            </h3>
            <p className="text-[10px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Configure scheduled or emergency offline mode for specific platform segments</p>
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
              <Info size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="maintenanceForm" onSubmit={handleSubmit} className="space-y-4">
            
            {/* Warning Card */}
            <div className="bg-amber-500/5 dark:bg-amber-950/10 border-2 border-dashed border-amber-500/20 rounded-xl p-3.5 flex gap-3 text-zinc-800 dark:text-zinc-200">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-black text-amber-800 dark:text-amber-400">Confirmation Warning</h4>
                <p className="text-[10px] leading-relaxed text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-1">
                  Enabling maintenance mode will display an offline/maintenance banner or block access to customers and store staff for selected modules. Active database processes will complete, but new requests will be blocked.
                </p>
              </div>
            </div>

            {/* Maintenance Reason */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                Reason for Maintenance
              </label>
              <textarea 
                required 
                rows="3"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Brief message to display to users..."
                className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none resize-none text-zinc-900 dark:text-zinc-150"
              ></textarea>
            </div>

            {/* Time Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Start Date & Time
                </label>
                <input 
                  type="datetime-local" 
                  required
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-150"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Estimated End Date & Time
                </label>
                <input 
                  type="datetime-local" 
                  required
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] focus:border-[var(--primary)] transition-all outline-none text-zinc-900 dark:text-zinc-150"
                />
              </div>
            </div>

            {/* Affected Modules Group */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">
                Affected Modules / Channels
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {modulesList.map((mod) => (
                  <label 
                    key={mod}
                    className={`flex items-center p-2 rounded-lg border cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-all ${
                      formData.affectedModules[mod] 
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-[var(--primary)] font-bold' 
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <input 
                      type="checkbox" 
                      checked={formData.affectedModules[mod]}
                      onChange={() => handleModuleToggle(mod)}
                      className="sr-only"
                    />
                    <span className="text-xs">{mod}</span>
                  </label>
                ))}
              </div>
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
            form="maintenanceForm"
            disabled={isActivating}
            className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {isActivating && <Loader2 size={13} className="animate-spin" />}
            {isActivating ? 'Activating Mode...' : 'Enable Maintenance'}
          </button>
        </footer>
      </div>
    </div>
  );
}
