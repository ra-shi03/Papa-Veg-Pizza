import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

// Hooks
import { useStorePerformance } from "./hooks/useStorePerformance";

// Components
import StoreFilters from "./components/StoreFilters";
import StoreMetricsCards from "./components/StoreMetricsCards";
import RevenueExpensesChart from "./components/RevenueExpensesChart";
import ProfitTrendChart from "./components/ProfitTrendChart";
import CustomerRatingsChart from "./components/CustomerRatingsChart";
import WasteAnalysisChart from "./components/WasteAnalysisChart";
import StorePerformanceTable from "./components/StorePerformanceTable";

// Modals
import MonthlyStoreDetailModal from "./components/MonthlyStoreDetailModal";
import RevenueBreakdownModal from "./components/RevenueBreakdownModal";
import ExpenseBreakdownModal from "./components/ExpenseBreakdownModal";
import ExportStoreReportModal from "./components/ExportStoreReportModal";

export default function StorePerformance() {
  const [searchParams] = useSearchParams();

  // Load filter state directly from URL query parameters
  const storeId = searchParams.get("storeId") || localStorage.getItem("store_active_id") || "st-indore-01";
  const period = searchParams.get("period") || "monthly";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const page = Number(searchParams.get("page")) || 1;

  const filters = {
    storeId,
    period,
    startDate,
    endDate,
    page,
    limit: 10,
  };

  // Fetch store performance
  const { data, isLoading, isError, refetch, isRefetching } = useStorePerformance(filters);

  // Modal States
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedDetailsMonth, setSelectedDetailsMonth] = useState(null);
  const [selectedRevenueMonth, setSelectedRevenueMonth] = useState(null);
  const [selectedExpenseMonth, setSelectedExpenseMonth] = useState(null);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Store performance metrics refreshed successfully!");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Store Performance Report
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs font-semibold mt-1">
            Monitor revenue, profit, customer satisfaction, waste, and operational growth.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Refresh Feed */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="bg-white hover:bg-neutral-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-full px-4.5 py-2.5 font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={`text-[var(--primary)] ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh Feed</span>
          </button>

          {/* Export Report */}
          <button
            onClick={() => setExportOpen(true)}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full px-5 py-2.5 font-bold transition-all text-xs flex items-center gap-1.5 shadow-md shadow-[var(--primary)]/10 active:scale-95 cursor-pointer"
          >
            <Download size={13} />
            <span>Export Report</span>
          </button>
        </div>
      </header>

      {/* Filters Section */}
      <section>
        <StoreFilters />
      </section>

      {/* KPI Cards Section */}
      <section>
        <StoreMetricsCards data={data} isLoading={isLoading} />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <RevenueExpensesChart data={data?.revenueVsExpenses} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <ProfitTrendChart data={data?.profitTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <CustomerRatingsChart data={data?.customerRatings} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <WasteAnalysisChart data={data?.wasteAnalysis} isLoading={isLoading} />
        </div>
      </section>

      {/* Table Section */}
      <section>
        <StorePerformanceTable
          data={data?.storePerformance || []}
          isLoading={isLoading}
          onViewDetails={(m) => setSelectedDetailsMonth(m)}
          onViewRevenueBreakdown={(m) => setSelectedRevenueMonth(m)}
          onViewExpenseBreakdown={(m) => setSelectedExpenseMonth(m)}
        />
      </section>

      {/* Modals */}
      <ExportStoreReportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        storeId={storeId}
      />

      <MonthlyStoreDetailModal
        isOpen={!!selectedDetailsMonth}
        onClose={() => setSelectedDetailsMonth(null)}
        month={selectedDetailsMonth}
      />

      <RevenueBreakdownModal
        isOpen={!!selectedRevenueMonth}
        onClose={() => setSelectedRevenueMonth(null)}
        month={selectedRevenueMonth}
      />

      <ExpenseBreakdownModal
        isOpen={!!selectedExpenseMonth}
        onClose={() => setSelectedExpenseMonth(null)}
        month={selectedExpenseMonth}
      />

    </div>
  );
}
