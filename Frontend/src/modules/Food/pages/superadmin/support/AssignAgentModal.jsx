import React, { useState } from 'react';
import { X, UserCheck, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignAgentModal({ isOpen, onClose, complaintId, onAssignSuccess }) {
  const [agent, setAgent] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agent) {
      toast.error('Please select an agent');
      return;
    }

    setLoading(true);
    // Simulate PATCH /api/customer-complaints/:id/assign
    setTimeout(() => {
      setLoading(false);
      toast.success(`Complaint successfully assigned to ${agent}`);
      if (onAssignSuccess) {
        onAssignSuccess(agent, priority, notes);
      }
      onClose();
    }, 1000);
  };

  const agents = [
    'Amit Sharma (Senior Support)',
    'Rohan Gupta (Customer Success)',
    'Neha Singh (Franchise Operations)',
    'Vikram Rathore (Delivery Operations)',
    'Priya Verma (Refund Lead)'
  ];

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm animate-in fade-in duration-250">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-250" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Assign Agent</h2>
            <p className="text-[10px] text-zinc-500">Complaint: {complaintId}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Agent Dropdown */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Select Agent</label>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-medium"
            >
              <option value="">Choose an agent...</option>
              {agents.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Priority */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Priority Level</label>
            <div className="grid grid-cols-4 gap-1.5">
              {['Low', 'Medium', 'High', 'Critical'].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setPriority(lvl)}
                  className={`py-1.5 rounded-lg border text-[10px] font-bold transition-all active:scale-95 ${
                    priority === lvl
                      ? lvl === 'Low'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                        : lvl === 'Medium'
                        ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-450'
                        : lvl === 'High'
                        ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400'
                        : 'border-red-500 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-450">Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain target task requirements or context..."
              rows="3"
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
          </div>

          <div className="p-2.5 rounded-lg border border-yellow-500/20 bg-yellow-500/5 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 shrink-0 mt-0.5" />
            <p className="text-[9px] text-zinc-650 dark:text-zinc-400 leading-normal">
              Assigning this complaint will change its status to <strong>In Progress</strong> and trigger email/SMS alerts to the designated handler.
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
              className="px-4 h-8 bg-[var(--primary)] hover:opacity-90 active:scale-95 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading ? 'Assigning...' : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  Assign Agent
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
