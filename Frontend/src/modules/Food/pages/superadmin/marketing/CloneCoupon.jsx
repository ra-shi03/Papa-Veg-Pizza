import React, { useState, useEffect } from 'react';
import { X, Info, Tag, Copy, RefreshCw } from 'lucide-react';
import { api } from './CouponsData';
import { toast } from 'sonner';

export default function CloneCoupon({ isOpen, onClose, coupon, onSuccess }) {
  const [newCode, setNewCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (coupon && isOpen) {
      setNewCode(`${coupon.code}_COPY`);
    }
  }, [coupon, isOpen]);

  if (!isOpen || !coupon) return null;

  const handleClone = async (e) => {
    e.preventDefault();
    if (!newCode.trim()) {
      toast.error('Please enter a new coupon code.');
      return;
    }

    setLoading(true);
    try {
      // Prepopulate all fields from existing coupon but replace the code
      const payload = {
        ...coupon,
        code: newCode.trim().toUpperCase(),
        title: `${coupon.title} (Clone)`,
        startDate: new Date().toISOString(),
        // Exclude DB metadata fields
        _id: undefined,
        createdAt: undefined,
        updatedAt: undefined,
        createdBy: undefined,
        usageCount: 0,
        revenueGenerated: 0
      };

      const cloned = await api.createCoupon(payload);
      toast.success(`Coupon cloned successfully as ${cloned.code}!`);
      if (onSuccess) onSuccess(cloned);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to clone coupon.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center lg:pl-[280px] p-4">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-xl p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-zinc-200 dark:border-zinc-800 mb-4">
          <div className="flex items-center gap-2 text-[var(--primary)]">
            <Copy size={18} />
            <h3 className="text-sm font-black text-zinc-900 dark:text-white">Clone Coupon: {coupon.code}</h3>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-all cursor-pointer">
            <X size={16} className="text-zinc-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleClone} className="space-y-4 text-xs font-semibold">
          <div className="p-3 bg-zinc-550/5 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-850 flex gap-2.5">
            <Info size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
            <p className="text-[10px] text-zinc-500 leading-normal">
              This will duplicate all usage conditions, geographic assignments, targeting, and applicability rules. Please specify a unique code for the new coupon.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider block">New Coupon Code*</label>
            <input 
              type="text" 
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
              className="w-full h-9 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-bold uppercase tracking-wider"
              placeholder="e.g. SUMMER50"
              required
            />
          </div>

          <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="h-8.5 px-3 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="h-8.5 px-4 bg-[var(--primary)] text-white text-xs font-bold rounded-lg shadow-md hover:bg-[var(--primary)]/90 transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  Cloning...
                </>
              ) : (
                'Clone Coupon'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
