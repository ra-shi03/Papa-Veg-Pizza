import React, { useState, useEffect } from "react";
import { RefreshCw, Play, ShieldAlert, Sparkles } from "lucide-react";
import { useOutletContext } from "react-router-dom";
import { Pagination, Select } from "antd";

// Hooks, Data & Subcomponents
import {
  useKitchenQueue,
  useChefs,
  useAcceptOrder,
  useAssignChef,
  useRejectItem,
  useUpdateOrderStatus
} from "./hooks/useKitchenQueue";

import SocketStatusBadge from "./components/SocketStatusBadge";
import DashboardCards from "./components/DashboardCards";
import QueueFilters from "./components/QueueFilters";
import QueueBoard from "./components/QueueBoard";

// Modals
import OrderDetailsModal from "./components/OrderDetailsModal";
import AssignChefModal from "./components/AssignChefModal";
import RejectItemModal from "./components/RejectItemModal";

export default function KitchenQueue() {
  // Sync page settings
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
    assignedChef: "All",
    paymentMethod: "All",
    delayed: "false",
    unassigned: "false"
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Fetch Queue & Chefs
  const { data, isLoading, refetch, socketConnected } = useKitchenQueue(filters, page, limit);
  const { data: chefs = [] } = useChefs();

  const ordersData = data?.orders || [];
  const paginationData = data?.pagination || { total: 0, totalPages: 1 };

  // Mutations
  const acceptOrderMutation = useAcceptOrder();
  const assignChefMutation = useAssignChef();
  const rejectItemMutation = useRejectItem();
  const updateStatusMutation = useUpdateOrderStatus();

  // Active Modals
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'details', 'assignChef', 'rejectItem'

  // Refreshed time updating handler
  const handleManualRefetch = () => {
    refetch();
    setLastRefreshed(new Date());
  };

  const formatLastRefreshed = () => {
    return lastRefreshed.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true
    });
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      priority: "All",
      assignedChef: "All",
      paymentMethod: "All",
      delayed: "false",
      unassigned: "false"
    });
    setPage(1);
  };

  // Callback Triggers
  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
    setActiveModal("details");
  };

  const handleOpenAssignChef = (order) => {
    setSelectedOrder(order);
    setActiveModal("assignChef");
  };

  const handleOpenRejectItem = (order) => {
    setSelectedOrder(order);
    setActiveModal("rejectItem");
  };

  const handleAcceptOrder = (orderId) => {
    acceptOrderMutation.mutate(orderId);
  };

  const handleAssignChef = ({ orderId, chefId }) => {
    assignChefMutation.mutate({ orderId, chefId });
  };

  const handleRejectItems = ({ orderId, itemIds, reason, notifyCustomer }) => {
    rejectItemMutation.mutate({ orderId, itemIds, reason, notifyCustomer });
  };

  const handleStartPreparation = (orderId) => {
    updateStatusMutation.mutate({ orderId, status: "preparing" });
  };

  const handleCancelOrder = (orderId) => {
    updateStatusMutation.mutate({ orderId, status: "cancelled" });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-8xl mx-auto min-h-screen text-slate-800 dark:text-zinc-200">
      
      {/* Sticky Header Layout */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-zinc-850 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Kitchen Queue</span>
            <Sparkles size={16} className="text-[var(--primary)] animate-pulse" />
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-500 mt-0.5">
            Manage incoming orders and assign preparation tasks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Socket connectivity tag */}
          <SocketStatusBadge connected={socketConnected} />

          {/* Sync timeline tag */}
          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-850">
            UPDATED: {formatLastRefreshed()}
          </span>

          {/* Manual Refresh button */}
          <button
            onClick={handleManualRefetch}
            className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-400 border border-slate-150 dark:border-zinc-850 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:rotate-180 duration-500"
            title="Refresh Queue Board"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Dashboard KPI cards bento grid */}
      <DashboardCards orders={ordersData} />

      {/* Queue Filters and search panel */}
      <QueueFilters
        filters={filters}
        onChange={(updated) => {
          setFilters(updated);
          setPage(1);
        }}
        onReset={handleResetFilters}
        chefs={chefs}
      />

      {/* Main Kanban board queue views */}
      <QueueBoard
        orders={ordersData}
        isLoading={isLoading}
        chefs={chefs}
        onAccept={handleAcceptOrder}
        onOpenAssignChef={handleOpenAssignChef}
        onOpenRejectItem={handleOpenRejectItem}
        onOpenDetails={handleOpenDetails}
        onMarkPreparing={handleStartPreparation}
      />

      {/* Server side Pagination bar */}
      {paginationData.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-3 rounded-2.5xl shadow-sm transition-all duration-300">
          <span className="text-[10px] font-black text-slate-450 dark:text-zinc-550 uppercase">
            Showing Page {page} of {paginationData.totalPages} ({paginationData.total} total orders)
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
              total={paginationData.total}
              pageSize={limit}
              onChange={(p) => setPage(p)}
              className="text-xs"
            />
          </div>
        </div>
      )}

      {/* Modal overlays */}
      <OrderDetailsModal
        visible={activeModal === "details"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onAccept={handleAcceptOrder}
        onAssignChef={handleOpenAssignChef}
        onStartPreparation={handleStartPreparation}
        onCancelOrder={handleCancelOrder}
      />

      <AssignChefModal
        visible={activeModal === "assignChef"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onAssign={handleAssignChef}
      />

      <RejectItemModal
        visible={activeModal === "rejectItem"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onReject={handleRejectItems}
      />

    </div>
  );
}
