import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardList, RefreshCw, Download, Sliders, X, Search, ChevronRight, 
  ChevronDown, Calendar, Filter, Save, FileText, CheckCircle, XCircle, 
  AlertTriangle, Shield, Laptop, Globe, User, Clock, Terminal, PieChart as LucidePieChart, 
  Settings, Key, AlertCircle, Copy, Check, Database, Activity 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, 
  BarChart, Bar, Cell, LineChart, Line, PieChart, Pie 
} from 'recharts';

// Import Connected Modals
import LogDetailsModal from './LogDetailsModal';
import ExportLogsModal from './ExportLogsModal';
import SavedFilterModal from './SavedFilterModal';
import JsonViewerModal from './JsonViewerModal';
import { ChangeSummaryTable } from './AuditHelper';

// Mock Audit Logs Data (GET /api/audit-logs)
const INITIAL_AUDITS = [
  {
    _id: "log_aud_001",
    actorId: "usr_sa_101",
    actorRole: "Super Admin",
    userName: "Shubham Jamliya",
    action: "Update Global Price",
    module: "Settings",
    entityId: "Global Pricing Configuration",
    oldValue: { baseDeliveryFee: 40, minimumOrderValue: 200, freeDeliveryThreshold: 500 },
    newValue: { baseDeliveryFee: 50, minimumOrderValue: 250, freeDeliveryThreshold: 600 },
    ipAddress: "192.168.1.45",
    device: "Desktop",
    browser: "Chrome",
    location: "Mumbai, India",
    status: "Success",
    createdAt: "2026-06-19T18:10:00Z"
  },
  {
    _id: "log_aud_002",
    actorId: "usr_adm_202",
    actorRole: "Admin",
    userName: "Priya Sharma",
    action: "Modify Franchise Comm.",
    module: "Franchise",
    entityId: "Mumbai Franchise Store",
    oldValue: { commissionPercentage: 10, payoutCycle: "weekly" },
    newValue: { commissionPercentage: 12, payoutCycle: "weekly" },
    ipAddress: "103.88.22.190",
    device: "Desktop",
    browser: "Safari",
    location: "Pune, India",
    status: "Success",
    createdAt: "2026-06-19T17:45:00Z"
  },
  {
    _id: "log_aud_003",
    actorId: "usr_sm_304",
    actorRole: "Store Manager",
    userName: "Amit Kumar",
    action: "Modify Product Stock",
    module: "Products",
    entityId: "Veg Supreme Pizza",
    oldValue: { stockAvailable: 15, isAvailable: true },
    newValue: { stockAvailable: 0, isAvailable: false },
    ipAddress: "157.44.192.10",
    device: "Mobile",
    browser: "Firefox",
    location: "Indore, India",
    status: "Success",
    createdAt: "2026-06-19T16:22:12Z"
  },
  {
    _id: "log_aud_004",
    actorId: "usr_adm_202",
    actorRole: "Admin",
    userName: "Priya Sharma",
    action: "Add Combo Deal",
    module: "Products",
    entityId: "Triple Feast Combo",
    oldValue: null,
    newValue: { comboName: "Triple Feast Combo", price: 899, items: ["Tandoori Paneer Pizza", "Veg Supreme Pizza", "Choco Lava Cake"] },
    ipAddress: "103.88.22.190",
    device: "Desktop",
    browser: "Chrome",
    location: "Pune, India",
    status: "Success",
    createdAt: "2026-06-19T15:10:00Z"
  },
  {
    _id: "log_aud_005",
    actorId: "usr_sa_102",
    actorRole: "Super Admin",
    userName: "Ramesh Patel",
    action: "Disable Payment Gateway",
    module: "Payments",
    entityId: "Paytm Payment Gateway",
    oldValue: { status: "Active", defaultGateway: false },
    newValue: { status: "Inactive", defaultGateway: false },
    ipAddress: "115.244.90.18",
    device: "Tablet",
    browser: "Chrome",
    location: "Delhi, India",
    status: "Failed",
    createdAt: "2026-06-19T14:32:00Z"
  },
  {
    _id: "log_aud_006",
    actorId: "usr_sm_308",
    actorRole: "Store Manager",
    userName: "Rahul Singh",
    action: "Update Order Status",
    module: "Orders",
    entityId: "Order #29108",
    oldValue: { orderStatus: "Prep", kitchenAssigned: "Staff A" },
    newValue: { orderStatus: "Ready", kitchenAssigned: "Staff A" },
    ipAddress: "157.44.12.88",
    device: "Mobile",
    browser: "Chrome",
    location: "Bhopal, India",
    status: "Success",
    createdAt: "2026-06-19T13:05:19Z"
  },
  {
    _id: "log_aud_007",
    actorId: "usr_adm_203",
    actorRole: "Admin",
    userName: "Aisha Khan",
    action: "Modify Campaign settings",
    module: "Marketing",
    entityId: "Tasty Monday Campaign",
    oldValue: { discountPercentage: 15, active: true },
    newValue: { discountPercentage: 20, active: true },
    ipAddress: "122.161.44.9",
    device: "Desktop",
    browser: "Edge",
    location: "Noida, India",
    status: "Warning",
    createdAt: "2026-06-19T11:40:00Z"
  }
];

// Mock Login Events Data
const INITIAL_LOGINS = [
  { _id: "log_lin_001", actorId: "usr_sa_101", userName: "Shubham Jamliya", actorRole: "Super Admin", ipAddress: "192.168.1.45", device: "Desktop", browser: "Chrome", location: "Mumbai, India", status: "Success", createdAt: "2026-06-19T18:01:00Z" },
  { _id: "log_lin_002", actorId: "usr_adm_202", userName: "Priya Sharma", actorRole: "Admin", ipAddress: "103.88.22.190", device: "Desktop", browser: "Safari", location: "Pune, India", status: "Success", createdAt: "2026-06-19T17:30:00Z" },
  { _id: "log_lin_003", actorId: "usr_sm_304", userName: "Amit Kumar", actorRole: "Store Manager", ipAddress: "157.44.192.10", device: "Mobile", browser: "Firefox", location: "Indore, India", status: "Success", createdAt: "2026-06-19T16:15:00Z" },
  { _id: "log_lin_004", actorId: "usr_sm_999", userName: "Unknown user", actorRole: "Store Manager", ipAddress: "45.122.9.200", device: "Mobile", browser: "Opera", location: "Lagos, Nigeria", status: "Blocked", createdAt: "2026-06-19T15:44:12Z" },
  { _id: "log_lin_005", actorId: "usr_sa_102", userName: "Ramesh Patel", actorRole: "Super Admin", ipAddress: "115.244.90.18", device: "Tablet", browser: "Chrome", location: "Delhi, India", status: "Failed", createdAt: "2026-06-19T14:20:00Z" }
];

// Mock System Activities Data
const INITIAL_SYSTEM = [
  { _id: "log_sys_001", module: "Settings", action: "Daily Revenue Sync", entityId: "Daily Revenue Sync", status: "Success", triggeredBy: "Cron Job", duration: "12.4s", createdAt: "2026-06-19T18:00:00Z" },
  { _id: "log_sys_002", module: "Marketing", action: "Push Expired Coupons", entityId: "Coupon Expiry Job", status: "Success", triggeredBy: "Cron Job", duration: "2.1s", createdAt: "2026-06-19T17:00:00Z" },
  { _id: "log_sys_003", module: "Orders", action: "Rider Allocator Queue", entityId: "Rider Allocation Job", status: "Success", triggeredBy: "Background Task", duration: "0.8s", createdAt: "2026-06-19T16:55:00Z" },
  { _id: "log_sys_004", module: "Payments", action: "Auto Settlement Sync", entityId: "Razorpay Settlement Sync", status: "Failed", triggeredBy: "Background Task", duration: "45.2s", createdAt: "2026-06-19T15:00:00Z" }
];

// Mock Analytics Chart Data
const DAILY_TREND_DATA = [
  { name: 'Jun 13', Success: 180, Failed: 12 },
  { name: 'Jun 14', Success: 210, Failed: 8 },
  { name: 'Jun 15', Success: 195, Failed: 14 },
  { name: 'Jun 16', Success: 240, Failed: 19 },
  { name: 'Jun 17', Success: 280, Failed: 22 },
  { name: 'Jun 18', Success: 320, Failed: 15 },
  { name: 'Jun 19', Success: 380, Failed: 9 },
];

const MODULE_SHARE_DATA = [
  { name: 'Products', value: 35, color: '#6366F1' },
  { name: 'Orders', value: 25, color: '#3B82F6' },
  { name: 'Payments', value: 15, color: '#10B981' },
  { name: 'Settings', value: 15, color: '#F59E0B' },
  { name: 'Franchise', value: 10, color: '#EC4899' }
];

export default function AuditLogs() {
  const [audits, setAudits] = useState(INITIAL_AUDITS);
  const [logins, setLogins] = useState(INITIAL_LOGINS);
  const [systems, setSystems] = useState(INITIAL_SYSTEM);
  
  const [activeTab, setActiveTab] = useState('audit'); // 'audit' | 'login' | 'system' | 'analytics'
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStickyHeader, setIsStickyHeader] = useState(false);
  const [expandedRows, setExpandedRows] = useState([]);
  const [selectedLogs, setSelectedLogs] = useState([]);

  // Active filters controlled state
  const [selectedRole, setSelectedRole] = useState('All');
  const [selectedModule, setSelectedModule] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedBrowser, setSelectedBrowser] = useState('All');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Modals state
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isSavePresetOpen, setIsSavePresetOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);

  // Saved presets state
  const [filterPresets, setFilterPresets] = useState([
    { name: "Payments Failures", description: "Filter only payment status errors", visibility: "shared" },
    { name: "SuperAdmin Actions", description: "Track all superadmin actions", visibility: "private" }
  ]);

  // Handle sticky header scroll shadow
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setIsStickyHeader(true);
      } else {
        setIsStickyHeader(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Debouncing Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Refresh logs simulation
  const handleRefresh = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Audit records synchronized!");
    }, 800);
  };

  // Saved Preset Submission
  const handleSavePreset = (presetData) => {
    setFilterPresets(prev => [...prev, presetData]);
    toast.success(`Filter Preset "${presetData.name}" saved!`);
  };

  // Toggle Row Expansion inline preview
  const toggleRowExpand = (id) => {
    if (expandedRows.includes(id)) {
      setExpandedRows(expandedRows.filter(rid => rid !== id));
    } else {
      setExpandedRows([...expandedRows, id]);
    }
  };

  // Checkbox select logs
  const toggleSelectLog = (id) => {
    if (selectedLogs.includes(id)) {
      setSelectedLogs(selectedLogs.filter(lid => lid !== id));
    } else {
      setSelectedLogs([...selectedLogs, id]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedLogs.length === filteredAudits.length) {
      setSelectedLogs([]);
    } else {
      setSelectedLogs(filteredAudits.map(l => l._id));
    }
  };

  // Compute filtered audits list
  const filteredAudits = useMemo(() => {
    return audits.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.actorId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.action.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        (log.entityId && log.entityId.toLowerCase().includes(debouncedSearch.toLowerCase())) ||
        log.ipAddress.toLowerCase().includes(debouncedSearch.toLowerCase());
      
      const matchesRole = selectedRole === 'All' || log.actorRole === selectedRole;
      const matchesModule = selectedModule === 'All' || log.module === selectedModule;
      const matchesStatus = selectedStatus === 'All' || log.status === selectedStatus;
      const matchesBrowser = selectedBrowser === 'All' || log.browser === selectedBrowser;

      return matchesSearch && matchesRole && matchesModule && matchesStatus && matchesBrowser;
    });
  }, [audits, debouncedSearch, selectedRole, selectedModule, selectedStatus, selectedBrowser]);

  // Compute filtered login events list
  const filteredLogins = useMemo(() => {
    return logins.filter(log => {
      const matchesSearch = 
        log.userName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.actorId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.ipAddress.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesRole = selectedRole === 'All' || log.actorRole === selectedRole;
      const matchesStatus = selectedStatus === 'All' || log.status === selectedStatus;
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [logins, debouncedSearch, selectedRole, selectedStatus]);

  // Compute filtered system events list
  const filteredSystems = useMemo(() => {
    return systems.filter(log => {
      const matchesSearch = 
        log.action.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.triggeredBy.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
        log.entityId.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesModule = selectedModule === 'All' || log.module === selectedModule;
      const matchesStatus = selectedStatus === 'All' || log.status === selectedStatus;
      return matchesSearch && matchesModule && matchesStatus;
    });
  }, [systems, debouncedSearch, selectedModule, selectedStatus]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedRole('All');
    setSelectedModule('All');
    setSelectedStatus('All');
    setSelectedBrowser('All');
    toast.info("All search filter parameters cleared!");
  };

  return (
    <div className="p-4 space-y-5 bg-white dark:bg-zinc-950 min-h-screen text-black dark:text-zinc-100">
      
      {/* 1. Header Section (Sticky on scroll) */}
      <header className={`transition-all duration-300 rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 ${
        isStickyHeader 
          ? 'sticky top-16 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md shadow-md border-b border-zinc-200 dark:border-zinc-800' 
          : 'bg-zinc-50 dark:bg-zinc-900/40'
      } flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div className="space-y-1">
          <h2 className="text-lg font-black text-black dark:text-zinc-50 flex items-center gap-2">
            <ClipboardList className="text-[var(--primary)]" size={22} />
            Audit Logs
          </h2>
          <p className="text-[11px] text-zinc-700 dark:text-zinc-350 font-semibold leading-relaxed max-w-2xl">
            Track platform activities, configuration changes, login events, and system actions across the entire ecosystem.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-black dark:text-zinc-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            Refresh Logs
          </button>

          <button 
            onClick={() => setIsExportOpen(true)}
            className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-black dark:text-zinc-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Download size={13} className="text-blue-500" />
            Export Logs
          </button>

          <button 
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 border rounded-lg transition-all flex items-center gap-1.5 text-xs font-bold ${
              showAdvancedFilters 
                ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]' 
                : 'border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100'
            }`}
          >
            <Sliders size={13} className="text-purple-500" />
            Advanced Filters
          </button>

          {(searchQuery || selectedRole !== 'All' || selectedModule !== 'All' || selectedStatus !== 'All' || selectedBrowser !== 'All') && (
            <button 
              onClick={clearAllFilters}
              className="px-3 py-2 border border-red-300/30 hover:bg-red-500/5 rounded-lg text-red-500 transition-all flex items-center gap-1.5 text-xs font-bold"
            >
              <X size={13} />
              Clear Filters
            </button>
          )}
        </div>
      </header>

      {/* 2. KPI Cards Grid (loading skeletons simulation) */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        
        {/* Card 1: Today's Activities */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Today's Actions</span>
            <Activity className="text-indigo-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">1,402</p>
          <span className="text-[8.5px] px-1 bg-emerald-500/10 text-emerald-600 rounded font-black">+14% Growth</span>
        </div>

        {/* Card 2: Failed Actions */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Failed Actions</span>
            <XCircle className="text-red-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">3</p>
          <span className="text-[8.5px] px-1 bg-red-500/10 text-red-500 rounded font-black">Requires Review</span>
        </div>

        {/* Card 3: Login Events */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Login Audits</span>
            <Shield className="text-blue-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">142</p>
          <span className="text-[8.5px] px-1 bg-emerald-500/10 text-emerald-600 rounded font-black">All Verified</span>
        </div>

        {/* Card 4: Permission Changes */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Access Audits</span>
            <Key className="text-amber-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">12</p>
          <span className="text-[8.5px] px-1 bg-amber-500/10 text-amber-600 rounded font-black">Role updates</span>
        </div>

        {/* Card 5: Product Updates */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Product Edits</span>
            <Sliders className="text-purple-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">45</p>
          <span className="text-[8.5px] text-emerald-600 font-extrabold">+8%</span>
        </div>

        {/* Card 6: Order Updates */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Order Logs</span>
            <FileText className="text-sky-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">894</p>
          <span className="text-[8.5px] px-1 bg-emerald-500/10 text-emerald-600 rounded font-black">Live updates</span>
        </div>

        {/* Card 7: Payment Changes */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Payment Audits</span>
            <Settings className="text-emerald-500" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">8</p>
          <span className="text-[8.5px] px-1 bg-amber-500/10 text-amber-600 rounded font-black">Gateways sync</span>
        </div>

        {/* Card 8: System Jobs */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-1.5 text-zinc-700 dark:text-zinc-300">
          <div className="flex justify-between items-center text-[9px] uppercase tracking-wider font-semibold">
            <span>Background Runs</span>
            <Database className="text-zinc-650" size={13} />
          </div>
          <p className="text-xl font-bold text-zinc-900 dark:text-zinc-50">210</p>
          <span className="text-[8.5px] px-1 bg-emerald-500/10 text-emerald-600 rounded font-black">All Completed</span>
        </div>
      </section>

      {/* 3. Search and Filters Section */}
      <section className="bg-zinc-50 dark:bg-zinc-900/20 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          {/* Global debounced search input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input 
              type="text" 
              placeholder="Search by User, Action, Entity ID, or IP Address..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-3 border border-zinc-300 dark:border-zinc-750 rounded-lg bg-white dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100 font-semibold"
            />
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsSavePresetOpen(true)}
              className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-black dark:text-zinc-100 flex items-center gap-1.5 text-xs font-bold"
            >
              <Save size={13} className="text-emerald-500" />
              Save Preset
            </button>
            <button 
              onClick={clearAllFilters}
              className="px-3 py-2 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-105 rounded-lg text-zinc-750 dark:text-zinc-300 flex items-center gap-1.5 text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Advanced Filters Drawer/Container */}
        {showAdvancedFilters && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-zinc-150 dark:border-zinc-800 text-xs font-semibold">
            
            {/* Filter by Role */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Actor Role</label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full h-8 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none text-zinc-850 dark:text-zinc-100"
              >
                <option value="All">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Store Manager">Store Manager</option>
                <option value="Kitchen Staff">Kitchen Staff</option>
                <option value="Delivery Partner">Delivery Partner</option>
              </select>
            </div>

            {/* Filter by Module */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Target Module</label>
              <select
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
                className="w-full h-8 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none text-zinc-850 dark:text-zinc-100"
              >
                <option value="All">All Modules</option>
                <option value="Authentication">Authentication</option>
                <option value="Products">Products</option>
                <option value="Orders">Orders</option>
                <option value="Payments">Payments</option>
                <option value="Settings">Settings</option>
                <option value="Franchise">Franchise</option>
              </select>
            </div>

            {/* Filter by Status */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Result Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full h-8 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none text-zinc-850 dark:text-zinc-100"
              >
                <option value="All">All Statuses</option>
                <option value="Success">Success</option>
                <option value="Failed">Failed</option>
                <option value="Warning">Warning</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {/* Filter by Browser */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Browser Client</label>
              <select
                value={selectedBrowser}
                onChange={(e) => setSelectedBrowser(e.target.value)}
                className="w-full h-8 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none text-zinc-855 dark:text-zinc-100"
              >
                <option value="All">All Clients</option>
                <option value="Chrome">Chrome</option>
                <option value="Safari">Safari</option>
                <option value="Firefox">Firefox</option>
                <option value="Edge">Edge</option>
              </select>
            </div>

            {/* Filter Presets Selection */}
            <div className="space-y-1">
              <label className="text-[10px] text-zinc-500 uppercase tracking-wider block">Saved Filter Presets</label>
              <div className="flex gap-1.5 h-8">
                <select
                  onChange={(e) => {
                    const presetName = e.target.value;
                    if (presetName === 'Payments Failures') {
                      setSelectedStatus('Failed');
                      setSelectedModule('Payments');
                      toast.info("Applied preset: Payments Failures");
                    } else if (presetName === 'SuperAdmin Actions') {
                      setSelectedRole('Super Admin');
                      toast.info("Applied preset: SuperAdmin Actions");
                    }
                  }}
                  className="flex-1 px-2 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-white dark:bg-zinc-800 outline-none text-[11px]"
                >
                  <option value="">Apply Saved Preset...</option>
                  {filterPresets.map(preset => (
                    <option key={preset.name} value={preset.name}>{preset.name}</option>
                  ))}
                </select>
              </div>
            </div>

          </div>
        )}
      </section>

      {/* 4. Split Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Side: Main Tables & Views (Col Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Tab Selection */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-850 pb-1">
            <div className="flex gap-2">
              {[
                { id: 'audit', label: 'Audit Logs' },
                { id: 'login', label: 'Login Events' },
                { id: 'system', label: 'System Activities' },
                { id: 'analytics', label: 'Analytics' }
              ].map(t => (
                <button 
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setExpandedRows([]); }}
                  className={`px-3 py-2 text-xs font-extrabold capitalize transition-all relative ${
                    activeTab === t.id 
                      ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' 
                      : 'text-zinc-750 dark:text-zinc-300 hover:opacity-85'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            
            {selectedLogs.length > 0 && activeTab === 'audit' && (
              <button 
                onClick={() => {
                  toast.success(`Bulk exported ${selectedLogs.length} audit logs!`);
                  setSelectedLogs([]);
                }}
                className="px-2.5 py-1.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-md text-[10px] font-black uppercase flex items-center gap-1 hover:bg-emerald-500/20 transition-all"
              >
                <Download size={11} />
                Bulk Export Selected ({selectedLogs.length})
              </button>
            )}
          </div>

          {/* TAB 1: Audit Logs main data table */}
          {activeTab === 'audit' && (
            <div className="space-y-4">
              
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3 w-8 text-center">
                        <input 
                          type="checkbox"
                          checked={filteredAudits.length > 0 && selectedLogs.length === filteredAudits.length}
                          onChange={toggleSelectAll}
                          className="text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer"
                        />
                      </th>
                      <th className="p-3 w-8"></th>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Actor (User)</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">Module</th>
                      <th className="p-3">Action</th>
                      <th className="p-3">Entity Reference ID</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold text-black dark:text-zinc-100">
                    {filteredAudits.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="p-8 text-center text-zinc-500 italic">
                          No audit log records matching the active filters
                        </td>
                      </tr>
                    ) : (
                      filteredAudits.map((log) => {
                        const isExpanded = expandedRows.includes(log._id);
                        const isSelected = selectedLogs.includes(log._id);
                        return (
                          <React.Fragment key={log._id}>
                            <tr 
                              className={`hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 cursor-pointer ${
                                isSelected ? 'bg-[var(--primary)]/5' : ''
                              }`}
                              onClick={() => toggleRowExpand(log._id)}
                            >
                              <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                                <input 
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => toggleSelectLog(log._id)}
                                  className="text-[var(--primary)] focus:ring-[var(--primary)] rounded cursor-pointer"
                                />
                              </td>
                              <td className="p-3 text-center">
                                <ChevronRight size={14} className={`transform transition-transform text-zinc-500 ${isExpanded ? 'rotate-90' : ''}`} />
                              </td>
                              <td className="p-3 text-[10px] whitespace-nowrap">
                                {new Date(log.createdAt).toLocaleString()}
                              </td>
                              <td className="p-3 font-extrabold">{log.userName}</td>
                              <td className="p-3 font-medium">{log.actorRole}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase border inline-block ${
                                  log.module === 'Products' ? 'bg-indigo-500/10 text-indigo-650 border-indigo-500/20' :
                                  log.module === 'Orders' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20' :
                                  log.module === 'Payments' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                  'bg-zinc-500/10 text-zinc-650 border-zinc-500/20'
                                }`}>
                                  {log.module}
                                </span>
                              </td>
                              <td className="p-3 font-extrabold text-[11px]">{log.action}</td>
                              <td className="p-3 font-mono text-[10.5px] select-all max-w-[120px] truncate">{log.entityId || 'N/A'}</td>
                              <td className="p-3 font-mono text-[10px] text-zinc-500">{log.ipAddress}</td>
                              <td className="p-3">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                                  log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                                  log.status === 'Failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                  log.status === 'Warning' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                                  'bg-zinc-500/10 text-zinc-650 border-zinc-500/20'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                              <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-end gap-1">
                                  <button 
                                    onClick={() => { setSelectedLog(log); setIsDetailsOpen(true); }}
                                    className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] font-bold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100"
                                    title="View Details"
                                  >
                                    View
                                  </button>
                                  {log.oldValue && log.newValue && (
                                    <button 
                                      onClick={() => { setSelectedLog(log); setIsComparisonOpen(true); }}
                                      className="p-1 border border-zinc-200 dark:border-zinc-700 rounded text-[9.5px] font-bold text-indigo-500 hover:bg-zinc-100"
                                      title="Compare JSON Diffs"
                                    >
                                      Diff
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-zinc-50/40 dark:bg-zinc-900/30">
                                <td colSpan={11} className="p-4">
                                  <div className="space-y-3 text-xs">
                                    <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-bold border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                                      <div>Actor ID: <span className="font-mono text-black dark:text-zinc-200 font-extrabold">{log.actorId}</span></div>
                                      <div>Location: <span className="text-black dark:text-zinc-200 font-extrabold">{log.location}</span></div>
                                      <div>Device client: <span className="text-black dark:text-zinc-200 font-extrabold">{log.device} ({log.browser})</span></div>
                                    </div>
                                    <div className="space-y-1">
                                      <span className="text-[9px] font-black uppercase text-zinc-550 block mb-1">Modified Details</span>
                                      <ChangeSummaryTable oldVal={log.oldValue} newVal={log.newValue} />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Server-side Pagination mock */}
              <div className="flex justify-between items-center text-xs font-semibold px-1">
                <span className="text-zinc-500">Showing 1-{filteredAudits.length} of {filteredAudits.length} entries</span>
                <div className="flex gap-1">
                  <button disabled className="px-3 py-1 border border-zinc-200 rounded-lg text-zinc-400 font-bold opacity-75 cursor-not-allowed">Previous</button>
                  <button className="px-3.5 py-1 bg-[var(--primary)] text-white rounded-lg font-extrabold">1</button>
                  <button disabled className="px-3 py-1 border border-zinc-200 rounded-lg text-zinc-400 font-bold opacity-75 cursor-not-allowed">Next</button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: Login Events */}
          {activeTab === 'login' && (
            <div className="space-y-4">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 shadow-xs">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Successful Logins</span>
                  <div className="flex justify-between items-baseline">
                    <p className="text-lg font-black text-emerald-600">138</p>
                    <span className="text-[8px] px-1 bg-emerald-500/10 text-emerald-600 rounded">97% rate</span>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 shadow-xs">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Failed attempts</span>
                  <div className="flex justify-between items-baseline">
                    <p className="text-lg font-black text-rose-500">3</p>
                    <span className="text-[8px] px-1 bg-red-500/10 text-red-500 rounded">Verify credentials</span>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 shadow-xs">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Suspicious Activities</span>
                  <div className="flex justify-between items-baseline">
                    <p className="text-lg font-black text-amber-500">1</p>
                    <span className="text-[8px] px-1 bg-amber-500/10 text-amber-600 rounded">IP validation check</span>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 shadow-xs">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Blocked IP Requests</span>
                  <div className="flex justify-between items-baseline">
                    <p className="text-lg font-black text-zinc-800 dark:text-zinc-100">0</p>
                    <span className="text-[8px] text-zinc-550">Secure status</span>
                  </div>
                </div>
              </div>

              {/* Login Events Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Actor (User)</th>
                      <th className="p-3">Role</th>
                      <th className="p-3">IP Address</th>
                      <th className="p-3">Device Client</th>
                      <th className="p-3">Location</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold text-black dark:text-zinc-100">
                    {filteredLogins.map(l => (
                      <tr key={l._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="p-3 text-[10px]">{new Date(l.createdAt).toLocaleString()}</td>
                        <td className="p-3 font-extrabold">{l.userName}</td>
                        <td className="p-3 font-medium">{l.actorRole}</td>
                        <td className="p-3 font-mono text-zinc-500">{l.ipAddress}</td>
                        <td className="p-3 text-[10.5px]">{l.device} ({l.browser})</td>
                        <td className="p-3">{l.location}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                            l.status === 'Success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            l.status === 'Failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                            'bg-amber-500/10 text-amber-600 border-amber-500/20'
                          }`}>
                            {l.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: System Activities */}
          {activeTab === 'system' && (
            <div className="space-y-4">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 shadow-xs">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Cron Jobs Enabled</span>
                  <div className="flex justify-between items-baseline">
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-50">4</p>
                    <span className="text-[8px] px-1 bg-emerald-500/10 text-emerald-600 rounded">All active</span>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 shadow-xs">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Completed Runs</span>
                  <div className="flex justify-between items-baseline">
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-50">208</p>
                    <span className="text-[8px] px-1 bg-emerald-500/10 text-emerald-600 rounded">100% success</span>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 shadow-xs">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Failed runs</span>
                  <div className="flex justify-between items-baseline">
                    <p className="text-lg font-black text-rose-500">2</p>
                    <span className="text-[8px] px-1 bg-red-500/10 text-red-500 rounded">Alert active</span>
                  </div>
                </div>
                <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-1 shadow-xs">
                  <span className="text-[9px] text-zinc-500 uppercase tracking-wider block">Average Duration</span>
                  <div className="flex justify-between items-baseline">
                    <p className="text-lg font-black text-zinc-900 dark:text-zinc-50">2.4s</p>
                    <span className="text-[8px] text-zinc-550">Stable</span>
                  </div>
                </div>
              </div>

              {/* System Activities Table */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Module</th>
                      <th className="p-3">Action Description</th>
                      <th className="p-3">Event Identifier</th>
                      <th className="p-3">Triggered By</th>
                      <th className="p-3">Execution Duration</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold text-black dark:text-zinc-100">
                    {filteredSystems.map(s => (
                      <tr key={s._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10">
                        <td className="p-3 text-[10px]">{new Date(s.createdAt).toLocaleString()}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded text-[8px] font-black uppercase border inline-block bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                            {s.module}
                          </span>
                        </td>
                        <td className="p-3 font-extrabold">{s.action}</td>
                        <td className="p-3 font-mono text-[10px] text-zinc-550">{s.entityId}</td>
                        <td className="p-3 text-zinc-750 dark:text-zinc-300">{s.triggeredBy}</td>
                        <td className="p-3 font-mono text-[10px]">{s.duration}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                            s.status === 'Success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                            'bg-red-500/10 text-red-500 border-red-500/20'
                          }`}>
                            {s.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 4: Analytics Charts */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* 1. Area Chart: Activities Per Day */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-xs">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Audit Operations Trend (7 Days)</h4>
                    <p className="text-[9.5px] text-zinc-500 mt-0.5 font-bold">Daily completed and failed operations rate</p>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={DAILY_TREND_DATA}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                        <Area type="monotone" dataKey="Success" stroke="#10B981" fillOpacity={0.05} fill="#10B981" />
                        <Area type="monotone" dataKey="Failed" stroke="#EF4444" fillOpacity={0.05} fill="#EF4444" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 2. Bar Chart: Module Usage */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-xs">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Audit logs workload by module</h4>
                    <p className="text-[9.5px] text-zinc-500 mt-0.5 font-bold">Distribution of actions recorded across business modules</p>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={MODULE_SHARE_DATA}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                        <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                          {MODULE_SHARE_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>

              {/* 3. Lower summary charts row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                
                {/* Browser client share */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-xs text-black dark:text-zinc-100">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider mb-1">Browser Share</h4>
                    <p className="text-[9px] text-zinc-500 font-bold">Client browser agents verified in audits</p>
                  </div>
                  <div className="h-28 flex items-center justify-center">
                    <span className="text-[10px] text-zinc-550 font-extrabold">Chrome: 82% | Safari: 12% | Edge: 6%</span>
                  </div>
                </div>

                {/* Device distribution */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-xs text-black dark:text-zinc-100">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider mb-1">Device Client Distribution</h4>
                    <p className="text-[9px] text-zinc-500 font-bold">Logins categorized by device type</p>
                  </div>
                  <div className="h-28 flex items-center justify-center">
                    <span className="text-[10px] text-zinc-550 font-extrabold">Desktop: 65% | Mobile: 30% | Tablet: 5%</span>
                  </div>
                </div>

                {/* Location distribution */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-xs text-black dark:text-zinc-100">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider mb-1">Location scope audits</h4>
                    <p className="text-[9px] text-zinc-500 font-bold">Login location distribution</p>
                  </div>
                  <div className="h-28 flex items-center justify-center">
                    <span className="text-[10px] text-zinc-550 font-extrabold">Mumbai: 45% | Pune: 30% | Delhi: 25%</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

        {/* Right Side: Sticky Audit Activity Panel (Col Span 1) */}
        <aside className="lg:col-span-1 space-y-4 text-black dark:text-zinc-100">
          
          {/* Status Overview Card */}
          <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-xs font-semibold text-xs text-zinc-700 dark:text-zinc-300">
            <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <Database className="text-[var(--primary)] shrink-0" size={13} />
              Platform Database Audits
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>Database Sync status:</span>
                <span className="text-emerald-600 flex items-center gap-1 font-bold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  Synced
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span>API Gateway:</span>
                <span className="text-emerald-600 font-bold">100% Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Enforcement Scope:</span>
                <span className="font-extrabold text-black dark:text-zinc-100">All Modules Active</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Audited Actions Today:</span>
                <span className="font-extrabold text-black dark:text-zinc-100">1,402 Success</span>
              </div>
            </div>
          </div>

          {/* Timeline Audit Logs Panel */}
          <div className="bg-zinc-550 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 shadow-xs">
            <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <Activity className="text-purple-500 shrink-0" size={13} />
              Recent Configuration Audits
            </h4>

            <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-850">
              {audits.map(event => (
                <div key={event._id} className="flex gap-2.5 items-start text-[10px] leading-normal font-bold">
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                    event.status === 'Success' ? 'bg-emerald-500' :
                    event.status === 'Failed' ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                  }`}></span>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-extrabold text-black dark:text-zinc-50">{event.action}</span>
                      <span className="text-[8px] text-zinc-500 shrink-0">Just now</span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300 font-semibold">{event.userName} updated {event.module}</p>
                    <span className="text-[8.5px] text-zinc-500 font-extrabold">IP {event.ipAddress}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </aside>

      </div>

      {/* Mount Sub-Modals */}
      <LogDetailsModal 
        isOpen={isDetailsOpen}
        onClose={() => { setIsDetailsOpen(false); setSelectedLog(null); }}
        log={selectedLog}
      />

      <ExportLogsModal 
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      <SavedFilterModal 
        isOpen={isSavePresetOpen}
        onClose={() => setIsSavePresetOpen(false)}
        onSave={handleSavePreset}
      />

      <JsonViewerModal 
        isOpen={isComparisonOpen}
        onClose={() => { setIsComparisonOpen(false); setSelectedLog(null); }}
        oldVal={selectedLog?.oldValue}
        newVal={selectedLog?.newValue}
        title={`Audit JSON Comparison [${selectedLog?.action}]`}
      />

    </div>
  );
}
