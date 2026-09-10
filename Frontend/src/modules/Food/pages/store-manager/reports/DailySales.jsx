import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Download, Calendar, Activity } from "lucide-react";
import { toast } from "sonner";

// Hooks
import { useDailySales } from "./hooks/useDailySales";

// Components
import SalesFilters from "./components/SalesFilters";
import RevenueCards from "./components/RevenueCards";
import RevenueTrendChart from "./components/RevenueTrendChart";
import PaymentDistributionChart from "./components/PaymentDistributionChart";
import OrderStatusChart from "./components/OrderStatusChart";
import SalesSummaryTable from "./components/SalesSummaryTable";
import DayDetailsModal from "./components/DayDetailsModal";
import ExportSalesModal from "./components/ExportSalesModal";

export default function DailySales() {
  const [searchParams] = useSearchParams();

  // Load filter state directly from URL query parameters
  const storeId = searchParams.get("storeId") || localStorage.getItem("store_active_id") || "st-indore-01";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const paymentMethod = searchParams.get("paymentMethod") || "All";
  const orderType = searchParams.get("orderType") || "All";

  const filters = {
    storeId,
    startDate,
    endDate,
    paymentMethod,
    orderType,
  };

  // Fetch sales records
  const { data, isLoading, isError, refetch, isRefetching } = useDailySales(filters);

  // Modal States
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedDetailsDate, setSelectedDetailsDate] = useState(null);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Sales data refreshed successfully!");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Daily Sales
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs font-semibold mt-1">
            Monitor revenue, orders, payments, and business performance.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Refresh Button - Secondary */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="bg-white hover:bg-neutral-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-full px-4.5 py-2.5 font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={`text-[var(--primary)] ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh Feed</span>
          </button>

          {/* Export Report Button - Primary */}
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
        <SalesFilters />
      </section>

      {/* Dashboard KPI Bento Cards */}
      <section>
        <RevenueCards data={data} isLoading={isLoading} />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <PaymentDistributionChart data={data?.paymentDistribution} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <OrderStatusChart data={data?.orderStatusDistribution} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <RevenueTrendChart data={data?.revenueTrend} isLoading={isLoading} />
        </div>
      </section>

      {/* Sales Summary Table */}
      <section>
        <SalesSummaryTable
          data={data?.salesSummary || []}
          isLoading={isLoading}
          onViewDetails={(date) => setSelectedDetailsDate(date)}
        />
      </section>

      {/* Modals */}
      <ExportSalesModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        storeId={storeId}
      />

      <DayDetailsModal
        isOpen={!!selectedDetailsDate}
        onClose={() => setSelectedDetailsDate(null)}
        date={selectedDetailsDate}
      />

    </div>
  );
}
