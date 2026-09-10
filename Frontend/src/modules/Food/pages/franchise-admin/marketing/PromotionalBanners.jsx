import React, { useState, useEffect, useMemo } from "react";
import { Table, Tag, Tooltip, Pagination, Skeleton, Switch } from "antd";
import { 
  Plus, Download, RefreshCw, Search, Eye, Edit, 
  Trash2, Play, Pause, Calendar, Clock, Sparkles, 
  Layers, Link2, Filter, ArrowUp10, Grid, List, 
  AlertTriangle, CheckCircle, Activity, ExternalLink
} from "lucide-react";
import { useBanners } from "./hooks/useBanners";
import BannerModals from "./components/BannerModals";
import { toast } from "sonner";

export default function PromotionalBanners() {
  const bannersHook = useBanners();
  const {
    loading,
    banners,
    totalRecords,
    stores,
    loadingStores,
    products,
    categories,
    coupons,
    campaigns,

    // Filters
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    redirectTypeFilter,
    setRedirectTypeFilter,
    storeIdFilter,
    setStoreIdFilter,
    handleResetFilters,

    // Pagination & Sorting
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Selection
    selectedBanner,
    setSelectedBanner,

    // Operations & KPIs
    dashboardStats,
    createBanner,
    updateBanner,
    deleteBanner,
    updateBannerStatus
  } = bannersHook;

  // Debounced search state
  const [localSearch, setLocalSearch] = useState(search);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // View state: 'grid' or 'table'
  const [viewMode, setViewMode] = useState("grid");

  // Modal Visibility States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewDrawer, setShowPreviewDrawer] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Refresh trigger
  const handleRefresh = () => {
    toast.success("Refreshing banners directory...");
    setCurrentPage(1);
  };

  // Export Banners list to CSV
  const handleExportCSV = () => {
    if (banners.length === 0) {
      toast.warning("No banner data available to export.");
      return;
    }
    const filename = `Promotional_Banners_Index_${new Date().toISOString().split("T")[0]}.csv`;
    const headers = ["Title", "Subtitle", "Redirect Type", "Redirect ID", "Stores Assignment", "Priority", "Start Date", "End Date", "Status", "Created By"];
    
    const csvRows = [
      headers.join(","),
      ...banners.map(b => {
        const assignedStores = b.stores && b.stores.length > 0 
          ? `"${b.stores.map(id => stores.find(s => s._id === id)?.name || "Unknown Store").join(" | ")}"`
          : "Global";

        return [
          `"${b.title.replace(/"/g, '""')}"`,
          `"${(b.subtitle || "").replace(/"/g, '""')}"`,
          b.redirectType,
          `"${b.redirectId}"`,
          assignedStores,
          b.priority,
          b.startDate,
          b.endDate,
          b.status,
          `"${b.createdBy || "Admin"}"`
        ].join(",");
      })
    ];

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Banners catalog exported to CSV successfully!");
    }
  };

  // Helper for redirection labels
  const getRedirectText = (type, targetId) => {
    if (!type || !targetId) return "N/A";
    let name = "Unknown";
    switch (type) {
      case "product":
        name = products.find(p => p._id === targetId)?.name || "Pizza Product";
        return `🍕 Product: ${name}`;
      case "category":
        name = categories.find(c => c._id === targetId)?.name || "Category";
        return `📁 Category: ${name}`;
      case "coupon":
        name = coupons.find(c => c._id === targetId)?.code || "Coupon";
        return `🎟️ Coupon: ${name}`;
      case "campaign":
        name = campaigns.find(c => c._id === targetId)?.campaignName || "Campaign";
        return `📢 Campaign: ${name}`;
      default:
        return "N/A";
    }
  };

  // Helper to check store visibility names
  const getStoresLabel = (storeIds) => {
    if (!storeIds || storeIds.length === 0) return "Global (All Outlets)";
    if (storeIds.length === stores.length) return "All Outlets";
    if (storeIds.length === 1) {
      return stores.find(s => s._id === storeIds[0])?.name || "1 Outlet";
    }
    return `${storeIds.length} Outlets`;
  };

  // Render priority badges
  const renderPriorityBadge = (priority) => {
    if (priority <= 3) {
      return <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">High ({priority})</span>;
    }
    if (priority <= 7) {
      return <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">Medium ({priority})</span>;
    }
    return <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-black uppercase">Low ({priority})</span>;
  };

  // Render status badges based on computing
  const renderStatusBadge = (banner) => {
    const status = banner.computedStatus;
    switch (status) {
      case "active":
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-250 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>Active</span>;
      case "scheduled":
        return <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">Scheduled</span>;
      case "expired":
        return <span className="bg-rose-50 text-rose-600 border border-rose-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">Expired</span>;
      default:
        return <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">Inactive</span>;
    }
  };

  // Table columns definition
  const columns = [
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Banner Details</span>,
      key: "details",
      render: (_, record) => (
        <div className="flex items-center gap-3">
          <img 
            src={record.imageUrl || "https://placehold.co/120x60?text=No+Banner"} 
            alt={record.title}
            className="w-16 h-8 object-cover rounded-lg border border-zinc-250 dark:border-zinc-800 shrink-0" 
          />
          <div className="max-w-[200px] truncate">
            <h4 className="text-xs font-black text-slate-900 dark:text-white truncate">{record.title}</h4>
            <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold truncate mt-0.5">{record.subtitle}</p>
          </div>
        </div>
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Redirection</span>,
      key: "redirection",
      render: (_, record) => (
        <div className="space-y-0.5 text-[10px]">
          <span className="font-extrabold text-slate-800 dark:text-zinc-200">
            {getRedirectText(record.redirectType, record.redirectId)}
          </span>
          <span className="block text-[8px] font-mono text-zinc-400">ID: {record.redirectId}</span>
        </div>
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Outlets</span>,
      key: "outlets",
      render: (_, record) => (
        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
          {getStoresLabel(record.stores)}
        </span>
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Display Priority</span>,
      dataIndex: "priority",
      key: "priority",
      sorter: true,
      render: (priority) => renderPriorityBadge(priority)
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Validity Schedule</span>,
      key: "schedule",
      render: (_, record) => {
        const start = new Date(record.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
        const end = new Date(record.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" });
        return (
          <div className="text-[10px] font-semibold text-zinc-600 dark:text-zinc-400">
            <span>{start} — {end}</span>
          </div>
        );
      }
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Status</span>,
      key: "status",
      render: (_, record) => renderStatusBadge(record)
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Toggle Status</span>,
      key: "toggle",
      render: (_, record) => (
        <Switch 
          size="small"
          checked={record.status === "active"}
          onChange={() => {
            setSelectedBanner(record);
            if (record.status === "active") {
              setShowDeactivateModal(true);
            } else {
              setShowActivateModal(true);
            }
          }}
          disabled={record.computedStatus === "expired"}
        />
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400 text-right block">Actions</span>,
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip title="Preview Banner Design">
            <button
              onClick={() => {
                setSelectedBanner(record);
                setShowPreviewDrawer(true);
              }}
              className="p-1.5 text-zinc-400 hover:text-[var(--primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
            >
              <Eye size={14} />
            </button>
          </Tooltip>

          <Tooltip title="Edit Settings">
            <button
              onClick={() => {
                setSelectedBanner(record);
                setShowEditModal(true);
              }}
              className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
            >
              <Edit size={14} />
            </button>
          </Tooltip>

          <Tooltip title="Delete Banner">
            <button
              onClick={() => {
                setSelectedBanner(record);
                setShowDeleteModal(true);
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </Tooltip>
        </div>
      )
    }
  ];

  return (
    <div className="p-5 font-['Poppins'] space-y-6">
      
      {/* 1. HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white uppercase flex items-center gap-2">
            <Sparkles className="text-[var(--primary)] animate-pulse" size={22} />
            Promotional Banners
          </h1>
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold mt-1">
            Publish custom-app banner carousels, target store coordinate visibility, and configure click-through redirects.
          </p>
        </div>

        {/* Global Page Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 py-1.5 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase rounded-lg hover:bg-zinc-50 transition-all text-[10px] cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-1.5 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-extrabold uppercase rounded-lg hover:bg-zinc-50 transition-all text-[10px] cursor-pointer"
          >
            <Download size={12} />
            Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 py-1.5 px-4 bg-[var(--primary)] hover:opacity-90 text-white font-extrabold uppercase rounded-lg transition-all text-[10px] cursor-pointer border-0 shadow-md shadow-primary/25"
          >
            <Plus size={12} />
            Add Banner
          </button>
        </div>
      </div>

      {/* 2. KPI DASHBOARD METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric Card 1: Total Banners */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-400">Total Catalog Banners</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{dashboardStats.total}</h2>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-emerald-500">
              <span className="bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded">{dashboardStats.trends.totalChange}</span>
              <span className="text-zinc-400">vs last month</span>
            </div>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-zinc-400">
            <Layers size={22} />
          </div>
        </div>

        {/* Metric Card 2: Active Banners */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-400">Active Live Banners</span>
            <h2 className="text-xl font-black text-emerald-600">{dashboardStats.active}</h2>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-emerald-500">
              <span className="bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded">{dashboardStats.trends.activeChange}</span>
              <span className="text-zinc-400">customer reach</span>
            </div>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-emerald-600 animate-pulse">
            <Activity size={22} />
          </div>
        </div>

        {/* Metric Card 3: Scheduled Banners */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-400">Scheduled Campaigns</span>
            <h2 className="text-xl font-black text-blue-600">{dashboardStats.scheduled}</h2>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-blue-500">
              <span className="bg-blue-50 dark:bg-blue-950/20 px-1 rounded">{dashboardStats.trends.scheduledChange}</span>
              <span className="text-zinc-400">future triggers</span>
            </div>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-blue-600">
            <Calendar size={22} />
          </div>
        </div>

        {/* Metric Card 4: Expired Banners */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-4 rounded-2xl shadow-2xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-400">Validity Expired</span>
            <h2 className="text-xl font-black text-rose-600">{dashboardStats.expired}</h2>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-rose-500">
              <span className="bg-rose-50 dark:bg-rose-950/20 px-1 rounded">{dashboardStats.trends.expiredChange}</span>
              <span className="text-zinc-400">retiring banners</span>
            </div>
          </div>
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 rounded-xl text-rose-600">
            <AlertTriangle size={22} />
          </div>
        </div>
      </div>

      {/* 3. FILTER & LAYOUT TOGGLE BAR */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4 shadow-sm flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search banner title or text..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] font-semibold transition-all h-8"
            />
          </div>

          {/* Redirect Type Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase text-zinc-400">Redirection:</span>
            <select
              value={redirectTypeFilter}
              onChange={(e) => setRedirectTypeFilter(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold h-8 focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350"
            >
              <option value="All">All Types</option>
              <option value="product">🍕 Product Drilldown</option>
              <option value="category">📁 Category Folder</option>
              <option value="coupon">🎟️ Coupon Voucher</option>
              <option value="campaign">📢 Campaign</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase text-zinc-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold h-8 focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350"
            >
              <option value="All">All Statuses</option>
              <option value="Active">⚡ Active</option>
              <option value="Inactive">📁 Inactive</option>
              <option value="Scheduled">📅 Scheduled</option>
              <option value="Expired">⚠️ Expired</option>
            </select>
          </div>

          {/* Store Outlet Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase text-zinc-400">Outlet:</span>
            <select
              value={storeIdFilter}
              onChange={(e) => setStoreIdFilter(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold h-8 focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 w-36"
            >
              <option value="All">All Outlets</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  📍 {s.name || s.storeName}
                </option>
              ))}
            </select>
          </div>

          {/* Reset button */}
          {(search || redirectTypeFilter !== "All" || statusFilter !== "All" || storeIdFilter !== "All") && (
            <button
              onClick={handleResetFilters}
              className="py-1 px-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 text-zinc-650 dark:text-zinc-300 font-extrabold uppercase rounded-lg text-[9px] cursor-pointer flex items-center gap-1 h-8"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 border border-zinc-200 dark:border-zinc-800 p-0.5 rounded-xl bg-zinc-50 dark:bg-zinc-950 shadow-2xs shrink-0 self-end lg:self-auto">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-1.5 rounded-lg border-0 cursor-pointer transition-colors ${
              viewMode === "grid"
                ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-2xs"
                : "bg-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <Grid size={14} />
          </button>
          <button
            onClick={() => setViewMode("table")}
            className={`p-1.5 rounded-lg border-0 cursor-pointer transition-colors ${
              viewMode === "table"
                ? "bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-2xs"
                : "bg-transparent text-zinc-400 hover:text-zinc-600"
            }`}
          >
            <List size={14} />
          </button>
        </div>
      </div>

      {/* 4. MAIN BANNERS BROWSER AREA */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton active paragraph={{ rows: 6 }} className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-150" />
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-900 inline-block text-zinc-400 mb-4">
            <AlertTriangle size={36} />
          </div>
          <h3 className="text-base font-black text-slate-900 dark:text-white uppercase">No Promotional Banners Found</h3>
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold mt-2 leading-relaxed">
            There are no banners listed matching the current search parameters. Clear filters or create a new promotional banner to start customer campaigns.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-1.5 py-2 px-5 bg-[var(--primary)] hover:opacity-90 text-white font-extrabold uppercase rounded-lg text-[10px] cursor-pointer border-0 shadow-md shadow-primary/25"
          >
            <Plus size={12} />
            Create First Banner
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* GRID VIEW LAYOUT */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {banners.map((b) => (
              <div 
                key={b._id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-2xs hover:shadow-xs transition-shadow duration-200 group flex flex-col h-full"
              >
                {/* Banner Thumbnail (Desktop) */}
                <div className="relative h-[150px] bg-zinc-100 dark:bg-zinc-900 overflow-hidden shrink-0 border-b border-zinc-100 dark:border-zinc-900">
                  <img 
                    src={b.imageUrl || "https://placehold.co/600x300?text=No+Banner"} 
                    alt={b.title}
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  {/* Status Overlay Tag */}
                  <div className="absolute top-3 left-3 z-2">
                    {renderStatusBadge(b)}
                  </div>
                  {/* Priority Indicator */}
                  <div className="absolute top-3 right-3 z-2">
                    {renderPriorityBadge(b.priority)}
                  </div>
                  {/* Redirect overlay */}
                  <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded-lg text-white max-w-[90%] truncate">
                    <span className="text-[7.5px] font-black text-zinc-300 uppercase block leading-none">Redirect Target</span>
                    <span className="text-[10px] font-bold mt-0.5 block leading-none truncate">
                      {getRedirectText(b.redirectType, b.redirectId)}
                    </span>
                  </div>
                </div>

                {/* Banner Text Contents */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="text-sm font-black text-slate-900 dark:text-white leading-snug group-hover:text-[var(--primary)] transition-colors">
                        {b.title}
                      </h3>
                    </div>
                    <p className="text-[11px] text-zinc-450 dark:text-zinc-500 font-semibold leading-relaxed line-clamp-2">
                      {b.subtitle || "No description provided."}
                    </p>
                  </div>

                  {/* Metadata labels */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-900 grid grid-cols-2 gap-2 text-[9px] text-zinc-450 font-bold uppercase">
                    <div className="flex items-center gap-1">
                      <Clock size={11} className="text-zinc-400" />
                      <span>{new Date(b.startDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} — {new Date(b.endDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</span>
                    </div>
                    <div className="flex items-center gap-1 justify-end">
                      <Layers size={11} className="text-zinc-400" />
                      <span className="truncate max-w-[90px]">{getStoresLabel(b.stores)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Operations Footer */}
                <div className="bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-900 px-4 py-2.5 flex items-center justify-between shrink-0">
                  {/* Status toggle slider */}
                  <div className="flex items-center gap-1.5">
                    <Switch 
                      size="small"
                      checked={b.status === "active"}
                      onChange={() => {
                        setSelectedBanner(b);
                        if (b.status === "active") {
                          setShowDeactivateModal(true);
                        } else {
                          setShowActivateModal(true);
                        }
                      }}
                      disabled={b.computedStatus === "expired"}
                    />
                    <span className="text-[9px] font-black text-zinc-400 uppercase">
                      {b.status === "active" ? "Live" : "Draft"}
                    </span>
                  </div>

                  {/* Standard styled buttons for actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setSelectedBanner(b);
                        setShowPreviewDrawer(true);
                      }}
                      className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-[var(--primary)] hover:border-[var(--primary)] rounded-lg cursor-pointer transition-all"
                    >
                      <Eye size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBanner(b);
                        setShowEditModal(true);
                      }}
                      className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-400 hover:text-blue-600 hover:border-blue-500 rounded-lg cursor-pointer transition-all"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedBanner(b);
                        setShowDeleteModal(true);
                      }}
                      className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-405 hover:text-rose-600 hover:border-rose-500 rounded-lg cursor-pointer transition-all"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Grid Layout Pagination */}
          <div className="flex justify-end pt-4">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalRecords}
              onChange={(page) => setCurrentPage(page)}
              onShowSizeChange={(curr, size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              showSizeChanger
              className="font-['Poppins'] font-bold text-xs"
            />
          </div>
        </div>
      ) : (
        /* TABLE VIEW LAYOUT */
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-2xs">
          <Table
            dataSource={banners}
            columns={columns}
            rowKey="_id"
            pagination={false}
            loading={loading}
            className="ant-table-custom"
            onChange={(pagination, filters, sorter) => {
              if (sorter.columnKey === "priority") {
                setSortBy("priority");
                setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
              }
            }}
          />
          {/* Table Layout Pagination */}
          <div className="flex justify-between items-center p-4 border-t border-zinc-100 dark:border-zinc-900">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase">
              Showing {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} records
            </span>
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalRecords}
              onChange={(page) => setCurrentPage(page)}
              onShowSizeChange={(curr, size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
              showSizeChanger
              className="font-['Poppins'] font-bold text-xs"
            />
          </div>
        </div>
      )}

      {/* MODALS CONTAINER */}
      <BannerModals
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        showPreviewDrawer={showPreviewDrawer}
        setShowPreviewDrawer={setShowPreviewDrawer}
        showActivateModal={showActivateModal}
        setShowActivateModal={setShowActivateModal}
        showDeactivateModal={showDeactivateModal}
        setShowDeactivateModal={setShowDeactivateModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        selectedBanner={selectedBanner}
        setSelectedBanner={setSelectedBanner}
        createBanner={createBanner}
        updateBanner={updateBanner}
        deleteBanner={deleteBanner}
        updateBannerStatus={updateBannerStatus}
        stores={stores}
        products={products}
        categories={categories}
        coupons={coupons}
        campaigns={campaigns}
      />
    </div>
  );
}
