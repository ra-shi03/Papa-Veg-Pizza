import React from 'react';
import { Filter, Calendar, MapPin, RefreshCw, Download, ChevronDown } from 'lucide-react';
import {
  useRegions,
  useZones,
  useTerritories,
  useFranchises,
  useStores
} from '../hooks/useSalesQuery';

export default function FilterBar({ filters, setFilters, onApply, onReset, onExport }) {
  const { data: regions } = useRegions();
  const { data: zones } = useZones(filters.regionId);
  const { data: territories } = useTerritories(filters.zoneId);
  const { data: franchises } = useFranchises();
  const { data: stores } = useStores();

  const handleSelectChange = (key, value) => {
    const updatedFilters = { ...filters, [key]: value };
    // Cascading resets
    if (key === 'regionId') {
      updatedFilters.zoneId = '';
      updatedFilters.territoryId = '';
    } else if (key === 'zoneId') {
      updatedFilters.territoryId = '';
    }
    setFilters(updatedFilters);
  };

  return (
    <div className="sticky top-[48px] z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 shadow-sm space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Selector */}
        <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <Calendar size={12} className="text-[var(--primary)]" />
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            value={filters.dateRange}
            onChange={(e) => handleSelectChange('dateRange', e.target.value)}
          >
            <option value="Today">Today</option>
            <option value="Yesterday">Yesterday</option>
            <option value="Last 7 Days">Last 7 Days</option>
            <option value="Last 30 Days">Last 30 Days</option>
            <option value="Custom">Custom Range</option>
          </select>
        </div>

        {/* Custom Date Inputs if Custom selected */}
        {filters.dateRange === 'Custom' && (
          <div className="flex items-center gap-1 animate-fade-down">
            <input
              type="date"
              className="bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70 outline-none"
              value={filters.startDate || ''}
              onChange={(e) => handleSelectChange('startDate', e.target.value)}
            />
            <span className="text-xs text-zinc-400 font-bold">-</span>
            <input
              type="date"
              className="bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70 outline-none"
              value={filters.endDate || ''}
              onChange={(e) => handleSelectChange('endDate', e.target.value)}
            />
          </div>
        )}

        {/* Regions Dropdown */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <MapPin size={11} className="text-zinc-400" />
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[110px] truncate"
            value={filters.regionId}
            onChange={(e) => handleSelectChange('regionId', e.target.value)}
          >
            <option value="">All Regions</option>
            {regions.map((reg) => (
              <option key={reg.id} value={reg.id}>{reg.name}</option>
            ))}
          </select>
        </div>

        {/* Zones Dropdown (Cascading) */}
        {filters.regionId && (
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70 animate-fade-down">
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[110px] truncate"
              value={filters.zoneId}
              onChange={(e) => handleSelectChange('zoneId', e.target.value)}
            >
              <option value="">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Territories Dropdown (Cascading) */}
        {filters.zoneId && (
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70 animate-fade-down">
            <select
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[120px] truncate"
              value={filters.territoryId}
              onChange={(e) => handleSelectChange('territoryId', e.target.value)}
            >
              <option value="">All Territories</option>
              {territories.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Franchise Dropdown */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[110px] truncate"
            value={filters.franchiseId}
            onChange={(e) => handleSelectChange('franchiseId', e.target.value)}
          >
            <option value="">All Franchises</option>
            {franchises.map((fran) => (
              <option key={fran.id} value={fran.id}>{fran.name}</option>
            ))}
          </select>
        </div>

        {/* Store Dropdown */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[130px] truncate"
            value={filters.storeId}
            onChange={(e) => handleSelectChange('storeId', e.target.value)}
          >
            <option value="">All Stores</option>
            {stores
              .filter(store => !filters.franchiseId || store.franchiseId === filters.franchiseId)
              .map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
          </select>
        </div>

        {/* Order Type */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            value={filters.orderType}
            onChange={(e) => handleSelectChange('orderType', e.target.value)}
          >
            <option value="">All Order Types</option>
            <option value="Delivery">Delivery</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Dine-In">Dine-In</option>
          </select>
        </div>

        {/* Payment Method */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            value={filters.paymentMethod}
            onChange={(e) => handleSelectChange('paymentMethod', e.target.value)}
          >
            <option value="">All Payments</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Wallet">Wallet</option>
            <option value="COD">COD</option>
          </select>
        </div>

        {/* Product Category */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            value={filters.category}
            onChange={(e) => handleSelectChange('category', e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="Pizza">Pizza</option>
            <option value="Beverages">Beverages</option>
            <option value="Desserts">Desserts</option>
            <option value="Combos">Combos</option>
          </select>
        </div>
      </div>

      {/* Buttons Row */}
      <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 pt-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            className="px-3.5 py-1 text-black/70 dark:text-white/70 hover:text-black dark:hover:text-white font-bold text-xs bg-zinc-100 dark:bg-zinc-800 rounded-lg transition-colors border border-zinc-250 dark:border-zinc-700 cursor-pointer"
          >
            Reset
          </button>
          <button
            onClick={onApply}
            className="px-4 py-1 bg-[var(--primary)] text-white rounded-lg font-bold text-xs hover:opacity-90 transition-opacity shadow-md flex items-center gap-1 cursor-pointer"
          >
            <Filter size={12} />
            Apply Filters
          </button>
        </div>

        <button
          onClick={onExport}
          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-950 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg transition-colors shadow-md text-xs font-bold cursor-pointer border border-zinc-800"
        >
          <Download size={12} />
          <span>Export Report</span>
        </button>
      </div>
    </div>
  );
}
