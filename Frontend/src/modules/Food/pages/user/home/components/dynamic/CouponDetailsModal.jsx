import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function CouponDetailsModal({ offer, isOpen, onClose, onApply, isDarkMode }) {
  if (!isOpen || !offer) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal content */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className={`relative w-full sm:max-w-md max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden ${
            isDarkMode ? 'bg-zinc-900 text-zinc-100' : 'bg-white text-zinc-900'
          }`}
        >
          {/* Header */}
          <div className={`flex justify-between items-center px-4 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-zinc-200'}`}>
            <div className="flex items-center gap-2">
              {offer.iconImage ? (
                <img src={offer.iconImage} alt="" className="w-8 h-8 object-contain rounded-md" />
              ) : (
                <div className="w-8 h-8 bg-primary/10 rounded-md flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined">local_offer</span>
                </div>
              )}
              <h3 className="font-bold font-headline-sm-mobile m-0">{offer.title}</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-4 hide-scrollbar">
            {offer.subtitle && (
              <p className={`text-sm mb-4 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-600'}`}>
                {offer.subtitle}
              </p>
            )}

            {(offer.couponCode || (offer.actionValue && offer.actionType === 'apply_coupon')) && (
              <div className="mb-6 inline-flex items-center">
                <div className={`px-3 py-1.5 border border-dashed rounded text-xs font-bold font-mono tracking-wider ${isDarkMode ? 'border-white/30 text-zinc-200' : 'border-zinc-300 text-zinc-800'}`}>
                  <span className={`font-normal font-sans mr-2 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>Coupon Code:</span>
                  {offer.couponCode || offer.actionValue}
                </div>
              </div>
            )}

            {(offer.minOrderValue > 0 || offer.maxDiscount > 0) && (
              <div className="flex gap-4 mb-4">
                {offer.minOrderValue > 0 && (
                  <div className={`flex flex-col text-xs p-2 rounded border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
                    <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Min Order</span>
                    <span className="font-bold font-mono text-sm">₹{offer.minOrderValue}</span>
                  </div>
                )}
                {offer.maxDiscount > 0 && (
                  <div className={`flex flex-col text-xs p-2 rounded border ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-zinc-200 bg-zinc-50'}`}>
                    <span className={isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}>Max Discount</span>
                    <span className="font-bold font-mono text-sm">₹{offer.maxDiscount}</span>
                  </div>
                )}
              </div>
            )}

            <h4 className="font-bold mb-3 text-[14px]">Offer Details::</h4>
            
            {offer.offerDetails && offer.offerDetails.length > 0 ? (
              <ul className={`text-[13px] leading-snug space-y-3 pl-5 list-disc ${isDarkMode ? 'text-zinc-400 marker:text-zinc-600' : 'text-zinc-600 marker:text-zinc-400'}`}>
                {offer.offerDetails.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            ) : (
              <p className={`text-[13px] ${isDarkMode ? 'text-zinc-500' : 'text-zinc-500'}`}>
                No additional terms provided for this offer.
              </p>
            )}
            
            {/* Extra padding at bottom to ensure scrolling above fixed button */}
            <div className="h-6" />
          </div>

          {/* Footer (Fixed) */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-white/10 bg-zinc-900/90' : 'border-zinc-200 bg-white/90'} backdrop-blur-md`}>
            <button 
              onClick={() => {
                onApply(offer);
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-primary text-white font-bold tracking-wide active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
            >
              Apply Offer
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

