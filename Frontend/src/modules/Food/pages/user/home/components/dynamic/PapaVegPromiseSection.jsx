import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Zap, Moon, Gift, Truck, Box, Bike, Flame, Award, 
  Heart, ShieldCheck, Sparkles, Wheat, Star, CheckCircle2,
  IndianRupee, Trophy
} from 'lucide-react';
import apiClient from '@/services/api/axios';
import { renderFormattedText } from '@food/utils/formatText';

// Fallback promise items matching Papa Veg Pizza promise commitments
const FALLBACK_PROMISE_DATA = {
  header: {
    title: 'Papa Veg Pizza Promise',
    subtitle: 'Where **quality food** meets **lowest prices**!',
    stars: '✨'
  },
  items: [
    {
      id: 'p-lowest-pricing',
      title: 'Lowest Pricing',
      description: 'No Surge Fees, No Surprises',
      icon: 'IndianRupee',
      badge: 'ONLY ON PAPA VEG PIZZA APP!'
    },
    {
      id: 'p-rewards',
      title: 'Rewards & Offers',
      description: 'Earn Cheesy Rewards to Grab your Free Pizza!',
      icon: 'Gift',
      badge: 'ONLY ON PAPA VEG PIZZA APP!'
    },
    {
      id: 'p-no-surge',
      title: 'No Weather Surge',
      description: 'Rain or Storm, our prices always stay the same',
      icon: 'Zap',
      badge: 'ONLY ON PAPA VEG PIZZA APP!'
    },
    {
      id: 'p-pure-veg',
      title: '100% Pure Vegetarian',
      description: 'Wholesome, untouched & strictly pure veg delight',
      icon: 'Heart',
      badge: 'ONLY ON PAPA VEG PIZZA APP!'
    },
    {
      id: 'p-free-delivery',
      title: 'Free Delivery @99',
      description: 'Unlock free delivery on orders above ₹99',
      icon: 'Bike',
      badge: 'ONLY ON PAPA VEG PIZZA APP!'
    },
    {
      id: 'p-delivery-experts',
      title: 'Delivery Experts',
      description: 'Delivered hot, fresh & perfectly packed to your door',
      icon: 'Truck',
      badge: 'ONLY ON PAPA VEG PIZZA APP!'
    }
  ]
};

// Icon component lookup
const ICON_LOOKUP = {
  Zap,
  Moon,
  Gift,
  Truck,
  Box,
  Bike,
  Flame,
  Award,
  Heart,
  ShieldCheck,
  Sparkles,
  Wheat,
  Star,
  CheckCircle2,
  IndianRupee,
  Trophy
};

// Helper to ensure title never repeats "Promise" and cleanly displays "Papa Veg Pizza Promise"
const normalizePromiseTitle = (title) => {
  if (!title) return 'Papa Veg Pizza Promise';
  let clean = title.trim().replace(/\s+/g, ' ');
  // Remove consecutive duplicated "Promise"
  clean = clean.replace(/(\bPromise\b)(\s+\1)+/gi, '$1');
  if (/^papa veg(\s+pizza)?(\s+promise)?$/i.test(clean)) {
    return 'Papa Veg Pizza Promise';
  }
  if (!/promise$/i.test(clean)) {
    return `${clean} Promise`;
  }
  return clean;
};

export function PapaVegPromiseSection({ isDarkMode }) {
  const navigate = useNavigate();
  const [promiseData, setPromiseData] = useState(FALLBACK_PROMISE_DATA);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const fetchPromiseCampaign = async () => {
      try {
        const res = await apiClient.get('/settings/promise-campaign?_t=' + Date.now());
        const data = res?.data?.data || res?.data;
        if (data && isMounted) {
          // Flatten items from all active tabs if present
          let allItems = [];
          if (Array.isArray(data.tabs) && data.tabs.length > 0) {
            data.tabs.forEach(tab => {
              if (Array.isArray(tab.items)) {
                tab.items.forEach(it => {
                  allItems.push({
                    id: it.id || it._id || ('item-' + Math.random()),
                    title: it.title || 'Papa Veg Promise',
                    description: it.description || '',
                    icon: it.icon || 'Award',
                    badge: tab.badgeText || 'ONLY ON PAPA VEG PIZZA APP!'
                  });
                });
              }
            });
          }

          if (allItems.length === 0) {
            allItems = FALLBACK_PROMISE_DATA.items;
          }

          setPromiseData({
            header: {
              title: data.header?.title ? normalizePromiseTitle(data.header.title) : FALLBACK_PROMISE_DATA.header.title,
              subtitle: data.header?.subtitle || FALLBACK_PROMISE_DATA.header.subtitle,
              stars: '✨'
            },
            items: allItems
          });
        }
      } catch (err) {
        console.warn('Could not fetch promise campaign, using fallback:', err);
      }
    };

    fetchPromiseCampaign();
    return () => { isMounted = false; };
  }, []);

  const handleNavigateToPromise = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentPath = window.location.pathname;
    const target = currentPath.startsWith('/food') ? '/food/user/promise' : '/user/promise';
    navigate(target);
  };

  // Render centered circular graphic with 3 cute golden stars around it
  const renderItemIllustration = (item) => {
    const iconName = item.icon || 'Award';
    const IconComponent = ICON_LOOKUP[iconName] || Award;
    const isPricing = iconName === 'IndianRupee' || (item.title || '').toLowerCase().includes('price') || (item.title || '').toLowerCase().includes('pricing');

    return (
      <div className="relative w-24 h-24 flex items-center justify-center my-3 select-none">
        {/* Decorative Golden Star - Top */}
        <span className="absolute top-1 left-9 text-amber-400 text-xs animate-pulse">★</span>
        {/* Decorative Golden Star - Left */}
        <span className="absolute top-7 left-1 text-amber-400 text-sm">★</span>
        {/* Decorative Golden Star - Right */}
        <span className="absolute top-8 right-1 text-amber-400 text-xs">★</span>

        {/* Soft Circular Backdrop */}
        <div className="w-20 h-20 rounded-full bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 flex items-center justify-center shadow-inner">
          {isPricing ? (
            /* Scalloped Rupee Medallion matching screenshot */
            <div className="relative w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-md">
              <span className="text-white font-semibold text-xl leading-none">₹</span>
              <div className="absolute -bottom-1 -left-0.5 w-3 h-3 bg-amber-600 rotate-45 rounded-xs" />
              <div className="absolute -bottom-1 -right-0.5 w-3 h-3 bg-amber-600 rotate-45 rounded-xs" />
            </div>
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-[var(--accent-red,#EE3A43)] flex items-center justify-center text-white shadow-md">
              <IconComponent size={24} strokeWidth={2.2} />
            </div>
          )}
        </div>
      </div>
    );
  };

  const headerTitle = normalizePromiseTitle(promiseData.header?.title || 'Papa Veg Pizza Promise');
  const headerSubtitle = promiseData.header?.subtitle || 'Where **quality food** meets **lowest prices**!';

  return (
    <section 
      className="my-5 select-none transition-all"
      style={{ fontFamily: 'Poppins, sans-serif' }}
    >
      {/* ── Section Header (Brand Theme) ── */}
      <div className="px-2 sm:px-3 mb-3">
        <div className="flex items-center gap-1.5">
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight text-[var(--accent-red,#EE3A43)] leading-tight m-0">
            {headerTitle}
          </h2>
          <span className="text-amber-400 text-base select-none">✨</span>
        </div>

        <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 font-medium mt-0.5 m-0">
          {renderFormattedText(headerSubtitle)}
        </p>
      </div>

      {/* ── Horizontal Scroll Cards Carousel ── */}
      <div className="flex overflow-x-auto hide-scrollbar gap-2.5 sm:gap-3 px-2 sm:px-3 pb-2 pt-1">
        {promiseData.items.map((item) => (
          <div
            key={item.id}
            onClick={handleNavigateToPromise}
            style={{
              backgroundColor: isDarkMode ? '#1a1a1a' : 'var(--secondary-off-white, #F8F6F2)',
              fontFamily: 'Poppins, sans-serif'
            }}
            className="w-[230px] sm:w-[250px] shrink-0 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between items-center text-center shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer group"
          >
            {/* Top Amber Pill Badge */}
            <div className="w-full flex justify-center">
              <span className="inline-block bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-semibold text-[9px] px-3 py-1 rounded-full uppercase tracking-wider shadow-2xs">
                {item.badge || 'ONLY ON PAPA VEG PIZZA APP!'}
              </span>
            </div>

            {/* Illustration Graphic with Stars */}
            {renderItemIllustration(item)}

            {/* Content Details */}
            <div className="w-full mt-1">
              <h3 className="text-sm sm:text-[15px] font-semibold text-zinc-900 dark:text-white leading-snug truncate m-0 font-['Poppins',sans-serif]">
                {item.title}
              </h3>
              <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-1 leading-relaxed line-clamp-2 m-0 font-['Poppins',sans-serif]">
                {item.description}
              </p>
            </div>

            {/* Action Link: Know More */}
            <div className="w-full mt-3 pt-2 border-t border-zinc-200/60 dark:border-zinc-800/80 flex items-center justify-center">
              <span 
                className="text-[var(--accent-red,#EE3A43)] font-semibold text-xs underline underline-offset-4 decoration-dotted decoration-[var(--accent-red,#EE3A43)]/60 group-hover:decoration-solid flex items-center gap-1 transition-all"
              >
                Know More
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default PapaVegPromiseSection;

