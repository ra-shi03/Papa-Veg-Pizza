import React, { useState, useEffect } from 'react';
import { X, UserCheck, Loader2 } from 'lucide-react';
import { assignDispute, mockSupportAgents } from '../DisputesData';
import { toast } from 'sonner';

export default function AssignDisputeModal({ isOpen, onClose, dispute, onSuccess }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [agentId, setAgentId] = useState(mockSupportAgents[0]._id);
  const [priority, setPriority] = useState('Medium');
  const [deadline, setDeadline] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
      setAgentId(mockSupportAgents[0]._id);
      setPriority(dispute?.priority || 'Medium');
      
      // Default deadline to 4 hours from now
      const defaultDate = new Date();
      defaultDate.setHours(defaultDate.getHours() + 4);
      setDeadline(defaultDate.toISOString().slice(0, 16));
      setNotes('');
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, dispute]);

  if (!isRendered || !dispute) return null;

  const handleAssign = async (e) => {
    e.preventDefault();
    if (!deadline) {
      toast.error('Please set an SLA resolution deadline');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await assignDispute(dispute._id, agentId, priority, deadline, notes);
      if (response.success) {
        toast.success(`Dispute assigned to ${response.dispute.assignedTo}`);
        onSuccess(response.dispute);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to assign dispute');
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
            <UserCheck className="text-[var(--primary)]" size={18} />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Assign Support Agent</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Allocate dispute ticket {dispute.disputeNumber} to an investigator.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-150 dark:hover:bg-zinc-805 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleAssign}>
          {/* Body */}
          <div className="p-4 space-y-4 text-xs font-semibold">
            {/* Support Agent Dropdown */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Select Support Agent</label>
              <select 
                value={agentId}
                onChange={(e) => setAgentId(e.target.value)}
                className="w-full h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-100"
              >
                {mockSupportAgents.map(agent => (
                  <option key={agent._id} value={agent._id}>
                    {agent.name} ({agent.role})
                  </option>
                ))}
              </select>
            </div>

            {/* SLA Priority & Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Incident Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-100"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">SLA Resolution Deadline</label>
                <input 
                  type="datetime-local"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full h-9 px-2 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--primary)] text-zinc-650"
                />
              </div>
            </div>

            {/* Instruction Notes */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Internal Allocation Notes</label>
              <textarea 
                rows="3"
                placeholder="Add instructions, policy links, or context files for the support agent..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-400"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
            <button 
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="h-8 px-4 rounded-lg text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-355 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isProcessing}
              className="h-8 px-4 bg-[var(--primary)] text-white hover:opacity-90 rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Assign Investigator</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
