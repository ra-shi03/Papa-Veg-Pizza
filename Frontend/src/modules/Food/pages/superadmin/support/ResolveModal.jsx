import React, { useState } from 'react';
import { X, CheckCircle, Gift, Star } from 'lucide-react';
import { toast } from 'sonner';

export default function ResolveModal({ isOpen, onClose, complaintId, onResolveSuccess }) {
  const [notes, setNotes] = useState('');
  const [coupon, setCoupon] = useState('');
  const [rating, setRating] = useState('5');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error('Please enter resolution notes');
      return;
    }

    setLoading(true);
    // Simulate PATCH /api/customer-complaints/:id/resolve
    setTimeout(() => {
      setLoading(false);
      toast.success('Complaint successfully marked as Resolved');
      if (onResolveSuccess) {
        onResolveSuccess(notes, coupon, rating);
      }
      onClose();
    }, 1000);
  };

  const coupons = [
    { code: 'APOLOGY50', label: '₹50 Off Next Order (APOLOGY50)' },
    { code: 'FREEPIZZA', label: 'Free Personal Margherita Pizza (FREEPIZZA)' },
    { code: 'SORRY100', label: '₹100 Off Next Order (SORRY100)' },
    { code: 'DELIVERYFREE', label: 'Free Delivery for 3 Orders (DELIVERYFREE)' }
  ];

  return (
    <div className="fixed top-[52px] left-0 lg:left-[280px] right-0 bottom-0 z-[9999] flex items-center justify-center p-4 bg-zinc-900/50 dark:bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-250">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col animate-in zoom-in-95 duration-250" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">Resolve Complaint</h2>
            <p className="text-[10px] text-zinc-500">Complaint ID: {complaintId}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors">
            <X className="w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          
          {/* Resolution Notes */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 block">Resolution Action Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail the actions taken to resolve the complaint (e.g., store replaced order, refunded, etc.)..."
              rows="4"
              required
              className="w-full p-2 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none resize-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
            />
          </div>

          {/* Compensation Coupon */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 flex items-center gap-1">
              <Gift className="w-3.5 h-3.5 text-zinc-500" />
              Compensation Coupon (Optional)
            </label>
            <select
              value={coupon}
              onChange={(e) => setCoupon(e.target.value)}
              className="w-full h-9 px-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-300 dark:border-zinc-700 rounded-lg text-xs text-zinc-900 dark:text-zinc-50 outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
            >
              <option value="">No Coupon Compensated</option>
              {coupons.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Expected CSAT Rating */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-zinc-600 dark:text-zinc-455 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 text-yellow-500" />
              Customer Satisfaction Estimate
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setRating(num.toString())}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border font-bold text-xs transition-all active:scale-95 ${
                    rating === num.toString()
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-450 shadow-sm'
                      : 'border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'
                  }`}
                >
                  {num}★
                </button>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-zinc-150 dark:border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-8 rounded-lg text-xs font-bold text-zinc-600 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 h-8 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1.5"
            >
              {loading ? 'Resolving...' : (
                <>
                  <CheckCircle className="w-3.5 h-3.5" />
                  Resolve Complaint
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
