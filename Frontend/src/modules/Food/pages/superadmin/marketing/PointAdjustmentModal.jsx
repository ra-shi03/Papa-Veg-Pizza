import React, { useState, useEffect } from 'react';
import { X, RefreshCw, Sparkles, Plus, Minus, AlertTriangle } from 'lucide-react';
import { api } from './LoyaltyData';
import { toast } from 'sonner';

export default function PointAdjustmentModal({ isOpen, onClose, customerData, onSaveSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [adjustType, setAdjustType] = useState('add'); // 'add' or 'deduct'
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAdjustType('add');
      setPoints('');
      setReason('');
      setAdminNotes('');
      setShowConfirm(false);
    }
  }, [isOpen, customerData]);

  const currentPoints = customerData?.availablePoints || 0;
  const numPoints = Number(points) || 0;
  const newPoints = adjustType === 'add' ? currentPoints + numPoints : currentPoints - numPoints;

  const handleValidateAndPreConfirm = (e) => {
    e.preventDefault();
    if (numPoints <= 0) {
      toast.error("Please enter a valid amount of points (greater than 0).");
      return;
    }
    if (adjustType === 'deduct' && currentPoints < numPoints) {
      toast.error("Deduction points exceed current available balance.");
      return;
    }
    if (!reason.trim()) {
      toast.error("Please enter a reason for this point adjustment.");
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await api.adjustPoints(customerData._id, adjustType, numPoints, reason, adminNotes);
      if (res.success) {
        toast.success(`Successfully adjusted points for ${customerData.name}!`);
        onSaveSuccess();
        onClose();
      }
    } catch (err) {
      toast.error(err.message || "Failed to adjust points.");
    } finally {
      setSubmitting(false);
      setShowConfirm(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[280px] z-[65] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[500px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-850 dark:text-zinc-100 animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[var(--primary)]" size={16} />
            <h2 className="text-sm font-black text-black dark:text-white">Manual Point Adjustment</h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-650"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        {!showConfirm ? (
          <form onSubmit={handleValidateAndPreConfirm} className="p-5 space-y-4 text-xs font-semibold">
            
            {/* Customer Details Display */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800 rounded-xl flex justify-between items-center">
              <div>
                <p className="text-[10px] text-zinc-450 uppercase tracking-widest leading-none">Customer</p>
                <p className="text-xs font-black text-black dark:text-white mt-1">{customerData?.name}</p>
                <p className="text-[10px] text-zinc-500 font-semibold">{customerData?.customerId}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-zinc-450 uppercase tracking-widest leading-none">Current Balance</p>
                <p className="text-sm font-black text-[var(--primary)] mt-1 font-mono">{currentPoints} Pts</p>
              </div>
            </div>

            {/* Adjustment Type Selector (Add / Deduct Tabs) */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setAdjustType('add')}
                  className={`py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    adjustType === 'add'
                      ? 'bg-emerald-500 text-white shadow'
                      : 'text-zinc-600 dark:text-zinc-450 hover:text-black dark:hover:text-zinc-200'
                  }`}
                >
                  <Plus size={12} />
                  Add Points
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('deduct')}
                  className={`py-1.5 rounded-md text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                    adjustType === 'deduct'
                      ? 'bg-rose-500 text-white shadow'
                      : 'text-zinc-600 dark:text-zinc-450 hover:text-black dark:hover:text-zinc-200'
                  }`}
                >
                  <Minus size={12} />
                  Deduct Points
                </button>
              </div>
            </div>

            {/* Points input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Adjustment Points</label>
              <input
                type="number"
                placeholder="e.g. 500"
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                className="h-9.5 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-mono font-bold"
                min="1"
                required
              />
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Reason / Transaction label</label>
              <input
                type="text"
                placeholder="e.g. Compensation for order delay, Birthday gift"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
                required
              />
            </div>

            {/* Admin Notes */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Admin Notes (Internal)</label>
              <textarea
                placeholder="Details of the adjustment approval..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="h-16 p-2 bg-white dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-medium resize-none"
              />
            </div>

            {/* Real-time Balance Preview */}
            {numPoints > 0 && (
              <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex justify-between items-center animate-in slide-in-from-top-1.5 duration-200 font-mono text-[11px] font-bold">
                <div>
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest font-sans mb-1.5">Balance Forecast</p>
                  <div className="flex items-center gap-1.5 text-zinc-500">
                    <span>{currentPoints} Pts</span>
                    <span>{adjustType === 'add' ? '+' : '-'}</span>
                    <span>{numPoints} Pts</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest font-sans mb-1.5">New Balance</p>
                  <p className={`text-xs font-black ${adjustType === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {newPoints} Pts
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
              <button 
                type="button" 
                onClick={onClose}
                className="h-9.5 px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="h-9.5 px-4.5 bg-[var(--primary)] text-white font-extrabold rounded-lg hover:bg-[var(--primary)]/90 shadow transition-colors flex items-center justify-center cursor-pointer"
              >
                Review Adjustment
              </button>
            </div>

          </form>
        ) : (
          /* Confirmation State UI */
          <div className="p-5 space-y-4 text-xs font-semibold text-center">
            <div className="w-11 h-11 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <AlertTriangle size={20} className="animate-pulse" />
            </div>

            <div>
              <h3 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">Confirm Point Adjustment</h3>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs mx-auto leading-relaxed">
                You are about to manually {adjustType === 'add' ? 'issue' : 'deduct'} <strong className="text-zinc-900 dark:text-white">{numPoints} points</strong> {adjustType === 'add' ? 'to' : 'from'} customer <strong className="text-zinc-900 dark:text-white">{customerData?.name}</strong>.
              </p>
            </div>

            <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 rounded-xl text-left border border-zinc-200 dark:border-zinc-800 space-y-1">
              <div className="flex justify-between">
                <span className="text-zinc-450">Customer:</span>
                <span className="text-zinc-900 dark:text-white font-bold">{customerData?.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-450">Adjustment:</span>
                <span className={`font-bold ${adjustType === 'add' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {adjustType === 'add' ? '+' : '-'}{numPoints} Points
                </span>
              </div>
              <div className="flex justify-between font-mono font-bold text-[11px] pt-1.5 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                <span className="font-sans font-semibold text-zinc-450">Balance after:</span>
                <span className="text-zinc-900 dark:text-white">{newPoints} Pts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-450">Reason:</span>
                <span className="text-zinc-900 dark:text-white font-bold truncate max-w-[200px]">{reason}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-850">
              <button 
                type="button" 
                onClick={() => setShowConfirm(false)}
                className="h-9 px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 transition-colors"
                disabled={submitting}
              >
                Back
              </button>
              <button 
                type="button"
                onClick={handleConfirmSubmit}
                className="h-9 px-4 bg-[var(--primary)] text-white font-extrabold rounded-lg hover:bg-[var(--primary)]/90 shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer animate-pulse"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <RefreshCw size={12} className="animate-spin" />
                    Applying...
                  </>
                ) : (
                  "Apply Adjustment"
                )}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
