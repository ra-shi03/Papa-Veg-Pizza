import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import logoNew from '@/assets/logo1.png';
import { useScrollLock } from "@food/hooks/useScrollLock";

export function CouponDetailsModal({ offer, isOpen, onClose, onApply, isDarkMode }) {
  const [copied, setCopied] = useState(false);
  const [logoSrc, setLogoSrc] = useState(() => localStorage.getItem("sa_logo") || logoNew);

  // Lock background scroll when open
  useScrollLock(Boolean(isOpen && offer));

  if (!isOpen || !offer) return null;

  const code = offer.couponCode || offer.code || "PVPDEAL";
  const minOrder = offer.minOrderValue || offer.minimumOrderAmount || 199;
  const maxDiscount = offer.maxDiscount || offer.maximumDiscount || 80;
  const isPercentage = offer.isPercentage || offer.couponType === "Percentage" || offer.discountType === "percentage";
  const discountText = offer.discountText || (isPercentage ? `${offer.value || 40}% (up to ₹${maxDiscount})` : `₹${offer.value || maxDiscount}`);
  const validTill = offer.validTill || "Today 11:00 PM";
  const isFirstOrderOnly = offer.isFirstOrderOnly || false;

  const handleCopyCode = (e) => {
    e?.stopPropagation();
    try {
      navigator.clipboard?.writeText(code);
    } catch (_) {}
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Structured details with icons matching Domino's reference (Image 3) with interactive UI
  const detailsList = [
    {
      id: "code-desc",
      icon: "percent",
      iconColor: "text-[var(--accent-red,#EE3A43)] bg-red-50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/40",
      text: (
        <span>
          Use code <strong className="font-semibold text-zinc-900 dark:text-white font-mono">{code}</strong> and get up to <strong className="font-semibold text-zinc-900 dark:text-white">₹{maxDiscount} off</strong> on orders worth ₹{minOrder} or more.
        </span>
      )
    },
    {
      id: "min-order",
      icon: "shopping_bag",
      iconColor: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/40",
      text: (
        <span>
          Offer is applicable on a minimum order value of <strong className="font-semibold text-zinc-900 dark:text-white">₹{minOrder}</strong> and above.
        </span>
      )
    },
    {
      id: "max-savings",
      icon: "savings",
      iconColor: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/40",
      text: (
        <span>
          Maximum discount to be availed via this coupon will be <strong className="font-semibold text-zinc-900 dark:text-white">₹{maxDiscount}</strong>.
        </span>
      )
    },
    {
      id: "validity",
      icon: "schedule",
      iconColor: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border border-blue-200/50 dark:border-blue-900/40",
      text: (
        <span>
          Offer is applicable till <strong className="font-semibold text-zinc-900 dark:text-white">{validTill}</strong>.
        </span>
      )
    },
    {
      id: "combination",
      icon: "do_not_disturb_on",
      iconColor: "text-zinc-600 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700",
      text: (
        <span>
          Offer cannot be combined with any other coupon or promo code.
        </span>
      )
    },
    {
      id: "delivery",
      icon: "moped",
      iconColor: "text-purple-600 bg-purple-50 dark:bg-purple-950/40 border border-purple-200/50 dark:border-purple-900/40",
      text: (
        <span>
          Offer is applicable on Delivery and Takeaway orders.
        </span>
      )
    },
    {
      id: "combos",
      icon: "lunch_dining",
      iconColor: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/40",
      text: (
        <span>
          Coupon not applicable if Everyday Value Offers or flat price combos are present in cart.
        </span>
      )
    },
    {
      id: "platform",
      icon: "storefront",
      iconColor: "text-teal-600 bg-teal-50 dark:bg-teal-950/40 border border-teal-200/50 dark:border-teal-900/40",
      text: (
        <span>
          This offer is applicable only on orders via Papa Veg Pizza App & Website.
        </span>
      )
    },
    {
      id: "retry",
      icon: "replay",
      iconColor: "text-orange-600 bg-orange-50 dark:bg-orange-950/40 border border-orange-200/50 dark:border-orange-900/40",
      text: (
        <span>
          In case of payment failure or cancellation, please retry after 15 minutes.
        </span>
      )
    }
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 select-none font-['Poppins',sans-serif] touch-none">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm cursor-pointer"
        />

        {/* Modal content */}
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 26, stiffness: 220 }}
          className={`relative w-full sm:max-w-md max-h-[88vh] sm:max-h-[85vh] flex flex-col rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden touch-auto ${
            isDarkMode ? 'bg-[#18181b] text-zinc-100' : 'bg-white text-zinc-900'
          }`}
        >
          {/* Top Bar with Brand Logo and Close Button (matching Image 3) */}
          <div className={`flex justify-between items-center px-5 pt-4 pb-3 border-b ${isDarkMode ? 'border-white/10' : 'border-zinc-100'}`}>
            <div className="flex items-center gap-2.5">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Papa Veg Pizza"
                  className="h-8 w-auto object-contain max-w-[130px]"
                  onError={() => {
                    if (logoSrc !== logoNew) {
                      setLogoSrc(logoNew);
                    } else {
                      setLogoSrc(null);
                    }
                  }}
                />
              ) : (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-50 dark:bg-red-950/40 text-[var(--accent-red,#EE3A43)]">
                  <span className="material-symbols-outlined text-[18px]">local_pizza</span>
                  <span className="text-xs font-semibold tracking-tight">Papa Veg Pizza</span>
                </div>
              )}
            </div>
            <button 
              type="button"
              onClick={onClose} 
              className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer border-0 bg-transparent"
            >
              <span className="material-symbols-outlined text-[22px]">close</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-4 hide-scrollbar">
            {/* Title & Subtitle */}
            <h3 className="font-semibold text-lg sm:text-[19px] text-zinc-900 dark:text-white leading-tight m-0">
              {offer.title}
            </h3>
            <p className={`text-xs mt-1.5 leading-relaxed ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {offer.subtitle}
            </p>

            {/* Coupon Code Box with Dashed Border & 1-Click Copy (matching Image 3) */}
            <div className={`mt-4 mb-4 p-3 rounded-xl border border-dashed flex items-center justify-between transition-colors ${
              isDarkMode 
                ? 'border-white/20 bg-white/5' 
                : 'border-zinc-300 bg-zinc-50/80'
            }`}>
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-medium">Coupon Code:</span>
                <span className="text-sm font-semibold font-mono tracking-widest text-[var(--accent-red,#EE3A43)]">
                  {code}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="px-3 py-1 rounded-lg text-xs font-semibold bg-[var(--accent-red,#EE3A43)] text-white hover:opacity-90 active:scale-95 transition-all flex items-center gap-1 cursor-pointer border-0"
              >
                <span className="material-symbols-outlined text-[14px]">
                  {copied ? "check" : "content_copy"}
                </span>
                <span>{copied ? "Copied" : "Copy"}</span>
              </button>
            </div>

            {/* Divider */}
            <div className={`border-t my-4 ${isDarkMode ? 'border-white/10' : 'border-zinc-100'}`} />

            {/* Offer Details Section Header */}
            <h4 className="font-semibold text-sm text-zinc-900 dark:text-white mb-3 tracking-tight">
              Offer Details::
            </h4>
            
            {/* Interactive Terms & Conditions with Modern Icons (matching user prompt) */}
            <div className="space-y-3">
              {detailsList.map((item) => (
                <div 
                  key={item.id} 
                  className={`flex items-start gap-3 p-2.5 rounded-xl transition-colors ${
                    isDarkMode ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${item.iconColor}`}>
                    <span className="material-symbols-outlined text-[16px]">
                      {item.icon}
                    </span>
                  </div>
                  <div className={`text-xs leading-relaxed ${isDarkMode ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {item.text}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="h-4" />
          </div>

          {/* Sticky Bottom Apply Button (matching Image 3) */}
          <div className={`p-4 border-t ${isDarkMode ? 'border-white/10 bg-[#18181b]/95' : 'border-zinc-100 bg-white/95'} backdrop-blur-md`}>
            <button 
              type="button"
              onClick={() => {
                onApply(offer);
                onClose();
              }}
              className="w-full py-3.5 rounded-xl bg-[var(--accent-red,#EE3A43)] hover:bg-[#d92d36] text-white font-semibold text-sm tracking-wide shadow-md shadow-red-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer border-0 uppercase"
            >
              <span>Apply Offer</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
