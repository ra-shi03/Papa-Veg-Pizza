import React, { useState, useEffect } from 'react';
import { X, CheckCircle2, DollarSign, Gift, Loader2 } from 'lucide-react';
import { resolveDispute } from '../DisputesData';
import { toast } from 'sonner';

export default function ResolveDisputeModal({ isOpen, onClose, dispute, onSuccess }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [resType, setResType] = useState('Refund'); // Refund, Replacement, Coupon Compensation, No Action
  const [compensationAmount, setCompensationAmount] = useState(0);
  const [couponCode, setCouponCode] = useState('');
  const [notes, setNotes] = useState('');
  const [emailAlert, setEmailAlert] = useState(true);
  const [smsAlert, setSmsAlert] = useState(true);
  const [pushAlert, setPushAlert] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
      setResType('Refund');
      setCompensationAmount(dispute?.order?.grandTotal || 0);
      setCouponCode('');
      setNotes('');
      setEmailAlert(true);
      setSmsAlert(true);
      setPushAlert(false);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, dispute]);

  useEffect(() => {
    if (resType === 'Coupon Compensation') {
      setCouponCode('SORRY50');
    } else {
      setCouponCode('');
    }
  }, [resType]);

  if (!isRendered || !dispute) return null;

  const handleResolve = async (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error('Resolution notes are required for compliance auditing');
      return;
    }

    const amt = parseFloat(compensationAmount) || 0;

    setIsProcessing(true);
    try {
      const response = await resolveDispute(
        dispute._id, 
        resType, 
        amt, 
        couponCode, 
        notes, 
        { emailAlert, smsAlert, pushAlert }
      );
      if (response.success) {
        toast.success(`Dispute resolved successfully: ${resType}`);
        onSuccess(response.dispute);
        onClose();
      }
    } catch (err) {
      toast.error('Failed to update resolution status');
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
        className={`w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl relative z-10 transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'} overflow-hidden`}
      >
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="text-emerald-500" size={18} />
            <div>
              <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Resolve Dispute Claim</h2>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Authorize compensation and close conflict case {dispute.disputeNumber}.</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-150 dark:hover:bg-zinc-805 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleResolve}>
          {/* Body */}
          <div className="p-4 space-y-4 text-xs font-semibold">
            {/* Resolution Type */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Resolution Actions</label>
              <select 
                value={resType}
                onChange={(e) => setResType(e.target.value)}
                className="w-full h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-100"
              >
                <option value="Refund">Full/Partial Refund release</option>
                <option value="Replacement">Arrange Replacement order dispatch</option>
                <option value="Coupon Compensation">Disburse Coupon Code promo compensation</option>
                <option value="No Action">Reject claim - No action taken</option>
              </select>
            </div>

            {/* Refund release amount (Conditionally visible) */}
            {(resType === 'Refund' || resType === 'Coupon Compensation') && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Compensation Amount (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 font-bold">₹</span>
                    <input 
                      type="number"
                      step="0.01"
                      value={compensationAmount}
                      onChange={(e) => setCompensationAmount(e.target.value)}
                      className="w-full h-9 pl-7 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-[var(--primary)] text-zinc-900 dark:text-zinc-100"
                    />
                  </div>
                </div>

                {resType === 'Coupon Compensation' && (
                  <div>
                    <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Coupon Code</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450"><Gift size={13} /></span>
                      <input 
                        type="text"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="w-full h-9 pl-8 pr-3 bg-zinc-50 dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-mono font-bold uppercase outline-none focus:ring-2 focus:ring-[var(--primary)] text-zinc-900 dark:text-zinc-100"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resolution Notes */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
                Resolution Investigation Summary & Notes <span className="text-red-500">*</span>
              </label>
              <textarea 
                rows="3"
                required
                placeholder="Include confirmation logs, details of verification, and communication highlights. This audit is logged permanently..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2.5 bg-white dark:bg-zinc-955 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-[var(--primary)] placeholder-zinc-400"
              />
            </div>

            {/* Customer Notifications checkboxes */}
            <div>
              <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-2">Discharge Client Notifications</label>
              <div className="flex flex-wrap gap-4 p-2 bg-zinc-50 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-850">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={emailAlert}
                    onChange={(e) => setEmailAlert(e.target.checked)}
                    className="w-3.5 h-3.5 text-[var(--primary)] border-zinc-300 dark:border-zinc-700 focus:ring-[var(--primary)] rounded"
                  />
                  <span>Dispatch Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={smsAlert}
                    onChange={(e) => setSmsAlert(e.target.checked)}
                    className="w-3.5 h-3.5 text-[var(--primary)] border-zinc-300 dark:border-zinc-700 focus:ring-[var(--primary)] rounded"
                  />
                  <span>SMS Dispatch</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input 
                    type="checkbox"
                    checked={pushAlert}
                    onChange={(e) => setPushAlert(e.target.checked)}
                    className="w-3.5 h-3.5 text-[var(--primary)] border-zinc-300 dark:border-zinc-700 focus:ring-[var(--primary)] rounded"
                  />
                  <span>Push Alert</span>
                </label>
              </div>
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
              className="h-8 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {isProcessing ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Closing conflict...</span>
                </>
              ) : (
                <span>Mark as Resolved</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
