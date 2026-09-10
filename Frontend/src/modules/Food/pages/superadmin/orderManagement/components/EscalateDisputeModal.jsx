import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';
import { escalateDispute } from '../DisputesData';
import { toast } from 'sonner';

export default function EscalateDisputeModal({ isOpen, onClose, dispute, onSuccess }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [level, setLevel] = useState('Level 2');
  const [reason, setReason] = useState('');
  const [priority, setPriority] = useState('High');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
      setLevel('Level 2');
      setReason('');
      setPriority(dispute?.priority === 'Critical' ? 'Critical' : 'High');
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, dispute]);

  if (!isRendered || !dispute) return null;

  const handleEscalate = async (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      toast.error('Escalation reason notes are mandatory');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await escalateDispute(dispute._id, level, reason, priority);
      if (response.success) {
        toast.success(`Dispute escalated to ${level}`);
        onSuccess(response.dispute);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to escalate dispute');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl relative z-10 transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} overflow-hidden`}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-orange-500 animate-pulse" size={18} />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Escalate Dispute Ticket</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Route dispute {dispute.disputeNumber} to senior support channels.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-150 dark:hover:bg-zinc-805 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleEscalate}>
          {/* Body */}
          <div className="p-4 space-y-4 text-xs font-semibold">
            {/* Escalation Level */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1">Target Escalation Channel</label>
              <select 
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-100"
              >
                <option value="Level 2">Level 2 Support Team</option>
                <option value="Operations Team">Operations Department</option>
                <option value="Legal Team">Legal Advisory Team</option>
                <option value="Management">Central Management Executive Board</option>
              </select>
            </div>

            {/* Incident Priority Upgrade */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1">Escalated Ticket Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full h-9 px-3 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-100"
              >
                <option value="High">High (Standard SLA)</option>
                <option value="Critical">Critical (Instant Dispatch)</option>
              </select>
            </div>

            {/* Escalation Reason */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 tracking-wider uppercase mb-1">
                Reason for Escalation <span className="text-red-500">*</span>
              </label>
              <textarea 
                rows="3"
                required
                placeholder="Explain SLA breach, customer aggression, physical hazards, legal claims, or other exceptions requiring escalation..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-400"
              />
            </div>

            <div className="p-2.5 bg-orange-500/5 border border-orange-500/10 rounded-lg text-[10px] text-orange-700 dark:text-orange-400 leading-normal flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                <strong>Notice:</strong> Escalating routes this case directly to the selected queue. Standard active agents will lose modification permissions until reviewed by managers.
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
            <button 
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="h-8 px-4 rounded-lg text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isProcessing}
              className="h-8 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Escalating Queue...</span>
                </>
              ) : (
                <span>Escalate Dispute</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
