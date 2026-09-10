import React, { useState, useEffect } from 'react';
import { X, Eye, Copy, Check, Info } from 'lucide-react';

export default function PreviewTemplateModal({ isOpen, onClose, template }) {
  const [copied, setCopied] = useState(false);
  const [variablesState, setVariablesState] = useState({});

  useEffect(() => {
    if (template && isOpen) {
      // Initialize mock sample values for each variable tag
      const initialVars = {};
      const tags = template.variables || [];
      tags.forEach(tag => {
        if (tag === '{{customerName}}') initialVars[tag] = 'Shubham Jamliya';
        else if (tag === '{{orderId}}') initialVars[tag] = 'PVP-ORD-8820';
        else if (tag === '{{amount}}') initialVars[tag] = '₹450.00';
        else if (tag === '{{otpCode}}') initialVars[tag] = '883012';
        else if (tag === '{{eta}}') initialVars[tag] = '25 minutes';
        else initialVars[tag] = '[Custom Tag Value]';
      });
      setVariablesState(initialVars);
      setCopied(false);
    }
  }, [template, isOpen]);

  if (!isOpen || !template) return null;

  const handleVariableChange = (tag, val) => {
    setVariablesState(prev => ({
      ...prev,
      [tag]: val
    }));
  };

  const getRenderedPreviewBody = () => {
    let output = template.body || '';
    Object.keys(variablesState).forEach(tag => {
      output = output.replaceAll(tag, variablesState[tag]);
    });
    return output;
  };

  const handleCopyHtml = () => {
    const output = getRenderedPreviewBody();
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-5xl rounded-xl shadow-2xl flex flex-col h-[85vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-50 flex items-center gap-1.5">
              <Eye className="text-[var(--primary)] shrink-0" size={18} />
              Preview Template: {template.title}
            </h3>
            <p className="text-[10px] text-zinc-700 dark:text-zinc-300 mt-0.5 font-medium">
              Inspect variables substitution and layout appearance across transactional alerts
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content Split Pane */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Pane: Variables Editor */}
          <div className="w-1/2 overflow-y-auto p-4 border-r border-zinc-200 dark:border-zinc-800 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            <h4 className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-150 dark:border-zinc-800 pb-1.5">
              <Info size={12} className="text-blue-500" />
              Modify Test Variable Values
            </h4>
            
            {Object.keys(variablesState).length === 0 ? (
              <p className="text-xs text-zinc-500">No variable tags found in this template.</p>
            ) : (
              <div className="space-y-4">
                {Object.keys(variablesState).map(tag => (
                  <div key={tag} className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 block font-mono">
                      {tag}
                    </label>
                    <input 
                      type="text"
                      value={variablesState[tag]}
                      onChange={(e) => handleVariableChange(tag, e.target.value)}
                      className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Pane: Live View */}
          <div className="w-1/2 bg-zinc-50 dark:bg-zinc-950 p-5 flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                Layout Rendering Preview
              </h4>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[300px] flex flex-col justify-between">
                {template.type === 'email' ? (
                  <div className="space-y-2 text-xs">
                    <div className="border-b border-zinc-100 dark:border-zinc-800 pb-2 text-[10px] text-zinc-750 dark:text-zinc-300">
                      <div>Subject: <strong className="text-black dark:text-zinc-50 font-black">{template.subject ? template.subject.replaceAll('{{orderId}}', variablesState['{{orderId}}'] || 'ord_8820') : '(No Subject)'}</strong></div>
                      <div>From: <span>info@papavegpizza.in</span></div>
                    </div>
                    <div className="py-2 leading-relaxed text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap">
                      {getRenderedPreviewBody()}
                    </div>
                  </div>
                ) : template.type === 'push' ? (
                  <div className="w-full bg-zinc-900 text-white rounded-lg p-3 shadow-md border border-zinc-700 flex gap-2">
                    <span className="w-7 h-7 rounded bg-[var(--primary)] text-white flex items-center justify-center font-black text-[10px] shrink-0 select-none">PVP</span>
                    <div className="min-w-0 flex-1 text-[10.5px]">
                      <p className="font-black text-white truncate">{template.title || 'Papa Veg Pizza Notification'}</p>
                      <p className="text-zinc-300 whitespace-pre-wrap leading-normal">{getRenderedPreviewBody()}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-emerald-500/10 dark:bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-t-xl rounded-l-xl p-3 max-w-[85%] text-[11px] font-medium leading-relaxed whitespace-pre-wrap relative shadow-xs">
                      <p className="font-extrabold text-[9px] text-emerald-650 dark:text-emerald-400 uppercase tracking-wider mb-1">
                        {template.type === 'whatsapp' ? '🟢 Papa Veg WhatsApp' : '💬 Transactional SMS'}
                      </p>
                      {getRenderedPreviewBody()}
                      <span className="block text-[8px] opacity-75 text-right mt-1.5 font-bold">18:02</span>
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[8.5px] text-zinc-500 font-bold mt-4">
                  Variable mapping replaces tags in real time.
                </div>
              </div>
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
            Close Preview
          </button>
          <button 
            type="button"
            onClick={handleCopyHtml}
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span>{copied ? 'Copied!' : 'Copy Template Content'}</span>
          </button>
        </footer>
      </div>
    </div>
  );
}
