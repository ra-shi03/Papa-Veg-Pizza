import React, { useState, useEffect } from 'react';
import { X, TrendingUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EscalateRequestModal({ isOpen, onClose, onEscalate, request }) {
  const [tier, setTier] = useState('Tier 1');
  const [targetDept, setTargetDept] = useState('Technical Operations');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (request) {
      setTier('Tier 1');
      setTargetDept('Technical Operations');
      setRemarks('');
    }
  }, [request, isOpen]);

  if (!isOpen || !request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!remarks.trim()) {
      toast.error('Please provide escalation details/remarks');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const updatedRequest = {
        ...request,
        status: 'Escalated',
        updatedAt: new Date().toISOString()
      };

      toast.success(`Request escalated to ${tier} - ${targetDept}`);
      if (onEscalate) {
        onEscalate(updatedRequest, {
          tier,
          targetDept,
          remarks,
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
            <TrendingUp className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Escalate Support Request</h2>
              <p className="text-[10px] text-zinc-500 font-semibold">Flag request {request.requestNumber} for higher tier operator response</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Escalation Tier */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-450 block">Select Escalation Level</label>
            <select
              value={tier}
              onChange={(e) => setTier(e.target.value)}
              required
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              <option value="Tier 1">Tier 1 (Senior Desk Analyst)</option>
              <option value="Tier 2">Tier 2 (Department Lead)</option>
              <option value="Tier 3">Tier 3 (Super Admin Escalation)</option>
            </select>
          </div>

          {/* Target Department */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">Target Escalation Department</label>
            <select
              value={targetDept}
              onChange={(e) => setTargetDept(e.target.value)}
              required
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              <option value="Technical Operations">Technical Operations</option>
              <option value="Corporate HR">Corporate HR</option>
              <option value="Kitchen Management">Kitchen Management</option>
              <option value="Delivery Operations">Delivery Operations</option>
              <option value="Executive Support Desk">Executive Support Desk</option>
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">
              Escalation Remarks / Case Notes <span className="text-red-500">*</span>
            </label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              required
              rows="3"
              placeholder="State the reasons for escalation and what attention is required..."
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
              {loading ? 'Escalating...' : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Escalate Now
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
