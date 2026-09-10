import React, { useState } from 'react';
import { X, Eye, EyeOff, Loader2, AlertCircle, Info, ShieldCheck } from 'lucide-react';

export default function AddGatewayModal({ isOpen, onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    gatewayName: 'Razorpay',
    merchantId: '',
    keyId: '',
    secretKey: '',
    webhookSecret: '',
    environment: 'Sandbox',
    status: 'Active',
    defaultGateway: false
  });

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.merchantId.trim()) {
      setError('Merchant ID is required.');
      return;
    }
    if (!formData.keyId.trim()) {
      setError('Key ID is required.');
      return;
    }
    if (!formData.secretKey.trim()) {
      setError('Secret Key is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    // Simulate API request (POST /api/payment-gateways)
    setTimeout(() => {
      setIsSaving(false);
      onSave(formData);
      onClose();
      // Reset form
      setFormData({
        gatewayName: 'Razorpay',
        merchantId: '',
        keyId: '',
        secretKey: '',
        webhookSecret: '',
        environment: 'Sandbox',
        status: 'Active',
        defaultGateway: false
      });
    }, 1500);
  };

  const webhookUrlPreview = `https://api.papavegpizza.in/v1/payments/webhooks/${formData.gatewayName.toLowerCase()}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm transition-all duration-350 p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-205 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-50 flex items-center gap-1.5">
              <ShieldCheck className="text-[var(--primary)] shrink-0" size={18} />
              Add Payment Gateway
            </h3>
            <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5 font-semibold">Integrate new secure payment provider parameters</p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-black hover:text-black dark:text-zinc-100 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-[11px] font-bold text-red-650 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="addGatewayForm" onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Gateway Name Dropdown */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Gateway Name
                </label>
                <select 
                  value={formData.gatewayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, gatewayName: e.target.value }))}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100 font-bold"
                >
                  <option value="Razorpay">Razorpay (India)</option>
                  <option value="PhonePe">PhonePe (India)</option>
                  <option value="Cashfree">Cashfree (India)</option>
                  <option value="Paytm">Paytm (India)</option>
                  <option value="Stripe">Stripe (Global)</option>
                  <option value="PayPal">PayPal (Global)</option>
                </select>
              </div>

              {/* Merchant ID */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Merchant ID <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.merchantId}
                  onChange={(e) => setFormData(prev => ({ ...prev, merchantId: e.target.value }))}
                  placeholder="e.g. mid_8840294"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100"
                />
              </div>

              {/* Key ID */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Key ID <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.keyId}
                  onChange={(e) => setFormData(prev => ({ ...prev, keyId: e.target.value }))}
                  placeholder="e.g. rzp_live_Key"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100"
                />
              </div>

              {/* Secret Key with visibility toggle */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Secret Key <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input 
                    type={showSecretKey ? 'text' : 'password'} 
                    required
                    value={formData.secretKey}
                    onChange={(e) => setFormData(prev => ({ ...prev, secretKey: e.target.value }))}
                    placeholder="••••••••••••••••"
                    className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 hover:text-zinc-850"
                  >
                    {showSecretKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Webhook Secret */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Webhook Secret Key
                </label>
                <div className="relative">
                  <input 
                    type={showWebhookSecret ? 'text' : 'password'} 
                    value={formData.webhookSecret}
                    onChange={(e) => setFormData(prev => ({ ...prev, webhookSecret: e.target.value }))}
                    placeholder="e.g. whsec_secret"
                    className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                    className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 hover:text-zinc-850"
                  >
                    {showWebhookSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Environment Radio Options */}
              <div className="space-y-2">
                <label className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider block">
                  Target Environment
                </label>
                <div className="flex gap-4 p-2 bg-zinc-550 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-black dark:text-zinc-100 font-bold">
                    <input 
                      type="radio" 
                      name="env"
                      checked={formData.environment === 'Sandbox'}
                      onChange={() => setFormData(prev => ({ ...prev, environment: 'Sandbox' }))}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span>Sandbox (Testing)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-black dark:text-zinc-100 font-bold">
                    <input 
                      type="radio" 
                      name="env"
                      checked={formData.environment === 'Production'}
                      onChange={() => setFormData(prev => ({ ...prev, environment: 'Production' }))}
                      className="text-[var(--primary)] focus:ring-[var(--primary)]"
                    />
                    <span>Production (Live)</span>
                  </label>
                </div>
              </div>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* Webhook Preview Alert */}
            <div className="bg-zinc-550 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-black dark:text-zinc-100">
              <span className="text-[10px] font-black uppercase tracking-wider block">Webhook URL Callback Preview</span>
              <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-800/80 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700 font-mono text-[10px] select-all">
                <span className="truncate">{webhookUrlPreview}</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-extrabold shrink-0 border border-emerald-500/25">Auto-generated</span>
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-zinc-550 border border-zinc-202 dark:border-zinc-800 rounded-lg">
                <div>
                  <p className="text-xs font-bold text-black dark:text-zinc-100">Gateway Status</p>
                  <p className="text-[9px] text-black dark:text-zinc-100 mt-0.5">Toggle this gateway module on checkout</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.status === 'Active'}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.checked ? 'Active' : 'Inactive' }))}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>

              <div className="flex items-center justify-between p-3 bg-zinc-550 border border-zinc-202 dark:border-zinc-800 rounded-lg">
                <div>
                  <p className="text-xs font-bold text-black dark:text-zinc-100">Set as Default Gateway</p>
                  <p className="text-[9px] text-black dark:text-zinc-100 mt-0.5">Use as primary card/UPI payment route</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.defaultGateway}
                    onChange={(e) => setFormData(prev => ({ ...prev, defaultGateway: e.target.checked }))}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                </label>
              </div>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-550 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-700 text-black dark:text-zinc-100 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="addGatewayForm"
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            {isSaving ? 'Saving Gateway...' : 'Save Gateway'}
          </button>
        </footer>
      </div>
    </div>
  );
}
