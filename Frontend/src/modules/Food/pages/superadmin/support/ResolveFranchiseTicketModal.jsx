import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResolveFranchiseTicketModal({ isOpen, onClose, ticketNumber, onResolveSuccess }) {
  const [category, setCategory] = useState('Issue Solved');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const resolutionCategories = [
    'Refund Issued',
    'Manual Database Fix',
    'Settlement Completed',
    'Inventory Updated / Synced',
    'Issue Solved',
    'Policy Explanation Provided'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resolutionNotes.trim()) {
      toast.error('Please enter resolution notes');
      return;
    }

    setLoading(true);
    // Simulate PATCH /api/franchise-tickets/:id/resolve
    setTimeout(() => {
      setLoading(false);
      toast.success(`Ticket ${ticketNumber} marked as Resolved`);
      if (onResolveSuccess) {
        onResolveSuccess(resolutionNotes, category, comments);
      }
      onClose();
    }, 1100);
  };

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm animate-in fade-in duration-250">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-250" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Resolve Support Ticket</h2>
              <p className="text-[10px] text-zinc-500">Ticket: {ticketNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Resolution Category */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Resolution Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              {resolutionCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Resolution Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450 block">Resolution Action Notes</label>
            <textarea
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              placeholder="Describe the solution applied or fix implemented..."
              rows="3"
              required
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Additional Comments */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450 block">Additional Comments (Visible to Franchise)</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="E.g., Please check your bank account or resync your store again..."
              rows="2"
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Notice */}
          <div className="p-2.5 rounded-lg border border-emerald-500/20 bg-emerald-500/5 text-[9px] text-zinc-650 dark:text-zinc-400 leading-normal font-medium">
            Note: Resolving this ticket changes its state to <strong>Resolved</strong>. The franchise owner and admins will receive an automated portal update.
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
              className="px-4 h-8 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md shadow-emerald-500/10 transition-all active:scale-95 flex items-center gap-1.5"
            >
              {loading ? 'Resolving...' : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark Resolved
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
