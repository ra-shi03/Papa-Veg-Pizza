import React, { useState, useEffect } from "react";
import { RefreshCw, Package, Sparkles } from "lucide-react";
import { Pagination, Select } from "antd";

// Hooks & Subcomponents
import {
  usePackagingStation,
  usePackagingStaff,
  useStartPackaging,
  usePackagingChecklist,
  useSealPackage,
  useMarkReady
} from "./hooks/usePackagingStation";

import SocketStatusBadge from "./components/SocketStatusBadge";
import PackagingSummaryCards from "./components/PackagingSummaryCards";
import PackagingFilters from "./components/PackagingFilters";
import PackagingTable from "./components/PackagingTable";

// Modals
import StartPackagingModal from "./components/StartPackagingModal";
import PackagingChecklistModal from "./components/PackagingChecklistModal";
import SealPackageModal from "./components/SealPackageModal";
import MarkReadyModal from "./components/MarkReadyModal";
import PrintLabelModal from "./components/PrintLabelModal";

export default function PackagingStation() {
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
    deliveryType: "All",
    staff: "All",
    readyForPickup: "false",
    pendingPackaging: "false"
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Queries
  const { data: orders = [], isLoading, refetch, socketConnected } = usePackagingStation(filters);
  const { data: staff = [] } = usePackagingStaff();

  // Mutations
  const startPackagingMutation = useStartPackaging();
  const checklistMutation = usePackagingChecklist();
  const sealPackageMutation = useSealPackage();
  const markReadyMutation = useMarkReady();

  // Modal control states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'start', 'checklist', 'seal', 'ready', 'print'

  const handleManualRefetch = () => {
    refetch();
    setLastRefreshed(new Date());
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      status: "All",
      deliveryType: "All",
      staff: "All",
      readyForPickup: "false",
      pendingPackaging: "false"
    });
    setPage(1);
  };

  // Triggers
  const handleOpenStart = (order) => {
    setSelectedOrder(order);
    setActiveModal("start");
  };

  const handleOpenChecklist = (order) => {
    setSelectedOrder(order);
    setActiveModal("checklist");
  };

  const handleOpenSeal = (order) => {
    setSelectedOrder(order);
    setActiveModal("seal");
  };

  const handleOpenReady = (order) => {
    setSelectedOrder(order);
    setActiveModal("ready");
  };

  const handleOpenPrint = (order) => {
    setSelectedOrder(order);
    setActiveModal("print");
  };

  // Confirms
  const handleConfirmStart = ({ orderId }) => {
    startPackagingMutation.mutate({ orderId });
  };

  const handleConfirmChecklist = (payload) => {
    checklistMutation.mutate(payload);
  };

  const handleConfirmSeal = (payload) => {
    sealPackageMutation.mutate(payload);
  };

  const handleConfirmReady = ({ orderId }) => {
    markReadyMutation.mutate({ orderId });
  };

  // Local Pagination Calculations
  const safeOrders = Array.isArray(orders) ? orders : [];
  const paginatedOrders = safeOrders.slice((page - 1) * limit, page * limit);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-8xl mx-auto min-h-screen text-slate-800 dark:text-zinc-200">
      
      {/* Sticky Header Layout */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-zinc-850 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Packaging Station</span>
            <Package size={16} className="text-[var(--primary)] animate-pulse" />
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
            Perform quality check, box sealing, print thermal label, and dispatch completed orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Socket Connection status */}
          <SocketStatusBadge connected={socketConnected} />

          {/* Sync timeline tag */}
          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-850">
            UPDATED: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>

          {/* Manual Refresh button */}
          <button
            onClick={handleManualRefetch}
            className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-slate-655 dark:text-zinc-400 border border-slate-150 dark:border-zinc-850 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:rotate-180 duration-500"
            title="Refresh Table"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Dashboard KPI cards bento grid */}
      <PackagingSummaryCards orders={orders} />

      {/* Full-Width Table Layout section */}
      <div className="space-y-4">
        
        {/* Search and filters bar */}
        <PackagingFilters
          filters={filters}
          onChange={(updated) => {
            setFilters(updated);
            setPage(1);
          }}
          onReset={handleResetFilters}
          staff={staff}
        />

        {/* Main table list */}
        <PackagingTable
          orders={paginatedOrders}
          staff={staff}
          isLoading={isLoading}
          onOpenStart={handleOpenStart}
          onOpenChecklist={handleOpenChecklist}
          onOpenSeal={handleOpenSeal}
          onOpenReady={handleOpenReady}
          onOpenPrint={handleOpenPrint}
        />

        {/* Pagination controls */}
        {safeOrders.length > limit && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 p-3 rounded-2.5xl shadow-sm transition-all duration-300">
            <span className="text-[10px] font-black text-slate-450 dark:text-zinc-555 uppercase">
              Showing Page {page} of {Math.ceil(safeOrders.length / limit)} ({safeOrders.length} total orders)
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
                total={safeOrders.length}
                pageSize={limit}
                onChange={(p) => setPage(p)}
                className="text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals and overlay dialog layers */}
      <StartPackagingModal
        visible={activeModal === "start"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onConfirm={handleConfirmStart}
      />

      <PackagingChecklistModal
        visible={activeModal === "checklist"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onSubmit={handleConfirmChecklist}
      />

      <SealPackageModal
        visible={activeModal === "seal"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onConfirm={handleConfirmSeal}
      />

      <MarkReadyModal
        visible={activeModal === "ready"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onConfirm={handleConfirmReady}
      />

      <PrintLabelModal
        visible={activeModal === "print"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
      />

    </div>
  );
}
