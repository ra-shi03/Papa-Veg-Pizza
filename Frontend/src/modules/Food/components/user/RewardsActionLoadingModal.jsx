import React, { useState, useEffect } from 'react';
import rewardsLogo from '@/assets/rewards-logo.png';

/**
 * RewardsActionLoadingModal
 * 
 * Animated bottom sheet modal matching reference design (Image 1):
 * - Dimmed backdrop
 * - White bottom-sheet card with rounded top corners
 * - Centered circular badge with rotating green spinner ring
 * - Papa Veg Pizza Rewards logo (Image 2) centered inside
 * - Dynamic animated status text ("Leaving Cheesy Rewards...", "Enrolling for Cheesy Rewards...")
 */
export default function RewardsActionLoadingModal({
  isOpen = false,
  message = 'Leaving Cheesy Rewards...',
  programName = 'Cheesy Rewards',
  logoSrc = rewardsLogo,
}) {
  const [dots, setDots] = useState('');

  // Subtle animated ellipsis (. -> .. -> ...)
  useEffect(() => {
    if (!isOpen) {
      setDots('');
      return;
    }
    const interval = setInterval(() => {
      setDots(prev => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  // Extract base message without trailing dots if provided
  const baseMessage = message ? message.replace(/\.+$/, '') : `Leaving ${programName}`;

  return (
    <div 
      className="fixed inset-0 z-[120] flex flex-col justify-end items-center select-none"
      role="dialog"
      aria-modal="true"
      aria-live="polite"
    >
      {/* Dimmed backdrop overlay matching Reference Image */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-[1.5px] transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Animated Bottom Sheet Card */}
      <div 
        className="relative z-10 w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-[32px] shadow-2xl px-6 pt-9 pb-12 flex flex-col items-center justify-center animate-in slide-in-from-bottom duration-250 border-t border-zinc-150/70 dark:border-zinc-800"
        style={{ fontFamily: "'Poppins', sans-serif" }}
      >
        {/* Animated Circular Container with Rotating Green Ring */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center">
          {/* Rotating Green Spinner Ring */}
          <svg 
            className="absolute inset-0 w-full h-full animate-[spin_1.3s_linear_infinite]" 
            viewBox="0 0 100 100"
            fill="none"
          >
            {/* Background subtle guide ring */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#E5E7EB"
              strokeWidth="3.5"
              className="dark:stroke-zinc-800"
            />
            {/* Active Rotating Green Arc matching Reference Image 1 */}
            <circle
              cx="50"
              cy="50"
              r="44"
              stroke="#00875A"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray="210 70"
            />
          </svg>

          {/* White Circular Badge inside the ring */}
          <div className="w-[84px] h-[84px] sm:w-[96px] sm:h-[96px] rounded-full bg-white dark:bg-white flex items-center justify-center p-3 shadow-inner overflow-hidden">
            <img
              src={logoSrc || rewardsLogo || '/rewards-logo.png'}
              alt={programName || 'Papa Veg Pizza Rewards'}
              className="w-full h-full object-contain pointer-events-none drop-shadow-sm transition-transform duration-200 hover:scale-105"
              onError={(e) => {
                // Fallback to public folder path if bundled asset fails
                if (e.target.src !== '/rewards-logo.png') {
                  e.target.src = '/rewards-logo.png';
                }
              }}
            />
          </div>
        </div>

        {/* Animated Loading Text matching Reference Image 1 */}
        <div className="mt-6 text-center">
          <p className="text-[16px] sm:text-[17px] font-bold text-zinc-850 dark:text-zinc-100 tracking-tight">
            {baseMessage}
            <span className="inline-block w-6 text-left">{dots || '...'}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

