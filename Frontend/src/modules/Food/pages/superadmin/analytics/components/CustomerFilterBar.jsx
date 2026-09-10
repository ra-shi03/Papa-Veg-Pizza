import React from 'react';
import { Filter, Calendar, MapPin, Download, RefreshCw } from 'lucide-react';
import { useLocations } from '../hooks/useCustomerQuery';

export default function CustomerFilterBar({ filters, setFilters, onApply, onReset, onExport }) {
  const { data: locations, loading: loadingLocations } = useLocations();

  const handleSelectChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="sticky top-[48px] z-30 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border border-zinc-200 dark:border-zinc-800 rounded-xl p-2.5 shadow-sm space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Range Selector */}
        <div className="flex items-center gap-1 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <Calendar size={12} className="text-[var(--primary)]" />
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            value={filters.dateRange || 'Last 30 Days'}
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

        {/* Location Dropdown */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <MapPin size={11} className="text-zinc-400" />
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0 max-w-[120px] truncate"
            value={filters.location || ''}
            onChange={(e) => handleSelectChange('location', e.target.value)}
          >
            <option value="">All Locations</option>
            {!loadingLocations &&
              locations?.map((loc) => (
                <option key={loc.id} value={loc.name}>
                  {loc.name}
                </option>
              ))}
          </select>
        </div>

        {/* Age Group */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            value={filters.ageGroup || ''}
            onChange={(e) => handleSelectChange('ageGroup', e.target.value)}
          >
            <option value="">All Age Groups</option>
            <option value="18-24">18-24</option>
            <option value="25-34">25-34</option>
            <option value="35-44">35-44</option>
            <option value="45-54">45-54</option>
            <option value="55+">55+</option>
          </select>
        </div>

        {/* Gender */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            value={filters.gender || ''}
            onChange={(e) => handleSelectChange('gender', e.target.value)}
          >
            <option value="">All Genders</option>
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Other">Other</option>
          </select>
        </div>

        {/* Customer Type / Status */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            value={filters.customerType || ''}
            onChange={(e) => handleSelectChange('customerType', e.target.value)}
          >
            <option value="">All Customer Types</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {/* Loyalty Tier */}
        <div className="flex items-center gap-1 bg-white dark:bg-zinc-955 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-black/70 dark:text-white/70">
          <select
            className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            value={filters.loyaltyTier || ''}
            onChange={(e) => handleSelectChange('loyaltyTier', e.target.value)}
          >
            <option value="">All Tiers</option>
            <option value="Bronze">Bronze</option>
            <option value="Silver">Silver</option>
            <option value="Gold">Gold</option>
            <option value="Platinum">Platinum</option>
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
          <span>Export Customers</span>
        </button>
      </div>
    </div>
  );
}
