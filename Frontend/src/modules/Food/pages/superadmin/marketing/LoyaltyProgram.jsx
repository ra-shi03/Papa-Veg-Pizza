import React, { useState, useEffect, useRef } from 'react';
import { 
  Gift, Award, History, Settings, Plus, Search, Filter, ChevronDown, ChevronRight, ChevronLeft, 
  Download, Columns, RefreshCw, MoreVertical, ShieldAlert, Trophy, Users, ShoppingBag, 
  TrendingUp, CircleDollarSign, ArrowUpRight, ArrowDownLeft, Percent, BarChart3, PieChart as PieIcon, LineChart as LineIcon,
  HelpCircle, Eye, Star, UserCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { api, getLoyaltyDashboardStats, getAnalyticsStats, formatINR } from './LoyaltyData';
import ConfigureLoyaltyModal from './ConfigureLoyaltyModal';
import TierManagementModal from './TierManagementModal';
import CustomerDetailsDrawer from './CustomerDetailsDrawer';
import PointAdjustmentModal from './PointAdjustmentModal';
import UpgradeTierModal from './UpgradeTierModal';
import LoyaltyHistoryModal from './LoyaltyHistoryModal';
import { toast } from 'sonner';

export default function LoyaltyProgram() {
  const [activeTab, setActiveTab] = useState('ledger'); // 'ledger' or 'analytics'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Collections States
  const [customers, setCustomers] = useState([]);
  const [dashboardStats, setDashboardStats] = useState({
    members: 0,
    totalPointsIssued: 0,
    pointsRedeemed: 0,
    expiringPoints: 0,
    activeMembers: 0,
    loyaltyRevenue: 0
  });
  const [analyticsStats, setAnalyticsStats] = useState({
    avgPoints: 0,
    avgLifetimeSpend: 0,
    avgRedemptionValue: 0,
    retentionRate: 0
  });

  // Table State
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sorting, setSorting] = useState({ field: 'lifetimeSpent', direction: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, limit: 5 });
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({
    customer: true,
    tier: true,
    availablePoints: true,
    redeemedPoints: true,
    totalPoints: true,
    lifetimeSpend: true,
    lastUpdated: true,
    actions: true
  });

  // Filters State
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    tier: 'All',
    minPoints: '',
    maxPoints: '',
    minSpend: '',
    maxSpend: '',
    startDate: '',
    endDate: ''
  });
  const [searchText, setSearchText] = useState('');

  // Modals & Drawer State
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTiersOpen, setIsTiersOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isAdjustPointsOpen, setIsAdjustPointsOpen] = useState(false);
  const [isUpgradeTierOpen, setIsUpgradeTierOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Action menu anchor state
  const [activeMenuRowId, setActiveMenuRowId] = useState(null);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [showBulkDropdown, setShowBulkDropdown] = useState(false);

  const menuRef = useRef(null);
  const columnRef = useRef(null);
  const bulkRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchText }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 450);
    return () => clearTimeout(handler);
  }, [searchText]);

  // Click outside menus handlers
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenuRowId(null);
      }
      if (columnRef.current && !columnRef.current.contains(event.target)) {
        setShowColumnDropdown(false);
      }
      if (bulkRef.current && !bulkRef.current.contains(event.target)) {
        setShowBulkDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync main DB collection data
  useEffect(() => {
    fetchLoyaltyData();
  }, [filters, sorting, pagination.page, retryTrigger]);

  const fetchLoyaltyData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch paginated filtered customers
      const result = await api.getCustomers(filters, sorting, pagination);
      setCustomers(result.data);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);

      // 2. Load aggregate dashboard KPIs
      const dbStats = getLoyaltyDashboardStats();
      setDashboardStats(dbStats);

      // 3. Load program analytical stats
      const anaStats = getAnalyticsStats();
      setAnalyticsStats(anaStats);
    } catch (err) {
      setError(err.message || "Failed to sync loyalty program database.");
      toast.error("Ledger synchronization failure.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      tier: 'All',
      minPoints: '',
      maxPoints: '',
      minSpend: '',
      maxSpend: '',
      startDate: '',
      endDate: ''
    });
    setSearchText('');
    setPagination({ page: 1, limit: 5 });
    toast.success("Filters cleared successfully.");
  };

  const handleSortChange = (field) => {
    setSorting(prev => {
      const direction = prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc';
      return { field, direction };
    });
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Row selection helpers
  const handleSelectRow = (id) => {
    setSelectedRowIds(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const handleSelectAllRows = () => {
    const visibleIds = customers.map(c => c._id);
    const allSelected = visibleIds.every(id => selectedRowIds.includes(id));
    if (allSelected) {
      setSelectedRowIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      setSelectedRowIds(prev => {
        const combined = [...prev];
        visibleIds.forEach(id => {
          if (!combined.includes(id)) combined.push(id);
        });
        return combined;
      });
    }
  };

  // Actions menu triggers
  const triggerRowAction = (customer, action) => {
    setSelectedCustomer(customer);
    setSelectedCustomerId(customer._id);
    setActiveMenuRowId(null);

    if (action === 'drawer') {
      setIsDrawerOpen(true);
    } else if (action === 'adjust') {
      setIsAdjustPointsOpen(true);
    } else if (action === 'upgrade') {
      setIsUpgradeTierOpen(true);
    } else if (action === 'history') {
      setIsHistoryOpen(true);
    }
  };

  // Bulk Actions
  const handleBulkUpgrade = (tier) => {
    if (selectedRowIds.length === 0) return;
    setLoading(true);
    try {
      selectedRowIds.forEach(async (id) => {
        await api.upgradeTier(id, tier, "Bulk Promotion Operation");
      });
      toast.success(`Successfully upgraded ${selectedRowIds.length} members to ${tier}!`);
      setSelectedRowIds([]);
      setRetryTrigger(r => r + 1);
    } catch (err) {
      toast.error("Failed to perform bulk upgrade.");
    } finally {
      setLoading(false);
      setShowBulkDropdown(false);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    try {
      const allData = await api.getCustomers(filters, sorting, { page: 1, limit: 10000 });
      const records = allData.data;
      if (records.length === 0) {
        toast.error("No loyalty records found to export.");
        return;
      }

      const headers = ['Customer ID', 'Name', 'Phone', 'Email', 'Tier', 'Available Points', 'Redeemed Points', 'Total Points', 'Lifetime Spend (INR)', 'Last Updated'];
      const rows = records.map(c => [
        c.customerId,
        `"${c.name.replace(/"/g, '""')}"`,
        c.phone,
        c.email,
        c.tier,
        c.availablePoints,
        c.redeemedPoints,
        c.totalPoints,
        c.lifetimeSpent,
        new Date(c.updatedAt).toLocaleDateString('en-IN')
      ]);

      const csvContent = "data:text/csv;charset=utf-8,"
        + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `PapaVegPizza_LoyaltyLedger_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${records.length} members successfully.`);
    } catch (err) {
      toast.error("Failed to compile export file.");
    }
  };

  // Recharts Static Colors consistent with Sunset theme
  const SUNSET_PALETTE = ['#a43c12', '#ff7f50', '#888888'];

  // Mock data for Line/Area Charts (Earned vs Redeemed)
  const lineChartData = [
    { date: '06-12', Earned: 1400, Redeemed: 600 },
    { date: '06-13', Earned: 1800, Redeemed: 900 },
    { date: '06-14', Earned: 2200, Redeemed: 1100 },
    { date: '06-15', Earned: 1600, Redeemed: 700 },
    { date: '06-16', Earned: 2500, Redeemed: 1400 },
    { date: '06-17', Earned: 3100, Redeemed: 1900 },
    { date: '06-18', Earned: 2900, Redeemed: 1700 },
    { date: '06-19', Earned: 3400, Redeemed: 2100 }
  ];

  // Monthly Loyalty Growth Area Chart
  const areaChartData = [
    { month: 'Jan', Members: 120 },
    { month: 'Feb', Members: 210 },
    { month: 'Mar', Members: 350 },
    { month: 'Apr', Members: 510 },
    { month: 'May', Members: 720 },
    { month: 'Jun', Members: 980 }
  ];

  // Member distribution by tier donut/pie chart data
  const pieChartData = [
    { name: 'Silver', value: 4 },
    { name: 'Gold', value: 3 },
    { name: 'Platinum', value: 3 }
  ];

  // Revenue by tier bar chart
  const barChartData = [
    { name: 'Silver', Spend: 14100 },
    { name: 'Gold', Spend: 41400 },
    { name: 'Platinum', Spend: 136000 }
  ];

  // Points redeemed by tier area chart
  const pointsRedeemedByTierData = [
    { date: '06-12', Silver: 200, Gold: 500, Platinum: 1200 },
    { date: '06-14', Silver: 300, Gold: 620, Platinum: 1500 },
    { date: '06-16', Silver: 150, Gold: 400, Platinum: 1000 },
    { date: '06-18', Silver: 400, Gold: 800, Platinum: 2200 }
  ];

  // Top Customer horizontal bar chart
  const topCustomerBarData = [
    { name: 'Suresh Iyer', Points: 8100 },
    { name: 'Vikram Malhotra', Points: 6850 },
    { name: 'Rajesh Sharma', Points: 4650 },
    { name: 'Priya Patel', Points: 2050 },
    { name: 'Isha Kapoor', Points: 1680 }
  ];

  return (
    <div className="p-4 sm:p-5 space-y-5 bg-zinc-50 dark:bg-zinc-955 min-h-screen text-zinc-850 dark:text-zinc-100 transition-colors duration-300 w-full max-w-7xl mx-auto">
      
      {/* Top Header Block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-zinc-200 dark:border-zinc-805 pb-4 select-none">
        <div>
          <h1 className="text-xl font-black text-black dark:text-white flex items-center gap-2">
            <Gift size={22} className="text-[var(--primary)]" />
            Loyalty Program Dashboard
          </h1>
          <p className="text-[11px] font-semibold text-zinc-555 dark:text-zinc-400 mt-1">
            Super Administrator ledger to manage global settings conversion metrics, status tiers, customer points, and audit transaction ledgers.
          </p>
        </div>

        {/* Global actions bar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="h-8.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Settings size={13} className="text-zinc-450" />
            Settings Config
          </button>
          
          <button
            onClick={() => setIsTiersOpen(true)}
            className="h-8.5 px-3 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Award size={13} className="text-zinc-450" />
            Tiers Management
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="h-8.5 px-3 bg-[var(--primary)] text-white text-xs font-extrabold rounded-lg hover:bg-[var(--primary)]/90 shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
          >
            <History size={13} />
            Transactions Ledger
          </button>
        </div>
      </div>

      {/* 6 Dashboard KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 select-none">
        
        {/* Members */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3 rounded-xl shadow-sm flex items-center justify-between h-[80px] hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block leading-none">Loyalty Members</span>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white font-mono mt-1">
              {loading ? '...' : dashboardStats.members}
            </h3>
          </div>
          <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
            <Users size={15} />
          </div>
        </div>

        {/* Total Points Issued */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3 rounded-xl shadow-sm flex items-center justify-between h-[80px] hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block leading-none">Total Earned</span>
            <h3 className="text-base font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 truncate">
              {loading ? '...' : `+${dashboardStats.totalPointsIssued.toLocaleString()}`}
            </h3>
          </div>
          <div className="p-1.5 bg-emerald-500/10 text-emerald-500 rounded-lg">
            <ArrowUpRight size={15} />
          </div>
        </div>

        {/* Points Redeemed */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3 rounded-xl shadow-sm flex items-center justify-between h-[80px] hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block leading-none">Points Redeemed</span>
            <h3 className="text-base font-black text-rose-600 dark:text-rose-450 font-mono mt-1 truncate">
              {loading ? '...' : `-${dashboardStats.pointsRedeemed.toLocaleString()}`}
            </h3>
          </div>
          <div className="p-1.5 bg-rose-500/10 text-rose-500 rounded-lg">
            <Gift size={15} />
          </div>
        </div>

        {/* Expiring Points */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3 rounded-xl shadow-sm flex items-center justify-between h-[80px] hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block leading-none">Expiring Points</span>
            <h3 className="text-base font-black text-amber-600 dark:text-amber-400 font-mono mt-1 truncate">
              {loading ? '...' : dashboardStats.expiringPoints.toLocaleString()}
            </h3>
          </div>
          <div className="p-1.5 bg-amber-500/10 text-amber-500 rounded-lg">
            <TrendingUp size={15} />
          </div>
        </div>

        {/* Active Members */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3 rounded-xl shadow-sm flex items-center justify-between h-[80px] hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block leading-none">Active Members</span>
            <h3 className="text-lg font-black text-zinc-900 dark:text-white font-mono mt-1">
              {loading ? '...' : dashboardStats.activeMembers}
            </h3>
          </div>
          <div className="p-1.5 bg-purple-500/10 text-purple-500 rounded-lg">
            <UserCheck size={15} />
          </div>
        </div>

        {/* Loyalty Revenue */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-808 p-3 rounded-xl shadow-sm flex items-center justify-between h-[80px] hover:shadow-md transition-shadow">
          <div className="min-w-0">
            <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-555 uppercase tracking-wider block leading-none">Loyalty Revenue</span>
            <h3 className="text-xs font-black text-zinc-900 dark:text-white font-mono mt-1.5 truncate">
              {loading ? '...' : formatINR(dashboardStats.loyaltyRevenue)}
            </h3>
          </div>
          <div className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
            <CircleDollarSign size={15} />
          </div>
        </div>

      </section>

      {/* Pages Tabs */}
      <div className="flex gap-5 border-b border-zinc-200 dark:border-zinc-800 select-none">
        <button 
          onClick={() => setActiveTab('ledger')} 
          className={`pb-3 text-xs font-black transition-all relative ${activeTab === 'ledger' ? 'text-[var(--primary)]' : 'text-zinc-500 hover:text-black dark:hover:text-zinc-300'}`}
        >
          Customers Ledger
          {activeTab === 'ledger' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setActiveTab('analytics')} 
          className={`pb-3 text-xs font-black transition-all relative ${activeTab === 'analytics' ? 'text-[var(--primary)]' : 'text-zinc-500 hover:text-black dark:hover:text-zinc-300'}`}
        >
          Loyalty Analytics
          {activeTab === 'analytics' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-[var(--primary)] rounded-t-full"></div>}
        </button>
      </div>

      {activeTab === 'ledger' ? (
        /* Customers Ledger Section */
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all">
          
          {/* Header toolbar */}
          <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex flex-wrap justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 gap-3 shrink-0 select-none">
            
            {/* Advanced filters trigger */}
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setFiltersOpen(!filtersOpen)}
                className="flex items-center gap-1.5 text-xs font-bold text-[var(--primary)] hover:brightness-95 cursor-pointer"
              >
                <Filter size={13} />
                {filtersOpen ? 'Hide Filters' : 'Filter Accounts'}
                <ChevronDown size={11} className={`transition-transform duration-200 ${filtersOpen ? 'rotate-180' : ''}`} />
              </button>

              <div className="h-4 w-[1px] bg-zinc-200 dark:bg-zinc-800"></div>

              {/* CSV export */}
              <button
                onClick={handleExportCSV}
                className="h-8 px-2.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 flex items-center gap-1.5 cursor-pointer transition-colors shadow-sm"
              >
                <Download size={12} />
                Export CSV
              </button>
            </div>

            {/* Right actions (Column visibility popover, bulk actions) */}
            <div className="flex items-center gap-2">
              
              {/* Column visibility dropdown */}
              <div className="relative" ref={columnRef}>
                <button 
                  onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                  className="h-8 px-2.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-[11px] font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Columns size={12} />
                  Columns
                </button>
                {showColumnDropdown && (
                  <div className="absolute right-0 top-9 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-2 z-30 divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in duration-100 text-left text-[11px] font-bold">
                    <span className="block px-3 py-1 text-[9px] uppercase tracking-wider text-zinc-450 select-none">Show/Hide Columns</span>
                    <div className="p-1 space-y-0.5">
                      {Object.entries(columnVisibility).map(([col, visible]) => (
                        <label key={col} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer">
                          <input 
                            type="checkbox"
                            checked={visible}
                            onChange={() => setColumnVisibility(prev => ({ ...prev, [col]: !prev[col] }))}
                            className="w-3 h-3 text-[var(--primary)] rounded cursor-pointer"
                          />
                          <span className="capitalize">{col === 'availablePoints' ? 'Available Pts' : col === 'redeemedPoints' ? 'Redeemed Pts' : col === 'totalPoints' ? 'Total Pts' : col}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Bulk actions selector */}
              {selectedRowIds.length > 0 && (
                <div className="relative" ref={bulkRef}>
                  <button 
                    onClick={() => setShowBulkDropdown(!showBulkDropdown)}
                    className="h-8 px-2.5 bg-rose-500/10 text-rose-500 border border-rose-500/20 rounded-lg text-[11px] font-black hover:bg-rose-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    Bulk Upgrade ({selectedRowIds.length})
                    <ChevronDown size={11} />
                  </button>
                  {showBulkDropdown && (
                    <div className="absolute right-0 top-9 w-44 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xl py-1 z-30 divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in duration-100 text-left text-[11px] font-bold">
                      <span className="block px-3 py-1.5 text-[9px] uppercase tracking-wider text-zinc-450">Change Tier To:</span>
                      <button onClick={() => handleBulkUpgrade('Silver')} className="w-full px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer">Silver Tier</button>
                      <button onClick={() => handleBulkUpgrade('Gold')} className="w-full px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer">Gold Tier</button>
                      <button onClick={() => handleBulkUpgrade('Platinum')} className="w-full px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2 cursor-pointer text-purple-600">Platinum Tier</button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>

          {/* Filters section */}
          {filtersOpen && (
            <div className="p-5 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 grid grid-cols-1 md:grid-cols-4 gap-4 animate-slide-down text-xs font-semibold select-none">
              
              {/* Search Customer */}
              <div className="flex flex-col gap-1.5 md:col-span-2">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Search Customer</label>
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-2.5 text-zinc-400" />
                  <input 
                    type="text"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder="Search by name, ID, phone number or email..."
                    className="w-full h-8.5 pl-8 pr-3 bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
                  />
                </div>
              </div>

              {/* Status Tier */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Loyalty Tier</label>
                <select
                  value={filters.tier}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, tier: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full h-8.5 px-2 bg-white dark:bg-zinc-955 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white cursor-pointer font-bold"
                >
                  <option value="All">All Tiers</option>
                  <option value="Silver">Silver Badge</option>
                  <option value="Gold">Gold Badge</option>
                  <option value="Platinum">Platinum Badge</option>
                </select>
              </div>

              {/* Date updated range start */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Start Date</label>
                <input 
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, startDate: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full h-8.5 px-3 bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
                />
              </div>

              {/* Points Range Filter */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Min Points Balance</label>
                <input 
                  type="number"
                  placeholder="Min points..."
                  value={filters.minPoints}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, minPoints: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full h-8.5 px-3 bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Max Points Balance</label>
                <input 
                  type="number"
                  placeholder="Max points..."
                  value={filters.maxPoints}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, maxPoints: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full h-8.5 px-3 bg-white dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-mono"
                />
              </div>

              {/* Lifetime spend range */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Min Lifetime Spend (₹)</label>
                <input 
                  type="number"
                  placeholder="Min spend..."
                  value={filters.minSpend}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, minSpend: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full h-8.5 px-3 bg-white dark:bg-zinc-955 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5 flex-wrap">
                <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Max Spend (₹) / End Date</label>
                <div className="flex gap-2 w-full">
                  <input 
                    type="number"
                    placeholder="Max spend..."
                    value={filters.maxSpend}
                    onChange={(e) => {
                      setFilters(prev => ({ ...prev, maxSpend: e.target.value }));
                      setPagination(prev => ({ ...prev, page: 1 }));
                    }}
                    className="flex-1 h-8.5 px-3 bg-white dark:bg-zinc-955 border border-zinc-205 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white font-mono"
                  />
                  <button 
                    onClick={handleResetFilters}
                    className="text-zinc-500 hover:text-black dark:hover:text-white font-black text-xs px-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-800 cursor-pointer"
                  >
                    Reset
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30 flex flex-col items-center justify-center gap-3">
              <ShieldAlert size={28} className="text-rose-500" />
              <h4 className="text-xs font-black text-zinc-900 dark:text-white uppercase tracking-wider">Loyalty Ledger Synchronization Error</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 max-w-sm leading-relaxed">{error}</p>
              <button 
                onClick={() => setRetryTrigger(r => r + 1)}
                className="h-8 px-4 bg-[var(--primary)] text-white text-xs font-bold rounded-lg shadow hover:bg-[var(--primary)]/95 flex items-center gap-1.5 cursor-pointer mt-1"
              >
                <RefreshCw size={12} />
                Retry Connection
              </button>
            </div>
          )}

          {/* Table Container */}
          <div className="flex-1 overflow-x-auto">
            {loading && !error ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="text-[var(--primary)] animate-spin" />
                <p className="text-xs font-bold text-zinc-450">Loading customer point ledgers...</p>
              </div>
            ) : customers.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-center select-none text-zinc-400">
                <Gift className="text-zinc-200 dark:text-zinc-800 mb-2" size={32} />
                <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-305 uppercase tracking-wider">No customer accounts matches</h4>
                <p className="text-[10px] max-w-xs leading-normal mt-0.5">Try resetting advanced filter ranges or clearing search bars.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950 text-[9px] font-black uppercase text-zinc-450 tracking-wider sticky top-0 z-10 border-b border-zinc-150 dark:border-zinc-800">
                  <tr>
                    <th className="px-4 py-3 select-none w-10">
                      <input 
                        type="checkbox"
                        checked={customers.length > 0 && customers.every(c => selectedRowIds.includes(c._id))}
                        onChange={handleSelectAllRows}
                        className="w-3.5 h-3.5 text-[var(--primary)] rounded cursor-pointer"
                      />
                    </th>
                    {columnVisibility.customer && <th className="px-5 py-3">Customer Info</th>}
                    {columnVisibility.tier && <th className="px-5 py-3">Badge Tier</th>}
                    {columnVisibility.availablePoints && <th className="px-5 py-3 cursor-pointer" onClick={() => handleSortChange('availablePoints')}>Available Pts{sorting.field === 'availablePoints' ? (sorting.direction === 'asc' ? ' ▴' : ' ▾') : ''}</th>}
                    {columnVisibility.redeemedPoints && <th className="px-5 py-3 cursor-pointer" onClick={() => handleSortChange('redeemedPoints')}>Redeemed Pts{sorting.field === 'redeemedPoints' ? (sorting.direction === 'asc' ? ' ▴' : ' ▾') : ''}</th>}
                    {columnVisibility.totalPoints && <th className="px-5 py-3 cursor-pointer" onClick={() => handleSortChange('totalPoints')}>Total Points{sorting.field === 'totalPoints' ? (sorting.direction === 'asc' ? ' ▴' : ' ▾') : ''}</th>}
                    {columnVisibility.lifetimeSpend && <th className="px-5 py-3 cursor-pointer" onClick={() => handleSortChange('lifetimeSpent')}>Lifetime Spend{sorting.field === 'lifetimeSpent' ? (sorting.direction === 'asc' ? ' ▴' : ' ▾') : ''}</th>}
                    {columnVisibility.lastUpdated && <th className="px-5 py-3">Last Updated</th>}
                    {columnVisibility.actions && <th className="px-5 py-3 text-right">Actions</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 font-medium">
                  {customers.map((c) => {
                    const isRowSelected = selectedRowIds.includes(c._id);
                    return (
                      <tr 
                        key={c._id} 
                        className={`hover:bg-zinc-55/40 dark:hover:bg-zinc-950/20 transition-colors ${
                          isRowSelected ? 'bg-[var(--primary)]/5 dark:bg-[var(--primary)]/10' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="px-4 py-4 whitespace-nowrap">
                          <input 
                            type="checkbox"
                            checked={isRowSelected}
                            onChange={() => handleSelectRow(c._id)}
                            className="w-3.5 h-3.5 text-[var(--primary)] rounded cursor-pointer"
                          />
                        </td>

                        {/* Customer Info */}
                        {columnVisibility.customer && (
                          <td className="px-5 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              {/* Avatar placeholder with initials */}
                              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[var(--primary)] to-amber-500 text-white font-extrabold flex items-center justify-center text-[10px] shadow-sm select-none shrink-0">
                                {c.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="min-w-0">
                                <p className="font-extrabold text-zinc-900 dark:text-white leading-tight">{c.name}</p>
                                <p className="text-[10px] text-zinc-450 mt-0.5 truncate">{c.email} • {c.phone}</p>
                              </div>
                            </div>
                          </td>
                        )}

                        {/* Status Tier */}
                        {columnVisibility.tier && (
                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black border uppercase tracking-wider ${
                              c.tier.toLowerCase() === 'platinum'
                                ? 'bg-purple-100 dark:bg-purple-950/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-900/40'
                                : c.tier.toLowerCase() === 'gold'
                                  ? 'bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900/40'
                                  : 'bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800'
                            }`}>
                              <Trophy size={9} className="stroke-[2.5]" />
                              {c.tier}
                            </span>
                          </td>
                        )}

                        {/* Available Pts */}
                        {columnVisibility.availablePoints && (
                          <td className="px-5 py-4 whitespace-nowrap font-mono font-black text-zinc-900 dark:text-zinc-100">
                            {c.availablePoints.toLocaleString()}
                          </td>
                        )}

                        {/* Redeemed Pts */}
                        {columnVisibility.redeemedPoints && (
                          <td className="px-5 py-4 whitespace-nowrap font-mono text-zinc-500">
                            {c.redeemedPoints.toLocaleString()}
                          </td>
                        )}

                        {/* Total Pts */}
                        {columnVisibility.totalPoints && (
                          <td className="px-5 py-4 whitespace-nowrap font-mono font-bold text-zinc-600 dark:text-zinc-400">
                            {c.totalPoints.toLocaleString()}
                          </td>
                        )}

                        {/* Lifetime Spend */}
                        {columnVisibility.lifetimeSpend && (
                          <td className="px-5 py-4 whitespace-nowrap font-mono font-black text-emerald-600 dark:text-emerald-400">
                            {formatINR(c.lifetimeSpent)}
                          </td>
                        )}

                        {/* Last Updated */}
                        {columnVisibility.lastUpdated && (
                          <td className="px-5 py-4 whitespace-nowrap text-zinc-555 dark:text-zinc-400 text-[10px]">
                            {new Date(c.updatedAt).toLocaleDateString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                        )}

                        {/* Row action popup triggers */}
                        {columnVisibility.actions && (
                          <td className="px-5 py-4 whitespace-nowrap text-right text-zinc-500 select-none relative">
                            <button
                              onClick={() => setActiveMenuRowId(activeMenuRowId === c._id ? null : c._id)}
                              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-lg cursor-pointer transition-colors"
                            >
                              <MoreVertical size={14} />
                            </button>

                            {activeMenuRowId === c._id && (
                              <div 
                                ref={menuRef}
                                className="absolute right-12 top-2.5 w-40 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-1 z-30 divide-y divide-zinc-100 dark:divide-zinc-800 animate-in fade-in duration-100 text-left font-semibold text-[11px]"
                              >
                                <button onClick={() => triggerRowAction(c, 'drawer')} className="w-full px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer">
                                  <Eye size={12} className="text-zinc-400" /> View Customer
                                </button>
                                <button onClick={() => triggerRowAction(c, 'adjust')} className="w-full px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer">
                                  <Percent size={12} className="text-zinc-405" /> Adjust Points
                                </button>
                                <button onClick={() => triggerRowAction(c, 'upgrade')} className="w-full px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer">
                                  <Trophy size={12} className="text-zinc-400" /> Upgrade Tier
                                </button>
                                <button onClick={() => triggerRowAction(c, 'history')} className="w-full px-3 py-2 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer">
                                  <History size={12} className="text-zinc-400" /> View History
                                </button>
                              </div>
                            )}
                          </td>
                        )}

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination bar */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 p-3.5 bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-semibold select-none">
              <span className="text-zinc-450">Showing {customers.length} of {totalCount} accounts</span>

              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft size={13} />
                </button>
                <span className="px-2.5 py-1 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-850 rounded-lg text-[10.5px] font-mono">
                  {pagination.page} / {totalPages}
                </span>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                  disabled={pagination.page === totalPages}
                  className="p-1 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          )}

        </div>
      ) : (
        /* Loyalty Analytics Section & charts */
        <div className="space-y-6 select-none animate-in fade-in duration-200 text-xs font-semibold">
          
          {/* Aggregated Analytics KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Avg Points Per Customer</span>
                <h4 className="text-base font-black text-zinc-900 dark:text-white mt-1 font-mono">{analyticsStats.avgPoints} Pts</h4>
              </div>
              <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                <Gift size={15} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Average Lifetime Spend</span>
                <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{formatINR(analyticsStats.avgLifetimeSpend)}</h4>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <CircleDollarSign size={15} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Average Redemption Value</span>
                <h4 className="text-base font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">{formatINR(analyticsStats.avgRedemptionValue)}</h4>
              </div>
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                <ArrowDownLeft size={15} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider block">Customer Retention Rate</span>
                <h4 className="text-base font-black text-blue-500 mt-1 font-mono">{analyticsStats.retentionRate}%</h4>
              </div>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <TrendingUp size={15} />
              </div>
            </div>

          </div>

          {/* Primary Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Points Earned vs Redeemed (Line Chart) */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[300px]">
              <div>
                <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <LineIcon size={12} className="text-[var(--primary)]" />
                  Points Earned vs Redeemed Trend
                </h4>
                <p className="text-[9px] text-zinc-450 font-semibold mt-0.5">Real-time daily conversion activity tracking index</p>
              </div>

              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="date" stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', fontSize: '10px', borderRadius: '6px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="Earned" stroke="var(--primary)" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="Redeemed" stroke="#ef4444" strokeWidth={2.5} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Member Distribution (Donut Chart) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[300px]">
              <div>
                <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <PieIcon size={12} className="text-[var(--primary)]" />
                  Member Distribution by Tier
                </h4>
                <p className="text-[9px] text-zinc-450 font-semibold mt-0.5">Ratio breakdown of enrolled customers</p>
              </div>

              <div className="h-44 w-full mt-2 relative flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SUNSET_PALETTE[index % SUNSET_PALETTE.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', fontSize: '10px', borderRadius: '6px' }} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Central total label */}
                <div className="absolute text-center select-none">
                  <p className="text-sm font-black text-zinc-900 dark:text-white leading-none">10</p>
                  <p className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider mt-0.5">Members</p>
                </div>
              </div>

              <div className="flex justify-center gap-4 text-[9px] font-bold text-zinc-500">
                {pieChartData.map((d, i) => (
                  <span key={d.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: SUNSET_PALETTE[i] }} />
                    {d.name} ({d.value})
                  </span>
                ))}
              </div>
            </div>

            {/* Chart 3: Monthly Loyalty Growth (Area Chart) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[300px]">
              <div>
                <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={12} className="text-[var(--primary)]" />
                  Monthly Loyalty growth
                </h4>
                <p className="text-[9px] text-zinc-450 font-semibold mt-0.5">Cumulative growth curve of enrolled accounts</p>
              </div>

              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={areaChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorGrowth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="month" stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', fontSize: '10px', borderRadius: '6px' }} />
                    <Area type="monotone" dataKey="Members" stroke="var(--primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorGrowth)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 4: Revenue by Tier (Bar Chart) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[300px]">
              <div>
                <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <BarChart3 size={12} className="text-[var(--primary)]" />
                  Revenue Attributed by Tier
                </h4>
                <p className="text-[9px] text-zinc-450 font-semibold mt-0.5">Aggregated lifetime spend value across status levels</p>
              </div>

              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', fontSize: '10px', borderRadius: '6px' }} />
                    <Bar dataKey="Spend" fill="var(--primary)" radius={[3, 3, 0, 0]}>
                      {barChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={SUNSET_PALETTE[index % SUNSET_PALETTE.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 5: Top Customers (Horizontal Bar Chart) */}
            <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl shadow-sm flex flex-col justify-between h-[300px]">
              <div>
                <h4 className="text-[10px] font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Trophy size={12} className="text-amber-500" />
                  Top Customers Leaderboard
                </h4>
                <p className="text-[9px] text-zinc-450 font-semibold mt-0.5">Loyalty points outstanding accumulation leaderboard</p>
              </div>

              <div className="h-44 w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topCustomerBarData}
                    layout="vertical"
                    margin={{ top: 5, right: 5, left: 10, bottom: 0 }}
                  >
                    <XAxis type="number" stroke="#888" fontSize={8} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" stroke="#888" fontSize={8} width={70} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', fontSize: '9px', borderRadius: '6px' }} />
                    <Bar dataKey="Points" fill="var(--primary)" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Tier Analytics Sub-Section */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 bg-white dark:bg-zinc-900 space-y-5">
            <div>
              <h3 className="text-xs font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Trophy size={14} className="text-[var(--primary)]" />
                Tier Analytics Segment
              </h3>
              <p className="text-[10px] text-zinc-500 font-semibold mt-0.5">Demographics and spending indicators broken down across Silver, Gold, and Platinum members.</p>
            </div>

            {/* Tier Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-xl">
                <span className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider block">Silver Members</span>
                <h5 className="text-base font-black text-zinc-700 mt-1">4 Accounts</h5>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-xl">
                <span className="text-[9px] text-zinc-450 font-bold uppercase tracking-wider block">Gold Members</span>
                <h5 className="text-base font-black text-amber-600 mt-1">3 Accounts</h5>
              </div>
              <div className="bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-3.5 rounded-xl">
                <span className="text-[9px] text-zinc-455 font-bold uppercase tracking-wider block">Platinum Members</span>
                <h5 className="text-base font-black text-purple-600 mt-1">3 Accounts</h5>
              </div>
              <div className="bg-emerald-500/5 border border-emerald-500/10 p-3.5 rounded-xl">
                <span className="text-[9px] text-emerald-800 dark:text-emerald-450 font-bold uppercase tracking-wider block">Average Spend Per Tier</span>
                <h5 className="text-base font-black text-emerald-600 dark:text-emerald-450 mt-1">₹19,000</h5>
              </div>
            </div>

            {/* Tier Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Points Redeemed by Tier (Area Chart) */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/20 dark:bg-zinc-950/20 shadow-sm flex flex-col justify-between h-[280px]">
                <div>
                  <h4 className="text-[9.5px] font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <LineIcon size={12} className="text-[var(--primary)]" />
                    Points Redeemed by Tier over Time
                  </h4>
                  <p className="text-[8.5px] text-zinc-450 font-semibold mt-0.5">Daily redemption rates comparing members classes</p>
                </div>

                <div className="h-40 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={pointsRedeemedByTierData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', fontSize: '10px', borderRadius: '6px' }} />
                      <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                      <Area type="monotone" dataKey="Platinum" stroke="#a43c12" fill="#a43c12" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="Gold" stroke="#ff7f50" fill="#ff7f50" fillOpacity={0.1} />
                      <Area type="monotone" dataKey="Silver" stroke="#888888" fill="#888888" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Revenue by Tier comparison Bar */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 bg-zinc-50/20 dark:bg-zinc-950/20 shadow-sm flex flex-col justify-between h-[280px]">
                <div>
                  <h4 className="text-[9.5px] font-black text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                    <BarChart3 size={12} className="text-[var(--primary)]" />
                    Tier Revenue Contributions Comparison
                  </h4>
                  <p className="text-[8.5px] text-zinc-450 font-semibold mt-0.5">Overall spend attribution comparison</p>
                </div>

                <div className="h-40 w-full mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', fontSize: '10px', borderRadius: '6px' }} />
                      <Bar dataKey="Spend" fill="var(--primary)" radius={[3, 3, 0, 0]}>
                        {barChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SUNSET_PALETTE[index % SUNSET_PALETTE.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {/* Global Modals & drawers registrations */}
      <ConfigureLoyaltyModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSaveSuccess={fetchLoyaltyData}
      />

      <TierManagementModal 
        isOpen={isTiersOpen}
        onClose={() => setIsTiersOpen(false)}
        onSaveSuccess={fetchLoyaltyData}
      />

      <CustomerDetailsDrawer 
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        customerId={selectedCustomerId}
      />

      <PointAdjustmentModal 
        isOpen={isAdjustPointsOpen}
        onClose={() => setIsAdjustPointsOpen(false)}
        customerData={selectedCustomer}
        onSaveSuccess={fetchLoyaltyData}
      />

      <UpgradeTierModal 
        isOpen={isUpgradeTierOpen}
        onClose={() => setIsUpgradeTierOpen(false)}
        customerData={selectedCustomer}
        onSaveSuccess={fetchLoyaltyData}
      />

      <LoyaltyHistoryModal 
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
      />

    </div>
  );
}
