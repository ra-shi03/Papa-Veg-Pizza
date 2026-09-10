import React, { useState } from 'react';
import { X, ArrowUpCircle, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

export default function EscalateModal({ isOpen, onClose, complaintId, onEscalateSuccess }) {
  const [level, setLevel] = useState('Level 2 (Franchise Head)');
  const [department, setDepartment] = useState('Store Operations');
  const [reason, setReason] = useState('Delayed Store Response');
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate PATCH /api/customer-complaints/:id/escalate
    setTimeout(() => {
      setLoading(false);
      toast.success(`Complaint escalated to ${level} in ${department}`);
      if (onEscalateSuccess) {
        onEscalateSuccess(level, department, reason, comments);
      }
      onClose();
    }, 1000);
  };

  const escalationLevels = [
    'Level 1 (Store Manager Representative)',
    'Level 2 (Franchise Head / Area Lead)',
    'Level 3 (Super Admin Panel Escalation Committee)'
  ];

  const departments = [
    'Food Quality & Safety',
    'Delivery & Rider Fleet Operations',
    'Billing, Payments & Refunds',
    'Store & Kitchen Operations',
    'Technical Support & System Bugs'
  ];

  const reasons = [
    'Delayed Store Response (>2 Hours)',
    'Rider Misbehavior / Verbal Misconduct',
    'Severe Quality Issue (Foreign Particle/Contamination)',
    'Technical Payment Capture Error',
    'Store Manager Dispute Escalation',
    'Incorrect Refund Process'
  ];

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm animate-in fade-in duration-250">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-250" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Escalate Complaint</h2>
            <p className="text-[10px] text-zinc-500">Complaint: {complaintId}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Level Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Escalation Tier Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
            >
              {escalationLevels.map((lvl) => (
                <option key={lvl} value={lvl}>{lvl}</option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Escalation Target Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Reason */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Primary Escalation Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Comments */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Escalation Comments & Remarks</label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="State the detailed justification for this manual escalation..."
              rows="3"
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
          </div>

          <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-red-650 dark:text-red-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-zinc-650 dark:text-zinc-400 leading-normal">
              Warning: Escalating this issue will mark it as <strong>Escalated</strong> (high alert red priority badge) and notify the Regional Operations Manager immediately.
            </p>
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
              className="px-4 h-8 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading ? 'Escalating...' : (
                <>
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  Escalate Complaint
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
