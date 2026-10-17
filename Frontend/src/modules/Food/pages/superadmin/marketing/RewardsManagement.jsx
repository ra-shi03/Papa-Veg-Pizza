import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, Upload, Save, Eye, Plus, Trash2, HelpCircle, FileText, 
  CheckCircle2, Award, ArrowUp, ArrowDown, Search, X, Check, Filter, Pizza, Layers 
} from 'lucide-react';
import { toast } from 'sonner';
import { adminClient } from '@/services/api/axios';
import { uploadAPI } from '@/services/api';

// 10 Signature Pizza Products for Cheesy Rewards Catalogue (matching reference screenshot)
const SIGNATURE_10_PIZZAS = [
  {
    productId: 'so-cheesee',
    name: 'SO CHEESEE',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'So Cheesy Pizza Sandwich with premium molten mozzarella & herb seasoning.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 149,
    isVeg: true,
    sortOrder: 0
  },
  {
    productId: 'smoky-corn-paneer',
    name: 'SMOKY CORN PANEER',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Smoky Corn Paneer Pizza Sandwich loaded with roasted corn and spiced cottage cheese.',
    image: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 129,
    isVeg: true,
    sortOrder: 1
  },
  {
    productId: 'paneer-tikka',
    name: 'PANEER TIKKA',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Paneer Tikka Pizza Sandwich infused with aromatic tandoori masala and crunchy capsicum.',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 129,
    isVeg: true,
    sortOrder: 2
  },
  {
    productId: 'hott-pepper',
    name: 'HOTT PEPPER',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Hot Pepper Pizza Sandwich with fiery red paprika and roasted jalapenos.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 119,
    isVeg: true,
    sortOrder: 3
  },
  {
    productId: 'margherita',
    name: 'MARGHERITA',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Classic delight with 100% real mozzarella cheese.',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 119,
    isVeg: true,
    sortOrder: 4
  },
  {
    productId: 'corn-n-cheese',
    name: 'CORN N CHEESE',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Sweet & juicy golden corn feast with molten mozzarella cheese.',
    image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 149,
    isVeg: true,
    sortOrder: 5
  },
  {
    productId: 'farmhouse',
    name: 'FARMHOUSE',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Delightful combination of onion, capsicum, tomato & grilled mushroom.',
    image: 'https://images.unsplash.com/photo-1571407970349-bc81e7e96d47?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 199,
    isVeg: true,
    sortOrder: 6
  },
  {
    productId: 'veggie-paradise',
    name: 'VEGGIE PARADISE',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'The awesome foursome! Golden corn, black olives, capsicum, red paprika.',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 219,
    isVeg: true,
    sortOrder: 7
  },
  {
    productId: 'peppy-paneer',
    name: 'PEPPY PANEER',
    size: 'Regular',
    crust: 'Fresh Pan Pizza',
    description: 'Flavorful trio of juicy paneer, crisp capsicum with spicy red paprika.',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 229,
    isVeg: true,
    sortOrder: 8
  },
  {
    productId: 'paneer-makhani',
    name: 'PANEER MAKHANI',
    size: 'Regular',
    crust: 'New Hand Tossed',
    description: 'Juicy paneer chunks marinated in rich tandoori makhani gravy with onion and capsicum.',
    image: 'https://images.unsplash.com/photo-1534308983496-4fabb1a015ee?w=500&auto=format&fit=crop&q=60',
    requiredPoints: 600,
    originalPrice: 249,
    isVeg: true,
    sortOrder: 9
  }
];

export default function RewardsManagement() {
  const [config, setConfig] = useState({
    isEnabled: true,
    showVegFilter: true,
    showNonVegFilter: true,
    showSortFilter: true,
    programName: 'Cheesy Rewards',
    logoUrl: '',
    title: 'Earn Points to Unlock Free Treats!',
    subtitle1: '1 Order = 100 Points',
    subtitle2: 'Relish freebies at 600 points',
    orderPointsTitle: '1 Order = 100 Points',
    orderPointsSubtitle: 'On every order above ₹349',
    freeItemsTitle: 'Unlock Free Items',
    freeItemsSubtitle: 'Starting at 600 Points',
    minOrderAmount: 349,
    pointsPerOrder: 100,
    defaultPointsRequired: 600,
    buttonText: 'Enroll Now',
    termsText: 'By enrolling you agree to our',
    termsLinkText: 'Terms and Conditions',
    termsLink: '#',
    rewardProducts: [],
    faqs: [
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
    ],
    terms: [
      'Enrollment in the Rewards Program is free for all registered customers.',
      'Points are credited within 24 hours of successful order delivery.',
      'Orders below the minimum threshold (₹349) do not qualify for point accrual.',
      'Reward products are subject to daily kitchen availability and stock.',
      'Papa Veg Pizza reserves the right to modify point rules and redemption criteria at any time.'
    ]
  });

  const [activeTab, setActiveTab] = useState('catalogue'); // 'general', 'rules', 'catalogue', 'faqs', 'terms'
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef(null);

  // Store Products Picker State
  const [storeProducts, setStoreProducts] = useState([]);
  const [isLoadingStoreProducts, setIsLoadingStoreProducts] = useState(false);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');

  useEffect(() => {
    fetchConfig();
    fetchStoreProductsList();
  }, []);

  const fetchConfig = async () => {
    setIsLoading(true);
    try {
      const res = await adminClient.get('/food/admin/rewards/config');
      if (res?.data?.data) {
        const d = res.data.data;
        setConfig(prev => ({
          ...prev,
          ...d,
          showVegFilter: d.showVegFilter !== undefined ? d.showVegFilter : true,
          showNonVegFilter: d.showNonVegFilter !== undefined ? d.showNonVegFilter : true,
          showSortFilter: d.showSortFilter !== undefined ? d.showSortFilter : true,
          rewardProducts: Array.isArray(d.rewardProducts) ? d.rewardProducts : prev.rewardProducts,
          faqs: Array.isArray(d.faqs) && d.faqs.length > 0 ? d.faqs : prev.faqs,
          terms: Array.isArray(d.terms) && d.terms.length > 0 ? d.terms : prev.terms
        }));
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load rewards config');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStoreProductsList = async () => {
    setIsLoadingStoreProducts(true);
    try {
      const res = await adminClient.get('/food/admin/products');
      const list = res?.data?.data?.products || res?.data?.data || [];
      if (Array.isArray(list)) {
        setStoreProducts(list);
      }
    } catch (err) {
      console.warn('Could not load store products for picker:', err);
    } finally {
      setIsLoadingStoreProducts(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await adminClient.put('/food/admin/rewards/config', config);
      if (res?.data?.success) {
        setConfig(res.data.data);
        toast.success('Rewards configuration saved successfully!');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to save configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await uploadAPI.uploadMedia(file);
      const url = res?.data?.data?.url || res?.data?.url;
      if (url) {
        setConfig(prev => ({ ...prev, logoUrl: url }));
        toast.success('Logo uploaded!');
      } else {
        toast.error('Failed to get uploaded image URL');
      }
    } catch (err) {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  // Products Management Handlers
  const handleToggleFilter = (key) => {
    setConfig(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleAddProductFromStore = (prod) => {
    if ((config.rewardProducts?.length || 0) >= 10) {
      toast.error('Maximum 10 reward products can be displayed.');
      return;
    }
    const alreadyExists = config.rewardProducts?.some(
      p => p.productId === prod._id || p.productId === prod.id || p.name.toLowerCase() === prod.name.toLowerCase()
    );
    if (alreadyExists) {
      toast.warning(`"${prod.name}" is already in the rewards list.`);
      return;
    }
    const firstSize = Array.isArray(prod.sizes) && prod.sizes.length > 0 ? prod.sizes[0] : null;
    const price = Number(firstSize?.price ?? prod.price ?? 149);
    const originalPrice = Number(firstSize?.originalPrice ?? prod.originalPrice ?? price);
    const isVeg = prod.vegType ? prod.vegType === 'veg' || prod.vegType === 'vegan' : !String(prod.name).toLowerCase().includes('chicken');
    
    const newItem = {
      productId: prod._id || prod.id,
      name: String(prod.name || '').toUpperCase(),
      size: firstSize?.size || 'Regular',
      crust: prod.defaultCrust || 'New Hand Tossed',
      description: prod.shortDescription || prod.description || `${prod.name} Pizza Sandwich`,
      image: prod.image || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      requiredPoints: Number(config.defaultPointsRequired || 600),
      originalPrice: originalPrice > 0 ? originalPrice : price,
      isVeg,
      sortOrder: (config.rewardProducts?.length || 0)
    };

    setConfig(prev => ({
      ...prev,
      rewardProducts: [...(prev.rewardProducts || []), newItem]
    }));
    toast.success(`Added "${prod.name}" to Reward Products`);
  };

  const handleAutoFillSignaturePizzas = () => {
    setConfig(prev => ({
      ...prev,
      rewardProducts: [...SIGNATURE_10_PIZZAS]
    }));
    toast.success('Loaded 10 signature pizzas matching reference!');
  };

  const handleAddCustomRewardProduct = () => {
    if ((config.rewardProducts?.length || 0) >= 10) {
      toast.error('Maximum 10 reward products can be displayed.');
      return;
    }
    const newItem = {
      productId: `custom-${Date.now()}`,
      name: 'NEW SPECIAL PIZZA',
      size: 'Regular',
      crust: 'New Hand Tossed',
      description: 'Special cheesy delight with fresh toppings & mozzarella.',
      image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=500&auto=format&fit=crop&q=60',
      requiredPoints: Number(config.defaultPointsRequired || 600),
      originalPrice: 149,
      isVeg: true,
      sortOrder: (config.rewardProducts?.length || 0)
    };
    setConfig(prev => ({
      ...prev,
      rewardProducts: [...(prev.rewardProducts || []), newItem]
    }));
    toast.success('Added custom reward item');
  };

  const handleUpdateRewardProduct = (idx, field, value) => {
    setConfig(prev => {
      const updated = [...(prev.rewardProducts || [])];
      updated[idx] = { ...updated[idx], [field]: value };
      return { ...prev, rewardProducts: updated };
    });
  };

  const handleRemoveRewardProduct = (idx) => {
    setConfig(prev => ({
      ...prev,
      rewardProducts: (prev.rewardProducts || []).filter((_, i) => i !== idx)
    }));
  };

  const handleMoveRewardProduct = (idx, direction) => {
    setConfig(prev => {
      const list = [...(prev.rewardProducts || [])];
      if (direction === 'up' && idx > 0) {
        const temp = list[idx - 1];
        list[idx - 1] = list[idx];
        list[idx] = temp;
      } else if (direction === 'down' && idx < list.length - 1) {
        const temp = list[idx + 1];
        list[idx + 1] = list[idx];
        list[idx] = temp;
      }
      return { ...prev, rewardProducts: list };
    });
  };

  // FAQs Handlers
  const handleAddFaq = () => {
    setConfig(prev => ({
      ...prev,
      faqs: [...prev.faqs, { question: '', answer: '' }]
    }));
  };

  const handleUpdateFaq = (index, field, value) => {
    const nextFaqs = [...config.faqs];
    nextFaqs[index][field] = value;
    setConfig(prev => ({ ...prev, faqs: nextFaqs }));
  };

  const handleDeleteFaq = (index) => {
    setConfig(prev => ({
      ...prev,
      faqs: prev.faqs.filter((_, i) => i !== index)
    }));
  };

  // Terms Handlers
  const handleAddTerm = () => {
    setConfig(prev => ({
      ...prev,
      terms: [...prev.terms, 'New policy or rule statement...']
    }));
  };

  const handleUpdateTerm = (index, value) => {
    const nextTerms = [...config.terms];
    nextTerms[index] = value;
    setConfig(prev => ({ ...prev, terms: nextTerms }));
  };

  const handleDeleteTerm = (index) => {
    setConfig(prev => ({
      ...prev,
      terms: prev.terms.filter((_, i) => i !== index)
    }));
  };

  // Filter store products for picker modal
  const filteredStoreProducts = storeProducts.filter(p => {
    if (!productSearchQuery.trim()) return true;
    const q = productSearchQuery.toLowerCase();
    return String(p.name || '').toLowerCase().includes(q) || String(p.categoryName || '').toLowerCase().includes(q);
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--primary)] mb-3" />
        <p className="text-sm text-zinc-500">Loading Rewards & Loyalty configuration...</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Award className="w-7 h-7 text-[var(--primary,#EE3A43)]" />
            Rewards & Wallet Management
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure Cheesy Rewards rules, catalogue products (10 items), filter buttons (Veg, Non-Veg, Sort), FAQs, and terms.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-5 py-2.5 bg-[var(--primary,#EE3A43)] hover:opacity-90 text-white font-semibold rounded-xl flex items-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Changes
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 gap-2 overflow-x-auto hide-scrollbar">
        {[
          { id: 'catalogue', label: '10 Products & Filters', icon: Layers },
          { id: 'general', label: 'General & Header', icon: Award },
          { id: 'rules', label: 'Points & Rules', icon: CheckCircle2 },
          { id: 'faqs', label: 'FAQs', icon: HelpCircle },
          { id: 'terms', label: 'Terms & Conditions', icon: FileText }
        ].map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => {
                setActiveTab(t.id);
                if (t.id === 'catalogue') fetchStoreProductsList();
              }}
              className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
                activeTab === t.id
                  ? 'border-[var(--primary,#EE3A43)] text-[var(--primary,#EE3A43)]'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Settings */}
        <div className="lg:col-span-7 space-y-6">

          {/* TAB: 10 Products & Filters (Main requested feature) */}
          {activeTab === 'catalogue' && (
            <div className="space-y-6">
              {/* Filter Buttons Visibility Settings */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="border-b pb-3 dark:border-zinc-800">
                  <h3 className="font-bold text-base flex items-center gap-2 text-zinc-900 dark:text-white">
                    <Filter className="w-5 h-5 text-[var(--primary,#EE3A43)]" />
                    Catalogue Filter & Sort Buttons
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Choose which filter buttons appear above the reward products on the mobile app (matching reference screenshot).
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Veg Only Toggle */}
                  <div 
                    onClick={() => handleToggleFilter('showVegFilter')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      config.showVegFilter !== false
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-4 h-4 border border-emerald-600 flex items-center justify-center rounded-[3px] p-[1px]">
                        <span className="w-2 h-2 bg-emerald-600 rounded-full" />
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        config.showVegFilter !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {config.showVegFilter !== false ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-zinc-900 dark:text-white">Veg Only Button</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Show [Veg Only] filter pill</p>
                  </div>

                  {/* Non Veg Only Toggle */}
                  <div 
                    onClick={() => handleToggleFilter('showNonVegFilter')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      config.showNonVegFilter !== false
                        ? 'border-red-500 bg-red-50/50 dark:bg-red-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="w-4 h-4 border border-amber-800 dark:border-red-500 flex items-center justify-center rounded-[3px] p-[1px]">
                        <span className="w-0 h-0 border-l-[3.5px] border-l-transparent border-r-[3.5px] border-r-transparent border-b-[6px] border-b-amber-800 dark:border-b-red-500" />
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        config.showNonVegFilter !== false ? 'bg-red-100 text-red-800 dark:bg-red-900/60 dark:text-red-300' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {config.showNonVegFilter !== false ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-zinc-900 dark:text-white">Non Veg Only Button</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Show [Non Veg Only] filter pill</p>
                  </div>

                  {/* Sort By Toggle */}
                  <div 
                    onClick={() => handleToggleFilter('showSortFilter')}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                      config.showSortFilter !== false
                        ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">⇅</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        config.showSortFilter !== false ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/60 dark:text-blue-300' : 'bg-zinc-200 text-zinc-600'
                      }`}>
                        {config.showSortFilter !== false ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <p className="font-bold text-xs text-zinc-900 dark:text-white">Sort by Dropdown</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">Show [Sort by ⇅] button</p>
                  </div>
                </div>
              </div>

              {/* 10 Reward Products Management */}
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3 dark:border-zinc-800">
                  <div>
                    <h3 className="font-bold text-base flex items-center gap-2 text-zinc-900 dark:text-white">
                      <Pizza className="w-5 h-5 text-[var(--primary,#EE3A43)]" />
                      Reward Catalogue Products (Up to 10)
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Selected: <strong className="text-zinc-900 dark:text-white">{config.rewardProducts?.length || 0} / 10</strong> products shown to users
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        fetchStoreProductsList();
                        setIsProductPickerOpen(true);
                      }}
                      className="px-3 py-1.5 bg-[var(--primary,#EE3A43)] hover:opacity-90 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Pick from Store
                    </button>
                    <button
                      type="button"
                      onClick={handleAutoFillSignaturePizzas}
                      className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
                    >
                      Auto-fill 10 Pizzas
                    </button>
                    <button
                      type="button"
                      onClick={handleAddCustomRewardProduct}
                      className="px-2.5 py-1.5 text-zinc-500 hover:text-zinc-800 text-xs font-semibold cursor-pointer"
                    >
                      + Custom Item
                    </button>
                  </div>
                </div>

                {/* Products List */}
                <div className="space-y-3 pt-1">
                  {(!config.rewardProducts || config.rewardProducts.length === 0) ? (
                    <div className="py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-center p-4">
                      <Pizza className="w-10 h-10 text-zinc-300 dark:text-zinc-700 mb-2" />
                      <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No Reward Products Configured</p>
                      <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                        Click "Auto-fill 10 Pizzas" to load the recommended products from the reference screenshot, or "Pick from Store" to select your own.
                      </p>
                      <button
                        type="button"
                        onClick={handleAutoFillSignaturePizzas}
                        className="mt-3 px-4 py-2 bg-[var(--primary,#EE3A43)] text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Auto-fill 10 Signature Pizzas
                      </button>
                    </div>
                  ) : (
                    config.rewardProducts.map((prod, idx) => (
                      <div 
                        key={idx}
                        className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-850 flex flex-col sm:flex-row items-start sm:items-center gap-3 transition-all"
                      >
                        {/* Number badge */}
                        <span className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>

                        {/* Thumbnail image */}
                        <div className="w-12 h-12 rounded-xl bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200 dark:border-zinc-700">
                          <img src={prod.image} alt={prod.name} className="w-full h-full object-cover" />
                        </div>

                        {/* Middle info and inputs */}
                        <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                          <div>
                            <input
                              type="text"
                              value={prod.name}
                              onChange={e => handleUpdateRewardProduct(idx, 'name', e.target.value.toUpperCase())}
                              placeholder="PRODUCT NAME"
                              className="w-full font-bold text-xs uppercase px-2.5 py-1 border rounded-md dark:bg-zinc-900 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                            />
                            <input
                              type="text"
                              value={prod.description || ''}
                              onChange={e => handleUpdateRewardProduct(idx, 'description', e.target.value)}
                              placeholder="Short Description (e.g. So Cheesy Pizza Sandwich)"
                              className="w-full text-[11px] text-zinc-500 mt-1 px-2.5 py-0.5 border rounded-md dark:bg-zinc-900 dark:border-zinc-700 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-zinc-400 block mb-0.5">Size | Crust</label>
                              <input
                                type="text"
                                value={`${prod.size || 'Regular'} | ${prod.crust || 'New Hand Tossed'}`}
                                onChange={e => {
                                  const parts = e.target.value.split('|');
                                  handleUpdateRewardProduct(idx, 'size', (parts[0] || 'Regular').trim());
                                  handleUpdateRewardProduct(idx, 'crust', (parts[1] || 'New Hand Tossed').trim());
                                }}
                                className="w-full text-[11px] px-2.5 py-1 border rounded-md dark:bg-zinc-900 dark:border-zinc-700"
                              />
                            </div>

                            <div className="w-20">
                              <label className="text-[10px] text-zinc-400 block mb-0.5">Points</label>
                              <input
                                type="number"
                                value={prod.requiredPoints || 600}
                                onChange={e => handleUpdateRewardProduct(idx, 'requiredPoints', Number(e.target.value))}
                                className="w-full text-xs font-bold px-2 py-1 border rounded-md dark:bg-zinc-900 dark:border-zinc-700 text-center"
                              />
                            </div>

                            <div className="w-16">
                              <label className="text-[10px] text-zinc-400 block mb-0.5">Price (₹)</label>
                              <input
                                type="number"
                                value={prod.originalPrice || 149}
                                onChange={e => handleUpdateRewardProduct(idx, 'originalPrice', Number(e.target.value))}
                                className="w-full text-xs px-2 py-1 border rounded-md dark:bg-zinc-900 dark:border-zinc-700 text-center"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Veg toggle and action buttons */}
                        <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                          {/* Veg/Non-Veg Toggle */}
                          <button
                            type="button"
                            onClick={() => handleUpdateRewardProduct(idx, 'isVeg', !prod.isVeg)}
                            title={prod.isVeg ? 'Click to make Non-Veg' : 'Click to make Veg'}
                            className={`p-1.5 rounded-lg border text-xs font-bold cursor-pointer ${
                              prod.isVeg
                                ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                                : 'bg-red-50 border-red-500 text-red-700'
                            }`}
                          >
                            {prod.isVeg ? '🟩 Veg' : '🔺 Non-Veg'}
                          </button>

                          {/* Reorder Buttons */}
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveRewardProduct(idx, 'up')}
                            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={idx === config.rewardProducts.length - 1}
                            onClick={() => handleMoveRewardProduct(idx, 'down')}
                            className="p-1.5 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleRemoveRewardProduct(idx)}
                            className="p-1.5 rounded-lg hover:bg-red-100 text-zinc-400 hover:text-red-600 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB: General & Header */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
                <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                  <div>
                    <p className="font-semibold text-sm">Enable Rewards Program</p>
                    <p className="text-xs text-zinc-500">Show Rewards card on home page and allow user enrollment</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={config.isEnabled}
                      onChange={e => setConfig(prev => ({ ...prev, isEnabled: e.target.checked }))}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-zinc-600 peer-checked:bg-[var(--primary,#EE3A43)]"></div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Program Name</label>
                    <input 
                      type="text" 
                      value={config.programName || ''} 
                      onChange={e => setConfig(prev => ({ ...prev, programName: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Enrollment Button Text</label>
                    <input 
                      type="text" 
                      value={config.buttonText || ''} 
                      onChange={e => setConfig(prev => ({ ...prev, buttonText: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Home Card Main Title</label>
                  <input 
                    type="text" 
                    value={config.title || ''} 
                    onChange={e => setConfig(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Home Subtitle Line 1</label>
                    <input 
                      type="text" 
                      value={config.subtitle1 || ''} 
                      onChange={e => setConfig(prev => ({ ...prev, subtitle1: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Home Subtitle Line 2</label>
                    <input 
                      type="text" 
                      value={config.subtitle2 || ''} 
                      onChange={e => setConfig(prev => ({ ...prev, subtitle2: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Rewards Logo / Badge Image</label>
                  <div className="flex items-center gap-4">
                    {config.logoUrl && (
                      <div className="w-14 h-14 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center p-1.5 border shrink-0">
                        <img src={config.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div className="flex-1">
                      <input 
                        type="file" 
                        ref={imageInputRef} 
                        onChange={handleImageUpload} 
                        accept="image/*" 
                        className="hidden" 
                      />
                      <button
                        type="button"
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="px-3 py-2 border rounded-lg text-xs font-semibold hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer"
                      >
                        {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                        Upload Logo Image
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB: Rules */}
          {activeTab === 'rules' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
              <h3 className="font-bold text-base border-b pb-3 dark:border-zinc-800">
                Points Calculation & Redemption Criteria
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Min Order Amount (₹)</label>
                  <input 
                    type="number" 
                    value={config.minOrderAmount || 349} 
                    onChange={e => setConfig(prev => ({ ...prev, minOrderAmount: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Points Per Order</label>
                  <input 
                    type="number" 
                    value={config.pointsPerOrder || 100} 
                    onChange={e => setConfig(prev => ({ ...prev, pointsPerOrder: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Points to Unlock Free Item</label>
                  <input 
                    type="number" 
                    value={config.defaultPointsRequired || 600} 
                    onChange={e => setConfig(prev => ({ ...prev, defaultPointsRequired: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Earn Benefit Title</label>
                  <input 
                    type="text" 
                    value={config.orderPointsTitle || ''} 
                    onChange={e => setConfig(prev => ({ ...prev, orderPointsTitle: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Earn Benefit Subtitle</label>
                  <input 
                    type="text" 
                    value={config.orderPointsSubtitle || ''} 
                    onChange={e => setConfig(prev => ({ ...prev, orderPointsSubtitle: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Free Items Benefit Title</label>
                  <input 
                    type="text" 
                    value={config.freeItemsTitle || ''} 
                    onChange={e => setConfig(prev => ({ ...prev, freeItemsTitle: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-zinc-700 dark:text-zinc-300">Free Items Benefit Subtitle</label>
                  <input 
                    type="text" 
                    value={config.freeItemsSubtitle || ''} 
                    onChange={e => setConfig(prev => ({ ...prev, freeItemsSubtitle: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm dark:bg-zinc-800 dark:border-zinc-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: FAQs */}
          {activeTab === 'faqs' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-[var(--primary,#EE3A43)]" />
                    Frequently Asked Questions
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Help your customers understand points, redemption and expiry rules.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddFaq}
                  className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add FAQ
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {config.faqs?.map((faq, index) => (
                  <div key={index} className="p-3 border rounded-xl dark:border-zinc-800 space-y-2 bg-zinc-50/50 dark:bg-zinc-850">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={faq.question}
                        onChange={e => handleUpdateFaq(index, 'question', e.target.value)}
                        placeholder="Question..."
                        className="w-full font-semibold text-xs px-2.5 py-1.5 border rounded-md dark:bg-zinc-900 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteFaq(index)}
                        className="p-1.5 text-zinc-400 hover:text-red-600 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <textarea
                      value={faq.answer}
                      onChange={e => handleUpdateFaq(index, 'answer', e.target.value)}
                      placeholder="Answer..."
                      rows={2}
                      className="w-full px-3 py-1.5 border rounded-md text-xs dark:bg-zinc-900 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] resize-none"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: Terms */}
          {activeTab === 'terms' && (
            <div className="bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 dark:border-zinc-800">
                <div>
                  <h3 className="font-bold text-base flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[var(--primary,#EE3A43)]" />
                    Terms & Conditions
                  </h3>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Displayed in the dynamic bottom-sheet modal popup on the user app.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddTerm}
                  className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Condition
                </button>
              </div>

              <div className="space-y-3 pt-2">
                {config.terms?.map((term, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 shrink-0" />
                    <input
                      type="text"
                      value={term}
                      onChange={e => handleUpdateTerm(index, e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-lg text-xs dark:bg-zinc-900 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteTerm(index)}
                      className="p-1.5 text-zinc-400 hover:text-red-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Live Preview Area */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-xl shadow-xs border border-zinc-200 dark:border-zinc-800 sticky top-4">
            <h3 className="font-bold text-sm border-b pb-3 mb-4 flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Eye className="w-4 h-4 text-zinc-400" />
              Live Preview (Mobile View)
            </h3>

            {/* Mobile screen frame */}
            <div className="max-w-[340px] mx-auto bg-white rounded-2xl shadow-md border border-zinc-200 overflow-hidden text-zinc-900">
              {/* Mock Mobile Top Bar */}
              <div className="h-12 px-3 flex items-center gap-2 border-b border-zinc-100 bg-white">
                <span className="text-xs">←</span>
                <span className="text-xs font-bold">Rewards & Wallet</span>
              </div>

              {/* Mock Switcher */}
              <div className="p-3 space-y-3 bg-zinc-50/50">
                <div className="bg-zinc-200/60 p-1 rounded-xl flex text-[11px] font-bold">
                  <span className="flex-1 text-center py-1 bg-white rounded-lg shadow-2xs">
                    {config.programName || 'Cheesy Rewards'}
                  </span>
                  <span className="flex-1 text-center py-1 text-zinc-400">
                    Wallet
                  </span>
                </div>

                {/* Benefits Card */}
                <div className="bg-white rounded-xl p-3 border border-zinc-150 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                      <span className="text-sky-500 text-[10px]">🍕</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">
                        {config.orderPointsTitle || '1 Order = 100 Points'}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {config.orderPointsSubtitle || 'On every order above ₹349'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                      <span className="text-sky-500 text-[10px]">🍕</span>
                    </div>
                    <div>
                      <p className="text-xs font-bold leading-tight">
                        {config.freeItemsTitle || 'Unlock Free Items'}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {config.freeItemsSubtitle || 'Starting at 600 Points'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="w-full py-2 bg-[var(--primary,#EE3A43)] text-white font-bold text-xs rounded-lg"
                  >
                    {config.buttonText || 'Enroll Now'}
                  </button>
                  <p className="text-center text-[9px] text-zinc-400">
                    By enrolling you agree to our <span className="text-[var(--primary,#EE3A43)] underline">Terms and Conditions</span>
                  </p>
                </div>

                {/* Filter chips mock (Reflecting Dynamic Toggles) */}
                <div className="flex items-center justify-between text-[10px]">
                  <div className="flex gap-1.5">
                    {config.showVegFilter !== false && (
                      <span className="px-2 py-0.5 border border-emerald-500 bg-emerald-50 text-emerald-800 rounded">🟩 Veg Only</span>
                    )}
                    {config.showNonVegFilter !== false && (
                      <span className="px-2 py-0.5 border border-red-500 bg-red-50 text-red-800 rounded">🔺 Non Veg</span>
                    )}
                  </div>
                  {config.showSortFilter !== false && (
                    <span className="px-2 py-0.5 border rounded bg-white text-zinc-700">Sort by ⇅</span>
                  )}
                </div>

                {/* Mock product cards */}
                <div className="space-y-2 max-h-[260px] overflow-y-auto hide-scrollbar">
                  {((config.rewardProducts && config.rewardProducts.length > 0) ? config.rewardProducts : SIGNATURE_10_PIZZAS).slice(0, 4).map((p, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-2 border border-zinc-150 flex items-center gap-2">
                      <div className="w-13 h-13 rounded-lg bg-zinc-100 shrink-0 overflow-hidden border">
                        <img 
                          src={p.image} 
                          alt={p.name} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-[9px]">{p.isVeg ? '🟩' : '🔺'}</span>
                          <p className="text-[11px] font-bold truncate uppercase">{p.name}</p>
                        </div>
                        <p className="text-[9px] text-zinc-400">{p.size || 'Regular'} | {p.crust || 'New Hand Tossed'}</p>
                        <p className="text-[9px] text-zinc-400 truncate">{p.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-zinc-900">{p.requiredPoints || 600} Points</span>
                            {p.originalPrice > 0 && (
                              <span className="text-[9px] text-zinc-400 line-through">₹{p.originalPrice}</span>
                            )}
                          </div>
                          <span className="text-[9px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded border">Locked</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Mock Footer Links */}
                <div className="text-center text-[10px] py-1 text-sky-600 font-bold">
                  FAQs | Terms & Conditions
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Products Picker Modal */}
      {isProductPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-zinc-200 dark:border-zinc-800 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div>
                <h3 className="font-bold text-base text-zinc-900 dark:text-white flex items-center gap-2">
                  <Pizza className="w-5 h-5 text-[var(--primary,#EE3A43)]" />
                  Select Store Products for Rewards
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Selected: <strong className="text-zinc-900 dark:text-white">{config.rewardProducts?.length || 0} / 10</strong> maximum products
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="p-1 rounded-full text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="py-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
                <input
                  type="text"
                  value={productSearchQuery}
                  onChange={e => setProductSearchQuery(e.target.value)}
                  placeholder="Search store products by name..."
                  className="w-full pl-9 pr-3 py-2 border rounded-xl text-xs dark:bg-zinc-800 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-[var(--primary,#EE3A43)]"
                />
              </div>
            </div>

            {/* Product List */}
            <div className="overflow-y-auto space-y-2 flex-1 pr-1">
              {isLoadingStoreProducts ? (
                <div className="py-12 flex flex-col items-center justify-center text-zinc-400 text-xs">
                  <Loader2 className="w-6 h-6 animate-spin mb-2" />
                  Loading products...
                </div>
              ) : filteredStoreProducts.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 text-xs">
                  No products found matching your search.
                </div>
              ) : (
                filteredStoreProducts.map(p => {
                  const isAdded = config.rewardProducts?.some(
                    rp => rp.productId === p._id || rp.productId === p.id || rp.name.toLowerCase() === p.name.toLowerCase()
                  );
                  const isFull = (config.rewardProducts?.length || 0) >= 10;
                  return (
                    <div
                      key={p._id || p.id}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-11 h-11 rounded-lg bg-zinc-100 overflow-hidden shrink-0 border">
                          {p.image ? (
                            <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs text-zinc-400">🍕</div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-xs text-zinc-900 dark:text-white truncate">{p.name}</p>
                          <p className="text-[10px] text-zinc-500">₹{p.price || 149} • {p.vegType || 'Veg'}</p>
                        </div>
                      </div>

                      <button
                        type="button"
                        disabled={isAdded || isFull}
                        onClick={() => handleAddProductFromStore(p)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                          isAdded
                            ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 cursor-default border border-emerald-300'
                            : isFull
                            ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 cursor-not-allowed'
                            : 'bg-[var(--primary,#EE3A43)] text-white hover:opacity-90 active:scale-95 cursor-pointer shadow-xs'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            Added
                          </>
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            Add
                          </>
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-xs">
              <span className="text-zinc-500">
                <strong>{config.rewardProducts?.length || 0}</strong> of 10 items selected
              </span>
              <button
                type="button"
                onClick={() => setIsProductPickerOpen(false)}
                className="px-4 py-1.5 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-bold rounded-lg cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
