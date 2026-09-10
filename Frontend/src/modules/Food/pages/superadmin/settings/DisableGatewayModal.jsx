import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, ShieldAlert, Loader2 } from 'lucide-react';

export default function DisableGatewayModal({ isOpen, onClose, gateway, onConfirm }) {
  const [confirmText, setConfirmText] = useState('');
  const [checkedImpact, setCheckedImpact] = useState(false);
  const [checkedFallback, setCheckedFallback] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setConfirmText('');
      setCheckedImpact(false);
      setCheckedFallback(false);
      setIsDisabling(false);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !gateway) return null;

  const handleDisable = (e) => {
    e.preventDefault();
    if (!checkedImpact || !checkedFallback) {
      setError('You must read and approve the impact statements.');
      return;
    }
    if (confirmText.toUpperCase() !== gateway.gatewayName.toUpperCase()) {
      setError(`Please type "${gateway.gatewayName.toUpperCase()}" to confirm.`);
      return;
    }

    setIsDisabling(true);
    setError('');

    // Simulate API update (PATCH /api/payment-gateways/:id/status)
    setTimeout(() => {
      setIsDisabling(false);
      onConfirm(gateway._id);
      onClose();
    }, 1200);
  };

  const isFormValid = checkedImpact && checkedFallback && confirmText.toUpperCase() === gateway.gatewayName.toUpperCase();

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-red-500 shrink-0" size={20} />
            <div>
              <h3 className="text-sm font-extrabold text-black dark:text-zinc-50">
                Disable Payment Gateway?
              </h3>
              <p className="text-[10px] text-black dark:text-zinc-100 font-semibold">
                This action impacts customer checkout routes in real-time.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-black hover:text-black dark:text-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="p-4 space-y-4">
          
          {/* Warning Banner */}
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2.5 text-[11px] font-bold text-red-650 dark:text-red-400">
            <AlertTriangle className="shrink-0 mt-0.5" size={16} />
            <div className="space-y-1">
              <span>You are disabling <strong>{gateway.gatewayName}</strong> ({gateway.environment}).</span>
              {gateway.defaultGateway && (
                <p className="text-red-750 dark:text-red-300 text-[10px] font-black uppercase mt-1">
                  ⚠️ WARNING: This is currently configured as the DEFAULT payment gateway! Disabling it will prevent customers from completing transactions unless another gateway is set as default.
                </p>
              )}
            </div>
          </div>

          {error && (
            <div className="p-2.5 bg-red-500/10 border border-red-500/20 rounded text-[10px] font-bold text-red-650 dark:text-red-400">
              {error}
            </div>
          )}

          {/* Checklist */}
          <form id="disableGatewayForm" onSubmit={handleDisable} className="space-y-4">
            <div className="space-y-2.5">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={checkedImpact}
                  onChange={(e) => setCheckedImpact(e.target.checked)}
                  className="mt-0.5 text-red-500 focus:ring-red-500 rounded"
                />
                <span className="text-[10.5px] font-bold text-black dark:text-zinc-100 leading-normal">
                  I understand that customer checkout options for UPI/Cards routed through {gateway.gatewayName} will be disabled immediately.
                </span>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input 
                  type="checkbox"
                  checked={checkedFallback}
                  onChange={(e) => setCheckedFallback(e.target.checked)}
                  className="mt-0.5 text-red-500 focus:ring-red-500 rounded"
                />
                <span className="text-[10.5px] font-bold text-black dark:text-zinc-100 leading-normal">
                  I have verified that a fallback payment system is active or cash on delivery is enabled to avoid order conversion drops.
                </span>
              </label>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* Confirm Type Input */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider block">
                Type <span className="font-extrabold text-red-500">"{gateway.gatewayName.toUpperCase()}"</span> to confirm
              </label>
              <input 
                type="text"
                required
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={gateway.gatewayName.toUpperCase()}
                className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-red-500 outline-none text-black dark:text-zinc-100 font-bold"
              />
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-100 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="disableGatewayForm"
            disabled={isDisabling || !isFormValid}
            className={`px-4 py-1.5 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-sm ${
              isFormValid 
                ? 'bg-red-650 hover:bg-red-700 active:scale-95' 
                : 'bg-zinc-300 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
            }`}
          >
            {isDisabling && <Loader2 size={13} className="animate-spin" />}
            {isDisabling ? 'Disabling...' : 'Yes, Disable Gateway'}
          </button>
        </footer>
      </div>
    </div>
  );
}
