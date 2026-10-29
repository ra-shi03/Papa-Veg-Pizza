import { useEffect } from 'react';
import { deliveryAPI } from '@food/api';

// When the rider opens the app (signed in), one GPS fix is saved on their record so stores near them can see them,
// online or not. It goes to the authenticated availability endpoint and never changes online / offline.
export function useReportLocationOnOpen() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords || {};
        if (Number.isFinite(latitude) && Number.isFinite(longitude)) deliveryAPI.reportLocation(latitude, longitude).catch(() => {});
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, []);
}
