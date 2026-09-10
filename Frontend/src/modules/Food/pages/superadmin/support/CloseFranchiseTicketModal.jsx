import React, { useState } from 'react';
import { X, Archive, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function CloseFranchiseTicketModal({ isOpen, onClose, ticketNumber, onCloseSuccess }) {
  const [remarks, setRemarks] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [finalStatus, setFinalStatus] = useState('Resolved Successfully');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const finalStatuses = [
    'Resolved Successfully',
    'Abandoned / Inactive',
    'Archived (Duplicate / Invalid)'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!confirmed) {
      toast.error('Please confirm user consensus before closing');
      return;
    }

    setLoading(true);
    // Simulate PATCH /api/franchise-tickets/:id/close
    setTimeout(() => {
      setLoading(false);
      toast.success(`Ticket ${ticketNumber} marked as Closed`);
      if (onCloseSuccess) {
        onCloseSuccess(remarks, finalStatus);
      }
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm animate-in fade-in duration-250">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-250" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Archive className="w-5 h-5 text-zinc-500 dark:text-zinc-400" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Close Ticket</h2>
              <p className="text-[10px] text-zinc-500">Ticket: {ticketNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Final Resolution Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Archive Classification</label>
            <select
              value={finalStatus}
              onChange={(e) => setFinalStatus(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              {finalStatuses.map((st) => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>

          {/* Closing Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450 block">Closing Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Final log statement or archivist explanation..."
              rows="3"
              required
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Warning notice */}
          <div className="p-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-zinc-650 dark:text-zinc-400 leading-normal font-semibold">
              Warning: Closing this ticket is final. It removes the ticket from all active support queues and flags it as archived.
            </p>
          </div>

          {/* Consensus Confirmation checkbox */}
          <div className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="consensus_checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              required
              className="w-4 h-4 mt-0.5 accent-[var(--primary)] cursor-pointer"
            />
            <label htmlFor="consensus_checkbox" className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer select-none leading-snug">
              I verify that target franchise has agreed to this ticket closure and the solution is complete.
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-8 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-8 bg-zinc-600 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              {loading ? 'Closing...' : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  Close Ticket
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
