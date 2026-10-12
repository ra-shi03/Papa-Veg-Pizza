import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Info, Tag, Percent, DollarSign, Gift, Layers, Check,
  ChevronLeft, ChevronRight, AlertCircle, Calendar, MapPin, 
  Users, CheckSquare, Search, ShoppingBag, Globe, RefreshCw
} from 'lucide-react';
import { 
  api 
} from './CouponsData';
import { toast } from 'sonner';

export default function CreateCoupon({ isOpen, onClose, onSuccess }) {
  const [activeTab, setActiveTab] = useState(1);
  const [loading, setLoading] = useState(false);

  const [dbProducts, setDbProducts] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbRegions, setDbRegions] = useState([]);
  const [dbZones, setDbZones] = useState([]);
  const [dbTerritories, setDbTerritories] = useState([]);
  const [dbFranchises, setDbFranchises] = useState([]);
  const [dbStores, setDbStores] = useState([]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const { adminClient } = await import('../../../../../services/api/axios');
        const results = await Promise.allSettled([
          adminClient.get('/food/admin/products'),
          adminClient.get('/food/admin/category-products'),
          adminClient.get('/food/admin/regions'),
          adminClient.get('/food/admin/zones'),
          adminClient.get('/food/admin/territories'),
          adminClient.get('/food/admin/franchises'),
          adminClient.get('/food/admin/stores')
        ]);
        
        
        const extractArr = (res, name) => {
          let arr = [];
          const d = res?.data?.data || res?.data;
          if (Array.isArray(d)) {
            arr = d;
          } else if (d && typeof d === 'object') {
            const found = Object.values(d).find(Array.isArray);
            if (found) arr = found;
          }
          if (arr.length === 0 && Array.isArray(res?.data)) arr = res.data;
          
          return arr.map((item, idx) => {
            if (typeof item === 'string') return { id: item, name: item };
            return {
              ...item,
              id: String(item._id || item.id || item.uid || `${name}-${idx}`),
              name: item.name || item.storeName || item.label || item.title || item.id || `${name}-${idx}`
            };
          });
        };

        const prodRes = results[0].status === 'fulfilled' ? results[0].value : null;
        const catRes = results[1].status === 'fulfilled' ? results[1].value : null;
        const regRes = results[2].status === 'fulfilled' ? results[2].value : null;
        const zoneRes = results[3].status === 'fulfilled' ? results[3].value : null;
        const terrRes = results[4].status === 'fulfilled' ? results[4].value : null;
        const franRes = results[5].status === 'fulfilled' ? results[5].value : null;
        const storeRes = results[6].status === 'fulfilled' ? results[6].value : null;

        setDbProducts(extractArr(prodRes, 'prod'));
        setDbCategories(extractArr(catRes, 'cat'));
        setDbRegions(extractArr(regRes, 'reg'));
        setDbZones(extractArr(zoneRes, 'zone'));
        setDbTerritories(extractArr(terrRes, 'ter'));
        setDbFranchises(extractArr(franRes, 'fran'));
        
        let storesList = extractArr(storeRes, 'store');
        if (storesList.length === 0) {
          try {
            const fallbackStores = await adminClient.get('/stores');
            storesList = extractArr(fallbackStores, 'store');
          } catch (_) {}
        }
        setDbStores(storesList);
      } catch (err) {
        console.error("Failed to load some dropdown data:", err);
      }
    };
    if (isOpen) {
      fetchDropdownData();
    }
  }, [isOpen]);


  // Form States - Conforms directly to MongoDB schema
  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [showOnHome, setShowOnHome] = useState(false);
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

  // Category filter state for Product tab (separate from coupon's categoryIds)
  // 'all' means all categories; otherwise array of category ids
  const [productFilterCatIds, setProductFilterCatIds] = useState('all');
  const isAllCategoriesSelected = productFilterCatIds === 'all';

  // Derive categories directly from the products themselves so IDs ALWAYS match.
  // Products come populated: categoryId = { _id: "...", label: "Desserts" }
  const productCategories = useMemo(() => {
    const seen = new Set();
    const cats = [];
    dbProducts.forEach(p => {
      // Handle both populated object and raw string/id
      const rawCat = p.categoryId;
      const catId = rawCat?._id || rawCat?.id || (typeof rawCat === 'string' ? rawCat : null);
      const catName = rawCat?.label || rawCat?.name || rawCat?.title || null;
      if (catId && !seen.has(String(catId))) {
        seen.add(String(catId));
        cats.push({ id: String(catId), name: catName || String(catId) });
      }
    });
    return cats.sort((a, b) => a.name.localeCompare(b.name));
  }, [dbProducts]);

  // Helper: extract the categoryId string from a product (handles populated vs raw)
  const getProductCatId = (p) => {
    const raw = p.categoryId;
    return String(raw?._id || raw?.id || (typeof raw === 'string' ? raw : '') || '');
  };

  // ----------------------------------------------------
  // Dynamic Option Filters for Dependent Region Hierarchy
  // Hierarchy Order: Regions -> Zones -> Franchises -> Territories -> Stores
  // ----------------------------------------------------
  const filteredZones = useMemo(() => {
    if (regionIds.length === 0) return [];
    return dbZones.filter(z => {
      const rId = z.regionId?._id || z.regionId || z.id;
      return regionIds.includes(rId);
    });
  }, [regionIds, dbZones]);

  const filteredFranchises = useMemo(() => {
    if (zoneIds.length === 0) return [];
    return dbFranchises.filter(f => {
      const zId = f.zoneId?._id || f.zoneId;
      if (zId && zoneIds.includes(zId)) return true;

      // Mock/relational link via territoryId
      if (f.territoryId) {
        const ter = dbTerritories.find(t => (t.id || t._id) === f.territoryId);
        if (ter && zoneIds.includes(ter.zoneId?._id || ter.zoneId)) return true;
      }

      // Link via stores belonging to selected zones
      const hasStoreInZone = dbStores.some(s => {
        const sFranId = s.franchiseId?._id || s.franchiseId;
        const sZoneId = s.zoneId?._id || s.zoneId;
        return (sFranId === f.id || sFranId === f._id) && zoneIds.includes(sZoneId);
      });
      if (hasStoreInZone) return true;

      return false;
    });
  }, [zoneIds, dbFranchises, dbTerritories, dbStores]);

  const filteredTerritories = useMemo(() => {
    if (franchiseIds.length === 0) return [];

    // Collect all zones that the selected franchises belong to
    const activeZoneIds = new Set();
    dbFranchises.forEach(f => {
      const fId = String(f._id || f.id || '');
      if (franchiseIds.some(id => String(id) === fId)) {
        const zId = String(f.zoneId?._id || f.zoneId?.id || f.zoneId || '');
        if (zId) activeZoneIds.add(zId);
      }
    });

    // Also include any zoneIds already selected in column 2
    zoneIds.forEach(zId => {
      if (zId) activeZoneIds.add(String(zId));
    });

    // Collect specific territory IDs mapped to selected franchises or their stores
    const franchiseTerritoryIds = new Set();
    dbFranchises.forEach(f => {
      const fId = String(f._id || f.id || '');
      if (franchiseIds.some(id => String(id) === fId)) {
        const tId = String(f.territoryId?._id || f.territoryId?.id || f.territoryId || '');
        if (tId) franchiseTerritoryIds.add(tId);
      }
    });

    dbStores.forEach(s => {
      const sFranId = String(s.franchiseId?._id || s.franchiseId?.id || s.franchiseId || '');
      const sTerrId = String(s.territoryId?._id || s.territoryId?.id || s.territoryId || '');
      if (franchiseIds.some(id => String(id) === sFranId) && sTerrId) {
        franchiseTerritoryIds.add(sTerrId);
      }
    });

    return dbTerritories.filter(t => {
      const tId = String(t.id || t._id || '');
      const tZoneId = String(t.zoneId?._id || t.zoneId?.id || t.zoneId || '');

      // Strictly must belong to one of the selected franchise / active zones
      if (!activeZoneIds.has(tZoneId)) return false;

      // If specific territories are mapped to these franchises/stores, prioritize them
      if (franchiseTerritoryIds.size > 0) {
        return franchiseTerritoryIds.has(tId);
      }
      return true;
    });
  }, [franchiseIds, zoneIds, dbTerritories, dbFranchises, dbStores]);

  const filteredStores = useMemo(() => {
    if (franchiseIds.length === 0) return [];
    return dbStores.filter(s => {
      const sFranId = String(s.franchiseId?._id || s.franchiseId?.id || s.franchiseId || '');
      const matchesFranchise = franchiseIds.some(id => String(id) === sFranId);
      if (!matchesFranchise) return false;

      if (territoryIds.length > 0) {
        const sTerrId = String(s.territoryId?._id || s.territoryId?.id || s.territoryId || '');
        return sTerrId ? territoryIds.some(id => String(id) === sTerrId) : true;
      }
      return true;
    });
  }, [franchiseIds, territoryIds, dbStores]);

  // Clean up child selections when parent selections change (safe guards prevent infinite update loops)
  useEffect(() => {
    setZoneIds(prev => {
      if (!prev || prev.length === 0) return prev;
      const valid = new Set(filteredZones.map(z => String(z.id || z._id)));
      const next = prev.filter(zId => valid.has(String(zId)));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredZones]);

  useEffect(() => {
    setFranchiseIds(prev => {
      if (!prev || prev.length === 0) return prev;
      const valid = new Set(filteredFranchises.map(f => String(f.id || f._id)));
      const next = prev.filter(fId => valid.has(String(fId)));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredFranchises]);

  useEffect(() => {
    setTerritoryIds(prev => {
      if (!prev || prev.length === 0) return prev;
      const valid = new Set(filteredTerritories.map(t => String(t.id || t._id)));
      const next = prev.filter(tId => valid.has(String(tId)));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredTerritories]);

  useEffect(() => {
    setStoreIds(prev => {
      if (!prev || prev.length === 0) return prev;
      const valid = new Set(filteredStores.map(s => String(s.id || s._id)));
      const next = prev.filter(sId => valid.has(String(sId)));
      return next.length === prev.length ? prev : next;
    });
  }, [filteredStores]);

  // ----------------------------------------------------
  // Product tab: filter products by productFilterCatIds
  // ----------------------------------------------------
  const searchedProducts = useMemo(() => {
    let prods = dbProducts;

    if (!isAllCategoriesSelected) {
      if (productFilterCatIds.length === 0) {
        prods = [];
      } else {
        prods = prods.filter(p => productFilterCatIds.includes(getProductCatId(p)));
      }
    }

    if (!productSearch) return prods;
    const q = productSearch.toLowerCase();
    return prods.filter(p =>
      p.name?.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q)
    );
  }, [productSearch, productFilterCatIds, isAllCategoriesSelected, dbProducts]);

  // Auto-select all products when "All Categories" is picked
  useEffect(() => {
    if (applicableOn !== 'Product') return;
    if (isAllCategoriesSelected) {
      setProductIds(dbProducts.map(p => p.id));
    }
  }, [isAllCategoriesSelected, dbProducts, applicableOn]);

  // Auto-select products of selected categories
  useEffect(() => {
    if (applicableOn !== 'Product' || isAllCategoriesSelected) return;
    const visible = dbProducts.filter(p => productFilterCatIds.includes(getProductCatId(p)));
    setProductIds(visible.map(p => p.id));
  }, [productFilterCatIds, isAllCategoriesSelected, dbProducts, applicableOn]);

  

  if (!isOpen) return null;

  const handleRegionSelectAll = () => {
    if (regionIds.length === dbRegions.length) {
      setRegionIds([]);
    } else {
      setRegionIds(dbRegions.map(r => r.id || r._id));
    }
  };

  const handleZoneSelectAll = () => {
    if (zoneIds.length === filteredZones.length) {
      setZoneIds([]);
    } else {
      setZoneIds(filteredZones.map(z => z.id || z._id));
    }
  };

  const handleFranchiseSelectAll = () => {
    if (franchiseIds.length === filteredFranchises.length) {
      setFranchiseIds([]);
    } else {
      setFranchiseIds(filteredFranchises.map(f => f.id || f._id));
    }
  };

  const handleTerritorySelectAll = () => {
    if (territoryIds.length === filteredTerritories.length) {
      setTerritoryIds([]);
    } else {
      setTerritoryIds(filteredTerritories.map(t => t.id || t._id));
    }
  };

  const handleStoreSelectAll = () => {
    if (storeIds.length === filteredStores.length) {
      setStoreIds([]);
    } else {
      setStoreIds(filteredStores.map(s => s.id || s._id));
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
        showOnHome,
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
    { id: 5, title: 'Validity', desc: 'Dates and final status' }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center lg:pl-[280px] p-4">
      {/* Broad 1380px Width Container for maximum readability */}
      <div className="bg-white dark:bg-zinc-950 w-full max-w-[1380px] h-[780px] max-h-[92vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        
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
          <div className="w-64 bg-zinc-50 dark:bg-zinc-900 border-r border-zinc-200 dark:border-zinc-800 p-5 flex flex-col gap-1 overflow-y-auto shrink-0 select-none">
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
                  <p className="text-[11px] text-zinc-555">Apply this coupon to the entire cart, or select specific products by category.</p>
                </div>

                <div className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Applicable On</label>
                    <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 border border-zinc-200 dark:border-zinc-800 rounded-lg max-w-md">
                      {['All', 'Product'].map((scope) => (
                        <button
                          type="button"
                          key={scope}
                          onClick={() => {
                            setApplicableOn(scope);
                            if (scope !== 'Product') {
                              setProductFilterCatIds('all');
                              setProductIds([]);
                            }
                          }}
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

                  {applicableOn === 'Product' && (
                    <div className="space-y-3 animate-slide-down">
                      {/* Category Filter Row */}
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/20">
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider">Filter by Category</label>
                          <span className="text-[9px] text-zinc-400 font-medium">
                            {isAllCategoriesSelected ? 'All products shown' : `${productFilterCatIds.length} categor${productFilterCatIds.length === 1 ? 'y' : 'ies'} selected`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {/* All Categories chip */}
                          <button
                            type="button"
                            onClick={() => setProductFilterCatIds('all')}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
                              isAllCategoriesSelected
                                ? 'bg-[var(--primary)] text-white border-[var(--primary)]'
                                : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-[var(--primary)] hover:text-[var(--primary)]'
                            }`}
                          >
                            All Categories
                          </button>
                          {productCategories.map(cat => {
                            const isActive = !isAllCategoriesSelected && productFilterCatIds.includes(cat.id);
                            return (
                              <button
                                type="button"
                                key={cat.id}
                                onClick={() => {
                                  if (isAllCategoriesSelected) {
                                    setProductFilterCatIds([cat.id]);
                                  } else if (productFilterCatIds.includes(cat.id)) {
                                    const next = productFilterCatIds.filter(id => id !== cat.id);
                                    setProductFilterCatIds(next.length === 0 ? 'all' : next);
                                  } else {
                                    setProductFilterCatIds(prev => [...(prev === 'all' ? [] : prev), cat.id]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  isActive
                                    ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]'
                                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:border-[var(--primary)] hover:text-[var(--primary)]'
                                }`}
                              >
                                {isActive && <Check size={9} />}
                                {cat.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>


                      {/* Products Panel */}
                      <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/50 dark:bg-zinc-900/20">
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <label className="text-[10px] font-black text-zinc-450 uppercase tracking-wider shrink-0">
                            Select Products
                            <span className="ml-2 text-zinc-400 font-medium normal-case">
                              ({searchedProducts.length} available • {productIds.length} selected)
                            </span>
                          </label>
                          <div className="flex items-center gap-2">
                            {/* Select/Deselect visible */}
                            <button
                              type="button"
                              onClick={() => {
                                const visibleIds = searchedProducts.map(p => p.id);
                                const allSelected = visibleIds.every(id => productIds.includes(id));
                                if (allSelected) {
                                  setProductIds(prev => prev.filter(id => !visibleIds.includes(id)));
                                } else {
                                  setProductIds(prev => [...new Set([...prev, ...visibleIds])]);
                                }
                              }}
                              className="text-[9px] font-black text-[var(--primary)] uppercase hover:underline cursor-pointer shrink-0"
                            >
                              {searchedProducts.length > 0 && searchedProducts.every(p => productIds.includes(p.id)) ? 'Deselect All' : 'Select All'}
                            </button>
                            <div className="relative max-w-[160px] w-full">
                              <Search size={12} className="absolute left-2.5 top-2 text-zinc-400" />
                              <input 
                                type="text" 
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                                className="w-full h-7 pl-7 pr-2.5 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-md outline-none text-[10px] font-semibold"
                                placeholder="Search by name or SKU..."
                              />
                            </div>
                          </div>
                        </div>

                        {searchedProducts.length === 0 ? (
                          <div className="text-center py-8 text-zinc-400">
                            <ShoppingBag size={24} className="mx-auto mb-2 opacity-40" />
                            <p className="text-[11px] font-semibold">
                              {productSearch ? 'No products match your search' : 'Select a category above to view products'}
                            </p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
                            {searchedProducts.map((prod) => {
                              const isSelected = productIds.includes(prod.id);
                              return (
                                <label
                                  key={prod.id}
                                  className={`p-2 rounded-lg border text-left flex items-center gap-2.5 text-xs font-bold transition-all cursor-pointer select-none ${
                                    isSelected 
                                      ? 'border-[var(--primary)] bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10 text-black dark:text-white' 
                                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
                                  }`}
                                >
                                  <input 
                                    type="checkbox" 
                                    checked={isSelected}
                                    onChange={() => {
                                      setProductIds(prev => 
                                        prev.includes(prod.id) ? prev.filter(id => id !== prod.id) : [...prev, prod.id]
                                      );
                                    }}
                                    className="w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <p className="truncate leading-none">{prod.name}</p>
                                    <span className="text-[9px] text-zinc-400 font-mono mt-0.5 block">{prod.sku} • ₹{prod.price}</span>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
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

                {/* Dependent Hierarchical Select columns - Broad & Horizontally Scrollable */}
                <div className="flex gap-3.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 bg-zinc-50/60 dark:bg-zinc-900/30 flex-1 overflow-x-auto min-h-[420px] pb-3 shadow-inner">
                  
                  {/* 1. Regions List */}
                  <div className="flex flex-col flex-1 min-w-[220px] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 overflow-hidden h-full shadow-sm">
                    <div className="bg-zinc-100/70 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        Regions {regionIds.length > 0 && <span className="text-[var(--primary)] font-bold">({regionIds.length}/{dbRegions.length})</span>}
                      </span>
                      <button type="button" onClick={handleRegionSelectAll} className="text-[9px] text-[var(--primary)] font-black uppercase hover:underline cursor-pointer">
                        {regionIds.length === dbRegions.length && dbRegions.length > 0 ? 'Clear' : 'All'}
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {dbRegions.map(reg => {
                        const regId = reg.id || reg._id;
                        const isChecked = regionIds.includes(regId);
                        return (
                          <label key={regId} className={`flex items-start gap-2.5 p-2 rounded-lg text-xs font-bold cursor-pointer select-none transition-colors ${
                            isChecked ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                          }`}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => {
                                setRegionIds(prev => 
                                  prev.includes(regId) ? prev.filter(id => id !== regId) : [...prev, regId]
                                );
                              }}
                              className="w-3.5 h-3.5 mt-0.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer shrink-0"
                            />
                            <span className="leading-snug break-words" title={reg.name}>{reg.name}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. Zones List */}
                  <div className="flex flex-col flex-1 min-w-[220px] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-955 overflow-hidden h-full shadow-sm transition-opacity duration-200" style={{ opacity: regionIds.length === 0 ? 0.45 : 1 }}>
                    <div className="bg-zinc-100/70 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        Zones {zoneIds.length > 0 && <span className="text-[var(--primary)] font-bold">({zoneIds.length}/{filteredZones.length})</span>}
                      </span>
                      {filteredZones.length > 0 && (
                        <button type="button" onClick={handleZoneSelectAll} className="text-[9px] text-[var(--primary)] font-black uppercase hover:underline cursor-pointer">
                          {zoneIds.length === filteredZones.length ? 'Clear' : 'All'}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {regionIds.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 font-semibold text-center mt-8">Select a Region</p>
                      ) : filteredZones.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 font-semibold text-center mt-8">No Zones Found</p>
                      ) : (
                        filteredZones.map(zone => {
                          const zId = zone.id || zone._id;
                          const isChecked = zoneIds.includes(zId);
                          return (
                            <label key={zId} className={`flex items-start gap-2.5 p-2 rounded-lg text-xs font-bold cursor-pointer select-none transition-colors ${
                              isChecked ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300'
                            }`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setZoneIds(prev => 
                                    prev.includes(zId) ? prev.filter(id => id !== zId) : [...prev, zId]
                                  );
                                }}
                                className="w-3.5 h-3.5 mt-0.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer shrink-0"
                              />
                              <span className="leading-snug break-words" title={zone.name}>{zone.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* 3. Franchises List */}
                  <div className="flex flex-col flex-1 min-w-[220px] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-955 overflow-hidden h-full shadow-sm transition-opacity duration-200" style={{ opacity: zoneIds.length === 0 ? 0.45 : 1 }}>
                    <div className="bg-zinc-100/70 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        Franchises {franchiseIds.length > 0 && <span className="text-[var(--primary)] font-bold">({franchiseIds.length}/{filteredFranchises.length})</span>}
                      </span>
                      {filteredFranchises.length > 0 && (
                        <button type="button" onClick={handleFranchiseSelectAll} className="text-[9px] text-[var(--primary)] font-black uppercase hover:underline cursor-pointer">
                          {franchiseIds.length === filteredFranchises.length ? 'Clear' : 'All'}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {zoneIds.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 font-semibold text-center mt-8">Select a Zone</p>
                      ) : filteredFranchises.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 font-semibold text-center mt-8">No Franchises Found</p>
                      ) : (
                        filteredFranchises.map(fran => {
                          const fId = fran.id || fran._id;
                          const isChecked = franchiseIds.includes(fId);
                          return (
                            <label key={fId} className={`flex items-start gap-2.5 p-2 rounded-lg text-xs font-bold cursor-pointer select-none transition-colors ${
                              isChecked ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350'
                            }`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setFranchiseIds(prev => 
                                    prev.includes(fId) ? prev.filter(id => id !== fId) : [...prev, fId]
                                  );
                                }}
                                className="w-3.5 h-3.5 mt-0.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer shrink-0"
                              />
                              <span className="leading-snug break-words" title={fran.name}>{fran.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* 4. Territories List */}
                  <div className="flex flex-col flex-1 min-w-[220px] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-955 overflow-hidden h-full shadow-sm transition-opacity duration-200" style={{ opacity: franchiseIds.length === 0 ? 0.45 : 1 }}>
                    <div className="bg-zinc-100/70 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        Territories {territoryIds.length > 0 && <span className="text-[var(--primary)] font-bold">({territoryIds.length}/{filteredTerritories.length})</span>}
                      </span>
                      {filteredTerritories.length > 0 && (
                        <button type="button" onClick={handleTerritorySelectAll} className="text-[9px] text-[var(--primary)] font-black uppercase hover:underline cursor-pointer">
                          {territoryIds.length === filteredTerritories.length ? 'Clear' : 'All'}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {franchiseIds.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 font-semibold text-center mt-8">Select a Franchise</p>
                      ) : filteredTerritories.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 font-semibold text-center mt-8">No Territories Found</p>
                      ) : (
                        filteredTerritories.map(ter => {
                          const tId = ter.id || ter._id;
                          const isChecked = territoryIds.includes(tId);
                          return (
                            <label key={tId} className={`flex items-start gap-2.5 p-2 rounded-lg text-xs font-bold cursor-pointer select-none transition-colors ${
                              isChecked ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350'
                            }`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setTerritoryIds(prev => 
                                    prev.includes(tId) ? prev.filter(id => id !== tId) : [...prev, tId]
                                  );
                                }}
                                className="w-3.5 h-3.5 mt-0.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer shrink-0"
                              />
                              <span className="leading-snug break-words" title={ter.name}>{ter.name}</span>
                            </label>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {/* 5. Stores List */}
                  <div className="flex flex-col flex-1 min-w-[220px] border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-955 overflow-hidden h-full shadow-sm transition-opacity duration-200" style={{ opacity: franchiseIds.length === 0 ? 0.45 : 1 }}>
                    <div className="bg-zinc-100/70 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-3.5 py-2.5 flex items-center justify-between shrink-0 select-none">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        Stores {storeIds.length > 0 && <span className="text-[var(--primary)] font-bold">({storeIds.length}/{filteredStores.length})</span>}
                      </span>
                      {filteredStores.length > 0 && (
                        <button type="button" onClick={handleStoreSelectAll} className="text-[9px] text-[var(--primary)] font-black uppercase hover:underline cursor-pointer">
                          {storeIds.length === filteredStores.length ? 'Clear' : 'All'}
                        </button>
                      )}
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                      {franchiseIds.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 font-semibold text-center mt-8">Select a Franchise</p>
                      ) : filteredStores.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 font-semibold text-center mt-8">No Stores Found</p>
                      ) : (
                        filteredStores.map(store => {
                          const sId = store.id || store._id;
                          const isChecked = storeIds.includes(sId);
                          return (
                            <label key={sId} className={`flex items-start gap-2.5 p-2 rounded-lg text-xs font-bold cursor-pointer select-none transition-colors ${
                              isChecked ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-350'
                            }`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => {
                                  setStoreIds(prev => 
                                    prev.includes(sId) ? prev.filter(id => id !== sId) : [...prev, sId]
                                  );
                                }}
                                className="w-3.5 h-3.5 mt-0.5 text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer shrink-0"
                              />
                              <span className="leading-snug break-words" title={store.name}>{store.name}</span>
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

            {/* Step 5: Validity & Status */}
            {activeTab === 5 && (
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
                {activeTab < 5 ? (
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
