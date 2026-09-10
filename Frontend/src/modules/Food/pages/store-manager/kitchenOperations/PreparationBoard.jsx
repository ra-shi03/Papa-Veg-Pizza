import React, { useState, useEffect } from "react";
import { RefreshCw, ChefHat, Sparkles, Inbox, UserCheck, Flame, Droplets, Grid, Pizza } from "lucide-react";
import { Select } from "antd";

import {
  usePreparationBoard,
  useMoveStage,
  usePausePreparation,
  useReassignChef,
  useIngredientIssue
} from "./hooks/usePreparationBoard";
import { useChefs } from "./hooks/useKitchenQueue";


import SocketStatusBadge from "./components/SocketStatusBadge";
import PreparationSummaryCards from "./components/PreparationSummaryCards";
import PreparationFilters from "./components/PreparationFilters";
import StageColumn from "./components/StageColumn";

// Modals
import MoveStageModal from "./components/MoveStageModal";
import PausePreparationModal from "./components/PausePreparationModal";
import ReassignChefModal from "./components/ReassignChefModal";
import RecipeModal from "./components/RecipeModal";
import IngredientIssueModal from "./components/IngredientIssueModal";

export default function PreparationBoard() {
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
    priority: "All",
    chef: "All",
    size: "All",
    delayed: "false",
    onlyUnassigned: "false"
  });

  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Fetch Board Data & Chefs
  const { data: items = [], isLoading, refetch, socketConnected } = usePreparationBoard(filters);
  const { data: chefs = [] } = useChefs();

  // Mutations
  const moveStageMutation = useMoveStage();
  const pausePrepMutation = usePausePreparation();
  const reassignChefMutation = useReassignChef();
  const ingredientIssueMutation = useIngredientIssue();

  // Active Modals
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'moveStage', 'pause', 'reassign', 'recipe', 'issue'

  // Mobile navigation tabs state
  const [activeMobileTab, setActiveMobileTab] = useState("assigned");

  const handleManualRefetch = () => {
    refetch();
    setLastRefreshed(new Date());
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      priority: "All",
      chef: "All",
      size: "All",
      delayed: "false",
      onlyUnassigned: "false"
    });
  };

  // Callback Triggers
  const handleOpenMoveStage = (item) => {
    setSelectedItem(item);
    setActiveModal("moveStage");
  };

  const handleOpenPause = (item) => {
    setSelectedItem(item);
    setActiveModal("pause");
  };

  const handleOpenReassign = (item) => {
    setSelectedItem(item);
    setActiveModal("reassign");
  };

  const handleOpenRecipe = (item) => {
    setSelectedItem(item);
    setActiveModal("recipe");
  };

  const handleOpenIssue = (item) => {
    setSelectedItem(item);
    setActiveModal("issue");
  };

  // Mutation Confirms
  const handleConfirmMoveStage = ({ orderItemId, stage }) => {
    moveStageMutation.mutate({ orderItemId, stage });
  };

  const handleConfirmPause = ({ orderItemId, reason, notes }) => {
    pausePrepMutation.mutate({ orderItemId, reason, notes });
  };

  const handleConfirmReassign = ({ orderItemId, chefId }) => {
    reassignChefMutation.mutate({ orderItemId, chefId });
  };

  const handleConfirmIssue = (payload) => {
    ingredientIssueMutation.mutate(payload);
  };

  // Filter columns list
  const assignedItems = items.filter((i) => i.current_stage === "assigned");
  const doughPrepItems = items.filter((i) => i.current_stage === "dough_prep");
  const sauceItems = items.filter((i) => i.current_stage === "sauce");
  const toppingsItems = items.filter((i) => i.current_stage === "toppings");
  const readyBakingItems = items.filter((i) => i.current_stage === "ready_for_baking");

  const stageConfig = [
    {
      id: "assigned",
      title: "Assigned",
      icon: UserCheck,
      items: assignedItems,
      badgeColor: "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 border border-slate-200 dark:border-zinc-700"
    },
    {
      id: "dough_prep",
      title: "Dough Prep",
      icon: Inbox,
      items: doughPrepItems,
      badgeColor: "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30"
    },
    {
      id: "sauce",
      title: "Sauce",
      icon: Droplets,
      items: sauceItems,
      badgeColor: "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30"
    },
    {
      id: "toppings",
      title: "Toppings",
      icon: Grid,
      items: toppingsItems,
      badgeColor: "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border border-purple-100 dark:border-purple-900/30"
    },
    {
      id: "ready_for_baking",
      title: "Ready For Baking",
      icon: Flame,
      items: readyBakingItems,
      badgeColor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30"
    }
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-8xl mx-auto min-h-screen text-slate-800 dark:text-zinc-200">
      
      {/* Sticky Header Layout */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-zinc-850 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Preparation Board</span>
            <ChefHat size={16} className="text-[var(--primary)] animate-pulse" />
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
            Track pizzas currently being prepared in real time.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Socket status badge */}
          <SocketStatusBadge connected={socketConnected} />

          {/* Sync timeline tag */}
          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-850">
            UPDATED: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>

          {/* Manual Refresh button */}
          <button
            onClick={handleManualRefetch}
            className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-400 border border-slate-150 dark:border-zinc-850 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:rotate-180 duration-500"
            title="Refresh Board"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Dashboard KPI cards bento grid */}
      <PreparationSummaryCards items={items} />

      {/* Preparation Filters */}
      <PreparationFilters
        filters={filters}
        onChange={(updated) => setFilters(updated)}
        onReset={handleResetFilters}
        chefs={chefs}
      />

      {/* Mobile Tab Selectors (only visible below MD breakpoint) */}
      <div className="flex md:hidden bg-slate-105 dark:bg-zinc-950 p-1 rounded-2xl border border-slate-200/50 dark:border-zinc-850 overflow-x-auto max-w-full">
        {stageConfig.map((col) => {
          const Icon = col.icon;
          const isActive = activeMobileTab === col.id;
          return (
            <button
              key={col.id}
              onClick={() => setActiveMobileTab(col.id)}
              className={`flex-1 min-w-[75px] py-2 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer shrink-0 ${
                isActive
                  ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-sm border border-slate-100 dark:border-zinc-800"
                  : "text-slate-550 dark:text-zinc-550 hover:text-slate-700"
              }`}
            >
              <Icon size={13} />
              <span>{col.title.split(" ")[0]} ({col.items.length})</span>
            </button>
          );
        })}
      </div>

      {/* Board Columns container */}
      <div className="hidden md:flex gap-4 overflow-x-auto pb-4 pt-1 max-w-full scrollbar-thin">
        {stageConfig.map((col) => (
          <StageColumn
            key={col.id}
            title={col.title}
            icon={col.icon}
            items={col.items}
            isLoading={isLoading}
            chefs={chefs}
            badgeColor={col.badgeColor}
            onOpenMoveStage={handleOpenMoveStage}
            onOpenPause={handleOpenPause}
            onOpenReassign={handleOpenReassign}
            onOpenRecipe={handleOpenRecipe}
            onOpenIssue={handleOpenIssue}
          />
        ))}
      </div>

      {/* Mobile single column stage board */}
      <div className="block md:hidden">
        {stageConfig
          .filter((col) => col.id === activeMobileTab)
          .map((col) => (
            <StageColumn
              key={col.id}
              title={col.title}
              icon={col.icon}
              items={col.items}
              isLoading={isLoading}
              chefs={chefs}
              badgeColor={col.badgeColor}
              onOpenMoveStage={handleOpenMoveStage}
              onOpenPause={handleOpenPause}
              onOpenReassign={handleOpenReassign}
              onOpenRecipe={handleOpenRecipe}
              onOpenIssue={handleOpenIssue}
            />
          ))}
      </div>

      {/* Modal Overlay Layers */}
      <MoveStageModal
        visible={activeModal === "moveStage"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onConfirm={handleConfirmMoveStage}
      />

      <PausePreparationModal
        visible={activeModal === "pause"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onPause={handleConfirmPause}
      />

      <ReassignChefModal
        visible={activeModal === "reassign"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onReassign={handleConfirmReassign}
      />

      <RecipeModal
        visible={activeModal === "recipe"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
      />

      <IngredientIssueModal
        visible={activeModal === "issue"}
        onClose={() => setActiveModal(null)}
        item={selectedItem}
        onSubmit={handleConfirmIssue}
      />

    </div>
  );
}
