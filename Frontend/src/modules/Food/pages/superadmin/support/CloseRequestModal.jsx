import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function CloseRequestModal({ isOpen, onClose, onCloseRequest, request }) {
  const [closingRemarks, setClosingRemarks] = useState('');
  const [consensusConfirmed, setConsensusConfirmed] = useState(false);
  const [archiveRequest, setArchiveRequest] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request) {
      setClosingRemarks('');
      setConsensusConfirmed(false);
      setArchiveRequest(true);
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!consensusConfirmed) {
      toast.error('Please confirm that consensus has been reached to close this ticket');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const updatedRequest = {
        ...request,
        status: 'Closed',
        closedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      toast.success(`Request ${request.requestNumber} closed and archived`);
      if (onCloseRequest) {
        onCloseRequest(updatedRequest, {
          closingRemarks,
          consensusConfirmed,
          archiveRequest,
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
            <Lock className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Close Support Request</h2>
              <p className="text-[10px] text-zinc-500 font-semibold">Permanently close and lock request {request.requestNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Closing Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">Closing Summary / Remarks</label>
            <textarea
              value={closingRemarks}
              onChange={(e) => setClosingRemarks(e.target.value)}
              rows="3"
              placeholder="Provide final closure remarks or feedback notes..."
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Consensus Confirmation Checkbox */}
          <div className="space-y-3 pt-2">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consensusConfirmed}
                onChange={(e) => setConsensusConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 border border-zinc-300 dark:border-zinc-700 rounded text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-1 transition-all"
              />
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block leading-tight">Consensus Confirmation</span>
                <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">I confirm that both the requester and support team agree this request is fully addressed and solved.</span>
              </div>
            </label>

            {/* Archive Option Checkbox */}
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={archiveRequest}
                onChange={(e) => setArchiveRequest(e.target.checked)}
                className="mt-0.5 w-4 h-4 border border-zinc-300 dark:border-zinc-700 rounded text-[var(--primary)] focus:ring-[var(--primary)] focus:ring-1 transition-all"
              />
              <div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 block leading-tight">Archive Request</span>
                <span className="text-[10px] text-zinc-500 block leading-tight mt-0.5">Archive this ticket to historical support logs. It will be hidden from default dashboards but searchable in history.</span>
              </div>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-9 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-455 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 h-9 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-lg text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              {loading ? 'Closing...' : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Close Request
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
