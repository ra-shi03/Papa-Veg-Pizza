import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

// Hooks
import { useOrderReports } from "./hooks/useOrderReports";

// Components
import OrderFilters from "./components/OrderFilters";
import OrderMetricsCards from "./components/OrderMetricsCards";
import OrdersStatusChart from "./components/OrdersStatusChart";
import PeakHoursChart from "./components/PeakHoursChart";
import OrderTypeChart from "./components/OrderTypeChart";
import OrderAnalyticsTable from "./components/OrderAnalyticsTable";
import OrderDetailModal from "./components/OrderDetailModal";
import RefundDetailsModal from "./components/RefundDetailsModal";
import ExportOrdersModal from "./components/ExportOrdersModal";

export default function OrderReports() {
  const [searchParams] = useSearchParams();

  // Load filter state directly from URL query parameters
  const storeId = searchParams.get("storeId") || localStorage.getItem("store_active_id") || "st-indore-01";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const status = searchParams.get("status") || "All";
  const paymentMethod = searchParams.get("paymentMethod") || "All";
  const orderType = searchParams.get("orderType") || "All";
  const couponUsed = searchParams.get("couponUsed") || "All";
  const search = searchParams.get("search") || "";
  const page = searchParams.get("page") || "1";
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const filters = {
    storeId,
    startDate,
    endDate,
    status,
    paymentMethod,
    orderType,
    couponUsed,
    search,
    page,
    limit: 10,
    sortBy,
    sortOrder
  };

  // Fetch order reports data
  const { data, isLoading, isError, refetch, isRefetching } = useOrderReports(filters);

  // Modal States
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedDetailsId, setSelectedDetailsId] = useState(null);
  const [selectedRefundId, setSelectedRefundId] = useState(null);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Order metrics refreshed successfully!");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Order Reports
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs font-semibold mt-1">
            Deep analytics for orders, refunds, coupons, preparation, and delivery performance.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={isLoading || isRefetching}
            className="bg-white hover:bg-neutral-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-800 rounded-full px-4.5 py-2.5 font-bold transition-all text-xs flex items-center gap-1.5 shadow-sm active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={`text-[var(--primary)] ${isRefetching ? "animate-spin" : ""}`} />
            <span>Refresh Analytics</span>
          </button>

          {/* Export Orders Button */}
          <button
            onClick={() => setExportOpen(true)}
            className="bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-full px-5 py-2.5 font-bold transition-all text-xs flex items-center gap-1.5 shadow-md shadow-[var(--primary)]/10 active:scale-95 cursor-pointer"
          >
            <Download size={13} />
            <span>Export Orders</span>
          </button>
        </div>
      </header>

      {/* Filters Section */}
      <section>
        <OrderFilters />
      </section>

      {/* Dashboard Metrics KPI Grid */}
      <section>
        <OrderMetricsCards data={data?.dashboard} isLoading={isLoading} />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <OrdersStatusChart data={data?.statusDistribution} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <OrderTypeChart data={data?.orderTypeDistribution} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1">
          <PeakHoursChart data={data?.hourlyOrders} isLoading={isLoading} />
        </div>
      </section>

      {/* Order Analytics Table */}
      <section>
        <OrderAnalyticsTable
          data={data?.orderAnalytics || []}
          pagination={data?.pagination || {}}
          isLoading={isLoading}
          onViewDetails={(orderId) => setSelectedDetailsId(orderId)}
          onViewRefund={(orderId) => setSelectedRefundId(orderId)}
        />
      </section>

      {/* Modals */}
      <ExportOrdersModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        storeId={storeId}
      />

      <OrderDetailModal
        isOpen={!!selectedDetailsId}
        onClose={() => setSelectedDetailsId(null)}
        orderId={selectedDetailsId}
      />

      <RefundDetailsModal
        isOpen={!!selectedRefundId}
        onClose={() => setSelectedRefundId(null)}
        orderId={selectedRefundId}
      />

    </div>
  );
}
