import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Lock, ArrowUpDown, Check, ChevronDown, X, Gift } from 'lucide-react';
import { toast } from 'sonner';
import apiClient from '@/services/api/axios';
import { userAPI } from '@food/api';
import rewardsLogo from '@/assets/rewards-logo.png';
import WalletSection, { AccordionItem } from './WalletSection';
import RewardsActionLoadingModal from '@food/components/user/RewardsActionLoadingModal';
import RewardsEnrollWelcomeModal from '@food/components/user/RewardsEnrollWelcomeModal';

// 10 Signature Pizza Products for Rewards Catalogue (matching Reference Screenshot)
export const FALLBACK_REWARD_PRODUCTS = [
  {
    id: 'so-cheesee',
    name: 'SO CHEESEE',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'So Cheesy Pizza Sandwich with premium molten mozzarella & herb seasoning.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 149,
    isVeg: true
  },
  {
    id: 'smoky-corn-paneer',
    name: 'SMOKY CORN PANEER',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Smoky Corn Paneer Pizza Sandwich loaded with roasted corn and spiced cottage cheese.',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 129,
    isVeg: true
  },
  {
    id: 'paneer-tikka',
    name: 'PANEER TIKKA',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Paneer Tikka Pizza Sandwich infused with aromatic tandoori masala and crunchy capsicum.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 129,
    isVeg: true
  },
  {
    id: 'hott-pepper',
    name: 'HOTT PEPPER',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Hot Pepper Pizza Sandwich with fiery red paprika and roasted jalapenos.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 119,
    isVeg: true
  },
  {
    id: 'margherita',
    name: 'MARGHERITA',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Classic delight with 100% real mozzarella cheese.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 119,
    isVeg: true
  },
  {
    id: 'corn-n-cheese',
    name: 'CORN N CHEESE',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Sweet & juicy golden corn feast with molten mozzarella cheese.',
    image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 149,
    isVeg: true
  },
  {
    id: 'farmhouse',
    name: 'FARMHOUSE',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Delightful combination of onion, capsicum, tomato & grilled mushroom.',
    image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 199,
    isVeg: true
  },
  {
    id: 'veggie-paradise',
    name: 'VEGGIE PARADISE',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'The awesome foursome! Golden corn, black olives, capsicum, red paprika.',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 219,
    isVeg: true
  },
  {
    id: 'peppy-paneer',
    name: 'PEPPY PANEER',
    size: 'Regular',
    crust: 'Fresh Pan Pizza',
    description: 'Flavorful trio of juicy paneer, crisp capsicum with spicy red paprika.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 229,
    isVeg: true
  },
  {
    id: 'paneer-makhani',
    name: 'PANEER MAKHANI',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Juicy paneer chunks marinated in rich tandoori makhani gravy with onion and capsicum.',
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 249,
    isVeg: true
  }
];

export default function RewardsWalletView({ onBack, initialTab = 'rewards', rewardsConfig: propRewardsConfig }) {
  const navigate = useNavigate();
  const normalizedInitial = initialTab === 'cheesy' ? 'rewards' : initialTab;
  const [activeTab, setActiveTab] = useState(normalizedInitial); // 'rewards' or 'wallet'
  const [rewardsConfig, setRewardsConfig] = useState(propRewardsConfig || null);
  const [products, setProducts] = useState(() => {
    if (Array.isArray(propRewardsConfig?.rewardProducts) && propRewardsConfig.rewardProducts.length > 0) {
      return propRewardsConfig.rewardProducts.slice(0, 10);
    }
    return FALLBACK_REWARD_PRODUCTS;
  });
  const [selectedVegFilter, setSelectedVegFilter] = useState('all'); // 'all', 'veg', 'non-veg'
  const [sortBy, setSortBy] = useState('default');
  const [isSortDropdownOpen, setIsSortDropdownOpen] = useState(false);
  const [isRedeemOpen, setIsRedeemOpen] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isQuitModalOpen, setIsQuitModalOpen] = useState(false);
  const [actionLoadingState, setActionLoadingState] = useState({
    isOpen: false,
    message: '',
    programName: 'Cheesy Rewards',
  });
  const [isEnrollWelcomeOpen, setIsEnrollWelcomeOpen] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(() => {
    return localStorage.getItem('pvp_rewards_enrolled') === 'true';
  });
  const [userPoints, setUserPoints] = useState(0);

  const handleNavigateMenu = () => {
    if (onBack) onBack();
    const menuPath = window.location.pathname.startsWith('/food') ? '/food/user/menu' : '/user/menu';
    navigate(menuPath);
  };

  const sortDropdownRef = useRef(null);

  // Sync state if propRewardsConfig changes
  useEffect(() => {
    if (propRewardsConfig) {
      setRewardsConfig(propRewardsConfig);
      if (Array.isArray(propRewardsConfig.rewardProducts) && propRewardsConfig.rewardProducts.length > 0) {
        setProducts(propRewardsConfig.rewardProducts.slice(0, 10));
      }
    }
  }, [propRewardsConfig]);

  // Fetch dynamic rewards configuration from backend API
  useEffect(() => {
    fetchRewardsData();
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
        const cfg = res.data.data;
        setRewardsConfig(cfg);
        if (Array.isArray(cfg.rewardProducts) && cfg.rewardProducts.length > 0) {
          setProducts(cfg.rewardProducts.slice(0, 10));
        } else {
          setProducts(FALLBACK_REWARD_PRODUCTS);
        }
      } else {
        setProducts(FALLBACK_REWARD_PRODUCTS);
      }
    } catch (err) {
      console.warn('Could not load dynamic rewards config from backend, using defaults', err);
      setProducts(FALLBACK_REWARD_PRODUCTS);
    }

    // Enrolment + points come from the server (rewards membership), never from localStorage alone.
    try {
      const rRes = await userAPI.getRewards();
      const r = rRes?.data?.data?.rewards;
      if (r) {
        const enrolled = Boolean(r.isEnrolled);
        setIsEnrolled(enrolled);
        setUserPoints(Number(r.points) || 0);
        const wasEnrolled = localStorage.getItem('pvp_rewards_enrolled') === 'true';
        if (enrolled) localStorage.setItem('pvp_rewards_enrolled', 'true');
        else localStorage.removeItem('pvp_rewards_enrolled');
        if (wasEnrolled !== enrolled) window.dispatchEvent(new Event('pvp_rewards_enrolled_changed'));
      }
    } catch (_) {}

    try {
      const wRes = await userAPI.getWalletMe();
      setWalletBalance(Number(wRes?.data?.data?.wallet?.balance) || 0);
    } catch (_) {}
  };

  const handleEnroll = async () => {
    const programName = rewardsConfig?.programName || 'Cheesy Rewards';
    if (isEnrolled) {
      toast.info(`You are already enrolled in ${programName}!`);
      return;
    }

    // Only show the enrolled state once the server has actually created the membership.
    try {
      await userAPI.enrollInRewards();
    } catch (e) {
      toast.error(e?.response?.data?.message || `Could not enroll in ${programName}. Please try again.`);
      return;
    }

    setIsEnrolled(true);
    localStorage.setItem('pvp_rewards_enrolled', 'true');
    window.dispatchEvent(new Event('pvp_rewards_enrolled_changed'));
    setIsEnrollWelcomeOpen(true);
    fetchRewardsData();
  };

  const handleQuitProgram = async () => {
    const programName = rewardsConfig?.programName || 'Cheesy Rewards';
    const quitMsg = rewardsConfig?.quitLoadingText || `Leaving ${programName}...`;

    // Immediately close the confirmation sheet
    setIsQuitModalOpen(false);

    // Open animated bottom sheet popup matching reference image
    setActionLoadingState({
      isOpen: true,
      message: quitMsg,
      programName
    });

    const startTime = Date.now();

    let quitError = null;
    try {
      await userAPI.quitRewards();
    } catch (e) {
      quitError = e;
    }

    // Ensure animation displays smoothly for realistic mobile experience
    const elapsed = Date.now() - startTime;
    const remainingTime = Math.max(0, 1600 - elapsed);
    if (remainingTime > 0) {
      await new Promise(r => setTimeout(r, remainingTime));
    }

    // Server did not remove the membership — keep the user enrolled.
    if (quitError) {
      setActionLoadingState({ isOpen: false, message: '', programName });
      toast.error(quitError?.response?.data?.message || `Could not leave ${programName}. Please try again.`);
      return;
    }

    setIsEnrolled(false);
    setUserPoints(0);
    localStorage.removeItem('pvp_rewards_enrolled');
    window.dispatchEvent(new Event('pvp_rewards_enrolled_changed'));
    setActionLoadingState({ isOpen: false, message: '', programName });
    toast.info(`You have left the ${programName} program.`);
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

  const faqs = (Array.isArray(rewardsConfig?.faqs) && rewardsConfig.faqs.length > 0) ? rewardsConfig.faqs : [
    {
      question: "What is the Papa Veg Pizza Cheesy Rewards Program?",
      answer: "The Cheesy Rewards Program is a loyalty program designed to reward our valued customers. Every time you order your favorite delicious pizzas, you earn Cheesy Reward Points that can be redeemed for FREE pizzas!"
    },
    {
      question: "How can I avail the benefits of the program?",
      answer: "Simply enroll in the Cheesy Rewards program by tapping 'Enroll Now' on the Papa Veg Pizza app. Once enrolled, your eligible orders will automatically earn points towards free treats."
    },
    {
      question: "How does this program work?",
      answer: "For every delivered order of ₹349 or more, you earn 100 points (equivalent to 1 slice). Once you collect 600 points (6 slices), a full pizza from our signature catalogue unlocks for FREE!"
    },
    {
      question: "Is there a limit to how many Cheesy Rewards Points I can earn or redeem in an order?",
      answer: "You can earn a maximum of 100 points per day on your first order above ₹349. You can redeem 600 points per free pizza reward in an eligible order."
    },
    {
      question: "Do I need to pay anything while redeeming points for FREE pizza?",
      answer: "No! The redeemed pizza is 100% free (₹0). Only standard delivery charges or taxes for any additional cart items may apply if your cart does not meet free delivery conditions."
    },
    {
      question: "What are eligible items for FREE pizza?",
      answer: "Eligible items include all pizzas featured in the Cheesy Rewards catalogue (such as So Cheesee, Smoky Corn Paneer, Paneer Tikka, Margherita, Farmhouse, etc.)."
    },
    {
      question: "Is there any expiry of Cheesy Rewards Points?",
      answer: "Yes, Cheesy Rewards Points are valid for 365 days from the date they are credited to your account."
    },
    {
      question: "How can I check my Cheesy Rewards Points balance?",
      answer: "You can view your real-time points balance, slices progress meter, and transaction history in the Rewards & Wallet section of the Papa Veg Pizza app."
    },
    {
      question: "Is this program applicable on Papa Veg Pizza orders through Swiggy or Zomato as well?",
      answer: "No, the Cheesy Rewards loyalty program is exclusively available for orders placed directly via the Papa Veg Pizza official mobile app and website."
    },
    {
      question: "Is the program applicable on Papa Veg Pizza orders through IRCTC?",
      answer: "Currently, Cheesy Rewards points can only be earned and redeemed on direct app and website deliveries, and cannot be combined with IRCTC train delivery orders."
    },
    {
      question: "Can I opt-out from the program?",
      answer: "Participation is voluntary and free. If you wish to close your loyalty account, you can contact our customer support team at any time."
    },
    {
      question: "Can I redeem my Cheesy Rewards Points for real money?",
      answer: "No, Cheesy Rewards points have no direct cash value and can only be redeemed for eligible menu items within the Papa Veg Pizza app."
    },
    {
      question: "Can I transfer/gift/share my Cheesy Rewards Points to others?",
      answer: "Cheesy Rewards Points are non-transferable and linked to your registered mobile number and account."
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

  const programName = rewardsConfig?.programName || 'Cheesy Rewards';
  const pointsRequired = Math.max(1, Number(rewardsConfig?.defaultPointsRequired) || 600);
  const availableRedemptions = Math.floor(userPoints / pointsRequired);
  const filledSlices = Math.min(6, Math.floor((userPoints / pointsRequired) * 6));
  const rewardImage = rewardsConfig?.rewardImageUrl || products[0]?.image || '';
  const walletTabLabel = `${rewardsConfig?.walletTabLabel || 'Wallet'} - ${walletBalance.toLocaleString('en-IN')} Points`;
  const howItWorksSteps = (Array.isArray(rewardsConfig?.howItWorksSteps) && rewardsConfig.howItWorksSteps.length > 0)
    ? rewardsConfig.howItWorksSteps
    : [
        {
          title: '1 Order =',
          highlight: `${rewardsConfig?.pointsPerOrder || 100} Points`,
          description: `Earn ${rewardsConfig?.pointsPerOrder || 100} points on every eligible order of ₹${rewardsConfig?.minOrderAmount || 349} or more`,
          note: ''
        },
        {
          title: `${pointsRequired} points =`,
          highlight: 'FREE PIZZA',
          description: `Redeem ${pointsRequired} points for a Free Pizza`,
          note: ''
        }
      ];

  return (
    <div
      className="fixed inset-0 z-50 bg-[var(--secondary-off-white,#F8F6F2)] dark:bg-zinc-950 flex flex-col font-sans overflow-hidden"
      style={{ backgroundColor: 'var(--secondary-off-white, #F8F6F2)' }}
    >
      {/* ── Fixed Top Header Bar ── */}
      <div className="h-14 flex items-center px-4 gap-3 bg-[var(--secondary-off-white,#F8F6F2)] dark:bg-zinc-900 shrink-0 z-30">
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
      <div className={`flex-1 overflow-y-auto overscroll-contain ${activeTab === 'rewards' && !isEnrolled ? 'pb-28' : 'pb-10'}`}>
        <div className="max-w-md mx-auto px-4 pt-2 space-y-4">
          {/* ── Tab Switcher: [ Cheesy Rewards ] | [ Wallet - N Points ] ── */}
          <div className="bg-zinc-200/80 dark:bg-zinc-800/80 p-1 rounded-xl flex items-center border border-zinc-300/60 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setActiveTab('rewards')}
              className={`flex-1 py-2.5 text-xs sm:text-[13px] font-semibold rounded-lg transition-all cursor-pointer border-0 ${
                activeTab === 'rewards'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'bg-transparent text-zinc-700 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              {programName}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className={`flex-1 py-2.5 text-xs sm:text-[13px] font-semibold rounded-lg transition-all cursor-pointer border-0 ${
                activeTab === 'wallet'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                  : 'bg-transparent text-zinc-700 hover:text-zinc-900 dark:text-zinc-400'
              }`}
            >
              {walletTabLabel}
            </button>
          </div>

          {/* ── VIEW 1: CHEESY REWARDS ── */}
          {activeTab === 'rewards' && (
            <div className="space-y-5">
              {isEnrolled && (
                <>
                  {/* Program logo + headline */}
                  <div className="flex flex-col items-center text-center pt-1">
                    <img
                      src={rewardsConfig?.logoUrl || rewardsLogo}
                      alt={programName}
                      className="w-36 h-36 object-contain"
                    />
                    <h2 className="text-lg font-semibold text-zinc-900 dark:text-white mt-1 m-0">
                      {rewardsConfig?.rewardsHeadline || 'Your Cheesy Rewards'}
                    </h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 m-0">
                      {rewardsConfig?.rewardsSubheadline || 'Collect Points to get Free Pizzas!'}
                    </p>
                  </div>

                  {/* Your Points | Your Rewards */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-2xs">
                      <div className="py-2 text-center text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                        {rewardsConfig?.pointsCardTitle || 'Your Points'}
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center py-5 px-2">
                        <PizzaPie filled={filledSlices} />
                        <p className="mt-3 m-0 text-zinc-900 dark:text-white">
                          <span className="text-xl font-semibold">{userPoints}/{pointsRequired}</span>{' '}
                          <span className="text-xs font-semibold">points</span>
                        </p>
                      </div>
                      <div className="px-3 pb-3">
                        <button
                          type="button"
                          onClick={handleNavigateMenu}
                          className="w-full py-2.5 bg-[#EE3A43] hover:bg-[#d92d36] text-white font-semibold text-[13px] rounded-lg transition-all active:scale-[0.98] cursor-pointer border-0"
                          style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
                        >
                          {rewardsConfig?.orderButtonText || 'Order & Get points'}
                        </button>
                      </div>
                    </div>

                    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col shadow-2xs">
                      <div className="py-2 text-center text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800">
                        {rewardsConfig?.rewardsCardTitle || 'Your Rewards'}
                      </div>
                      <div className="flex-1 flex flex-col items-center justify-center py-5 px-2">
                        <div className="w-24 h-24 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                          {rewardImage ? (
                            <img src={rewardImage} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Gift className="w-9 h-9 text-zinc-400" />
                          )}
                        </div>
                        <p className="mt-3 m-0 text-zinc-900 dark:text-white">
                          <span className="text-xl font-semibold">{availableRedemptions}</span>{' '}
                          <span className="text-xs text-zinc-500 dark:text-zinc-400">
                            {rewardsConfig?.freeRewardLabel || 'Free Pizza'}
                          </span>
                        </p>
                      </div>
                      <div className="px-3 pb-3">
                        <button
                          type="button"
                          disabled={availableRedemptions < 1}
                          onClick={() => setIsRedeemOpen(true)}
                          className={`w-full py-2.5 font-semibold text-[13px] rounded-lg flex items-center justify-center gap-1.5 border-0 transition-all ${
                            availableRedemptions < 1
                              ? 'bg-zinc-500 text-white cursor-not-allowed'
                              : 'bg-[#EE3A43] text-white cursor-pointer active:scale-[0.98]'
                          }`}
                          style={availableRedemptions >= 1 ? { backgroundColor: 'var(--accent-red, #EE3A43)' } : undefined}
                        >
                          {availableRedemptions < 1 && <Lock className="w-3.5 h-3.5" />}
                          {rewardsConfig?.redeemButtonText || 'Redeem'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {!isEnrolled && (
                <>
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
                      <h3 className="font-semibold text-[15px] sm:text-base text-zinc-900 dark:text-white leading-snug">
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
                      <h3 className="font-semibold text-[15px] sm:text-base text-zinc-900 dark:text-white leading-snug">
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
                    className="w-full mt-4 py-2.5 sm:py-3 bg-[#EE3A43] hover:bg-[#d92d36] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-red-500/25 active:scale-[0.99] cursor-pointer border-0"
                    style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
                  >
                    {rewardsConfig?.buttonText || 'Enroll Now'}
                  </button>

                  <p className="text-center text-[11px] text-zinc-500 dark:text-zinc-400 mt-2.5">
                    {rewardsConfig?.termsText || 'By enrolling you agree to our'}{' '}
                    <button
                      type="button"
                      onClick={() => setIsTermsModalOpen(true)}
                      className="text-[var(--accent-red,#EE3A43)] font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                    >
                      {rewardsConfig?.termsLinkText || 'Terms and Conditions'}
                    </button>
                  </p>
                </div>
                </>
              )}

              {/* ── How it works ── */}
              <div className="px-1 pt-1">
                <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-white m-0 mb-4">
                  {rewardsConfig?.howItWorksTitle || 'How it works'}
                </h3>
                <div>
                  {howItWorksSteps.map((step, i) => (
                    <div key={i} className="flex items-start gap-4">
                      <div className="flex flex-col items-center shrink-0">
                        <div className="w-14 h-14 rounded-full border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
                          {step.iconUrl ? (
                            <img src={step.iconUrl} alt="" className="w-10 h-10 object-contain" />
                          ) : (
                            <PizzaPie filled={i === 0 ? 1 : 6} size={36} />
                          )}
                        </div>
                        {i < howItWorksSteps.length - 1 && (
                          <div className="w-0 h-6 border-l-2 border-dotted border-zinc-300 dark:border-zinc-700" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pb-4">
                        <p className="m-0 text-[17px] font-semibold text-zinc-900 dark:text-white leading-snug">
                          {step.title}{' '}
                          {step.highlight && (
                            <span style={{ color: 'var(--accent-red, #EE3A43)' }}>{step.highlight}</span>
                          )}
                        </p>
                        {step.description && (
                          <p className="m-0 mt-1 text-xs text-zinc-600 dark:text-zinc-400 leading-snug">{step.description}</p>
                        )}
                        {step.note && (
                          <p className="m-0 mt-1 text-xs text-zinc-400 dark:text-zinc-500 leading-snug">{step.note}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ── FAQs ── */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs p-4">
                <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-white m-0 mb-3">
                  {rewardsConfig?.faqTitle || 'Frequently Asked Questions'}
                </h3>
                <div className="space-y-2.5">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} question={faq.question}>
                      {faq.answer}
                    </AccordionItem>
                  ))}
                </div>
              </div>

              {/* ── Terms & Conditions ── */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsTermsOpen((v) => !v)}
                  className="w-full flex items-center justify-between px-4 py-4 text-left cursor-pointer bg-transparent border-0"
                >
                  <span className="text-[15px] font-semibold text-zinc-900 dark:text-white">
                    {rewardsConfig?.termsTitle || 'Terms & Conditions'}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform duration-200 ${isTermsOpen ? 'rotate-180' : ''}`}
                  />
                </button>
                {isTermsOpen && (
                  <div className="px-4 pb-4 space-y-3">
                    {terms.map((term, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
                        <span className="text-zinc-400 font-semibold leading-none mt-0.5 select-none shrink-0">•</span>
                        <p className="flex-1 m-0">{term}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Quit program ── */}
              {isEnrolled && (
                <div className="text-center pb-2">
                  <button
                    type="button"
                    onClick={() => setIsQuitModalOpen(true)}
                    className="text-[13px] font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
                    style={{ color: 'var(--accent-red, #EE3A43)' }}
                  >
                    {rewardsConfig?.quitLinkText || 'I want to quit this program'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── VIEW 2: WALLET (Refund Points & activity) ── */}
          {activeTab === 'wallet' && (
            <WalletSection
              isEnrolled={isEnrolled}
              onEnroll={handleEnroll}
              rewardsConfig={rewardsConfig}
              onBalanceChange={setWalletBalance}
            />
          )}
        </div>
      </div>

      {/* ── Sticky Enroll bar (only before enrolment) ── */}
      {activeTab === 'rewards' && !isEnrolled && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-[var(--secondary-off-white,#F8F6F2)]/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200/60 dark:border-zinc-800 p-3 sm:p-4 max-w-md mx-auto shadow-lg">
          <button
            type="button"
            onClick={handleEnroll}
            className="w-full py-3 bg-[#EE3A43] hover:bg-[#d92d36] text-white font-semibold text-sm rounded-xl transition-all shadow-md shadow-red-500/25 active:scale-[0.99] cursor-pointer border-0"
            style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
          >
            {rewardsConfig?.buttonText || 'Enroll Now'}
          </button>
          <p className="text-center text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-1.5">
            {rewardsConfig?.termsText || 'By enrolling you agree to our'}{' '}
            <button
              type="button"
              onClick={() => setIsTermsModalOpen(true)}
              className="text-[var(--accent-red,#EE3A43)] font-semibold hover:underline cursor-pointer bg-transparent border-0 p-0"
            >
              {rewardsConfig?.termsLinkText || 'Terms and Conditions'}
            </button>
          </p>
        </div>
      )}

      {/* ── Redeem sheet: reward catalogue ── */}
      {isRedeemOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end items-center">
          <div
            onClick={() => setIsRedeemOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-200"
          />
          <div
            className="relative z-10 w-full max-w-lg bg-[var(--secondary-off-white,#F8F6F2)] dark:bg-zinc-900 rounded-t-[28px] shadow-2xl flex flex-col max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom duration-250"
            style={{ backgroundColor: 'var(--secondary-off-white, #F8F6F2)', fontFamily: 'Poppins, sans-serif' }}
          >
            <div className="px-6 pt-5 pb-2 flex items-center justify-between">
              <h3 className="text-[17px] font-semibold text-zinc-900 dark:text-white tracking-tight m-0">
                {rewardsConfig?.redeemSheetTitle || 'Choose your Free Pizza'}
              </h3>
              <button
                type="button"
                onClick={() => setIsRedeemOpen(false)}
                aria-label="Close"
                className="p-1 rounded-full text-zinc-500 hover:bg-zinc-200/60 cursor-pointer bg-transparent border-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="px-6 pb-4 overflow-y-auto hide-scrollbar">
              {(rewardsConfig?.showVegFilter !== false || rewardsConfig?.showNonVegFilter !== false || rewardsConfig?.showSortFilter !== false) && (
                <div className="sticky top-0 z-20 bg-[var(--secondary-off-white,#F8F6F2)]/95 dark:bg-zinc-950/95 backdrop-blur-md py-2.5 flex items-center justify-between gap-2 border-b border-zinc-200/60 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    {/* Veg Only Filter */}
                    {rewardsConfig?.showVegFilter !== false && (
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
                    )}

                    {/* Non Veg Only Filter */}
                    {rewardsConfig?.showNonVegFilter !== false && (
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
                    )}
                  </div>

                  {/* Sort By Dropdown */}
                  {rewardsConfig?.showSortFilter !== false && (
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
                                sortBy === opt.id ? 'text-[#EE3A43] font-semibold bg-zinc-50 dark:bg-zinc-800' : 'text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-[#EE3A43]" />}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

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
                          <h4 className="font-semibold text-sm sm:text-[15px] text-zinc-900 dark:text-white truncate">
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
                          <span className="font-semibold text-sm text-zinc-900 dark:text-white">
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
            </div>
            <div className="px-6 pb-5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsRedeemOpen(false);
                  handleNavigateMenu();
                }}
                className="w-full py-3 bg-[#EE3A43] text-white font-semibold text-sm rounded-xl active:scale-[0.99] cursor-pointer border-0"
                style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
              >
                View Menu
              </button>
            </div>
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
            className="relative z-10 w-full max-w-lg bg-[var(--secondary-off-white,#F8F6F2)] dark:bg-zinc-900 rounded-t-[28px] shadow-2xl flex flex-col max-h-[75vh] overflow-hidden animate-in slide-in-from-bottom duration-250 border-t border-zinc-200/60 dark:border-zinc-800"
            style={{ backgroundColor: 'var(--secondary-off-white, #F8F6F2)', fontFamily: 'Poppins, sans-serif' }}
          >
            <div className="px-6 pt-5 pb-3">
              <h3 className="text-[17px] sm:text-lg font-semibold text-zinc-900 dark:text-white tracking-tight m-0">
                Terms & Conditions
              </h3>
            </div>

            <div className="px-6 pb-6 overflow-y-auto space-y-3.5 hide-scrollbar">
              {terms.map((term, i) => (
                <div key={i} className="flex items-start gap-2.5 text-zinc-600 dark:text-zinc-300 text-xs sm:text-[13px] leading-relaxed">
                  <span className="text-zinc-400 font-semibold text-sm leading-none mt-0.5 select-none shrink-0">•</span>
                  <p className="flex-1 m-0">{term}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* ── Quit Program Bottom Sheet Modal (Matching Reference Image 3) ── */}
      {isQuitModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end items-center">
          {/* Dimmed backdrop */}
          <div 
            onClick={() => setIsQuitModalOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-[1px] animate-in fade-in duration-200"
          />

          {/* Bottom Sheet Card */}
          <div 
            className="relative z-10 w-full max-w-md bg-[var(--secondary-off-white,#F8F6F2)] dark:bg-zinc-900 rounded-t-[28px] shadow-2xl p-6 pb-8 animate-in slide-in-from-bottom duration-250 border-t border-zinc-200/60 dark:border-zinc-800"
            style={{ backgroundColor: 'var(--secondary-off-white, #F8F6F2)', fontFamily: "'Poppins', sans-serif" }}
          >
            {/* Title */}
            <h3 className="text-lg sm:text-xl font-semibold text-zinc-900 dark:text-white tracking-tight mb-2">
              {rewardsConfig?.quitModalTitle || `Quit ${rewardsConfig?.programName || 'Cheesy Rewards'}?`}
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-6 font-normal">
              {rewardsConfig?.quitModalDescription || "All your points and progress will be removed. You'll need to enrol again to start earning rewards."}
            </p>

            {/* Action Buttons: Stay (left) and Quit Anyway (right) */}
            <div className="grid grid-cols-2 gap-3.5">
              {/* Stay Button */}
              <button
                type="button"
                onClick={() => setIsQuitModalOpen(false)}
                className="w-full py-3 px-4 rounded-xl border border-zinc-900 dark:border-zinc-300 bg-transparent text-zinc-900 dark:text-white font-semibold text-sm hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] transition-all cursor-pointer"
              >
                {rewardsConfig?.quitStayButtonText || 'Stay'}
              </button>

              {/* Quit Anyway Button */}
              <button
                type="button"
                onClick={handleQuitProgram}
                className="w-full py-3 px-4 rounded-xl bg-[#EE3A43] hover:bg-[#d92d36] text-white font-semibold text-sm shadow-md shadow-red-500/20 active:scale-[0.98] transition-all cursor-pointer border-0"
                style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
              >
                {rewardsConfig?.quitConfirmButtonText || 'Quit Anyway'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Animated Action Loading Bottom Sheet (Matching Reference Images 1 & 2) ── */}
      <RewardsActionLoadingModal
        isOpen={actionLoadingState.isOpen}
        message={actionLoadingState.message}
        programName={actionLoadingState.programName}
        logoSrc={rewardsConfig?.logoUrl || undefined}
      />

      {/* ── Welcome To Rewards Bottom Sheet Modal (Matching Reference Image 2) ── */}
      <RewardsEnrollWelcomeModal
        isOpen={isEnrollWelcomeOpen}
        onClose={() => setIsEnrollWelcomeOpen(false)}
        onOrderNow={() => {
          setIsEnrollWelcomeOpen(false);
          handleNavigateMenu();
        }}
        programName={rewardsConfig?.programName || 'Cheesy Rewards'}
        title={rewardsConfig?.welcomeModalTitle}
        subtitle={rewardsConfig?.welcomeModalSubtitle}
        buttonText={rewardsConfig?.welcomeModalButtonText || 'Order Now'}
      />
    </div>
  );
}

/** 6-slice pizza meter: `filled` slices are painted in the theme accent colour. */
function PizzaPie({ filled = 0, size = 80 }) {
  const slices = Array.from({ length: 6 }, (_, i) => {
    const a0 = ((-90 + i * 60) * Math.PI) / 180;
    const a1 = ((-90 + (i + 1) * 60) * Math.PI) / 180;
    const p = (a) => `${(50 + 46 * Math.cos(a)).toFixed(2)} ${(50 + 46 * Math.sin(a)).toFixed(2)}`;
    return `M50 50 L${p(a0)} A46 46 0 0 1 ${p(a1)} Z`;
  });
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
      {slices.map((d, i) => (
        <path
          key={i}
          d={d}
          fill={i < filled ? 'var(--accent-red, #EE3A43)' : '#E4E7EC'}
          fillOpacity={i < filled ? 0.9 : 0.7}
          stroke="#ffffff"
          strokeWidth="2.5"
        />
      ))}
    </svg>
  );
}
