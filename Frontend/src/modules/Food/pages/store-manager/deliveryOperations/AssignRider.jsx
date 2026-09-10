import React, { useState, useEffect } from "react";
import { RefreshCw, Navigation, Search, RotateCcw } from "lucide-react";
import { Input, Select } from "antd";

// Hooks & Queries
import useReadyOrders from "./hooks/useReadyOrders";
import useAvailableRiders from "./hooks/useAvailableRiders";
import useAssignRider from "./hooks/useAssignRider";
import useSocketAssignment from "./hooks/useSocketAssignment";

// Components
import SocketStatusBadge from "../kitchenOperations/components/SocketStatusBadge";
import DashboardCards from "./components/DashboardCards";
import ReadyOrdersTable from "./components/ReadyOrdersTable";
import AssignRiderModal from "./components/AssignRiderModal";
import ConfirmationDialog from "./components/ConfirmationDialog";

export default function AssignRider() {
  // Theme state
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

  // Filter states
  const [filters, setFilters] = useState({
    search: "",
    status: "All"
  });
  const [searchInput, setSearchInput] = useState("");
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 300);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Queries
  const { data: readyOrders = [], isLoading: isLoadingOrders, refetch: refetchOrders } = useReadyOrders(filters);
  const { data: ridersList = [], isLoading: isLoadingRiders, refetch: refetchRiders } = useAvailableRiders();

  // Mutations & Sockets
  const assignRiderMutation = useAssignRider();
  const { socketConnected, emitNewAssignment } = useSocketAssignment();

  // Modal control states
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedRider, setSelectedRider] = useState(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleManualRefetch = () => {
    refetchOrders();
    refetchRiders();
    setLastRefreshed(new Date());
  };

  const handleResetFilters = () => {
    setSearchInput("");
    setFilters({
      search: "",
      status: "All"
    });
  };

  const handleOpenAssignModal = (order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const handleSelectRider = (rider) => {
    setSelectedRider(rider);
    setShowConfirmDialog(true);
  };

  const handleConfirmAssignment = () => {
    if (!selectedOrder || !selectedRider) return;
    
    assignRiderMutation.mutate({
      orderId: selectedOrder._id,
      riderId: selectedRider._id
    }, {
      onSuccess: () => {
        // Emit Socket event to rider
        emitNewAssignment(selectedOrder._id, selectedRider._id);
        
        // Reset states & close modals
        setShowConfirmDialog(false);
        setShowAssignModal(false);
        setSelectedRider(null);
        setSelectedOrder(null);
      }
    });
  };

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-8xl mx-auto min-h-screen text-slate-800 dark:text-zinc-200">
      
      {/* Page Header */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-zinc-850 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Assign Rider</span>
            <Navigation size={16} className="text-[var(--primary)] animate-pulse" />
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
            Assign available delivery partners to ready orders.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <SocketStatusBadge connected={socketConnected} />

          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-850">
            UPDATED: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>

          <button
            onClick={handleManualRefetch}
            className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-400 border border-slate-150 dark:border-zinc-850 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:rotate-180 duration-500"
            title="Refresh Station"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardCards orders={readyOrders} riders={ridersList} />

      {/* Main Table section */}
      <div className="space-y-4">
        
        {/* Filters Panel */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-3 rounded-2.5xl flex flex-wrap gap-2.5 items-center justify-between shadow-sm transition-all duration-300">
          <div className="flex-1 min-w-[200px] max-w-sm">
            <Input
              prefix={<Search size={14} className="text-slate-400 mr-1" />}
              placeholder="Search Order Number, Customer..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="compact-input rounded-xl text-xs h-9 bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-850 hover:border-slate-200 dark:hover:border-zinc-850 text-slate-800 dark:text-white"
              allowClear
            />
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Status:</span>
              <Select
                value={filters.status || "All"}
                onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                className="w-32 text-xs"
                classNames={{ popup: { root: "dark:bg-zinc-900 text-xs" } }}
                options={[
                  { value: "All", label: "All Statuses" },
                  { value: "Waiting", label: "Waiting" },
                  { value: "Assigned", label: "Assigned" },
                  { value: "Accepted", label: "Accepted" }
                ]}
              />
            </div>

            <button
              onClick={handleResetFilters}
              className="h-9 px-3 border border-slate-250 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-400 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-extrabold cursor-pointer shadow-xs"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* Ready Orders Grid Table */}
        <ReadyOrdersTable
          orders={readyOrders}
          isLoading={isLoadingOrders}
          onOpenAssign={handleOpenAssignModal}
          riders={ridersList}
        />

      </div>

      {/* Rider Assignment Modal (Double Column Details + Available List) */}
      <AssignRiderModal
        visible={showAssignModal}
        onClose={() => {
          setShowAssignModal(false);
          setSelectedOrder(null);
        }}
        order={selectedOrder}
        riders={ridersList}
        isLoadingRiders={isLoadingRiders}
        onSelectRider={handleSelectRider}
      />

      {/* Confirm Action Alert Dialog */}
      <ConfirmationDialog
        visible={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setSelectedRider(null);
        }}
        onConfirm={handleConfirmAssignment}
        rider={selectedRider}
        order={selectedOrder}
        isPending={assignRiderMutation.isPending}
      />

    </div>
  );
}
