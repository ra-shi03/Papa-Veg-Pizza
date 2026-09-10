import React, { useState } from 'react';
import { History, RefreshCw, Undo2 } from 'lucide-react';
import { toast } from 'sonner';

import FilterBar from './components/FilterBar';
import KpiCards from './components/KpiCards';
import ChartsSection from './components/ChartsSection';
import HeatmapAndProducts from './components/HeatmapAndProducts';
import SalesTable from './components/SalesTable';
import DetailsModal from './components/DetailsModal';
import ExportModal from './components/ExportModal';

import { useSalesStats } from './hooks/useSalesQuery';

export default function SalesAnalytics() {
  // Master Filters State
  const [filters, setFilters] = useState({
    dateRange: 'Last 30 Days',
    startDate: '',
    endDate: '',
    regionId: '',
    zoneId: '',
    territoryId: '',
    franchiseId: '',
    storeId: '',
    orderType: '',
    paymentMethod: '',
    category: '',
    search: ''
  });

  // Modal Dialog states
  const [selectedRowId, setSelectedRowId] = useState(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Hook for stats summary (handles verifyConnection and offline fallback)
  const { data: stats, loading: statsLoading, error: statsError, refetch } = useSalesStats(filters);

  // Manual Trigger to re-fetch/refresh data
  const handleApplyFilters = () => {
    refetch();
    toast.success('Sales metrics synchronized with live POS data');
  };

  const handleResetFilters = () => {
    setFilters({
      dateRange: 'Last 30 Days',
      startDate: '',
      endDate: '',
      regionId: '',
      zoneId: '',
      territoryId: '',
      franchiseId: '',
      storeId: '',
      orderType: '',
      paymentMethod: '',
      category: '',
      search: ''
    });
    toast.success('Sales filters reset successfully');
  };

  return (
    <div className="p-3 md:p-4 pb-12 max-w-7xl mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4 animate-fade-in text-zinc-900 dark:text-zinc-100">
      
      {/* 1. Header Actions */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-lg font-bold text-black dark:text-white flex items-center gap-2">
            <span>Sales Analytics & Reports</span>
            <span className="animate-pulse bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20">
              Live Feed
            </span>
          </h2>
          <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mt-0.5">
            <History size={11} />
            POS ledger updated just now
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleApplyFilters}
            className="p-1.5 border border-zinc-250 dark:border-zinc-805 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-400 transition-colors cursor-pointer"
            title="Reload compliance data"
          >
            <RefreshCw size={13} className={statsLoading ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* 3. Error Handling / Retry Boundary */}
      {statsError ? (
        <div className="p-8 border-2 border-dashed border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/5 text-center rounded-2xl space-y-3">
          <div className="flex items-center justify-center text-rose-600">
            <Undo2 size={24} className="animate-bounce" />
          </div>
          <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Failed to establish connection with POS database channel.</p>
          <button
            onClick={handleApplyFilters}
            className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-bold rounded-lg hover:opacity-90 active:scale-95 shadow cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* 2. KPI Section Component (Moved here) */}
          <KpiCards stats={stats} loading={statsLoading} />

          {/* 3. Trend Line and Pie/Bar Charts Component */}
          <ChartsSection filters={filters} />

          {/* 4. Hourly Heatmap, Product progress, and Stacked Tax Chart */}
          <HeatmapAndProducts filters={filters} />

          {/* 5. Sticky Filter Bar Component (Moved above table) */}
          <FilterBar
            filters={filters}
            setFilters={setFilters}
            onApply={handleApplyFilters}
            onReset={handleResetFilters}
            onExport={() => setIsExportOpen(true)}
          />

          {/* 6. Paginated Sales log Table */}
          <SalesTable
            filters={filters}
            setFilters={setFilters}
            onViewDetails={(id) => setSelectedRowId(id)}
          />

        </div>
      )}

      {/* 8. MODAL WINDOWS */}
      {/* Detail audits modal (1200px wide) */}
      <DetailsModal
        isOpen={!!selectedRowId}
        onClose={() => setSelectedRowId(null)}
        rowId={selectedRowId}
      />

      {/* Reports parameter exporter modal */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

    </div>
  );
}
