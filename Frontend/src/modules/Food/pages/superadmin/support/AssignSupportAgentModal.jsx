import React, { useState, useEffect } from 'react';
import { X, UserPlus, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AssignSupportAgentModal({ isOpen, onClose, onAssign, request }) {
  const [department, setDepartment] = useState('Technical Team');
  const [agent, setAgent] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Mock Agent Database by Department
  const agentsByDept = {
    'Technical Team': ['Amit Patel', 'Neha Reddy', 'Sandeep Kumar', 'Priyanka Rao'],
    'Operations Team': ['Rajesh Sharma', 'Vikram Singh', 'Meera Nair', 'Deepak Goel'],
    'Delivery Team': ['Sanjay Verma', 'Anil Kadam', 'Sunil Yadav', 'Vijay Rathi'],
    'HR Team': ['Shalini Gupta', 'Rohan Das', 'Kavita Mehta'],
    'Support Team': ['Rohit Joshi', 'Swati Mishra', 'Pooja Bhatt']
  };

  useEffect(() => {
    if (request) {
      setPriority(request.priority || 'Medium');
      // Prefill department/agent if already assigned
      if (request.department) {
        setDepartment(request.department);
      }
      if (request.assignedTo && request.assignedTo !== 'Unassigned') {
        setAgent(request.assignedTo);
      } else {
        const firstAgent = agentsByDept[department]?.[0] || '';
        setAgent(firstAgent);
      }
    }
  }, [request, isOpen]);

  // Adjust agent list when department changes
  const handleDeptChange = (e) => {
    const dept = e.target.value;
    setDepartment(dept);
    const list = agentsByDept[dept] || [];
    setAgent(list[0] || '');
  };

  if (!isOpen || !request) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agent) {
      toast.error('Please select an agent');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      const updatedRequest = {
        ...request,
        assignedTo: agent,
        department: department,
        priority: priority,
        status: 'In Progress', // automatically moves to In Progress upon assignment
        updatedAt: new Date().toISOString()
      };
      
      toast.success(`Assigned to ${agent} (${department}) successfully`);
      if (onAssign) {
        onAssign(updatedRequest, {
          agent,
          department,
          priority,
          notes,
          timestamp: new Date().toISOString()
        });
      }
      onClose();
    }, 1000);
  };

  const agentsList = agentsByDept[department] || [];

  return (
    <div 
      className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-955/80 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200" 
        onClick={e => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[var(--primary)]" />
            <div>
              <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Assign Support Agent</h2>
              <p className="text-[10px] text-zinc-500 font-semibold">Route request {request.requestNumber} to a department and team member</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Department */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-450 block">Target Department</label>
            <select
              value={department}
              onChange={handleDeptChange}
              required
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              <option value="Technical Team">Technical Team</option>
              <option value="Operations Team">Operations Team</option>
              <option value="Delivery Team">Delivery Team</option>
              <option value="HR Team">HR Team</option>
              <option value="Support Team">Support Team (General Desk)</option>
            </select>
          </div>

          {/* Assigned Agent */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-450 block">Select Agent</label>
            <select
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              required
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              <option value="">Select agent...</option>
              {agentsList.map(a => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>

          {/* Severity Priority */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-450 block">Adjust Severity Priority</label>
            <div className="grid grid-cols-4 gap-1 h-9 items-center">
              {['Low', 'Medium', 'High', 'Critical'].map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`h-8 rounded-lg border text-[9px] font-extrabold uppercase transition-all active:scale-95 flex items-center justify-center ${
                    priority === p
                      ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Assignment Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-650 dark:text-zinc-455 block">Assignment Instructions / Internal Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              placeholder="Provide context or specific tasks for the assigned agent..."
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
              {loading ? 'Assigning...' : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm Assignment
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
