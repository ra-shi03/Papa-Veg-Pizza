import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Plus, Search, Filter, ArrowUpDown, ChevronDown, ChevronUp, MoreVertical, 
  Trash2, Eye, Edit, Pause, Play, Download, BarChart2, Check, AlertTriangle, 
  AlertCircle, RefreshCw, Columns, Calendar, Target, Bell, Mail, MessageSquare,
  Users, HelpCircle, Server, CheckCircle2, XCircle, Clock, ChevronRight, Percent, Loader2
} from 'lucide-react';

import { 
  apiGetNotifications, 
  apiDeleteNotification, 
  apiBulkDeleteNotifications, 
  apiBulkUpdateNotificationStatus
} from './NotificationData';

import { mockRegions, mockFranchises } from './CouponsData';

import CreateNotification from './CreateNotification';
import EditNotification from './EditNotification';
import NotificationDetails from './NotificationDetails';
import NotificationLogs from './NotificationLogs';
import RescheduleNotification from './RescheduleNotification';
import CancelNotification from './CancelNotification';

export default function PushNotification() {
  
  // Core Page States
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [retryTrigger, setRetryTrigger] = useState(0);
  
  // API simulator controls
  const [simulateError, setSimulateError] = useState(false);

  // Pagination & Sorting State
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });
  const [sorting, setSorting] = useState({ field: 'createdAt', order: 'desc' });

  // Filters State
  const [showFilters, setShowFilters] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    type: 'All',
    status: 'All',
    audienceType: 'All',
    startDate: '',
    endDate: '',
    regionIds: [],
    franchiseIds: []
  });

  // Table Column Visibility
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    title: true,
    type: true,
    audience: true,
    scheduleAt: true,
    status: true,
    analytics: true,
    actions: true
  });

  // Bulk Selection States
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);

  // Modals & Drawer States
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNotifId, setEditingNotifId] = useState(null);
  const [detailsNotifId, setDetailsNotifId] = useState(null);
  const [logsNotifId, setLogsNotifId] = useState(null);
  const [rescheduleNotifId, setRescheduleNotifId] = useState(null);
  const [cancelNotifId, setCancelNotifId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  // KPI Metrics data
  const [kpiStats, setKpiStats] = useState({
    running: 0,
    scheduled: 0,
    sent: 0,
    openRate: 0,
    failed: 0,
    health: '100%'
  });

  // Toast / Alerts notification banner
  const [toastMessage, setToastMessage] = useState(null);

  // Refs for closing popups on outside click
  const menuRef = useRef(null);
  const columnDropdownRef = useRef(null);
  const bulkDropdownRef = useRef(null);
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);

  // Trigger toast notification helper
  const triggerToast = (msg, type = 'success') => {
    setToastMessage({ text: msg, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuRowId(null);
      }
      if (columnDropdownRef.current && !columnDropdownRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
      if (bulkDropdownRef.current && !bulkDropdownRef.current.contains(event.target)) {
        setShowBulkDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch notifications & recalculate KPIs
  useEffect(() => {
    const fetchNotificationsData = async () => {
      setLoading(true);
      setError(null);
      setSelectedIds([]); // reset selection on pagination/filter change

      if (simulateError) {
        setLoading(false);
        setError("API connection timed out. (Simulated superadmin system fault)");
        return;
      }

      try {
        const response = await apiGetNotifications(filters, pagination, sorting);
        setNotifications(response.notifications);
        setTotalCount(response.total);
        setTotalPages(response.totalPages);

        // Fetch All to calculate accurate KPIs
        const allDataResponse = await apiGetNotifications({}, { page: 1, limit: 1000 }, { field: 'createdAt', order: 'desc' });
        const allNotifs = allDataResponse.notifications;

        // Calculate KPIs
        const running = allNotifs.filter(n => n.status === 'Processing').length;
        const scheduled = allNotifs.filter(n => n.status === 'Scheduled').length;
        const sent = allNotifs.reduce((sum, n) => sum + (n.sentCount || 0), 0);
        
        let totalDelivered = 0;
        let totalOpened = 0;
        let totalFailed = 0;
        
        allNotifs.forEach(n => {
          totalDelivered += (n.deliveredCount || 0);
          totalOpened += (n.openedCount || 0);
          totalFailed += ((n.sentCount || 0) - (n.deliveredCount || 0));
        });

        const openRate = totalDelivered > 0 ? parseFloat(((totalOpened / totalDelivered) * 100).toFixed(1)) : 0;

        setKpiStats({
          running,
          scheduled,
          sent,
          openRate,
          failed: totalFailed,
          health: '99.8%'
        });

        setLoading(false);
      } catch (err) {
        setError(err.message || 'System was unable to retrieve notifications list.');
        setLoading(false);
      }
    };

    fetchNotificationsData();
  }, [filters, pagination, sorting, retryTrigger, simulateError]);

  // Debounce filter search text
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchText }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 450);

    return () => clearTimeout(handler);
  }, [searchText]);

  // Handle Sort Change
  const handleSort = (field) => {
    setSorting(prev => {
      const isAsc = prev.field === field && prev.order === 'asc';
      return { field, order: isAsc ? 'desc' : 'asc' };
    });
  };

  // Row selection helpers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const pageIds = notifications.map(n => n._id);
      setSelectedIds(prev => Array.from(new Set([...prev, ...pageIds])));
    } else {
      const pageIds = notifications.map(n => n._id);
      setSelectedIds(prev => prev.filter(id => !pageIds.includes(id)));
    }
  };

  const handleSelectRow = (e, id) => {
    if (e.target.checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  // Bulk Actions
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} notifications?`)) return;
    try {
      await apiBulkDeleteNotifications(selectedIds);
      triggerToast(`Successfully deleted ${selectedIds.length} notifications.`);
      setSelectedIds([]);
      setRetryTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleBulkStatusChange = async (newStatus) => {
    try {
      await apiBulkUpdateNotificationStatus(selectedIds, newStatus);
      triggerToast(`Status updated to ${newStatus} for selected notifications.`);
      setSelectedIds([]);
      setRetryTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Individual Row actions
  const handleDeleteNotification = async (id) => {
    try {
      await apiDeleteNotification(id);
      triggerToast('Notification deleted successfully.');
      setDeleteConfirmId(null);
      setRetryTrigger(prev => prev + 1);
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter handlers
  const handleMultiSelectFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value) 
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setSearchText('');
    setFilters({
      search: '',
      type: 'All',
      status: 'All',
      audienceType: 'All',
      startDate: '',
      endDate: '',
      regionIds: [],
      franchiseIds: []
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const hasActiveFilters = useMemo(() => {
    return filters.type !== 'All' || 
           filters.status !== 'All' || 
           filters.audienceType !== 'All' || 
           filters.startDate !== '' || 
           filters.endDate !== '' || 
           filters.regionIds.length > 0 || 
           filters.franchiseIds.length > 0 ||
           searchText !== '';
  }, [filters, searchText]);

  // Export CSV helper
  const handleExportCSV = () => {
    const headers = ['ID', 'Title', 'Message', 'Type', 'Audience', 'Schedule At', 'Status', 'Sent', 'Delivered', 'Opened'];
    const rows = notifications.map(n => [
      n._id, n.title, n.message, n.type, n.audienceType, n.scheduleAt, n.status, n.sentCount, n.deliveredCount, n.openedCount
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `pvp_notifications_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast("CSV file exported successfully.");
  };


  return (
    <div className="p-3 md:p-5 max-w-[1600px] mx-auto space-y-5 animate-in fade-in duration-300">
      
      {/* Toast message banner */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[99] flex items-center gap-2.5 px-4.5 py-3 rounded-xl bg-zinc-900 dark:bg-zinc-800 text-white shadow-2xl border border-zinc-700 animate-in slide-in-from-top-4 duration-300">
          <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
          <span className="text-xs font-bold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4.5 rounded-2xl shadow-sm">
        <div>
          <h1 className="text-lg font-black text-zinc-900 dark:text-zinc-150 flex items-center gap-2">
            <span className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-xl">
              <Bell size={20} />
            </span>
            Push Notifications Management
          </h1>
          <p className="text-[11px] text-zinc-500 font-semibold mt-1">
            Dispatch push campaigns, track delivery analytics, and manage scheduled notification distributions.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 select-none">
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-4.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
          >
            <Plus size={15} /> Create Notification
          </button>
        </div>
      </div>

      {/* KPI Cards section */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 select-none">
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Active Sending</span>
            <h4 className="text-base font-black text-zinc-900 dark:border-zinc-100 mt-1">{kpiStats.running}</h4>
            <p className="text-[9px] text-zinc-450 mt-0.5">Currently processing</p>
          </div>
          <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
            <RefreshCw size={14} className="animate-spin" />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Scheduled</span>
            <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{kpiStats.scheduled}</h4>
            <p className="text-[9px] text-blue-500 font-bold mt-0.5">Upcoming triggers</p>
          </div>
          <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
            <Calendar size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Sent</span>
            <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{kpiStats.sent.toLocaleString()}</h4>
            <p className="text-[9px] text-zinc-450 mt-0.5">Total dispatches</p>
          </div>
          <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
            <Users size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Avg Open Rate</span>
            <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">{kpiStats.openRate}%</h4>
            <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Click-through ratio</p>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Percent size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
          <div>
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Failed Deliveries</span>
            <h4 className="text-base font-black text-red-500 dark:text-red-400 mt-1">{kpiStats.failed.toLocaleString()}</h4>
            <p className="text-[9px] text-red-500/80 font-bold mt-0.5">Delivery failures</p>
          </div>
          <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
            <XCircle size={14} />
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
          <div>
            <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Gateway Status</span>
            <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">Operational</h4>
            <p className="text-[9px] text-zinc-455 mt-0.5">All networks online</p>
          </div>
          <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <Server size={14} />
          </div>
        </div>
      </div>

      {/* TAB 1: NOTIFICATIONS LIST */}
      <div className="space-y-4">
          
          {/* Collapsible Filter & Search Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4.5 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row gap-3.5 items-center justify-between">
              
              {/* Search Bar */}
              <div className="relative w-full md:w-80 select-none">
                <input 
                  className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all text-zinc-800 dark:text-zinc-150 placeholder:text-zinc-400 font-semibold" 
                  placeholder="Search notification title..." 
                  type="text"
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
                <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400" />
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end select-none">
                
                {/* Column visibility dropdown */}
                <div className="relative" ref={columnDropdownRef}>
                  <button 
                    onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95 cursor-pointer"
                  >
                    <Columns size={13} />
                    Columns
                    <ChevronDown size={12} />
                  </button>
                  {showColumnDropdown && (
                    <div className="absolute right-0 mt-2.5 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 py-2 text-xs font-bold text-zinc-750 dark:text-zinc-350">
                      {Object.keys(visibleColumns).map((col) => (
                        <label key={col} className="flex items-center gap-2.5 px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer capitalize">
                          <input 
                            type="checkbox" 
                            checked={visibleColumns[col]} 
                            onChange={() => setVisibleColumns(prev => ({ ...prev, [col]: !prev[col] }))}
                            className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                          {col === 'scheduleAt' ? 'Schedule Date' : col === 'type' ? 'Channel Type' : col}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Filters Collapse button */}
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors shadow-sm active:scale-95 cursor-pointer ${
                    hasActiveFilters 
                      ? 'bg-[var(--primary)]/10 text-[var(--primary)] border-[var(--primary)]/20' 
                      : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Filter size={13} />
                  Filters {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[var(--primary)] inline-block"></span>}
                  {showFilters ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                </button>

                {/* Export Report */}
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm active:scale-95 cursor-pointer"
                >
                  <Download size={13} />
                  Export CSV
                </button>

                {/* Simulated Fault Switcher */}
                <label className="flex items-center gap-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={simulateError} 
                    onChange={() => setSimulateError(!simulateError)}
                    className="rounded text-red-500 focus:ring-red-500"
                  />
                  <span className="text-[10px] font-black text-red-550 dark:text-red-400 uppercase tracking-wider">Inject Fault</span>
                </label>

              </div>
            </div>

            {/* Hidden advanced filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 border-t border-zinc-100 dark:border-zinc-800 pt-4.5 animate-in fade-in slide-in-from-top-2 duration-200 select-none">
                
                {/* 1. Channel type select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Channel Type</label>
                  <select 
                    value={filters.type}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, type: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-750 dark:text-zinc-200 font-semibold"
                  >
                    <option value="All">All Channels</option>
                    <option value="App Push">App Push Notification</option>
                    <option value="SMS">SMS Gateway</option>
                    <option value="Email">Email Marketing</option>
                    <option value="Multi Channel">Multi Channel</option>
                  </select>
                </div>

                {/* 2. Status select */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Status</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, status: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-750 dark:text-zinc-200 font-semibold"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Sent">Sent</option>
                    <option value="Scheduled">Scheduled</option>
                    <option value="Processing">Processing</option>
                    <option value="Draft">Draft</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>

                {/* 3. Audience Segment */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Audience Segment</label>
                  <select 
                    value={filters.audienceType}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, audienceType: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-750 dark:text-zinc-200 font-semibold"
                  >
                    <option value="All">All Audiences</option>
                    <option value="All Customers">All Registered Customers</option>
                    <option value="Premium Customers">Premium Users</option>
                    <option value="New Customers">New Registrants</option>
                    <option value="Region Wise">Region Wise Segment</option>
                    <option value="Franchise Wise">Franchise Outlet Segment</option>
                  </select>
                </div>

                {/* 4. Date Range Filters */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Schedule Date Range</label>
                  <div className="grid grid-cols-2 gap-2">
                    <input 
                      type="date" 
                      value={filters.startDate}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, startDate: e.target.value }));
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 text-[10.5px] outline-none text-zinc-700 dark:text-zinc-200 font-semibold"
                    />
                    <input 
                      type="date" 
                      value={filters.endDate}
                      onChange={(e) => {
                        setFilters(prev => ({ ...prev, endDate: e.target.value }));
                        setPagination(prev => ({ ...prev, page: 1 }));
                      }}
                      className="bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-2 py-1.5 text-[10.5px] outline-none text-zinc-700 dark:text-zinc-200 font-semibold"
                    />
                  </div>
                </div>

                {/* 5. Region Multi-select */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Filter by Regions</label>
                  <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-955 max-h-24 overflow-y-auto">
                    {mockRegions.map(reg => {
                      const isChecked = filters.regionIds.includes(reg.id);
                      return (
                        <button
                          key={reg.id}
                          onClick={() => handleMultiSelectFilter('regionIds', reg.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                            isChecked 
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100'
                          }`}
                        >
                          {reg.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 6. Franchise Multi-select */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Filter by Franchises</label>
                  <div className="flex flex-wrap gap-1.5 p-2 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-955 max-h-24 overflow-y-auto">
                    {mockFranchises.map(fran => {
                      const isChecked = filters.franchiseIds.includes(fran.id);
                      return (
                        <button
                          key={fran.id}
                          onClick={() => handleMultiSelectFilter('franchiseIds', fran.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all border ${
                            isChecked 
                              ? 'bg-[var(--primary)] text-white border-[var(--primary)]' 
                              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-550 dark:text-zinc-400 hover:bg-zinc-100'
                          }`}
                        >
                          {fran.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="md:col-span-4 flex justify-end">
                  <button 
                    onClick={clearFilters}
                    className="px-4 py-1.5 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-350 rounded-lg text-xs font-bold transition-all active:scale-95 cursor-pointer"
                  >
                    Clear All Filters
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bulk actions banner */}
          {selectedIds.length > 0 && (
            <div className="bg-zinc-900 dark:bg-zinc-800 text-white rounded-xl px-4.5 py-3 border border-zinc-750 flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-2 duration-300">
              <span className="text-xs font-bold">{selectedIds.length} notifications selected for bulk processing.</span>
              <div className="flex items-center gap-2.5 select-none" ref={bulkDropdownRef}>
                <button 
                  onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                  className="flex items-center gap-1 px-3.5 py-1.5 bg-zinc-800 dark:bg-zinc-700 border border-zinc-650 hover:bg-zinc-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                >
                  Bulk Actions <ChevronDown size={13} />
                </button>
                
                {showBulkDropdown && (
                  <div className="absolute mt-2.5 w-44 bg-zinc-900 border border-zinc-700 rounded-xl shadow-xl z-20 py-2 text-xs font-bold text-zinc-300 text-left">
                    <button 
                      onClick={() => handleBulkStatusChange('Cancelled')}
                      className="w-full px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-zinc-300"
                    >
                      Bulk Cancel Jobs
                    </button>
                    <button 
                      onClick={() => handleBulkStatusChange('Scheduled')}
                      className="w-full px-4 py-2 hover:bg-zinc-800 transition-colors text-left text-zinc-300"
                    >
                      {"Bulk Status -> Scheduled"}
                    </button>
                    <button 
                      onClick={handleBulkDelete}
                      className="w-full px-4 py-2 hover:bg-zinc-800 hover:text-red-400 transition-colors text-left text-red-500 font-bold border-t border-zinc-750"
                    >
                      Bulk Delete Selected
                    </button>
                  </div>
                )}
                
                <button 
                  onClick={() => setSelectedIds([])}
                  className="px-3.5 py-1.5 hover:bg-zinc-850 dark:hover:bg-zinc-750 text-xs font-bold text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Deselect All
                </button>
              </div>
            </div>
          )}

          {/* Primary Data Table */}
          {error ? (
            <div className="bg-red-50 dark:bg-red-950/10 border border-red-500/20 p-8 rounded-2xl flex flex-col items-center justify-center text-center gap-3">
              <AlertCircle size={36} className="text-red-500" />
              <p className="text-sm font-bold text-red-750 dark:text-red-400">{error}</p>
              <button 
                onClick={() => setRetryTrigger(prev => prev + 1)}
                className="px-5 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer transition-all active:scale-95"
              >
                Retry Request
              </button>
            </div>
          ) : loading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
              <p className="text-xs font-bold text-zinc-450 dark:text-zinc-500 uppercase tracking-widest">Querying Simulated Mongo Instance...</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse min-w-[1000px]">
                  
                  {/* Table Header */}
                  <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] uppercase tracking-wider font-extrabold sticky top-0 z-10 select-none">
                    <tr>
                      {visibleColumns.select && (
                        <th className="px-4 py-3.5 w-10 text-center">
                          <input 
                            type="checkbox"
                            checked={notifications.length > 0 && notifications.every(n => selectedIds.includes(n._id))}
                            onChange={handleSelectAll}
                            className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                          />
                        </th>
                      )}
                      
                      {visibleColumns.title && (
                        <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850" onClick={() => handleSort('title')}>
                          <span className="flex items-center gap-1.5">
                            Notification / Broadcast Title
                            <ArrowUpDown size={12} className="text-zinc-400" />
                          </span>
                        </th>
                      )}

                      {visibleColumns.type && (
                        <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850" onClick={() => handleSort('type')}>
                          <span className="flex items-center gap-1.5">
                            Channel
                            <ArrowUpDown size={12} className="text-zinc-400" />
                          </span>
                        </th>
                      )}

                      {visibleColumns.audience && (
                        <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850" onClick={() => handleSort('audienceType')}>
                          <span className="flex items-center gap-1.5">
                            Target Audience
                            <ArrowUpDown size={12} className="text-zinc-400" />
                          </span>
                        </th>
                      )}

                      {visibleColumns.scheduleAt && (
                        <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850" onClick={() => handleSort('scheduleAt')}>
                          <span className="flex items-center gap-1.5">
                            Schedule Date
                            <ArrowUpDown size={12} className="text-zinc-400" />
                          </span>
                        </th>
                      )}

                      {visibleColumns.status && (
                        <th className="px-4 py-3.5 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-850 text-center" onClick={() => handleSort('status')}>
                          <span className="flex items-center justify-center gap-1.5">
                            Status
                            <ArrowUpDown size={12} className="text-zinc-400" />
                          </span>
                        </th>
                      )}

                      {visibleColumns.analytics && (
                        <th className="px-4 py-3.5 text-right">Delivery Stats</th>
                      )}

                      {visibleColumns.actions && (
                        <th className="px-4 py-3.5 text-center w-16">Actions</th>
                      )}
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-semibold">
                    {notifications.map((notif) => {
                      const isSelected = selectedIds.includes(notif._id);
                      const isMenuOpen = activeMenuRowId === notif._id;
                      
                      // Derived metrics
                      const failed = (notif.sentCount - notif.deliveredCount) || 0;
                      const openPct = notif.deliveredCount > 0 ? ((notif.openedCount / notif.deliveredCount) * 100).toFixed(0) : '0';

                      return (
                        <tr 
                          key={notif._id} 
                          className={`transition-colors ${
                            isSelected 
                              ? 'bg-[var(--primary)]/5 hover:bg-[var(--primary)]/10' 
                              : 'hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20'
                          }`}
                        >
                          {visibleColumns.select && (
                            <td className="px-4 py-3.5 text-center">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => handleSelectRow(e, notif._id)}
                                className="rounded text-[var(--primary)] focus:ring-[var(--primary)]"
                              />
                            </td>
                          )}

                          {visibleColumns.title && (
                            <td className="px-4 py-3.5 max-w-sm">
                              <div className="space-y-1">
                                <span className="font-bold text-zinc-900 dark:text-zinc-150 block truncate">{notif.title}</span>
                                <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-semibold block truncate leading-normal">
                                  {notif.message}
                                </span>
                              </div>
                            </td>
                          )}

                          {visibleColumns.type && (
                            <td className="px-4 py-3.5">
                              <span className="inline-flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300 font-bold">
                                {notif.type === 'App Push' && <Bell size={13} className="text-blue-500" />}
                                {notif.type === 'SMS' && <MessageSquare size={13} className="text-orange-500" />}
                                {notif.type === 'Email' && <Mail size={13} className="text-purple-500" />}
                                {notif.type === 'Multi Channel' && <Users size={13} className="text-emerald-500" />}
                                {notif.type}
                              </span>
                            </td>
                          )}

                          {visibleColumns.audience && (
                            <td className="px-4 py-3.5">
                              <div className="space-y-0.5">
                                <span className="text-zinc-800 dark:text-zinc-200 block">{notif.audienceType}</span>
                                <span className="text-[9.5px] text-zinc-450 font-bold block">
                                  {notif.regionIds?.length > 0 ? `${notif.regionIds.length} regions` : 'National coverage'}
                                </span>
                              </div>
                            </td>
                          )}

                          {visibleColumns.scheduleAt && (
                            <td className="px-4 py-3.5 text-zinc-500 dark:text-zinc-400">
                              <div className="space-y-0.5">
                                <span className="block">{new Date(notif.scheduleAt).toLocaleDateString('en-IN')}</span>
                                <span className="text-[10px] block font-bold text-zinc-400">
                                  {new Date(notif.scheduleAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </td>
                          )}

                          {visibleColumns.status && (
                            <td className="px-4 py-3.5 text-center select-none">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                                notif.status === 'Draft' ? 'bg-zinc-100 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-300' :
                                notif.status === 'Scheduled' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400' :
                                notif.status === 'Processing' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400' :
                                notif.status === 'Sent' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-450' :
                                notif.status === 'Cancelled' ? 'bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500' :
                                'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                              }`}>
                                {notif.status}
                              </span>
                            </td>
                          )}

                          {visibleColumns.analytics && (
                            <td className="px-4 py-3.5 text-right font-bold text-[10.5px]">
                              {notif.status === 'Sent' || notif.status === 'Processing' ? (
                                <div className="space-y-0.5 text-zinc-700 dark:text-zinc-300">
                                  <span className="block">Deliv: <span className="text-zinc-900 dark:text-white font-black">{notif.deliveredCount.toLocaleString()}</span></span>
                                  <span className="text-[9.5px] block font-bold text-purple-600 dark:text-purple-400">Opened: {openPct}%</span>
                                </div>
                              ) : notif.status === 'Failed' ? (
                                <span className="text-red-550 dark:text-red-400 font-bold block">{notif.sentCount} Target Failed</span>
                              ) : (
                                <span className="text-zinc-400 italic font-semibold">Not Sent yet</span>
                              )}
                            </td>
                          )}

                          {visibleColumns.actions && (
                            <td className="px-4 py-3.5 text-center relative">
                              <button 
                                onClick={() => setActiveMenuRowId(isMenuOpen ? null : notif._id)}
                                className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 rounded-lg transition-colors cursor-pointer"
                              >
                                <MoreVertical size={16} />
                              </button>

                              {/* Row action popup menu */}
                              {isMenuOpen && (
                                <div 
                                  ref={menuRef}
                                  className="absolute right-6 mt-1.5 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-20 py-2 text-xs font-bold text-zinc-750 dark:text-zinc-350 text-left"
                                >
                                  <button 
                                    onClick={() => {
                                      setDetailsNotifId(notif._id);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-left text-zinc-700 dark:text-zinc-300"
                                  >
                                    <Eye size={13} />
                                    View Details
                                  </button>
                                  
                                  {(notif.status === 'Sent' || notif.status === 'Processing') && (
                                    <button 
                                      onClick={() => {
                                        setLogsNotifId(notif._id);
                                        setActiveMenuRowId(null);
                                      }}
                                      className="w-full px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-left text-[var(--primary)]"
                                    >
                                      <BarChart2 size={13} />
                                      View Delivery Logs
                                    </button>
                                  )}

                                  {(notif.status === 'Scheduled' || notif.status === 'Draft') && (
                                    <button 
                                      onClick={() => {
                                        setEditingNotifId(notif._id);
                                        setActiveMenuRowId(null);
                                      }}
                                      className="w-full px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-left text-zinc-700 dark:text-zinc-300"
                                    >
                                      <Edit size={13} />
                                      Edit Notification
                                    </button>
                                  )}

                                  {notif.status === 'Scheduled' && (
                                    <>
                                      <button 
                                        onClick={() => {
                                          setRescheduleNotifId(notif._id);
                                          setActiveMenuRowId(null);
                                        }}
                                        className="w-full px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-left text-blue-650"
                                      >
                                        <Calendar size={13} />
                                        Reschedule Date
                                      </button>
                                      <button 
                                        onClick={() => {
                                          setCancelNotifId(notif._id);
                                          setActiveMenuRowId(null);
                                        }}
                                        className="w-full px-4 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-1.5 text-left text-red-500"
                                      >
                                        <Pause size={13} />
                                        Cancel Schedule
                                      </button>
                                    </>
                                  )}

                                  <button 
                                    onClick={() => {
                                      setDeleteConfirmId(notif._id);
                                      setActiveMenuRowId(null);
                                    }}
                                    className="w-full px-4 py-2 hover:bg-red-50 dark:hover:bg-red-950/20 hover:text-red-500 transition-colors flex items-center gap-1.5 text-left text-red-500 font-bold border-t border-zinc-100 dark:border-zinc-800"
                                  >
                                    <Trash2 size={13} />
                                    Delete Record
                                  </button>
                                </div>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}

                    {notifications.length === 0 && (
                      <tr>
                        <td colSpan="8" className="px-4 py-16 text-center text-zinc-450 dark:text-zinc-500 font-extrabold">
                          No notifications found matching the current search parameters.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Table Pagination Footer */}
              <div className="px-4.5 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 select-none">
                
                {/* Limit per page select */}
                <div className="flex items-center gap-2 text-xs font-bold text-zinc-550 dark:text-zinc-400">
                  <span>Display Limit</span>
                  <select 
                    value={pagination.limit}
                    onChange={(e) => {
                      setPagination(prev => ({ ...prev, limit: parseInt(e.target.value), page: 1 }));
                    }}
                    className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg px-2 py-1 outline-none text-zinc-700 dark:text-zinc-200"
                  >
                    <option value={5}>5 entries</option>
                    <option value={10}>10 entries</option>
                    <option value={20}>20 entries</option>
                  </select>
                  <span>showing {totalCount === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1} - {Math.min(pagination.page * pagination.limit, totalCount)} of {totalCount} broadcasts</span>
                </div>

                {/* Page number buttons */}
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(prev.page - 1, 1) }))}
                    disabled={pagination.page === 1}
                    className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                  >
                    Prev
                  </button>

                  {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((pNum) => (
                    <button
                      key={pNum}
                      onClick={() => setPagination(prev => ({ ...prev, page: pNum }))}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                        pagination.page === pNum
                          ? 'bg-[var(--primary)] text-white'
                          : 'bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      }`}
                    >
                      {pNum}
                    </button>
                  ))}

                  <button 
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.page + 1, totalPages) }))}
                    disabled={pagination.page === totalPages}
                    className="px-3.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer"
                  >
                    Next
                  </button>
                </div>

              </div>

            </div>
          )}

        </div>



      {/* Confirmation Dialog for Delete */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-200 select-none">
            <div className="p-3 bg-red-100 text-red-500 rounded-full mb-4">
              <AlertTriangle size={24} />
            </div>
            
            <h3 className="text-xs font-extrabold uppercase tracking-wide text-zinc-900 dark:text-zinc-100">Delete Notification</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed font-semibold">
              Are you sure you want to delete this notification record? This action is permanent and cannot be undone.
            </p>

            <div className="flex gap-3 mt-6 w-full text-xs font-bold">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300 rounded-xl transition-colors cursor-pointer"
              >
                No, Keep it
              </button>
              <button 
                onClick={() => handleDeleteNotification(deleteConfirmId)}
                className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl transition-colors shadow-md cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE MODAL */}
      <CreateNotification 
        isOpen={isCreateOpen} 
        onClose={() => setIsCreateOpen(false)} 
        onCreated={() => {
          setIsCreateOpen(false);
          triggerToast('Notification scheduled/sent successfully.');
          setRetryTrigger(prev => prev + 1);
        }}
      />

      {/* EDIT MODAL */}
      <EditNotification 
        notificationId={editingNotifId}
        isOpen={editingNotifId !== null} 
        onClose={() => setEditingNotifId(null)} 
        onUpdated={() => {
          setEditingNotifId(null);
          triggerToast('Notification details updated successfully.');
          setRetryTrigger(prev => prev + 1);
        }}
      />

      {/* DETAILS SLIDING DRAWER */}
      <NotificationDetails 
        notificationId={detailsNotifId}
        isOpen={detailsNotifId !== null}
        onClose={() => setDetailsNotifId(null)}
        onEdit={(id) => {
          setDetailsNotifId(null);
          setEditingNotifId(id);
        }}
      />

      {/* LOGS MODAL */}
      <NotificationLogs 
        notificationId={logsNotifId}
        isOpen={logsNotifId !== null}
        onClose={() => setLogsNotifId(null)}
      />

      {/* RESCHEDULE MODAL */}
      <RescheduleNotification 
        notificationId={rescheduleNotifId}
        isOpen={rescheduleNotifId !== null}
        onClose={() => setRescheduleNotifId(null)}
        onRescheduled={() => {
          setRescheduleNotifId(null);
          triggerToast('Distribution rescheduled successfully.');
          setRetryTrigger(prev => prev + 1);
        }}
      />

      {/* CANCEL MODAL */}
      <CancelNotification 
        notificationId={cancelNotifId}
        isOpen={cancelNotifId !== null}
        onClose={() => setCancelNotifId(null)}
        onCancelled={() => {
          setCancelNotifId(null);
          triggerToast('Scheduled distribution cancelled.');
          setRetryTrigger(prev => prev + 1);
        }}
      />

    </div>
  );
}
