import React, { useState } from 'react';
import { X, AlertTriangle, DollarSign, Edit } from 'lucide-react';
import { useCommissionAdjustment } from './hooks/useCommissionQuery';

export default function ManualAdjustmentModal({ isOpen, onClose, franchiseId, franchiseName, onAdjustmentSuccess }) {
  const { applyAdjustment, loading } = useCommissionAdjustment();
  const [formData, setFormData] = useState({
    adjustmentType: 'Increase',
    amount: '',
    reason: '',
    remarks: '',
  });

  const [errors, setErrors] = useState({});
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isOpen) return null;

  const validateForm = () => {
    const newErrors = {};
    if (!formData.amount || Number(formData.amount) <= 0) {
      newErrors.amount = "Amount must be greater than 0";
    }
    if (!formData.reason) {
      newErrors.reason = "Reason is required";
    }
    if (formData.reason === 'Other' && !formData.remarks.trim()) {
      newErrors.remarks = "Remarks are mandatory when reason is 'Other'";
    } else if (formData.remarks.length > 500) {
      newErrors.remarks = "Remarks must be 500 characters or less";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleOpenConfirm = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setShowConfirm(true);
    }
  };

  const handleConfirmSubmit = async () => {
    setShowConfirm(false);
    const success = await applyAdjustment({
      franchiseId,
      adjustmentType: formData.adjustmentType,
      amount: formData.amount,
      reason: formData.reason,
      remarks: formData.remarks
    });

    if (success) {
      if (onAdjustmentSuccess) onAdjustmentSuccess();
      onClose();
    }
  };

  return (
    <>
      {/* Main Adjustment Drawer/Modal */}
      <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <div 
          className="relative w-full max-w-[520px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-scale-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
                <Edit size={16} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-black dark:text-white">
                  Manual Commission Adjustment
                </h3>
                <p className="text-[10px] font-semibold text-zinc-500 mt-0.5">
                  Adjust commission Ledger override values for {franchiseName}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleOpenConfirm} className="p-5 space-y-4">
            
            {/* Adjustment Type Selection */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Adjustment Type</label>
              <div className="grid grid-cols-2 gap-2 bg-zinc-100 dark:bg-zinc-950 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, adjustmentType: 'Increase' }))}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${formData.adjustmentType === 'Increase' ? 'bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'}`}
                >
                  Increase Credit
                </button>
                <button
                  type="button"
                  onClick={() => setFormData(p => ({ ...p, adjustmentType: 'Decrease' }))}
                  className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${formData.adjustmentType === 'Decrease' ? 'bg-white dark:bg-zinc-900 text-rose-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-350'}`}
                >
                  Decrease Debit
                </button>
              </div>
            </div>

            {/* Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Override Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">₹</span>
                <input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData(p => ({ ...p, amount: e.target.value }))}
                  className={`w-full pl-7 pr-3 h-9 bg-zinc-50 dark:bg-zinc-950 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white ${errors.amount ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'}`}
                />
              </div>
              {errors.amount && <span className="text-[10px] text-rose-500 font-bold">{errors.amount}</span>}
            </div>

            {/* Reason */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Adjustment Reason</label>
              <select
                value={formData.reason}
                onChange={(e) => setFormData(p => ({ ...p, reason: e.target.value }))}
                className={`w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-950 border rounded-lg text-xs font-bold focus:ring-2 focus:ring-[var(--primary)] outline-none text-black dark:text-white ${errors.reason ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'}`}
              >
                <option value="">Select a reason...</option>
                <option value="Refund Correction">Refund Correction</option>
                <option value="Settlement Error">Settlement Error</option>
                <option value="Promotional Adjustment">Promotional Adjustment</option>
                <option value="Manual Override">Manual Override</option>
                <option value="Other">Other (Requires Remarks)</option>
              </select>
              {errors.reason && <span className="text-[10px] text-rose-500 font-bold">{errors.reason}</span>}
            </div>

            {/* Remarks */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Internal Remarks</label>
              <textarea
                rows={3}
                placeholder="Describe details for ledger auditor reference..."
                value={formData.remarks}
                onChange={(e) => setFormData(p => ({ ...p, remarks: e.target.value }))}
                maxLength={500}
                className={`w-full p-3 bg-zinc-50 dark:bg-zinc-950 border rounded-lg text-xs font-semibold focus:ring-2 focus:ring-[var(--primary)] outline-none resize-none text-black dark:text-white ${errors.remarks ? 'border-rose-500' : 'border-zinc-200 dark:border-zinc-800'}`}
              ></textarea>
              <div className="flex justify-between items-center text-[9px] text-zinc-400 font-semibold mt-0.5">
                <span>{errors.remarks && <span className="text-rose-550 font-bold">{errors.remarks}</span>}</span>
                <span>{formData.remarks.length}/500</span>
              </div>
            </div>

            {/* Adjusted By Info Box */}
            <div className="p-3 bg-zinc-50 dark:bg-zinc-950/60 rounded-xl border border-zinc-150 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Adjusted By</span>
              <span className="text-xs font-black text-black dark:text-white">Admin Rashi (Super Admin)</span>
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-150 dark:border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.8 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-1.8 bg-[var(--primary)] text-white text-xs font-bold rounded-lg shadow hover:brightness-110 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
              >
                Apply Override
              </button>
            </div>

          </form>
        </div>
      </div>

      {/* Confirmation Step Dialog Overlay */}
      {showConfirm && (
        <div className="fixed inset-0 lg:left-[280px] z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="w-full max-w-[380px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl p-5 text-center flex flex-col items-center gap-3 transform transition-all animate-scale-up">
            <div className="p-3 rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-500 border border-rose-100 dark:border-rose-900/35">
              <AlertTriangle size={24} />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-black dark:text-white">Confirm Adjustment override?</h4>
              <p className="text-xs text-zinc-500 mt-1.5 font-medium leading-relaxed">
                Are you sure you want to apply this adjustment? This operation affects franchise commission settlement and alters ledger books.
              </p>
            </div>
            <div className="flex w-full gap-2 mt-2">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-1.8 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmit}
                className="flex-1 py-1.8 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg shadow-md hover:shadow-rose-650/20 active:scale-95 transition-all cursor-pointer"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
