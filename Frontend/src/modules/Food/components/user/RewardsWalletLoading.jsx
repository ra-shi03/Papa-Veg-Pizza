import React, { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Exact Beverage SVG matching Reference Image in primary color
function BeverageCategoryIcon({ className = "w-24 h-24 text-[var(--accent-red, #EE3A43)]" }) {
  return (
    <svg 
      viewBox="0 0 100 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      {/* Glass on left */}
      <path d="M22 50 L27 98 C27.5 102 30.5 105 35 105 L45 105 C49.5 105 52.5 102 53 98 L58 50 Z" />
      {/* Liquid level */}
      <path d="M24 63 C32 65 48 60 56 63" />
      {/* Bubbles / fizz in glass */}
      <circle cx="35" cy="76" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="45" cy="84" r="1.5" fill="currentColor" stroke="none" />
      <circle cx="38" cy="92" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="47" cy="72" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="33" cy="85" r="1" fill="currentColor" stroke="none" />

      {/* Bottle on right */}
      {/* Bottle cap / nozzle */}
      <path d="M72 16 L76 16 L76 25 L72 25 Z" />
      <path d="M70 25 L78 25" />
      {/* Bottle neck & body */}
      <path d="M71 25 L71 33 C67 39 63.5 44 63.5 53 L63.5 100 C63.5 105 67 108 72 108 L76 108 C81 108 84.5 105 84.5 100 L84.5 53 C84.5 44 81 39 77 33 L77 25" />
      {/* Bottle label bands / stripes */}
      <path d="M63.5 64 C70 61 78 61 84.5 64" />
      <path d="M63.5 78 C70 75 78 75 84.5 78" />
      <path d="M65.5 84 C71 82 77 82 82.5 84" />
      {/* Bottle bubbles / textures */}
      <circle cx="73" cy="71" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="76" cy="90" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="71" cy="96" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

// Pizza Category SVG in primary color
function PizzaCategoryIcon({ className = "w-24 h-24 text-[var(--accent-red, #EE3A43)]" }) {
  return (
    <svg 
      viewBox="0 0 100 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M50 20 L84 88 C74 95 62 98 50 98 C38 98 26 95 16 88 Z" />
      <path d="M16 88 C26 95 38 98 50 98 C62 98 74 95 84 88" strokeWidth="3.5" />
      <path d="M19 82 C28 88 39 91 50 91 C61 91 72 88 81 82" />
      <circle cx="50" cy="46" r="6" />
      <circle cx="38" cy="68" r="6" />
      <circle cx="62" cy="70" r="6" />
      <path d="M42 34 L46 36" />
      <path d="M56 58 L54 62" />
      <path d="M48 78 L52 82" />
    </svg>
  );
}

// Desserts Category SVG in primary color
function DessertsCategoryIcon({ className = "w-24 h-24 text-[var(--accent-red, #EE3A43)]" }) {
  return (
    <svg 
      viewBox="0 0 100 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 68 C22 42 34 30 50 30 C66 30 78 42 78 68 Z" />
      <path d="M44 42 C44 52 46 64 50 64 C54 64 56 52 56 42" fill="currentColor" fillOpacity="0.2" />
      <path d="M14 92 C26 98 74 98 86 92 L80 68 L20 68 Z" />
      <path d="M10 94 C24 102 76 102 90 94" strokeWidth="3" />
      <circle cx="50" cy="22" r="5" />
      <path d="M53 17 C57 12 62 12 65 14" />
    </svg>
  );
}

// Garlic Breadsticks Category SVG in primary color
function BreadsticksCategoryIcon({ className = "w-24 h-24 text-[var(--accent-red, #EE3A43)]" }) {
  return (
    <svg 
      viewBox="0 0 100 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <rect x="22" y="30" width="16" height="68" rx="8" transform="rotate(-18 22 30)" />
      <rect x="42" y="24" width="16" height="68" rx="8" transform="rotate(-8 42 24)" />
      <rect x="62" y="28" width="16" height="68" rx="8" transform="rotate(10 62 28)" />
      <path d="M30 56 L33 58" />
      <path d="M48 48 L52 50" />
      <path d="M68 54 L71 52" />
    </svg>
  );
}

// Burger / Fastfood Category SVG in primary color
function BurgerCategoryIcon({ className = "w-24 h-24 text-[var(--accent-red, #EE3A43)]" }) {
  return (
    <svg 
      viewBox="0 0 100 120" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className} 
      stroke="currentColor" 
      strokeWidth="2.6" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M22 52 C22 32 34 24 50 24 C66 24 78 32 78 52 Z" />
      <circle cx="42" cy="36" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="58" cy="38" r="1.3" fill="currentColor" stroke="none" />
      <circle cx="50" cy="44" r="1.3" fill="currentColor" stroke="none" />
      <path d="M18 56 C24 60 28 54 34 58 C40 54 44 60 50 56 C56 60 60 54 66 58 C72 54 76 60 82 56" />
      <rect x="20" y="64" width="60" height="12" rx="6" />
      <path d="M22 82 C22 88 34 94 50 94 C66 94 78 88 78 82 Z" />
    </svg>
  );
}

export default function RewardsWalletLoading({ onBack, categories = [] }) {
  // Map existing categories in the app to appropriate vector icons
  const availableCategoryIcons = [
    { id: 'pizza', label: 'Pizzas', component: PizzaCategoryIcon },
    { id: 'beverage', label: 'Beverages', component: BeverageCategoryIcon },
    { id: 'dessert', label: 'Desserts', component: DessertsCategoryIcon },
    { id: 'breadsticks', label: 'Garlic Breadsticks', component: BreadsticksCategoryIcon },
    { id: 'burger', label: 'Burger & Sides', component: BurgerCategoryIcon }
  ];

  // Match app's existing categories to display
  const activeIcons = React.useMemo(() => {
    if (!Array.isArray(categories) || categories.length === 0) {
      return availableCategoryIcons;
    }

    const matched = [];
    const used = new Set();

    categories.forEach(cat => {
      const name = String(cat.name || cat.label || cat.title || '').toLowerCase();
      if (name.includes('pizza') || name.includes('crust') || name.includes('supreme')) {
        if (!used.has('pizza')) {
          matched.push({ id: 'pizza', label: cat.name || cat.label, component: PizzaCategoryIcon });
          used.add('pizza');
        }
      } else if (name.includes('drink') || name.includes('beverage') || name.includes('cola') || name.includes('water')) {
        if (!used.has('beverage')) {
          matched.push({ id: 'beverage', label: cat.name || cat.label, component: BeverageCategoryIcon });
          used.add('beverage');
        }
      } else if (name.includes('dessert') || name.includes('cake') || name.includes('sweet') || name.includes('choco')) {
        if (!used.has('dessert')) {
          matched.push({ id: 'dessert', label: cat.name || cat.label, component: DessertsCategoryIcon });
          used.add('dessert');
        }
      } else if (name.includes('bread') || name.includes('stick') || name.includes('garlic')) {
        if (!used.has('breadsticks')) {
          matched.push({ id: 'breadsticks', label: cat.name || cat.label, component: BreadsticksCategoryIcon });
          used.add('breadsticks');
        }
      } else if (name.includes('burger') || name.includes('sandwich') || name.includes('snack')) {
        if (!used.has('burger')) {
          matched.push({ id: 'burger', label: cat.name || cat.label, component: BurgerCategoryIcon });
          used.add('burger');
        }
      }
    });

    if (!used.has('pizza')) {
      matched.unshift({ id: 'pizza', label: 'Pizzas', component: PizzaCategoryIcon });
    }
    if (!used.has('beverage')) {
      matched.push({ id: 'beverage', label: 'Beverages', component: BeverageCategoryIcon });
    }

    return matched.length > 0 ? matched : availableCategoryIcons;
  }, [categories]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Ultra-fast sliding interval: 350ms for rapid category transitions
  useEffect(() => {
    if (activeIcons.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % activeIcons.length);
    }, 350);
    return () => clearInterval(interval);
  }, [activeIcons.length]);

  const CurrentIconComponent = activeIcons[currentIndex]?.component || PizzaCategoryIcon;
  const currentKey = activeIcons[currentIndex]?.id || currentIndex;

  return (
    <div className="fixed inset-0 z-[100] bg-white flex flex-col font-sans select-none animate-in fade-in duration-150">
      {/* Top Header Bar matching Reference Image */}
      <div className="h-14 flex items-center px-4 gap-3 bg-white border-b border-gray-100/60 sticky top-0 z-10">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go Back"
          className="p-1 -ml-1 text-gray-800 hover:text-gray-900 rounded-full hover:bg-gray-100 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 text-gray-800 stroke-[2.2]" />
        </button>
        <h1 className="text-[17px] font-semibold text-gray-900 tracking-tight">
          Rewards & Wallet
        </h1>
      </div>

      {/* Centered Category Related Icon Loading Area with Ultra-Fast Sliding Motion */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white overflow-hidden">
        <div className="relative w-36 h-36 flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={currentKey}
              initial={{ x: 45, opacity: 0, scale: 0.92 }}
              animate={{ x: 0, opacity: 1, scale: 1 }}
              exit={{ x: -45, opacity: 0, scale: 0.92 }}
              transition={{
                x: { type: "tween", ease: "easeOut", duration: 0.12 },
                opacity: { duration: 0.1 },
                scale: { duration: 0.1 }
              }}
              className="absolute inset-0 flex items-center justify-center text-[var(--accent-red, #EE3A43)]"
              style={{ color: 'var(--accent-red, #EE3A43)' }}
            >
              <CurrentIconComponent className="w-24 h-24 sm:w-28 sm:h-28 text-[var(--accent-red, #EE3A43)]" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
