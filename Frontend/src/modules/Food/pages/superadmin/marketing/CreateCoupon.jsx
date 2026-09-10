import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Info, Tag, Percent, DollarSign, Gift, Layers, Check,
  ChevronLeft, ChevronRight, AlertCircle, Calendar, MapPin, 
  Users, CheckSquare, Search, ShoppingBag, Globe, RefreshCw
} from 'lucide-react';
import { 
  mockRegions, mockZones, mockTerritories, mockFranchises, mockStores, 
  mockProducts, mockCategories, mockCustomers, api 
} from './CouponsData';
import { toast } from 'sonner';

export default function CreateCoupon({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form States - Conforms directly to MongoDB schema
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [couponType, setCouponType] = useState('Percentage'); // 'Percentage', 'Flat Amount', 'Buy One Get One', 'Free Product'
  const [value, setValue] = useState(0);
  
  // Conditions Tab
  const [minimumOrderAmount, setMinimumOrderAmount] = useState(0);
  const [maximumDiscount, setMaximumDiscount] = useState(0);
  const [usageLimit, setUsageLimit] = useState(1000);
  const [usagePerCustomer, setUsagePerCustomer] = useState(1);

  // Applicability Tab
  const [applicableOn, setApplicableOn] = useState('All'); // 'All', 'Category', 'Product'
  const [productIds, setProductIds] = useState([]);
  const [categoryIds, setCategoryIds] = useState([]);

  // Region Assignment Tab (Dependent)
  const [regionIds, setRegionIds] = useState([]);
  const [zoneIds, setZoneIds] = useState([]);
  const [territoryIds, setTerritoryIds] = useState([]);
  const [franchiseIds, setFranchiseIds] = useState([]);
  const [storeIds, setStoreIds] = useState([]);

  // Customer Targeting Tab
  const [customerSegments, setCustomerSegments] = useState([]); // 'New Customers', 'Premium Users', 'Inactive Users'
  const [customerIds, setCustomerIds] = useState([]);

  // Validity Tab
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  });
  const [status, setStatus] = useState('active'); // 'active' or 'disabled'

  // Search queries for async selects
  const [productSearch, setProductSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // ----------------------------------------------------
  // Dynamic Option Filters for Dependent Region Hierarchy
  // ----------------------------------------------------
  const filteredZones = useMemo(() => {
    if (regionIds.length === 0) return [];
    return mockZones.filter(z => regionIds.includes(z.regionId));
  }, [regionIds]);

  const filteredTerritories = useMemo(() => {
    if (zoneIds.length === 0) return [];
    return mockTerritories.filter(t => zoneIds.includes(t.zoneId));
  }, [zoneIds]);

  const filteredFranchises = useMemo(() => {
    if (territoryIds.length === 0) return [];
    return mockFranchises.filter(f => territoryIds.includes(f.territoryId));
  }, [territoryIds]);

  const filteredStores = useMemo(() => {
    if (franchiseIds.length === 0) return [];
    return mockStores.filter(s => franchiseIds.includes(s.franchiseId));
  }, [franchiseIds]);

  // Clean up child selections when parent selections change
  useEffect(() => {
    setZoneIds(prev => prev.filter(zId => filteredZones.some(z => z.id === zId)));
  }, [regionIds, filteredZones]);

  useEffect(() => {
    setTerritoryIds(prev => prev.filter(tId => filteredTerritories.some(t => t.id === tId)));
  }, [zoneIds, filteredTerritories]);

  useEffect(() => {
    setFranchiseIds(prev => prev.filter(fId => filteredFranchises.some(f => f.id === fId)));
  }, [territoryIds, filteredFranchises]);

  useEffect(() => {
    setStoreIds(prev => prev.filter(sId => filteredStores.some(s => s.id === sId)));
  }, [franchiseIds, filteredStores]);

  // ----------------------------------------------------
  // Item Searching & Filtering
  // ----------------------------------------------------
  const searchedProducts = useMemo(() => {
    if (!productSearch) return mockProducts;
    const q = productSearch.toLowerCase();
    return mockProducts.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }, [productSearch]);

  const searchedCustomers = useMemo(() => {
    if (!customerSearch) return mockCustomers;
    const q = customerSearch.toLowerCase();
    return mockCustomers.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }, [customerSearch]);

  if (!isOpen) return null;

  const handleRegionSelectAll = () => {
    if (regionIds.length === mockRegions.length) {
      setRegionIds([]);
    } else {
      setRegionIds(mockRegions.map(r => r.id));
    }
  };

  const handleZoneSelectAll = () => {
    if (zoneIds.length === filteredZones.length) {
      setZoneIds([]);
    } else {
      setZoneIds(filteredZones.map(z => z.id));
    }
  };

  const handleTerritorySelectAll = () => {
    if (territoryIds.length === filteredTerritories.length) {
      setTerritoryIds([]);
    } else {
      setTerritoryIds(filteredTerritories.map(t => t.id));
    }
  };

  const handleFranchiseSelectAll = () => {
    if (franchiseIds.length === filteredFranchises.length) {
      setFranchiseIds([]);
    } else {
      setFranchiseIds(filteredFranchises.map(f => f.id));
    }
  };

  const handleStoreSelectAll = () => {
    if (storeIds.length === filteredStores.length) {
      setStoreIds([]);
    } else {
      setStoreIds(filteredStores.map(s => s.id));
    }
  };

  const validateStep = (step) => {
    if (step === 1) {
      if (!code.trim()) {
        toast.error('Coupon code is required.');
        return false;
      }
      if (!title.trim()) {
        toast.error('Coupon title is required.');
        return false;
      }
      if (couponType !== 'Buy One Get One' && value <= 0) {
        toast.error('Discount value must be greater than zero.');
        return false;
      }
    }
    if (step === 2) {
      if (minimumOrderAmount < 0) {
        toast.error('Minimum order amount cannot be negative.');
        return false;
      }
      if (usageLimit <= 0) {
        toast.error('Total usage limit must be at least 1.');
        return false;
      }
    }
    if (step === 3) {
      if (applicableOn === 'Product' && productIds.length === 0) {
        toast.error('Please select at least one product.');
        return false;
      }
      if (applicableOn === 'Category' && categoryIds.length === 0) {
        toast.error('Please select at least one category.');
        return false;
      }
    }
    if (step === 6) {
      if (!startDate) {
        toast.error('Start date is required.');
        return false;
      }
      if (!endDate) {
        toast.error('End date is required.');
        return false;
      }
      if (new Date(startDate) >= new Date(endDate)) {
        toast.error('End date must be after the start date.');
        return false;
      }
    }
    return true;
  };

  const nextStep = () => {
    if (validateStep(activeTab)) {
      setActiveTab(prev => Math.min(prev + 1, 6));
    }
  };

  const prevStep = () => {
    setActiveTab(prev => Math.max(prev - 1, 1));
  };

  const handleSave = async () => {
    if (!validateStep(6)) return;
    setLoading(true);
    try {
      const payload = {
        code: code.trim().toUpperCase(),
        title: title.trim(),
        description: description.trim(),
        couponType,
        value: couponType === 'Buy One Get One' ? 0 : Number(value),
        minimumOrderAmount: Number(minimumOrderAmount),
        maximumDiscount: Number(maximumDiscount || value),
        usageLimit: Number(usageLimit),
        usagePerCustomer: Number(usagePerCustomer),
        applicableOn,
        productIds: applicableOn === 'Product' ? productIds : [],
        categoryIds: applicableOn === 'Category' ? categoryIds : [],
        regionIds,
        zoneIds,
        territoryIds,
        franchiseIds,
        storeIds,
        customerSegments,
        customerIds,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        status
      };
      
      const newCoupon = await api.createCoupon(payload);
      toast.success(`Coupon ${newCoupon.code} created successfully!`);
      if (onSuccess) onSuccess(newCoupon);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to create coupon');
    } finally {
      setLoading(false);
    }
  };

  const stepTabs = [
    { id: 1, title: 'Basic Information', desc: 'Code, title, and type' },
    { id: 2, title: 'Conditions', desc: 'Min order and limits' },
    { id: 3, title: 'Applicability', desc: 'Categories or products' },
    { id: 4, title: 'Region Assignment', desc: 'Dependent locations' },
    { id: 5, title: 'Customer Targeting', desc: 'Customer segments' },
    { id: 6, title: 'Validity', desc: 'Dates and final status' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center lg:pl-[280px] p-4">
      {/* 1200px Width Container */}
      <div className="bg-white dark:bg-zinc-950 w-full max-w-[1200px] h-[750px] max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900 shrink-0">
          <div>
            <h2 className="text-base font-black text-black dark:text-white flex items-center gap-2">
              <Tag className="text-[var(--primary)]" size={18} />
              Create Coupon Code
            </h2>
            <p className="text-[11px] font-semibold text-zinc-500 mt-0.5">Define conditions, geographic routing, and target segments for campaign rewards.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-all cursor-pointer">
            <X size={18} className="text-zinc-550 dark:text-zinc-400" />
          </button>
        </div>

        {/* Modal Main Core Split */}
        <div className="flex flex-1 overflow-hidden min-h-0">
          
          {/* Left Navigation Stepper Sidebar */}
          <div className="w-72 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-1 overflow-y-auto shrink-0 select-none">
            <span className="text-[9px] font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest mb-4">Configuration Stages</span>
            {stepTabs.map((tab) => {
              const isActive = activeTab === tab.id;
              const isCompleted = activeTab > tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => validateStep(activeTab) && setActiveTab(tab.id)}
                  className={`w-full text-left p-3.5 rounded-xl border flex items-start gap-3 transition-all cursor-pointer ${
                    isActive 
                      ? 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-805 shadow-sm text-[var(--primary)] font-bold' 
                      : isCompleted 
                        ? 'border-transparent text-emerald-600 dark:text-emerald-500 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                        : 'border-transparent text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-850'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5 ${
                    isActive ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' :
                    isCompleted ? 'border-emerald-650 bg-emerald-500/10 text-emerald-605' :
                    'border-zinc-300 text-zinc-400'
                  }`}>
                    {isCompleted ? <Check size={11} /> : tab.id}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold leading-none ${isActive ? 'text-black dark:text-white' : ''}`}>{tab.title}</p>
                    <p className="text-[9.5px] text-zinc-500 mt-1 truncate">{tab.desc}</p>
                  </div>
                </button>
              );
            })}

            {/* Micro Live preview card inside sidebar bottom */}
            <div className="mt-auto pt-6 border-t border-zinc-200 dark:border-zinc-800">
              <div className="bg-zinc-100/50 dark:bg-zinc-950/40 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-3 text-center flex flex-col items-center gap-1.5">
                <span className="text-[8.5px] font-black text-zinc-400 uppercase tracking-widest">Live Preview</span>
                <span className="px-2 py-0.5 rounded font-mono font-black text-xs bg-[var(--primary)]/10 text-[var(--primary)] uppercase tracking-wide">
                  {code.trim() ? code.toUpperCase() : 'CODE2026'}
                </span>
                <p className="text-[10px] font-black text-black dark:text-white truncate max-w-full">{title.trim() ? title : 'New Offer Title'}</p>
                <p className="text-[9px] text-zinc-500 font-medium">
                  {couponType === 'Percentage' ? `${value}% Discount` :
                   couponType === 'Flat Amount' ? `₹${value} Off` :
                   couponType === 'Buy One Get One' ? 'BOGO Special' : 'Free Product Reward'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Step Contents Canvas */}
          <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-955 flex flex-col min-w-0">
            
            {/* Step 1: Basic Information */}
            {activeTab === 1 && (
              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-sm font-black text-black dark:text-white">Basic Coupon Configuration</h3>
                  <p className="text-[11px] text-zinc-555">Create the coupon identity and describe applicability rules.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider flex items-center gap-1">
                      Coupon Code <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/[^A-Za-z0-9]/g, ''))}
                      className="w-full h-9 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-bold uppercase tracking-wider placeholder:normal-case placeholder:font-normal" 
                      placeholder="e.g. MONSOON50" 
                    />
                    <p className="text-[9.5px] text-zinc-500">Alphanumeric only. Displayed to users at checkout.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">
                      Coupon Title / Campaign Name <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full h-9 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-semibold" 
                      placeholder="e.g. Flat ₹150 Off on Pizzas" 
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Description</label>
                    <textarea 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="w-full border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 p-3 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs resize-none leading-relaxed" 
                      placeholder="Enter description of this reward which will be displayed in the promotions ledger..." 
                      rows={3}
                    />
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Coupon Type</label>
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      {[
                        { type: 'Percentage', icon: Percent, label: 'Percentage Off', desc: 'Deducts % from order' },
                        { type: 'Flat Amount', icon: DollarSign, label: 'Flat Discount', desc: 'Deducts flat INR cash' },
                        { type: 'Buy One Get One', icon: Gift, label: 'BOGO Special', desc: 'Buy 1 Get 1 free product' },
                        { type: 'Free Product', icon: ShoppingBag, label: 'Free Product', desc: 'Adds free gift item' }
                      ].map((item) => {
                        const Icon = item.icon;
                        const isSelected = couponType === item.type;
                        return (
                          <button
                            type="button"
                            key={item.type}
                            onClick={() => {
                              setCouponType(item.type);
                              if (item.type === 'Buy One Get One') setValue(0);
                            }}
                            className={`p-3.5 rounded-xl border-2 text-left flex flex-col gap-2.5 transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-black dark:text-white' 
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 text-zinc-555'
                            }`}
                          >
                            <span className={`p-1.5 rounded-lg w-fit ${isSelected ? 'bg-[var(--primary)] text-white' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-500'}`}>
                              <Icon size={14} />
                            </span>
                            <div>
                              <p className="text-xs font-bold">{item.label}</p>
                              <p className="text-[9px] text-zinc-500 leading-tight mt-0.5">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {couponType !== 'Buy One Get One' && (
                    <div className="space-y-1.5 animate-slide-down">
                      <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">
                        Discount Value ({couponType === 'Percentage' ? '%' : '₹'}) <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={value || ''}
                          onChange={(e) => setValue(Number(e.target.value))}
                          className="w-full h-9 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-bold" 
                          placeholder="0" 
                        />
                        <div className="absolute right-3 top-2.5 text-zinc-400 font-bold text-xs">
                          {couponType === 'Percentage' ? '%' : '₹'}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 2: Conditions */}
            {activeTab === 2 && (
              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-sm font-black text-black dark:text-white">Minimum Order Conditions & Usage Limits</h3>
                  <p className="text-[11px] text-zinc-555">Control minimum order value requirements and maximum redemption thresholds.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Minimum Order Amount (₹)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-xs">₹</span>
                      <input 
                        type="number" 
                        value={minimumOrderAmount || ''}
                        onChange={(e) => setMinimumOrderAmount(Number(e.target.value))}
                        className="w-full h-9 pl-7 pr-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-bold" 
                        placeholder="0 (no minimum)" 
                      />
                    </div>
                    <p className="text-[9.5px] text-zinc-500">Cart amount required before applying the discount.</p>
                  </div>

                  {couponType === 'Percentage' && (
                    <div className="space-y-1.5 animate-slide-down">
                      <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Maximum Discount Allowed (₹)</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-zinc-400 font-bold text-xs">₹</span>
                        <input 
                          type="number" 
                          value={maximumDiscount || ''}
                          onChange={(e) => setMaximumDiscount(Number(e.target.value))}
                          className="w-full h-9 pl-7 pr-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-bold" 
                          placeholder="No max cap" 
                        />
                      </div>
                      <p className="text-[9.5px] text-zinc-500">Caps the savings for high order amounts.</p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Total Usage Limit (All Customers)</label>
                    <input 
                      type="number" 
                      value={usageLimit || ''}
                      onChange={(e) => setUsageLimit(Number(e.target.value))}
                      className="w-full h-9 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-bold" 
                      placeholder="e.g. 1000" 
                    />
                    <p className="text-[9.5px] text-zinc-500">Total redemptions allowed across the entire franchise network.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Usage Per Customer</label>
                    <input 
                      type="number" 
                      value={usagePerCustomer || ''}
                      onChange={(e) => setUsagePerCustomer(Number(e.target.value))}
                      className="w-full h-9 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-bold" 
                      placeholder="e.g. 1" 
                    />
                    <p className="text-[9.5px] text-zinc-500">Max times a unique customer account can redeem this coupon.</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Applicability */}
            {activeTab === 3 && (
              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-sm font-black text-black dark:text-white">Discount Applicability Rules</h3>
                  <p className="text-[11px] text-zinc-555">Apply this coupon code generally, to specific product categories, or single items.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Applicable On</label>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-md">
                      {['All', 'Category', 'Product'].map((scope) => (
                        <button
                          type="button"
                          key={scope}
                          onClick={() => setApplicableOn(scope)}
                          className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${
                            applicableOn === scope 
                              ? 'bg-white dark:bg-zinc-800 text-[var(--primary)] shadow-sm' 
                              : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-250'
                          }`}
                        >
                          {scope === 'All' ? 'Entire Cart' : scope}
                        </button>
                      ))}
                    </div>
                  </div>

                  {applicableOn === 'Category' && (
                    <div className="space-y-3 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/20 animate-slide-down">
                      <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider block">Select Categories</label>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {mockCategories.map((cat) => {
                          const isSelected = categoryIds.includes(cat.id);
                          return (
                            <button
                              type="button"
                              key={cat.id}
                              onClick={() => {
                                setCategoryIds(prev => 
                                  prev.includes(cat.id) ? prev.filter(id => id !== cat.id) : [...prev, cat.id]
                                );
                              }}
                              className={`p-3 rounded-lg border text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-black dark:text-white' 
                                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650'
                              }`}
                            >
                              <span>{cat.name}</span>
                              {isSelected ? <Check size={14} className="text-[var(--primary)]" /> : <span className="text-[9px] font-mono text-zinc-400">{cat.code}</span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {applicableOn === 'Product' && (
                    <div className="space-y-3 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/20 animate-slide-down">
                      <div className="flex items-center justify-between gap-3">
                        <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Select Products</label>
                        <div className="relative max-w-xs w-full">
                          <Search size={12} className="absolute left-2.5 top-2 text-zinc-400" />
                          <input 
                            type="text" 
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                            className="w-full h-7 pl-7 pr-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-md outline-none text-[10px] font-semibold"
                            placeholder="Search products by SKU or name..."
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-2 max-h-[200px] overflow-y-auto pr-1">
                        {searchedProducts.map((prod) => {
                          const isSelected = productIds.includes(prod.id);
                          return (
                            <button
                              type="button"
                              key={prod.id}
                              onClick={() => {
                                setProductIds(prev => 
                                  prev.includes(prod.id) ? prev.filter(id => id !== prod.id) : [...prev, prod.id]
                                );
                              }}
                              className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                                isSelected 
                                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-black dark:text-white' 
                                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650'
                              }`}
                            >
                              <div className="min-w-0 pr-2">
                                <p className="truncate leading-none">{prod.name}</p>
                                <span className="text-[9px] text-zinc-400 font-mono mt-1 block">{prod.sku} • ₹{prod.price}</span>
                              </div>
                              {isSelected && <Check size={14} className="text-[var(--primary)] shrink-0" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 4: Region Assignment (Cascading Dependent) */}
            {activeTab === 4 && (
              <div className="space-y-6 flex-1 flex flex-col min-h-0">
                <div className="shrink-0">
                  <h3 className="text-sm font-black text-black dark:text-white">Geographic Region Assignment</h3>
                  <p className="text-[11px] text-zinc-555">Map coupon applicability to specific franchises. Selecting a higher node filters its children recursively.</p>
                </div>

                {/* Dependent Hierarchical Select columns */}
                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 bg-zinc-50/50 dark:bg-zinc-900/20 flex-1 overflow-hidden min-h-[300px]">
                  
                  {/* Regions List */}
                  <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-950 overflow-hidden h-full min-h-[150px]">
                    <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide">Regions</span>
                      <button type="button" onClick={handleRegionSelectAll} className="text-[8px] text-[var(--primary)] font-black uppercase hover:underline">All</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {mockRegions.map(reg => {
                        const isChecked = regionIds.includes(reg.id);
                        return (
                          <label key={reg.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                setRegionIds(prev => 
                                  prev.includes(reg.id) ? prev.filter(id => id !== reg.id) : [...prev, reg.id]
                                );
                              }}
                              className="w-3 h-3 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer"
                            />
                            <span className="truncate">{reg.name.split(' (')[0]}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Zones List */}
                  <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-955 overflow-hidden h-full min-h-[150px] transition-opacity duration-200" style={{ opacity: regionIds.length === 0 ? 0.4 : 1 }}>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide">Zones</span>
                      {filteredZones.length > 0 && <button type="button" onClick={handleZoneSelectAll} className="text-[8px] text-[var(--primary)] font-black uppercase hover:underline">All</button>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {regionIds.length === 0 ? (
                        <p className="text-[9px] text-zinc-400 text-center mt-6">Select a Region</p>
                      ) : (
                        filteredZones.map(zone => {
                          const isChecked = zoneIds.includes(zone.id);
                          return (
                            <label key={zone.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setZoneIds(prev => 
                                    prev.includes(zone.id) ? prev.filter(id => id !== zone.id) : [...prev, zone.id]
                                  );
                                }}
                                className="w-3 h-3 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer"
                              />
                              <span className="truncate">{zone.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Territories List */}
                  <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-955 overflow-hidden h-full min-h-[150px]" style={{ opacity: zoneIds.length === 0 ? 0.4 : 1 }}>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide">Territories</span>
                      {filteredTerritories.length > 0 && <button type="button" onClick={handleTerritorySelectAll} className="text-[8px] text-[var(--primary)] font-black uppercase hover:underline">All</button>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {zoneIds.length === 0 ? (
                        <p className="text-[9px] text-zinc-400 text-center mt-6">Select a Zone</p>
                      ) : (
                        filteredTerritories.map(ter => {
                          const isChecked = territoryIds.includes(ter.id);
                          return (
                            <label key={ter.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setTerritoryIds(prev => 
                                    prev.includes(ter.id) ? prev.filter(id => id !== ter.id) : [...prev, ter.id]
                                  );
                                }}
                                className="w-3 h-3 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer"
                              />
                              <span className="truncate">{ter.name.split(' Territory')[0]}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Franchises List */}
                  <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-955 overflow-hidden h-full min-h-[150px]" style={{ opacity: territoryIds.length === 0 ? 0.4 : 1 }}>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide">Franchises</span>
                      {filteredFranchises.length > 0 && <button type="button" onClick={handleFranchiseSelectAll} className="text-[8px] text-[var(--primary)] font-black uppercase hover:underline">All</button>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {territoryIds.length === 0 ? (
                        <p className="text-[9px] text-zinc-400 text-center mt-6">Select a Territory</p>
                      ) : (
                        filteredFranchises.map(fran => {
                          const isChecked = franchiseIds.includes(fran.id);
                          return (
                            <label key={fran.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setFranchiseIds(prev => 
                                    prev.includes(fran.id) ? prev.filter(id => id !== fran.id) : [...prev, fran.id]
                                  );
                                }}
                                className="w-3 h-3 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer"
                              />
                              <span className="truncate">{fran.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* Stores List */}
                  <div className="flex flex-col border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-955 overflow-hidden h-full min-h-[150px]" style={{ opacity: franchiseIds.length === 0 ? 0.4 : 1 }}>
                    <div className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3 py-2 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[9px] font-extrabold uppercase tracking-wide">Stores</span>
                      {filteredStores.length > 0 && <button type="button" onClick={handleStoreSelectAll} className="text-[8px] text-[var(--primary)] font-black uppercase hover:underline">All</button>}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {franchiseIds.length === 0 ? (
                        <p className="text-[9px] text-zinc-400 text-center mt-6">Select a Franchise</p>
                      ) : (
                        filteredStores.map(store => {
                          const isChecked = storeIds.includes(store.id);
                          return (
                            <label key={store.id} className="flex items-center gap-2 p-1.5 rounded hover:bg-zinc-50 dark:hover:bg-zinc-900 text-[10px] font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer select-none">
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setStoreIds(prev => 
                                    prev.includes(store.id) ? prev.filter(id => id !== store.id) : [...prev, store.id]
                                  );
                                }}
                                className="w-3 h-3 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer"
                              />
                              <span className="truncate" title={store.name}>{store.name.split('Papa Veg Pizza - ')[1] || store.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0 p-3 bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-2">
                  <Info size={14} className="text-[var(--primary)] shrink-0" />
                  <p className="text-[10px] text-zinc-500 leading-normal">
                    Leaving geographic selections blank acts as a <b>Global Campaign</b>. This coupon will apply to all territories, franchises, and stores.
                  </p>
                </div>
              </div>
            )}

            {/* Step 5: Customer Targeting */}
            {activeTab === 5 && (
              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-sm font-black text-black dark:text-white">Customer Segment Targeting</h3>
                  <p className="text-[11px] text-zinc-555">Restrict coupon eligibility to specific marketing segments or explicit user lists.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider block">Customer Segments</label>
                    <div className="flex flex-wrap gap-2.5">
                      {['New Customers', 'Premium Users', 'Inactive Users'].map((seg) => {
                        const isSelected = customerSegments.includes(seg);
                        return (
                          <button
                            type="button"
                            key={seg}
                            onClick={() => {
                              setCustomerSegments(prev => 
                                prev.includes(seg) ? prev.filter(item => item !== seg) : [...prev, seg]
                              );
                            }}
                            className={`px-4 py-2 border rounded-full text-xs font-bold transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]' 
                                : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-700 text-zinc-650'
                            }`}
                          >
                            {seg}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-[9.5px] text-zinc-555">If no segments are highlighted, coupon is open to all customers.</p>
                  </div>

                  <div className="space-y-3 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/20">
                    <div className="flex items-center justify-between gap-3">
                      <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Target Specific Customers Only (Optional)</label>
                      <div className="relative max-w-xs w-full">
                        <Search size={12} className="absolute left-2.5 top-2 text-zinc-400" />
                        <input 
                          type="text" 
                          value={customerSearch}
                          onChange={(e) => setCustomerSearch(e.target.value)}
                          className="w-full h-7 pl-7 pr-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-md outline-none text-[10px] font-semibold"
                          placeholder="Search customers by name or email..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 mt-2 max-h-[160px] overflow-y-auto pr-1">
                      {searchedCustomers.map((cust) => {
                        const isSelected = customerIds.includes(cust.id);
                        return (
                          <button
                            type="button"
                            key={cust.id}
                            onClick={() => {
                              setCustomerIds(prev => 
                                prev.includes(cust.id) ? prev.filter(id => id !== cust.id) : [...prev, cust.id]
                              );
                            }}
                            className={`p-2 rounded-lg border text-left flex items-center justify-between text-xs font-bold transition-all cursor-pointer ${
                              isSelected 
                                ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-black dark:text-white' 
                                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-650'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <p className="truncate leading-none">{cust.name}</p>
                              <span className="text-[9px] text-zinc-400 mt-1 block truncate">{cust.email}</span>
                            </div>
                            {isSelected && <Check size={14} className="text-[var(--primary)] shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Validity & Status */}
            {activeTab === 6 && (
              <div className="space-y-6 flex-1">
                <div>
                  <h3 className="text-sm font-black text-black dark:text-white">Campaign Validity Schedule</h3>
                  <p className="text-[11px] text-zinc-555">Set start and end deadlines, and toggle operational status.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-zinc-400" />
                      Start Date &amp; Time <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="datetime-local" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-9 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-semibold" 
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-zinc-400" />
                      End Date &amp; Time <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="datetime-local" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-9 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 px-3 rounded-lg focus:border-[var(--primary)] outline-none dark:text-zinc-100 text-xs font-semibold" 
                    />
                  </div>

                  <div className="md:col-span-2 p-4 bg-zinc-50 dark:bg-zinc-900/40 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-850 flex items-center justify-center text-[var(--primary)] border border-zinc-200 dark:border-zinc-700 shadow-sm shrink-0">
                        <Globe size={15} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">Operational Status</p>
                        <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Determines if the coupon is queryable by client applications.</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-950 p-1 border border-zinc-250 dark:border-zinc-800 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setStatus('active')}
                        className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-colors cursor-pointer ${
                          status === 'active' 
                            ? 'bg-emerald-500 text-white shadow-sm' 
                            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-350'
                        }`}
                      >
                        Active
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus('disabled')}
                        className={`px-3 py-1 rounded text-[10px] font-black uppercase transition-colors cursor-pointer ${
                          status === 'disabled' 
                            ? 'bg-zinc-500 text-white shadow-sm' 
                            : 'text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-350'
                        }`}
                      >
                        Disabled
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step Content Footer Buttons */}
            <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800 mt-auto flex justify-between items-center bg-white dark:bg-zinc-955 shrink-0">
              <button
                type="button"
                onClick={prevStep}
                disabled={activeTab === 1}
                className="h-9 px-4 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 disabled:opacity-40 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <ChevronLeft size={14} />
                Back
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="h-9 px-4 text-xs font-bold text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                {activeTab < 6 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="h-9 px-5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg shadow-md hover:bg-[var(--primary)]/90 flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    Next Tab
                    <ChevronRight size={14} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={loading}
                    className="h-9 px-6 bg-[var(--primary)] text-white text-xs font-bold rounded-lg shadow-md hover:bg-[var(--primary)]/90 disabled:opacity-60 transition-colors flex items-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Coupon'
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
