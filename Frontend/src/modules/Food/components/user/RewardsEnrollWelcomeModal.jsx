import React from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * RewardsEnrollWelcomeModal
 * 
 * Animated bottom sheet modal matching reference design (Image 2):
 * - Dimmed backdrop with blur
 * - Rounded bottom sheet card with smooth slide-up animation
 * - Top-right close button (X)
 * - Animated green circular checkmark badge with spring pop-in
 * - Title: "Welcome to Cheesy Rewards!"
 * - Subtitle: "Place your order to earn Reward points"
 * - Full-width "Order Now" button that routes to menu
 */
export default function RewardsEnrollWelcomeModal({
  isOpen = false,
  onClose,
  onOrderNow,
  programName = 'Cheesy Rewards',
  title,
  subtitle = 'Place your order to earn Reward points',
  buttonText = 'Order Now',
}) {
  const modalTitle = title || `Welcome to ${programName || 'Cheesy Rewards'}!`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[120] flex flex-col justify-end items-center select-none"
          role="dialog"
          aria-modal="true"
        >
          {/* Dimmed backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-[1.5px]"
            aria-hidden="true"
          />

          {/* Bottom Sheet Card */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[30px] shadow-2xl px-6 pt-6 pb-7 sm:pb-8 flex flex-col items-center border-t border-zinc-150/70 dark:border-zinc-800"
            style={{ fontFamily: "'Poppins', sans-serif" }}
          >
            {/* Close Button (X) in Top-Right Corner */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close modal"
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer border-0 bg-transparent"
            >
              <X className="w-5 h-5 stroke-[2.4]" />
            </button>

            {/* Animated Green Checkmark Badge */}
            <motion.div
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: [0.2, 1.15, 0.95, 1], opacity: 1 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#00875A] flex items-center justify-center mt-3 mb-6 shadow-lg shadow-emerald-600/25 shrink-0"
            >
              <motion.svg
                className="w-10 h-10 text-white"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ delay: 0.18, duration: 0.35, ease: 'easeOut' }}
              >
                <motion.path d="M5 13l4 4L19 7" />
              </motion.svg>
            </motion.div>

            {/* Title */}
            <h3 className="text-[20px] sm:text-[22px] font-bold text-zinc-900 dark:text-white tracking-tight text-center mb-1.5 leading-snug">
              {modalTitle}
            </h3>

            {/* Subtitle */}
            <p className="text-[13.5px] sm:text-[14.5px] text-zinc-500 dark:text-zinc-400 font-normal text-center leading-relaxed mb-6 sm:mb-7 max-w-xs">
              {subtitle}
            </p>

            {/* Order Now Button */}
            <button
              type="button"
              onClick={onOrderNow}
              className="w-full py-3.5 px-4 rounded-xl bg-[#EE3A43] hover:bg-[#d92d36] text-white font-bold text-[15px] sm:text-base tracking-wide shadow-md shadow-red-500/25 active:scale-[0.98] transition-all cursor-pointer border-0 flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
            >
              {buttonText}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

