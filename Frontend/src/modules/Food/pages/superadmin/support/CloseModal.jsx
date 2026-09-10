import React, { useState } from 'react';
import { X, Archive, CheckSquare, Square } from 'lucide-react';
import { toast } from 'sonner';

export default function CloseModal({ isOpen, onClose, complaintId, onCloseSuccess }) {
  const [remarks, setRemarks] = useState('');
  const [finalStatus, setFinalStatus] = useState('Closed - Resolved Successfully');
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!confirmed) {
      toast.error('Please confirm customer agreement before closing');
      return;
    }

    setLoading(true);
    // Simulate PATCH /api/customer-complaints/:id/close
    setTimeout(() => {
      setLoading(false);
      toast.success('Complaint ticket closed and archived');
      if (onCloseSuccess) {
        onCloseSuccess(remarks, finalStatus);
      }
      onClose();
    }, 1000);
  };

  const statusOptions = [
    'Closed - Resolved Successfully',
    'Closed - Apologized & Compensation coupon claimed',
    'Closed - Settlement Completed',
    'Closed - Unresponsive Customer (Auto-closed)',
    'Closed - Declined / Invalid Complaint'
  ];

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm animate-in fade-in duration-250">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-250" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Close Complaint</h2>
            <p className="text-[10px] text-zinc-500">Complaint ID: {complaintId}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Final Closure Status */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Closure Classification</label>
            <select
              value={finalStatus}
              onChange={(e) => setFinalStatus(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              {statusOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Closing Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Final Closing Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Provide a final summary of customer interaction and resolution feedback..."
              rows="3"
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
          </div>

          {/* Customer Confirmation Checkbox */}
          <div
            onClick={() => setConfirmed(!confirmed)}
            className="flex items-start gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30 cursor-pointer select-none"
          >
            <div className="text-[var(--primary)] shrink-0 mt-0.5">
              {confirmed ? <CheckSquare className="w-4.5 h-4.5" /> : <Square className="w-4.5 h-4.5" />}
            </div>
            <div>
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Customer Confirmation Received</p>
              <p className="text-[9px] text-zinc-550 dark:text-zinc-400 mt-0.5 leading-normal">
                I verify that the customer has been contacted, their grievances have been answered, and they agreed to ticket closure.
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-8 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-455 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-8 bg-zinc-600 hover:bg-zinc-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading ? 'Closing...' : (
                <>
                  <Archive className="w-3.5 h-3.5" />
                  Close Complaint
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
