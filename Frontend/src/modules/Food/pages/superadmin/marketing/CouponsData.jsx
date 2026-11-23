import React, { useState, useEffect, useMemo } from 'react';
import { Edit, Eye, Trash2, CheckCircle2, AlertCircle, Ban } from 'lucide-react';
import { adminClient } from '../../../../../services/api/axios';

// ==========================================
// 1. DATA MODELS & DATASETS (MongoDB )
// ==========================================

export const regionOptions = [];
export const zoneOptions = [];
export const territoryOptions = [];
export const franchiseOptions = [];
export const storeOptions = [];
export const categoryOptions = [];
export const productOptions = [];
export const customerOptions = [];
export const seedCoupons = [];
export const couponUsageSeed = [];

// ==========================================
// 2. Coupon actions (server: /settings/coupons)
// ==========================================

export const getStoredCoupons = () => {
  try {
    const data = localStorage.getItem('pvp_coupons');
    if (!data) {
      localStorage.setItem('pvp_coupons', JSON.stringify(seedCoupons));
      return seedCoupons;
    }
    const parsed = JSON.parse(data);
    // If cache has stale codes or non-zero usages, reset to clean seed
    const hasStale = Array.isArray(parsed) && parsed.some(c => c.code === 'PIZZA50' || c.code === 'TESTDISABLE' || c._id?.startsWith('c-65e') || c.usageCount && c.usageCount > 0);
    if (hasStale || !Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem('pvp_coupons', JSON.stringify(seedCoupons));
      return seedCoupons;
    }
    return parsed;
  } catch (e) {
    return seedCoupons;
  }
};
export const saveStoredCoupons = data => {
  localStorage.setItem('pvp_coupons', JSON.stringify(data));
  window.dispatchEvent(new Event("pvp_coupons_changed"));
};

// Simulated in-memory database

// Helper to calculate usage statistics
export const getAggregateStats = couponsList => {
  const coupons = couponsList && couponsList.length > 0 ? couponsList : getStoredCoupons();
  const activeCount = coupons.filter(c => (c.status === 'active' || c.isActive) && new Date(c.endDate) > new Date()).length;
  const expiredCount = coupons.filter(c => c.status === 'expired' || new Date(c.endDate) <= new Date()).length;
  const disabledCount = coupons.filter(c => c.status === 'disabled' || c.isActive === false).length;
  const totalUsages = coupons.reduce((sum, c) => sum + (c.usageCount || 0), 0);
  const totalDiscountGiven = coupons.reduce((sum, c) => sum + (c.usageCount || 0) * (c.value || c.discountValue || 0), 0);
  const totalRevenueGenerated = coupons.reduce((sum, c) => sum + (c.revenueGenerated || 0), 0);
  const averageDiscount = totalUsages > 0 ? Math.round(totalDiscountGiven / totalUsages) : 0;
  return {
    activeCoupons: activeCount,
    expiredCoupons: expiredCount,
    totalRedemptions: totalUsages,
    revenueGenerated: totalRevenueGenerated,
    averageDiscount: averageDiscount,
    disabledCoupons: disabledCount
  };
};
export const api = {
  getCoupons: async (filters = {}, sorting = {}, pagination = {
    page: 1,
    pageSize: 10
  }) => {
    try {
      const res = await adminClient.get('/settings/coupons');
      let items = res.data?.data || [];
      const processed = items.map(c => {
        const isExpired = new Date(c.endDate) < new Date();
        const usageCount = c.usageCount || 0;
        const revenueGenerated = c.revenueGenerated || 0;
        return {
          ...c,
          usageCount,
          revenueGenerated,
          status: !c.isActive ? 'disabled' : isExpired ? 'expired' : c.status || 'active'
        };
      });

      // Update localStorage cache
      localStorage.setItem('pvp_coupons', JSON.stringify(processed));
      return {
        data: processed,
        totalCount: processed.length,
        totalPages: Math.max(1, Math.ceil(processed.length / (pagination?.pageSize || 10)))
      };
    } catch (e) {
      console.warn("Falling back to cached coupons:", e);
      const local = getStoredCoupons();
      return {
        data: local,
        totalCount: local.length,
        totalPages: Math.max(1, Math.ceil(local.length / (pagination?.pageSize || 10)))
      };
    }
  },
  getCouponAnalytics: async () => {
    try {
      const res = await adminClient.get('/settings/coupons/analytics');
      return res.data?.data || res.data;
    } catch (e) {
      console.warn("Analytics API fallback:", e);
      const coupons = getStoredCoupons();
      const stats = getAggregateStats(coupons);
      return {
        totalUses: stats.totalRedemptions,
        revenue: stats.revenueGenerated,
        discountGiven: 0,
        aov: 0,
        activeCoupons: stats.activeCoupons,
        expiredCoupons: stats.expiredCoupons,
        disabledCoupons: stats.disabledCoupons,
        dailyUsage: [],
        recentUsageHistory: []
      };
    }
  },
  getCouponById: async id => {
    const res = await adminClient.get(`/settings/coupons/${id}`);
    return res.data.data;
  },
  createCoupon: async payload => {
    const res = await adminClient.post('/settings/coupons', payload);
    return res.data.data;
  },
  updateCoupon: async (id, payload) => {
    const res = await adminClient.put(`/settings/coupons/${id}`, payload);
    return res.data.data;
  },
  deleteCoupon: async id => {
    await adminClient.delete(`/settings/coupons/${id}`);
    return true;
  },
  toggleCouponStatus: async (id, isActive) => {
    const res = await adminClient.put(`/settings/coupons/${id}`, {
      isActive
    });
    return res.data.data;
  }
};

// Removed ledger logic

// ==========================================
// ==========================================
// 3. DEBOUNCE HOOK & COMPATIBILITY VIEWS
// ==========================================

export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// Card View List component for backward-compatibility & alternate view toggles
export const CouponList = ({
  filters,
  coupons = [],
  onEdit,
  onView,
  onClone,
  onDisable,
  onDelete
}) => {
  return <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {coupons.map(coupon => <div key={coupon._id} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col gap-3.5 hover:shadow-md transition-shadow relative overflow-hidden group">
          {/* Status strip */}
          <div className={`absolute top-0 left-0 w-1.5 h-full ${coupon.status === 'active' ? 'bg-emerald-500' : coupon.status === 'disabled' ? 'bg-zinc-400' : 'bg-rose-500'}`}></div>
          
          <div className="flex items-start justify-between pl-1">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold tracking-wide border bg-zinc-550/10 text-zinc-850 dark:text-zinc-300 dark:bg-zinc-800 border-zinc-350 dark:border-zinc-700 uppercase">
                  {coupon.code}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase ${coupon.status === 'active' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' : coupon.status === 'disabled' ? 'bg-zinc-150 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-455'}`}>
                  {coupon.status}
                </span>
              </div>
              <h3 className="text-xs font-black mt-2 text-black dark:text-white leading-tight">{coupon.title}</h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{coupon.description}</p>
            </div>
            
            <div className="flex items-center gap-0.5 shrink-0 opacity-80 group-hover:opacity-100">
              <button onClick={() => onView && onView(coupon)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer" title="View Details">
                <Eye size={13} />
              </button>
              <button onClick={() => onEdit && onEdit(coupon)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-zinc-500 hover:text-black dark:hover:text-white transition-colors cursor-pointer" title="Edit Coupon">
                <Edit size={13} />
              </button>
              <button onClick={() => onDelete && onDelete(coupon)} className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-855 rounded text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors cursor-pointer" title="Delete Coupon">
                <Trash2 size={13} />
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 border-t border-zinc-150 dark:border-zinc-800 pt-3 mt-1 pl-1">
            <div>
              <p className="text-[8.5px] text-zinc-450 dark:text-zinc-550 uppercase font-black tracking-widest">Redemptions</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 bg-zinc-100 dark:bg-zinc-800 rounded-full h-1 overflow-hidden">
                  <div className={`${coupon.status === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'} h-full transition-all`} style={{
                width: `${Math.min(100, (coupon.usageCount || 0) / coupon.usageLimit * 100)}%`
              }}></div>
                </div>
                <span className="text-[9.5px] font-bold text-zinc-700 dark:text-zinc-400 font-mono">
                  {coupon.usageCount}/{coupon.usageLimit}
                </span>
              </div>
            </div>
            <div>
              <p className="text-[8.5px] text-zinc-450 dark:text-zinc-555 uppercase font-black tracking-widest">Type / Value</p>
              <p className="text-[10px] font-extrabold mt-1 text-zinc-800 dark:text-zinc-350">
                {coupon.couponType === 'Percentage' ? `${coupon.value}% Discount` : coupon.couponType === 'Flat Amount' ? `₹${coupon.value} Off` : coupon.couponType === 'Buy One Get One' ? 'BOGO Offer' : 'Free Product'}
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] text-zinc-450 dark:text-zinc-500 pl-1">
            <span>By: {coupon.createdBy.split(' ')[0]}</span>
            <span className="font-mono">Expires: {new Date(coupon.endDate).toLocaleDateString('en-IN', {
            month: 'short',
            day: 'numeric'
          })}</span>
          </div>
        </div>)}
      
      {coupons.length === 0 && <div className="col-span-full py-12 text-center text-zinc-400 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold">
            <Ban size={28} className="mx-auto text-zinc-300 mb-2" />
            No coupons match your filters.
         </div>}
    </div>;
};
