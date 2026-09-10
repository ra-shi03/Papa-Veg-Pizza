import React, { useState, useEffect } from 'react';
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
  Laptop,
  Layers,
  Smartphone,
  MessageSquare,
  Sparkles,
  RefreshCcw,
  Gift,
  ShoppingCart,
  ShoppingBag,
  Eye,
  Star,
  Activity,
  Heart,
  Grid,
  Check,
  X
} from 'lucide-react';
import UpdateFeatureModal from './UpdateFeatureModal';
import ForceUpdateModal from './ForceUpdateModal';

// Mock Toast Hook for notification banners
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

export default function AppConfiguration() {
  const { toasts, addToast } = useToast();

  // Modals state
  const [isUpdateFeatureOpen, setIsUpdateFeatureOpen] = useState(false);
  const [isForceUpdateOpen, setIsForceUpdateOpen] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Loading, saving, empty states
  const [isLoading, setIsLoading] = useState(false);
  const [isEmpty, setIsEmpty] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState('customer-features');

  // Main config state representing 'app_configurations' collection
  const [config, setConfig] = useState({
    _id: 'APP-CONFIG-60824',
    customerAppVersion: '2.4.2',
    androidVersion: '2.4.1',
    iosVersion: '2.4.0',
    forceUpdate: false,
    walletEnabled: true,
    loyaltyEnabled: true,
    couponEnabled: true,
    referralEnabled: true,
    liveTrackingEnabled: true,
    chatEnabled: true,
    guestCheckoutEnabled: true,
    multiStoreEnabled: true,
    maintenanceBanner: false,
    reviewsEnabled: true,
    wishlistEnabled: true,
    scheduledOrdersEnabled: true,
    codEnabled: true,
    pickupEnabled: true,
    aiRecommendationsEnabled: true,
    darkModeEnabled: false,
    analyticsEnabled: true,
    pushNotificationsEnabled: true,
    inventorySyncEnabled: true,
    updatedBy: 'Rohan Sharma (Super Admin)',
    updatedAt: '2026-06-19T17:01:00Z'
  });

  // Track unsaved edits
  const [originalConfig, setOriginalConfig] = useState({ ...config });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Debouncing search bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const changed = JSON.stringify(config) !== JSON.stringify(originalConfig);
    setHasUnsavedChanges(changed);
  }, [config, originalConfig]);

  // API mock hooks
  const useConfigurations = () => ({
    data: config,
    loading: isLoading,
    refetch: () => {
      setIsLoading(true);
      addToast('Syncing latest configurations from cluster...', 'info');
      setTimeout(() => {
        setIsLoading(false);
        addToast('Configuration fully updated!', 'success');
      }, 1000);
    }
  });

  const useUpdateConfigurations = () => ({
    mutateAsync: async (newValues) => {
      setIsSavingAll(true);
      return new Promise((resolve) => {
        setTimeout(() => {
          setConfig(prev => ({
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

  const useUpdateFeature = () => ({
    mutateAsync: async (updatedFeat) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setConfig(prev => ({
            ...prev,
            [updatedFeat.key]: updatedFeat.enabled,
            updatedBy: 'Rohan Sharma (Super Admin)',
            updatedAt: new Date().toISOString()
          }));
          resolve(true);
        }, 800);
      });
    }
  });

  const useForceUpdate = () => ({
    mutateAsync: async (updateDetails) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          setConfig(prev => ({
            ...prev,
            customerAppVersion: updateDetails.customerAppVersion,
            androidVersion: updateDetails.androidVersion,
            iosVersion: updateDetails.iosVersion,
            forceUpdate: updateDetails.forceUpdate,
            updatedBy: 'Rohan Sharma (Super Admin)',
            updatedAt: new Date().toISOString()
          }));
          resolve(true);
        }, 1200);
      });
    }
  });

  const { refetch } = useConfigurations();
  const updateConfigHook = useUpdateConfigurations();
  const updateFeatureHook = useUpdateFeature();
  const forceUpdateHook = useForceUpdate();

  // Handlers
  const handleSaveTabChanges = async (tabName) => {
    try {
      await updateConfigHook.mutateAsync(config);
      setOriginalConfig({ ...config });
      addToast(`Saved ${tabName} configurations to database.`, 'success');
    } catch (e) {
      addToast('Failed to save settings.', 'error');
    }
  };

  const handleResetSettings = () => {
    setConfig({ ...originalConfig });
    addToast('Reset configurations to last saved state.', 'warning');
  };

  const handleSaveAllChanges = async () => {
    try {
      await updateConfigHook.mutateAsync(config);
      setOriginalConfig({ ...config });
      addToast('All system configurations updated successfully!', 'success');
    } catch (e) {
      addToast('Failed to update configurations.', 'error');
    }
  };

  const handleExportConfig = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(config, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `app_configurations_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    addToast('Configuration template exported successfully.', 'success');
  };

  const handleOpenEditModal = (name, key, description, enabled) => {
    setSelectedFeature({ name, key, description, enabled });
    setIsUpdateFeatureOpen(true);
  };

  const handleSaveFeatureConfirm = async (updatedData) => {
    try {
      await updateFeatureHook.mutateAsync(updatedData);
      addToast(`Feature flag "${updatedData.name}" updated successfully!`, 'success');
    } catch (e) {
      addToast('Failed to update feature flag.', 'error');
    }
  };

  const handleForceUpdateConfirm = async (updateDetails) => {
    try {
      await forceUpdateHook.mutateAsync(updateDetails);
      addToast('New application builds published successfully!', 'success');
      addToast(`Current App version pushed: v${updateDetails.customerAppVersion}`, 'warning');
    } catch (e) {
      addToast('Failed to publish force update rules.', 'error');
    }
  };

  // Define Feature items structured logically for Tabs
  const customerFeaturesList = [
    { name: 'Wallet Enabled', key: 'walletEnabled', desc: 'Allows customers to deposit and transact using digital credits.', icon: DollarSign, badge: 'Digital Payments' },
    { name: 'Referral Program', key: 'referralEnabled', desc: 'Toggles customer-to-customer sharing bonus rewards.', icon: Gift, badge: 'Marketing Campaign' },
    { name: 'Coupon System', key: 'couponEnabled', desc: 'Enables checkout promotional codes and vouchers.', icon: Percent, badge: 'Checkout Options' },
    { name: 'Loyalty Points', key: 'loyaltyEnabled', desc: 'Grants points per pizza order redeemable at checkout.', icon: Sparkles, badge: 'User Retention' },
    { name: 'Guest Checkout', key: 'guestCheckoutEnabled', desc: 'Allows quick ordering without creating a profile.', icon: ShoppingCart, badge: 'Speed Checkout' },
    { name: 'Customer Reviews', key: 'reviewsEnabled', desc: 'Allows writing feedback and reviews on pizzas.', icon: Star, badge: 'Social Proof' },
    { name: 'Wishlist / Favorites', key: 'wishlistEnabled', desc: 'Enables quick-saves for favorite items.', icon: Heart, badge: 'Convenience' }
  ];

  const orderFeaturesList = [
    { name: 'Live Rider Tracking', key: 'liveTrackingEnabled', desc: 'Shows map marker transits for active couriers.', icon: MapPin, status: config.liveTrackingEnabled },
    { name: 'Customer Chat System', key: 'chatEnabled', desc: 'Direct chat channel between store support, rider, and customer.', icon: MessageSquare, status: config.chatEnabled },
    { name: 'Scheduled Orders', key: 'scheduledOrdersEnabled', desc: 'Allows checkout booking for dates and hours ahead.', icon: Clock, status: config.scheduledOrdersEnabled },
    { name: 'Cash On Delivery (COD)', key: 'codEnabled', desc: 'Accept cash upon pizza delivery.', icon: Briefcase, status: config.codEnabled },
    { name: 'Pickup Orders Support', key: 'pickupEnabled', desc: 'Allows customer to pick up order from pizza counters.', icon: ShoppingBag, status: config.pickupEnabled }
  ];

  const platformFeaturesList = [
    { name: 'Maintenance Alert Banner', key: 'maintenanceBanner', desc: 'Display global header alert warning for upcoming patches.', icon: AlertTriangle, status: config.maintenanceBanner },
    { name: 'Multi Store Operations', key: 'multiStoreEnabled', desc: 'Toggle multi-franchise operations and auto region-routing.', icon: Grid, status: config.multiStoreEnabled },
    { name: 'AI Recommendation Feeds', key: 'aiRecommendationsEnabled', desc: 'Display suggestions based on ordering patterns.', icon: Sparkles, status: config.aiRecommendationsEnabled },
    { name: 'Dark Mode Support', key: 'darkModeEnabled', desc: 'Enable native theme mode toggle on customer frontend.', icon: Eye, status: config.darkModeEnabled },
    { name: 'Analytics Tracker', key: 'analyticsEnabled', desc: 'Sync usage data indexes to cloud trackers.', icon: Activity, status: config.analyticsEnabled },
    { name: 'Push Notifications Center', key: 'pushNotificationsEnabled', desc: 'Toggle FCM alerts for campaigns and order states.', icon: Bell, status: config.pushNotificationsEnabled },
    { name: 'Inventory Synchronization', key: 'inventorySyncEnabled', desc: 'Real-time stock depletion flags linked to POS terminals.', icon: Database, status: config.inventorySyncEnabled }
  ];

  // Filtering lists by search query
  const filterList = (list) => {
    return list.filter(item => 
      item.name.toLowerCase().includes(debouncedSearch.toLowerCase()) || 
      item.desc.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
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
      <UpdateFeatureModal 
        isOpen={isUpdateFeatureOpen} 
        onClose={() => setIsUpdateFeatureOpen(false)}
        feature={selectedFeature}
        onSave={handleSaveFeatureConfirm}
      />
      
      <ForceUpdateModal 
        isOpen={isForceUpdateOpen} 
        onClose={() => setIsForceUpdateOpen(false)}
        currentVersions={config}
        onSave={handleForceUpdateConfirm}
      />

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 p-3 rounded-lg flex items-center justify-between text-xs font-semibold animate-in slide-in-from-top-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-amber-500 animate-pulse" size={16} />
            <span>Unsaved app configuration changes. Make sure to commit them.</span>
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

      {/* Top Header App Bar */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-200 dark:border-zinc-800 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-extrabold text-black dark:text-white">App Configuration</h1>
            <span className="bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 text-[9px] font-bold px-1.5 py-0.2 rounded border border-zinc-205 dark:border-zinc-750">
              v{config.customerAppVersion}
            </span>
          </div>
          <p className="text-xs text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">
            Manage application behavior, feature flags, app versions, and platform modules from a centralized configuration dashboard.
          </p>
        </div>

        {/* Global Action Toolbar */}
        <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto pb-1 md:pb-0 scrollbar-none shrink-0">
          <div className="relative w-40 sm:w-48 shrink-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100" size={13} />
            <input 
              type="text" 
              placeholder="Search features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-2 py-1 text-[11px] font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
            />
          </div>
          <button 
            onClick={refetch} 
            title="Refresh configurations"
            className="p-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-sm shrink-0"
          >
            <RefreshCcw size={13} />
          </button>
          <button 
            onClick={() => setIsForceUpdateOpen(true)}
            className="px-3 py-1.5 rounded-lg text-[10px] font-extrabold bg-red-650 text-white hover:bg-red-700 transition-all shadow-sm shrink-0 whitespace-nowrap"
          >
            Force App Update
          </button>
          <button 
            onClick={handleExportConfig}
            className="px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-[10px] font-bold shadow-sm flex items-center gap-1 shrink-0 whitespace-nowrap"
          >
            <Download size={11} />
            <span className="hidden sm:inline">Export Config</span>
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
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Current Version</span>
          <span className="text-xs font-black text-zinc-900 dark:text-zinc-50 mt-0.5 block flex items-center gap-1">
            v{config.customerAppVersion}
            <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-600 text-[8px] font-bold border border-emerald-500/20">Live</span>
          </span>
        </div>

        {/* KPI 2 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Force Update</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
            config.forceUpdate 
              ? 'bg-red-500/10 text-red-600 border border-red-500/20' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
          }`}>
            {config.forceUpdate ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Live Tracking</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
            config.liveTrackingEnabled 
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
          }`}>
            {config.liveTrackingEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Wallet Status</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
            config.walletEnabled 
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
          }`}>
            {config.walletEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* KPI 5 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Referrals</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
            config.referralEnabled 
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
          }`}>
            {config.referralEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* KPI 6 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Coupon System</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
            config.couponEnabled 
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
          }`}>
            {config.couponEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* KPI 7 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Chat System</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
            config.chatEnabled 
              ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
          }`}>
            {config.chatEnabled ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* KPI 8 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all">
          <span className="text-[8px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Maint. Banner</span>
          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full inline-block mt-1 ${
            config.maintenanceBanner 
              ? 'bg-red-500/10 text-red-600 border border-red-500/20' 
              : 'bg-zinc-100 dark:bg-zinc-800 text-black dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700'
          }`}>
            {config.maintenanceBanner ? 'Visible' : 'Hidden'}
          </span>
        </div>
      </section>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Workspace Panel */}
        <main className="lg:col-span-9 flex flex-col gap-4">
          
          {/* Tabs Navigation */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 rounded-xl flex gap-1 overflow-x-auto shrink-0 scrollbar-none shadow-sm">
            {[
              { id: 'customer-features', label: 'Customer Features', icon: User },
              { id: 'order-features', label: 'Order Features', icon: Clock },
              { id: 'platform-features', label: 'Platform Features', icon: Layers },
              { id: 'app-versions', label: 'App Versions', icon: Smartphone },
              { id: 'system-info', label: 'System Information', icon: Info }
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

          {/* SKELETON LOADING OR TAB PANES */}
          {isLoading ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-6 space-y-4">
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3 animate-pulse"></div>
              <div className="space-y-3">
                {[1, 2, 3].map(n => (
                  <div key={n} className="h-10 bg-zinc-100 dark:bg-zinc-850 rounded animate-pulse" />
                ))}
              </div>
            </div>
          ) : isEmpty ? (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-8 text-center flex flex-col items-center justify-center gap-3">
              <Database size={48} className="text-black dark:text-zinc-100" />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900">No App Configuration Found</h3>
                <p className="text-xs text-black dark:text-zinc-100 mt-0.5">Initialize a new configuration block for the Papa Veg Pizza app.</p>
              </div>
              <button 
                onClick={() => {
                  setConfig({ ...originalConfig });
                  setIsEmpty(false);
                  addToast('Configuration reset to defaults.', 'success');
                }}
                className="px-4.5 py-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-lg text-xs font-bold shadow-sm"
              >
                Create Configuration
              </button>
            </div>
          ) : (
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden transition-all duration-300 p-4">
              
              {/* Tab 1: Customer Features */}
              {activeTab === 'customer-features' && (
                <div className="space-y-4">
                  <header className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <div>
                      <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Customer Experience Features</h2>
                      <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Toggle primary interactive client widgets on the storefront</p>
                    </div>
                  </header>

                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {filterList(customerFeaturesList).map(feat => {
                      const Icon = feat.icon;
                      const isEnabled = config[feat.key];
                      return (
                        <div key={feat.key} className="py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-850/20 px-1.5 transition-colors rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-[var(--primary)] shrink-0">
                              <Icon size={16} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{feat.name}</h4>
                                <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[8px] font-bold text-black dark:text-zinc-100">{feat.badge}</span>
                              </div>
                              <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">{feat.desc}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                              isEnabled 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-black dark:text-zinc-100'
                            }`}>
                              {isEnabled ? 'Enabled' : 'Disabled'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isEnabled}
                                onChange={(e) => setConfig(prev => ({ ...prev, [feat.key]: e.target.checked }))}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                            <button 
                              onClick={() => handleOpenEditModal(feat.name, feat.key, feat.desc, isEnabled)}
                              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-black dark:text-zinc-100 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                              <Sliders size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                    {filterList(customerFeaturesList).length === 0 && (
                      <div className="text-center py-6 text-xs text-black dark:text-zinc-100 font-semibold">No features match search.</div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                    <button onClick={handleResetSettings} className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800">Reset</button>
                    <button onClick={() => handleSaveTabChanges('Customer Features')} className="px-3.5 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-lg hover:opacity-90">Save Features</button>
                  </div>
                </div>
              )}

              {/* Tab 2: Order Features */}
              {activeTab === 'order-features' && (
                <div className="space-y-4">
                  <header className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Order Management Modules</h2>
                    <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Control configurations related to tracking, chat support, scheduling and payments</p>
                  </header>

                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {filterList(orderFeaturesList).map(feat => {
                      const Icon = feat.icon;
                      const isEnabled = config[feat.key];
                      return (
                        <div key={feat.key} className="py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-850/20 px-1.5 transition-colors rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-[var(--primary)] shrink-0">
                              <Icon size={16} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{feat.name}</h4>
                              <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">{feat.desc}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                              isEnabled 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-black dark:text-zinc-100'
                            }`}>
                              {isEnabled ? 'Active' : 'Inactive'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isEnabled}
                                onChange={(e) => setConfig(prev => ({ ...prev, [feat.key]: e.target.checked }))}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                            <button 
                              onClick={() => handleOpenEditModal(feat.name, feat.key, feat.desc, isEnabled)}
                              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-black dark:text-zinc-100 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                              <Sliders size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                    <button onClick={handleResetSettings} className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800">Reset</button>
                    <button onClick={() => handleSaveTabChanges('Order Features')} className="px-3.5 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-lg hover:opacity-90">Save Changes</button>
                  </div>
                </div>
              )}

              {/* Tab 3: Platform Features */}
              {activeTab === 'platform-features' && (
                <div className="space-y-4">
                  <header className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Platform & System Features</h2>
                    <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Toggle and configure core database, layout settings, AI recomendations, and push modules</p>
                  </header>

                  <div className="divide-y divide-zinc-200 dark:divide-zinc-800/60">
                    {filterList(platformFeaturesList).map(feat => {
                      const Icon = feat.icon;
                      const isEnabled = config[feat.key];
                      return (
                        <div key={feat.key} className="py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-850/20 px-1.5 transition-colors rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center border border-zinc-200 dark:border-zinc-700 text-[var(--primary)] shrink-0">
                              <Icon size={16} />
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{feat.name}</h4>
                              <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">{feat.desc}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                              isEnabled 
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' 
                                : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-black dark:text-zinc-100'
                            }`}>
                              {isEnabled ? 'Active' : 'Inactive'}
                            </span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isEnabled}
                                onChange={(e) => setConfig(prev => ({ ...prev, [feat.key]: e.target.checked }))}
                                className="sr-only peer" 
                              />
                              <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                            </label>
                            <button 
                              onClick={() => handleOpenEditModal(feat.name, feat.key, feat.desc, isEnabled)}
                              className="p-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-black dark:text-zinc-100 hover:text-zinc-800 dark:hover:text-zinc-200"
                            >
                              <Sliders size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                    <button onClick={handleResetSettings} className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800">Reset</button>
                    <button onClick={() => handleSaveTabChanges('Platform Features')} className="px-3.5 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-lg hover:opacity-90">Save Changes</button>
                  </div>
                </div>
              )}

              {/* Tab 4: App Versions */}
              {activeTab === 'app-versions' && (
                <div className="space-y-4">
                  <header className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">Version Management</h2>
                    <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Control Android, iOS and API routing targets and push mandatory flags</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Customer App Version</label>
                      <input 
                        type="text"
                        value={config.customerAppVersion}
                        onChange={(e) => setConfig({ ...config, customerAppVersion: e.target.value })}
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150 font-bold"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">Android Minimum Build</label>
                      <input 
                        type="text"
                        value={config.androidVersion}
                        onChange={(e) => setConfig({ ...config, androidVersion: e.target.value })}
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 uppercase tracking-wider block">iOS Minimum Build</label>
                      <input 
                        type="text"
                        value={config.iosVersion}
                        onChange={(e) => setConfig({ ...config, iosVersion: e.target.value })}
                        className="w-full h-8.5 px-3 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-zinc-850 dark:text-zinc-150"
                      />
                    </div>

                    <div className="flex items-center justify-between p-3.5 bg-zinc-50 dark:bg-zinc-800/20 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                      <div>
                        <p className="text-xs font-bold text-zinc-850 dark:text-zinc-200">Force Update Required</p>
                        <p className="text-[9px] text-black dark:text-zinc-100 dark:text-black dark:text-zinc-100 mt-0.5">Toggle mandatory block screen for old versions</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={config.forceUpdate}
                          onChange={(e) => setConfig({ ...config, forceUpdate: e.target.checked })}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-zinc-300 dark:bg-zinc-700 rounded-full peer peer-checked:bg-[var(--primary)] transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                      </label>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
                    <button 
                      onClick={() => setIsForceUpdateOpen(true)}
                      className="px-3 py-1.5 border border-red-500/20 text-red-600 hover:bg-red-500/5 text-[10px] font-bold rounded-lg transition-all"
                    >
                      Publish Mandatory Patch
                    </button>
                    <div className="flex gap-2">
                      <button onClick={handleResetSettings} className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-750 dark:text-zinc-300 text-[10px] font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800">Reset</button>
                      <button 
                        onClick={() => handleSaveTabChanges('Version Specs')} 
                        className="px-3.5 py-1.5 bg-[var(--primary)] text-white text-[10px] font-bold rounded-lg hover:opacity-90"
                      >
                        Save Versions
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 5: System Info */}
              {activeTab === 'system-info' && (
                <div className="space-y-4">
                  <header className="pb-2 border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xs font-black uppercase text-black dark:text-zinc-100 tracking-wider">System Information</h2>
                    <p className="text-[10px] text-black dark:text-zinc-100 mt-0.5">Read-only platform identifiers, database indexes and health matrices</p>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block font-sans">Configuration ID</span>
                      <p className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{config._id}</p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">Environment</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-400 rounded text-[10px] font-extrabold uppercase border border-emerald-500/10">
                        Production (AP-South-1)
                      </span>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">API Connectivity Status</span>
                      <p className="font-bold text-emerald-600 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping shrink-0" />
                        Connected (99.9% uptime index)
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-black dark:text-zinc-100 uppercase tracking-wider block">MongoDB Database Sync</span>
                      <p className="font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                        <Database size={12} className="text-[var(--primary)]" />
                        Synchronized with primary replicaset
                      </p>
                    </div>
                  </div>

                  <hr className="border-zinc-200 dark:border-zinc-800" />
                  
                  <div className="space-y-2">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-black dark:text-zinc-100">Release Notes / Message</h4>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs leading-relaxed text-black dark:text-zinc-100 dark:text-zinc-350">
                      "We've added UPI payment routing fixes and optimized real-time map drawing buffers for couriers. App launches will check version compatibility on bootstrap."
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}
        </main>

        {/* Right Sticky Sidebar */}
        <aside className="lg:col-span-3 flex flex-col gap-4">
          
          {/* Operations Card */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm space-y-3">
            <h3 className="text-[10px] font-black uppercase text-black dark:text-zinc-100 tracking-wider">Sync & Config Matrix</h3>
            
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-black dark:text-zinc-100 font-semibold">Redis Cache State</span>
                <span className="text-emerald-600 font-extrabold text-[10px] flex items-center gap-0.5">
                  <Check size={12} />
                  Flushed & Hot
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-555 font-semibold">Version Control</span>
                <span className="text-zinc-850 dark:text-zinc-200 font-bold font-mono text-[10px]">v2.4.2</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-zinc-555 font-semibold">DB Engine</span>
                <span className="text-zinc-850 dark:text-zinc-200 font-bold text-[10px]">MongoDB Atlas v7.0</span>
              </div>
            </div>

            <hr className="border-zinc-200 dark:border-zinc-800" />
            
            <div className="flex flex-col gap-1 text-[9px] text-black dark:text-zinc-100 leading-normal">
              <span><strong>Modified By:</strong> {config.updatedBy}</span>
              <span><strong>Last Saved:</strong> {new Date(config.updatedAt).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Configuration Audit logs timeline */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col justify-between min-h-[300px]">
            <div className="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 flex justify-between items-center">
              <h3 className="text-[10px] font-black uppercase text-black dark:text-zinc-100 tracking-wider">Version History</h3>
              <Clock size={12} className="text-black dark:text-zinc-100 animate-pulse" />
            </div>

            <div className="p-3.5 space-y-4 flex-1 overflow-y-auto max-h-[350px] scrollbar-none">
              {[
                { version: 'v2.4.2', notes: 'Patch: UPI auto-routing updates', time: '10 mins ago', user: 'Rohan Sharma' },
                { version: 'v2.4.1', notes: 'Minor: Referral program activation', time: '2 hours ago', user: 'Rohan Sharma' },
                { version: 'v2.4.0', notes: 'Feature: Multi-store regional routing', time: '1 day ago', user: 'Aman Verma' },
                { version: 'v2.3.9', notes: 'Fix: Invoice sequence prefix alignment', time: '3 days ago', user: 'Sarah D.' }
              ].map((log, index) => (
                <div key={index} className="flex gap-2.5 relative group">
                  {index !== 3 && (
                    <div className="absolute left-[3px] top-3.5 bottom-0 w-[1px] bg-zinc-200 dark:bg-zinc-800 group-hover:bg-[var(--primary)]/30 transition-colors" />
                  )}
                  <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-150">{log.version} - {log.notes}</p>
                    <p className="text-[9px] text-black dark:text-zinc-100 font-semibold">{log.user} • {log.time}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-2.5 bg-zinc-50/50 dark:bg-zinc-950/20 border-t border-zinc-200 dark:border-zinc-800 text-center">
              <button 
                onClick={() => addToast('Opening full settings audit trail...', 'info')}
                className="text-[var(--primary)] hover:underline text-[10px] font-black tracking-wider uppercase flex items-center justify-center gap-1 mx-auto"
              >
                <span>Full Version Trail</span>
                <ArrowRight size={10} />
              </button>
            </div>
          </div>

        </aside>

      </div>
    </div>
  );
}
