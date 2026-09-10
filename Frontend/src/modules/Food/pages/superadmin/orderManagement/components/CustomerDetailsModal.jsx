// CustomerDetailsModal.jsx
import React, { useState, useEffect } from 'react';
import { X, User, Phone, MapPin, Landmark, History, FileText } from 'lucide-react';
import { getCustomerDetailsApi } from '../AllOrdersData';
import { toast } from 'sonner';

export default function CustomerDetailsModal({ isOpen, onClose, customerId }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && customerId) {
      fetchCustomerDetails();
    }
  }, [isOpen, customerId]);

  const fetchCustomerDetails = async () => {
    setLoading(true);
    try {
      const data = await getCustomerDetailsApi(customerId);
      setCustomer(data);
    } catch (err) {
      toast.error('Failed to load customer details');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 select-none text-zinc-800 dark:text-zinc-150">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <User size={16} className="text-[var(--primary)]" />
            Customer account profile
          </h3>
          <button 
            className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        {loading ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading Customer analytics...</p>
          </div>
        ) : customer ? (
          <div className="p-4 space-y-4">
            
            {/* Brief info */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-lg border border-[var(--primary)]/20">
                {customer.name?.substring(0, 2).toUpperCase() || 'CU'}
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50 truncate">{customer.name}</h4>
                <p className="text-[9px] text-zinc-400 font-semibold uppercase">ID: {customer._id}</p>
              </div>
            </div>

            {/* Spending stats */}
            <div className="grid grid-cols-2 gap-3 text-xs font-semibold">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">Lifetime Orders</span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">{customer.lifetimeOrders} orders</span>
              </div>
              <div className="p-3 bg-zinc-50 dark:bg-zinc-950 rounded-xl space-y-1">
                <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">Total Value spent</span>
                <span className="text-sm font-mono text-[var(--primary)] font-bold">₹{customer.lifetimeSpend.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Location Address */}
            <div className="p-3 border border-zinc-205 dark:border-zinc-800 rounded-xl space-y-1 text-xs font-semibold">
              <span className="text-[9px] text-zinc-400 block uppercase tracking-wider flex items-center gap-1">
                <MapPin size={11} /> Saved Delivery Address
              </span>
              <p className="text-zinc-755 dark:text-zinc-350 leading-relaxed pt-1">
                {customer.address}
              </p>
            </div>

            {/* Recent Orders List */}
            <div className="p-3 border border-zinc-205 dark:border-zinc-800 rounded-xl space-y-2 text-xs font-semibold">
              <span className="text-[9px] text-zinc-400 block uppercase tracking-wider flex items-center gap-1">
                <History size={11} /> Recent Orders history
              </span>
              
              <div className="flex gap-2 flex-wrap">
                {customer.recentOrders?.map((ordNumber, idx) => (
                  <span key={idx} className="bg-zinc-50 dark:bg-zinc-950 text-zinc-705 dark:text-zinc-300 font-mono font-bold px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-805">
                    {ordNumber}
                  </span>
                ))}
              </div>
            </div>

            {/* Current Notes */}
            {customer.notes && (
              <div className="p-3 border border-dashed border-red-500/20 bg-red-500/5 rounded-xl space-y-1 text-xs font-semibold">
                <span className="text-[9px] text-red-500 block uppercase tracking-wider flex items-center gap-1">
                  <FileText size={11} /> Current Dispatch Instructions
                </span>
                <p className="text-zinc-650 dark:text-zinc-400 italic pt-1 leading-snug">
                  "{customer.notes}"
                </p>
              </div>
            )}

            {/* Footer action buttons */}
            <div className="pt-2 flex gap-3 border-t border-zinc-150 dark:border-zinc-800">
              <button 
                onClick={() => toast.info(`Navigating to customer profile details...`)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-755 text-white h-9 rounded-lg text-xs font-bold transition-all cursor-pointer active:scale-95 flex items-center justify-center gap-1.5"
              >
                <History size={13} />
                <span>View Full Profile</span>
              </button>
              <button 
                onClick={onClose}
                className="flex-1 border border-zinc-250 dark:border-zinc-700 text-zinc-705 dark:text-zinc-300 h-9 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Close Profile
              </button>
            </div>

          </div>
        ) : (
          <div className="p-6 text-center text-zinc-400 italic text-xs">Failed to load customer details.</div>
        )}

      </div>
    </div>
  );
}
