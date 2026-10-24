import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import apiClient from '@/services/api/axios';

const DEFAULT_CONFIG = {
  paymentOptionEnabled: true,
  walletEnabled: true,
  couponEnabled: true,
  referralEnabled: true,
  guestCheckoutEnabled: true,
  reviewsEnabled: true,
  wishlistEnabled: true,
  codEnabled: true,
  liveTrackingEnabled: true,
  chatEnabled: true,
  scheduledOrdersEnabled: true,
  pickupEnabled: true,
  maintenanceBanner: false,
  multiStoreEnabled: true,
  customerAppVersion: '2.4.2'
};

const AppConfigContext = createContext({
  config: DEFAULT_CONFIG,
  loading: false,
  error: null,
  refetchConfig: () => {}
});

export function AppConfigProvider({ children }) {
  const [config, setConfig] = useState(() => {
    try {
      const cached = localStorage.getItem('pvp_app_config');
      return cached ? { ...DEFAULT_CONFIG, ...JSON.parse(cached) } : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      // Primary: public settings route (with cache-busting timestamp to avoid 304 stale cache)
      const res = await apiClient.get(`/settings/app-config/public?_t=${Date.now()}`).catch(() =>
        apiClient.get(`/food/app-config/public?_t=${Date.now()}`)
      );
      const data = res?.data?.data || res?.data;
      if (data && typeof data === 'object') {
        const merged = { ...DEFAULT_CONFIG, ...data };
        setConfig(merged);
        try {
          localStorage.setItem('pvp_app_config', JSON.stringify(merged));
        } catch {}
      }
      setError(null);
    } catch (err) {
      console.warn('Could not fetch app configuration from server, using local defaults', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();

    // Listen to custom event when admin saves features
    const handleUpdate = (e) => {
      if (e?.detail) {
        setConfig(prev => ({ ...prev, ...e.detail }));
      } else {
        fetchConfig();
      }
    };
    window.addEventListener('appConfigUpdated', handleUpdate);
    window.addEventListener('storage', (e) => {
      if (e.key === 'pvp_app_config' && e.newValue) {
        try {
          setConfig({ ...DEFAULT_CONFIG, ...JSON.parse(e.newValue) });
        } catch {}
      }
    });

    return () => {
      window.removeEventListener('appConfigUpdated', handleUpdate);
    };
  }, [fetchConfig]);

  return (
    <AppConfigContext.Provider value={{ config, loading, error, refetchConfig: fetchConfig }}>
      {children}
    </AppConfigContext.Provider>
  );
}

export function useAppConfig() {
  const context = useContext(AppConfigContext);
  if (!context) {
    return {
      config: DEFAULT_CONFIG,
      loading: false,
      error: null,
      refetchConfig: () => {}
    };
  }
  return context;
}

export default AppConfigContext;

