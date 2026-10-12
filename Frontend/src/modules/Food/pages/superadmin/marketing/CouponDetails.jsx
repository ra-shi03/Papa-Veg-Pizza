import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Info, Tag, Calendar, BarChart3, AlertCircle, MapPin, 
  Users, ShoppingBag, Landmark, ArrowRight, Clock, ShieldCheck, 
  ChevronLeft, ChevronRight, Copy, RefreshCw, BarChart
} from 'lucide-react';
import { 
  mockRegions, mockZones, mockTerritories, mockFranchises, mockStores, 
  mockProducts, mockCategories, mockCustomers, api 
} from './CouponsData';
import { adminClient } from '../../../../../services/api/axios';
import { toast } from 'sonner';

export default function CouponDetails({ isOpen, onClose, coupon }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Real DB metadata state
  const [dbRegions, setDbRegions] = useState([]);
  const [dbZones, setDbZones] = useState([]);
  const [dbTerritories, setDbTerritories] = useState([]);
  const [dbFranchises, setDbFranchises] = useState([]);
  const [dbStores, setDbStores] = useState([]);
  const [dbCategories, setDbCategories] = useState([]);
  const [dbProducts, setDbProducts] = useState([]);

  // Fetch real hierarchy and product data for name resolution
  useEffect(() => {
    if (!isOpen) return;
    const fetchDropdownData = async () => {
      try {
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
          if (Array.isArray(d)) arr = d;
          else if (d && typeof d === 'object') {
            const found = Object.values(d).find(Array.isArray);
            if (found) arr = found;
          }
          if (arr.length === 0 && Array.isArray(res?.data)) arr = res.data;
          return arr.map((item, idx) => {
            if (typeof item === 'string') return { id: item, name: item };
            return {
              ...item,
              id: String(item._id || item.id || item.uid || item.categoryId || item.productId || `${name}-${idx}`),
              name: item.name || item.storeName || item.label || item.title || item.id || `${name}-${idx}`
            };
          });
        };

        if (results[0].status === 'fulfilled') setDbProducts(extractArr(results[0].value, 'prod'));
        if (results[1].status === 'fulfilled') setDbCategories(extractArr(results[1].value, 'cat'));
        if (results[2].status === 'fulfilled') setDbRegions(extractArr(results[2].value, 'reg'));
        if (results[3].status === 'fulfilled') setDbZones(extractArr(results[3].value, 'zone'));
        if (results[4].status === 'fulfilled') setDbTerritories(extractArr(results[4].value, 'ter'));
        if (results[5].status === 'fulfilled') setDbFranchises(extractArr(results[5].value, 'fran'));
        if (results[6].status === 'fulfilled') setDbStores(extractArr(results[6].value, 'store'));
      } catch (err) {
        console.error("Failed to load metadata in CouponDetails:", err);
      }
    };
    fetchDropdownData();
  }, [isOpen]);

  // Name Resolution Maps
  const regionMap = useMemo(() => {
    const map = {};
    mockRegions.forEach(r => { map[r.id] = r.name; });
    dbRegions.forEach(r => { map[r.id] = r.name; if (r._id) map[String(r._id)] = r.name; });
    return map;
  }, [dbRegions]);

  const zoneMap = useMemo(() => {
    const map = {};
    mockZones.forEach(z => { map[z.id] = z.name; });
    dbZones.forEach(z => { map[z.id] = z.name; if (z._id) map[String(z._id)] = z.name; });
    return map;
  }, [dbZones]);

  const territoryMap = useMemo(() => {
    const map = {};
    mockTerritories.forEach(t => { map[t.id] = t.name; });
    dbTerritories.forEach(t => { map[t.id] = t.name; if (t._id) map[String(t._id)] = t.name; });
    return map;
  }, [dbTerritories]);

  const franchiseMap = useMemo(() => {
    const map = {};
    mockFranchises.forEach(f => { map[f.id] = f.name; });
    dbFranchises.forEach(f => { map[f.id] = f.name; if (f._id) map[String(f._id)] = f.name; });
    return map;
  }, [dbFranchises]);

  const storeMap = useMemo(() => {
    const map = {};
    mockStores.forEach(s => { map[s.id] = s.name; });
    dbStores.forEach(s => { map[s.id] = s.name; if (s._id) map[String(s._id)] = s.name; });
    return map;
  }, [dbStores]);

  const categoryMap = useMemo(() => {
    const map = {};
    mockCategories.forEach(c => { map[c.id] = c.name; });
    dbCategories.forEach(c => { map[c.id] = c.name; if (c._id) map[String(c._id)] = c.name; });
    return map;
  }, [dbCategories]);

  const productMap = useMemo(() => {
    const map = {};
    mockProducts.forEach(p => { map[p.id] = p; });
    dbProducts.forEach(p => { map[p.id] = p; if (p._id) map[String(p._id)] = p; });
    return map;
  }, [dbProducts]);

  // Usage Analytics States
  const [usages, setUsages] = useState([]);
  const [usagesLoading, setUsagesLoading] = useState(false);
  const [usagesPage, setUsagesPage] = useState(1);
  const [usagesTotalCount, setUsagesTotalCount] = useState(0);
  const [usagesTotalPages, setUsagesTotalPages] = useState(1);

  // Load specific coupon usages when tab changes to 'analytics'
  useEffect(() => {
    if (coupon && isOpen && activeTab === 'analytics') {
      fetchUsages();
    }
  }, [coupon, isOpen, activeTab, usagesPage]);

  const fetchUsages = async () => {
    if (!coupon?._id) return;
    setUsagesLoading(true);
    try {
      const result = await api.getCouponUsages(coupon._id, { page: usagesPage, limit: 5 });
      setUsages(result.data || []);
      setUsagesTotalCount(result.totalCount || 0);
      setUsagesTotalPages(result.totalPages || 1);
    } catch (err) {
      // Clean fallback if no usages exist yet
      setUsages([]);
      setUsagesTotalCount(0);
      setUsagesTotalPages(1);
    } finally {
      setUsagesLoading(false);
    }
  };

  const topStores = useMemo(() => {
    if (!usages || usages.length === 0) return [];
    const counts = {};
    usages.forEach(u => {
      const storeName = storeMap[u.storeId] || u.storeName || u.storeId || 'Store';
      counts[storeName] = (counts[storeName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 3);
  }, [usages, storeMap]);

  const topRegions = useMemo(() => {
    if (!usages || usages.length === 0) return [];
    const counts = {};
    usages.forEach(u => {
      const regName = regionMap[u.regionId] || u.regionName || u.regionId || 'Region';
      counts[regName] = (counts[regName] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count).slice(0, 3);
  }, [usages, regionMap]);

  if (!isOpen || !coupon) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(coupon.code);
    toast.success(`Coupon code ${coupon.code} copied to clipboard!`);
  };

  // Safe Array references
  const categoryIds = coupon.categoryIds || [];
  const productIds = coupon.productIds || [];
  const regionIds = coupon.regionIds || [];
  const zoneIds = coupon.zoneIds || [];
  const territoryIds = coupon.territoryIds || [];
  const franchiseIds = coupon.franchiseIds || [];
  const storeIds = coupon.storeIds || [];
  const customerSegments = coupon.customerSegments || [];
  const customerIds = coupon.customerIds || [];

  // Actual statistics from coupon ledger
  const totalUses = coupon.usageCount || 0;
  const revenueGenerated = coupon.revenueGenerated || 0;
  const totalDiscountGiven = 0;
  const averageOrderValue = totalUses > 0 ? Math.round(revenueGenerated / totalUses) : 0;

  // Format dates
  const formatDateTime = (isoString) => {
    if (!isoString) return 'N/A';
    return new Date(isoString).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true
    });
  };

  const getStatusBadge = (status, endDate) => {
    const isExpired = new Date(endDate) < new Date();
    if (status === 'disabled') {
      return 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700';
    }
    if (isExpired || status === 'expired') {
      return 'bg-rose-500/10 text-rose-650 dark:text-rose-455 border border-rose-500/15';
    }
    return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15';
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      <div className="absolute inset-0 overflow-hidden">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in" onClick={onClose}></div>
        
        {/* Slide-over panel */}
        <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-2xl bg-white dark:bg-zinc-950 shadow-2xl flex flex-col border-l border-zinc-200 dark:border-zinc-850 animate-in slide-in-from-right duration-250">
            
            {/* Drawer Header */}
            <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2">
                <div className="text-[var(--primary)] p-1.5 bg-[var(--primary)]/10 rounded-lg">
                  <Tag size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white flex items-center gap-2">
                    Coupon Drawer Ledgers
                    <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase ${getStatusBadge(coupon.status, coupon.endDate)}`}>
                      {new Date(coupon.endDate) < new Date() && coupon.status !== 'disabled' ? 'Expired' : coupon.status}
                    </span>
                  </h3>
                  <p className="text-[10px] text-zinc-550 dark:text-zinc-400 mt-0.5">DB Reference: {coupon._id}</p>
                </div>
              </div>
              
              <button onClick={onClose} className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-all cursor-pointer">
                <X size={18} className="text-zinc-550 dark:text-zinc-400" />
              </button>
            </div>

            {/* Tabs Row */}
            <div className="flex px-6 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0 select-none">
              {[
                { id: 'overview', label: 'Overview', icon: Info },
                { id: 'applicability', label: 'Applicability', icon: ShoppingBag },
                { id: 'targeting', label: 'Targeting', icon: Users },
                { id: 'analytics', label: 'Usage Analytics', icon: BarChart }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-3 px-4 text-xs font-bold transition-all relative border-b-2 cursor-pointer ${
                      isActive 
                        ? 'text-[var(--primary)] border-[var(--primary)]' 
                        : 'text-zinc-500 border-transparent hover:text-zinc-800 dark:hover:text-zinc-350'
                    }`}
                  >
                    <Icon size={13} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Drawer Content Body */}
            <div className="flex-1 overflow-y-auto p-6 min-h-0 bg-white dark:bg-zinc-955">
              
              {/* Tab 1: Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Coupon Title Card */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between shadow-sm">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded font-mono font-black text-sm bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 uppercase tracking-wide">
                          {coupon.code}
                        </span>
                        <button 
                          onClick={handleCopyCode} 
                          className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-805 rounded transition-colors text-zinc-400 hover:text-zinc-700 cursor-pointer"
                          title="Copy Code"
                        >
                          <Copy size={12} />
                        </button>
                      </div>
                      <h4 className="text-sm font-black text-zinc-900 dark:text-white mt-1">{coupon.title}</h4>
                      <p className="text-[10px] text-zinc-550 dark:text-zinc-400 font-medium leading-relaxed">{coupon.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Discount Configuration Card */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-3">
                      <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest block">Discount Details</span>
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                          <span className="text-zinc-500">Coupon Type:</span>
                          <span className="text-zinc-900 dark:text-white font-bold">{coupon.couponType}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                          <span className="text-zinc-500">Discount Value:</span>
                          <span className="text-zinc-900 dark:text-white font-mono font-bold">
                            {coupon.couponType === 'Percentage' ? `${coupon.value}%` :
                             coupon.couponType === 'Flat Amount' ? `₹${coupon.value}` : 
                             coupon.couponType === 'Buy One Get One' ? 'BOGO' : `₹${coupon.value} value`}
                          </span>
                        </div>
                        <div className="flex justify-between pb-0.5">
                          <span className="text-zinc-500">Max Savings Cap:</span>
                          <span className="text-zinc-900 dark:text-white font-mono font-bold">₹{coupon.maximumDiscount || coupon.value}</span>
                        </div>
                      </div>
                    </div>

                    {/* Usage Restrictions Card */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-3">
                      <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest block">Conditions &amp; Limits</span>
                      <div className="space-y-2 text-xs font-semibold">
                        <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                          <span className="text-zinc-500">Minimum Order:</span>
                          <span className="text-zinc-900 dark:text-white font-mono font-bold">₹{coupon.minimumOrderAmount}</span>
                        </div>
                        <div className="flex justify-between border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                          <span className="text-zinc-500">Total System Limit:</span>
                          <span className="text-zinc-900 dark:text-white font-mono font-bold">{coupon.usageLimit} uses</span>
                        </div>
                        <div className="flex justify-between pb-0.5">
                          <span className="text-zinc-500">Per User Cap:</span>
                          <span className="text-zinc-900 dark:text-white font-mono font-bold">{coupon.usagePerCustomer} redemptions</span>
                        </div>
                      </div>
                    </div>

                    {/* Validity Periods */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl md:col-span-2 space-y-3">
                      <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest flex items-center gap-1">
                        <Calendar size={12} className="text-[var(--primary)]" />
                        Validity Duration
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold">Start Schedule</span>
                          <span className="font-bold text-zinc-850 dark:text-zinc-200 mt-1 block">{formatDateTime(coupon.startDate)}</span>
                        </div>
                        <div className="p-2.5 bg-zinc-50 dark:bg-zinc-900/50 rounded-lg">
                          <span className="text-[9px] text-zinc-500 uppercase block font-bold">End Schedule</span>
                          <span className="font-bold text-zinc-850 dark:text-zinc-200 mt-1 block">{formatDateTime(coupon.endDate)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Audit Metadata */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl md:col-span-2 space-y-3">
                      <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest flex items-center gap-1">
                        <ShieldCheck size={12} className="text-[var(--primary)]" />
                        Audit Trail &amp; Access Controls
                      </span>
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-semibold text-zinc-700 dark:text-zinc-300 dark:text-zinc-450">
                        <div>
                          <p>Created By: <span className="font-bold text-zinc-800 dark:text-zinc-250">{coupon.createdBy}</span></p>
                          <p className="mt-1 font-mono">Date: {formatDateTime(coupon.createdAt)}</p>
                        </div>
                        <div>
                          <p>Last Modified By: <span className="font-bold text-zinc-800 dark:text-zinc-250">{coupon.createdBy}</span></p>
                          <p className="mt-1 font-mono">Date: {formatDateTime(coupon.updatedAt)}</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Tab 2: Applicability Tab */}
              {activeTab === 'applicability' && (
                <div className="space-y-6 animate-fade-in text-xs">
                  
                  {/* Scope description */}
                  <div className="p-3 bg-zinc-550/5 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <p className="font-black text-black dark:text-white uppercase text-[10px] tracking-wide">Applicability Scope</p>
                      <p className="text-[10px] text-zinc-500">Cart item filter bounds mapped to coupon application.</p>
                    </div>
                    <span className="px-3 py-1 rounded bg-[var(--primary)]/10 text-[var(--primary)] font-extrabold text-[10px] tracking-wide border border-[var(--primary)]/20 uppercase">
                      On: {coupon.applicableOn}
                    </span>
                  </div>

                  {/* Menu / Catalog Items Applicability */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest block">Catalog Filter</span>
                    
                    {coupon.applicableOn === 'All' && (
                      <p className="p-4 border border-zinc-150 dark:border-zinc-805 bg-white dark:bg-zinc-950 text-zinc-500 italic rounded-lg font-semibold text-center">
                        Global coupon. Applicable to the entire cart value (all products).
                      </p>
                    )}

                    {coupon.applicableOn === 'Category' && (
                      <div className="p-4 border border-zinc-150 dark:border-zinc-805 bg-white dark:bg-zinc-950 rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-zinc-500">Target Categories ({categoryIds.length})</p>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {categoryIds.map(catId => {
                            const catName = categoryMap[catId] || catId;
                            return (
                              <span key={catId} className="px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 text-[10px] font-bold text-zinc-750 dark:text-zinc-300">
                                {catName}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {coupon.applicableOn === 'Product' && (
                      <div className="p-4 border border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-950 rounded-xl space-y-2">
                        <p className="text-[10px] font-black text-zinc-500">Target Products ({productIds.length})</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
                          {productIds.map(prodId => {
                            const prod = productMap[prodId];
                            const prodName = prod?.name || prodId;
                            return (
                              <div key={prodId} className="p-2 border border-zinc-150 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 flex justify-between items-center">
                                <div className="min-w-0">
                                  <p className="font-bold text-zinc-850 dark:text-zinc-200 truncate">{prodName}</p>
                                  <p className="text-[9px] text-zinc-450 font-mono mt-0.5">{prod ? prod.sku : ''}</p>
                                </div>
                                <span className="font-mono font-bold text-zinc-500 shrink-0 text-[10px]">
                                  {prod?.price ? `₹${prod.price}` : ''}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Geolocation applicability */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest block">Geographic Access Scope</span>
                    
                    {regionIds.length === 0 && zoneIds.length === 0 && territoryIds.length === 0 && franchiseIds.length === 0 && storeIds.length === 0 ? (
                      <p className="p-4 border border-zinc-150 dark:border-zinc-805 bg-white dark:bg-zinc-950 text-zinc-500 italic rounded-lg font-semibold text-center">
                        Global campaign. Active across all stores, franchises, and regions.
                      </p>
                    ) : (
                      <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden divide-y divide-zinc-150 dark:divide-zinc-850 bg-white dark:bg-zinc-950 font-semibold">
                        
                        {/* Regions List in drawer */}
                        {regionIds.length > 0 && (
                          <div className="p-3">
                            <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide block mb-1.5">Regions ({regionIds.length})</span>
                            <div className="flex flex-wrap gap-1.5">
                              {regionIds.map(regId => {
                                const regName = regionMap[regId] || regId;
                                return (
                                  <span key={regId} className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded text-[9.5px]">
                                    {regName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Zones */}
                        {zoneIds.length > 0 && (
                          <div className="p-3">
                            <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide block mb-1.5">Zones ({zoneIds.length})</span>
                            <div className="flex flex-wrap gap-1.5">
                              {zoneIds.map(zoneId => {
                                const zoneName = zoneMap[zoneId] || zoneId;
                                return (
                                  <span key={zoneId} className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded text-[9.5px]">
                                    {zoneName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Territories */}
                        {territoryIds.length > 0 && (
                          <div className="p-3">
                            <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide block mb-1.5">Territories ({territoryIds.length})</span>
                            <div className="flex flex-wrap gap-1.5">
                              {territoryIds.map(terrId => {
                                const terrName = territoryMap[terrId] || terrId;
                                return (
                                  <span key={terrId} className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded text-[9.5px]">
                                    {terrName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Franchises */}
                        {franchiseIds.length > 0 && (
                          <div className="p-3">
                            <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide block mb-1.5">Franchises ({franchiseIds.length})</span>
                            <div className="flex flex-wrap gap-1.5">
                              {franchiseIds.map(franId => {
                                const franName = franchiseMap[franId] || franId;
                                return (
                                  <span key={franId} className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 rounded text-[9.5px]">
                                    {franName}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Stores List */}
                        {storeIds.length > 0 && (
                          <div className="p-3">
                            <span className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wide block mb-1.5">Assigned Store Outlets ({storeIds.length})</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[140px] overflow-y-auto pr-1">
                              {storeIds.map(storeId => {
                                const storeName = storeMap[storeId] || storeId;
                                return (
                                  <div key={storeId} className="p-1.5 border border-zinc-150 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 text-[10px] truncate" title={storeName}>
                                    {storeName}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 3: Customer Targeting */}
              {activeTab === 'targeting' && (
                <div className="space-y-6 animate-fade-in text-xs font-semibold">
                  
                  {/* Customer segments */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest block">Segment Filtering</span>
                    {customerSegments.length === 0 ? (
                      <p className="p-4 border border-zinc-150 dark:border-zinc-805 bg-white dark:bg-zinc-950 text-zinc-500 italic rounded-lg text-center">
                        Open coupon. Applicable to all customer categories and tiers.
                      </p>
                    ) : (
                      <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl bg-white dark:bg-zinc-950 flex flex-wrap gap-2">
                        {customerSegments.map(seg => (
                          <span key={seg} className="px-3 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full text-xs font-bold text-zinc-700 dark:text-zinc-350">
                            {seg}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Explicit User lists */}
                  <div className="space-y-3">
                    <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest block">Explicit Customer Exclusions / Inclusions</span>
                    {customerIds.length === 0 ? (
                      <p className="p-4 border border-zinc-150 dark:border-zinc-805 bg-white dark:bg-zinc-950 text-zinc-500 italic rounded-lg text-center">
                        No customer list filters loaded. Access open based on Segment and Regional restrictions.
                      </p>
                    ) : (
                      <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 divide-y divide-zinc-150 dark:divide-zinc-850 max-h-[260px] overflow-y-auto">
                        {customerIds.map(custId => {
                          const cust = mockCustomers.find(c => c.id === custId);
                          return (
                            <div key={custId} className="p-3 flex justify-between items-center hover:bg-zinc-50 dark:hover:bg-zinc-900/50">
                              <div>
                                <p className="font-bold text-zinc-850 dark:text-zinc-200">{cust ? cust.name : custId}</p>
                                <p className="text-[9.5px] text-zinc-500 font-medium font-mono mt-0.5">{cust ? cust.email : ''}</p>
                              </div>
                              <span className="text-[9px] font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-850 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                                {cust ? cust.segment : 'Target Customer'}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 4: Usage Analytics Tab */}
              {activeTab === 'analytics' && (
                <div className="space-y-6 animate-fade-in text-xs">
                  
                  {/* Stat Summary Bento Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl flex flex-col justify-between h-[80px]">
                      <span className="text-[8.5px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest">Total Redemptions</span>
                      <div>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white font-mono">{totalUses}</h4>
                        <span className="text-[8.5px] text-zinc-500">across network</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl flex flex-col justify-between h-[80px]">
                      <span className="text-[8.5px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest">Discount Gifted</span>
                      <div>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white font-mono">₹{totalDiscountGiven.toLocaleString('en-IN')}</h4>
                        <span className="text-[8.5px] text-rose-500">out-of-budget</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl flex flex-col justify-between h-[80px]">
                      <span className="text-[8.5px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest">Revenue Generated</span>
                      <div>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white font-mono">₹{revenueGenerated.toLocaleString('en-IN')}</h4>
                        <span className="text-[8.5px] text-emerald-600 font-bold">ROI Return</span>
                      </div>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl flex flex-col justify-between h-[80px]">
                      <span className="text-[8.5px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest">Average Order Value</span>
                      <div>
                        <h4 className="text-sm font-black text-zinc-900 dark:text-white font-mono">₹{averageOrderValue.toLocaleString('en-IN')}</h4>
                        <span className="text-[8.5px] text-zinc-500">AOV size</span>
                      </div>
                    </div>

                  </div>

                  {/* Top locations and Stores breakdown */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    
                    {/* Top Stores */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-2">
                      <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest block">Top Outlets Redeemed</span>
                      {topStores.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 italic py-4 text-center">No store usage recorded.</p>
                      ) : (
                        <div className="space-y-2 font-semibold pt-1">
                          {topStores.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10.5px]">
                              <span className="text-zinc-700 dark:text-zinc-300 dark:text-zinc-350 truncate max-w-[200px]">{idx + 1}. {item.name.split('Papa Veg Pizza - ')[1] || item.name}</span>
                              <span className="font-mono text-zinc-800 dark:text-white font-bold">{item.count} times</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Top Regions */}
                    <div className="p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-2">
                      <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest block">Top Regions Redeemed</span>
                      {topRegions.length === 0 ? (
                        <p className="text-[10px] text-zinc-400 italic py-4 text-center">No regional usage recorded.</p>
                      ) : (
                        <div className="space-y-2 font-semibold pt-1">
                          {topRegions.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[10.5px]">
                              <span className="text-zinc-700 dark:text-zinc-300 dark:text-zinc-350">{idx + 1}. {item.name}</span>
                              <span className="font-mono text-zinc-800 dark:text-white font-bold">{item.count} times</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                  </div>

                  {/* Recent Redemptions logs ledger */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-zinc-450 dark:text-zinc-555 uppercase tracking-widest block">Recent Redemption Ledger</span>
                    
                    <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-950 min-h-[120px]">
                      <table className="w-full text-left text-[10.5px] divide-y divide-zinc-200 dark:divide-zinc-850">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 text-[9px] font-extrabold uppercase text-zinc-450 tracking-wider">
                          <tr>
                            <th className="px-4 py-2">Customer</th>
                            <th className="px-4 py-2">Order ID</th>
                            <th className="px-4 py-2 text-right">Discount</th>
                            <th className="px-4 py-2">Redeemed At</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-800 dark:text-zinc-200">
                          {usagesLoading ? (
                            [1, 2, 3].map(row => (
                              <tr key={row} className="animate-pulse">
                                <td className="px-4 py-3"><div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></td>
                                <td className="px-4 py-3"><div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                                <td className="px-4 py-3 text-right"><div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-10 ml-auto"></div></td>
                                <td className="px-4 py-3"><div className="h-2.5 bg-zinc-200 dark:bg-zinc-800 rounded w-24"></div></td>
                              </tr>
                            ))
                          ) : usages.length > 0 ? (
                            usages.map((u) => (
                              <tr key={u._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                                <td className="px-4 py-2.5 font-bold text-black dark:text-white">{u.customerName}</td>
                                <td className="px-4 py-2.5 font-mono text-[9.5px] text-zinc-500 dark:text-zinc-450">{u.orderId}</td>
                                <td className="px-4 py-2.5 text-right font-mono font-bold text-rose-500">-₹{u.discountAmount}</td>
                                <td className="px-4 py-2.5 text-[9.5px] text-zinc-450 font-medium whitespace-nowrap">{formatDateTime(u.usedAt)}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="4" className="px-4 py-8 text-center text-zinc-400 italic">No redemptions found for this coupon.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination for inside Drawer */}
                    {usagesTotalCount > 5 && (
                      <div className="flex justify-between items-center py-2 px-1 select-none">
                        <span className="text-[9.5px] text-zinc-500 font-semibold font-mono">Showing {Math.min((usagesPage - 1) * 5 + 1, usagesTotalCount)}-{Math.min(usagesPage * 5, usagesTotalCount)} of {usagesTotalCount} uses</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setUsagesPage(p => Math.max(1, p - 1))}
                            disabled={usagesPage === 1 || usagesLoading}
                            className="p-1.5 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            <ChevronLeft size={13} />
                          </button>
                          <span className="text-zinc-700 dark:text-zinc-300 font-bold px-1.5 pt-1 text-[10px]">{usagesPage} / {usagesTotalPages}</span>
                          <button
                            onClick={() => setUsagesPage(p => Math.min(usagesTotalPages, p + 1))}
                            disabled={usagesPage >= usagesTotalPages || usagesLoading}
                            className="p-1.5 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 disabled:opacity-40 transition-colors cursor-pointer"
                          >
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 flex justify-end shrink-0">
              <button 
                onClick={onClose} 
                className="h-9 px-5 bg-zinc-250 border border-zinc-305 dark:bg-zinc-800 dark:border-zinc-750 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                Close Drawer
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
