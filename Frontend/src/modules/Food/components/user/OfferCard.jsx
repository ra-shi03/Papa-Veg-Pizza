import React from 'react';

export default function OfferCard({ offer, onClick }) {
  if (!offer) return null;

  return (
    <div 
      className="flex flex-col justify-center min-w-[280px] max-w-[320px] rounded-xl p-4 cursor-pointer hover:shadow-lg transition-shadow relative overflow-hidden bg-primary"
      onClick={() => onClick && onClick(offer)}
    >
      <div className="flex items-start justify-between relative z-10">
        <div className="flex flex-col gap-1 w-3/4">
          <div className="flex items-center gap-2 text-white">
            {offer.iconImage ? (
              <img src={offer.iconImage} alt="icon" className="w-5 h-5 object-contain" />
            ) : (
              <span className="text-xl">{'%'}</span>
            )}
            <h3 className="font-bold text-lg leading-tight line-clamp-1">{offer.title}</h3>
          </div>
          {offer.subtitle && (
            <p className="text-white/90 text-xs font-medium line-clamp-2 mt-1">
              {offer.subtitle}
            </p>
          )}
        </div>
        <div className="bg-white text-zinc-900 rounded-md px-3 py-1.5 text-xs font-bold shadow-sm whitespace-nowrap">
          {offer.buttonText || 'View'}
        </div>
      </div>
      
      {/* Decorative background circle */}
      <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-white/10 rounded-full blur-xl pointer-events-none" />
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-black/5 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
}

