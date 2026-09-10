import React, { useState, useEffect } from "react";
import { XCircle } from "lucide-react";

export default function ReqChangeModal({ isOpen, onClose, selectedApp, onSubmit }) {
  const [changesInstructions, setChangesInstructions] = useState("");
  const [changesNotes, setChangesNotes] = useState("");
  const [changesDeadline, setChangesDeadline] = useState("");

  useEffect(() => {
    if (isOpen) {
      setChangesInstructions("");
      setChangesNotes("");
      setChangesDeadline("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (!changesInstructions) return;
    onSubmit({
      instructions: changesInstructions,
      notes: changesNotes,
      deadline: changesDeadline
    });
  };

  return (
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[60] flex items-center justify-center p-4 lg:pl-[280px]" id="changes-modal">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-900 animate-scaleUp">
        <div className="p-4 border-b border-zinc-200 dark:border-zinc-900 bg-zinc-50 dark:bg-zinc-900/40 flex justify-between items-center">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-black dark:text-zinc-100">Request Document Changes</h3>
            <p className="text-[10px] font-bold text-purple-600 mt-0.5">{selectedApp?.id} - {selectedApp?.applicantName}</p>
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
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Resubmission Instructions *</label>
            <textarea
              value={changesInstructions}
              onChange={(e) => setChangesInstructions(e.target.value)}
              rows="3"
              className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)] resize-none"
              placeholder="Detail precisely what documents are missing or invalid..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Internal Log Note</label>
            <textarea
              value={changesNotes}
              onChange={(e) => setChangesNotes(e.target.value)}
              rows="2"
              className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)] resize-none"
              placeholder="Confidential reviewer annotation..."
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-black dark:text-zinc-400 uppercase">Resubmission Deadline</label>
            <input
              type="date"
              value={changesDeadline}
              onChange={(e) => setChangesDeadline(e.target.value)}
              className="mt-1 w-full p-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-black dark:text-zinc-100 outline-none focus:border-[var(--primary)]"
            />
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
            disabled={!changesInstructions}
            className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold hover:bg-purple-700 disabled:opacity-40 transition-all cursor-pointer"
          >
            Send Request
          </button>
        </div>
      </div>
    </div>
  );
}
