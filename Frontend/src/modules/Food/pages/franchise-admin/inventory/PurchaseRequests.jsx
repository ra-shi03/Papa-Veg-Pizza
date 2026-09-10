import React, { useState, useEffect } from "react";
import { 
  Clipboard, CheckCircle, Package, Wallet, Search, ChevronDown, 
  RefreshCw, SlidersHorizontal, Trash2, Printer, Download, Eye, 
  Check, MoreVertical, Calendar, ChevronLeft, ChevronRight, User, 
  Clock, Plus, AlertCircle, ShieldAlert, FileText, Ban
} from "lucide-react";
import { toast } from "sonner";
import { 
  usePurchaseRequestsQuery, useApprovePurchaseRequestMutation, 
  useRejectPurchaseRequestMutation, useReceivePurchaseRequestMutation
} from "./hooks/usePurchaseRequests";
import { useUsersListQuery } from "./hooks/useAlerts";
import { useStores } from "./hooks/useStock";

// Connected Modals & Drawer
import CreatePurchaseRequestModal from "./components/CreatePurchaseRequestModal";
import ApproveRequestModal from "./components/ApproveRequestModal";
import RejectRequestModal from "./components/RejectRequestModal";
import MarkReceivedModal from "./components/MarkReceivedModal";
import PurchaseRequestDetailsDrawer from "./components/PurchaseRequestDetailsDrawer";

const PRIORITY_OPTIONS = [
  { value: "ALL", label: "All Priorities" },
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Urgent", label: "Urgent" }
];

const STATUS_OPTIONS = [
  { value: "ALL", label: "All Statuses" },
  { value: "Draft", label: "Draft" },
  { value: "Pending", label: "Pending Approval" },
  { value: "Approved", label: "Approved" },
  { value: "Ordered", label: "Ordered" },
  { value: "Received", label: "Received" },
  { value: "Rejected", label: "Rejected" }
];

export default function PurchaseRequests() {
  // Mock Role Simulation State
  // Roles: franchise_admin, store_manager, inventory_executive, finance_manager
  const [mockRole, setMockRole] = useState("franchise_admin");

  // Query Filters State
  const [filters, setFilters] = useState({
    search: "",
    status: "ALL",
    storeId: "", // comma separated list
    priority: "ALL",
    requestedBy: "",
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
  const [activeModal, setActiveModal] = useState(null); // 'create', 'approve', 'reject', 'receive'
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedRequestRecord, setSelectedRequestRecord] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Adjust filters automatically for Store Manager (only see own requests)
  const activeQueryParams = { 
    ...filters, 
    page, 
    limit,
    requestedBy: mockRole === "store_manager" ? "mgr-1" : filters.requestedBy 
  };

  const { data: prResponse, isLoading, isError, refetch } = usePurchaseRequestsQuery(activeQueryParams);
  const prList = prResponse?.data || [];
  const totalCount = prResponse?.totalCount || 0;
  const metrics = prResponse?.metrics || { pendingRequestsCount: 0, approvedRequestsCount: 0, receivedRequestsCount: 0, totalPurchaseValue: 0 };

  const { data: storesResponse } = useStores();
  const stores = storesResponse?.data || [];

  const { data: usersResponse } = useUsersListQuery();
  const users = usersResponse?.data || [];

  const approveMutation = useApprovePurchaseRequestMutation();

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
      status: "ALL",
      storeId: "",
      priority: "ALL",
      requestedBy: "",
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
    setSelectedRequestRecord(record);

    if (actionType === "view") {
      setIsDrawerOpen(true);
    } else if (actionType === "approve") {
      setActiveModal("approve");
    } else if (actionType === "reject") {
      setActiveModal("reject");
    } else if (actionType === "receive") {
      setActiveModal("receive");
    }
  };

  const toggleStoreSelection = (storeId) => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  // Row Selection logic
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedRows(prList.map((r) => r._id));
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
  const handleBulkApprove = () => {
    if (selectedRows.length === 0) return;
    const confirmApprove = window.confirm(`Approve ${selectedRows.length} purchase requisitions?`);
    if (!confirmApprove) return;

    selectedRows.forEach(id => {
      const record = prList.find(r => r._id === id);
      if (record && (record.status === "Pending" || record.status === "Draft")) {
        approveMutation.mutate({
          requestId: id,
          approvedItems: record.items.map(i => ({ ingredientId: i.ingredientId, approvedQty: i.requestedQty })),
          vendorId: "SUP-001",
          expectedDeliveryDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
          remarks: "Bulk approved by Franchise Admin."
        });
      }
    });

    setSelectedRows([]);
    toast.success("Bulk approval requests submitted.");
  };

  const handleBulkExport = () => {
    const selectedData = prList.filter(r => selectedRows.includes(r._id));
    if (selectedData.length === 0) return;

    const headers = ["Request No", "Store", "Requested By", "Priority", "Status", "Amount", "Created Date"];
    const rows = selectedData.map(r => [
      r.requestNumber,
      r.storeName,
      r.requesterName,
      r.priority,
      r.status,
      `₹${r.totalAmount}`,
      new Date(r.createdAt).toLocaleDateString("en-IN")
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `purchase_requests_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported ${selectedData.length} requisitions successfully!`);
  };

  const handleBulkPrint = () => {
    window.print();
  };

  const getPriorityBadge = (p) => {
    switch (p) {
      case "Urgent":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-red-650/10 text-red-650 dark:bg-red-950/20">
            Urgent
          </span>
        );
      case "High":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-orange-500/10 text-orange-650 dark:bg-orange-950/20">
            High
          </span>
        );
      case "Medium":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-blue-500/10 text-blue-600 dark:bg-blue-950/20">
            Medium
          </span>
        );
      case "Low":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case "Received":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-purple-500/10 text-purple-650 dark:bg-purple-950/20">
            Received
          </span>
        );
      case "Approved":
      case "Ordered":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-emerald-500/10 text-emerald-600 dark:bg-emerald-950/20">
            {s}
          </span>
        );
      case "Rejected":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-rose-500/10 text-rose-500 dark:bg-rose-950/20">
            Rejected
          </span>
        );
      case "Pending":
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-blue-500/10 text-blue-600 dark:bg-blue-950/20 animate-pulse">
            Pending
          </span>
        );
      case "Draft":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block bg-zinc-100 text-zinc-650 dark:bg-zinc-805">
            Draft
          </span>
        );
    }
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

  // Role Permissions Helpers
  const canCreate = mockRole === "franchise_admin" || mockRole === "store_manager" || mockRole === "inventory_executive";
  const canApprove = mockRole === "franchise_admin";
  const canReceive = mockRole === "franchise_admin" || mockRole === "inventory_executive";
  const canExport = mockRole === "franchise_admin" || mockRole === "finance_manager";

  // Loading skeleton
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900">
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 h-10" />
        <div className="divide-y divide-zinc-100 dark:divide-zinc-850">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4 animate-pulse">
              <div className="h-3.5 w-24 bg-zinc-150 dark:bg-zinc-800 rounded" />
              <div className="h-3.5 w-32 bg-zinc-150 dark:bg-zinc-800 rounded" />
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
      
      {/* Role Selection Sticky Panel */}
      <div className="fixed bottom-4 right-4 z-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2.5 rounded-2xl shadow-2xl flex items-center gap-2">
        <ShieldAlert size={14} className="text-[var(--primary)]" />
        <span className="text-[10px] font-black text-zinc-450 uppercase">Mock Role Selector:</span>
        <select
          value={mockRole}
          onChange={(e) => {
            setMockRole(e.target.value);
            toast.info(`Switched role simulation to ${e.target.value.replace("_", " ")}`);
          }}
          className="px-2 py-1 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-[10px] font-bold text-zinc-850 dark:text-white"
        >
          <option value="franchise_admin">Franchise Admin</option>
          <option value="store_manager">Store Manager (Subham)</option>
          <option value="inventory_executive">Inventory Executive</option>
          <option value="finance_manager">Finance Manager</option>
        </select>
      </div>

      {/* 1. Page Header Section */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2 mt-1">
            <Clipboard className="text-[var(--primary)] shrink-0" size={24} />
            <span>Purchase Requests</span>
          </h1>
          <p className="text-[10.5px] text-zinc-400 font-bold mt-0.5">
            Manage procurement requests and inventory replenishment across stores.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {isLoading && (
            <span className="flex items-center gap-1 text-[10px] text-[var(--primary)] font-bold animate-pulse mr-2">
              <RefreshCw className="animate-spin" size={10} />
              Syncing requests...
            </span>
          )}
          
          {canCreate && (
            <button
              onClick={() => setActiveModal("create")}
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl shadow-md active:scale-98 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={14} /> Create Requisition
            </button>
          )}

          <button
            onClick={() => refetch()}
            className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-xl transition-all cursor-pointer shadow-sm"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </header>

      {/* 2. Bento KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {/* Pending Requests (Blue) */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-450 uppercase font-black tracking-wider block">Pending Requests</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">
              {metrics.pendingRequestsCount}
            </span>
          </div>
          <span className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><Clipboard size={20} /></span>
        </div>

        {/* Approved Requests (Green) */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-450 uppercase font-black tracking-wider block">Approved / Ordered</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">
              {metrics.approvedRequestsCount}
            </span>
          </div>
          <span className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle size={20} /></span>
        </div>

        {/* Received Orders (Purple) */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-855 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-450 uppercase font-black tracking-wider block">Received Orders</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">
              {metrics.receivedRequestsCount}
            </span>
          </div>
          <span className="p-3 bg-purple-500/10 text-purple-650 rounded-xl"><Package size={20} /></span>
        </div>

        {/* Total Purchase Value (Orange) */}
        <div className="p-4 bg-white dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[9.5px] text-zinc-450 uppercase font-black tracking-wider block">Total Requisition Value</span>
            <span className="text-lg font-black text-zinc-900 dark:text-white block">
              ₹{metrics.totalPurchaseValue ? Math.round(metrics.totalPurchaseValue).toLocaleString("en-IN") : "0"}
            </span>
          </div>
          <span className="p-3 bg-orange-500/10 text-orange-500 rounded-xl"><Wallet size={20} /></span>
        </div>
      </section>

      {/* 3. Filter Controls Section */}
      <section className="p-4 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm flex flex-wrap items-center gap-3 shrink-0">
        
        {/* Search */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Search Requisitions</span>
          <div className="relative">
            <input
              type="text"
              placeholder="PR No, store, ingredient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] outline-none min-w-[200px]"
            />
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          </div>
        </div>

        {/* Status Filter */}
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
                <p className="text-[8.5px] text-zinc-455 uppercase font-black pb-1 border-b dark:border-zinc-850">Select Stores</p>
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

        {/* Priority Filter */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Priority</span>
          <select
            value={filters.priority}
            onChange={(e) => { setFilters(prev => ({ ...prev, priority: e.target.value })); setPage(1); }}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-white font-bold cursor-pointer"
          >
            {PRIORITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {/* Requested By (Requester select) */}
        {mockRole !== "store_manager" && (
          <div className="space-y-1">
            <span className="text-[9px] uppercase text-zinc-450 font-extrabold tracking-wider block">Requested By</span>
            <select
              value={filters.requestedBy}
              onChange={(e) => { setFilters(prev => ({ ...prev, requestedBy: e.target.value })); setPage(1); }}
              className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-800 dark:text-white font-bold cursor-pointer"
            >
              <option value="">All Requesters</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
          </div>
        )}

        {/* Date Range */}
        <div className="space-y-1">
          <span className="text-[9px] uppercase text-zinc-455 font-extrabold block">Requisition Date Range</span>
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-805 dark:text-white font-bold animate-fade-in"
            />
            <span className="text-zinc-400 font-bold">to</span>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-zinc-805 dark:text-white font-bold animate-fade-in"
            />
          </div>
        </div>

        {/* Reset */}
        <div className="flex gap-2 pt-4">
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-55 dark:hover:bg-zinc-900 rounded-lg text-zinc-500 transition-all cursor-pointer font-bold"
          >
            Reset
          </button>
        </div>
      </section>

      {/* 4. Bulk Actions */}
      {selectedRows.length > 0 && (
        <section className="p-3 bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 rounded-2xl flex items-center justify-between gap-4 animate-fade-in font-bold">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[var(--primary)] animate-pulse" />
            <span>{selectedRows.length} Purchase Requests selected</span>
          </div>
          <div className="flex items-center gap-2">
            {canApprove && (
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm cursor-pointer"
              >
                Approve Selected
              </button>
            )}

            {canExport && (
              <button
                onClick={handleBulkExport}
                className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-705 dark:text-zinc-300 rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Download size={12} /> Export CSV
              </button>
            )}

            <button
              onClick={handleBulkPrint}
              className="px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-705 dark:text-zinc-300 rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <Printer size={12} /> Print
            </button>
          </div>
        </section>
      )}

      {/* 5. Requisitions Table */}
      {isLoading ? (
        renderLoadingSkeleton()
      ) : isError ? (
        <div className="border border-red-200 dark:border-red-900/50 bg-red-50/20 dark:bg-red-950/10 p-6 rounded-2xl text-center space-y-3 font-semibold text-zinc-650">
          <AlertCircle size={32} className="mx-auto text-red-550" />
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">Unable to load purchase requests</h3>
          <p className="text-[10px] text-zinc-400 max-w-sm mx-auto">
            A database loading error occurred. Please verify local storage mock cache config or retry.
          </p>
          <button onClick={() => refetch()} className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl">
            Retry Loading
          </button>
        </div>
      ) : prList.length === 0 ? (
        <div className="border border-zinc-250 dark:border-zinc-850 p-10 rounded-2xl text-center space-y-4 bg-white dark:bg-zinc-900/20 font-bold">
          <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-350">
            <Clipboard size={32} />
          </div>
          <div>
            <h3 className="text-sm font-black text-zinc-850 dark:text-white">No purchase requests found</h3>
            <p className="text-[10px] text-zinc-400 mt-1 max-w-xs mx-auto">
              There are currently no requisitions matching your search criteria.
            </p>
          </div>
          {canCreate && (
            <button onClick={() => setActiveModal("create")} className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-black rounded-xl cursor-pointer">
              Create Purchase Request
            </button>
          )}
        </div>
      ) : (
        <div className="border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-sm bg-white dark:bg-zinc-900/20 overflow-hidden font-bold">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50/70 dark:bg-zinc-950/40 border-b border-zinc-150 dark:border-zinc-850 text-[9.5px] uppercase text-zinc-450 tracking-wider font-extrabold sticky top-0 z-10">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={prList.length > 0 && selectedRows.length === prList.length}
                      onChange={handleSelectAll}
                      className="rounded border-zinc-300 accent-[var(--primary)]"
                    />
                  </th>
                  <th className="p-3">Request No</th>
                  <th className="p-3">Store Outlet</th>
                  <th className="p-3">Requested By</th>
                  <th className="p-3 text-right">Estimate Cost</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created Date</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-bold text-zinc-700 dark:text-zinc-300">
                {prList.map((r) => (
                  <tr 
                    key={r._id}
                    className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-all ${
                      selectedRows.includes(r._id) ? "bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10" : ""
                    }`}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(r._id)}
                        onChange={() => handleSelectRow(r._id)}
                        className="rounded border-zinc-300 accent-[var(--primary)]"
                      />
                    </td>
                    <td className="p-3">
                      <button 
                        type="button"
                        onClick={() => handleAction("view", r)}
                        className="text-[var(--primary)] font-black font-mono hover:underline text-left cursor-pointer"
                      >
                        {r.requestNumber}
                      </button>
                    </td>
                    <td className="p-3">
                      <div>
                        <p className="text-zinc-855 dark:text-white leading-tight">{r.storeName}</p>
                        <p className="text-[9px] text-zinc-400 mt-0.5 font-mono">{r.storeCode}</p>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-[9px] font-black shrink-0">
                          {r.requesterName?.charAt(0) || "U"}
                        </div>
                        <span className="truncate max-w-[120px]">{r.requesterName}</span>
                      </div>
                    </td>
                    <td className="p-3 text-right font-mono text-zinc-900 dark:text-white font-extrabold">
                      ₹{r.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="p-3">
                      {getPriorityBadge(r.priority)}
                    </td>
                    <td className="p-3">
                      {getStatusBadge(r.status)}
                    </td>
                    <td className="p-3 text-zinc-450 font-bold text-[10.5px]">
                      <span className="flex items-center gap-1 font-bold">
                        <Clock size={10} className="text-zinc-350" />
                        {getRelativeTime(r.createdAt)}
                      </span>
                    </td>
                    <td className="p-3 text-right relative">
                      <button
                        onClick={() => setActiveMenuId(activeMenuId === r._id ? null : r._id)}
                        className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-450"
                      >
                        <MoreVertical size={14} />
                      </button>

                      {activeMenuId === r._id && (
                        <>
                          <div className="fixed inset-0 z-20" onClick={() => setActiveMenuId(null)} />
                          <div className="absolute right-3 top-10 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 w-44 text-left z-30 font-bold text-zinc-650 dark:text-zinc-350">
                            <button
                              onClick={() => handleAction("view", r)}
                              className="w-full px-3 py-2 hover:bg-zinc-55 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-[10.5px]"
                            >
                              <Eye size={12} className="text-zinc-400" />
                              <span>View PR details</span>
                            </button>

                            {canApprove && (r.status === "Pending" || r.status === "Draft") && (
                              <>
                                <button
                                  onClick={() => handleAction("approve", r)}
                                  className="w-full px-3 py-2 hover:bg-zinc-55 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-[10.5px] text-emerald-600"
                                >
                                  <Check size={12} className="text-emerald-500" />
                                  <span>Approve Request</span>
                                </button>
                                <button
                                  onClick={() => handleAction("reject", r)}
                                  className="w-full px-3 py-2 hover:bg-zinc-55 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-[10.5px] text-rose-600"
                                >
                                  <Ban size={12} className="text-rose-500" />
                                  <span>Reject Request</span>
                                </button>
                              </>
                            )}

                            {canReceive && r.status === "Approved" && (
                              <button
                                onClick={() => handleAction("receive", r)}
                                className="w-full px-3 py-2 hover:bg-zinc-55 dark:hover:bg-zinc-900 text-left flex items-center gap-2 text-[10.5px] text-purple-650"
                              >
                                <Package size={12} className="text-purple-500" />
                                <span>Mark Received</span>
                              </button>
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

          {/* Pagination */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 flex flex-col sm:flex-row items-center justify-between gap-4 font-bold text-zinc-500 text-[10.5px]">
            <div>
              Showing {Math.min(totalCount, (page - 1) * limit + 1)} to {Math.min(totalCount, page * limit)} of {totalCount} requests
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

      {/* Connected Create Modal */}
      <CreatePurchaseRequestModal
        isOpen={activeModal === "create"}
        onClose={() => { setActiveModal(null); setSelectedRequestRecord(null); }}
      />

      {/* Connected Approve Modal */}
      <ApproveRequestModal
        isOpen={activeModal === "approve"}
        onClose={() => { setActiveModal(null); setSelectedRequestRecord(null); }}
        requestRecord={selectedRequestRecord}
      />

      {/* Connected Reject Modal */}
      <RejectRequestModal
        isOpen={activeModal === "reject"}
        onClose={() => { setActiveModal(null); setSelectedRequestRecord(null); }}
        requestId={selectedRequestRecord?._id}
        requestNumber={selectedRequestRecord?.requestNumber}
      />

      {/* Connected Mark Received Modal */}
      <MarkReceivedModal
        isOpen={activeModal === "receive"}
        onClose={() => { setActiveModal(null); setSelectedRequestRecord(null); }}
        requestRecord={selectedRequestRecord}
      />

      {/* Connected Details Drawer */}
      <PurchaseRequestDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => { setIsDrawerOpen(false); setSelectedRequestRecord(null); }}
        requestId={selectedRequestRecord?._id}
        onApprove={(rec) => { setIsDrawerOpen(false); handleAction("approve", rec); }}
        onReject={(rec) => { setIsDrawerOpen(false); handleAction("reject", rec); }}
        onReceive={(rec) => { setIsDrawerOpen(false); handleAction("receive", rec); }}
      />

    </div>
  );
}
