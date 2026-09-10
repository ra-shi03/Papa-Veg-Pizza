import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  TrendingUp,
  Search,
  SlidersHorizontal,
  Download,
  Award,
  ChevronDown,
  FileSpreadsheet,
  FileText,
  BarChart3,
  CalendarCheck,
  Briefcase
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@food/components/ui/dropdown-menu";

// Custom hooks & sub-components
import { usePerformanceList } from "./hooks/usePerformance";
import PerformanceStatsCards from "./components/PerformanceStatsCards";
import PerformanceFormulaCard from "./components/PerformanceFormulaCard";
import LeaderboardTable from "./components/LeaderboardTable";
import PerformanceCharts from "./components/PerformanceCharts";
import StaffPerformanceModal from "./components/StaffPerformanceModal";

// Simple state debounce helper hook
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Performance() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Active modal staff selection
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Local state for search & filter inputs
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const debouncedSearch = useDebounce(localSearch, 300);

  // Period / Role Filters
  const periodFilter = searchParams.get("period") || "monthly";
  const roleFilter = searchParams.get("role") || "All";

  // Toast Notifications
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Sync search parameters helper
  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== "All") {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    setSearchParams(newParams);
  };

  // Fetch list data using React Query hook
  const filters = useMemo(() => ({
    period: periodFilter,
    role: roleFilter,
    search: debouncedSearch
  }), [periodFilter, roleFilter, debouncedSearch]);

  const { data: leaderboard = [], isLoading, isError } = usePerformanceList(filters);

  // Handle viewing performance details modal
  const handleSelectStaff = (staffId) => {
    setSelectedStaffId(staffId);
    setIsModalOpen(true);
  };

  // Export handlers
  const handleExport = (format) => {
    const periodLabel = periodFilter.charAt(0).toUpperCase() + periodFilter.slice(1);
    const filename = `Staff_Performance_Report_${periodLabel}_${new Date().toISOString().split("T")[0]}.${format}`;
    showToast(`Successfully prepared and exported "${filename}" to downloads folder!`);
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-full relative">
      {/* 1. Header Area */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
            Staff Performance Analytics
          </h1>
          <p className="text-zinc-500 dark:text-zinc-450 text-xs mt-1">
            Real-time kitchen productivity scores derived from completed orders, prep times, and attendance patterns.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Period Selection (Daily / Weekly / Monthly Switcher) */}
          <div className="flex gap-1 bg-zinc-50 dark:bg-zinc-950 p-0.5 border border-zinc-100 dark:border-zinc-800 rounded-full">
            {["daily", "weekly", "monthly"].map((p) => (
              <button
                key={p}
                onClick={() => updateFilter("period", p)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-full transition-all cursor-pointer ${
                  periodFilter === p
                    ? "bg-white dark:bg-zinc-900 border border-zinc-250/20 text-slate-900 dark:text-white shadow-sm"
                    : "text-zinc-400 dark:text-zinc-500 hover:text-zinc-650"
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center gap-1.5 px-4 py-2 border border-zinc-250 dark:border-zinc-800 text-slate-700 dark:text-zinc-350 bg-white dark:bg-zinc-900 text-xs font-bold rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 shadow-sm transition-all cursor-pointer">
                <Download size={14} />
                <span>Export Report</span>
                <ChevronDown size={12} className="text-zinc-400" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-xl">
              <DropdownMenuItem
                onClick={() => handleExport("csv")}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-zinc-55 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-emerald-600" />
                <span>Export as CSV</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("xlsx")}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-zinc-55 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <FileSpreadsheet size={14} className="text-blue-600" />
                <span>Export as Excel</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleExport("pdf")}
                className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-zinc-300 hover:bg-zinc-55 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <FileText size={14} className="text-rose-600" />
                <span>Export as PDF</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* 2. Stats Dashboard Cards */}
      <PerformanceStatsCards leaderboard={leaderboard} isLoading={isLoading} />

      {/* 3. Operational Formula Guide */}
      <PerformanceFormulaCard />

      {/* 4. Filters & Controls */}
      <section className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-850 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3.5 top-3 text-zinc-400" size={14} />
            <input
              type="text"
              placeholder="Search staff by name or code..."
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                updateFilter("search", e.target.value);
              }}
              className="w-full pl-9 pr-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:border-primary text-xs font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-zinc-400 mr-1" />
            
            {/* Role Filter */}
            <div className="flex flex-col gap-0.5 min-w-[140px]">
              <select
                value={roleFilter}
                onChange={(e) => updateFilter("role", e.target.value)}
                className="h-9 px-2.5 border border-zinc-200 dark:border-zinc-850 rounded-xl text-xs font-semibold bg-zinc-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-250 focus:outline-none"
              >
                <option value="All">All Roles</option>
                <option value="Kitchen Supervisor">Kitchen Supervisor</option>
                <option value="Pizza Maker">Pizza Maker</option>
                <option value="Baker">Baker</option>
                <option value="Packager">Packager</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Leaderboard Grid */}
      <div className="space-y-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 pl-1 flex items-center gap-1">
            <Award size={14} /> Crew Rankings Ledger
          </h2>
          <LeaderboardTable
            leaderboard={leaderboard}
            isLoading={isLoading}
            isError={isError}
            onSelectStaff={handleSelectStaff}
          />
        </div>

        {/* 6. Comparison Analytics Charts */}
        {!isLoading && !isError && leaderboard.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 pl-1 flex items-center gap-1">
              <BarChart3 size={14} /> Comparative Insights
            </h2>
            <PerformanceCharts leaderboard={leaderboard} />
          </div>
        )}
      </div>

      {/* 7. Modal View */}
      {selectedStaffId && (
        <StaffPerformanceModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedStaffId(null);
          }}
          staffId={selectedStaffId}
          defaultPeriod={periodFilter}
        />
      )}

      {/* 8. Toast Alert Indicator */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[9999] bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-extrabold text-xs px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-zinc-700/20 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <CalendarCheck size={14} className="text-primary" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
