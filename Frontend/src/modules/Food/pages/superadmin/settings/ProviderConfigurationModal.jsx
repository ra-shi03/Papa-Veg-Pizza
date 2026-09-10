import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function ProviderConfigurationModal({ isOpen, onClose, provider, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    providerType: 'sms',
    providerName: 'Twilio',
    apiKey: '',
    secret: '',
    status: 'Active'
  });

  useEffect(() => {
    if (provider && isOpen) {
      setFormData({
        _id: provider._id,
        providerType: provider.providerType || 'sms',
        providerName: provider.providerName || 'Twilio',
        apiKey: provider.apiKey || '',
        secret: provider.secret || '',
        status: provider.status || 'Active'
      });
      setError('');
    } else if (isOpen) {
      setFormData({
        providerType: 'sms',
        providerName: 'Twilio',
        apiKey: '',
        secret: '',
        status: 'Active'
      });
      setError('');
    }
  }, [provider, isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.apiKey.trim()) {
      setError('API Key or Host configuration is required.');
      return;
    }
    if (!formData.secret.trim()) {
      setError('Secret Key or Password parameter is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    // Simulate API request (POST or PUT /api/notification/provider)
    setTimeout(() => {
      setIsSaving(false);
      onSave(formData);
      onClose();
    }, 1200);
  };

  const webhookUrlPreview = `https://api.papavegpizza.in/v1/notifications/webhooks/${formData.providerName.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-50 flex items-center gap-1.5">
              <ShieldCheck className="text-[var(--primary)] shrink-0" size={18} />
              {provider ? `Configure Provider: ${formData.providerName}` : 'Add Notification Provider'}
            </h3>
            <p className="text-[10px] text-zinc-700 dark:text-zinc-300 mt-0.5 font-medium">
              Setup API access parameters, webhook paths, and availability routes
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-[11px] font-bold text-red-650 dark:text-red-400">
              <AlertCircle size={14} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form id="providerConfigForm" onSubmit={handleSave} className="space-y-4">
            
            {/* Provider Type & Name selection (If not editing) */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                  Provider Type
                </label>
                {provider ? (
                  <input 
                    type="text" 
                    readOnly
                    value={formData.providerType.toUpperCase()}
                    className="w-full h-8.5 px-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-800/40 text-xs text-zinc-500 font-bold cursor-not-allowed outline-none"
                  />
                ) : (
                  <select 
                    value={formData.providerType}
                    onChange={(e) => {
                      const type = e.target.value;
                      let defaultName = 'Twilio';
                      if (type === 'email') defaultName = 'SendGrid';
                      if (type === 'push') defaultName = 'Firebase';
                      if (type === 'whatsapp') defaultName = 'Meta Cloud API';
                      setFormData(prev => ({ ...prev, providerType: type, providerName: defaultName }));
                    }}
                    className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-semibold"
                  >
                    <option value="email">Email Route</option>
                    <option value="sms">SMS Route</option>
                    <option value="push">Push Route</option>
                    <option value="whatsapp">WhatsApp Route</option>
                  </select>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                  Provider Name
                </label>
                {provider ? (
                  <input 
                    type="text" 
                    readOnly
                    value={formData.providerName}
                    className="w-full h-8.5 px-3 border border-zinc-200 dark:border-zinc-700 rounded-lg bg-zinc-100 dark:bg-zinc-800/40 text-xs text-zinc-500 font-bold cursor-not-allowed outline-none"
                  />
                ) : (
                  <select 
                    value={formData.providerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, providerName: e.target.value }))}
                    className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-semibold"
                  >
                    {formData.providerType === 'email' && (
                      <>
                        <option value="SendGrid">SendGrid</option>
                        <option value="Amazon SES">Amazon SES</option>
                        <option value="Mailgun">Mailgun</option>
                      </>
                    )}
                    {formData.providerType === 'sms' && (
                      <>
                        <option value="Twilio">Twilio</option>
                        <option value="MSG91">MSG91</option>
                        <option value="Fast2SMS">Fast2SMS</option>
                      </>
                    )}
                    {formData.providerType === 'push' && (
                      <>
                        <option value="Firebase">Firebase Cloud Message</option>
                        <option value="OneSignal">OneSignal</option>
                      </>
                    )}
                    {formData.providerType === 'whatsapp' && (
                      <>
                        <option value="Meta Cloud API">Meta Cloud API</option>
                        <option value="Gupshup">Gupshup</option>
                      </>
                    )}
                  </select>
                )}
              </div>
            </div>

            {/* API Key / Account SID */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                {formData.providerType === 'email' && formData.providerName !== 'Amazon SES' ? 'API Key / Secret Token' : 
                 formData.providerName === 'Twilio' ? 'Account SID' : 'Access Key / Host'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showKey ? 'text' : 'password'}
                  required
                  value={formData.apiKey}
                  onChange={(e) => setFormData(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder={formData.providerName === 'Twilio' ? 'ACxxxxxxxxxxxxxxxxxxxxxxxx' : 'API Key or Access identifier'}
                  className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50"
                >
                  {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Secret Token / Auth Token */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                {formData.providerName === 'Twilio' ? 'Auth Token' : 'Secret Key / Password'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input 
                  type={showSecret ? 'text' : 'password'}
                  required
                  value={formData.secret}
                  onChange={(e) => setFormData(prev => ({ ...prev, secret: e.target.value }))}
                  placeholder="••••••••••••••••••••••••••••"
                  className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="absolute inset-y-0 right-3 flex items-center text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50"
                >
                  {showSecret ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />

            {/* Webhook Preview Alert */}
            <div className="bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-750 dark:text-zinc-300">
              <span className="text-[10px] font-black uppercase tracking-wider block">Status Callback Webhook Endpoint</span>
              <div className="flex items-center justify-between gap-2 bg-white dark:bg-zinc-800/80 p-2 rounded-lg border border-zinc-100 dark:border-zinc-700 font-mono text-[10px] select-all text-zinc-850 dark:text-zinc-100">
                <span className="truncate">{webhookUrlPreview}</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 rounded text-[9px] font-extrabold shrink-0 border border-emerald-500/25">Auto-generated</span>
              </div>
            </div>

            {/* Status Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-205 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Status Trigger</p>
                <p className="text-[9px] text-zinc-700 dark:text-zinc-300 mt-0.5">Toggle this provider route active status</p>
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

          </form>
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-750 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="providerConfigForm"
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            {isSaving ? 'Saving Route...' : 'Save Configuration'}
          </button>
        </footer>
      </div>
    </div>
  );
}
