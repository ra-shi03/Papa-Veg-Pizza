import React, { useEffect } from 'react';
import DeliveryV2Router from './DeliveryV2Router';
import { applySystemTheme } from '@/shared/utils/themeSync';
import './deliveryTheme.css';

function DeliveryV2Module() {
  useEffect(() => {
    const syncAllThemes = () => {
      // 1. Apply system primary/secondary colors & title
      applySystemTheme();

      // 2. Override theme mode class based on user appTheme preference
      const savedTheme = localStorage.getItem('appTheme') || 'light';
      if (savedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    // Initial sync
    syncAllThemes();

    // Listen to changes in this or other tabs
    const handleStorageChange = (e) => {
      if (['appTheme', 'sa_themeMode', 'sa_primary', 'sa_secondary'].includes(e.key)) {
        syncAllThemes();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('systemThemeChanged', syncAllThemes);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('systemThemeChanged', syncAllThemes);
    };
  }, []);

  return (
    <div className="delivery-v2-theme">
      <DeliveryV2Router />
    </div>
  );
}

export default DeliveryV2Module;
