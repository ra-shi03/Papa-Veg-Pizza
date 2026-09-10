import React, { useState } from 'react';
import { X, Eye, EyeOff, Copy, Check, ShieldCheck, Play, Terminal, Database, Edit, Power, Radio, HelpCircle } from 'lucide-react';

export default function GatewayDetailsDrawer({ isOpen, onClose, gateway, onEdit, onTest, onToggleStatus }) {
  const [showSecret, setShowSecret] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  if (!isOpen || !gateway) return null;

  const webhookUrl = `https://api.papavegpizza.in/v1/payments/webhooks/${gateway.gatewayName.toLowerCase()}`;

  const copyText = (text, target) => {
    navigator.clipboard.writeText(text);
    if (target === 'webhook') {
      setCopiedWebhook(true);
      setTimeout(() => setCopiedWebhook(false), 2000);
    } else {
      setCopiedKey(true);
      setTimeout(() => setCopiedKey(false), 2000);
    }
  };

  // Mock transactions for this gateway
  const mockTransactions = [
    { id: "TXN_9201928", amount: 450.00, status: "Success", date: "2026-06-19 17:10" },
    { id: "TXN_9201912", amount: 180.00, status: "Failed", date: "2026-06-19 16:45" },
    { id: "TXN_9201889", amount: 320.00, status: "Success", date: "2026-06-19 15:30" }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-zinc-950/60 backdrop-blur-sm transition-all duration-350 p-0 animate-fade">
      {/* Backdrop overlay trigger */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose}></div>

      {/* Drawer Container */}
      <div className="relative bg-white dark:bg-zinc-900 w-full max-w-lg shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-[var(--primary)] text-white shrink-0">
                <ShieldCheck size={16} />
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-black dark:text-zinc-50 flex items-center gap-1.5">
                  {gateway.gatewayName} Details
                </h3>
                <p className="text-[10px] text-black dark:text-zinc-100 font-semibold uppercase tracking-wider">
                  Gateway ID: {gateway._id || 'N/A'}
                </p>
              </div>
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
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-700">
          
          {/* Status Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-850 rounded-xl space-y-1 text-black dark:text-zinc-100">
              <span className="text-[9px] font-black uppercase tracking-wider block">Environment</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border inline-block ${
                gateway.environment === 'Production' 
                  ? 'bg-purple-500/10 text-purple-600 border-purple-500/20' 
                  : 'bg-orange-500/10 text-orange-655 border-orange-500/25'
              }`}>
                {gateway.environment}
              </span>
            </div>

            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-850 rounded-xl space-y-1 text-black dark:text-zinc-100">
              <span className="text-[9px] font-black uppercase tracking-wider block">Status</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1.5 ${
                gateway.status === 'Active' 
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                  : 'bg-red-500/10 text-red-600 border-red-500/20'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${gateway.status === 'Active' ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                {gateway.status}
              </span>
            </div>
          </div>

          {/* Credentials Section */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1 flex items-center gap-1.5">
              <Database size={11} className="text-[var(--primary)]" />
              API Credentials & Keys
            </h4>
            
            <div className="space-y-2.5 text-xs text-black dark:text-zinc-100">
              {/* Merchant ID */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-black dark:text-zinc-100 block mb-0.5">Merchant ID</span>
                <div className="bg-zinc-100 dark:bg-zinc-800/60 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-[10.5px]">
                  {gateway.merchantId}
                </div>
              </div>

              {/* Key ID */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-black dark:text-zinc-100 block mb-0.5">Key ID</span>
                <div className="bg-zinc-100 dark:bg-zinc-800/60 p-2 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-[10.5px]">
                  {gateway.keyId}
                </div>
              </div>

              {/* Secret Key */}
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-black dark:text-zinc-100 block mb-0.5">Secret Key</span>
                <div className="relative">
                  <div className="bg-zinc-100 dark:bg-zinc-800/60 p-2 pr-16 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-[10.5px] truncate">
                    {showSecret ? gateway.secretKey : '••••••••••••••••••••••••••••'}
                  </div>
                  <div className="absolute right-1 top-1 flex items-center gap-1">
                    <button 
                      onClick={() => copyText(gateway.secretKey, 'key')}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-black dark:text-zinc-100"
                    >
                      {copiedKey ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                    </button>
                    <button 
                      onClick={() => setShowSecret(!showSecret)}
                      className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-black dark:text-zinc-100"
                    >
                      {showSecret ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Webhook Settings */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1 flex items-center gap-1.5">
              <Radio size={11} className="text-[var(--primary)]" />
              Webhook Callbacks
            </h4>
            
            <div className="space-y-2.5 text-xs text-black dark:text-zinc-100">
              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-black dark:text-zinc-100 block mb-0.5">Webhook URL</span>
                <div className="relative">
                  <div className="bg-zinc-100 dark:bg-zinc-800/60 p-2 pr-10 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-[10.5px] truncate select-all">
                    {webhookUrl}
                  </div>
                  <button 
                    onClick={() => copyText(webhookUrl, 'webhook')}
                    className="absolute right-1 top-1.5 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-black dark:text-zinc-100"
                  >
                    {copiedWebhook ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[9px] font-black uppercase tracking-wider text-black dark:text-zinc-100 block mb-0.5">Webhook Secret</span>
                <div className="relative">
                  <div className="bg-zinc-100 dark:bg-zinc-800/60 p-2 pr-10 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-[10.5px] truncate">
                    {showWebhookSecret ? gateway.webhookSecret || 'N/A' : '••••••••••••••••'}
                  </div>
                  {gateway.webhookSecret && (
                    <button 
                      onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                      className="absolute right-1 top-1.5 p-1 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded text-black dark:text-zinc-100"
                    >
                      {showWebhookSecret ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Recent transactions */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black text-black dark:text-zinc-100 uppercase tracking-wider border-b border-zinc-100 dark:border-zinc-800 pb-1 flex items-center gap-1.5">
              <Terminal size={11} className="text-[var(--primary)]" />
              Recent Gateway Activity
            </h4>
            
            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <table className="w-full text-[10px] text-left border-collapse">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8px] border-b border-zinc-200 dark:border-zinc-800">
                  <tr>
                    <th className="p-2">TXN ID</th>
                    <th className="p-2">Amount</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                  {mockTransactions.map((tx) => (
                    <tr key={tx.id} className="text-black dark:text-zinc-100">
                      <td className="p-2 font-mono">{tx.id}</td>
                      <td className="p-2 font-semibold">₹{tx.amount.toFixed(2)}</td>
                      <td className="p-2">
                        <span className={`px-1 py-0.2 rounded text-[8px] font-black uppercase ${
                          tx.status === 'Success' 
                            ? 'bg-emerald-500/10 text-emerald-650' 
                            : 'bg-red-500/10 text-red-650'
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="p-2 font-medium">{tx.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-3 gap-2 shrink-0">
          <button 
            onClick={() => onTest(gateway)}
            className="px-2 py-1.5 border border-zinc-350 dark:border-zinc-700 text-black dark:text-zinc-100 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Play size={12} className="text-[var(--primary)]" /> Test Connection
          </button>
          
          <button 
            onClick={() => onEdit(gateway)}
            className="px-2 py-1.5 border border-zinc-350 dark:border-zinc-700 text-black dark:text-zinc-100 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-1.5"
          >
            <Edit size={12} className="text-blue-500" /> Edit Credentials
          </button>

          <button 
            onClick={() => onToggleStatus(gateway)}
            className={`px-2 py-1.5 text-white text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              gateway.status === 'Active' 
                ? 'bg-red-600 hover:bg-red-700' 
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Power size={12} />
            <span>{gateway.status === 'Active' ? 'Disable' : 'Enable'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
