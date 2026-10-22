import React from 'react';
import { renderFormattedText } from '@food/utils/formatText';

// Built-in Animated Papa Veg Pizza Delivery Scooter SVG component
export const AnimatedDeliveryScooter = () => {
  return (
    <div className="relative w-12 h-12 flex items-center justify-center shrink-0 select-none">
      <style>{`
        @keyframes sunburst-rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes scooter-bob {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-1.5px); }
        }
        @keyframes wheel-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes headlight-glow {
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.75; }
        }
        .anim-sunburst {
          animation: sunburst-rotate 18s linear infinite;
          transform-origin: center;
        }
        .anim-scooter-body {
          animation: scooter-bob 1s ease-in-out infinite;
          transform-origin: center bottom;
        }
        .anim-wheel {
          animation: wheel-spin 1.2s linear infinite;
          transform-origin: center;
        }
        .anim-glow {
          animation: headlight-glow 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Radiant Sunburst Glow (matching reference screenshot, tailored to app theme) */}
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 w-full h-full anim-sunburst"
        style={{ pointerEvents: 'none' }}
      >
        <g fill="rgba(238, 58, 67, 0.12)">
          {/* 12 Radiant Rays */}
          {[...Array(12)].map((_, i) => (
            <path
              key={i}
              d="M 50 50 L 46 0 L 54 0 Z"
              transform={`rotate(${i * 30} 50 50)`}
            />
          ))}
        </g>
        <circle cx="50" cy="50" r="28" fill="rgba(255, 193, 7, 0.18)" />
      </svg>

      {/* Animated Papa Veg Delivery Scooter & Rider SVG */}
      <svg
        viewBox="0 0 120 100"
        className="relative w-11 h-11 anim-scooter-body"
      >
        <defs>
          {/* Headlight beam gradient */}
          <linearGradient id="headlight-beam" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#FFD54F" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFD54F" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Headlight Beam */}
        <polygon
          points="104,56 120,48 120,68 104,60"
          fill="url(#headlight-beam)"
          className="anim-glow"
        />

        {/* Rear Wheel (Spinning) */}
        <g transform="translate(30, 75)">
          <circle cx="0" cy="0" r="14" fill="#212121" />
          <circle cx="0" cy="0" r="9" fill="#9E9E9E" />
          <circle cx="0" cy="0" r="4" fill="#E0E0E0" />
          <g className="anim-wheel">
            <line x1="-9" y1="0" x2="9" y2="0" stroke="#424242" strokeWidth="1.5" />
            <line x1="0" y1="-9" x2="0" y2="9" stroke="#424242" strokeWidth="1.5" />
          </g>
        </g>

        {/* Front Wheel (Spinning) */}
        <g transform="translate(90, 75)">
          <circle cx="0" cy="0" r="14" fill="#212121" />
          <circle cx="0" cy="0" r="9" fill="#9E9E9E" />
          <circle cx="0" cy="0" r="4" fill="#E0E0E0" />
          <g className="anim-wheel">
            <line x1="-9" y1="0" x2="9" y2="0" stroke="#424242" strokeWidth="1.5" />
            <line x1="0" y1="-9" x2="0" y2="9" stroke="#424242" strokeWidth="1.5" />
          </g>
        </g>

        {/* Scooter Chassis / Mudguards (Brand Red #EE3A43) */}
        {/* Rear Mudguard */}
        <path d="M 16 75 A 14 14 0 0 1 44 75 L 42 66 Q 30 62 18 66 Z" fill="#EE3A43" />
        {/* Footboard */}
        <path d="M 40 70 L 68 70 L 72 63 L 44 63 Z" fill="#D32F2F" />
        {/* Front Apron & Steering Column */}
        <path d="M 68 70 L 84 48 L 94 48 L 91 66 L 78 72 Z" fill="#EE3A43" />
        {/* Front Mudguard */}
        <path d="M 76 75 A 14 14 0 0 1 104 75 L 102 68 Q 90 64 78 68 Z" fill="#C62828" />

        {/* Headlamp */}
        <ellipse cx="98" cy="53" rx="3.5" ry="5" fill="#FFF59D" />

        {/* Papa Veg Pizza Delivery Box on Rear Rack */}
        <rect x="14" y="40" width="24" height="22" rx="3" fill="#0D47A1" />
        <rect x="16" y="42" width="20" height="18" rx="2" fill="#1565C0" />
        {/* Papa Veg Dot on Box */}
        <rect x="22" y="47" width="8" height="8" rx="1.5" fill="#FFFFFF" />
        <circle cx="26" cy="51" r="2.5" fill="#169B45" />

        {/* Seat */}
        <path d="M 38 52 Q 48 48 58 54 Q 48 57 38 55 Z" fill="#212121" />

        {/* Delivery Rider */}
        {/* Legs / Pants */}
        <path d="M 46 54 L 56 68 L 68 68 L 60 56 Z" fill="#37474F" />
        {/* Torso / Jacket */}
        <path d="M 48 38 L 64 36 L 72 50 L 52 54 Z" fill="#1976D2" />
        {/* Arm reaching handle */}
        <path d="M 60 40 L 76 46 L 82 48" stroke="#1976D2" strokeWidth="4.5" strokeLinecap="round" fill="none" />
        {/* Hand */}
        <circle cx="83" cy="48" r="3" fill="#FFCC80" />
        {/* Neck */}
        <rect x="58" y="30" width="5" height="7" fill="#FFCC80" />
        {/* Helmet (Brand Red #EE3A43) */}
        <circle cx="62" cy="24" r="10" fill="#EE3A43" />
        {/* Visor */}
        <path d="M 66 21 Q 72 24 68 28 L 63 26 Z" fill="#212121" />
      </svg>
    </div>
  );
};

export default function DeliveryCardAboveNav({ config, isDarkMode = false }) {
  // Defaults
  const deliveryData = config || {
    enabled: true,
    title: 'Lowest Prices on Papa Veg Pizza App & Free Delivery',
    subtitle: 'Add items worth ₹99 to get FREE delivery!',
    iconType: 'animation',
    iconUrl: '',
    animationType: 'scooter'
  };

  if (deliveryData.enabled === false) {
    return null;
  }

  const titleText = deliveryData.title || 'Lowest Prices on Papa Veg Pizza App & Free Delivery';
  const subtitleText = deliveryData.subtitle || 'Add items worth ₹99 to get FREE delivery!';

  return (
    <aside 
      aria-label="Free Delivery Information"
      className="fixed bottom-[60px] left-0 right-0 z-40 flex justify-center pointer-events-none select-none transition-all duration-300"
    >
      <div className="w-full max-w-md pointer-events-auto px-0">
        <div
          style={{
            backgroundColor: isDarkMode ? '#18181b' : 'var(--secondary-off-white, #FFFFFF)',
            fontFamily: 'Poppins, sans-serif'
          }}
          className="w-full border-t border-x border-zinc-200/90 dark:border-zinc-800 rounded-t-2xl px-3.5 py-2 sm:py-2.5 flex items-center gap-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] dark:shadow-[0_-4px_16px_rgba(0,0,0,0.3)] cursor-default select-none"
        >
          {/* Left: Delivery Graphic (Animation or Image) */}
          <div className="shrink-0 flex items-center justify-center">
            {deliveryData.iconType === 'image' && deliveryData.iconUrl ? (
              <div className="relative w-12 h-12 flex items-center justify-center rounded-xl overflow-hidden bg-amber-50/60 dark:bg-amber-950/20">
                <img
                  src={deliveryData.iconUrl}
                  alt="Delivery"
                  className="w-10 h-10 object-contain drop-shadow-xs"
                />
              </div>
            ) : deliveryData.iconType === 'animation' && deliveryData.iconUrl ? (
              <div className="relative w-12 h-12 flex items-center justify-center">
                <img
                  src={deliveryData.iconUrl}
                  alt="Delivery Animation"
                  className="w-11 h-11 object-contain"
                />
              </div>
            ) : (
              /* Built-in high performance Animated Delivery Scooter */
              <AnimatedDeliveryScooter />
            )}
          </div>

          {/* Center Content: Title & Subtitle */}
          <div className="flex-1 min-w-0">
            <h4 className="text-[12.5px] sm:text-[13.5px] font-semibold text-zinc-900 dark:text-white leading-tight tracking-tight truncate m-0">
              {titleText}
            </h4>

            <p className="text-[10.5px] sm:text-[11.5px] text-zinc-600 dark:text-zinc-400 font-medium leading-snug mt-0.5 m-0 line-clamp-1">
              {renderFormattedText(subtitleText)}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}

