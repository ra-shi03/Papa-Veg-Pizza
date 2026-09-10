import React, { useState, useEffect } from 'react';
import { X, History, User } from 'lucide-react';

export default function RefundHistoryModal({ isOpen, onClose, refund }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered || !refund) return null;

  const getStatusColor = (status) => {
    switch (status) {
      case 'requested': return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-200/50';
      case 'under_review': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200/50';
      case 'approved': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/50';
      case 'processing': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200/50';
      case 'completed': return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-200/50';
      case 'rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-200/50';
      default: return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-400 border-zinc-200';
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
        className={`w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl relative z-10 transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} overflow-hidden flex flex-col`}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-2">
            <History className="text-[var(--primary)]" size={18} />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Audit Trail: {refund.refundNumber}</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Timeline history logs of status changes and approvals.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-150 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body (Table Layout) */}
        <div className="p-4 overflow-y-auto max-h-[60vh] scrollbar-thin">
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse text-xs font-semibold">
              <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-[10px] uppercase font-bold text-zinc-400 tracking-wider">
                <tr>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Changed By</th>
                  <th className="px-3 py-2.5">Remarks</th>
                  <th className="px-3 py-2.5">Created Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {!refund.history || refund.history.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-3 py-8 text-center text-zinc-500 dark:text-zinc-400">
                      No logs available for this refund.
                    </td>
                  </tr>
                ) : (
                  refund.history.map((log, index) => (
                    <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-805/30 transition-colors">
                      {/* Status */}
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getStatusColor(log.status)}`}>
                          {log.status}
                        </span>
                      </td>

                      {/* Changed By */}
                      <td className="px-3 py-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-zinc-800 dark:text-zinc-200 font-bold flex items-center gap-1">
                            <User size={11} className="text-zinc-450" />
                            {log.updatedBy}
                          </span>
                          <span className="text-[9px] text-zinc-400 block ml-4">({log.role})</span>
                        </div>
                      </td>

                      {/* Remarks */}
                      <td className="px-3 py-3.5 text-zinc-600 dark:text-zinc-400 font-medium leading-normal max-w-xs break-words">
                        {log.remarks}
                      </td>

                      {/* Created Time */}
                      <td className="px-3 py-3.5 text-zinc-500 font-mono text-[10px] whitespace-nowrap">
                        {new Date(log.timestamp).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })} - {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex justify-end">
          <button 
            onClick={onClose}
            className="h-8 px-4 bg-zinc-850 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
}
