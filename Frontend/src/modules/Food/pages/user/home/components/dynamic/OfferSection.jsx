import React from 'react';
import { motion } from 'framer-motion';

// Skeleton loader for a single card
export function OfferCardSkeleton() {
  return (
    <div className="flex-[0_0_88vw] sm:flex-[0_0_350px] h-[52px]" style={{ scrollSnapAlign: 'start' }}>
      <div className="w-full h-full rounded-md bg-gray-200 dark:bg-zinc-800 animate-pulse border border-black/5 dark:border-white/5" />
    </div>
  );
}

// The individual Offer Card
export function OfferCard({ offer, onActionClick, isDarkMode }) {
  return (
    <div
      className={`w-full h-full rounded-md p-2 px-3 flex justify-between items-center border shadow-sm ${
        isDarkMode ? 'bg-zinc-800 border-white/10 text-white' : 'bg-white border-zinc-200 text-zinc-900'
      }`}
    >
      <div className="flex gap-3 items-center flex-1 min-w-0 pr-2">
        <div className="flex-shrink-0 flex items-center justify-center">
          <svg width="26" height="26" viewBox="0 0 24 24" fill={isDarkMode ? '#ffffff' : '#000000'} xmlns="http://www.w3.org/2000/svg">
            <path d="M12 1.5l2.6 2.4 3.4-.4 1.3 3.1 3.2 1.4-1.3 3.2 1.3 3.2-3.2 1.4-1.3 3.1-3.4-.4-2.6 2.4-2.6-2.4-3.4.4-1.3-3.1-3.2-1.4 1.3-3.2-1.3-3.2 3.2-1.4 1.3-3.1 3.4.4z" />
            <path d="M15.5 8.5l-7 7" stroke={isDarkMode ? '#27272a' : '#ffffff'} strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="9" cy="9" r="1.5" fill={isDarkMode ? '#27272a' : '#ffffff'} />
            <circle cx="15" cy="15" r="1.5" fill={isDarkMode ? '#27272a' : '#ffffff'} />
          </svg>
        </div>
        
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          <h4 className="font-bold text-[12px] sm:text-[13px] leading-tight m-0 line-clamp-1">
            {offer.title}
          </h4>
          {offer.subtitle && (
            <p className={`text-[10px] sm:text-[11px] font-medium m-0 line-clamp-1 leading-snug mt-0.5 ${isDarkMode ? 'text-zinc-300' : 'text-zinc-500'}`}>
              {offer.subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end shrink-0 pl-2">
        <button
          onClick={() => onActionClick(offer)}
          className="border border-primary text-primary rounded-md px-3 py-1 text-[11px] font-bold active:scale-95 transition-transform whitespace-nowrap bg-primary/5 hover:bg-primary/10"
          aria-label={`View offer: ${offer.title}`}
        >
          {offer.buttonText || 'View'}
        </button>
      </div>
    </div>
  );
}

// The Section container
export function OfferSection({ offers = [], isLoading = false, onActionClick, isDarkMode }) {
  if (!isLoading && (!offers || offers.length === 0)) {
    return null; // Hide section if no offers
  }

  return (
    <section className="mt-4 mb-2">
      <div className="px-margin-mobile mb-3">
        <h3
          className="font-headline-lg-mobile font-bold text-[16px]"
          style={{ color: isDarkMode ? '#fff' : 'var(--primary-gray)', margin: 0 }}
        >
          Offers for you
        </h3>
      </div>

      {/* Horizontal Scroll Container */}
      <div 
        className="flex overflow-x-auto hide-scrollbar gap-3 pb-2 px-margin-mobile"
        style={{ scrollSnapType: 'x mandatory', scrollPaddingLeft: '20px', paddingLeft: '20px', paddingRight: '20px' }}
      >
        {isLoading ? (
          // Skeleton State
          <>
            <OfferCardSkeleton />
            <OfferCardSkeleton />
          </>
        ) : (
          // Actual Offers
          offers.map((offer, index) => (
            <div 
              key={offer._id || index} 
              style={{ scrollSnapAlign: 'start', height: '52px' }} 
              className="flex-[0_0_88vw] sm:flex-[0_0_350px]"
            >
              <OfferCard 
                offer={offer} 
                onActionClick={onActionClick} 
                isDarkMode={isDarkMode}
              />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
