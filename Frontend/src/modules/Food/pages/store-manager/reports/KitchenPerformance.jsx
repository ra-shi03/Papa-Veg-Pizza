import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

// Hooks
import { useKitchenPerformance } from "./hooks/useKitchenPerformance";

// Components
import KitchenFilters from "./components/KitchenFilters";
import KitchenMetricsCards from "./components/KitchenMetricsCards";
import PreparationTrendChart from "./components/PreparationTrendChart";
import StationPerformanceChart from "./components/StationPerformanceChart";
import DelayReasonsChart from "./components/DelayReasonsChart";
import KitchenPerformanceTable from "./components/KitchenPerformanceTable";

// Modals
import DayKitchenDetailModal from "./components/DayKitchenDetailModal";
import DelayAnalysisModal from "./components/DelayAnalysisModal";
import WasteAnalysisModal from "./components/WasteAnalysisModal";
import ExportKitchenReportModal from "./components/ExportKitchenReportModal";

export default function KitchenPerformance() {
  const [searchParams] = useSearchParams();

  // Load filter state directly from URL query parameters
  const storeId = searchParams.get("storeId") || localStorage.getItem("store_active_id") || "st-indore-01";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const station = searchParams.get("station") || "All";
  const staffId = searchParams.get("staffId") || "All";
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "date";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const filters = {
    storeId,
    startDate,
    endDate,
    station,
    staffId,
    page,
    limit: 7, // 7 records per page
    search,
    sortBy,
    sortOrder
  };

  // Fetch kitchen reports
  const { data, isLoading, isError, refetch, isRefetching } = useKitchenPerformance(filters);

  // Modal visibility states
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedDelayOrder, setSelectedDelayOrder] = useState(null);
  const [selectedWasteId, setSelectedWasteId] = useState(null);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Kitchen performance logs refreshed!");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Kitchen Performance
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs font-semibold mt-1">
            Monitor preparation efficiency, delays, utilization, shortages, and waste management.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Refresh button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="bg-white hover:bg-neutral-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-full px-4.5 py-2.5 font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={`text-[var(--primary)] ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh Feed</span>
          </button>

          {/* Export Report button */}
          <button
            onClick={() => setExportOpen(true)}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full px-5 py-2.5 font-bold transition-all text-xs flex items-center gap-1.5 shadow-md shadow-[var(--primary)]/10 active:scale-95 cursor-pointer"
          >
            <Download size={13} />
            <span>Export Report</span>
          </button>
        </div>
      </header>

      {/* Filters Console */}
      <section>
        <KitchenFilters />
      </section>

      {/* KPI metrics cards */}
      <section>
        <KitchenMetricsCards data={data?.dashboard} isLoading={isLoading} />
      </section>

      {/* Charts section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 animate-fade-in duration-200">
          <PreparationTrendChart data={data?.preparationTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1 animate-fade-in duration-200">
          <StationPerformanceChart data={data?.stationPerformance} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1 animate-fade-in duration-200">
          <DelayReasonsChart data={data?.delayReasons} isLoading={isLoading} />
        </div>
      </section>

      {/* Kitchen Performance table ledger */}
      <section>
        <KitchenPerformanceTable
          data={data?.kitchenPerformance || []}
          pagination={data?.pagination}
          isLoading={isLoading}
          onViewDayDetails={(date) => setSelectedDate(date)}
          onViewDelayAnalysis={(orderId) => setSelectedDelayOrder(orderId)}
          onViewWasteAnalysis={(wasteId) => setSelectedWasteId(wasteId)}
        />
      </section>

      {/* Modals */}
      <ExportKitchenReportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        storeId={storeId}
      />

      <DayKitchenDetailModal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
      />

      <DelayAnalysisModal
        isOpen={!!selectedDelayOrder}
        onClose={() => setSelectedDelayOrder(null)}
        orderId={selectedDelayOrder}
      />

      <WasteAnalysisModal
        isOpen={!!selectedWasteId}
        onClose={() => setSelectedWasteId(null)}
        wasteId={selectedWasteId}
      />

    </div>
  );
}
