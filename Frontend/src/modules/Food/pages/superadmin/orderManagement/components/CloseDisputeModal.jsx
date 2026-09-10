import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Loader2 } from 'lucide-react';
import { closeDispute } from '../DisputesData';
import { toast } from 'sonner';

export default function CloseDisputeModal({ isOpen, onClose, dispute, onSuccess }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
      setRemarks('');
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered || !dispute) return null;

  const handleCloseDispute = async (e) => {
    e.preventDefault();
    setIsProcessing(true);
    try {
      const response = await closeDispute(dispute._id, remarks);
      if (response.success) {
        toast.success(`Dispute closed successfully`);
        onSuccess(response.dispute);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to close dispute');
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
            <ShieldCheck className="text-zinc-600 dark:text-zinc-400" size={18} />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Close Dispute Ticket</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Archive conflict {dispute.disputeNumber} once resolved.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-150 dark:hover:bg-zinc-805 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleCloseDispute}>
          {/* Body */}
          <div className="p-4 space-y-3 text-xs font-semibold">
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Final Closing Remarks</label>
              <textarea 
                rows="3"
                placeholder="Include confirmation remarks or customer response validations prior to archiving this dispute..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-400"
              />
            </div>

            <p className="text-[10px] text-zinc-455 leading-normal">
              Closing a dispute changes its status permanently to <strong>closed</strong>. This ticket will be archived from active lists but remains viewable in historical reports.
            </p>
          </div>

          {/* Footer */}
          <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2.5">
            <button 
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="h-8 px-4 rounded-lg text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-805 text-zinc-650 dark:text-zinc-350 transition-colors disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit"
              disabled={isProcessing}
              className="h-8 px-4 bg-zinc-850 hover:bg-zinc-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Closing...</span>
                </>
              ) : (
                <span>Close Dispute</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
