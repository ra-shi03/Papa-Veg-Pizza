import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function EscalateFranchiseTicketModal({ isOpen, onClose, ticketNumber, onEscalateSuccess }) {
  const [level, setLevel] = useState('Level 2 (Department Head)');
  const [department, setDepartment] = useState('Operations');
  const [reason, setReason] = useState('SLA Breach / Response Delay');
  const [remarks, setRemarks] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const departments = [
    'Finance',
    'Operations',
    'Inventory',
    'Technical Support',
    'HR',
    'Settlement Team'
  ];

  const escalationReasons = [
    'SLA Breach / Response Delay',
    'Requires Executive Approval / Financial Limit',
    'Technical Block / Bug Hotfix Needed',
    'Franchise Admin Discontent / High Dispute Value',
    'Unresolved Recurrent Operational Issue'
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    // Simulate PATCH /api/franchise-tickets/:id/escalate
    setTimeout(() => {
      setLoading(false);
      toast.success(`Ticket escalated to ${level} in ${department}`);
      if (onEscalateSuccess) {
        onEscalateSuccess(level, department, reason, remarks);
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
            <ShieldAlert className="w-5 h-5 text-red-600 dark:text-red-550 animate-pulse" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Escalate Ticket</h2>
              <p className="text-[10px] text-zinc-500">Ticket: {ticketNumber}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Escalation Level */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450 block">Escalation Authority Level</label>
            <div className="space-y-1.5">
              {[
                'Level 1 (Team Lead)',
                'Level 2 (Department Head)',
                'Level 3 (Super Admin Executive Board)'
              ].map((lvl) => (
                <label key={lvl} className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300 cursor-pointer">
                  <input
                    type="radio"
                    name="escalationLevel"
                    value={lvl}
                    checked={level === lvl}
                    onChange={(e) => setLevel(e.target.value)}
                    className="accent-[var(--primary)]"
                  />
                  <span>{lvl}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Target Department */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450 block">Escalate To Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              {departments.map((dept) => (
                <option key={dept} value={dept}>{dept}</option>
              ))}
            </select>
          </div>

          {/* Escalation Reason */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Escalation Reason</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              {escalationReasons.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Remarks */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450 block">Escalation Comments / Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Explain why this ticket is being escalated and what actions are expected..."
              rows="3"
              required
              className="w-full p-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            />
          </div>

          {/* Alert Notice */}
          <div className="p-2.5 rounded-lg border border-red-500/20 bg-red-500/5 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-650 dark:text-red-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-zinc-650 dark:text-zinc-400 leading-normal font-medium">
              Warning: Escalating this support ticket will flag its status as <strong>Escalated</strong>, trigger critical alerts on target dashboards, and notify the respective department head.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-8 rounded-lg text-xs font-bold text-zinc-655 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-8 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-md shadow-red-500/10 transition-all active:scale-95 flex items-center gap-1.5"
            >
              {loading ? 'Escalating...' : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Escalate Ticket
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
