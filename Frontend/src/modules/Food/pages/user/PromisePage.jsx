import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Zap, Moon, Gift, Truck, Box, Bike, 
  Flame, Award, Heart, ShieldCheck, Sparkles, Wheat,
  CheckCircle2, Star, ChevronRight
} from 'lucide-react';
import { apiClient } from '../../../../services/api/axios';
import { renderFormattedText } from '@food/utils/formatText';

// Icon map for dynamic rendering
const ICON_MAP = {
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
  CheckCircle2
};

export default function PromisePage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('lowest-pricing');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const isManualScrollingRef = useRef(false);

  const handleOrderNow = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const currentPath = window.location.pathname;
    const targetPath = currentPath.startsWith('/food') ? '/food/user/menu' : '/user/menu';
    navigate(targetPath);
  };

  useEffect(() => {
    const fetchPromiseData = async () => {
      try {
        const res = await apiClient.get('/settings/promise-campaign');
        const campaignData = res?.data?.data || res?.data;
        if (campaignData) {
          setData(campaignData);
          if (campaignData.tabs && campaignData.tabs.length > 0) {
            setActiveTab(campaignData.tabs[0].id);
          }
        }
      } catch (err) {
        console.warn('Using default promise campaign data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPromiseData();
  }, []);

  // Fallback data matching brand promise defaults
  const fallbackData = {
    header: {
      title: 'Papa Veg Promise',
      subtitle: 'Where **quality food** meets **honest prices**!',
      stars: '★★',
      orderButtonText: 'Order Now',
      badgeText: 'Promise',
      showBadge: true
    },
    tabs: [
      {
        id: 'lowest-pricing',
        name: 'LOWEST PRICING',
        badgeText: 'Only on the Papa Veg Pizza App!',
        items: [
          {
            id: 'lp-1',
            title: 'No Weather Surge',
            description: 'Rain or Storm, our prices stay the same',
            icon: 'Zap'
          },
          {
            id: 'lp-2',
            title: 'No Late Night Fee',
            description: 'Mid-night cravings come with zero extra charges',
            icon: 'Moon'
          },
          {
            id: 'lp-3',
            title: 'Rewards & Offers',
            description: 'Earn Cheesy Rewards to Grab Your Free Pizza!',
            icon: 'Gift'
          },
          {
            id: 'lp-4',
            title: 'Pizza Delivery Experts',
            description: 'Delivered by Our Own Riders? Hot, Fresh & Perfectly Packed!',
            icon: 'Truck'
          },
          {
            id: 'lp-5',
            title: 'Lowest Packaging Fees',
            description: 'Now, save on packaging, splurge on pizzas',
            icon: 'Box'
          },
          {
            id: 'lp-6',
            title: 'Free Delivery @99',
            description: 'Unlock free delivery on all your orders with a minimum order of just ₹99',
            icon: 'Bike'
          }
        ]
      },
      {
        id: 'highest-quality',
        name: 'HIGHEST QUALITY',
        badgeText: 'Great food, no compromises!',
        items: [
          {
            id: 'hq-1',
            title: 'Freshly Baked, Not Frozen',
            description: 'Pizza baked on order by experts, served piping hot!',
            icon: 'Flame'
          },
          {
            id: 'hq-2',
            title: 'Pure Mozzarella Cheese',
            description: 'Curated by experts for a perfect stretch',
            icon: 'Award'
          },
          {
            id: 'hq-3',
            title: '100% Pure Vegetarian',
            description: 'Wholesome, untouched & strictly pure veg ingredients',
            icon: 'Heart'
          },
          {
            id: 'hq-4',
            title: 'No Additives',
            description: 'No artificial preservatives, colours & flavours',
            icon: 'ShieldCheck'
          },
          {
            id: 'hq-5',
            title: 'Added Nutrients',
            description: 'Our pizza base is fortified with Iron, Folic Acid & Vitamin B12',
            icon: 'Sparkles'
          },
          {
            id: 'hq-6',
            title: '100% Wheat Crust',
            description: 'Relish our range of wheat based thin crust pizzas',
            icon: 'Wheat'
          }
        ]
      }
    ]
  };

  const currentData = data || fallbackData;
  const tabs = currentData.tabs || [];

  // ScrollSpy: Automatically switch active tab when user scrolls between sections
  useEffect(() => {
    const handleScroll = () => {
      if (isManualScrollingRef.current) return;

      const scrollPosition = window.scrollY + 130; // offset accounts for sticky header

      for (let i = tabs.length - 1; i >= 0; i--) {
        const tab = tabs[i];
        const el = document.getElementById(`promise-section-${tab.id}`);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveTab(tab.id);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tabs]);

  // Smooth scroll to section when tab pill is clicked
  const scrollToTab = (tabId) => {
    setActiveTab(tabId);
    const targetElem = document.getElementById(`promise-section-${tabId}`);
    if (targetElem) {
      isManualScrollingRef.current = true;
      const yOffset = -75; // sticky header bar height offset
      const y = targetElem.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      setTimeout(() => {
        isManualScrollingRef.current = false;
      }, 700);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-[var(--primary)] selection:text-white pb-28">
      
      {/* Top Banner & Header Card with Red Gradient and Reduced Bottom Border Radius */}
      <div>
        <div className="bg-gradient-to-b from-[#F8F6F2] via-[#FFF5F5] to-[#FEE8E8] dark:from-zinc-900 dark:via-zinc-900 dark:to-rose-950/30 border-b border-rose-200/60 dark:border-zinc-800 rounded-b-2xl shadow-xs px-4 pt-4 pb-5">
          <div className="max-w-lg mx-auto">
            {/* Top Bar with Back Button */}
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={handleOrderNow}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-zinc-800 dark:text-zinc-200"
                aria-label="Back to menu"
              >
                <ArrowLeft size={22} />
              </button>
              <div className="w-10" />
            </div>

            {/* Brand Title & Subtitle */}
            <div className="text-center space-y-1">
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-[var(--primary,#E53935)] tracking-tight font-sans">
                  {currentData.header?.title || "Papa Veg Promise"}
                </h1>
                {/* Interactive Quality Guarantee Badge */}
                {currentData.header?.showBadge !== false && (currentData.header?.badgeText || "Promise") && (
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#169B45]/15 text-[#169B45] border border-[#169B45]/30 hover:bg-[#169B45]/25 hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-xs group"
                    title="100% Quality & Honest Price Guarantee"
                    aria-label="Quality Promise Verified"
                  >
                    <Sparkles size={15} className="text-[#169B45] fill-[#169B45]/30 group-hover:rotate-12 transition-transform animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-wider">
                      {currentData.header?.badgeText || "Promise"}
                    </span>
                  </button>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {renderFormattedText(currentData.header?.subtitle || "Where **quality food** meets **honest prices**!")}
              </p>
            </div>
          </div>
        </div>

        {/* Sticky Tab Buttons Container (follows like Domino's) */}
        <div className="sticky top-0 z-30 bg-[#F8F6F2]/95 dark:bg-zinc-950/95 backdrop-blur-md py-3 px-4 border-b border-zinc-200/50 dark:border-zinc-800/50 shadow-xs">
          <div className="max-w-lg mx-auto">
            <div className="bg-zinc-250/80 dark:bg-zinc-900 p-1 rounded-2xl flex items-center gap-1 shadow-inner">
              {tabs.map((tab) => {
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => scrollToTab(tab.id)}
                    className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer text-center uppercase tracking-wider ${
                      isSelected
                        ? 'bg-[#F8F6F2] dark:bg-zinc-800 text-[var(--primary,#E53935)] shadow-xs border border-zinc-200/80 dark:border-zinc-700'
                        : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Continuous Sections Container */}
        <div className="max-w-lg mx-auto px-4 mt-2">
          {tabs.map((tab, tabIdx) => {
            const isLastTab = tabIdx === tabs.length - 1;
            const isLowestPricing = tab.id === 'lowest-pricing';

            return (
              <section 
                key={tab.id}
                id={`promise-section-${tab.id}`}
                className="scroll-mt-24 pt-1"
              >
                {/* Section Badge with Medal Graphic */}
                {tab.badgeText && (
                  <div className="text-center mt-2 mb-4">
                    <div className="relative w-20 h-20 mx-auto mb-2 flex items-center justify-center">
                      <div className="absolute inset-0 bg-[#169B45]/15 rounded-full blur-xs" />
                      <div className="relative w-18 h-18 bg-gradient-to-tr from-[#169B45] to-[#12833a] rounded-full shadow-lg shadow-[#169B45]/25 flex flex-col items-center justify-center text-white border-4 border-[#F8F6F2] dark:border-zinc-900">
                        {isLowestPricing ? (
                          <span className="text-2xl font-black">₹</span>
                        ) : (
                          <Award size={30} />
                        )}
                      </div>
                      <span className="absolute top-0.5 left-1 text-[#169B45] text-xs animate-pulse">✦</span>
                      <span className="absolute bottom-1 right-1 text-[#169B45] text-xs animate-pulse">✦</span>
                    </div>

                    <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-white">
                      {tab.badgeText}
                    </h2>
                    <div className="w-16 h-1 bg-[#169B45] mx-auto rounded-full mt-1.5" />
                  </div>
                )}

                {/* Items List */}
                <div className="space-y-3.5">
                  {tab.items?.filter(it => it.isActive !== false).map((item, idx) => {
                    const IconComponent = ICON_MAP[item.icon] || Award;
                    return (
                      <div
                        key={item.id || idx}
                        className="bg-white dark:bg-zinc-900/80 rounded-2xl p-4 border border-zinc-200/70 dark:border-zinc-800 shadow-xs flex items-center gap-4 transition-all hover:shadow-md"
                      >
                        {/* Icon Circle */}
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 rounded-full bg-[#169B45]/10 border border-[#169B45]/25 flex items-center justify-center text-[#169B45]">
                            {item.iconUrl ? (
                              <img src={item.iconUrl} alt={item.title} className="w-7 h-7 object-contain" />
                            ) : (
                              <IconComponent size={26} strokeWidth={2.2} />
                            )}
                          </div>
                          <span className="absolute -top-1 -right-1 text-[#169B45] text-[10px]">✦</span>
                        </div>

                        {/* Title & Description */}
                        <div className="min-w-0 flex-1">
                          <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white leading-tight">
                            {item.title}
                          </h3>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed mt-0.5">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Decorative Domino's Flourish Divider between sections */}
                {!isLastTab && (
                  <div className="flex items-center justify-center mt-6 mb-1 py-0">
                    <div className="h-[1px] bg-zinc-300 dark:bg-zinc-700 w-24"></div>
                    <svg width="40" height="20" viewBox="0 0 40 20" className="text-zinc-400 dark:text-zinc-500 mx-2">
                      <path d="M 0 10 C 10 10, 15 2, 20 2 C 25 2, 30 18, 20 18 C 10 18, 15 10, 40 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                    <div className="h-[1px] bg-zinc-300 dark:bg-zinc-700 w-24"></div>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Order Now Button */}
      <div className="fixed bottom-0 inset-x-0 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 py-3.5 px-4 z-50">
        <div className="max-w-lg mx-auto">
          <button
            type="button"
            onClick={handleOrderNow}
            className="w-full h-12 bg-[var(--primary,#E53935)] hover:opacity-95 active:scale-[0.99] text-white rounded-xl font-black text-sm tracking-wide shadow-lg shadow-[var(--primary,#E53935)]/20 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase select-none relative z-10"
          >
            {currentData.header?.orderButtonText || "Order Now"}
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

    </div>
  );
}
