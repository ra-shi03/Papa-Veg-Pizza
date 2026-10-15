import React, { useState, useEffect } from 'react';
import apiClient from '@/services/api/axios';
import { ChevronRight } from 'lucide-react';

// Domino's Style Fallback Data if backend is initializing or offline
const FALLBACK_SHOWCASE_SECTIONS = [
  {
    _id: 'sec-paneer-max',
    name: 'Paneer Maxxx',
    title: 'In 3 exciting flavours',
    subtitle: 'The ultimate loaded Paneer feast!',
    badgeText: 'Paneer Maxxx',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3132/3132693.png',
    bgStyle: 'brand_red',
    products: [
      {
        _id: 'prod-pm-1',
        title: 'Paneer Maxxx Makhani Fusion',
        description: 'Toppings (2): Paneer • Crisp Capsicum',
        image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=60',
        price: 299,
        originalPrice: 349,
        saveText: 'Save ₹50',
        sizeCrustText: 'Regular | New Hand Tossed >',
        buttonText: 'Add +',
        badge: 'Hot Seller',
        vegType: 'veg'
      },
      {
        _id: 'prod-pm-2',
        title: 'Paneer Maxxx Fiery Peri Peri',
        description: 'Toppings (2): Spicy Paneer • Red Paprika',
        image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=60',
        price: 319,
        originalPrice: 369,
        saveText: 'Save ₹50',
        sizeCrustText: 'Regular | Cheese Burst >',
        buttonText: 'Add +',
        badge: 'Spicy',
        vegType: 'veg'
      },
      {
        _id: 'prod-pm-3',
        title: 'Paneer Maxxx Tandoori Delight',
        description: 'Toppings (3): Tandoori Paneer • Onion • Capsicum',
        image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=800&auto=format&fit=crop&q=60',
        price: 339,
        originalPrice: 389,
        saveText: 'Save ₹50',
        sizeCrustText: 'Regular | Wheat Thin Crust >',
        buttonText: 'Add +',
        badge: 'Chef Special',
        vegType: 'veg'
      }
    ]
  },
  {
    _id: 'sec-6in1-big',
    name: '6 in 1 Big Big Pizza',
    title: 'Big Big Pizza',
    subtitle: 'In 4 Exciting Flavours',
    badgeText: '6 in 1',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/1404/1404945.png',
    bgStyle: 'warm_cream',
    products: [
      {
        _id: 'prod-6in1-1',
        title: 'Big Big 6in1 Cheeseburst - Veg',
        description: 'Big Big Pizza meets iconic Cheeseburst crust, bursting with gooey molten cheese and 6 bestseller veg flavours.',
        image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=60',
        price: 999,
        originalPrice: 2149,
        saveText: 'Save ₹1,150',
        sizeCrustText: 'Large Plus | Cheese Burst >',
        buttonText: 'Add +',
        badge: 'Bestseller',
        vegType: 'veg'
      },
      {
        _id: 'prod-6in1-2',
        title: 'Big Big 6in1 Gourmet Feast',
        description: 'Loaded with paneer, sweet corn, black olives, jalapenos, mushrooms, and golden bell peppers.',
        image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=800&auto=format&fit=crop&q=60',
        price: 1049,
        originalPrice: 2299,
        saveText: 'Save ₹1,250',
        sizeCrustText: 'Large Plus | Cheese Burst >',
        buttonText: 'Add +',
        badge: 'Mega Feast',
        vegType: 'veg'
      }
    ]
  },
  {
    _id: 'sec-combo-bonanza',
    name: 'Combo Bonanza',
    title: 'Combo Bonanza - Super Savings',
    subtitle: 'Feast with your family & friends',
    badgeText: 'Combo Bonanza',
    logoUrl: 'https://cdn-icons-png.flaticon.com/512/3480/3480823.png',
    bgStyle: 'festive_blue',
    products: [
      {
        _id: 'prod-combo-1',
        title: 'Ultimate Pizza Feast',
        description: '1 Regular Pizza • 1 Side • 1 Dip / Beverage / Dessert',
        image: 'https://images.unsplash.com/photo-1590947132387-155cc02f3212?w=800&auto=format&fit=crop&q=60',
        price: 335,
        originalPrice: 419,
        saveText: 'Save ₹84',
        badge: 'Serves 1',
        sizeCrustText: 'Serves 1 Person',
        buttonText: 'Build your Combo >',
        vegType: 'veg'
      },
      {
        _id: 'prod-combo-2',
        title: 'Family Party Combo',
        description: '2 Medium Pizzas • Stuffed Garlic Bread • 2 Pepsi Cans',
        image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=800&auto=format&fit=crop&q=60',
        price: 699,
        originalPrice: 999,
        saveText: 'Save ₹300',
        badge: 'Serves 4',
        sizeCrustText: 'Serves 3-4 People',
        buttonText: 'Build your Combo >',
        vegType: 'veg'
      }
    ]
  }
];

// Title Case Helper: First letter Uppercase, rest lowercase in each word
export function toTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .replace(/\b[a-z]/g, char => char.toUpperCase())
    .replace(/_([a-z])/g, (_, c) => '_' + c.toUpperCase())
    .replace(/'[A-Z]\b/g, char => char.toLowerCase());
}

// 3-Stop Linear CSS Gradients (0% Top Light Shade, 50% Center Dark/Bright Color Set by Superadmin, 100% Bottom Light Shade)
export const THREE_STOP_GRADIENTS = {
  brand_red: {
    name: 'Brand Red Theme',
    light: 'linear-gradient(180deg, #FFF1F3 0%, #EE3A43 50%, #FFF1F3 100%)',
    dark: 'linear-gradient(180deg, #22090B 0%, #991B1B 50%, #22090B 100%)'
  },
  festive_blue: {
    name: 'Royal Sapphire Blue',
    light: 'linear-gradient(180deg, #EFF6FF 0%, #3B82F6 50%, #EFF6FF 100%)',
    dark: 'linear-gradient(180deg, #0C1527 0%, #1D4ED8 50%, #0C1527 100%)'
  },
  warm_cream: {
    name: 'Warm Cream & Gold',
    light: 'linear-gradient(180deg, #FEFCE8 0%, #FBBF24 50%, #FEFCE8 100%)',
    dark: 'linear-gradient(180deg, #21180A 0%, #78350F 50%, #21180A 100%)'
  },
  sunset_orange: {
    name: 'Fiery Sunset Orange',
    light: 'linear-gradient(180deg, #FFF7ED 0%, #FB923C 50%, #FFF7ED 100%)',
    dark: 'linear-gradient(180deg, #251105 0%, #C2410C 50%, #251105 100%)'
  },
  golden_glow: {
    name: 'Golden Cheese Burst',
    light: 'linear-gradient(180deg, #FEFCE8 0%, #FACC15 50%, #FEFCE8 100%)',
    dark: 'linear-gradient(180deg, #211E06 0%, #A16207 50%, #211E06 100%)'
  },
  emerald_fresh: {
    name: 'Fresh Garden Emerald',
    light: 'linear-gradient(180deg, #F0FDF4 0%, #4ADE80 50%, #F0FDF4 100%)',
    dark: 'linear-gradient(180deg, #061F10 0%, #15803D 50%, #061F10 100%)'
  },
  charcoal_luxe: {
    name: 'Midnight Gourmet Noir',
    light: 'linear-gradient(180deg, #FAFAFA 0%, #A1A1AA 50%, #FAFAFA 100%)',
    dark: 'linear-gradient(180deg, #0D0D11 0%, #3F3F46 50%, #0D0D11 100%)'
  }
};

export function hexToHSL(hex) {
  if (!hex || typeof hex !== 'string') return { h: 0, s: 0, l: 100 };
  const cleanHex = hex.replace('#', '');
  let r = parseInt(cleanHex.substring(0, 2), 16) / 255 || 0;
  let g = parseInt(cleanHex.substring(2, 4), 16) / 255 || 0;
  let b = parseInt(cleanHex.substring(4, 6), 16) / 255 || 0;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
  }
  return { h, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hexTo3StopGradient(hex, isDarkMode) {
  if (!hex || typeof hex !== 'string') {
    return isDarkMode 
      ? 'linear-gradient(180deg, #22090B 0%, #991B1B 50%, #22090B 100%)'
      : 'linear-gradient(180deg, #FFF1F3 0%, #EE3A43 50%, #FFF1F3 100%)';
  }

  const cleanHex = hex.startsWith('#') ? hex : '#' + hex;
  const { h, s, l } = hexToHSL(cleanHex);

  if (isDarkMode) {
    const darkStop = `hsl(${h}, ${Math.max(s, 40)}%, 10%)`;
    const brightStop = cleanHex;
    return `linear-gradient(180deg, ${darkStop} 0%, ${brightStop} 50%, ${darkStop} 100%)`;
  } else {
    // 50% stop: The bright/dark color stop directly set by superadmin (center)
    const brightStop = cleanHex;
    // 0% (top) and 100% (bottom) stops: Softer, lighter pastel shade of that color
    const lighterStop = `hsl(${h}, ${Math.min(Math.max(s - 15, 25), 70)}%, ${Math.min(Math.max(l + 25, 92), 97)}%)`;
    return `linear-gradient(180deg, ${lighterStop} 0%, ${brightStop} 50%, ${lighterStop} 100%)`;
  }
}

export function getSectionGradient(section, isDarkMode) {
  if (section?.bgColor && section.bgColor.startsWith('#')) {
    return hexTo3StopGradient(section.bgColor, isDarkMode);
  }
  if (section?.bgStyle && section.bgStyle.startsWith('#')) {
    return hexTo3StopGradient(section.bgStyle, isDarkMode);
  }
  if (section?.bgStyle && section.bgStyle.startsWith('linear-gradient')) {
    return section.bgStyle.replace(/135deg/g, '180deg');
  }
  const preset = THREE_STOP_GRADIENTS[section?.bgStyle] || THREE_STOP_GRADIENTS['brand_red'];
  return isDarkMode ? preset.dark : preset.light;
}

export function ShowcaseSections({ onAddToCart, triggerToast, isDarkMode }) {
  const [sections, setSections] = useState(() => {
    try {
      const stored = localStorage.getItem('pvp_showcase_sections');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return FALLBACK_SHOWCASE_SECTIONS;
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchShowcaseSections();

    // Listen to real-time events when superadmin updates showcase sections or themes
    const handleUpdate = (e) => {
      if (e?.detail && Array.isArray(e.detail) && e.detail.length > 0) {
        setSections(e.detail);
      } else {
        fetchShowcaseSections();
      }
    };

    const handleStorage = (e) => {
      if (e.key === 'pvp_showcase_sections' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setSections(parsed);
          }
        } catch (_) {}
      }
    };

    window.addEventListener('showcaseSectionsUpdated', handleUpdate);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('showcaseSectionsUpdated', handleUpdate);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const fetchShowcaseSections = async () => {
    try {
      const res = await apiClient.get('/settings/showcase-sections?_t=' + Date.now());
      if (res?.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
        const enriched = res.data.data.map(sec => {
          if (!sec.products || sec.products.length === 0) {
            const fallbackMatch = FALLBACK_SHOWCASE_SECTIONS.find(
              f => f.name?.toLowerCase() === (sec.name || '').toLowerCase() || 
                   f.badgeText?.toLowerCase() === (sec.badgeText || '').toLowerCase() ||
                   f._id === sec._id
            );
            return { ...sec, products: fallbackMatch?.products || [] };
          }
          return sec;
        });
        setSections(enriched);
        try {
          localStorage.setItem('pvp_showcase_sections', JSON.stringify(enriched));
        } catch (_) {}
      }
    } catch (err) {
      console.warn('Could not fetch dynamic showcase sections, using fallback:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleActionClick = (product) => {
    const prodId = product.productId || product._id || product.title;
    if (onAddToCart) {
      onAddToCart(prodId);
    } else if (triggerToast) {
      triggerToast(`Added ${toTitleCase(product.title)} to basket!`);
    }
  };

  if (!sections || sections.length === 0) return null;

  return (
    <div className="space-y-4 my-4 select-none" style={{ fontFamily: 'Poppins, sans-serif' }}>
      {sections.map((section) => {
        const prods = (section.products && section.products.length > 0)
          ? section.products
          : (FALLBACK_SHOWCASE_SECTIONS.find(f => 
              f.name?.toLowerCase() === (section.name || '').toLowerCase() || 
              f.badgeText?.toLowerCase() === (section.badgeText || '').toLowerCase() ||
              f._id === section._id
            )?.products || []);

        if (prods.length === 0) return null;

        const sectionBg = getSectionGradient(section, isDarkMode);

        return (
          <section 
            key={section._id || section.name} 
            style={{ 
              background: sectionBg,
              backgroundImage: sectionBg 
            }}
            className="py-4.5 my-2 transition-all"
          >
            {/* ── Section Header (Domino's Centered Badge + Decorative Lines) ── */}
            <div className="px-2 sm:px-3 text-center mb-3">
              {/* Badge / Logo with Flanking Lines */}
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-r from-transparent to-red-400/50" />

                {section.logoUrl ? (
                  <div className="h-14 sm:h-16 max-w-[220px] sm:max-w-[280px] flex items-center justify-center">
                    <img 
                      src={section.logoUrl} 
                      alt={toTitleCase(section.name)} 
                      className="max-h-full max-w-full object-contain drop-shadow-sm"
                    />
                  </div>
                ) : section.badgeText ? (
                  <span className="font-extrabold text-xs sm:text-[13px] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-[#EE3A43] to-[#C8232C]">
                    {toTitleCase(section.badgeText)}
                  </span>
                ) : (
                  <span className="font-extrabold text-xs tracking-tight text-[#EE3A43]">
                    {toTitleCase(section.name)}
                  </span>
                )}

                <div className="h-[1.5px] w-8 sm:w-16 bg-gradient-to-l from-transparent to-red-400/50" />
              </div>

              {/* Title - First Letter Uppercase, Rest Lowercase in Each Word */}
              <h2 className="text-[17px] sm:text-[19px] font-bold tracking-tight text-zinc-900 dark:text-white leading-tight m-0">
                {toTitleCase(section.title)}
              </h2>

              {/* Subtitle - First Letter Uppercase, Rest Lowercase in Each Word */}
              {section.subtitle && (
                <p className="text-xs sm:text-[13px] text-zinc-600 dark:text-zinc-400 font-medium mt-0.5 m-0">
                  {toTitleCase(section.subtitle)}
                </p>
              )}
            </div>

            {/* ── Horizontal Scroll Carousel of Product Cards (Matching Menu Page UI, Increased Length) ── */}
            <div 
              className="flex overflow-x-auto hide-scrollbar gap-2 pb-2.5 pt-1 px-2 sm:px-3"
            >
              {prods.map((product) => {
                const hasDiscount = Boolean(product.originalPrice && Number(product.originalPrice) > Number(product.price));
                const saveAmount = hasDiscount ? (Number(product.originalPrice) - Number(product.price)) : 0;
                const toppingsLine = product.customDescription || product.description || '';

                return (
                  <div
                    key={product._id || product.title}
                    onClick={() => handleActionClick(product)}
                    className="relative w-[335px] sm:w-[370px] shrink-0 overflow-hidden flex flex-col justify-end min-h-[310px] sm:min-h-[330px] h-[310px] sm:h-[330px] bg-zinc-950 group shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer rounded-xl select-none border-0 border-none outline-none"
                    style={{ border: 'none', outline: 'none' }}
                  >
                    {/* Full-bleed Product Image covering entire card (Matching Menu Page) */}
                    {product.image && (
                      <img
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        alt={product.title}
                        src={product.image}
                        loading="lazy"
                      />
                    )}

                    {/* Top Badges - dynamic from superadmin / product (Matching Menu Page) */}
                    <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between z-10 pointer-events-none">
                      {Boolean(product.badge && product.badge.trim()) ? (
                        <span className="bg-[#E53935] text-white text-[9px] font-bold px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                          {toTitleCase(product.badge)}
                        </span>
                      ) : <span />}

                      {Boolean(product.saveText && product.saveText.trim()) ? (
                        <span className="bg-[#169B45] text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                          {toTitleCase(product.saveText)}
                        </span>
                      ) : hasDiscount && saveAmount > 0 ? (
                        <span className="bg-[#169B45] text-white text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">
                          Save ₹{saveAmount}
                        </span>
                      ) : null}
                    </div>

                    {/* Dark Gradient Overlay with Veg Icon, Title, Toppings, Pricing & Red Add Button (Matching Menu Page) */}
                    <div className="relative z-10 w-full bg-gradient-to-t from-black/95 via-black/80 to-transparent pt-14 pb-3.5 px-3.5 sm:px-4 text-left">
                      {/* Veg Icon + Product Title */}
                      <div className="flex items-center gap-2">
                        <span className="w-3.5 h-3.5 border-[1.5px] border-[#00C853] flex items-center justify-center shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#00C853]"></span>
                        </span>
                        <h3 className="text-white text-sm sm:text-base font-bold leading-snug truncate drop-shadow-md font-['Poppins',sans-serif] m-0">
                          {toTitleCase(product.title)}
                        </h3>
                      </div>

                      {/* Toppings Summary Line */}
                      {toppingsLine && (
                        <p className="text-zinc-300 text-xs mt-1 truncate font-medium font-['Poppins',sans-serif] drop-shadow-sm m-0">
                          {toTitleCase(toppingsLine)}
                        </p>
                      )}

                      {/* Pricing Row & Add Button (Directly over image overlay, matching Menu Page) */}
                      <div className="mt-2.5 flex items-center justify-between gap-2.5">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          {/* Price, Strikethrough MRP, and Green Save Tag */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-white font-bold text-base sm:text-lg font-['Poppins',sans-serif] drop-shadow-sm leading-none">
                              ₹{product.price}
                            </span>
                            {hasDiscount && (
                              <span className="text-zinc-400 line-through text-xs font-medium">
                                ₹{product.originalPrice}
                              </span>
                            )}
                          </div>

                          {/* Variant Selector Link */}
                          <div className="flex items-center gap-1 text-[11px] text-zinc-300 hover:text-white border-b border-dashed border-zinc-400 w-fit cursor-pointer transition-colors pb-0.5 text-left font-medium select-none bg-transparent p-0 mt-0.5">
                            <span>{toTitleCase((product.sizeCrustText || 'Regular | New Hand Tossed').replace(/\s*>\s*$/, ''))}</span>
                            <ChevronRight size={12} className="text-zinc-400 shrink-0" />
                          </div>
                        </div>

                        {/* Bright Red Add Button matching Menu Page */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActionClick(product);
                          }}
                          className="shrink-0 h-9 sm:h-10 px-4 sm:px-5 bg-[var(--accent-red,#EE3A43)] hover:opacity-95 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all shadow-lg shadow-[var(--accent-red,#EE3A43)]/30 cursor-pointer flex items-center gap-1.5 select-none font-['Poppins',sans-serif] border-0"
                        >
                          <span>{toTitleCase(product.buttonText || 'Add')}</span>
                          <span className="text-base leading-none font-bold">+</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
