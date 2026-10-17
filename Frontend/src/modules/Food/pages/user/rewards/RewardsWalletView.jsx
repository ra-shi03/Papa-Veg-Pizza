import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, Lock, ArrowUpDown, Check, ChevronDown, HelpCircle, FileText, X, Sparkles, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/services/api/axios';
import { userAPI } from '@food/api';
import WalletSection from './WalletSection';

// 10 Signature Pizza Products for Rewards Catalogue
const FALLBACK_REWARD_PRODUCTS = [
  {
    id: 'margherita',
    name: 'Margherita',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Classic delight with 100% real mozzarella cheese.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 119,
    isVeg: true
  },
  {
    id: 'corn-cheese-paratha',
    name: 'Corn n Cheese Paratha Pizza',
    size: 'Regular',
    crust: '100% Wheat Thin Crust',
    description: 'A delicious fusion of corn stuffed paratha and cheesy pizza.',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 199,
    isVeg: true
  },
  {
    id: 'veggie-paradise',
    name: 'Veggie Paradise',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'The awesome foursome! Golden corn, black olives, capsicum, red paprika.',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 259,
    isVeg: true
  },
  {
    id: 'peppy-paneer',
    name: 'Peppy Paneer',
    size: 'Regular',
    crust: 'Fresh Pan Pizza',
    description: 'Flavorful trio of juicy paneer, crisp capsicum with spicy red paprika.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 259,
    isVeg: true
  },
  {
    id: 'farmhouse',
    name: 'Farmhouse',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Delightful combination of onion, capsicum, tomato & grilled mushroom.',
    image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 259,
    isVeg: true
  },
  {
    id: 'cheese-n-corn',
    name: 'Cheese n Corn Pizza',
    size: 'Regular',
    crust: 'Cheese Burst',
    description: 'A sweet & juicy golden corn feast with molten mozzarella cheese.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 219,
    isVeg: true
  },
  {
    id: 'paneer-makhani',
    name: 'Paneer Makhani Pizza',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Juicy paneer chunks marinated in rich tandoori makhani gravy with onion and capsicum.',
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 299,
    isVeg: true
  },
  {
    id: 'mexican-green-wave',
    name: 'Mexican Green Wave',
    size: 'Regular',
    crust: 'Fresh Pan Pizza',
    description: 'A mexican fiesta! Onion, crisp capsicum, juicy tomatoes & jalapenos with mexican herbs.',
    image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 279,
    isVeg: true
  },
  {
    id: 'golden-delight',
    name: 'Golden Delight',
    size: 'Regular',
    crust: '100% Wheat Thin Crust',
    description: 'Golden sweet corn, double cheese, and roasted bell peppers on thin crust.',
    image: 'https://images.unsplash.com/photo-1588315029754-2dd089d39a1a?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 249,
    isVeg: true
  },
  {
    id: 'deluxe-veggie',
    name: 'Deluxe Veggie',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'For a vegetarian feast: onion, capsicum, grilled mushroom, corn & paneer.',
    image: 'https://images.unsplash.com/photo-1585238342024-78d387f4a707?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 289,
    isVeg: true
  }
];

export default function RewardsWalletView({ onBack, initialTab = 'rewards' }) {
  const normalizedInitial = initialTab === 'cheesy' ? 'rewards' : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedInitial); // 'rewards' or 'wallet'
  const [rewardsConfig, setRewardsConfig] = useState(null);
  const [products, setProducts] = useState(FALLBACK_REWARD_PRODUCTS);
  const [selectedVegFilter, setSelectedVegFilter] = useState('all'); // 'all', 'veg', 'non-veg'
  const [sortBy, setSortBy] = useState('default');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(() => {
    return localStorage.getItem('pvp_rewards_enrolled') === 'true';
  });

  const sortDropdownRef = useRef(null);

  // Fetch dynamic rewards configuration and store products via API
  useEffect(() => {
    fetchRewardsData();
    fetchStoreProducts();
  }, []);

  // Handle outside click for sort dropdown
  useEffect(() => {
    function handleClickOutside(e) {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(e.target)) {
        setIsSortDropdownOpen(false);
      }
    }
    if (isSortDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSortDropdownOpen]);

  const fetchRewardsData = async () => {
    try {
      let res;
      try {
        res = await apiClient.get('/food/admin/rewards/public');
      } catch {
        res = await apiClient.get('/food/admin/rewards/config');
      }
      if (res?.data?.data) {
        setRewardsConfig(res.data.data);
      }
    } catch (err) {
      console.warn('Could not load dynamic rewards config from backend, using defaults', err);
    }
  };

  const fetchStoreProducts = async () => {
    try {
      let fetched = [];
      try {
        const res = await apiClient.get('/food/admin/products');
        const list = res?.data?.data?.products || res?.data?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          fetched = list;
        }
      } catch (_) {
        try {
          const res = await apiClient.get('/food/admin/category-products');
          const list = res?.data?.data?.products || res?.data?.data || [];
          if (Array.isArray(list) && list.length > 0) {
            fetched = list;
          }
        } catch (_) {}
      }

      if (fetched.length > 0) {
        const NON_PIZZA_KEYWORDS = [
          'brownie', 'cake', 'lava', 'tea', 'coffee', 'beverage', 'shake', 'drink',
          'pepsi', 'coke', 'sprite', 'mirinda', 'fanta', 'water', 'dip', 'garlic bread',
          'breadstick', 'burger', 'wrap', 'taco', 'dessert', 'side', 'pasta', 'sauce', 'addon', 'cup'
        ];

        const isPizza = (p) => {
          const name = String(p.name || '').toLowerCase();
          const cat = String(p.categoryName || p.category || p.category?.name || p.categoryId?.name || '').toLowerCase();
          if (NON_PIZZA_KEYWORDS.some(kw => name.includes(kw) || cat.includes(kw))) {
            return false;
          }
          if (cat.includes('pizza') || name.includes('pizza') || p.defaultCrust || p.crust) {
            return true;
          }
          const pizzaNames = [
            'margherita', 'paratha', 'paneer', 'farmhouse', 'paradise', 'cheese',
            'corn', 'capsicum', 'mushroom', 'onion', 'paprika', 'makhani', 'peri peri',
            'veggie', 'delight', 'extravaganza', 'supreme'
          ];
          return pizzaNames.some(kw => name.includes(kw));
        };

        const pizzaItems = fetched
          .filter(p => p.status !== 'Draft' && p.status !== 'Archived')
          .filter(isPizza);

        const mapped = pizzaItems.map(p => {
          const firstSize = Array.isArray(p.sizes) && p.sizes.length > 0 ? p.sizes[0] : null;
          const price = Number(firstSize?.price ?? p.price ?? 199);
          const originalPrice = Number(firstSize?.originalPrice ?? p.originalPrice ?? price);
          const isVeg = p.vegType ? p.vegType === 'veg' || p.vegType === 'vegan' : !String(p.name).toLowerCase().includes('chicken');
          return {
            id: p._id || p.id,
            name: p.name,
            size: firstSize?.size || 'Regular',
            crust: p.defaultCrust || 'New Hand Tossed',
            description: p.shortDescription || p.description || 'Delicious freshly baked pizza prepared with premium mozzarella and hand-picked veggies.',
            image: p.image || 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
            requiredPoints: 600,
            originalPrice: originalPrice > 0 ? originalPrice : price,
            isVeg
          };
        });

        // Ensure we always have exactly 10 pizza products (fill from fallback pizzas if needed)
        const combined = [...mapped];
        for (const fb of FALLBACK_REWARD_PRODUCTS) {
          if (combined.length >= 10) break;
          if (!combined.some(c => c.name.toLowerCase() === fb.name.toLowerCase())) {
            combined.push(fb);
          }
        }

        setProducts(combined.slice(0, 10));
      }
    } catch (e) {
      console.warn('Could not fetch store products for rewards, using defaults', e);
    }
  };

  const handleEnroll = async () => {
    if (isEnrolled) {
      toast.info('You are already enrolled in Cheesy Rewards!');
      return;
    }
    try {
      if (userAPI.enrollInRewards) {
        await userAPI.enrollInRewards();
      }
    } catch (e) {
      console.warn('Backend enrollment note:', e?.message || e);
    }
    setIsEnrolled(true);
    localStorage.setItem('pvp_rewards_enrolled', 'true');
    toast.success('🎉 Congratulations! You are now enrolled in Cheesy Rewards.');
  };

  // Filter & Sort Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Veg / Non-veg filter
    if (selectedVegFilter === 'veg') {
      result = result.filter(p => p.isVeg);
    } else if (selectedVegFilter === 'non-veg') {
      result = result.filter(p => !p.isVeg);
    }

    // Sort
    if (sortBy === 'points_asc') {
      result.sort((a, b) => (a.requiredPoints || 600) - (b.requiredPoints || 600));
    } else if (sortBy === 'points_desc') {
      result.sort((a, b) => (b.requiredPoints || 600) - (a.requiredPoints || 600));
    } else if (sortBy === 'price_asc') {
      result.sort((a, b) => (a.originalPrice || 0) - (b.originalPrice || 0));
    } else if (sortBy === 'price_desc') {
      result.sort((a, b) => (b.originalPrice || 0) - (a.originalPrice || 0));
    }

    return result;
  }, [products, selectedVegFilter, sortBy]);

  const faqs = rewardsConfig?.faqs || [
    {
      question: 'How do I earn points in the Rewards program?',
      answer: 'You earn 100 points on every delivered order above ₹349 placed via the Papa Veg Pizza app or website.'
    },
    {
      question: 'How do I unlock and redeem free items?',
      answer: 'Once you accumulate 600 points, all eligible reward items unlock automatically. You can add any unlocked reward product to your cart during checkout for ₹0.'
    },
    {
      question: 'Do my points expire?',
      answer: 'Points remain valid for 12 months from the date they are credited to your account.'
    },
    {
      question: 'Can I combine free reward items with discount coupons?',
      answer: 'Yes! You can apply active promo codes along with your redeemed reward treats on eligible orders.'
    }
  ];

  const terms = (Array.isArray(rewardsConfig?.terms) && rewardsConfig.terms.length > 0) ? rewardsConfig.terms : [
    "The Papa Veg Pizza Cheesy Rewards Loyalty Program (Loyalty Program) is being conducted by Papa Veg Pizza.",
    "Loyalty program is designed to reward selected Papa Veg Pizza customers for online order placed through Papa Veg Pizza Application, Mobile Website and our call centre. Customers who are eligible for the program (select customers) will be able to view the Cheesy Rewards Icon in Papa Veg Pizza application homepage and need to register in the Papa Veg Pizza application page to participate in the Program.",
    "The cheesy rewards loyalty program is currently open for only orders placed through Papa Veg Pizza's App, mobile website and call centre.",
    "Every time the registered customer places an order via Papa Veg Pizza's Application, such customer can earn 100 points (having value equivalent to 1 pizza slice), on the order value of at least INR 350, as Cheesy Rewards points. These points will be credited to the Papa Veg Pizza's wallet within 48 working hours of successful delivery of the order. These points can only be redeemed to pay for a free pizza (from the selected pizza range) once customer has accumulated 600 points (ie. Equivalent to 6 slices of pizza). Customer needs to check their Papa Veg Pizza's app for more details to find the actual list of Pizzas from which a FREE pizza can be redeemed in lieu of points.",
    "A minimum order value of INR 350 (excl. tax/charges) is required to earn Cheesy Rewards Points.",
    "This scheme can be availed only on 1st Order of the day. Customer is eligible to earn max 100 points (ie. Equivalent to 1 slice).",
    "For redemption of Points/Free Pizza minimum 600 points must be accumulated. Points in multiple of 600 points will only be eligible for redemption. Max 1 slice/100 points can be earned in a day.",
    "Wallet Points are valid for a period of 365 days from the day of enrolment in the Cheesy Rewards Loyalty Program. After which points will lapse automatically."
  ];

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-zinc-950 flex flex-col font-sans overflow-hidden">
      {/* ── Fixed Top Header Bar ── */}
      <div className="h-14 flex items-center px-4 gap-3 bg-white dark:bg-zinc-900 border-b border-zinc-100 dark:border-zinc-800 shrink-0 z-30">
        <button
          type="button"
          onClick={onBack}
          aria-label="Go Back"
          className="p-1 -ml-1 text-zinc-800 dark:text-zinc-200 hover:text-zinc-900 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>
        <h1 className="text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight">
          Rewards & Wallet
        </h1>
      </div>

      {/* ── Main Scroll Area ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-28">
        <div className="max-w-md mx-auto px-4 pt-3.5 space-y-4">
          {/* ── Tab Switcher: [ Cheesy Rewards ] | [ Wallet ] ── */}
          <div className="bg-zinc-100/90 dark:bg-zinc-800/80 p-1 rounded-2xl flex items-center">
            <button
              type="button"
              onClick={() => setActiveTab('rewards')}
              className={`flex-1 py-2 text-xs sm:text-[13px] font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'rewards'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              {rewardsConfig?.programName || 'Cheesy Rewards'}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 py-2 text-xs sm:text-[13px] font-bold rounded-xl transition-all cursor-pointer ${
                activeTab === 'wallet'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400'
              }`}
            >
              Wallet
            </button>
          </div>

          {/* ── VIEW 1: CHEESY REWARDS ── */}
          {activeTab === 'rewards' && (
            <div className="space-y-4">
              {/* Top Reward Benefits Card matching Reference Image 1 */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-150 dark:border-zinc-800 p-4 sm:p-5 shadow-2xs">
                {/* Benefit 1: 1 Order = 100 Points */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full border border-red-100 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 40 40" className="w-8 h-8 text-[var(--accent-red,#EE3A43)]" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="20" cy="20" r="16" />
                      <path d="M20 20 L20 4 A16 16 0 0 1 31.3 8.7 Z" fill="currentColor" fillOpacity="0.25" />
                      <line x1="20" y1="20" x2="20" y2="36" />
                      <line x1="20" y1="20" x2="6.1" y2="12" />
                      <line x1="20" y1="20" x2="33.9" y2="28" />
                      <circle cx="23" cy="11" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] sm:text-base text-zinc-900 dark:text-white leading-snug">
                      {rewardsConfig?.orderPointsTitle || '1 Order = 100 Points'}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {rewardsConfig?.orderPointsSubtitle || 'On every order above ₹349'}
                    </p>
                  </div>
                </div>

                {/* Vertical connecting dotted line */}
                <div className="w-12 flex justify-center py-1">
                  <div className="w-0.5 h-3.5 border-l-2 border-dashed border-zinc-200 dark:border-zinc-700" />
                </div>

                {/* Benefit 2: Unlock Free Items */}
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-full border border-red-100 dark:border-red-900/40 bg-red-50/70 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 40 40" className="w-8 h-8 text-[var(--accent-red,#EE3A43)]" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <circle cx="20" cy="20" r="16" />
                      <line x1="20" y1="4" x2="20" y2="36" />
                      <line x1="6.1" y1="12" x2="33.9" y2="28" />
                      <line x1="6.1" y1="28" x2="33.9" y2="12" />
                      <circle cx="20" cy="11" r="1" fill="currentColor" stroke="none" />
                      <circle cx="27" cy="16" r="1" fill="currentColor" stroke="none" />
                      <circle cx="27" cy="24" r="1" fill="currentColor" stroke="none" />
                      <circle cx="20" cy="29" r="1" fill="currentColor" stroke="none" />
                      <circle cx="13" cy="24" r="1" fill="currentColor" stroke="none" />
                      <circle cx="13" cy="16" r="1" fill="currentColor" stroke="none" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-[15px] sm:text-base text-zinc-900 dark:text-white leading-snug">
                      {rewardsConfig?.freeItemsTitle || 'Unlock Free Items'}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {rewardsConfig?.freeItemsSubtitle || 'Starting at 600 Points'}
                    </p>
                  </div>
                </div>

                {/* Enroll Button */}
                <button
                  type="button"
                  onClick={handleEnroll}
                  className="w-full mt-4 py-2.5 sm:py-3 bg-[#EE3A43] hover:bg-[#d92d36] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-500/25 active:scale-[0.99] cursor-pointer border-0"
                  style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
                >
                  {isEnrolled ? '✓ Enrolled in Rewards' : (rewardsConfig?.buttonText || 'Enroll Now')}
                </button>

                <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5">
                  {rewardsConfig?.termsText || 'By enrolling you agree to our'}{' '}
                  <button
                    type="button"
                    onClick={() => setIsTermsModalOpen(true)}
                    className="text-[var(--accent-red,#EE3A43)] font-semibold hover:underline cursor-pointer"
                  >
                    {rewardsConfig?.termsLinkText || 'Terms and Conditions'}
                  </button>
                </p>
              </div>

              {/* ── Sticky Filter & Sort Bar (Matching Screenshot 1 & 2) ── */}
              <div className="sticky top-0 z-20 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-md py-2.5 flex items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  {/* Veg Only Filter */}
                  <button
                    type="button"
                    onClick={() => setSelectedVegFilter(prev => prev === 'veg' ? 'all' : 'veg')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      selectedVegFilter === 'veg'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 border border-emerald-600 flex items-center justify-center rounded-[2px] p-[1px]">
                      <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                    </span>
                    Veg Only
                  </button>

                  {/* Non Veg Only Filter */}
                  <button
                    type="button"
                    onClick={() => setSelectedVegFilter(prev => prev === 'non-veg' ? 'all' : 'non-veg')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      selectedVegFilter === 'non-veg'
                        ? 'bg-red-50 border-red-500 text-red-700 dark:bg-red-950/40 dark:text-red-400'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 border border-amber-800 dark:border-red-500 flex items-center justify-center rounded-[2px] p-[1px]">
                      <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-amber-800 dark:border-b-red-500" />
                    </span>
                    Non Veg Only
                  </button>
                </div>

                {/* Sort By Dropdown */}
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSortDropdownOpen(!isSortDropdownOpen)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 cursor-pointer"
                  >
                    <span>Sort by</span>
                    <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400" />
                  </button>

                  {isSortDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-xl shadow-lg py-1 z-30 text-xs">
                      {[
                        { id: 'default', label: 'Default' },
                        { id: 'points_asc', label: 'Points: Low to High' },
                        { id: 'points_desc', label: 'Points: High to Low' },
                        { id: 'price_asc', label: 'Price: Low to High' },
                        { id: 'price_desc', label: 'Price: High to Low' }
                      ].map(opt => (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => {
                            setSortBy(opt.id);
                            setIsSortDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800 ${
                            sortBy === opt.id ? 'text-[#EE3A43] font-bold bg-zinc-50 dark:bg-zinc-800' : 'text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span>{opt.label}</span>
                          {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#EE3A43]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* ── Products List (Fetched from API) ── */}
              <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {filteredProducts.map(prod => (
                  <div
                    key={prod.id || prod._id || prod.name}
                    className="flex items-start gap-3.5 py-3.5 first:pt-1"
                  >
                    {/* Left: Product Image */}
                    <div className="w-[105px] h-[105px] sm:w-[115px] sm:h-[115px] rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 border border-zinc-100 dark:border-zinc-800">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>

                    {/* Right: Info, Price, Locked Button */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch">
                      <div>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          {prod.isVeg !== false ? (
                            <span className="w-3 h-3 border border-emerald-600 flex items-center justify-center rounded-[2px] p-[1px] shrink-0">
                              <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full" />
                            </span>
                          ) : (
                            <span className="w-3 h-3 border border-amber-800 dark:border-red-500 flex items-center justify-center rounded-[2px] p-[1px] shrink-0">
                              <span className="w-0 h-0 border-l-[3px] border-l-transparent border-r-[3px] border-r-transparent border-b-[5px] border-b-amber-800 dark:border-b-red-500" />
                            </span>
                          )}
                          <h4 className="font-bold text-sm sm:text-[15px] text-zinc-900 dark:text-white truncate">
                            {prod.name}
                          </h4>
                        </div>

                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                          {prod.size || 'Regular'} | {prod.crust || 'New Hand Tossed'}
                        </p>

                        <p className="text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 mt-1 leading-snug">
                          {prod.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="flex items-baseline gap-1.5">
                          <span className="font-bold text-sm text-zinc-900 dark:text-white">
                            {prod.requiredPoints || rewardsConfig?.defaultPointsRequired || 600} Points
                          </span>
                          {prod.originalPrice > 0 && (
                            <span className="text-xs text-zinc-400 line-through">
                              ₹{prod.originalPrice}
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          disabled
                          className="px-3.5 py-1 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 text-xs font-semibold rounded-lg border border-zinc-200 dark:border-zinc-700 flex items-center gap-1 cursor-not-allowed opacity-90"
                        >
                          <Lock className="w-3 h-3" />
                          Locked
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {filteredProducts.length === 0 && (
                  <div className="py-12 text-center text-zinc-400 text-xs">
                    No products found for the selected filter.
                  </div>
                )}
              </div>

              {/* ── Footer FAQs & Terms Links (Aligned to Left) ── */}
              <div className="pt-6 pb-6 text-left px-1 sm:px-2 text-xs flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsFaqModalOpen(true)}
                  className="font-bold text-[var(--accent-red,#EE3A43)] hover:underline cursor-pointer"
                >
                  FAQs
                </button>
                <span className="text-zinc-300 dark:text-zinc-700 font-light">|</span>
                <button
                  type="button"
                  onClick={() => setIsTermsModalOpen(true)}
                  className="font-bold text-[var(--accent-red,#EE3A43)] hover:underline cursor-pointer"
                >
                  Terms & Conditions
                </button>
              </div>
            </div>
          )}

          {/* ── VIEW 2: WALLET (Refund Balance & Dynamic Activity) ── */}
          {activeTab === 'wallet' && (
            <div className="pt-1">
              <WalletSection
                isEnrolled={isEnrolled}
                onEnroll={() => {
                  setIsEnrolled(true);
                  localStorage.setItem('pvp_rewards_enrolled', 'true');
                }}
                onOpenFaqs={() => setIsFaqModalOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* ── Sticky Bottom Action Bar with Enroll Now (Matching Reference Image 2) ── */}
      {activeTab === 'rewards' && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 p-3 sm:p-4 max-w-md mx-auto shadow-lg">
          <button
            type="button"
            onClick={handleEnroll}
            className="w-full py-3 bg-[#EE3A43] hover:bg-[#d92d36] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-500/25 active:scale-[0.99] cursor-pointer border-0"
            style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
          >
            {isEnrolled ? '✓ Enrolled in Rewards' : (rewardsConfig?.buttonText || 'Enroll Now')}
          </button>
          <p className="text-center text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-1.5">
            {rewardsConfig?.termsText || 'By enrolling you agree to our'}{' '}
            <button
              type="button"
              onClick={() => setIsTermsModalOpen(true)}
              className="text-[var(--accent-red,#EE3A43)] font-semibold hover:underline cursor-pointer"
            >
              {rewardsConfig?.termsLinkText || 'Terms and Conditions'}
            </button>
          </p>
        </div>
      )}

      {/* ── FAQs Modal ── */}
      {isFaqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-zinc-100 dark:border-zinc-800 max-h-[80vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[var(--accent-red,#EE3A43)]" />
                <h3 className="font-bold text-base text-zinc-900 dark:text-white">
                  Frequently Asked Questions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFaqModalOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-3 flex-1 divide-y divide-zinc-100 dark:divide-zinc-800">
              {faqs.map((faq, i) => (
                <div key={i} className="pt-3 first:pt-0">
                  <h4 className="font-semibold text-xs sm:text-sm text-zinc-900 dark:text-white">
                    {faq.question}
                  </h4>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsFaqModalOpen(false)}
              className="w-full mt-3 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 text-zinc-800 dark:text-zinc-200 font-semibold text-xs rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Terms & Conditions Modal (Matching Image 1) ── */}
      {isTermsModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end items-center">
          {/* Dimmed backdrop */}
          <div 
            onClick={() => setIsTermsModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-200"
          />

          {/* Floating circular close button centered directly above bottom sheet */}
          <div className="relative z-10 mb-3 animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setIsTermsModalOpen(false)}
              className="w-11 h-11 rounded-full bg-zinc-200/90 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer border border-white/20"
              aria-label="Close Terms and Conditions"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* Bottom Sheet Card */}
          <div 
            className="relative z-10 w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-[28px] shadow-2xl flex flex-col max-h-[75vh] overflow-hidden animate-in slide-in-from-bottom duration-250"
            style={{ fontFamily: 'Poppins, sans-serif' }}
          >
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-[17px] sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight m-0">
                Terms & Conditions
              </h3>
            </div>

            <div className="px-6 pb-6 overflow-y-auto space-y-3.5 hide-scrollbar">
              {terms.map((term, i) => (
                <div key={i} className="flex items-start gap-2.5 text-zinc-600 dark:text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
                  <span className="text-zinc-400 font-bold text-sm leading-none mt-0.5 select-none shrink-0">•</span>
                  <p className="flex-1 m-0">{term}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
