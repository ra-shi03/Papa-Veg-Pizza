import React, { useState, useEffect } from "react";
import { RefreshCw, Flame, Sparkles } from "lucide-react";
import { Pagination, Select } from "antd";

// Hooks & Subcomponents
import {
  useBakingStation,
  useOvens,
  useBakingStaff,
  useKitchenIssues,
  useStartBaking,
  useMoveOven,
  usePauseBaking,
  useCompleteBaking,
  useReportBakingIssue
} from "./hooks/useBakingStation";

import SocketStatusBadge from "./components/SocketStatusBadge";
import BakingSummaryCards from "./components/BakingSummaryCards";
import BakingFilters from "./components/BakingFilters";
import BakingTable from "./components/BakingTable";
import OvenStatusPanel from "./components/OvenStatusPanel";

// Modals
import OvenAssignmentModal from "./components/OvenAssignmentModal";
import MoveOvenModal from "./components/MoveOvenModal";
import PauseBakingModal from "./components/PauseBakingModal";
import FinishBakingModal from "./components/FinishBakingModal";
import BakingIssueModal from "./components/BakingIssueModal";

export default function BakingStation() {
  const [themePrimary, setThemePrimary] = useState(localStorage.getItem("sa_primary") || "#a43c12");
  const [themeSecondary, setThemeSecondary] = useState(localStorage.getItem("sa_secondary") || "#ff7f50");

  useEffect(() => {
    const primary = localStorage.getItem("sa_primary") || "#a43c12";
    const secondary = localStorage.getItem("sa_secondary") || "#ff7f50";
    setThemePrimary(primary);
    setThemeSecondary(secondary);

    document.documentElement.style.setProperty("--sa-primary", primary);
    document.documentElement.style.setProperty("--sa-primary-hover", `${primary}cc`);
    document.documentElement.style.setProperty("--sa-secondary", secondary);
    document.documentElement.style.setProperty("--sa-secondary-hover", `${secondary}cc`);
    document.documentElement.style.setProperty("--primary", primary);
    document.documentElement.style.setProperty("--primary-hover", `${primary}cc`);
    document.documentElement.style.setProperty("--secondary", secondary);
    document.documentElement.style.setProperty("--secondary-hover", `${secondary}cc`);
  }, []);

  // Filter States
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    oven: "All",
    staff: "All",
    delayed: "false",
    priority: "All"
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Queries
  const { data: items = [], isLoading, refetch, socketConnected } = useBakingStation(filters);
  const { data: ovens = [], refetch: refetchOvens } = useOvens();
  const { data: staff = [] } = useBakingStaff();
  const { data: issues = [], refetch: refetchIssues } = useKitchenIssues();

  // Mutations
  const startBakingMutation = useStartBaking();
  const moveOvenMutation = useMoveOven();
  const pauseBakingMutation = usePauseBaking();
  const completeBakingMutation = useCompleteBaking();
  const reportIssueMutation = useReportBakingIssue();

  // Selected item for modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'start', 'move', 'pause', 'complete', 'issue'

  const handleManualRefetch = () => {
    refetch();
    refetchOvens();
    refetchIssues();
    setLastRefreshed(new Date());
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "All",
      oven: "All",
      staff: "All",
      delayed: "false",
      priority: "All"
    });
    setPage(1);
  };

  // Triggers
  const handleOpenStart = (item) => {
    setSelectedItem(item);
    setActiveModal("start");
  };

  const handleOpenMove = (item) => {
    setSelectedItem(item);
    setActiveModal("move");
  };

  const handleOpenPause = (item) => {
    setSelectedItem(item);
    setActiveModal("pause");
  };

  const handleOpenComplete = (item) => {
    setSelectedItem(item);
    setActiveModal("complete");
  };

  const handleOpenIssue = (item) => {
    setSelectedItem(item);
    setActiveModal("issue");
  };

  // Mutation Confirms
  const handleConfirmStart = (payload) => {
    startBakingMutation.mutate(payload);
  };

  const handleConfirmMove = (payload) => {
    moveOvenMutation.mutate(payload);
  };

  const handleConfirmPause = (payload) => {
    pauseBakingMutation.mutate(payload);
  };

  const handleConfirmComplete = (payload) => {
    completeBakingMutation.mutate(payload);
  };

  const handleConfirmIssue = (payload) => {
    reportIssueMutation.mutate(payload);
  };

  // Local Pagination Calculations
  const paginatedItems = items.slice((page - 1) * limit, page * limit);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-8xl mx-auto min-h-screen text-slate-800 dark:text-zinc-200">
      
      {/* Sticky Header Layout */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-zinc-850 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Baking Station</span>
            <Flame size={16} className="text-[var(--primary)] animate-pulse" />
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
            Manage oven configurations, temperatures, and timed bakes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Socket Status indicator */}
          <SocketStatusBadge connected={socketConnected} />

          {/* Sync timeline tag */}
          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-850">
            UPDATED: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>

          {/* Manual Refresh button */}
          <button
            onClick={handleManualRefetch}
            className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-400 border border-slate-150 dark:border-zinc-850 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:rotate-180 duration-500"
            title="Refresh Station"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Dashboard KPI cards bento grid */}
      <BakingSummaryCards items={items} ovens={ovens} issues={issues} />

      {/* Grid Layout: Desktop Side Panel Pattern */}
      {/* Stacked Layout: Full-Width Table + Bottom Oven Grid */}
      <div className="space-y-6">
        
        {/* Table / Queue section */}
        <div className="space-y-4">
          
          {/* Search and filters bar */}
          <BakingFilters
            filters={filters}
            onChange={(updated) => {
              setFilters(updated);
              setPage(1);
            }}
            onReset={handleResetFilters}
            ovens={ovens}
            staff={staff}
          />

          {/* Main Table / Grid card layout */}
          <BakingTable
            items={paginatedItems}
            ovens={ovens}
            staff={staff}
            isLoading={isLoading}
            onOpenStart={handleOpenStart}
            onOpenMove={handleOpenMove}
            onOpenPause={handleOpenPause}
            onOpenComplete={handleOpenComplete}
            onOpenIssue={handleOpenIssue}
          />

          {/* Pagination controls */}
          {items.length > limit && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-3 rounded-2.5xl shadow-sm transition-all duration-300">
              <span className="text-[10px] font-black text-slate-450 dark:text-zinc-555 uppercase">
                Showing Page {page} of {Math.ceil(items.length / limit)} ({items.length} total items)
              </span>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400">Limit:</span>
                  <Select
                    value={limit}
                    onChange={(val) => {
                      setLimit(val);
                      setPage(1);
                    }}
                    className="w-18 text-xs font-extrabold"
                    options={[
                      { value: 10, label: "10" },
                      { value: 20, label: "20" },
                      { value: 50, label: "50" },
                      { value: 100, label: "100" }
                    ]}
                    popupClassName="dark:bg-zinc-900"
                  />
                </div>

                <Pagination
                  simple
                  current={page}
                  total={items.length}
                  pageSize={limit}
                  onChange={(p) => setPage(p)}
                  className="text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* Oven Status Panel (Full-Width Grid) */}
        <div>
          <OvenStatusPanel ovens={ovens} items={items} />
        </div>
      </div>

      {/* Modals and overlay dialog layers */}
      <OvenAssignmentModal
        visible={activeModal === "start"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onConfirm={handleConfirmStart}
      />

      <MoveOvenModal
        visible={activeModal === "move"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onConfirm={handleConfirmMove}
      />

      <PauseBakingModal
        visible={activeModal === "pause"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onPause={handleConfirmPause}
      />

      <FinishBakingModal
        visible={activeModal === "complete"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onConfirm={handleConfirmComplete}
      />

      <BakingIssueModal
        visible={activeModal === "issue"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onSubmit={handleConfirmIssue}
      />

    </div>
  );
}
