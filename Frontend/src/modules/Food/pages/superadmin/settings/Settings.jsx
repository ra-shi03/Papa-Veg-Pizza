import React, { useState, useEffect, useRef } from 'react';
import {
  Settings as SettingsIcon,
  RefreshCw,
  Save,
  AlertTriangle,
  Download,
  Info,
  CheckCircle,
  Clock,
  MapPin,
  FileText,
  DollarSign,
  Briefcase,
  Shield,
  Percent,
  Lock,
  Globe,
  UploadCloud,
  ChevronRight,
  User,
  ArrowRight,
  TrendingUp,
  Search,
  Bell,
  Sliders,
  Trash2,
  HelpCircle,
  Database,
  ExternalLink,
  Laptop
} from 'lucide-react';
import UpdateCompanyModal from './UpdateCompanyModal';
import { applySystemTheme } from '@/shared/utils/themeSync';
import UpdateTaxModal from './UpdateTaxModal';
import MaintenanceModeModal from './MaintenanceModeModal';

// Mock Toast Hook/Component for beautiful notifications
function useToast() {
  const [toasts, setToasts] = useState([]);
  const addToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };
  return { toasts, addToast };
}

export default function Settings() {
  const { toasts, addToast } = useToast();
  
  // Modals state
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isTaxModalOpen, setIsTaxModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);

  // Search & Debouncing
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Loading & Empty States
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  
  // Tab control
  const [activeTab, setActiveTab] = useState('company');

  // Main Controlled State matching MongoDB 'system_settings' collection
  const [settings, setSettings] = useState(() => {
    const defaultLogo = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=150';
    const defaultFavicon = 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&q=80&w=40';
    
    return {
      companyName: localStorage.getItem("sa_companyName") || 'Papa Veg Pizza India Ltd.',
      supportEmail: 'care@papavegpizza.in',
      supportPhone: '+91 98765 43210',
      website: 'https://papavegpizza.in',
      logo: localStorage.getItem("sa_logo") || defaultLogo,
      favicon: localStorage.getItem("sa_favicon") || defaultFavicon,
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      language: 'English (IN)',
      gstPercent: 5,
      serviceTaxPercent: 2.5,
      packagingCharge: 30,
      taxIncluded: false,
      orderCancellationTime: 5, // minutes
      refundWindowHours: 24, // hours
      maxDeliveryRadius: 15, // km
      minimumOrderAmount: 299, // ₹
      invoicePrefix: 'PVP-IND-',
      invoiceFooter: 'Thank you for choosing Papa Veg Pizza! Visit again.',
      maintenanceMode: false,
      maintenanceReason: '',
      maintenanceStart: '',
      maintenanceEnd: '',
      maintenanceAffectedModules: [],
      passwordExpiryDays: 90,
      sessionTimeoutMinutes: 30,
      otpExpirySeconds: 60,
      loginAttemptsLimit: 5,
      require2FA: true,
      updatedBy: 'Rohan Sharma (Super Admin)',
      updatedAt: '2026-06-19T16:51:00Z'
    };
  });

  const [orderMethods, setOrderMethods] = useState(() => {
    const defaultMethods = [
      { id: "delivery", label: "Delivery", icon: "moped", enabled: true },
      { id: "takeaway", label: "Takeaway", icon: "store", enabled: true },
      { id: "incar", label: "In-Car", icon: "directions_car", enabled: true },
      { id: "train", label: "Delivery on Train", icon: "train", enabled: true }
    ];
    try {
      const stored = localStorage.getItem("pvp_order_methods");
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return defaultMethods;
  });

  // Keep a tracking state for unsaved edits alert
  const [originalSettings, setOriginalSettings] = useState(() => ({ ...settings }));
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Debouncing Search Query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Track unsaved changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(changed);
  }, [settings, originalSettings]);

  // Simulated Custom State Hooks (API-ready)
  const useSettings = () => ({
    data: settings,
    loading: isLoading,
    refetch: () => {
      setIsLoading(true);
      addToast('Syncing latest configuration from database...', 'info');
      setTimeout(() => {
        setIsLoading(false);
        addToast('Settings synchronized successfully!', 'success');
      }, 1000);
    }
  });

  const useUpdateSettings = () => ({
    mutateAsync: async (newValues) => {
      setIsSavingAll(true);
      return new Promise((resolve) => {
        setTimeout(() => {
          setSettings(prev => ({
            ...prev,
            ...newValues,
            updatedBy: 'Rohan Sharma (Super Admin)',
            updatedAt: new Date().toISOString()
          }));
          setIsSavingAll(false);
          resolve(true);
        }, 1200);
      });
    }
  });

  const useUpdateTaxSettings = () => ({
    mutateAsync: async (taxValues) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setSettings(prev => ({
            ...prev,
            ...taxValues,
            updatedBy: 'Rohan Sharma (Super Admin)',
            updatedAt: new Date().toISOString()
          }));
          resolve(true);
        }, 1000);
      });
    }
  });

  const useUpdateSecuritySettings = () => ({
    mutateAsync: async (secValues) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setSettings(prev => ({
            ...prev,
            ...secValues,
            updatedBy: 'Rohan Sharma (Super Admin)',
            updatedAt: new Date().toISOString()
          }));
          resolve(true);
        }, 1000);
      });
    }
  });

  const useMaintenanceMode = () => ({
    toggleMaintenance: async (payload) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          if (payload) {
            setSettings(prev => ({
              ...prev,
              maintenanceMode: true,
              maintenanceReason: payload.reason,
              maintenanceStart: payload.startTime,
              maintenanceEnd: payload.endTime,
              maintenanceAffectedModules: payload.affectedModules,
              updatedBy: 'Rohan Sharma (Super Admin)',
              updatedAt: new Date().toISOString()
            }));
          } else {
            setSettings(prev => ({
              ...prev,
              maintenanceMode: false,
              maintenanceReason: '',
              maintenanceStart: '',
              maintenanceEnd: '',
              maintenanceAffectedModules: [],
              updatedBy: 'Rohan Sharma (Super Admin)',
              updatedAt: new Date().toISOString()
            }));
          }
          resolve(true);
        }, 1000);
      });
    }
  });

  const { refetch } = useSettings();
  const updateSettingsHook = useUpdateSettings();
  const updateTaxHook = useUpdateTaxSettings();
  const updateSecurityHook = useUpdateSecuritySettings();
  const maintenanceHook = useMaintenanceMode();

  // Submit handlers for specific sections
  const handleSaveTabChanges = async (tabName) => {
    try {
      await updateSettingsHook.mutateAsync(settings);
      setOriginalSettings({ ...settings });
      if (tabName === 'company') {
        localStorage.setItem("sa_logo", settings.logo);
        localStorage.setItem("sa_favicon", settings.favicon);
        localStorage.setItem("sa_companyName", settings.companyName);
        applySystemTheme();
        window.dispatchEvent(new Event("systemThemeChanged"));
      }
      if (tabName === 'Orders' || tabName === 'orders') {
        localStorage.setItem("pvp_order_methods", JSON.stringify(orderMethods));
        window.dispatchEvent(new Event("pvp_order_methods_changed"));
      }
      addToast(`Updated ${tabName} configuration successfully!`, 'success');
    } catch (e) {
      addToast('Failed to save settings. Please try again.', 'error');
    }
  };

  const handleResetSettings = () => {
    setSettings({ ...originalSettings });
    addToast('Form fields reset to last saved state.', 'warning');
  };

  const handleSaveAllChanges = async () => {
    try {
      await updateSettingsHook.mutateAsync(settings);
      setOriginalSettings({ ...settings });
      localStorage.setItem("sa_logo", settings.logo);
      localStorage.setItem("sa_favicon", settings.favicon);
      localStorage.setItem("sa_companyName", settings.companyName);
      localStorage.setItem("pvp_order_methods", JSON.stringify(orderMethods));
      window.dispatchEvent(new Event("pvp_order_methods_changed"));
      applySystemTheme();
      window.dispatchEvent(new Event("systemThemeChanged"));
      addToast('All configurations updated successfully!', 'success');
    } catch (e) {
      addToast('Failed to update configurations.', 'error');
    }
  };

  const handleToggleMaintenanceMode = async () => {
    if (settings.maintenanceMode) {
      setIsLoading(true);
      await maintenanceHook.toggleMaintenance(null);
      setIsLoading(false);
      addToast('Maintenance mode deactivated. All modules live.', 'success');
    } else {
      setIsMaintenanceModalOpen(true);
    }
  };

  const handleEnableMaintenanceConfirm = async (payload) => {
    setIsLoading(true);
    await maintenanceHook.toggleMaintenance(payload);
    setIsLoading(false);
    addToast('Maintenance mode activated successfully.', 'warning');
  };

  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(settings, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `system_settings_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Configuration file exported successfully.', 'success');
  };

  // Activity Log history mock
  const recentChanges = [
    { type: 'TAX', desc: 'GST rate adjusted to 5%', time: '10 mins ago', user: 'Rohan Sharma' },
    { type: 'MAINTENANCE', desc: 'Disabled system-wide maintenance', time: '2 hours ago', user: 'Rohan Sharma' },
    { type: 'ORDER', desc: 'Minimum order amount changed to ₹299', time: '1 day ago', user: 'Aman Verma' },
    { type: 'INVOICE', desc: 'Invoice footer modified', time: '3 days ago', user: 'Sarah D.' }
  ];

  // Filter content based on debounced search query
  const matchesSearch = (text) => {
    if (!debouncedSearch) return true;
    return text.toLowerCase().includes(debouncedSearch.toLowerCase());
  };

  return (
    <div className="p-3 md:p-4 pb-16 max-w-[1400px] mx-auto bg-zinc-50 dark:bg-zinc-955 min-h-screen w-full space-y-4 animate-fade-down relative">
      
      {/* Toast Notification Container */}
      <div className="fixed top-4 right-4 z-[999] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={`p-3 rounded-lg shadow-xl border flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-300 pointer-events-auto ${
              toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/90 dark:border-emerald-800 dark:text-emerald-300' :
              toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/90 dark:border-amber-800 dark:text-amber-300' :
              toast.type === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/90 dark:border-rose-800 dark:text-rose-300' :
              'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/90 dark:border-blue-800 dark:text-blue-300'
            }`}
          >
            <CheckCircle size={15} className="shrink-0" />
            <span className="text-[11px] font-semibold">{toast.message}</span>
          </div>
        ))}
      </div>

      {/* Connected Modals */}
      <UpdateCompanyModal 
        isOpen={isCompanyModalOpen} 
        onClose={() => setIsCompanyModalOpen(false)}
        initialData={settings}
        onSave={(data) => {
          setSettings(prev => ({ ...prev, ...data }));
          addToast('Branding changes saved locally. Remember to click "Save All Changes" to persist.', 'warning');
        }}
      />
      
      <UpdateTaxModal 
        isOpen={isTaxModalOpen} 
        onClose={() => setIsTaxModalOpen(false)}
        initialData={settings}
        onSave={async (data) => {
          await updateTaxHook.mutateAsync(data);
          addToast('Taxation settings saved successfully!', 'success');
        }}
      />

      <MaintenanceModeModal 
        isOpen={isMaintenanceModalOpen} 
        onClose={() => setIsMaintenanceModalOpen(false)}
        onConfirm={handleEnableMaintenanceConfirm}
      />

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500 animate-pulse" size={16} />
            <span>You have unsaved changes. Make sure to commit them.</span>
          </div>
          <div className="flex gap-2">
            <button onClick={handleResetSettings} className="px-2 py-1 text-[10px] bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 rounded">
              Discard
            </button>
            <button onClick={handleSaveAllChanges} className="px-2.5 py-1 text-[10px] bg-[var(--primary)] hover:opacity-90 text-white rounded">
              Save All
            </button>
          </div>
        </div>
      )}

      {/* Maintenance Mode Top Banner */}
      {settings.maintenanceMode && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 p-4 rounded-xl space-y-2 animate-in slide-in-from-top-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-red-600 text-white text-[9px] font-extrabold rounded-full uppercase tracking-wider animate-pulse">
                Maintenance Active
              </span>
              <span className="text-xs font-bold">Affected Modules: {settings.maintenanceAffectedModules.join(', ')}</span>
            </div>
            <button 
              onClick={handleToggleMaintenanceMode}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold shadow-sm transition-all"
            >
              Disable Maintenance
            </button>
          </div>
          <p className="text-[11px] leading-relaxed opacity-90 font-medium">
            <strong>Reason: </strong> {settings.maintenanceReason}
          </p>
          <div className="flex gap-4 text-[9px] font-semibold opacity-70">
            <span><strong>Start: </strong>{new Date(settings.maintenanceStart).toLocaleString()}</span>
            <span><strong>End (Est): </strong>{new Date(settings.maintenanceEnd).toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Top Header App Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-black dark:text-white">Settings</h1>
            <span className="bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 text-[9px] font-bold px-1.5 py-0.2 rounded border border-zinc-205 dark:border-zinc-750">
              v1.4.2
            </span>
          </div>
          <p className="text-xs text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">
            Manage platform-wide configurations, localization, taxation, security, delivery, invoices and maintenance mode.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
          <div className="relative w-40 sm:w-48 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100" size={13} />
            <input 
              type="text" 
              placeholder="Search setting..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-[11px] font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <button 
            onClick={refetch} 
            title="Refresh settings"
            className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm shrink-0"
          >
            <RefreshCw size={13} />
          </button>
          <button 
            onClick={handleToggleMaintenanceMode}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold transition-all border shadow-sm shrink-0 whitespace-nowrap ${
              settings.maintenanceMode 
                ? 'bg-red-500/10 border-red-500/20 text-red-600 hover:bg-red-500/20' 
                : 'bg-amber-500/10 border-amber-500/20 text-amber-600 hover:bg-amber-500/20'
            }`}
          >
            {settings.maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
          <button 
            onClick={handleExportConfig}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[10px] font-bold shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <Download size={11} />
            <span className="hidden sm:inline">Export JSON</span>
          </button>
          <button 
            onClick={handleSaveAllChanges}
            disabled={isSavingAll}
            className="px-3.5 py-1.5 bg-[var(--primary)] text-white hover:opacity-90 rounded-lg text-[10px] font-extrabold shadow-md flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <Save size={11} />
            <span>{isSavingAll ? 'Saving...' : 'Save All Changes'}</span>
          </button>
        </div>
      </header>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm relative group hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Platform Status</span>
          <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block flex items-center gap-1">
            {settings.maintenanceMode ? 'Maintenance' : 'Active'}
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
          </span>
          <span className="text-[8px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/10 px-1 py-0.2 rounded font-extrabold absolute right-2.5 top-2.5">
            Live
          </span>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Maintenance Mode</span>
          <span className={`text-xs font-black mt-0.5 block ${settings.maintenanceMode ? 'text-red-500' : 'text-black dark:text-zinc-100'}`}>
            {settings.maintenanceMode ? 'Enabled' : 'Disabled'}
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Default Currency</span>
          <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block font-mono">
            {settings.currencySymbol} {settings.currency}
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Tax Index</span>
          <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block">
            {settings.gstPercent + settings.serviceTaxPercent}% GST
          </span>
        </div>

        {/* KPI 5 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Timezone</span>
          <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block truncate">
            {settings.timezone}
          </span>
        </div>

        {/* KPI 6 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Min Order Value</span>
          <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block font-mono">
            ₹{settings.minimumOrderAmount}
          </span>
        </div>

        {/* KPI 7 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Max Delivery Radius</span>
          <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block">
            {settings.maxDeliveryRadius} KM
          </span>
        </div>

        {/* KPI 8 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Invoice Prefix</span>
          <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block font-mono">
            {settings.invoicePrefix}
          </span>
        </div>
      </section>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (Forms & Tabs) */}
        <main className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Settings Tabs Navigator */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl flex gap-1 overflow-x-auto shrink-0 scrollbar-none shadow-sm">
            {[
              { id: 'company', label: 'Company Info', icon: Briefcase },
              { id: 'localization', label: 'Localization', icon: Globe },
              { id: 'orders', label: 'Order Settings', icon: Clock },
              { id: 'taxation', label: 'Tax Settings', icon: Percent },
              { id: 'invoices', label: 'Invoice Settings', icon: FileText },
              { id: 'security', label: 'Security Settings', icon: Shield }
            ].map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-extrabold whitespace-nowrap transition-all ${
                    activeTab === tab.id 
                      ? 'bg-[var(--primary)] text-white shadow-sm' 
                      : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon size={12} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* SKELETON LOADER */}
          {isLoading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 animate-pulse"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-8 bg-zinc-150 dark:bg-zinc-850 rounded animate-pulse"></div>
                <div className="h-8 bg-zinc-150 dark:bg-zinc-850 rounded animate-pulse"></div>
                <div className="h-8 bg-zinc-150 dark:bg-zinc-850 rounded animate-pulse"></div>
                <div className="h-8 bg-zinc-150 dark:bg-zinc-850 rounded animate-pulse"></div>
              </div>
              <div className="h-8 bg-zinc-200 dark:bg-zinc-850 rounded w-24 animate-pulse"></div>
            </div>
          ) : isEmpty ? (
            /* EMPTY STATE */
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3 shadow-sm">
              <Database size={48} className="text-black dark:text-zinc-100 stroke-[1.2]" />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">No configurations found</h3>
                <p className="text-xs text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">The platform settings collection is empty or unreachable.</p>
              </div>
              <button 
                onClick={() => {
                  setSettings({ ...originalSettings });
                  setIsEmpty(false);
                  addToast('Default settings restored successfully.', 'success');
                }}
                className="px-4 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-bold text-xs rounded-lg shadow-sm"
              >
                Create Default Settings
              </button>
            </div>
          ) : (
            /* ACTIVE TAB CONTENT */
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-all duration-300">
              
              {/* Tab: Company Info */}
              {activeTab === 'company' && matchesSearch('Company Information') && (
                <div className="p-4 space-y-4">
                  <header className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <div>
                      <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Company Information</h2>
                      <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Manage global business identifiers and channels</p>
                    </div>
                    <button 
                      onClick={() => setIsCompanyModalOpen(true)}
                      className="px-2.5 py-1 text-[10px] font-bold text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded border border-[var(--primary)]/20 transition-all"
                    >
                      Update Branding
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">Company Name</span>
                      <p className="text-xs font-black text-zinc-900 dark:text-zinc-50">{settings.companyName}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">Website URL</span>
                      <a href={settings.website} target="_blank" rel="noreferrer" className="text-xs font-bold text-[var(--primary)] hover:underline flex items-center gap-1">
                        {settings.website}
                        <ExternalLink size={10} />
                      </a>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">Support Email</span>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{settings.supportEmail}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">Support Phone</span>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-50">{settings.supportPhone}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">Logo Preview</span>
                      <div className="w-16 h-16 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-center overflow-hidden">
                        <img src={settings.logo} alt="Brand Logo" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">Favicon Preview</span>
                      <div className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-850 flex items-center justify-center overflow-hidden">
                        <img src={settings.favicon} alt="Favicon" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">GST Number</span>
                      <input 
                        type="text"
                        value="22AAAAA0000A1Z5"
                        disabled
                        className="w-full h-8 px-3 border border-zinc-200 dark:border-zinc-800 rounded bg-zinc-50 dark:bg-zinc-900 text-xs text-black dark:text-zinc-100 cursor-not-allowed outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">Store Location / Address</span>
                      <p className="text-xs text-zinc-900 dark:text-zinc-50">Bholaram Ustad Marg, Indore, Madhya Pradesh - 452001</p>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between items-center text-[10px] text-black dark:text-zinc-100 border-t border-zinc-150 dark:border-zinc-800">
                    <span>Last updated by: <strong>{settings.updatedBy}</strong></span>
                    <span>Sync: {new Date(settings.updatedAt).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Tab: Localization */}
              {activeTab === 'localization' && (
                <div className="p-4 space-y-4">
                  <header className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Localization</h2>
                    <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Configure local business environments, currency symbols, and default language sets</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Currency</label>
                      <select 
                        value={settings.currency}
                        onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                      >
                        <option value="INR">INR - Indian Rupee</option>
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Currency Symbol</label>
                      <input 
                        type="text"
                        value={settings.currencySymbol}
                        onChange={(e) => setSettings({ ...settings, currencySymbol: e.target.value })}
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Language</label>
                      <select 
                        value={settings.language}
                        onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                      >
                        <option value="English (IN)">English (IN)</option>
                        <option value="Hindi">Hindi (India)</option>
                        <option value="English (US)">English (US)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Timezone</label>
                      <select 
                        value={settings.timezone}
                        onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                      >
                        <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                        <option value="UTC">UTC (Universal Coordinated Time)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Date Format</label>
                      <select 
                        defaultValue="DD/MM/YYYY"
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                      >
                        <option value="DD/MM/YYYY">DD/MM/YYYY (e.g. 19/06/2026)</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD (e.g. 2026-06-19)</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Number Format</label>
                      <select 
                        defaultValue="IN"
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                      >
                        <option value="IN">Indian format (e.g. 1,00,000)</option>
                        <option value="US">US format (e.g. 100,000)</option>
                      </select>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                    <button 
                      onClick={handleResetSettings}
                      className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => handleSaveTabChanges('Localization')}
                      className="px-3 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-lg hover:opacity-90"
                    >
                      Save Localization
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Order Settings */}
              {activeTab === 'orders' && (
                <div className="p-4 space-y-4">
                  <header className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Order & Delivery Configurations</h2>
                    <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Control minimum order amounts, delivery rules, buffer intervals, and cancellation rules</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Minimum Order Amount (₹)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={settings.minimumOrderAmount}
                          onChange={(e) => setSettings({ ...settings, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-7 pr-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 left-3 flex items-center text-black dark:text-zinc-100 font-extrabold text-[11px]">₹</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Maximum Delivery Radius (KM)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={settings.maxDeliveryRadius}
                          onChange={(e) => setSettings({ ...settings, maxDeliveryRadius: parseFloat(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-3 pr-8 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-[10px] font-bold">KM</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Order Cancellation Window (Minutes)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={settings.orderCancellationTime}
                          onChange={(e) => setSettings({ ...settings, orderCancellationTime: parseInt(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-[10px] font-semibold">mins</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Refund Request Window (Hours)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={settings.refundWindowHours}
                          onChange={(e) => setSettings({ ...settings, refundWindowHours: parseInt(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-[10px] font-semibold">hours</div>
                      </div>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Average Delivery Buffer Time (Minutes)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          defaultValue={10}
                          className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-[10px] font-semibold">mins</div>
                      </div>
                    </div>
                    
                    {/* Order Methods section */}
                    <div className="md:col-span-2 border-t border-zinc-200 dark:border-zinc-800 pt-4 mt-2">
                      <h3 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider mb-2">Order Methods & Dynamic Channels</h3>
                      <p className="text-[10px] text-zinc-500 mb-4">Toggle order options and customize user app buttons dynamically.</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {orderMethods.map((method, idx) => (
                          <div key={method.id} className="p-3 bg-zinc-50 dark:bg-zinc-850 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">{method.id} channel</span>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                  type="checkbox" 
                                  checked={method.enabled} 
                                  onChange={(e) => {
                                    const updated = [...orderMethods];
                                    updated[idx].enabled = e.target.checked;
                                    setOrderMethods(updated);
                                  }}
                                  className="sr-only peer" 
                                />
                                <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--primary)]"></div>
                              </label>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Custom Label</label>
                              <input 
                                type="text"
                                value={method.label}
                                onChange={(e) => {
                                  const updated = [...orderMethods];
                                  updated[idx].label = e.target.value;
                                  setOrderMethods(updated);
                                }}
                                className="w-full h-8 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider block">Material Symbol Icon Name</label>
                              <input 
                                type="text"
                                value={method.icon}
                                onChange={(e) => {
                                  const updated = [...orderMethods];
                                  updated[idx].icon = e.target.value;
                                  setOrderMethods(updated);
                                }}
                                className="w-full h-8 px-2.5 border border-zinc-300 dark:border-zinc-700 rounded bg-white dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                    <button 
                      onClick={handleResetSettings}
                      className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => handleSaveTabChanges('Orders')}
                      className="px-3 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-lg hover:opacity-90"
                    >
                      Save Order Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Tax Settings */}
              {activeTab === 'taxation' && (
                <div className="p-4 space-y-4">
                  <header className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <div>
                      <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Tax & Calculations</h2>
                      <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">GST rates, service fee structure, packaging charges, and tax policies</p>
                    </div>
                    <button 
                      onClick={() => setIsTaxModalOpen(true)}
                      className="px-2.5 py-1 text-[10px] font-bold text-[var(--primary)] hover:bg-[var(--primary)]/5 rounded border border-[var(--primary)]/20 transition-all"
                    >
                      Quick Tax Adjust
                    </button>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">GST Rate (%)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          step="0.1"
                          value={settings.gstPercent}
                          onChange={(e) => setSettings({ ...settings, gstPercent: parseFloat(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-3 pr-8 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-xs">%</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Service Charge (%)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          step="0.1"
                          value={settings.serviceTaxPercent}
                          onChange={(e) => setSettings({ ...settings, serviceTaxPercent: parseFloat(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-3 pr-8 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-xs">%</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Packaging Charge (₹)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={settings.packagingCharge}
                          onChange={(e) => setSettings({ ...settings, packagingCharge: parseFloat(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-7 pr-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 left-3 flex items-center text-black dark:text-zinc-100 text-[11px] font-extrabold">₹</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg self-end">
                      <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Include Tax in Product Prices</p>
                        <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Toggle taxes calculation layout</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.taxIncluded}
                          onChange={(e) => setSettings({ ...settings, taxIncluded: e.target.checked })}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                    <button 
                      onClick={handleResetSettings}
                      className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={() => handleSaveTabChanges('Tax')}
                      className="px-3 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-lg hover:opacity-90"
                    >
                      Update Tax Settings
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: Invoice Settings */}
              {activeTab === 'invoices' && (
                <div className="p-4 space-y-4">
                  <header className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Invoice Configurations</h2>
                    <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Configure PDF receipt templates, serial prefixes, and billing signatures</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Invoice Prefix</label>
                      <input 
                        type="text"
                        value={settings.invoicePrefix}
                        onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                        placeholder="e.g. PVP-IND-"
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150 font-mono font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Invoice Number Format</label>
                      <select 
                        defaultValue="YEAR-SEQ"
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                      >
                        <option value="YEAR-SEQ">Prefix + Year + Sequence (e.g. PVP-IND-2026-0001)</option>
                        <option value="SIMPLE-SEQ">Prefix + Sequence (e.g. PVP-IND-00001)</option>
                      </select>
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Invoice Footer Message</label>
                      <input 
                        type="text"
                        value={settings.invoiceFooter}
                        onChange={(e) => setSettings({ ...settings, invoiceFooter: e.target.value })}
                        placeholder="Thank you for your purchase!"
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                      />
                    </div>

                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Invoice Terms &amp; Conditions</label>
                      <textarea 
                        rows="3"
                        defaultValue="1. Taxes calculated according to state norms. 2. For refund disputes, reach out to customer support with transaction hash details within 24 hours."
                        className="w-full p-2.5 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150 resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <button 
                      type="button"
                      onClick={() => addToast("Generating preview layout structure...", "info")}
                      className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                    >
                      <Laptop size={12} />
                      <span>Preview Invoice PDF</span>
                    </button>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleResetSettings}
                        className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      >
                        Reset
                      </button>
                      <button 
                        onClick={() => handleSaveTabChanges('Invoice')}
                        className="px-3 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-lg hover:opacity-90"
                      >
                        Save Invoice Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab: Security Settings */}
              {activeTab === 'security' && (
                <div className="p-4 space-y-4">
                  <header className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Security & Session Policies</h2>
                    <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Manage session timeout windows, OTP validation duration, password cycles, and 2FA settings</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Password Expiry Cycle (Days)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={settings.passwordExpiryDays}
                          onChange={(e) => setSettings({ ...settings, passwordExpiryDays: parseInt(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-[10px] font-semibold">days</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Session Timeout Threshold (Minutes)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={settings.sessionTimeoutMinutes}
                          onChange={(e) => setSettings({ ...settings, sessionTimeoutMinutes: parseInt(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-[10px] font-semibold">mins</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">OTP Validation Lifetime (Seconds)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={settings.otpExpirySeconds}
                          onChange={(e) => setSettings({ ...settings, otpExpirySeconds: parseInt(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-[10px] font-semibold">secs</div>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Maximum Login Attempts Limit</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={settings.loginAttemptsLimit}
                          onChange={(e) => setSettings({ ...settings, loginAttemptsLimit: parseInt(e.target.value) || 0 })}
                          className="w-full h-8.5 pl-3 pr-10 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                        />
                        <div className="absolute inset-y-0 right-3 flex items-center text-black dark:text-zinc-100 text-[10px] font-semibold">tries</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 rounded-lg md:col-span-2">
                      <div>
                        <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Require Two-Factor Authentication (2FA) for Admins</p>
                        <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Mandates verification codes for admin logins</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={settings.require2FA}
                          onChange={(e) => setSettings({ ...settings, require2FA: e.target.checked })}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                    <button 
                      onClick={handleResetSettings}
                      className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      Reset
                    </button>
                    <button 
                      onClick={async () => {
                        await updateSecurityHook.mutateAsync(settings);
                        setOriginalSettings({ ...settings });
                        addToast('Security configurations updated successfully!', 'success');
                      }}
                      className="px-3 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-lg hover:opacity-90"
                    >
                      Save Security Settings
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>

        {/* Right Column (Activity Timeline & Sync Sidebar) */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Sync Status Box */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3">
            <h3 className="text-[10px] font-black uppercase text-black dark:text-zinc-100 tracking-wider">Sync & Operations</h3>
            
            <div className="space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-black dark:text-zinc-100 font-semibold">API Health Status</span>
                <span className="flex items-center gap-1 text-emerald-600 font-extrabold text-[10px]">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
                  Active (99.8%)
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-black dark:text-zinc-100 font-semibold">Last DB Backup</span>
                <span className="text-zinc-800 dark:text-zinc-250 font-bold font-mono text-[10px]">4h ago</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-black dark:text-zinc-100 font-semibold">MongoDB Clusters</span>
                <span className="text-zinc-850 dark:text-zinc-250 font-bold text-[10px]">ReplicaSet (Primary)</span>
              </div>
            </div>
            
            <hr className="border-zinc-200 dark:border-zinc-800" />
            
            <div className="flex flex-col gap-1.5 text-[9px] text-black dark:text-zinc-100 leading-normal">
              <span><strong>Updated By:</strong> {settings.updatedBy}</span>
              <span><strong>Last Saved:</strong> {new Date(settings.updatedAt).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Activity Logs Timeline */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col justify-between min-h-[300px]">
            <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase text-black dark:text-zinc-100 tracking-wider">Configuration History</h3>
              <Clock size={12} className="text-black dark:text-zinc-100" />
            </div>

            <div className="p-3.5 space-y-4 flex-1 overflow-y-auto max-h-[350px] scrollbar-thin">
              {recentChanges.map((log, idx) => (
                <div key={idx} className="flex gap-2.5 relative group">
                  {idx !== recentChanges.length - 1 && (
                    <div className="absolute left-[3px] top-3 bottom-0 w-[1px] bg-zinc-200 dark:bg-zinc-800 group-hover:bg-[var(--primary)]/30 transition-colors" />
                  )}
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                    log.type === 'TAX' ? 'bg-amber-500' :
                    log.type === 'MAINTENANCE' ? 'bg-red-500' :
                    log.type === 'ORDER' ? 'bg-[var(--primary)]' :
                    'bg-blue-500'
                  }`} />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-150 leading-tight">{log.desc}</p>
                    <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 font-semibold">{log.user} • {log.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-800 text-center">
              <button 
                onClick={() => addToast('Opening system audit logs screen...', 'info')}
                className="text-[var(--primary)] hover:underline text-[10px] font-black tracking-wider uppercase flex items-center justify-center gap-1 mx-auto"
              >
                <span>Full Audit Timeline</span>
                <ArrowRight size={10} />
              </button>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
