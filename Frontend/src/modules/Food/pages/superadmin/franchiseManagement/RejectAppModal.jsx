import React, { useState, useEffect } from "react";
import { XCircle } from "lucide-react";

export default function RejectAppModal({ isOpen, onClose, selectedApp, onSubmit }) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectionNotes, setRejectionNotes] = useState("");
  const [notifyReject, setNotifyReject] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setRejectionReason("");
      setRejectionNotes("");
      setNotifyReject(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!rejectionReason) return;
    onSubmit({
      reason: rejectionReason,
      notes: rejectionNotes,
      notify: notifyReject
    });
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[60] flex items-center justify-center p-4 lg:pl-[280px]" id="reject-modal">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Reject Application</h3>
            <p className="text-[10px] font-bold text-rose-600 mt-0.5">{selectedApp?.id} - {selectedApp?.applicantName}</p>
          </div>
          <button
            onClick={onClose}
            className="text-black dark:text-zinc-300 hover:text-[var(--primary)] cursor-pointer"
          >
            <XCircle size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Reason for Rejection *</label>
            <select
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
            >
              <option value="">Select Reason</option>
              <option value="insufficient_capital">Insufficient Investment Capacity</option>
              <option value="regulatory_compliance_failure">Regulatory Compliance Audit Failure</option>
              <option value="lack_of_qsr_experience">Lack of F&B Operations Experience</option>
              <option value="territory_conflict">Territory Rights Overlap Conflict</option>
              <option value="other">Other / Custom Reason</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Internal Review Notes</label>
            <textarea
              value={rejectionNotes}
              onChange={(e) => setRejectionNotes(e.target.value)}
              rows="3"
              className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)] resize-none"
              placeholder="Record verification logs details..."
            />
          </div>

          <div className="flex items-center gap-2 pt-1 select-none">
            <input
              type="checkbox"
              id="notify-reject"
              checked={notifyReject}
              onChange={(e) => setNotifyReject(e.target.checked)}
              className="w-3.5 h-3.5 rounded text-rose-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="notify-reject" className="text-xs font-bold text-black dark:text-zinc-200 cursor-pointer">
              Notify Applicant via automated rejection email
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-250 dark:bg-zinc-800 text-black dark:text-zinc-200 rounded-lg text-xs font-bold hover:bg-zinc-300 transition-all cursor-pointer font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={!rejectionReason}
            className="px-4 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold hover:bg-rose-700 disabled:opacity-40 transition-all cursor-pointer"
          >
            Reject Application
          </button>
        </div>
      </div>
    </div>
  );
}
