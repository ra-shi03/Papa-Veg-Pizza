import React, { useState } from 'react';
import { Clock, RefreshCw, Sparkles, Activity } from 'lucide-react';
import { toast } from 'sonner';

import CustomerFilterBar from './components/CustomerFilterBar';
import CustomerKpiCards from './components/CustomerKpiCards';
import CustomerCharts from './components/CustomerCharts';
import TopCustomersTable from './components/TopCustomersTable';
import CustomerTable from './components/CustomerTable';
import CustomerDetailsModal from './components/CustomerDetailsModal';
import CustomerExportModal from './components/CustomerExportModal';
import LoyaltyAnalytics from './LoyaltyAnalytics';

import { useCustomerStats, useTopCustomers } from './hooks/useCustomerQuery';

export default function CustomerAnalytics() {
  // Master Filters State
  const [filters, setFilters] = useState({
    dateRange: 'Last 30 Days',
    startDate: '',
    endDate: '',
    location: '',
    ageGroup: '',
    gender: '',
    customerType: '',
    loyaltyTier: '',
    search: ''
  });

  const [appliedFilters, setAppliedFilters] = useState({ ...filters });

  // View state: 'customer' or 'loyalty'
  const [activeView, setActiveView] = useState('customer');

  // Modal Dialog states
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Stats & Top Customers hooks (fetch based on applied filters)
  const { data: stats, loading: statsLoading, refetch: refetchStats } = useCustomerStats(appliedFilters);
  const { data: topCustomers, loading: topCustomersLoading, refetch: refetchTop } = useTopCustomers(appliedFilters);

  // Sync refresh trigger
  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    toast.success('Customer intelligence database synchronized');
  };

  const handleResetFilters = () => {
    const freshFilters = {
      dateRange: 'Last 30 Days',
      startDate: '',
      endDate: '',
      location: '',
      ageGroup: '',
      gender: '',
      customerType: '',
      loyaltyTier: '',
      search: ''
    };
    setFilters(freshFilters);
    setAppliedFilters(freshFilters);
    toast.success('Customer filter attributes reset');
  };

  const handleViewDetails = (id) => {
    setSelectedCustomerId(id);
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4 animate-fade-in text-zinc-900 dark:text-zinc-100">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <span>Customer Insights & Retention</span>
            <span className="animate-pulse bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20">
              Live Feed
            </span>
          </h2>
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
            <Clock size={11} />
            Database updated 2m ago
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              refetchStats();
              refetchTop();
              toast.success('Reloaded latest customer intelligence metrics');
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-black/70 dark:text-white/70 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
            title="Reload metrics"
          >
            <RefreshCw size={14} className={statsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex border-b border-zinc-200 dark:border-zinc-800 gap-2">
        <button
          onClick={() => setActiveView('customer')}
          className={`py-1.5 px-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeView === 'customer'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
          }`}
        >
          Customer Overview
        </button>
        <button
          onClick={() => setActiveView('loyalty')}
          className={`py-1.5 px-3 font-bold text-xs uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
            activeView === 'loyalty'
              ? 'border-[var(--primary)] text-[var(--primary)]'
              : 'border-transparent text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white'
          }`}
        >
          Loyalty Program
        </button>
      </div>

      {activeView === 'customer' ? (
        <div className="space-y-4">
          {/* 1. Primary metrics KPI grid */}
          <CustomerKpiCards stats={stats} loading={statsLoading} />

          {/* 2. Executive AI Insight Card */}
          <div className="p-3.5 bg-zinc-950 dark:bg-black text-white rounded-xl border border-zinc-800 overflow-hidden relative shadow-md">
            <div className="relative z-10">
              <div className="flex items-center gap-1.5 mb-1.5 text-[var(--primary)]">
                <Sparkles size={14} className="fill-current" />
                <span className="text-[9px] font-black uppercase tracking-wider">Executive Loyalty Insight</span>
              </div>
              <p className="text-xs md:text-sm font-semibold leading-relaxed text-zinc-200">
                VIP Platinum & Gold customers represent <span className="font-black text-emerald-400">25%</span> of your total base but contribute <span className="font-black text-emerald-400">73.9%</span> of total order revenue this quarter. Focus marketing campaigns on active customer cohort retention.
              </p>
            </div>
            <div className="absolute right-0 top-0 w-36 h-36 opacity-[0.03] translate-x-1/4 -translate-y-1/4">
              <Activity size={120} />
            </div>
            <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-[var(--primary)] rounded-full blur-[80px] opacity-20 pointer-events-none"></div>
          </div>

          {/* 3. Composition & Trend Charts */}
          <CustomerCharts filters={appliedFilters} />

          {/* 4. Top VIP Spenders Ranking Table */}
          <TopCustomersTable
            data={topCustomers}
            loading={topCustomersLoading}
            onViewDetails={handleViewDetails}
          />

          {/* 5. Sticky filter container directly above main customer directory table */}
          <CustomerFilterBar
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            onExport={() => setIsExportOpen(true)}
          />

          {/* 6. Main directory database table (has search bar debounced by 600ms) */}
          <CustomerTable
            filters={filters}
            setFilters={setFilters}
            onViewDetails={handleViewDetails}
          />
        </div>
      ) : (
        <LoyaltyAnalytics onViewDetails={handleViewDetails} />
      )}

      {/* MODAL DIALOG WINDOWS */}
      {/* 1400px wide Drill-down Details Modal */}
      <CustomerDetailsModal
        isOpen={!!selectedCustomerId}
        onClose={() => setSelectedCustomerId(null)}
        customerId={selectedCustomerId}
      />

      {/* Reports parameter exporter modal */}
      <CustomerExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />
    </div>
  );
}
