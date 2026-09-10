import React, { useState, useEffect } from "react";
import { RefreshCw, ChefHat, Sparkles } from "lucide-react";
import { Pagination, Select } from "antd";

// Hooks & Subcomponents
import {
  usePizzaStation,
  useStartAssembly,
  usePauseAssembly,
  useCompleteAssembly,
  useReportShortage
} from "./hooks/usePizzaStation";
import { useChefs } from "./hooks/useKitchenQueue";

import SocketStatusBadge from "./components/SocketStatusBadge";
import PizzaStationSummaryCards from "./components/PizzaStationSummaryCards";
import PizzaStationFilters from "./components/PizzaStationFilters";
import PizzaStationTable from "./components/PizzaStationTable";

// Modals
import StartAssemblyModal from "./components/StartAssemblyModal";
import PauseAssemblyModal from "./components/PauseAssemblyModal";
import CompleteAssemblyModal from "./components/CompleteAssemblyModal";
import PizzaRecipeModal from "./components/PizzaRecipeModal";
import PizzaIngredientIssueModal from "./components/PizzaIngredientIssueModal";

export default function PizzaStation() {
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
    chef: "All",
    size: "All",
    crust: "All",
    delayed: "false",
    priority: "All"
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Queries
  const { data: items = [], isLoading, refetch, socketConnected } = usePizzaStation(filters);
  const { data: chefs = [] } = useChefs();

  // Mutations
  const startMutation = useStartAssembly();
  const pauseMutation = usePauseAssembly();
  const completeMutation = useCompleteAssembly();
  const shortageMutation = useReportShortage();

  // Active Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'start', 'pause', 'complete', 'recipe', 'issue'

  const handleManualRefetch = () => {
    refetch();
    setLastRefreshed(new Date());
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "All",
      chef: "All",
      size: "All",
      crust: "All",
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

  const handleOpenPause = (item) => {
    setSelectedItem(item);
    setActiveModal("pause");
  };

  const handleOpenComplete = (item) => {
    setSelectedItem(item);
    setActiveModal("complete");
  };

  const handleOpenRecipe = (item) => {
    setSelectedItem(item);
    setActiveModal("recipe");
  };

  const handleOpenIssue = (item) => {
    setSelectedItem(item);
    setActiveModal("issue");
  };

  // Confirms
  const handleConfirmStart = ({ orderItemId }) => {
    startMutation.mutate({ orderItemId });
  };

  const handleConfirmPause = ({ orderItemId, reason, notes }) => {
    pauseMutation.mutate({ orderItemId, reason, notes });
  };

  const handleConfirmComplete = ({ orderItemId, notes }) => {
    completeMutation.mutate({ orderItemId, notes });
  };

  const handleConfirmIssue = (payload) => {
    shortageMutation.mutate(payload);
  };

  // Local Pagination Calculations
  const paginatedItems = items.slice((page - 1) * limit, page * limit);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-8xl mx-auto min-h-screen text-slate-800 dark:text-zinc-200">
      
      {/* Sticky Header Layout */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-zinc-850 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Pizza Station</span>
            <ChefHat size={16} className="text-[var(--primary)] animate-pulse" />
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
            Chef workstation for stretching dough and assembling toppings.
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
            title="Refresh Table"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Dashboard KPI cards bento grid */}
      <PizzaStationSummaryCards items={items} />

      {/* Pizza Station search and filters bar */}
      <PizzaStationFilters
        filters={filters}
        onChange={(updated) => {
          setFilters(updated);
          setPage(1);
        }}
        onReset={handleResetFilters}
        chefs={chefs}
      />

      {/* Main Assembly Table / Grid Card layout */}
      <PizzaStationTable
        items={paginatedItems}
        isLoading={isLoading}
        chefs={chefs}
        onOpenStart={handleOpenStart}
        onOpenPause={handleOpenPause}
        onOpenComplete={handleOpenComplete}
        onOpenRecipe={handleOpenRecipe}
        onOpenIssue={handleOpenIssue}
      />

      {/* Pagination controls */}
      {items.length > limit && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-3 rounded-2.5xl shadow-sm transition-all duration-300">
          <span className="text-[10px] font-black text-slate-450 dark:text-zinc-550 uppercase">
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

      {/* Modals and overlay dialog layers */}
      <StartAssemblyModal
        visible={activeModal === "start"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        chefs={chefs}
        onConfirm={handleConfirmStart}
      />

      <PauseAssemblyModal
        visible={activeModal === "pause"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onPause={handleConfirmPause}
      />

      <CompleteAssemblyModal
        visible={activeModal === "complete"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onConfirm={handleConfirmComplete}
      />

      <PizzaRecipeModal
        visible={activeModal === "recipe"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
      />

      <PizzaIngredientIssueModal
        visible={activeModal === "issue"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onSubmit={handleConfirmIssue}
      />

    </div>
  );
}
