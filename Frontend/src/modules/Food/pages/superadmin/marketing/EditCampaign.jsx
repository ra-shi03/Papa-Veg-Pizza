import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Check, ChevronRight, AlertCircle, Info, Calendar, 
  DollarSign, Target, Gift, Settings, Search, Volume2, 
  Mail, MessageSquare, Layers, Loader2, AlertTriangle 
} from 'lucide-react';
import { 
  apiGetCoupons, 
  apiGetCampaignById,
  apiUpdateCampaign 
} from './CampaignData';
import { 
  mockRegions, 
  mockZones, 
  mockTerritories, 
  mockFranchises, 
  mockStores 
} from './CouponsData';

export default function EditCampaign({ campaignId, isOpen, onClose, onCampaignUpdated }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [couponSearch, setCouponSearch] = useState('');
  const [couponOpen, setCouponOpen] = useState(false);

  // Initial fetched values to check for changes
  const [initialData, setInitialData] = useState(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('');
  const [targetAudience, setTargetAudience] = useState('');
  const [customerSegment, setCustomerSegment] = useState('');
  const [regionIds, setRegionIds] = useState([]);
  const [franchiseIds, setFranchiseIds] = useState([]);
  const [storeIds, setStoreIds] = useState([]);
  const [couponId, setCouponId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState('');

  // Unsaved Warning State
  const [showWarning, setShowWarning] = useState(false);

  // Error States
  const [errors, setErrors] = useState({});

  // Fetch campaign and coupons data
  useEffect(() => {
    if (isOpen && campaignId) {
      setFetching(true);
      
      // Load Coupons first
      setCouponsLoading(true);
      apiGetCoupons()
        .then(cpns => {
          setCoupons(cpns);
          setCouponsLoading(false);
        })
        .catch(() => setCouponsLoading(false));

      // Load Campaign Details
      apiGetCampaignById(campaignId)
        .then(camp => {
          setInitialData(camp);
          
          setTitle(camp.title || '');
          setDescription(camp.description || '');
          setType(camp.type || 'Push Notification');
          setTargetAudience(camp.targetAudience || 'All Customers');
          setCustomerSegment(camp.customerSegment || 'All Customers');
          setRegionIds(camp.regionIds || []);
          setFranchiseIds(camp.franchiseIds || []);
          setStoreIds(camp.storeIds || []);
          setCouponId(camp.couponId || '');
          setStartDate(camp.startDate || '');
          setEndDate(camp.endDate || '');
          setBudget(camp.budget !== undefined ? String(camp.budget) : '');
          setStatus(camp.status || 'Draft');

          const matchingCoupon = coupons.find(c => c._id === camp.couponId);
          if (matchingCoupon) {
            setCouponSearch(matchingCoupon.code);
          }

          setFetching(false);
        })
        .catch((err) => {
          setFetching(false);
          alert('Error loading campaign data: ' + err.message);
          onClose();
        });
    }
  }, [isOpen, campaignId]);

  // Sync coupon code search text once coupons list loads
  useEffect(() => {
    if (couponId && coupons.length > 0) {
      const match = coupons.find(c => c._id === couponId);
      if (match) {
        setCouponSearch(match.code);
      }
    }
  }, [couponId, coupons]);

  // Is Form Dirty checker
  const isDirty = useMemo(() => {
    if (!initialData) return false;
    
    // helper to check if arrays match
    const arraysMatch = (arr1, arr2) => {
      if (arr1.length !== arr2.length) return false;
      const sorted1 = [...arr1].sort();
      const sorted2 = [...arr2].sort();
      return sorted1.every((val, index) => val === sorted2[index]);
    };

    return (
      title !== (initialData.title || '') ||
      description !== (initialData.description || '') ||
      type !== (initialData.type || '') ||
      targetAudience !== (initialData.targetAudience || '') ||
      customerSegment !== (initialData.customerSegment || '') ||
      couponId !== (initialData.couponId || '') ||
      startDate !== (initialData.startDate || '') ||
      endDate !== (initialData.endDate || '') ||
      budget !== (initialData.budget !== undefined ? String(initialData.budget) : '') ||
      status !== (initialData.status || '') ||
      !arraysMatch(regionIds, initialData.regionIds || []) ||
      !arraysMatch(franchiseIds, initialData.franchiseIds || []) ||
      !arraysMatch(storeIds, initialData.storeIds || [])
    );
  }, [
    initialData, title, description, type, targetAudience, 
    customerSegment, couponId, startDate, endDate, budget, 
    status, regionIds, franchiseIds, storeIds
  ]);

  // Hierarchical Filter Calculations
  const filteredFranchises = useMemo(() => {
    if (regionIds.length === 0) return mockFranchises;
    const zoneIds = mockZones.filter(z => regionIds.includes(z.regionId)).map(z => z.id);
    const territoryIds = mockTerritories.filter(t => zoneIds.includes(t.zoneId)).map(t => t.id);
    return mockFranchises.filter(f => territoryIds.includes(f.territoryId));
  }, [regionIds]);

  const filteredStores = useMemo(() => {
    if (franchiseIds.length === 0) {
      const allowedFranIds = filteredFranchises.map(f => f.id);
      return mockStores.filter(s => allowedFranIds.includes(s.franchiseId));
    }
    return mockStores.filter(s => franchiseIds.includes(s.franchiseId));
  }, [franchiseIds, filteredFranchises]);

  // Auto-deselect invalid children when parent selections change
  useEffect(() => {
    if (!fetching) {
      const allowedFranIds = filteredFranchises.map(f => f.id);
      setFranchiseIds(prev => prev.filter(id => allowedFranIds.includes(id)));
    }
  }, [filteredFranchises, fetching]);

  useEffect(() => {
    if (!fetching) {
      const allowedStoreIds = filteredStores.map(s => s.id);
      setStoreIds(prev => prev.filter(id => allowedStoreIds.includes(id)));
    }
  }, [filteredStores, fetching]);

  // Selected Coupon Preview Card
  const selectedCoupon = useMemo(() => {
    return coupons.find(c => c._id === couponId);
  }, [couponId, coupons]);

  // Search Filter Coupons
  const searchedCoupons = useMemo(() => {
    if (!couponSearch) return coupons;
    const q = couponSearch.toLowerCase();
    return coupons.filter(c => 
      c.code.toLowerCase().includes(q) || 
      c.title.toLowerCase().includes(q)
    );
  }, [couponSearch, coupons]);

  if (!isOpen) return null;

  // Validation
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!title.trim()) newErrors.title = 'Campaign Name is required';
      if (!description.trim()) newErrors.description = 'Campaign Description is required';
      if (!type) newErrors.type = 'Campaign Type is required';
    }
    if (step === 3) {
      if (!couponId) newErrors.couponId = 'Please map a coupon to this campaign';
    }
    if (step === 4) {
      if (!startDate) newErrors.startDate = 'Start date is required';
      if (!endDate) newErrors.endDate = 'End date is required';
      if (!budget || Number(budget) <= 0) newErrors.budget = 'A valid budget greater than 0 is required';
      if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
        newErrors.endDate = 'End date must be strictly greater than start date';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSave = async () => {
    if (!validateStep(5) || !validateStep(4) || !validateStep(3) || !validateStep(1)) {
      if (Object.keys(errors).length > 0) return;
    }

    setLoading(true);
    const campaignPayload = {
      title,
      description,
      type,
      startDate,
      endDate,
      targetAudience,
      regionIds,
      franchiseIds,
      storeIds,
      customerSegment,
      couponId,
      budget: Number(budget),
      status
    };

    try {
      const updatedCamp = await apiUpdateCampaign(campaignId, campaignPayload);
      setLoading(false);
      onCampaignUpdated && onCampaignUpdated(updatedCamp);
      onClose();
    } catch (err) {
      setLoading(false);
      alert('Failed to update campaign: ' + err.message);
    }
  };

  const handleCloseAttempt = () => {
    if (isDirty) {
      setShowWarning(true);
    } else {
      onClose();
    }
  };

  const stepsList = [
    { num: 1, label: 'General Info', icon: Info },
    { num: 2, label: 'Audience Targeting', icon: Target },
    { num: 3, label: 'Coupon Mapping', icon: Gift },
    { num: 4, label: 'Scheduling & Budget', icon: Calendar },
    { num: 5, label: 'Review & Status', icon: Settings }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-[1200px] h-[700px] max-h-[90vh] rounded-2xl flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                <Target size={16} />
              </span>
              Edit Campaign Configuration
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">Edit campaign properties, scheduling parameters and targeting rules</p>
          </div>
          <button 
            onClick={handleCloseAttempt}
            className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Core Layout */}
        {fetching ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-2.5">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Loading Campaign Config...</span>
          </div>
        ) : (
          <div className="flex-1 flex overflow-hidden">
            
            {/* Left Stepper Sidebar */}
            <div className="w-64 border-r border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 p-4 flex flex-col justify-between">
              <div className="space-y-1">
                {stepsList.map((step) => {
                  const StepIcon = step.icon;
                  const isActive = currentStep === step.num;
                  const isCompleted = currentStep > step.num;
                  return (
                    <button
                      key={step.num}
                      onClick={() => {
                        if (step.num < currentStep || validateStep(currentStep)) {
                          setCurrentStep(step.num);
                        }
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-left ${
                        isActive 
                          ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-bold shadow-sm' 
                          : isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                          : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-[11px] font-bold shrink-0 transition-all ${
                        isActive 
                          ? 'bg-[var(--primary)] border-[var(--primary)] text-white' 
                          : isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-750 text-zinc-500'
                      }`}>
                        {isCompleted ? <Check size={12} /> : step.num}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] uppercase tracking-wider text-zinc-400 font-bold leading-none">Step 0{step.num}</p>
                        <p className="text-xs truncate mt-0.5">{step.label}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              
              {/* Guidance Alert */}
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex gap-2">
                <Info size={14} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 dark:text-amber-300 leading-relaxed font-medium">
                  Modifying live campaign params might temporarily affect reporting metrics.
                </p>
              </div>
            </div>

            {/* Right Content Form Area */}
            <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-zinc-950">
              
              {/* STEP 1: General Info */}
              {currentStep === 1 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">General Information</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Describe what this campaign is about and select the distribution channel.</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Campaign Name *</label>
                      <input 
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="e.g. Mid-Week Monsoon Feast Combo"
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.title ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-605 transition-all`}
                      />
                      {errors.title && <p className="text-[10px] text-red-500 font-semibold">{errors.title}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Description *</label>
                      <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write brief description summarizing the promo objective..."
                        rows={4}
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.description ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3.5 py-2.5 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-605 transition-all resize-none`}
                      />
                      {errors.description && <p className="text-[10px] text-red-500 font-semibold">{errors.description}</p>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Campaign Type (Distribution Channel) *</label>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { name: 'Push Notification', desc: 'Direct browser app alerts', icon: Volume2 },
                          { name: 'Email', desc: 'Visual newsletters in inbox', icon: Mail },
                          { name: 'SMS', desc: 'Direct text messaging alerts', icon: MessageSquare },
                          { name: 'Multi Channel', desc: 'Simultaneous cross-platform reach', icon: Layers }
                        ].map((item) => {
                          const Icon = item.icon;
                          const isSel = type === item.name;
                          return (
                            <label 
                              key={item.name}
                              className={`border rounded-xl p-3.5 flex items-start gap-3 cursor-pointer transition-all hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
                                isSel 
                                  ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-[var(--primary)]' 
                                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="campaignType" 
                                value={item.name} 
                                checked={isSel} 
                                onChange={() => setType(item.name)}
                                className="sr-only" 
                              />
                              <span className={`p-2 rounded-lg shrink-0 ${isSel ? 'bg-[var(--primary)] text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'}`}>
                                <Icon size={16} />
                              </span>
                              <div className="min-w-0">
                                <p className={`text-xs font-bold ${isSel ? 'text-[var(--primary)]' : 'text-zinc-900 dark:text-zinc-100'}`}>{item.name}</p>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight">{item.desc}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Audience Targeting */}
              {currentStep === 2 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Audience Targeting</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Configure segments and location availability settings.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Target Audience Segment</label>
                      <select 
                        value={targetAudience}
                        onChange={(e) => {
                          setTargetAudience(e.target.value);
                          setCustomerSegment(e.target.value);
                        }}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 font-semibold cursor-pointer"
                      >
                        <option value="All Customers">All Customers</option>
                        <option value="New Customers">New Customers</option>
                        <option value="Premium Customers">Premium Customers</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Sub Segment Filter</label>
                      <select 
                        value={customerSegment}
                        onChange={(e) => setCustomerSegment(e.target.value)}
                        className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 font-semibold cursor-pointer"
                      >
                        <option value="All Customers">All Customers</option>
                        <option value="New Customers">New Customers Only</option>
                        <option value="Premium Customers">Premium Pizza Lovers</option>
                      </select>
                    </div>
                  </div>

                  {/* Regional Hierarchy */}
                  <div className="space-y-4">
                    <div className="bg-zinc-50 dark:bg-zinc-900/40 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800">
                      <span className="text-[10px] font-extrabold uppercase text-amber-600 dark:text-amber-400">Cascading Location Hierarchy</span>
                      <p className="text-[10.5px] text-zinc-500 mt-0.5 leading-relaxed">
                        Selecting regions will dynamically filter the lists of franchises and stores below.
                      </p>
                    </div>

                    {/* 1. Regions */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Regions (Multi-select)</label>
                      <div className="flex flex-wrap gap-2">
                        {mockRegions.map(reg => {
                          const isSel = regionIds.includes(reg.id);
                          return (
                            <button
                              key={reg.id}
                              type="button"
                              onClick={() => {
                                setRegionIds(prev => 
                                  isSel ? prev.filter(id => id !== reg.id) : [...prev, reg.id]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                isSel 
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm' 
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-755 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {reg.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 2. Franchises */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Franchises ({filteredFranchises.length} available)</label>
                      <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/25">
                        {filteredFranchises.map(fran => {
                          const isSel = franchiseIds.includes(fran.id);
                          return (
                            <button
                              key={fran.id}
                              type="button"
                              onClick={() => {
                                setResult = setFranchiseIds(prev => 
                                  isSel ? prev.filter(id => id !== fran.id) : [...prev, fran.id]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                isSel 
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm' 
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-755 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {fran.name}
                            </button>
                          );
                        })}
                        {filteredFranchises.length === 0 && (
                          <p className="text-[11px] text-zinc-500 py-1 pl-1">No franchises found for selected regions.</p>
                        )}
                      </div>
                    </div>

                    {/* 3. Stores */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Stores ({filteredStores.length} available)</label>
                      <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-xl bg-zinc-50/50 dark:bg-zinc-900/25">
                        {filteredStores.map(store => {
                          const isSel = storeIds.includes(store.id);
                          return (
                            <button
                              key={store.id}
                              type="button"
                              onClick={() => {
                                setStoreIds(prev => 
                                  isSel ? prev.filter(id => id !== store.id) : [...prev, store.id]
                                );
                              }}
                              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
                                isSel 
                                  ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm' 
                                  : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-755 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                              }`}
                            >
                              {store.name}
                            </button>
                          );
                        })}
                        {filteredStores.length === 0 && (
                          <p className="text-[11px] text-zinc-500 py-1 pl-1">No stores found for selected franchises.</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Coupon Mapping */}
              {currentStep === 3 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Coupon Mapping</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Map an active promotional coupon to track redemptions and orders.</p>
                  </div>

                  {/* Coupon Search Select */}
                  <div className="space-y-2 relative">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Search Active Coupon *</label>
                    
                    <div className="relative">
                      <input 
                        type="text"
                        value={couponSearch}
                        onChange={(e) => {
                          setCouponSearch(e.target.value);
                          setCouponOpen(true);
                        }}
                        onFocus={() => setCouponOpen(true)}
                        placeholder="Type coupon code to search..."
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.couponId ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all font-semibold`}
                      />
                      <Search size={14} className="absolute left-3.5 top-3 text-zinc-400 dark:text-zinc-500" />
                      
                      {couponId && (
                        <button 
                          onClick={() => {
                            setCouponId('');
                            setCouponSearch('');
                          }}
                          className="absolute right-3 top-2.5 text-xs text-zinc-400 hover:text-zinc-650 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-md font-semibold"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    {errors.couponId && <p className="text-[10px] text-red-500 font-semibold">{errors.couponId}</p>}

                    {/* Dropdown Options */}
                    {couponOpen && (
                      <div className="absolute z-20 top-full left-0 right-0 mt-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl max-h-52 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-805">
                        {couponsLoading ? (
                          <div className="p-4 flex justify-center items-center gap-2">
                            <Loader2 size={14} className="animate-spin text-[var(--primary)]" />
                            <span className="text-[11px] text-zinc-500 font-semibold">Fetching Coupons...</span>
                          </div>
                        ) : searchedCoupons.length === 0 ? (
                          <p className="p-3 text-[11px] text-zinc-500 font-semibold text-center">No active coupons matching "{couponSearch}"</p>
                        ) : (
                          searchedCoupons.map(cpn => (
                            <button
                              key={cpn._id}
                              type="button"
                              onClick={() => {
                                setCouponId(cpn._id);
                                setCouponSearch(cpn.code);
                                setCouponOpen(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-850/55 flex justify-between items-center transition-colors"
                            >
                              <div>
                                <span className="px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded text-[10px] font-bold">{cpn.code}</span>
                                <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200 ml-2">{cpn.title}</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{cpn.discount}</span>
                                <p className="text-[9px] text-zinc-500 dark:text-zinc-400 mt-0.5">Exp: {cpn.expiryDate}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Coupon Preview Card */}
                  {selectedCoupon ? (
                    <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-zinc-900/40 dark:to-emerald-950/10 border border-emerald-200/60 dark:border-emerald-900/30 rounded-2xl p-5 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2 duration-300">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 bg-emerald-600 dark:bg-emerald-500 text-white rounded text-[10px] font-extrabold tracking-wider">{selectedCoupon.code}</span>
                          <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{selectedCoupon.title}</h4>
                        </div>
                        <p className="text-[10.5px] text-zinc-500 dark:text-zinc-400 mt-1 max-w-md">
                          Minimum order: ₹{selectedCoupon.minOrder} • Max discount: ₹{selectedCoupon.maxDiscount}
                        </p>
                        <p className="text-[9.5px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                          <Calendar size={11} /> Expiry: {selectedCoupon.expiryDate} (Active)
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">{selectedCoupon.discount}</span>
                        <p className="text-[9px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.5">Value Applied</p>
                      </div>
                    </div>
                  ) : (
                    <div className="border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center bg-zinc-50/50 dark:bg-zinc-955/50">
                      <Gift size={24} className="mx-auto text-zinc-400 dark:text-zinc-650" />
                      <p className="text-xs font-bold text-zinc-600 dark:text-zinc-400 mt-2">No Coupon Mapped</p>
                    </div>
                  )}
                </div>
              )}

              {/* STEP 4: Scheduling & Budget */}
              {currentStep === 4 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Scheduling &amp; Budget</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Determine running dates and expected budget allocations.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Start Date *</label>
                      <input 
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.startDate ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all font-semibold`}
                      />
                      {errors.startDate && <p className="text-[10px] text-red-500 font-semibold">{errors.startDate}</p>}
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">End Date *</label>
                      <input 
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.endDate ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl px-3.5 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all font-semibold`}
                      />
                      {errors.endDate && <p className="text-[10px] text-red-500 font-semibold">{errors.endDate}</p>}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Expected Budget (₹) *</label>
                    <div className="relative">
                      <input 
                        type="number"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        placeholder="e.g. 150000"
                        className={`w-full bg-zinc-50 dark:bg-zinc-900 border ${errors.budget ? 'border-red-500' : 'border-zinc-200 dark:border-zinc-800'} rounded-xl pl-8 pr-4 py-2 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] outline-none text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 transition-all font-bold`}
                      />
                      <DollarSign size={13} className="absolute left-3.5 top-3 text-zinc-400 dark:text-zinc-500" />
                    </div>
                    {errors.budget && <p className="text-[10px] text-red-500 font-semibold">{errors.budget}</p>}
                  </div>
                </div>
              )}

              {/* STEP 5: Review & Status */}
              {currentStep === 5 && (
                <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-200">
                  <div className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Review &amp; Status</h3>
                    <p className="text-[11px] text-zinc-500 mt-0.5">Select campaign creation status and save your changes.</p>
                  </div>

                  {/* Mini Review Box */}
                  <div className="bg-zinc-50 dark:bg-zinc-900/60 rounded-2xl p-4.5 border border-zinc-200 dark:border-zinc-805 space-y-3">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--primary)]">Configuration Review</span>
                    <div className="grid grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold">Campaign Name</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-250 mt-0.5 block">{title || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold">Channel Type</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-250 mt-0.5 block">{type}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold">Target Segment</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-250 mt-0.5 block">{targetAudience}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold">Budget Allocation</span>
                        <span className="font-bold text-zinc-850 dark:text-zinc-250 mt-0.5 block">₹{Number(budget).toLocaleString('en-IN') || '0'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold">Date Scope</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-350 mt-0.5 block">{startDate || 'N/A'} to {endDate || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block text-[10px] uppercase font-bold">Locations</span>
                        <span className="font-semibold text-zinc-800 dark:text-zinc-350 mt-0.5 block">
                          {regionIds.length} Regions, {franchiseIds.length} Franchises, {storeIds.length} Stores
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Radio Buttons */}
                  <div className="space-y-2.5">
                    <label className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider block">Set Campaign Status *</label>
                    <div className="flex flex-wrap gap-2.5">
                      {['Draft', 'Scheduled', 'Running', 'Paused', 'Completed'].map((st) => {
                        const isSel = status === st;
                        const badgeColor = 
                          st === 'Draft' ? 'border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300' :
                          st === 'Scheduled' ? 'border-blue-300 dark:border-blue-800/40 bg-blue-50/50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400' :
                          st === 'Running' ? 'border-emerald-300 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' :
                          st === 'Paused' ? 'border-amber-300 dark:border-amber-800/40 bg-amber-50/50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400' :
                          'border-purple-300 dark:border-purple-800/40 bg-purple-50/50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400';

                        const selectedClass = isSel ? 'ring-2 ring-[var(--primary)] border-[var(--primary)] font-black' : 'opacity-70 hover:opacity-100';

                        return (
                          <label 
                            key={st}
                            className={`border rounded-xl px-4 py-2 flex items-center gap-2.5 cursor-pointer transition-all ${badgeColor} ${selectedClass}`}
                          >
                            <input 
                              type="radio" 
                              name="campaignStatus" 
                              value={st} 
                              checked={isSel} 
                              onChange={() => setStatus(st)}
                              className="sr-only" 
                            />
                            <span className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center shrink-0 ${isSel ? 'border-[var(--primary)]' : 'border-zinc-400'}`}>
                              {isSel && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]"></span>}
                            </span>
                            <span className="text-xs font-semibold">{st}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              
            </div>
          </div>
        )}

        {/* Footer Navigation Bar */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 flex justify-between items-center shrink-0">
          <div>
            {currentStep > 1 && (
              <button 
                onClick={handleBack}
                disabled={loading || fetching}
                className="px-4 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                Back
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <button 
              onClick={handleCloseAttempt}
              disabled={loading || fetching}
              className="px-4 py-2 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            
            {currentStep < 5 ? (
              <button 
                onClick={handleNext}
                disabled={fetching}
                className="flex items-center gap-1.5 px-4.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95"
              >
                Next <ChevronRight size={13} />
              </button>
            ) : (
              <button 
                onClick={handleSave}
                disabled={loading || fetching}
                className="flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-70"
              >
                {loading ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Unsaved Changes Confirmation Dialog */}
      {showWarning && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-full mb-4">
              <AlertTriangle size={28} />
            </div>
            <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Discard Unsaved Changes?</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              You have made modifications to this campaign that haven't been saved. Leaving now will discard all edits.
            </p>
            <div className="flex gap-3 mt-6 w-full">
              <button
                type="button"
                onClick={() => setShowWarning(false)}
                className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors"
              >
                Stay &amp; Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowWarning(false);
                  onClose();
                }}
                className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
              >
                Discard Changes
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
