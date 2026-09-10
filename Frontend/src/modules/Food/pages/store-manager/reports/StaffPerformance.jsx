import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RefreshCw, Download } from "lucide-react";
import { toast } from "sonner";

// Hooks
import { useStaffPerformance } from "./hooks/useStaffPerformance";

// Components
import StaffFilters from "./components/StaffFilters";
import StaffMetricsCards from "./components/StaffMetricsCards";
import StaffRankingChart from "./components/StaffRankingChart";
import AttendanceTrendChart from "./components/AttendanceTrendChart";
import ComplaintAnalysisChart from "./components/ComplaintAnalysisChart";
import StaffPerformanceTable from "./components/StaffPerformanceTable";

// Modals
import StaffDetailModal from "./components/StaffDetailModal";
import PerformanceComparisonModal from "./components/PerformanceComparisonModal";
import ExportStaffReportModal from "./components/ExportStaffReportModal";

export default function StaffPerformance() {
  const [searchParams] = useSearchParams();

  // Load filter parameters from URL Query params
  const storeId = searchParams.get("storeId") || localStorage.getItem("store_active_id") || "st-indore-01";
  const period = searchParams.get("period") || "monthly";
  const role = searchParams.get("role") || "All";
  const station = searchParams.get("station") || "All";
  const page = Number(searchParams.get("page")) || 1;
  const search = searchParams.get("search") || "";
  const sortBy = searchParams.get("sortBy") || "efficiency";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const filters = {
    storeId,
    period,
    role,
    station,
    page,
    limit: 6, // 6 records per page
    search,
    sortBy,
    sortOrder
  };

  // Fetch report data
  const { data, isLoading, isError, refetch, isRefetching } = useStaffPerformance(filters);

  // Modal triggers
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedStaffDetails, setSelectedStaffDetails] = useState(null);
  const [selectedStaffCompare, setSelectedStaffCompare] = useState(null);

  const handleRefresh = async () => {
    await refetch();
    toast.success("Staff performance metrics refreshed!");
  };

  return (
    <div className="p-6 md:p-8 space-y-6">
      
      {/* Page Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Staff Performance
          </h1>
          <p className="text-zinc-550 dark:text-zinc-400 text-xs font-semibold mt-1">
            Monitor attendance, efficiency, preparation speed, complaints, and employee productivity.
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
            <span>Refresh Feed</span>
          </button>

          {/* Export Report Button */}
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
        <StaffFilters />
      </section>

      {/* KPI Cards Section */}
      <section>
        <StaffMetricsCards data={data?.dashboard} isLoading={isLoading} />
      </section>

      {/* Charts Section */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 animate-fade-in duration-200">
          <StaffRankingChart data={data?.rankings} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1 animate-fade-in duration-200">
          <AttendanceTrendChart data={data?.attendanceTrend} isLoading={isLoading} />
        </div>
        <div className="lg:col-span-1 animate-fade-in duration-200">
          <ComplaintAnalysisChart data={data?.complaintsAnalysis} isLoading={isLoading} />
        </div>
      </section>

      {/* Ledger Table Section */}
      <section>
        <StaffPerformanceTable
          data={data?.staffPerformance || []}
          pagination={data?.pagination}
          isLoading={isLoading}
          onViewDetails={(staffId) => setSelectedStaffDetails(staffId)}
          onCompare={(staffId) => setSelectedStaffCompare(staffId)}
        />
      </section>

      {/* Separate Modal Windows */}
      <ExportStaffReportModal
        isOpen={exportOpen}
        onClose={() => setExportOpen(false)}
        storeId={storeId}
      />

      <StaffDetailModal
        isOpen={!!selectedStaffDetails}
        onClose={() => setSelectedStaffDetails(null)}
        staffId={selectedStaffDetails}
      />

      <PerformanceComparisonModal
        isOpen={!!selectedStaffCompare}
        onClose={() => setSelectedStaffCompare(null)}
        defaultStaffId={selectedStaffCompare}
      />

    </div>
  );
}
