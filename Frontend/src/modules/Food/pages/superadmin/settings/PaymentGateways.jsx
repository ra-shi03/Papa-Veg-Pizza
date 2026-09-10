import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Search, Plus, RefreshCw, Download, Sliders, Database, 
  Terminal, Edit, Play, Power, Radio, HelpCircle, Activity, Globe, 
  Check, Copy, ChevronRight, AlertCircle, CheckCircle, Info, MoreVertical, 
  Trash, ArrowUpRight, TrendingUp, Cpu, Server, Clock, Calendar 
} from 'lucide-react';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, 
  PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend 
} from 'recharts';

// Modal imports
import AddGatewayModal from './AddGatewayModal';
import EditGatewayModal from './EditGatewayModal';
import TestConnectionModal from './TestConnectionModal';
import GatewayLogsModal from './GatewayLogsModal';
import DisableGatewayModal from './DisableGatewayModal';
import GatewayDetailsDrawer from './GatewayDetailsDrawer';

// Mock DB Initial Data matching payment_gateways
const INITIAL_GATEWAYS = [
  {
    _id: "gtw_rzp_1109",
    gatewayName: "Razorpay",
    merchantId: "mid_rzp_992381",
    keyId: "rzp_live_9d8s7d6",
    secretKey: "rzp_sec_live_5h3k8l9a0d8s2",
    webhookSecret: "whsec_rzp_992381",
    environment: "Production",
    status: "Active",
    defaultGateway: true,
    createdBy: "superadmin_01",
    updatedBy: "superadmin_01",
    updatedAt: "2026-06-19T10:15:32Z"
  },
  {
    _id: "gtw_phpe_2289",
    gatewayName: "PhonePe",
    merchantId: "mid_phpe_110293",
    keyId: "phpe_prod_8s7d6f5",
    secretKey: "phpe_sec_prod_99281a0b3c4d",
    webhookSecret: "whsec_phpe_110293",
    environment: "Production",
    status: "Active",
    defaultGateway: false,
    createdBy: "superadmin_01",
    updatedBy: "superadmin_01",
    updatedAt: "2026-06-19T09:45:00Z"
  },
  {
    _id: "gtw_cf_8892",
    gatewayName: "Cashfree",
    merchantId: "mid_cf_882910",
    keyId: "cf_test_281a9s",
    secretKey: "cf_sec_test_7s6d5f4g3h2j1k",
    webhookSecret: "whsec_cf_882910",
    environment: "Sandbox",
    status: "Active",
    defaultGateway: false,
    createdBy: "superadmin_01",
    updatedBy: "superadmin_01",
    updatedAt: "2026-06-18T14:30:12Z"
  },
  {
    _id: "gtw_stripe_9901",
    gatewayName: "Stripe",
    merchantId: "mid_stripe_usd_77",
    keyId: "pk_live_51Mxt52LkdIwHu7ix",
    secretKey: "sk_live_51Mxt52LkdIwHu7ix",
    webhookSecret: "whsec_stripe_usd_77",
    environment: "Production",
    status: "Active",
    defaultGateway: false,
    createdBy: "superadmin_01",
    updatedBy: "superadmin_02",
    updatedAt: "2026-06-19T12:00:00Z"
  },
  {
    _id: "gtw_paytm_3301",
    gatewayName: "Paytm",
    merchantId: "mid_paytm_88301",
    keyId: "paytm_test_30198",
    secretKey: "paytm_sec_test_882910",
    webhookSecret: "whsec_paytm_88301",
    environment: "Sandbox",
    status: "Inactive",
    defaultGateway: false,
    createdBy: "superadmin_01",
    updatedBy: "superadmin_01",
    updatedAt: "2026-06-17T08:15:00Z"
  },
  {
    _id: "gtw_paypal_4402",
    gatewayName: "PayPal",
    merchantId: "mid_paypal_usd_44",
    keyId: "paypal_test_440291",
    secretKey: "paypal_sec_test_9921",
    webhookSecret: "whsec_paypal_usd_44",
    environment: "Sandbox",
    status: "Inactive",
    defaultGateway: false,
    createdBy: "superadmin_01",
    updatedBy: "superadmin_01",
    updatedAt: "2026-06-16T11:20:00Z"
  }
];

// Mock Analytics Data
const TRANSACTION_VOLUME_DATA = [
  { date: 'Jun 13', Razorpay: 24000, PhonePe: 18000, Stripe: 5000 },
  { date: 'Jun 14', Razorpay: 28000, PhonePe: 19000, Stripe: 6000 },
  { date: 'Jun 15', Razorpay: 35000, PhonePe: 22000, Stripe: 5500 },
  { date: 'Jun 16', Razorpay: 30000, PhonePe: 21000, Stripe: 7000 },
  { date: 'Jun 17', Razorpay: 42000, PhonePe: 26000, Stripe: 8000 },
  { date: 'Jun 18', Razorpay: 48000, PhonePe: 30000, Stripe: 9000 },
  { date: 'Jun 19', Razorpay: 52000, PhonePe: 32000, Stripe: 12000 },
];

const SUCCESS_RATE_DATA = [
  { name: 'Razorpay', Success: 98.4, Failed: 1.6 },
  { name: 'PhonePe', Success: 97.8, Failed: 2.2 },
  { name: 'Cashfree', Success: 95.5, Failed: 4.5 },
  { name: 'Stripe', Success: 99.1, Failed: 0.9 },
  { name: 'Paytm', Success: 92.0, Failed: 8.0 },
  { name: 'PayPal', Success: 94.2, Failed: 5.8 },
];

const GATEWAY_DISTRIBUTION = [
  { name: 'Razorpay', value: 55, color: '#F35C2B' },
  { name: 'PhonePe', value: 30, color: '#5F259F' },
  { name: 'Stripe', value: 10, color: '#635BFF' },
  { name: 'Others', value: 5, color: '#2B6CB0' },
];

// Event Timeline Data
const INITIAL_TIMELINE_EVENTS = [
  { id: 1, action: "Credentials Update", desc: "Razorpay production credentials updated", user: "Admin (Shubham)", time: "2 mins ago", type: "info" },
  { id: 2, action: "Latency Peak Alert", desc: "PhonePe response latency peaked at 320ms", user: "System Monitor", time: "15 mins ago", type: "warning" },
  { id: 3, action: "Webhook Verified", desc: "Razorpay webhook synced with Mongo DB system_settings", user: "System", time: "1 hour ago", type: "success" },
  { id: 4, action: "Gateway Enabled", desc: "Cashfree Sandbox testing credentials registered", user: "Admin (Shubham)", time: "3 hours ago", type: "info" },
  { id: 5, action: "Webhook Processing Fail", desc: "Paytm webhook signature check failed", user: "System Monitor", time: "5 hours ago", type: "error" },
];

export default function PaymentGateways() {
  const [gateways, setGateways] = useState(INITIAL_GATEWAYS);
  const [timeline, setTimeline] = useState(INITIAL_TIMELINE_EVENTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
  const [activeTab, setActiveTab] = useState('gateways'); // 'gateways' | 'webhooks' | 'analytics' | 'logs'
  const [showAllCreds, setShowAllCreds] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [isDisableOpen, setIsDisableOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Selected entities for modals
  const [selectedGateway, setSelectedGateway] = useState(null);

  // Debouncing Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Simulate API reload
  const handleReload = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Payment Gateways configurations loaded!");
    }, 1000);
  };

  // Create Gateway submit
  const handleCreateGateway = (newGatewayData) => {
    const newGtw = {
      ...newGatewayData,
      _id: `gtw_${newGatewayData.gatewayName.toLowerCase()}_${Math.floor(Math.random() * 9000) + 1000}`,
      createdBy: "superadmin_01",
      updatedBy: "superadmin_01",
      updatedAt: new Date().toISOString()
    };

    // If new is default, make others false
    let updated = [...gateways];
    if (newGtw.defaultGateway) {
      updated = updated.map(g => ({ ...g, defaultGateway: false }));
    }
    updated.push(newGtw);
    setGateways(updated);

    // Timeline event
    setTimeline(prev => [
      {
        id: Date.now(),
        action: "Gateway Created",
        desc: `${newGtw.gatewayName} (${newGtw.environment}) registered`,
        user: "Admin",
        time: "Just now",
        type: "success"
      },
      ...prev
    ]);

    toast.success(`${newGtw.gatewayName} configured and saved successfully!`);
  };

  // Update Gateway submit
  const handleUpdateGateway = (updatedGateway) => {
    let updated = gateways.map(g => g._id === updatedGateway._id ? updatedGateway : g);
    if (updatedGateway.defaultGateway) {
      updated = updated.map(g => g._id !== updatedGateway._id ? { ...g, defaultGateway: false } : g);
    }
    setGateways(updated);

    setTimeline(prev => [
      {
        id: Date.now(),
        action: "Gateway Modified",
        desc: `${updatedGateway.gatewayName} properties updated successfully`,
        user: "Admin",
        time: "Just now",
        type: "info"
      },
      ...prev
    ]);

    toast.success(`${updatedGateway.gatewayName} configuration updated!`);
  };

  // Disable Gateway submit
  const handleConfirmDisable = (id) => {
    const updated = gateways.map(g => g._id === id ? { ...g, status: 'Inactive', defaultGateway: false } : g);
    setGateways(updated);

    const targetGtw = gateways.find(g => g._id === id);

    // Timeline event
    setTimeline(prev => [
      {
        id: Date.now(),
        action: "Gateway Disabled",
        desc: `${targetGtw?.gatewayName} status set to Inactive`,
        user: "Admin",
        time: "Just now",
        type: "warning"
      },
      ...prev
    ]);

    toast.warning(`${targetGtw?.gatewayName} disabled and removed from checkout workflows.`);
  };

  // Toggle quick status
  const handleToggleStatus = (gateway) => {
    if (gateway.status === 'Active') {
      setSelectedGateway(gateway);
      setIsDisableOpen(true);
    } else {
      // Enable it directly
      const updated = gateways.map(g => g._id === gateway._id ? { ...g, status: 'Active' } : g);
      setGateways(updated);
      toast.success(`${gateway.gatewayName} activated successfully!`);

      setTimeline(prev => [
        {
          id: Date.now(),
          action: "Gateway Enabled",
          desc: `${gateway.gatewayName} set to Active`,
          user: "Admin",
          time: "Just now",
          type: "success"
        },
        ...prev
      ]);
    }
  };

  // Set Default Gateway
  const handleSetDefault = (gateway) => {
    if (gateway.status !== 'Active') {
      toast.error(`Cannot set inactive gateway ${gateway.gatewayName} as default.`);
      return;
    }
    const updated = gateways.map(g => ({
      ...g,
      defaultGateway: g._id === gateway._id
    }));
    setGateways(updated);
    toast.success(`${gateway.gatewayName} set as primary payment gateway.`);

    setTimeline(prev => [
      {
        id: Date.now(),
        action: "Default Changed",
        desc: `${gateway.gatewayName} designated as default gateway`,
        user: "Admin",
        time: "Just now",
        type: "info"
      },
      ...prev
    ]);
  };

  // Filtered Gateways based on debounced search query
  const filteredGateways = useMemo(() => {
    if (!debouncedSearch) return gateways;
    return gateways.filter(g => 
      g.gatewayName.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      g.merchantId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      g.keyId.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      g.environment.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [gateways, debouncedSearch]);

  // Test All Connections simulation
  const handleTestAll = () => {
    setIsLoading(true);
    toast.info("Initializing diagnostic connection test for all active payment providers...");
    setTimeout(() => {
      setIsLoading(false);
      toast.success("Diagnostic connectivity tests complete! All active gateways (Razorpay, PhonePe, Cashfree, Stripe) reporting healthy latency (Avg. 132ms).");
    }, 1500);
  };

  // KPI Calculations
  const totalGatewaysCount = gateways.length;
  const activeGatewaysCount = gateways.filter(g => g.status === 'Active').length;
  const defaultGatewayName = gateways.find(g => g.defaultGateway)?.gatewayName || 'None';

  return (
    <div className="p-4 space-y-5 bg-white dark:bg-zinc-950 min-h-screen text-black dark:text-zinc-100">
      
      {/* 1. Header Section */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-50 dark:bg-zinc-900/40 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-black dark:text-zinc-50 flex items-center gap-2">
            <ShieldCheck className="text-[var(--primary)]" size={22} />
            Payment Gateways
          </h2>
          <p className="text-[11px] text-black dark:text-zinc-100 font-bold leading-relaxed max-w-2xl">
            Configure secure payment processors, API credentials, environments, webhooks, and default payment paths for client checkout integrations.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button 
            onClick={handleReload}
            disabled={isLoading}
            className="p-2 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-black dark:text-zinc-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
            Reload
          </button>
          
          <button 
            onClick={handleTestAll}
            className="px-3 py-2 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-black dark:text-zinc-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Play size={13} className="text-[var(--primary)]" />
            Diagnostics
          </button>

          <button 
            onClick={() => setIsLogsOpen(true)}
            className="px-3 py-2 border border-zinc-350 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-black dark:text-zinc-100 transition-all flex items-center gap-1.5 text-xs font-bold"
          >
            <Terminal size={13} className="text-purple-500" />
            Audit Logs
          </button>

          <button 
            onClick={() => setIsAddOpen(true)}
            className="px-3 py-2 bg-[var(--primary)] text-white hover:opacity-95 active:scale-95 transition-all rounded-lg flex items-center gap-1.5 text-xs font-bold shadow-sm"
          >
            <Plus size={14} /> Add Provider
          </button>
        </div>
      </header>

      {/* 2. KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Active Providers */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-1.5 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold text-zinc-800 dark:text-zinc-300">
            <span>Active Providers</span>
            <Globe className="text-emerald-500" size={14} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{activeGatewaysCount}</span>
            <span className="text-[10px] text-zinc-500 font-medium">/ {totalGatewaysCount} Total</span>
          </div>
          <p className="text-[9.5px] font-medium text-zinc-700 dark:text-zinc-400">Live transaction endpoints routed</p>
        </div>

        {/* Primary Default Route */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-1.5 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold text-zinc-800 dark:text-zinc-300">
            <span>Primary Route</span>
            <ShieldCheck className="text-[var(--primary)]" size={14} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{defaultGatewayName}</span>
          </div>
          <p className="text-[9.5px] font-medium text-zinc-700 dark:text-zinc-400">Default fallback checkout routing</p>
        </div>

        {/* Today's Volume */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-1.5 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold text-zinc-800 dark:text-zinc-300">
            <span>Today's volume</span>
            <TrendingUp className="text-emerald-500" size={14} />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">₹96,490</span>
            <span className="text-[9px] text-emerald-600 font-semibold flex items-center gap-0.5"><ArrowUpRight size={10} /> +12%</span>
          </div>
          <p className="text-[9.5px] font-medium text-zinc-700 dark:text-zinc-400">Across card, wallet & UPI channels</p>
        </div>

        {/* Gateway Health Status */}
        <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-1.5 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-center text-[10px] uppercase tracking-wider font-semibold text-zinc-800 dark:text-zinc-300">
            <span>API Success Rate</span>
            <Activity className="text-emerald-500 animate-pulse" size={14} />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">98.4%</span>
            <span className="text-[10px] text-red-500 font-semibold">1.6% fail</span>
          </div>
          <p className="text-[9.5px] font-medium text-zinc-700 dark:text-zinc-400">Webhook & charge latency optimal</p>
        </div>
      </section>

      {/* 3. Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Side: Main Tables / Tabs (Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Tab Navigation / Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-850 pb-1">
            <div className="flex gap-2">
              <button 
                onClick={() => setActiveTab('gateways')}
                className={`px-3 py-2 text-xs font-bold transition-all relative ${
                  activeTab === 'gateways' 
                    ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' 
                    : 'text-black dark:text-zinc-100 hover:opacity-85'
                }`}
              >
                Payment Providers
              </button>
              <button 
                onClick={() => setActiveTab('webhooks')}
                className={`px-3 py-2 text-xs font-bold transition-all relative ${
                  activeTab === 'webhooks' 
                    ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' 
                    : 'text-black dark:text-zinc-100 hover:opacity-85'
                }`}
              >
                Webhook Configurations
              </button>
              <button 
                onClick={() => setActiveTab('analytics')}
                className={`px-3 py-2 text-xs font-bold transition-all relative ${
                  activeTab === 'analytics' 
                    ? 'text-[var(--primary)] border-b-2 border-[var(--primary)]' 
                    : 'text-black dark:text-zinc-100 hover:opacity-85'
                }`}
              >
                Analytics Dashboard
              </button>
            </div>

            {/* Quick search & view mode (Only for gateways tab) */}
            {activeTab === 'gateways' && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black dark:text-zinc-100" size={13} />
                  <input 
                    type="text" 
                    placeholder="Search credentials..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-8 pl-8 pr-3 w-40 md:w-56 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100 font-medium"
                  />
                </div>

                <div className="flex items-center border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden shrink-0">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 text-xs font-bold ${viewMode === 'grid' ? 'bg-zinc-200 dark:bg-zinc-800 text-[var(--primary)]' : 'bg-white dark:bg-zinc-900 text-black dark:text-zinc-100'}`}
                  >
                    Grid
                  </button>
                  <button 
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 text-xs font-bold ${viewMode === 'table' ? 'bg-zinc-200 dark:bg-zinc-800 text-[var(--primary)]' : 'bg-white dark:bg-zinc-900 text-black dark:text-zinc-100'}`}
                  >
                    Table
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TAB 1: Payment Providers */}
          {activeTab === 'gateways' && (
            <div>
              {filteredGateways.length === 0 ? (
                <div className="py-12 bg-zinc-50 dark:bg-zinc-900/20 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl text-center flex flex-col items-center justify-center p-4">
                  <AlertCircle className="text-zinc-400 mb-2" size={24} />
                  <h4 className="text-xs font-extrabold text-black dark:text-zinc-100">No Payment Providers Found</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-normal">
                    No gateway parameters matched your search query or filters. Click "Add Provider" to register a new gateway.
                  </p>
                </div>
              ) : viewMode === 'grid' ? (
                /* Grid view cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredGateways.map((g) => (
                    <div 
                      key={g._id}
                      className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all rounded-xl p-4 flex flex-col justify-between h-52 relative group"
                    >
                      {/* Card Header */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[13px] font-black text-black dark:text-zinc-50 flex items-center gap-1.5">
                              {g.gatewayName}
                              {g.defaultGateway && (
                                <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 rounded text-[8px] font-black uppercase tracking-wider">
                                  Default
                                </span>
                              )}
                            </span>
                            <span className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest block">ID: {g._id}</span>
                          </div>

                          <div className="flex items-center gap-2.5">
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border ${
                              g.environment === 'Production' 
                                ? 'bg-purple-500/10 text-purple-650 border-purple-500/20' 
                                : 'bg-orange-500/10 text-orange-655 border-orange-500/25'
                            }`}>
                              {g.environment}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={g.status === 'Active'}
                                onChange={() => handleToggleStatus(g)}
                                className="sr-only peer" 
                              />
                              <div className="w-8 h-4.5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                          </div>
                        </div>

                        {/* Credentials Snapshot */}
                        <div className="bg-zinc-50 dark:bg-zinc-800/40 p-2.5 rounded-lg space-y-1 text-[10px] text-black dark:text-zinc-100 font-bold border border-zinc-100 dark:border-zinc-800">
                          <div className="flex justify-between">
                            <span className="opacity-75 uppercase tracking-wider text-[8px]">Mid:</span>
                            <span className="font-mono truncate max-w-[150px]">{g.merchantId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-75 uppercase tracking-wider text-[8px]">Key ID:</span>
                            <span className="font-mono truncate max-w-[150px]">{g.keyId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="opacity-75 uppercase tracking-wider text-[8px]">Secret:</span>
                            <span className="font-mono text-zinc-500">••••••••••••••••</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer Actions */}
                      <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          {g.status === 'Active' && !g.defaultGateway && (
                            <button 
                              onClick={() => handleSetDefault(g)}
                              className="text-[9px] font-black uppercase text-[var(--primary)] hover:underline"
                            >
                              Make Default
                            </button>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setSelectedGateway(g); setIsTestOpen(true); }}
                            title="Test Connection"
                            className="p-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 transition-colors flex items-center gap-1 text-[9px] font-bold"
                          >
                            <Play size={10} className="text-[var(--primary)]" /> Test
                          </button>
                          <button
                            onClick={() => { setSelectedGateway(g); setIsEditOpen(true); }}
                            className="p-1.5 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-zinc-100 transition-colors flex items-center gap-1 text-[9px] font-bold"
                          >
                            <Edit size={10} className="text-blue-500" /> Edit
                          </button>
                          <button
                            onClick={() => { setSelectedGateway(g); setIsDrawerOpen(true); }}
                            className="p-1.5 bg-black dark:bg-zinc-800 text-white rounded-lg hover:opacity-90 text-[9px] font-bold transition-all"
                          >
                            Inspect
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table View */
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                      <tr>
                        <th className="p-3">Gateway Name</th>
                        <th className="p-3">Merchant ID</th>
                        <th className="p-3">Key ID</th>
                        <th className="p-3">Environment</th>
                        <th className="p-3">Status</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-zinc-100 font-semibold">
                      {filteredGateways.map((g) => (
                        <tr key={g._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="p-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-[12.5px]">{g.gatewayName}</span>
                              {g.defaultGateway && (
                                <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 rounded text-[8px] font-black uppercase">
                                  Default
                                </span>
                              )}
                            </div>
                            <span className="text-[8px] font-mono text-zinc-500 block">ID: {g._id}</span>
                          </td>
                          <td className="p-3 font-mono">{g.merchantId}</td>
                          <td className="p-3 font-mono truncate max-w-[150px]">{g.keyId}</td>
                          <td className="p-3">
                            <span className={`px-1.5 py-0.2 rounded text-[8px] font-black uppercase tracking-wider border ${
                              g.environment === 'Production' 
                                ? 'bg-purple-500/10 text-purple-650 border-purple-500/20' 
                                : 'bg-orange-500/10 text-orange-655 border-orange-500/25'
                            }`}>
                              {g.environment}
                            </span>
                          </td>
                          <td className="p-3">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={g.status === 'Active'}
                                onChange={() => handleToggleStatus(g)}
                                className="sr-only peer" 
                              />
                              <div className="w-8 h-4.5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {g.status === 'Active' && !g.defaultGateway && (
                                <button 
                                  onClick={() => handleSetDefault(g)}
                                  className="px-2 py-1 text-[9px] border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 rounded text-black dark:text-zinc-100"
                                >
                                  Default
                                </button>
                              )}
                              <button
                                onClick={() => { setSelectedGateway(g); setIsTestOpen(true); }}
                                className="p-1 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 text-black dark:text-zinc-100"
                                title="Test Connection"
                              >
                                <Play size={10} className="text-[var(--primary)]" />
                              </button>
                              <button
                                onClick={() => { setSelectedGateway(g); setIsEditOpen(true); }}
                                className="p-1 border border-zinc-300 dark:border-zinc-700 rounded hover:bg-zinc-100 text-black dark:text-zinc-100"
                                title="Edit Credentials"
                              >
                                <Edit size={10} className="text-blue-500" />
                              </button>
                              <button
                                onClick={() => { setSelectedGateway(g); setIsDrawerOpen(true); }}
                                className="px-2 py-1 bg-black dark:bg-zinc-800 text-white rounded text-[9.5px] hover:opacity-90 transition-all font-bold"
                              >
                                Inspect
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Webhooks Configurations */}
          {activeTab === 'webhooks' && (
            <div className="space-y-4">
              <div className="bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-black dark:text-zinc-100 space-y-3 shadow-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                      <Radio size={14} className="text-[var(--primary)]" />
                      Global Webhook Receiver Health
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-bold mt-0.5">
                      All webhooks route to our core backend handlers using HMACS signature verification.
                    </p>
                  </div>
                  <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/25 rounded text-[8.5px] font-black uppercase">
                    Receiver Status: Online
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-bold">
                    <span className="opacity-75 block text-[8px] uppercase tracking-wider mb-0.5">Delivery Rate</span>
                    <span className="text-base font-black text-black dark:text-zinc-50">99.85%</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-bold">
                    <span className="opacity-75 block text-[8px] uppercase tracking-wider mb-0.5">Average Signature Latency</span>
                    <span className="text-base font-black text-black dark:text-zinc-50">42 ms</span>
                  </div>
                  <div className="p-3 bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[10.5px] font-bold">
                    <span className="opacity-75 block text-[8px] uppercase tracking-wider mb-0.5">Retry Interval</span>
                    <span className="text-base font-black text-black dark:text-zinc-50">5 Retries / Expo Fallback</span>
                  </div>
                </div>
              </div>

              {/* List of active webhook URLs */}
              <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-zinc-50 dark:bg-zinc-800/40 text-black dark:text-zinc-100 font-bold uppercase tracking-wider text-[8.5px] border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="p-3">Gateway</th>
                      <th className="p-3">Callback Endpoint</th>
                      <th className="p-3">Secret Key Status</th>
                      <th className="p-3">Mapped Event Types</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-black dark:text-zinc-100 font-semibold">
                    {gateways.map((g) => (
                      <tr key={g._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors">
                        <td className="p-3 font-extrabold">{g.gatewayName}</td>
                        <td className="p-3 font-mono text-[9px] select-all truncate max-w-xs">
                          https://api.papavegpizza.in/v1/payments/webhooks/{g.gatewayName.toLowerCase()}
                        </td>
                        <td className="p-3">
                          <span className={`px-1.5 py-0.2 rounded text-[8.5px] font-extrabold ${
                            g.webhookSecret ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
                          }`}>
                            {g.webhookSecret ? 'Configured (HMAC)' : 'Not Set'}
                          </span>
                        </td>
                        <td className="p-3 text-[9px] text-zinc-500 max-w-xs leading-normal">
                          payment.captured, payment.failed, refund.processed, webhook.ping
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Analytics Dashboard */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Chart 1: Transaction Volume */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-black dark:text-zinc-100 space-y-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Payments Channel Volume (Last 7 Days)</h4>
                    <p className="text-[9.5px] text-zinc-500 font-bold mt-0.5">Daily volume captured in Indian Rupees (INR)</p>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={TRANSACTION_VOLUME_DATA}>
                        <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                        <Area type="monotone" dataKey="Razorpay" stroke="#F35C2B" fillOpacity={0.1} fill="#F35C2B" />
                        <Area type="monotone" dataKey="PhonePe" stroke="#5F259F" fillOpacity={0.1} fill="#5F259F" />
                        <Area type="monotone" dataKey="Stripe" stroke="#635BFF" fillOpacity={0.1} fill="#635BFF" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Success Rate comparison */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-black dark:text-zinc-100 space-y-3">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider">Gateway Transaction Success Rate</h4>
                    <p className="text-[9.5px] text-zinc-500 font-bold mt-0.5">Success vs Failures percentage metrics</p>
                  </div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={SUCCESS_RATE_DATA}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                        <Legend wrapperStyle={{ fontSize: '9px' }} />
                        <Bar dataKey="Success" fill="#10B981" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="Failed" fill="#EF4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Distribution & Share */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-black dark:text-zinc-100 flex flex-col justify-between md:col-span-1">
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-wider mb-2">Provider Market Share</h4>
                    <p className="text-[9.5px] text-zinc-500 font-bold">Relative percentage of successful checkouts processed</p>
                  </div>
                  <div className="h-36 flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={GATEWAY_DISTRIBUTION}
                          cx="50%"
                          cy="50%"
                          innerRadius={30}
                          outerRadius={50}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {GATEWAY_DISTRIBUTION.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: '#18181b', border: 'none', borderRadius: '8px', fontSize: '10px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 justify-center text-[9px] font-bold">
                    {GATEWAY_DISTRIBUTION.map((entry) => (
                      <span key={entry.name} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></span>
                        {entry.name} ({entry.value}%)
                      </span>
                    ))}
                  </div>
                </div>

                {/* Additional detailed metrics table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 text-black dark:text-zinc-100 md:col-span-2 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider">Gateway Latency & Event Diagnostics</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-[10px] border-collapse">
                      <thead className="bg-zinc-50 dark:bg-zinc-800/40 font-bold text-black dark:text-zinc-100 uppercase tracking-wider text-[8px] border-b border-zinc-200 dark:border-zinc-800">
                        <tr>
                          <th className="p-2">Gateway</th>
                          <th className="p-2">Environment</th>
                          <th className="p-2">Average Response Time</th>
                          <th className="p-2">Uptime %</th>
                          <th className="p-2">Sync State</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-semibold text-black dark:text-zinc-100">
                        <tr>
                          <td className="p-2 font-extrabold">Razorpay</td>
                          <td className="p-2">Production</td>
                          <td className="p-2">92 ms</td>
                          <td className="p-2 text-emerald-650">99.98%</td>
                          <td className="p-2">Synced (Mongo)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-extrabold">PhonePe</td>
                          <td className="p-2">Production</td>
                          <td className="p-2">124 ms</td>
                          <td className="p-2 text-emerald-650">99.95%</td>
                          <td className="p-2">Synced (Mongo)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-extrabold">Cashfree</td>
                          <td className="p-2">Sandbox</td>
                          <td className="p-2">154 ms</td>
                          <td className="p-2 text-emerald-650">99.80%</td>
                          <td className="p-2">Synced (Mongo)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-extrabold">Stripe</td>
                          <td className="p-2">Production</td>
                          <td className="p-2">84 ms</td>
                          <td className="p-2 text-emerald-650">99.99%</td>
                          <td className="p-2">Synced (Mongo)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Right Side: Operations Control Panel (Span 1) */}
        <aside className="lg:col-span-1 space-y-4">
          
          {/* Security & Compliance Panel */}
          <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 text-black dark:text-zinc-100 shadow-xs">
            <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <ShieldCheck className="text-[var(--primary)] shrink-0" size={13} />
              Security & Compliance
            </h4>
            
            <div className="space-y-2 text-[10.5px] font-bold">
              <div className="flex items-center justify-between">
                <span>Encryption:</span>
                <span className="text-emerald-600">256-bit SSL</span>
              </div>

              <div className="flex items-center justify-between">
                <span>PCI-DSS Compliance:</span>
                <span className="text-emerald-600">Level 1 Certified</span>
              </div>

              <div className="flex items-center justify-between">
                <span>Default Gateway Fallback:</span>
                <span className="text-zinc-850 dark:text-zinc-300">Enabled</span>
              </div>

              <div className="flex items-center justify-between">
                <span>System Status:</span>
                <span className="flex items-center gap-1 text-emerald-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  Active & Secure
                </span>
              </div>
            </div>
          </div>

          {/* Audit Event Timeline */}
          <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 text-black dark:text-zinc-100 shadow-xs">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="text-purple-500 shrink-0" size={13} />
                Recent Configuration Changes
              </h4>
            </div>

            <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {timeline.map((event) => (
                <div key={event.id} className="flex gap-2.5 items-start text-[10px] leading-normal font-bold">
                  {/* Indicator Dot */}
                  <span className={`w-2 h-2 rounded-full shrink-0 mt-1.5 ${
                    event.type === 'success' ? 'bg-emerald-500' :
                    event.type === 'warning' ? 'bg-amber-500 animate-pulse' :
                    event.type === 'error' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
                  }`}></span>
                  
                  <div className="space-y-0.5 flex-1">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="font-extrabold text-black dark:text-zinc-50">{event.action}</span>
                      <span className="text-[8px] text-zinc-500 shrink-0">{event.time}</span>
                    </div>
                    <p className="text-black dark:text-zinc-100 font-semibold">{event.desc}</p>
                    <span className="text-[8.5px] text-zinc-500 font-extrabold flex items-center gap-0.5">By {event.user}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>

      </div>

      {/* Modals & Drawers mount */}
      <AddGatewayModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onSave={handleCreateGateway}
      />

      <EditGatewayModal 
        isOpen={isEditOpen} 
        onClose={() => { setIsEditOpen(false); setSelectedGateway(null); }} 
        gateway={selectedGateway}
        onSave={handleUpdateGateway}
      />

      <TestConnectionModal 
        isOpen={isTestOpen} 
        onClose={() => { setIsTestOpen(false); setSelectedGateway(null); }} 
        gateway={selectedGateway}
      />

      <GatewayLogsModal 
        isOpen={isLogsOpen} 
        onClose={() => setIsLogsOpen(false)}
        initialGateway={selectedGateway ? selectedGateway.gatewayName : 'All'}
      />

      <DisableGatewayModal 
        isOpen={isDisableOpen} 
        onClose={() => { setIsDisableOpen(false); setSelectedGateway(null); }} 
        gateway={selectedGateway}
        onConfirm={handleConfirmDisable}
      />

      <GatewayDetailsDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => { setIsDrawerOpen(false); setSelectedGateway(null); }} 
        gateway={selectedGateway}
        onEdit={(g) => { setIsDrawerOpen(false); setSelectedGateway(g); setIsEditOpen(true); }}
        onTest={(g) => { setIsDrawerOpen(false); setSelectedGateway(g); setIsTestOpen(true); }}
        onToggleStatus={(g) => { setIsDrawerOpen(false); handleToggleStatus(g); }}
      />

    </div>
  );
}
