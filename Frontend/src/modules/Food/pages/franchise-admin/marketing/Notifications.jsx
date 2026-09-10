import React, { useState, useEffect } from "react";
import { Table, Tag, Tooltip, Pagination, Skeleton, Progress } from "antd";
import { 
  Bell, Plus, Download, RefreshCw, Search, Eye, Edit, 
  Trash2, Play, Pause, Calendar, Clock, Sparkles, 
  Layers, Link2, Filter, Grid, List, AlertTriangle, 
  CheckCircle2, Activity, Smartphone, Mail, Info, Percent, Send, XCircle, RotateCcw
} from "lucide-react";
import { useNotifications } from "./hooks/useNotifications";
import NotificationModals from "./components/NotificationModals";
import { toast } from "sonner";
import dayjs from "dayjs";

export default function Notifications() {
  const notificationsHook = useNotifications();
  const {
    loading,
    notifications,
    totalRecords,
    stores,
    loadingStores,

    // Filters
    search,
    setSearch,
    channelFilter,
    setChannelFilter,
    audienceFilter,
    setAudienceFilter,
    statusFilter,
    setStatusFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    handleResetFilters,

    // Sorting & Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Selections
    selectedNotification,
    setSelectedNotification,

    // Operations & KPIs
    dashboardStats,
    createNotification,
    updateNotification,
    deleteNotification,
    cancelNotification,
    resendNotification,

    // Detailed Analytics States
    loadingAnalytics,
    analyticsData,
    logsList,
    logSearch,
    setLogSearch,
    logPage,
    setLogPage,
    logLimit,
    setLogLimit,
    fetchAnalytics
  } = notificationsHook;

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

  // Modal Visibility States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewDrawer, setShowViewDrawer] = useState(false);
  const [showAnalyticsDrawer, setShowAnalyticsDrawer] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Refresh list
  const handleRefresh = () => {
    toast.success("Refreshing notifications catalog...");
    setCurrentPage(1);
  };

  // Export Notifications catalog to CSV
  const handleExportCSV = () => {
    if (notifications.length === 0) {
      toast.warning("No notifications data available to export.");
      return;
    }
    const filename = `Notifications_Catalog_${dayjs().format("YYYY-MM-DD")}.csv`;
    const headers = ["Title", "Message", "Channels", "Audience Target", "Schedule Time", "Stores Assignment", "Sent Count", "Open Rate", "Status", "Created By"];
    
    const csvRows = [
      headers.join(","),
      ...notifications.map(n => [
        `"${n.title.replace(/"/g, '""')}"`,
        `"${(n.message || "").replace(/"/g, '""')}"`,
        `"${n.notificationType ? n.notificationType.join(" | ") : "push"}"`,
        n.targetAudience,
        n.scheduleTime ? dayjs(n.scheduleTime).format("YYYY-MM-DD HH:mm") : "Immediate",
        `"${n.stores && n.stores.length > 0 ? n.stores.map(id => stores.find(s => s._id === id)?.name || "Store").join(" | ") : "Global"}"`,
        n.sentCount || 0,
        `${n.openRate || 0}%`,
        n.status,
        `"${n.createdBy || "Admin"}"`
      ].join(","))
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
      toast.success("Notifications directory exported to CSV successfully!");
    }
  };

  // Channel tags helper
  const renderChannelBadges = (types) => {
    if (!types) return null;
    return types.map((type, i) => {
      let colorClass = "bg-blue-50 text-blue-600 border-blue-200";
      if (type === "sms") colorClass = "bg-emerald-50 text-emerald-600 border-emerald-200";
      if (type === "email") colorClass = "bg-purple-50 text-purple-650 border-purple-200";
      return (
        <span key={i} className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase border mr-1 inline-flex items-center gap-0.5 ${colorClass}`}>
          {type === "push" ? <Smartphone size={10} /> : type === "sms" ? <Info size={10} /> : <Mail size={10} />}
          {type}
        </span>
      );
    });
  };

  // Audience tags helper
  const renderAudienceBadge = (audience) => {
    switch (audience) {
      case "all":
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[9px] font-black uppercase">All Customers</span>;
      case "loyalty":
        return <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-amber-250">Loyalty</span>;
      case "new":
        return <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-blue-250">New App</span>;
      case "inactive":
        return <span className="bg-rose-50 text-rose-600 px-2 py-0.5 rounded text-[9px] font-black uppercase border border-rose-250">Inactive</span>;
      default:
        return null;
    }
  };

  // Status badges helper
  const renderStatusBadge = (status) => {
    switch (status) {
      case "sent":
        return <span className="bg-emerald-50 text-emerald-600 border border-emerald-250 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase inline-flex items-center gap-1 shadow-2xs"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>Sent</span>;
      case "scheduled":
        return <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">Scheduled</span>;
      case "draft":
        return <span className="bg-zinc-100 text-zinc-650 border border-zinc-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">Draft</span>;
      case "cancelled":
        return <span className="bg-rose-50 text-rose-600 border border-rose-250 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase">Cancelled</span>;
      default:
        return null;
    }
  };

  // Table columns definition
  const columns = [
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Notification Title</span>,
      key: "title",
      render: (_, record) => (
        <div className="max-w-[240px] truncate">
          <button
            onClick={() => {
              setSelectedNotification(record);
              setShowAnalyticsDrawer(true);
            }}
            className="text-xs font-black text-slate-909 dark:text-white hover:text-[var(--primary)] text-left bg-transparent border-0 p-0 cursor-pointer truncate max-w-full font-['Poppins']"
          >
            {record.title}
          </button>
          <span className="block text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{record.message}</span>
        </div>
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Channels</span>,
      key: "channels",
      render: (_, record) => renderChannelBadges(record.notificationType)
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Audience</span>,
      key: "audience",
      render: (_, record) => renderAudienceBadge(record.targetAudience)
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Schedule Time</span>,
      key: "scheduleTime",
      render: (_, record) => (
        <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
          {record.scheduleTime ? dayjs(record.scheduleTime).format("DD MMM YYYY, hh:mm A") : "Send Now"}
        </span>
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400 text-center block">Sent Volume</span>,
      dataIndex: "sentCount",
      key: "sentCount",
      align: "center",
      render: (val, record) => (
        <span className="text-xs font-black text-slate-800 dark:text-zinc-200">
          {record.status === "sent" ? (val || 1200).toLocaleString("en-IN") : "—"}
        </span>
      )
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Open Rate</span>,
      key: "openRate",
      render: (_, record) => {
        if (record.status !== "sent") return <span className="text-zinc-400">—</span>;
        const rate = record.openRate || 0;
        return (
          <div className="w-24 space-y-1">
            <div className="flex justify-between text-[8px] font-extrabold text-zinc-500 uppercase">
              <span>Opened</span>
              <span>{rate}%</span>
            </div>
            <Progress 
              percent={rate} 
              strokeColor="#3b82f6" 
              size="small" 
              showInfo={false}
              className="m-0"
            />
          </div>
        );
      }
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400">Status</span>,
      dataIndex: "status",
      key: "status",
      render: (status) => renderStatusBadge(status)
    },
    {
      title: <span className="text-[10px] font-black uppercase text-zinc-400 text-right block">Actions</span>,
      key: "actions",
      render: (_, record) => (
        <div className="flex items-center justify-end gap-2">
          
          <Tooltip title="View Configurations">
            <button
              onClick={() => {
                setSelectedNotification(record);
                setShowViewDrawer(true);
              }}
              className="p-1.5 text-zinc-400 hover:text-[var(--primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
            >
              <Eye size={13} />
            </button>
          </Tooltip>

          {record.status === "scheduled" || record.status === "draft" ? (
            <Tooltip title="Edit Notification Settings">
              <button
                onClick={() => {
                  setSelectedNotification(record);
                  setShowEditModal(true);
                }}
                className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
              >
                <Edit size={13} />
              </button>
            </Tooltip>
          ) : null}

          {record.status === "scheduled" && (
            <Tooltip title="Cancel Scheduled Dispatch">
              <button
                onClick={() => {
                  setSelectedNotification(record);
                  setShowCancelModal(true);
                }}
                className="p-1.5 text-zinc-450 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
              >
                <Pause size={13} />
              </button>
            </Tooltip>
          )}

          {record.status === "sent" || record.status === "cancelled" ? (
            <Tooltip title="Resend Notification">
              <button
                onClick={() => {
                  setSelectedNotification(record);
                  setShowResendModal(true);
                }}
                className="p-1.5 text-zinc-450 hover:text-emerald-650 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
              >
                <RotateCcw size={13} />
              </button>
            </Tooltip>
          ) : null}

          <Tooltip title="Delete Archive">
            <button
              onClick={() => {
                setSelectedNotification(record);
                setShowDeleteModal(true);
              }}
              className="p-1.5 text-zinc-400 hover:text-rose-650 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-lg border-0 bg-transparent cursor-pointer transition-colors"
            >
              <Trash2 size={13} />
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
            <Bell className="text-[var(--primary)] animate-bounce" size={22} />
            Notifications Center
          </h1>
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold mt-1">
            Send customer push notifications, SMS alerts, HTML emails, and track delivery performance logs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 py-1.5 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-705 dark:text-zinc-300 font-extrabold uppercase rounded-lg hover:bg-zinc-50 transition-all text-[10px] cursor-pointer"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 py-1.5 px-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-705 dark:text-zinc-300 font-extrabold uppercase rounded-lg hover:bg-zinc-50 transition-all text-[10px] cursor-pointer"
          >
            <Download size={12} />
            Export CSV
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 py-1.5 px-4 bg-[var(--primary)] hover:opacity-90 text-white font-extrabold uppercase rounded-lg transition-all text-[10px] cursor-pointer border-0 shadow-md shadow-primary/25"
          >
            <Plus size={12} />
            Send Notification
          </button>
        </div>
      </div>

      {/* 2. KPI DASHBOARD METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Sent */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-850 p-4 rounded-2xl shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-400">Notifications Sent</span>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">{dashboardStats.sent.toLocaleString("en-IN")}</h2>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-emerald-500">
              <span className="bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded">{dashboardStats.trends.sentChange}</span>
              <span className="text-zinc-400">vs last month</span>
            </div>
          </div>
          <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl text-zinc-400">
            <Send size={20} />
          </div>
        </div>

        {/* Success Rate */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-850 p-4 rounded-2xl shadow-3xs flex items-center justify-between">
          <div className="space-y-1 w-full mr-2">
            <span className="text-[10px] font-black uppercase text-zinc-400">Delivery Success</span>
            <h2 className="text-xl font-black text-emerald-600">{dashboardStats.deliverySuccessRate}</h2>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-emerald-500">
              <span className="bg-emerald-50 dark:bg-emerald-950/20 px-1 rounded">{dashboardStats.trends.deliveryChange}</span>
              <span className="text-zinc-400">bounced rate minimal</span>
            </div>
            <Progress percent={parseFloat(dashboardStats.deliverySuccessRate)} strokeColor="#10b981" showInfo={false} size="tiny" className="mt-2" />
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl text-emerald-600 shrink-0">
            <CheckCircle2 size={20} />
          </div>
        </div>

        {/* Open Rate */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-850 p-4 rounded-2xl shadow-3xs flex items-center justify-between">
          <div className="space-y-1 w-full mr-2">
            <span className="text-[10px] font-black uppercase text-zinc-400">Open Rate</span>
            <h2 className="text-xl font-black text-blue-600">{dashboardStats.openRate}</h2>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-blue-500">
              <span className="bg-blue-50 dark:bg-blue-950/20 px-1 rounded">{dashboardStats.trends.openChange}</span>
              <span className="text-zinc-400">app opens</span>
            </div>
            <Progress percent={parseFloat(dashboardStats.openRate)} strokeColor="#3b82f6" showInfo={false} size="tiny" className="mt-2" />
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-blue-600 shrink-0">
            <Eye size={20} />
          </div>
        </div>

        {/* Click Rate */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-850 p-4 rounded-2xl shadow-3xs flex items-center justify-between">
          <div className="space-y-1 w-full mr-2">
            <span className="text-[10px] font-black uppercase text-zinc-400">Click Rate (CTR)</span>
            <h2 className="text-xl font-black text-purple-650">{dashboardStats.clickRate}</h2>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-purple-500">
              <span className="bg-purple-50 dark:bg-purple-950/20 px-1 rounded">{dashboardStats.trends.clickChange}</span>
              <span className="text-zinc-400">action clicks</span>
            </div>
            <Progress percent={parseFloat(dashboardStats.clickRate)} strokeColor="#a855f7" showInfo={false} size="tiny" className="mt-2" />
          </div>
          <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-xl text-purple-650 shrink-0">
            <Percent size={20} />
          </div>
        </div>

        {/* Scheduled */}
        <div className="bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-850 p-4 rounded-2xl shadow-3xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-zinc-400">Scheduled Actions</span>
            <h2 className="text-xl font-black text-amber-600">{dashboardStats.scheduled}</h2>
            <div className="flex items-center gap-1 text-[8.5px] font-bold text-amber-500">
              <span className="bg-amber-50 dark:bg-amber-950/20 px-1 rounded">{dashboardStats.trends.scheduledChange}</span>
              <span className="text-zinc-400">future triggers</span>
            </div>
          </div>
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl text-amber-600">
            <Clock size={20} />
          </div>
        </div>
      </div>

      {/* 3. STICKY FILTERS SECTION */}
      <div className="sticky top-0 z-10 bg-slate-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-4 shadow-2xs flex flex-col gap-4 lg:flex-row lg:items-center justify-between">
        
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search bar */}
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search title or content text..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] font-semibold transition-all h-8"
            />
          </div>

          {/* Channel Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase text-zinc-400">Channel:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold h-8 focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350"
            >
              <option value="All">All Channels</option>
              <option value="push">📱 Push notification</option>
              <option value="sms">💬 SMS text alert</option>
              <option value="email">📧 E-mail letter</option>
            </select>
          </div>

          {/* Audience Filter */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase text-zinc-400">Audience:</span>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold h-8 focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350"
            >
              <option value="All">All Audiences</option>
              <option value="all">📢 All Customers</option>
              <option value="loyalty">🏆 Loyalty Members</option>
              <option value="new">✨ New Customers</option>
              <option value="inactive">⏳ Inactive Customers</option>
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
              <option value="sent">⚡ Sent</option>
              <option value="scheduled">📅 Scheduled</option>
              <option value="draft">📁 Draft</option>
              <option value="cancelled">🚫 Cancelled</option>
            </select>
          </div>

          {/* Date Picker Start */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase text-zinc-400">From:</span>
            <input
              type="date"
              value={startDateFilter}
              onChange={(e) => setStartDateFilter(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold h-8 focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
            />
          </div>

          {/* Date Picker End */}
          <div className="flex items-center gap-1">
            <span className="text-[9px] font-black uppercase text-zinc-400">To:</span>
            <input
              type="date"
              value={endDateFilter}
              onChange={(e) => setEndDateFilter(e.target.value)}
              className="px-2 py-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-semibold h-8 focus:outline-none focus:border-[var(--primary)] text-zinc-700 dark:text-zinc-350 cursor-pointer"
            />
          </div>

          {/* Reset Filters */}
          {(search || channelFilter !== "All" || audienceFilter !== "All" || statusFilter !== "All" || startDateFilter || endDateFilter) && (
            <button
              onClick={handleResetFilters}
              className="py-1 px-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 text-zinc-655 dark:text-zinc-300 font-extrabold uppercase rounded-lg text-[9px] cursor-pointer flex items-center gap-1 h-8"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* 4. MAIN DIRECTORY TABLE LIST */}
      {loading ? (
        <div className="space-y-4">
          <Skeleton active paragraph={{ rows: 6 }} className="p-4 bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-150" />
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-2xl p-12 text-center max-w-lg mx-auto">
          <div className="p-4 rounded-full bg-zinc-50 dark:bg-zinc-900 inline-block text-zinc-400 mb-4">
            <AlertTriangle size={36} />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase">No Notifications Campaigns Found</h3>
          <p className="text-xs text-zinc-450 dark:text-zinc-500 font-semibold mt-2 leading-relaxed">
            There are no campaigns matching your current filter selections. Clear your filters or create a new notification launch.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="mt-6 inline-flex items-center gap-1.5 py-2 px-5 bg-[var(--primary)] hover:opacity-90 text-white font-extrabold uppercase rounded-lg text-[10px] cursor-pointer border-0 shadow-md shadow-primary/25"
          >
            <Plus size={12} />
            Configure First Alert
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-3xs">
          <Table 
            dataSource={notifications}
            columns={columns}
            rowKey="_id"
            pagination={false}
            loading={loading}
            className="ant-table-custom font-['Poppins']"
          />

          {/* Directory Footer Pagination */}
          <div className="flex justify-between items-center p-4 border-t border-zinc-100 dark:border-zinc-900 text-[10px] font-semibold text-zinc-400 font-['Poppins']">
            <span className="uppercase font-extrabold">
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
              pageSizeOptions={["10", "25", "50", "100"]}
              className="font-bold text-xs"
            />
          </div>
        </div>
      )}

      {/* MODALS CONTAINER */}
      <NotificationModals
        showCreateModal={showCreateModal}
        setShowCreateModal={setShowCreateModal}
        showEditModal={showEditModal}
        setShowEditModal={setShowEditModal}
        showViewDrawer={showViewDrawer}
        setShowViewDrawer={setShowViewDrawer}
        showAnalyticsDrawer={showAnalyticsDrawer}
        setShowAnalyticsDrawer={setShowAnalyticsDrawer}
        showCancelModal={showCancelModal}
        setShowCancelModal={setShowCancelModal}
        showResendModal={showResendModal}
        setShowResendModal={setShowResendModal}
        showDeleteModal={showDeleteModal}
        setShowDeleteModal={setShowDeleteModal}
        selectedNotification={selectedNotification}
        setSelectedNotification={setSelectedNotification}
        createNotification={createNotification}
        updateNotification={updateNotification}
        deleteNotification={deleteNotification}
        cancelNotification={cancelNotification}
        resendNotification={resendNotification}
        loadingAnalytics={loadingAnalytics}
        analyticsData={analyticsData}
        logsList={logsList}
        logSearch={logSearch}
        setLogSearch={setLogSearch}
        logPage={logPage}
        setLogPage={setLogPage}
        logLimit={logLimit}
        setLogLimit={setLogLimit}
        stores={stores}
      />

    </div>
  );
}
