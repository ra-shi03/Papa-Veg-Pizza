import React, { useState, useEffect, useRef } from 'react';
import { X, ShieldAlert, Sparkles, Mail, MessageSquare, Bell, Phone, Eye, ArrowRight, Loader2, Check } from 'lucide-react';

const MOCK_VARIABLES = [
  { name: '{{customerName}}', sample: 'Shubham Jamliya' },
  { name: '{{orderId}}', sample: 'ord_PVP_8820' },
  { name: '{{amount}}', sample: '₹450.00' },
  { name: '{{otpCode}}', sample: '883012' },
  { name: '{{eta}}', sample: '25 minutes' }
];

export default function CreateTemplateModal({ isOpen, onClose, onSave }) {
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const bodyRef = useRef(null);

  const [formData, setFormData] = useState({
    type: 'email',
    event: 'Order Placed',
    title: '',
    subject: '',
    body: '',
    variables: ['{{customerName}}', '{{orderId}}', '{{amount}}'],
    active: true
  });

  useEffect(() => {
    if (!isOpen) {
      setFormData({
        type: 'email',
        event: 'Order Placed',
        title: '',
        subject: '',
        body: '',
        variables: ['{{customerName}}', '{{orderId}}', '{{amount}}'],
        active: true
      });
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setError('Template Title is required.');
      return;
    }
    if (formData.type === 'email' && !formData.subject.trim()) {
      setError('Subject is required for Email templates.');
      return;
    }
    if (!formData.body.trim()) {
      setError('Template Body is required.');
      return;
    }

    setIsSaving(true);
    setError('');

    // Simulate API request (POST /api/notification/template)
    setTimeout(() => {
      setIsSaving(false);
      onSave(formData);
      onClose();
    }, 1200);
  };

  const handleInsertVariable = (variableName) => {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.body;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);

    setFormData(prev => ({
      ...prev,
      body: before + variableName + after
    }));

    // Focus back and set selection cursor
    setTimeout(() => {
      textarea.focus();
      const newCursor = start + variableName.length;
      textarea.setSelectionRange(newCursor, newCursor);
    }, 50);

    // Add to variables list if not already present
    if (!formData.variables.includes(variableName)) {
      setFormData(prev => ({
        ...prev,
        variables: [...prev.variables, variableName]
      }));
    }
  };

  // Render Live Preview text replacing variables with mock sample values
  const getRenderedPreview = () => {
    let preview = formData.body || 'Type template body to see real-time preview...';
    MOCK_VARIABLES.forEach(v => {
      preview = preview.replaceAll(v.name, v.sample);
    });
    return preview;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-50 flex items-center gap-1.5">
              <Sparkles className="text-[var(--primary)] shrink-0" size={18} />
              Create Notification Template
            </h3>
            <p className="text-[10px] text-zinc-700 dark:text-zinc-300 mt-0.5 font-medium">
              Design templates with variable tags for transactional customer messaging
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content Split Panel */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Inputs Form */}
          <form id="createTemplateForm" onSubmit={handleSave} className="w-1/2 overflow-y-auto p-4 border-r border-zinc-200 dark:border-zinc-800 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-[11px] font-bold text-red-600 dark:text-red-400">
                <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Type & Event selector */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                  Channel Route
                </label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value, subject: e.target.value === 'email' ? '' : prev.subject }))}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-semibold"
                >
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                  <option value="push">Push Notification</option>
                  <option value="whatsapp">WhatsApp</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                  Event Event Trigger
                </label>
                <select 
                  value={formData.event}
                  onChange={(e) => setFormData(prev => ({ ...prev, event: e.target.value }))}
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-semibold"
                >
                  <option value="Order Placed">Order Placed</option>
                  <option value="Order Out for Delivery">Order Out for Delivery</option>
                  <option value="OTP Verification">OTP Verification</option>
                  <option value="Refund Processed">Refund Processed</option>
                  <option value="Campaign Promo">Campaign Promo</option>
                </select>
              </div>
            </div>

            {/* Template Title */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                Template Name / Title <span className="text-red-500">*</span>
              </label>
              <input 
                type="text" 
                required
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Customer Welcome Alert"
                className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium"
              />
            </div>

            {/* Email Subject (conditional) */}
            {formData.type === 'email' && (
              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                  Email Subject Line <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="e.g. Your delicious order is confirmed! {{orderId}}"
                  className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium"
                />
              </div>
            )}

            {/* Variable tags chips helper */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                Click tags to insert into template body
              </label>
              <div className="flex flex-wrap gap-1.5">
                {MOCK_VARIABLES.map(v => (
                  <button 
                    key={v.name}
                    type="button"
                    onClick={() => handleInsertVariable(v.name)}
                    className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-[var(--primary)] text-zinc-800 dark:text-zinc-200 text-[10px] font-bold transition-all"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Body text area */}
            <div className="space-y-1">
              <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                Template Message Body <span className="text-red-500">*</span>
              </label>
              <textarea 
                ref={bodyRef}
                required
                rows={10}
                value={formData.body}
                onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                placeholder="Hello {{customerName}},\n\nYour order {{orderId}} of {{amount}} is placed successfully! Our kitchen is preparing it.\n\nEnjoy!"
                className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium leading-relaxed resize-none font-mono"
              />
            </div>

            {/* Active Toggle */}
            <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-200 dark:border-zinc-800 rounded-lg">
              <div>
                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">Status Trigger</p>
                <p className="text-[9px] text-zinc-700 dark:text-zinc-300 mt-0.5">Toggle this notification template availability</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={formData.active}
                  onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                  className="sr-only peer" 
                />
                <div className="w-8 h-4.5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full"></div>
              </label>
            </div>
          </form>

          {/* Right Panel: Live Rendered Preview */}
          <div className="w-1/2 bg-zinc-50 dark:bg-zinc-950 p-5 flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                <Eye size={12} className="text-[var(--primary)]" />
                Live Customer Screen Preview
              </h4>

              {/* Render Wrapper */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between min-h-[300px]">
                {formData.type === 'email' ? (
                  /* Email Envelope Wrapper */
                  <div className="space-y-3 flex-1 flex flex-col">
                    <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2 text-[10.5px] font-bold text-zinc-700 dark:text-zinc-300 space-y-1">
                      <div><span className="opacity-75 font-semibold">Subject:</span> <span className="text-black dark:text-zinc-50 font-black">{formData.subject.replaceAll('{{orderId}}', 'ord_PVP_8820')}</span></div>
                      <div><span className="opacity-75 font-semibold">From:</span> info@papavegpizza.in</div>
                      <div><span className="opacity-75 font-semibold">To:</span> customer@example.com</div>
                    </div>
                    
                    {/* Rendered HTML mock box */}
                    <div className="flex-1 py-4 text-xs font-semibold text-zinc-800 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                      {getRenderedPreview()}
                    </div>
                  </div>
                ) : formData.type === 'push' ? (
                  /* Push Alert Overlay */
                  <div className="space-y-2 flex-1 flex flex-col items-center justify-start pt-6">
                    <div className="w-full max-w-sm bg-zinc-900 text-white rounded-lg p-3 shadow-lg border border-zinc-700 flex gap-3 relative">
                      <span className="w-8 h-8 rounded-lg bg-[var(--primary)] text-white flex items-center justify-center font-black text-xs shrink-0 select-none">
                        PVP
                      </span>
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <p className="text-[11.5px] font-black leading-tight text-white truncate">{formData.title || 'Papa Veg Pizza Notification'}</p>
                        <p className="text-[10px] text-zinc-300 leading-normal whitespace-pre-wrap">{getRenderedPreview()}</p>
                      </div>
                      <span className="text-[8px] text-zinc-400 absolute right-2 top-2">now</span>
                    </div>
                  </div>
                ) : (
                  /* SMS / WhatsApp Chat bubble */
                  <div className="space-y-3 flex-1 flex flex-col justify-end">
                    <div className="flex justify-end">
                      <div className="bg-emerald-500/10 dark:bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-t-xl rounded-l-xl p-3 max-w-[80%] text-[11px] font-medium leading-relaxed whitespace-pre-wrap relative shadow-xs">
                        <p className="font-extrabold text-[9px] text-emerald-600 dark:text-emerald-400 uppercase tracking-wider mb-1">
                          {formData.type === 'whatsapp' ? '🟢 Papa Veg WhatsApp' : '💬 Transactional SMS'}
                        </p>
                        {getRenderedPreview()}
                        <span className="block text-[8px] opacity-75 text-right mt-1.5 font-bold">17:59</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer disclaimer */}
                <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 mt-4 flex items-center justify-between text-[9px] text-zinc-500 font-bold">
                  <span>Variables replacements active.</span>
                  <span>Responsive template viewport.</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[9.5px] font-bold text-zinc-700 dark:text-zinc-400 leading-normal mt-4">
              📝 Variables like <code className="font-mono bg-zinc-200 dark:bg-zinc-800 px-0.5 rounded text-[8.5px] text-black dark:text-zinc-100">{"{{customerName}}"}</code> will fetch parameters dynamically from order/transaction databases in production execution.
            </div>
          </div>

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
            form="createTemplateForm"
            disabled={isSaving}
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {isSaving && <Loader2 size={13} className="animate-spin" />}
            {isSaving ? 'Creating Template...' : 'Create Template'}
          </button>
        </footer>
      </div>
    </div>
  );
}
