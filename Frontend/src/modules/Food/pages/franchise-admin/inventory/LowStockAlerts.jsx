import React, { useState, useEffect } from "react";
import { 
  Bell, AlertTriangle, CheckCircle, Store, Search, ChevronDown, 
  RefreshCw, SlidersHorizontal, Trash2, Printer, Download, Eye, 
  Check, MoreVertical, Calendar, ChevronLeft, ChevronRight, User, Clock,
  ShoppingBag
} from "lucide-react";
import { toast } from "sonner";
import { 
  useAlertsQuery, useUpdateAlertMutation, useResolveAlertMutation, 
  useCreatePurchaseRequestMutation, useUsersListQuery 
} from "./hooks/useAlerts";
import { useStores } from "./hooks/useStock";

// Connected Modals & Drawer components
import ResolveAlertModal from "./components/ResolveAlertModal";
import CreatePurchaseRequestModal from "./components/CreatePurchaseRequestModal";
import AlertDetailsDrawer from "./components/AlertDetailsDrawer";

const SEVERITY_OPTIONS = [
  { value: "ALL", label: "All Severities" },
  { value: "LOW", label: "Low" },
  { value: "CRITICAL", label: "Critical" }
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "OPEN", label: "Open" },
  { value: "PURCHASE REQUEST CREATED", label: "PR Created" },
  { value: "IN PROGRESS", label: "In Progress" },
  { value: "RESOLVED", label: "Resolved" }
];

export default function LowStockAlerts() {
  // Query Filters State
  const [filters, setFilters] = useState({
    search: "",
    storeId: "", // comma separated list
    severity: "ALL",
    status: "ALL",
    assignedTo: "",
    startDate: "",
    endDate: ""
  });

  // Debounced search text
  const [searchTerm, setSearchTerm] = useState("");

  // Store select state (multi-select popover)
  const [selectedStores, setSelectedStores] = useState([]);
  const [showStorePopover, setShowStorePopover] = useState(false);

  // Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Row selection state
  const [selectedRows, setSelectedRows] = useState([]);

  // Overlay states
  const [activeModal, setActiveModal] = useState(null); // 'resolve', 'purchase_request'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedAlertRecord, setSelectedAlertRecord] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Real-time notification/polling simulation state
  const [isPolling, setIsPolling] = useState(true);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Query alerts list
  const queryParams = { ...filters, page, limit };
  const { data: alertsResponse, isLoading, isError, refetch } = useAlertsQuery(queryParams);
  const alertsList = alertsResponse?.data || [];
  const totalCount = alertsResponse?.totalCount || 0;
  const metrics = alertsResponse?.metrics || { openAlertsCount: 0, criticalAlertsCount: 0, resolvedAlertsCount: 0, storesAffectedCount: 0 };

  // Query stores for filters
  const { data: storesResponse } = useStores();
  const stores = storesResponse?.data || [];

  // Query users for assignee selection
  const { data: usersResponse } = useUsersListQuery();
  const users = usersResponse?.data || [];

  // Mutations
  const resolveMutation = useResolveAlertMutation();
  const updateAlertMutation = useUpdateAlertMutation();

  // Sync store multi-select to query params
  const handleApplyStoresFilter = () => {
    setFilters((prev) => ({
      ...prev,
      storeId: selectedStores.join(",")
    }));
    setPage(1);
    setShowStorePopover(false);
  };

  const handleResetFilters = () => {
    setFilters({
      search: "",
      storeId: "",
      severity: "ALL",
      status: "ALL",
      assignedTo: "",
      startDate: "",
      endDate: ""
    });
    setSearchTerm("");
    setSelectedStores([]);
    setPage(1);
    toast.success("Filters reset successfully");
  };

  const handleAction = (actionType, record) => {
    setActiveMenuId(null);
    setSelectedAlertRecord(record);

    if (actionType === "view") {
      setIsDrawerOpen(true);
    } else if (actionType === "resolve") {
      setActiveModal("resolve");
    } else if (actionType === "purchase_request") {
      setActiveModal("purchase_request");
    }
  };

  // Row Selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(alertsList.map((a) => a._id));
    } else {
      setSelectedRows([]);
    }
  };

  const handleSelectRow = (id) => {
    setSelectedRows((prev) =>
      prev.includes(id) ? prev.filter((rowId) => rowId !== id) : [...prev, id]
    );
  };

  // Bulk Actions
  const handleBulkResolve = () => {
    if (selectedRows.length === 0) return;
    
    // Perform bulk resolution simulation
    const confirmBatch = window.confirm(`Are you sure you want to mark ${selectedRows.length} alerts as resolved?`);
    if (!confirmBatch) return;

    // Simulate batch execution
    selectedRows.forEach(id => {
      resolveMutation.mutate({
        alertId: id,
        resolutionType: "Manual Adjustment",
        quantityAdded: 0,
        remarks: "Bulk resolution action performed by administrator."
      });
    });

    setSelectedRows([]);
    toast.success(`Processing bulk resolution for ${selectedRows.length} alerts.`);
  };

  const handleBulkAssign = (userId) => {
    if (selectedRows.length === 0) return;
    const userObj = users.find(u => u.id === userId);
    
    selectedRows.forEach(id => {
      updateAlertMutation.mutate({
        id,
        updates: { assignedTo: userId }
      });
    });

    setSelectedRows([]);
    toast.success(`Assigned ${selectedRows.length} alerts to ${userObj ? userObj.name : "selected user"}.`);
  };

  const handleBulkExport = () => {
    const selectedData = alertsList.filter(a => selectedRows.includes(a._id));
    if (selectedData.length === 0) return;

    const headers = ["Alert ID", "Ingredient", "Code", "Store", "Current Stock", "Reorder Level", "Severity", "Status", "Assigned To", "Created Date"];
    const rows = selectedData.map(a => [
      a._id,
      a.ingredient?.name,
      a.ingredient?.ingredientCode,
      a.storeName,
      `${a.currentStock} ${a.ingredient?.unit}`,
      `${a.reorderLevel} ${a.ingredient?.unit}`,
      a.severity,
      a.status,
      a.assignedUser?.name || "Unassigned",
      new Date(a.createdAt).toLocaleDateString("en-IN")
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `low_stock_alerts_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedData.length} alerts successfully!`);
  };

  // Toggle store in multi-select list
  const toggleStoreSelection = (storeId) => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  // Status badges color definitions
  const getStatusBadge = (status) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20">
            Resolved
          </span>
        );
      case "PURCHASE REQUEST CREATED":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-purple-500/10 text-purple-600 dark:bg-purple-950/20">
            PR Created
          </span>
        );
      case "IN PROGRESS":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-indigo-500/10 text-indigo-650 dark:bg-indigo-950/20 animate-pulse">
            In Progress
          </span>
        );
      case "OPEN":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-blue-500/10 text-blue-600 dark:bg-blue-950/20">
            Open
          </span>
        );
    }
  };

  const getSeverityBadge = (sev) => {
    if (sev === "CRITICAL") {
      return (
        <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-red-650/10 text-red-650 dark:bg-red-950/20">
          Critical
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-amber-500/10 text-amber-600 dark:bg-amber-950/20">
        Low
      </span>
    );
  };

  const getRelativeTime = (isoStr) => {
    if (!isoStr) return "N/A";
    const elapsed = Date.now() - new Date(isoStr).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Real-time polling simulator to show connection activity
  useEffect(() => {
    if (!isPolling) return;
    const interval = setInterval(() => {
      // Simulate checking for new alerts in real-time
      refetch();
    }, 15000); // Poll database cache every 15s

    return () => clearInterval(interval);
  }, [isPolling, refetch]);

  // Skeletal loader
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 h-10" />
        <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-zinc-200 dark:bg-zinc-800 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-3 w-1/3 bg-zinc-200 dark:bg-zinc-800 rounded" />
                  <div className="h-2 w-1/4 bg-zinc-100 dark:bg-zinc-850 rounded" />
                </div>
              </div>
              <div className="h-3.5 w-24 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-16 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-16 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-12 bg-zinc-150 dark:bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6 space-y-6 bg-zinc-50/40 dark:bg-zinc-950 min-h-screen text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      
      {/* 1. Page Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Bell className="text-[var(--primary)] shrink-0" size={24} />
            <span>Low Stock Alerts</span>
          </h1>
          <p className="text-[10.5px] text-zinc-400 font-bold mt-0.5">
            Monitor and resolve ingredient shortages across store outlets.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-3 py-1.5 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm text-[10px]">
            <span className={`w-2 h-2 rounded-full ${isPolling ? "bg-emerald-500 animate-pulse" : "bg-zinc-350"}`} />
            <span className="font-extrabold text-zinc-500">
              {isPolling ? "Real-time Monitoring Active" : "Monitoring Paused"}
            </span>
            <button 
              onClick={() => setIsPolling(!isPolling)}
              className="text-[9.5px] font-black text-[var(--primary)] ml-1 border-l pl-2 dark:border-zinc-800 hover:underline cursor-pointer"
            >
              {isPolling ? "Pause" : "Resume"}
            </button>
          </div>
          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-xl transition-all cursor-pointer shadow-sm"
            title="Force refresh"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* 2. Bento KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Alerts (Blue) */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-450 uppercase font-black tracking-wider block">Open Alerts</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">
              {metrics.openAlertsCount}
            </span>
          </div>
          <span className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Bell size={20} /></span>
        </div>

        {/* Critical Alerts (Red) */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-450 uppercase font-black tracking-wider block">Critical Alerts</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">
              {metrics.criticalAlertsCount}
            </span>
          </div>
          <span className="p-3 bg-red-500/10 text-red-500 rounded-xl"><AlertTriangle size={20} /></span>
        </div>

        {/* Resolved Alerts (Green) */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-855 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-450 uppercase font-black tracking-wider block">Resolved Alerts</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">
              {metrics.resolvedAlertsCount}
            </span>
          </div>
          <span className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle size={20} /></span>
        </div>

        {/* Stores Affected (Orange) */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-450 uppercase font-black tracking-wider block">Stores Affected</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">
              {metrics.storesAffectedCount}
            </span>
          </div>
          <span className="p-3 bg-orange-500/10 text-orange-500 rounded-xl"><Store size={20} /></span>
        </div>
      </section>

      {/* 3. Filter Controls Section */}
      <section className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex flex-wrap items-center gap-3 shrink-0">
        
        {/* Ingredient Search */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Ingredient Search</span>
          <div className="relative">
            <input
              type="text"
              placeholder="Name, code, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none min-w-[180px]"
            />
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>

        {/* Store Multi-Select */}
        <div className="space-y-1 relative">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Filter Stores</span>
          <button
            type="button"
            onClick={() => setShowStorePopover(!showStorePopover)}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-left text-zinc-800 dark:text-white font-bold flex items-center justify-between min-w-[140px] cursor-pointer"
          >
            <span>
              {selectedStores.length === 0 ? "All Outlets" : `${selectedStores.length} Selected`}
            </span>
            <ChevronDown size={12} className="text-zinc-400" />
          </button>

          {showStorePopover && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowStorePopover(false)} />
              <div className="absolute left-0 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xl p-2 w-60 z-40 text-left font-bold text-zinc-650 dark:text-zinc-350 space-y-2">
                <p className="text-[8.5px] text-zinc-450 uppercase font-black pb-1 border-b dark:border-zinc-850">Select Stores</p>
                <div className="max-h-40 overflow-y-auto space-y-1 scrollbar-thin">
                  {stores.map((s) => (
                    <label key={s._id} className="flex items-center gap-2 px-1 py-0.5 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded cursor-pointer text-[10.5px]">
                      <input
                        type="checkbox"
                        checked={selectedStores.includes(s._id)}
                        onChange={() => toggleStoreSelection(s._id)}
                        className="rounded border-zinc-300 accent-[var(--primary)]"
                      />
                      <span>{s.storeName.replace("Papa Veg Pizza - ", "")}</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-1.5 pt-1 border-t dark:border-zinc-850">
                  <button
                    onClick={() => { setSelectedStores([]); setFilters(prev => ({ ...prev, storeId: "" })); setShowStorePopover(false); }}
                    className="px-2 py-1 text-[9px] border rounded hover:bg-zinc-50 dark:hover:bg-zinc-900"
                  >
                    Clear
                  </button>
                  <button
                    onClick={handleApplyStoresFilter}
                    className="px-2 py-1 bg-[var(--primary)] text-white rounded hover:bg-[var(--primary-hover)] font-black"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Severity */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Severity</span>
          <select
            value={filters.severity}
            onChange={(e) => { setFilters(prev => ({ ...prev, severity: e.target.value })); setPage(1); }}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-white font-bold cursor-pointer"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Status</span>
          <select
            value={filters.status}
            onChange={(e) => { setFilters(prev => ({ ...prev, status: e.target.value })); setPage(1); }}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-white font-bold cursor-pointer"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Assigned User */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Assigned User</span>
          <select
            value={filters.assignedTo}
            onChange={(e) => { setFilters(prev => ({ ...prev, assignedTo: e.target.value })); setPage(1); }}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-white font-bold cursor-pointer"
          >
            <option value="">All Assignees</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {/* Created Date Range */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Created Date Range</span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-805 dark:text-white font-bold"
            />
            <span className="text-zinc-400 font-bold">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-805 dark:text-white font-bold"
            />
          </div>
        </div>

        {/* Actions buttons */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-55 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 transition-all cursor-pointer"
          >
            Reset
          </button>
        </div>
      </section>

      {/* 4. Bulk Actions Panel */}
      {selectedRows.length > 0 && (
        <section className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-bold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span>{selectedRows.length} Low stock alerts selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkResolve}
              className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg shadow-sm cursor-pointer"
            >
              Resolve Selected
            </button>

            {/* Quick user assignment dropdown */}
            <div className="relative group">
              <button className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg cursor-pointer flex items-center gap-1.5">
                <span>Assign Responsibility</span>
                <ChevronDown size={12} />
              </button>
              <div className="absolute right-0 bottom-full mb-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl w-48 hidden group-hover:block z-55">
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => handleBulkAssign(u.id)}
                    className="w-full text-left p-2 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-extrabold text-zinc-700 dark:text-zinc-300 block text-[10.5px] border-b last:border-0 dark:border-zinc-850"
                  >
                    {u.name}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleBulkExport}
              className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Download size={12} /> Export CSV
            </button>
          </div>
        </section>
      )}

      {/* 5. Alerts Table / Content Area */}
      {isLoading ? (
        renderLoadingSkeleton()
      ) : isError ? (
        <div className="border border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10 p-6 rounded-2xl text-center space-y-3 font-semibold text-zinc-650">
          <AlertTriangle size={32} className="mx-auto text-red-550" />
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">Unable to load alerts</h3>
          <p className="text-[10px] text-zinc-400 max-w-sm mx-auto">
            A network database connection discrepancy occurred while loading the low stock registers. Please retry.
          </p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl">
            Retry Loading
          </button>
        </div>
      ) : alertsList.length === 0 ? (
        <div className="border border-zinc-250 dark:border-zinc-850 p-10 rounded-2xl text-center space-y-4 bg-white dark:bg-zinc-900/20">
          <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-350">
            <CheckCircle size={32} />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-850 dark:text-white">No low stock alerts found</h3>
            <p className="text-[10px] text-zinc-400 mt-1 max-w-xs mx-auto">
              All ingredients at all stores are currently healthy and holding sufficient stock.
            </p>
          </div>
          <button onClick={() => refetch()} className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 font-bold rounded-xl cursor-pointer">
            Refresh Alerts
          </button>
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm bg-white dark:bg-zinc-900/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-850 text-[9.5px] uppercase text-zinc-450 tracking-wider font-extrabold sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={alertsList.length > 0 && selectedRows.length === alertsList.length}
                      onChange={handleSelectAll}
                      className="rounded border-zinc-300 accent-[var(--primary)]"
                    />
                  </th>
                  <th className="p-3">Ingredient</th>
                  <th className="p-3">Store</th>
                  <th className="p-3">Current Stock</th>
                  <th className="p-3">Reorder Level</th>
                  <th className="p-3">Severity</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-bold text-zinc-700 dark:text-zinc-300">
                {alertsList.map((a) => (
                  <tr 
                    key={a._id}
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all ${
                      selectedRows.includes(a._id) ? "bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10" : ""
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(a._id)}
                        onChange={() => handleSelectRow(a._id)}
                        className="rounded border-zinc-300 accent-[var(--primary)]"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={a.ingredient?.image}
                          alt={a.ingredient?.name}
                          className="w-8 h-8 rounded-lg object-cover border dark:border-zinc-800 bg-white"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=100&q=80";
                          }}
                        />
                        <div>
                          <p className="font-extrabold text-zinc-900 dark:text-white leading-tight">{a.ingredient?.name}</p>
                          <p className="text-[9px] text-zinc-400 font-bold mt-0.5 font-mono">
                            {a.ingredient?.ingredientCode} | SKU: {a.ingredient?.sku}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-zinc-850 dark:text-white">{a.storeName}</p>
                        <p className="text-[9px] text-zinc-400 font-bold font-mono mt-0.5">{a.storeCode}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-black text-zinc-850 dark:text-white">
                        {a.currentStock}
                      </span>
                      <span className="text-[10px] text-zinc-400 font-bold ml-1">{a.ingredient?.unit}</span>
                    </td>
                    <td className="p-3 text-zinc-650 dark:text-zinc-400">
                      <span>{a.reorderLevel}</span>
                      <span className="text-[9.5px] ml-1">{a.ingredient?.unit}</span>
                    </td>
                    <td className="p-3">
                      {getSeverityBadge(a.severity)}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(a.status)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[9px] font-black shrink-0">
                          {a.assignedUser?.name?.charAt(0) || "U"}
                        </div>
                        <span className="truncate max-w-[100px] text-zinc-700 dark:text-zinc-350">{a.assignedUser?.name || "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="p-3 text-zinc-450 text-[10.5px]">
                      <span className="flex items-center gap-1 font-bold">
                        <Clock size={10} className="text-zinc-350" />
                        {getRelativeTime(a.createdAt)}
                      </span>
                    </td>
                    <td className="p-3 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === a._id ? null : a._id)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-450"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeMenuId === a._id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-3 top-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 w-44 text-left z-30 font-bold text-zinc-650 dark:text-zinc-350">
                            <button
                              onClick={() => handleAction("view", a)}
                              className="w-full px-3 py-2 hover:bg-zinc-55 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-[10.5px]"
                            >
                              <Eye size={12} className="text-zinc-400" />
                              <span>View Alert Details</span>
                            </button>
                            
                            {a.status !== "RESOLVED" && (
                              <>
                                <button
                                  onClick={() => handleAction("resolve", a)}
                                  className="w-full px-3 py-2 hover:bg-zinc-55 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-[10.5px] text-emerald-600"
                                >
                                  <CheckCircle size={12} className="text-emerald-500" />
                                  <span>Resolve Alert</span>
                                </button>
                                <button
                                  onClick={() => handleAction("purchase_request", a)}
                                  className="w-full px-3 py-2 hover:bg-zinc-55 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-[10.5px] text-purple-650"
                                >
                                  <ShoppingBag size={12} className="text-purple-500" />
                                  <span>Create PR Request</span>
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination bar */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold text-zinc-500 text-[10.5px]">
            <div>
              Showing {Math.min(totalCount, (page - 1) * limit + 1)} to {Math.min(totalCount, page * limit)} of {totalCount} alerts
            </div>
            
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              
              <span className="text-zinc-800 dark:text-white font-extrabold px-2">Page {page}</span>

              <button
                onClick={() => setPage(p => (page * limit < totalCount ? p + 1 : p))}
                disabled={page * limit >= totalCount}
                className="p-1.5 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </footer>
        </div>
      )}

      {/* Connected Drawer Panel */}
      <AlertDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        alertId={selectedAlertRecord?._id}
        onResolve={(rec) => { setIsDrawerOpen(false); handleAction("resolve", rec); }}
        onCreatePR={(rec) => { setIsDrawerOpen(false); handleAction("purchase_request", rec); }}
      />

      {/* Connected Resolve Modal */}
      <ResolveAlertModal
        isOpen={activeModal === "resolve"}
        onClose={() => { setActiveModal(null); setSelectedAlertRecord(null); }}
        alertRecord={selectedAlertRecord}
      />

      {/* Connected Purchase Request Modal */}
      <CreatePurchaseRequestModal
        isOpen={activeModal === "purchase_request"}
        onClose={() => { setActiveModal(null); setSelectedAlertRecord(null); }}
        alertRecord={selectedAlertRecord}
      />

    </div>
  );
}
