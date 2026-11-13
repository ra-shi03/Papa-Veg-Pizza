import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, Search, Plus, RefreshCw, Download, Sliders, Database, 
  Terminal, Edit, Play, Power, Radio, HelpCircle, Activity, Globe, 
  Check, Copy, ChevronRight, AlertCircle, CheckCircle, Info, MoreVertical, 
  Trash, ArrowUpRight, TrendingUp, Cpu, Server, Clock, Calendar 
} from 'lucide-react';
import { toast } from 'sonner';
import { adminAPI } from '@food/api';

// Modal imports
import AddGatewayModal from './AddGatewayModal';
import EditGatewayModal from './EditGatewayModal';
import TestConnectionModal from './TestConnectionModal';
import GatewayLogsModal from './GatewayLogsModal';

const apiError = (err, fallback) => err?.response?.data?.message || err?.response?.data?.error || err?.message || fallback;

// "2 mins ago" style time for the change history
const ago = (iso) => {
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (secs < 60) return 'Just now';
  if (secs < 3600) return `${Math.floor(secs / 60)} min${secs >= 120 ? 's' : ''} ago`;
  if (secs < 86400) return `${Math.floor(secs / 3600)} hr${secs >= 7200 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export default function PaymentGateways() {
  const [gateways, setGateways] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('gateways'); 
  const [showAllCreds, setShowAllCreds] = useState(false);

  // Modals state
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isTestOpen, setIsTestOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  // Selected entities for modals
  const [selectedGateway, setSelectedGateway] = useState(null);

  // Everything on this screen comes from the server
  const loadAll = async (announce = false) => {
    setIsLoading(true);
    try {
      const [g, ev] = await Promise.all([
        adminAPI.getPaymentGateways(),
        adminAPI.getPaymentGatewayEvents(),
      ]);
      setGateways(g?.data?.data || []);
      setTimeline((ev?.data?.data || []).map((e) => ({ ...e, time: ago(e.at) })));
      if (announce) toast.success('Payment Gateways configurations loaded!');
    } catch (err) {
      toast.error(apiError(err, 'Could not load payment gateways'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const handleReload = () => loadAll(true);

  // Create Gateway submit (the modal shows any error and stays open)
  const handleCreateGateway = async (data) => {
    await adminAPI.createPaymentGateway(data);
    toast.success(`${data.gatewayName} configured and saved successfully!`);
    await loadAll();
  };

  // Update Gateway submit
  const handleUpdateGateway = async (data) => {
    await adminAPI.updatePaymentGateway(data._id, data);
    toast.success(`${data.gatewayName} configuration updated!`);
    await loadAll();
  };

  const changeStatus = async (gateway, status) => {
    try {
      await adminAPI.setPaymentGatewayStatus(gateway._id, status);
      await loadAll();
      return true;
    } catch (err) {
      toast.error(apiError(err, 'Could not change the status'));
      return false;
    }
  };

  // Set Default Gateway
  const handleSetDefault = async (gateway) => {
    if (gateway.status !== 'Active') {
      toast.error(`Cannot set inactive gateway ${gateway.gatewayName} as default.`);
      return;
    }
    try {
      await adminAPI.makePaymentGatewayDefault(gateway._id);
      toast.success(`${gateway.gatewayName} set as primary payment gateway.`);
      await loadAll();
    } catch (err) {
      toast.error(apiError(err, 'Could not change the default gateway'));
    }
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
            Configure secure payment processors, API credentials, environments, and default payment paths for client checkout integrations.
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
      <section className="grid grid-cols-2 gap-4">
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
      </section>

      {/* 3. Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-5">
        
        {/* Left Side: Main Tables / Tabs (Span 3) */}
        <div className="lg:col-span-3 space-y-4">
          
          <div className="border-b border-zinc-200 dark:border-zinc-850 pb-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--primary)]">Payment Providers</h3>
          </div>

          {/* TAB 1: Payment Providers */}
          {(
            <div>
              {gateways.length === 0 ? (
                <div className="py-12 bg-zinc-50 dark:bg-zinc-900/20 border border-dashed border-zinc-300 dark:border-zinc-800 rounded-xl text-center flex flex-col items-center justify-center p-4">
                  <AlertCircle className="text-zinc-400 mb-2" size={24} />
                  <h4 className="text-xs font-extrabold text-black dark:text-zinc-100">No Payment Providers Found</h4>
                  <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-normal">
                    Nothing is set up yet. Click "Add Provider" to register a gateway.
                  </p>
                </div>
              ) : (
                /* Gateway cards */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gateways.map((g) => (
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
                          {g.merchantId && (
                            <div className="flex justify-between">
                              <span className="opacity-75 uppercase tracking-wider text-[8px]">Mid:</span>
                              <span className="font-mono truncate max-w-[150px]">{g.merchantId}</span>
                            </div>
                          )}
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
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Right Side: Operations Control Panel (Span 1) */}
        <aside className="lg:col-span-1 space-y-4">
          
          {/* Audit Event Timeline */}
          <div className="bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-3 text-black dark:text-zinc-100 shadow-xs">
            <div className="flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800 pb-1.5">
              <h4 className="text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="text-purple-500 shrink-0" size={13} />
                Recent Configuration Changes
              </h4>
            </div>

            <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
              {timeline.length === 0 && <p className="text-[10px] text-zinc-500 font-semibold">No changes recorded yet.</p>}
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

      {/* Modals mount */}
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
        onRun={async (g) => (await adminAPI.testPaymentGateway(g._id))?.data?.data}
        onDone={() => loadAll()}
      />

      <GatewayLogsModal 
        isOpen={isLogsOpen} 
        onClose={() => setIsLogsOpen(false)}
        initialGateway={selectedGateway ? selectedGateway.gatewayName : 'All'}
        gatewayNames={gateways.map(g => g.gatewayName)}
      />

    </div>
  );
}
