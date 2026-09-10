import React, { useState, useEffect } from "react";
import { X, UserPlus, Info, BellRing } from "lucide-react";
import { useAssignIssue, useIssueStaff } from "../ordersQuery";

export default function AssignIssueModal({ isOpen, onClose, issue }) {
  const { data: staffList, isLoading: isStaffLoading } = useIssueStaff();
  const { mutateAsync: assignIssue, isLoading: isAssigning } = useAssignIssue();

  const [assignedToId, setAssignedToId] = useState("");
  const [department, setDepartment] = useState("Support");
  const [priorityOverride, setPriorityOverride] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notifyStaff, setNotifyStaff] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (issue) {
      setAssignedToId(issue.assignedTo?.id || "");
      setDepartment(issue.assignedTo?.department || "Support");
      setPriorityOverride(issue.priority || "Medium");
      setRemarks("");
      setError("");
    }
  }, [issue, isOpen]);

  if (!isOpen || !issue) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!assignedToId) {
      setError("Please select a staff member to assign");
      return;
    }

    try {
      await assignIssue({
        issueId: issue.issueNumber,
        assignedToId,
        department,
        remarks,
        priorityOverride,
        notifyStaff,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to assign issue");
    }
  };

  const departments = ["Support", "Operations", "Kitchen", "Delivery", "Finance"];
  const priorities = ["Low", "Medium", "High", "Critical"];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Wrapper shifted to prevent sidebar overlap */}
      <div className="fixed inset-0 lg:left-[280px] flex items-center justify-center p-4 z-10 pointer-events-none">
        
        {/* Modal Container: 700px Max Width */}
        <form 
          onSubmit={handleSubmit}
          className="relative w-full max-w-[700px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-scale-up text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <UserPlus className="text-[var(--primary)]" size={18} />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Assign Operations Staff / Department
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Delegate issue {issue.issueNumber} to specialist agent.
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {/* Form Content */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[70vh] scrollbar-thin">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 text-[11px] font-bold flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Quick Context Summary */}
            <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Category</p>
                <p className="font-extrabold text-zinc-850 dark:text-zinc-200 mt-1">{issue.category}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Order Number</p>
                <p className="font-extrabold text-zinc-850 dark:text-zinc-250 mt-1">{issue.orderNumber}</p>
              </div>
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Current Priority</p>
                <span className={`px-2 py-0.5 border rounded-full font-bold text-[9.5px] mt-1 inline-block ${
                  issue.priority === "Critical" ? "text-red-650 bg-red-50 dark:bg-red-950/20" :
                  issue.priority === "High" ? "text-orange-600 bg-orange-50 dark:bg-orange-950/20" :
                  issue.priority === "Medium" ? "text-blue-600 bg-blue-50 dark:bg-blue-950/20" :
                  "text-zinc-600 bg-zinc-50 dark:bg-zinc-900/30"
                }`}>
                  {issue.priority}
                </span>
              </div>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Assign To Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                  Select Staff Member
                </label>
                <select
                  value={assignedToId}
                  onChange={(e) => {
                    setAssignedToId(e.target.value);
                    const selected = staffList?.find(s => s.id === e.target.value);
                    if (selected) setDepartment(selected.department);
                  }}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
                  required
                >
                  <option value="">-- Choose Operator --</option>
                  {staffList?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.department})
                    </option>
                  ))}
                </select>
              </div>

              {/* Department */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                  Operations Department
                </label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Priority Override */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                  Override Priority
                </label>
                <select
                  value={priorityOverride}
                  onChange={(e) => setPriorityOverride(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] transition-all cursor-pointer"
                >
                  {priorities.map((prio) => (
                    <option key={prio} value={prio}>{prio}</option>
                  ))}
                </select>
              </div>

            </div>

            {/* Remarks Textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Assignment Remarks / Internal Dispatch Notes
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-250 placeholder-zinc-450 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold"
                placeholder="Log special instructions for the support specialist regarding resolution steps..."
              />
            </div>

            {/* Notify Assigned Staff Checkbox */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="text-zinc-400" size={14} />
                <div>
                  <p className="font-extrabold text-[10px] text-zinc-800 dark:text-zinc-200">Alert Assigned Staff</p>
                  <p className="text-[9px] text-zinc-450 font-semibold">Send push notification to the assigned staff's mobile console.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyStaff}
                  onChange={(e) => setNotifyStaff(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]" />
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-855 flex justify-end gap-3 bg-zinc-50/30 dark:bg-zinc-900/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAssigning}
              className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isAssigning ? "Assigning..." : "Assign Staff"}
            </button>
          </footer>
        </form>

      </div>
    </div>
  );
}
