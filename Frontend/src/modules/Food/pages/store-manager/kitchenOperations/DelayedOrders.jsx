import React, { useState, useEffect } from "react";
import { RefreshCw, Clock, AlertTriangle, FileSpreadsheet, Sparkles } from "lucide-react";
import { Pagination, Select } from "antd";
import { toast } from "sonner";

// Hooks
import {
  useDelayedOrders,
  useActiveStaff,
  getStaffName,
  useEscalateOrder,
  useReassignStaff,
  useNotifyCustomer,
  useResolveDelay
} from "./hooks/useDelayedOrders";

// Components
import SocketStatusBadge from "./components/SocketStatusBadge";
import DelayedSummaryCards from "./components/DelayedSummaryCards";
import CriticalDelayPanel from "./components/CriticalDelayPanel";
import DelayedFilters from "./components/DelayedFilters";
import DelayedOrdersTable from "./components/DelayedOrdersTable";

// Modals
import OrderTimelineModal from "./components/OrderTimelineModal";
import EscalationModal from "./components/EscalationModal";
import ReassignStaffModal from "./components/ReassignStaffModal";
import CustomerNotificationModal from "./components/CustomerNotificationModal";
import ResolveDelayModal from "./components/ResolveDelayModal";

export default function DelayedOrders() {
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

  // Filter & Pagination States
  const [filters, setFilters] = useState({
    search: "",
    stage: "All",
    priority: "All",
    staffId: "All",
    issueType: "All",
    criticalOnly: false,
    resolved: "false" // Default to show only active delayed orders
  });

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  // Queries
  const { data: items = [], isLoading, refetch, socketConnected } = useDelayedOrders(filters);
  const { data: staffList = [] } = useActiveStaff();

  // Mutations
  const escalateMutation = useEscalateOrder();
  const reassignMutation = useReassignStaff();
  const notifyMutation = useNotifyCustomer();
  const resolveMutation = useResolveDelay();

  // Modal Control States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'timeline', 'escalate', 'reassign', 'notify', 'resolve'

  const handleManualRefetch = () => {
    refetch();
    setLastRefreshed(new Date());
    toast.success("Delayed orders synced successfully.");
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      stage: "All",
      priority: "All",
      staffId: "All",
      issueType: "All",
      criticalOnly: false,
      resolved: "false"
    });
    setPage(1);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    if (items.length === 0) {
      toast.error("No delayed orders found to export.");
      return;
    }

    const headers = [
      "Order ID",
      "Customer Name",
      "Customer Phone",
      "Current Stage",
      "Assigned Staff",
      "Delay Duration (min)",
      "Expected Ready",
      "Priority",
      "Bottleneck Reason"
    ];

    const rows = items.map((o) => [
      o.orderNumber,
      o.customer?.name || "N/A",
      o.customer?.phone || "N/A",
      o.status?.toUpperCase() || "N/A",
      getStaffName(o.assigned_staff),
      o.delay_duration || 0,
      o.expectedReadyTime ? new Date(o.expectedReadyTime).toLocaleTimeString("en-IN") : "N/A",
      o.priority || "NORMAL",
      o.reason || "High Order Volume"
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((e) => e.map(val => `"${val}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `PVP_Delayed_Orders_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV report downloaded successfully.");
  };

  // Triggers for modals
  const handleOpenTimeline = (order) => {
    setSelectedOrder(order);
    setActiveModal("timeline");
  };

  const handleOpenEscalate = (order) => {
    setSelectedOrder(order);
    setActiveModal("escalate");
  };

  const handleOpenReassign = (order) => {
    setSelectedOrder(order);
    setActiveModal("reassign");
  };

  const handleOpenNotify = (order) => {
    setSelectedOrder(order);
    setActiveModal("notify");
  };

  const handleOpenResolve = (order) => {
    setSelectedOrder(order);
    setActiveModal("resolve");
  };

  // Mutation Triggers
  const handleConfirmEscalate = (payload) => {
    escalateMutation.mutate(payload);
  };

  const handleConfirmReassign = (payload) => {
    reassignMutation.mutate(payload);
  };

  const handleConfirmNotify = (payload) => {
    notifyMutation.mutate(payload);
  };

  const handleConfirmResolve = (payload) => {
    resolveMutation.mutate(payload);
  };

  // Local Pagination calculations
  const paginatedItems = items.slice((page - 1) * limit, page * limit);

  return (
    <div className="p-4 md:p-6 space-y-4 max-w-8xl mx-auto min-h-screen text-slate-800 dark:text-zinc-200">
      
      {/* Page Header */}
      <div className="sticky top-0 z-20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-4 rounded-3xl border border-slate-100 dark:border-zinc-850 shadow-sm transition-all duration-300">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>Delayed Orders</span>
            <Clock size={16} className="text-[var(--primary)] animate-pulse" />
          </h1>
          <p className="text-xs font-bold text-slate-400 dark:text-zinc-555 mt-0.5">
            Monitor SLA violations and operational bottlenecks.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Socket Badge */}
          <SocketStatusBadge connected={socketConnected} />

          {/* Sync Time */}
          <span className="text-[9px] font-black text-slate-400 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-850">
            UPDATED: {lastRefreshed.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
          </span>

          {/* Export CSV button */}
          <button
            onClick={handleExportCSV}
            className="h-8 px-3.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-400 border border-slate-150 dark:border-zinc-850 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer font-black text-[10px] uppercase tracking-wider shadow-sm"
          >
            <FileSpreadsheet size={11} className="text-emerald-600" />
            <span>Export CSV</span>
          </button>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefetch}
            className="h-8 w-8 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-950 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-400 border border-slate-150 dark:border-zinc-850 rounded-xl flex items-center justify-center transition-all cursor-pointer shadow-sm hover:rotate-180 duration-500"
            title="Refresh Console"
          >
            <RefreshCw size={12} />
          </button>
        </div>
      </div>

      {/* Critical Delay Alerts Row */}
      <CriticalDelayPanel
        orders={items}
        onEscalate={handleOpenEscalate}
      />

      {/* Summary Bento KPI Cards */}
      <DelayedSummaryCards orders={items} />

      {/* Table section */}
      <div className="space-y-4">
        
        {/* Filters */}
        <DelayedFilters
          filters={filters}
          onChange={(updated) => {
            setFilters(updated);
            setPage(1);
          }}
          onReset={handleResetFilters}
          staff={staffList}
        />

        {/* TanStack Orders Table */}
        <div className="w-full">
          <DelayedOrdersTable
            data={paginatedItems}
            isLoading={isLoading}
            onOpenTimeline={handleOpenTimeline}
            onOpenEscalate={handleOpenEscalate}
            onOpenReassign={handleOpenReassign}
            onOpenNotify={handleOpenNotify}
            onOpenResolve={handleOpenResolve}
          />
        </div>

        {/* Table Pagination & Layout Details */}
        {!isLoading && items.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-3 rounded-2.5xl shadow-sm text-xs font-bold text-slate-500 dark:text-zinc-400">
            <div>
              Showing <span className="text-slate-800 dark:text-white font-extrabold">{((page - 1) * limit) + 1}</span> to{" "}
              <span className="text-slate-800 dark:text-white font-extrabold">{Math.min(page * limit, items.length)}</span> of{" "}
              <span className="text-slate-800 dark:text-white font-extrabold">{items.length}</span> orders
            </div>
            
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-450 dark:text-zinc-550 uppercase">Rows per page:</span>
                <Select
                  value={limit}
                  onChange={(val) => {
                    setLimit(val);
                    setPage(1);
                  }}
                  className="w-16 h-8 text-[11px]"
                  classNames={{ popup: { root: "dark:bg-zinc-900" } }}
                  options={[
                    { value: 20, label: "20" },
                    { value: 50, label: "50" },
                    { value: 100, label: "100" }
                  ]}
                />
              </div>

              <Pagination
                current={page}
                pageSize={limit}
                total={items.length}
                onChange={(p) => setPage(p)}
                showSizeChanger={false}
                className="text-xs"
              />
            </div>
          </div>
        )}
      </div>

      {/* Modals Mounting */}
      <OrderTimelineModal
        visible={activeModal === "timeline"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
      />

      <EscalationModal
        visible={activeModal === "escalate"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onConfirm={handleConfirmEscalate}
      />

      <ReassignStaffModal
        visible={activeModal === "reassign"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onConfirm={handleConfirmReassign}
      />

      <CustomerNotificationModal
        visible={activeModal === "notify"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onConfirm={handleConfirmNotify}
      />

      <ResolveDelayModal
        visible={activeModal === "resolve"}
        onClose={() => setActiveModal(null)}
        order={selectedOrder}
        onConfirm={handleConfirmResolve}
      />
    </div>
  );
}
