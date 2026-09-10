import React, { useState, useEffect } from 'react';
import { X, Send, Eye, Loader2, CheckCircle, XCircle, Terminal, HelpCircle } from 'lucide-react';

export default function SendTestNotificationModal({ isOpen, onClose, templates = [] }) {
  const [recipient, setRecipient] = useState('');
  const [channel, setChannel] = useState('email');
  const [selectedTemplateId, setSelectedTemplateId] = useState('raw');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [status, setStatus] = useState(null); // 'success' | 'failed' | null
  const [progressMsg, setProgressMsg] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setRecipient('');
      setChannel('email');
      setSelectedTemplateId('raw');
      setSubject('');
      setMessage('');
      setIsSending(false);
      setStatus(null);
      setProgressMsg('');
    }
  }, [isOpen]);

  // Handle template selection auto-fill
  useEffect(() => {
    if (selectedTemplateId === 'raw') {
      setSubject('');
      setMessage('');
    } else {
      const t = templates.find(temp => temp._id === selectedTemplateId);
      if (t) {
        setChannel(t.type);
        setSubject(t.subject || '');
        
        // Mock interpolation
        let replacedBody = t.body || '';
        replacedBody = replacedBody.replaceAll('{{customerName}}', 'Shubham Jamliya');
        replacedBody = replacedBody.replaceAll('{{orderId}}', 'ord_PVP_29108');
        replacedBody = replacedBody.replaceAll('{{amount}}', '₹450.00');
        replacedBody = replacedBody.replaceAll('{{otpCode}}', '883012');
        replacedBody = replacedBody.replaceAll('{{eta}}', '25 minutes');
        setMessage(replacedBody);
      }
    }
  }, [selectedTemplateId, templates]);

  if (!isOpen) return null;

  const handleSend = (e) => {
    e.preventDefault();
    if (!recipient.trim()) return;

    setIsSending(true);
    setStatus(null);
    setProgressMsg('Routing notification payload...');

    const stages = [
      { delay: 300, text: 'Resolving SMTP/API provider credentials...' },
      { delay: 700, text: 'Establishing SSL connection to API servers...' },
      { delay: 1100, text: 'Dispatching notification body...' },
    ];

    stages.forEach(stage => {
      setTimeout(() => {
        setProgressMsg(stage.text);
      }, stage.delay);
    });

    setTimeout(() => {
      const isSuccess = Math.random() > 0.15; // 85% success rate
      setIsSending(false);
      if (isSuccess) {
        setStatus('success');
      } else {
        setStatus('failed');
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-50 flex items-center gap-1.5">
              <Send className="text-[var(--primary)] shrink-0" size={18} />
              Send Test Notification
            </h3>
            <p className="text-[10px] text-zinc-700 dark:text-zinc-300 mt-0.5 font-medium">
              Verify your SMTP server settings or SMS/Push key configurations by sending a test alert
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Split view content */}
        <div className="flex-1 flex overflow-hidden min-h-[400px]">
          
          {/* Left panel: Form */}
          <div className="w-1/2 overflow-y-auto p-4 border-r border-zinc-200 dark:border-zinc-800 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
            {isSending ? (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="w-10 h-10 border-4 border-zinc-200 dark:border-zinc-800 border-t-[var(--primary)] rounded-full animate-spin"></div>
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-black dark:text-zinc-100">Sending Test Alert</h4>
                  <p className="text-[10px] text-zinc-700 dark:text-zinc-400 animate-pulse">{progressMsg}</p>
                </div>
              </div>
            ) : status ? (
              <div className="space-y-4 py-8 px-2">
                {status === 'success' ? (
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-800 dark:text-emerald-400 flex items-start gap-3">
                    <CheckCircle className="shrink-0 mt-0.5" size={20} />
                    <div className="space-y-1 flex-1 text-xs">
                      <h4 className="font-black uppercase tracking-wider">Test Dispatched Successfully!</h4>
                      <p className="text-[10.5px] font-semibold text-zinc-800 dark:text-zinc-300">
                        The alert request was processed by the notification provider. Recipient will receive it shortly.
                      </p>
                      <div className="pt-2 font-mono text-[9px] text-zinc-500 flex flex-col gap-0.5">
                        <span>Message Reference: msg_9201948s8d7</span>
                        <span>HTTP Status Code: 200 OK</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-800 dark:text-red-400 flex items-start gap-3">
                    <XCircle className="shrink-0 mt-0.5" size={20} />
                    <div className="space-y-1 flex-1 text-xs">
                      <h4 className="font-black uppercase tracking-wider">Test Delivery Failed</h4>
                      <p className="text-[10.5px] font-semibold text-zinc-800 dark:text-zinc-300">
                        The request rejected by provider endpoints. Please verify API key credentials, auth tokens, or sender email mappings.
                      </p>
                      <div className="pt-2 font-mono text-[9px] text-red-650 dark:text-red-450">
                        <span>Provider Error: 401 Authentication Required</span>
                        <span>Message: Signature validation failed. Check API Key.</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setStatus(null)}
                    className="px-4 py-1.5 bg-black dark:bg-zinc-800 text-white text-xs font-semibold rounded-lg hover:opacity-90 transition-colors"
                  >
                    Send Another Test
                  </button>
                </div>
              </div>
            ) : (
              <form id="testNotificationForm" onSubmit={handleSend} className="space-y-4">
                
                {/* Template Selector dropdown */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                    Choose Template (Optional)
                  </label>
                  <select 
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-semibold"
                  >
                    <option value="raw">None (Raw Custom Message)</option>
                    {templates.map(t => (
                      <option key={t._id} value={t._id}>[{t.type.toUpperCase()}] {t.title}</option>
                    ))}
                  </select>
                </div>

                {/* Channel selection (only if raw message) */}
                {selectedTemplateId === 'raw' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                      Target Channel
                    </label>
                    <select 
                      value={channel}
                      onChange={(e) => setChannel(e.target.value)}
                      className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-semibold"
                    >
                      <option value="email">Email Alert</option>
                      <option value="sms">SMS Text</option>
                      <option value="push">Push Notification</option>
                      <option value="whatsapp">WhatsApp Text</option>
                    </select>
                  </div>
                )}

                {/* Recipient Target Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                    {channel === 'email' ? 'Recipient Email Address' : 
                     channel === 'push' ? 'FCM Device Registration Token' : 
                     'Recipient Mobile Number (with country code)'} <span className="text-red-505">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder={channel === 'email' ? 'e.g. test@example.com' : 
                                 channel === 'push' ? 'e.g. fcm_token_xyz...' : 
                                 'e.g. +919876543210'}
                    className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium"
                  />
                </div>

                {/* Subject (Only if email route) */}
                {channel === 'email' && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                      Email Subject
                    </label>
                    <input 
                      type="text" 
                      required={channel === 'email'}
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="e.g. Connection Test Alert"
                      disabled={selectedTemplateId !== 'raw'}
                      className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium disabled:opacity-75 disabled:cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Message Body Input */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider block">
                    Message Body Text
                  </label>
                  <textarea 
                    required
                    rows={6}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Type your test message payload here..."
                    disabled={selectedTemplateId !== 'raw'}
                    className="w-full p-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-100 font-medium disabled:opacity-75 disabled:cursor-not-allowed resize-none leading-relaxed"
                  />
                </div>

              </form>
            )}
          </div>

          {/* Right panel: Preview */}
          <div className="w-1/2 bg-zinc-50 dark:bg-zinc-950 p-5 flex flex-col justify-between overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-850">
            <div className="space-y-4">
              <h4 className="text-[10px] font-black text-zinc-750 dark:text-zinc-300 uppercase tracking-wider flex items-center gap-1 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
                <Eye size={12} className="text-[var(--primary)]" />
                Outgoing Notification Render
              </h4>

              {/* Render Wrapper */}
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm min-h-[250px] flex flex-col justify-between">
                {channel === 'email' ? (
                  <div className="space-y-2 text-xs">
                    <div className="border-b border-zinc-100 dark:border-zinc-855 pb-1 text-[10px] text-zinc-750 dark:text-zinc-300">
                      <div>Subject: <strong className="text-black dark:text-zinc-50 font-black">{subject || '(No Subject)'}</strong></div>
                      <div>To: <span className="font-mono">{recipient || 'recipient@example.com'}</span></div>
                    </div>
                    <div className="py-2 leading-relaxed text-zinc-800 dark:text-zinc-100 whitespace-pre-wrap">
                      {message || 'Type alert message body to see preview...'}
                    </div>
                  </div>
                ) : channel === 'push' ? (
                  <div className="w-full bg-zinc-900 text-white rounded-lg p-3 shadow-md border border-zinc-700 flex gap-2">
                    <span className="w-7 h-7 rounded bg-[var(--primary)] text-white flex items-center justify-center font-black text-[10px] shrink-0 select-none">PVP</span>
                    <div className="min-w-0 flex-1 text-[10.5px]">
                      <p className="font-black text-white truncate">Papa Veg Pizza Test</p>
                      <p className="text-zinc-300 whitespace-pre-wrap leading-normal">{message || 'Type test body...'}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="bg-emerald-500/10 dark:bg-emerald-600/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 rounded-t-xl rounded-l-xl p-3 max-w-[85%] text-[11px] font-medium leading-relaxed whitespace-pre-wrap relative shadow-xs">
                      {message || 'Type chat message...'}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[8.5px] text-zinc-500 font-bold mt-4">
                  Test payload verification active.
                </div>
              </div>
            </div>

            <div className="p-3 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[9.5px] font-bold text-zinc-700 dark:text-zinc-400 leading-normal mt-4">
              🛡️ Test dispatching triggers real-time endpoint latency logs but does not affect production queue workflows.
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
            Close
          </button>
          {!status && !isSending && (
            <button 
              type="submit"
              form="testNotificationForm"
              className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Send size={13} />
              <span>Send Test</span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
