import React, { useState, useEffect } from 'react';
import { X, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ChangePriorityModal({ isOpen, onClose, onChangePriority, request }) {
  const [priority, setPriority] = useState('Medium');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request) {
      setPriority(request.priority || 'Medium');
      setReason('');
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Please specify a reason for changing priority');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const updatedRequest = {
        ...request,
        priority: priority,
        updatedAt: new Date().toISOString()
      };

      toast.success(`Priority updated to ${priority}`);
      if (onChangePriority) {
        onChangePriority(updatedRequest, {
          oldPriority: request.priority,
          newPriority: priority,
          reason,
          timestamp: new Date().toISOString()
        });
      }
      onClose();
    }, 1000);
  };

  return (
    <div 
      className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Change Severity Priority</h2>
              <p className="text-[10px] text-zinc-500 font-semibold">Update priority level for request {request.requestNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Priority Options */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-450 block">Select New Priority Level</label>
            <div className="grid grid-cols-4 gap-2">
              {['Low', 'Medium', 'High', 'Critical'].map(p => {
                const colors = {
                  Low: 'border-blue-200 text-blue-600 bg-blue-50/20 dark:border-blue-900/40 dark:text-blue-400 hover:bg-blue-500/5',
                  Medium: 'border-zinc-200 text-zinc-600 bg-zinc-50/20 dark:border-zinc-800 dark:text-zinc-400 hover:bg-zinc-500/5',
                  High: 'border-orange-200 text-orange-600 bg-orange-50/20 dark:border-orange-900/40 dark:text-orange-400 hover:bg-orange-500/5',
                  Critical: 'border-red-200 text-red-600 bg-red-50/20 dark:border-red-900/40 dark:text-red-400 hover:bg-red-500/5'
                };

                const activeColors = {
                  Low: 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500',
                  Medium: 'border-zinc-500 bg-zinc-500/10 text-zinc-700 dark:text-zinc-300 ring-1 ring-zinc-500',
                  High: 'border-orange-500 bg-orange-500/10 text-orange-600 dark:text-orange-450 ring-1 ring-orange-500',
                  Critical: 'border-red-500 bg-red-500/10 text-red-650 dark:text-red-400 ring-1 ring-red-500'
                };

                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-lg border text-[10px] font-extrabold uppercase transition-all active:scale-95 flex items-center justify-center ${
                      priority === p ? activeColors[p] : colors[p]
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Change Reason */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">
              Reason for Change <span className="text-red-500">*</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows="3"
              placeholder="State why this priority needs to be modified..."
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 h-9 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              {loading ? 'Updating...' : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
