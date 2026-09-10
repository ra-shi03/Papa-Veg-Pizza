/**
 * Business Settings Utility
 * Handles loading and applying business settings (colors, favicon, title, logo)
 * Theme colors fetched from DB are applied globally across ALL panels.
 */

import apiClient from "@food/api/axios";
import { API_ENDPOINTS } from "@food/api/config";
import { publicGetOnce } from "@food/api";

const SETTINGS_KEY = 'food_business_settings';

// Initialize from localStorage immediately so it's available for components on mount
let cachedSettings = (() => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (e) {
    return null;
  }
})();

/**
 * Apply theme colors from a settings object to CSS root variables.
 * This is the SINGLE source of truth for color application — called on load and after updates.
 */
export const applyThemeColors = (settings) => {
  if (!settings || typeof document === 'undefined') return;

  const primary = settings.primaryColor;
  const secondary = settings.secondaryColor;
  const themeMode = settings.themeMode;

  if (primary) {
    document.documentElement.style.setProperty('--sa-primary', primary);
    document.documentElement.style.setProperty('--sa-primary-hover', `${primary}cc`);
    document.documentElement.style.setProperty('--primary', primary);
    document.documentElement.style.setProperty('--primary-hover', `${primary}cc`);
    // Keep localStorage in sync for SuperAdmin's own live preview
    localStorage.setItem('sa_primary', primary);
  }

  if (secondary) {
    document.documentElement.style.setProperty('--sa-secondary', secondary);
    document.documentElement.style.setProperty('--sa-secondary-hover', `${secondary}cc`);
    document.documentElement.style.setProperty('--secondary', secondary);
    document.documentElement.style.setProperty('--secondary-hover', `${secondary}cc`);
    localStorage.setItem('sa_secondary', secondary);
  }

  if (themeMode) {
    if (themeMode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sa_themeMode', themeMode);
  }
};

// Apply cached settings immediately on module load (before API call returns)
if (cachedSettings) {
  applyThemeColors(cachedSettings);
  setTimeout(() => {
    updateFavicon(cachedSettings.favicon?.url);
    updateTitle(cachedSettings.companyName);
  }, 0);
}

let inFlightSettingsPromise = null;

/**
 * Load business settings from backend (public endpoint - no auth required)
 * Applies theme colors to CSS variables immediately on response.
 */
export const loadBusinessSettings = async () => {
  try {
    const endpoint = API_ENDPOINTS.ADMIN.BUSINESS_SETTINGS_PUBLIC;
    if (!endpoint || (typeof endpoint === "string" && !endpoint.trim())) {
      return cachedSettings;
    }

    if (inFlightSettingsPromise) {
      return await inFlightSettingsPromise;
    }

    inFlightSettingsPromise = (async () => {
      const response = await publicGetOnce(endpoint, { noCache: true });
      const settings = response?.data?.data || response?.data;

      if (settings) {
        cachedSettings = settings;
        try {
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
        } catch (e) { }

        // Apply theme colors from DB to ALL CSS variables — this is the global fix
        applyThemeColors(settings);

        updateFavicon(settings.favicon?.url);
        updateTitle(settings.companyName);

        // Notify any mounted React components (e.g. sidebar, navbar) to re-read theme state
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("systemThemeChanged"));
        }

        return settings;
      }
      return cachedSettings;
    })();

    return await inFlightSettingsPromise;
  } catch (error) {
    return cachedSettings;
  } finally {
    inFlightSettingsPromise = null;
  }
};

/**
 * Update favicon in document
 */
export const updateFavicon = (url) => {
  if (!url || typeof document === 'undefined') return;

  const existingFavicons = document.querySelectorAll("link[rel*='icon']");
  existingFavicons.forEach(el => el.remove());

  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.href = objectUrl;
      document.head.appendChild(link);
    })
    .catch(err => {
      const link = document.createElement("link");
      link.rel = "icon";
      link.type = "image/png";
      link.href = url;
      link.crossOrigin = "anonymous";
      link.referrerPolicy = "no-referrer";
      document.head.appendChild(link);
    });
};

/**
 * Update page title
 */
export const updateTitle = (companyName) => {
  if (companyName && typeof document !== 'undefined') {
    document.title = companyName;
  }
};

/**
 * Set cached settings manually (call after saving via Settings page)
 */
export const setCachedSettings = (settings) => {
  if (settings) {
    cachedSettings = settings;
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) { }

    applyThemeColors(settings);
    updateFavicon(settings.favicon?.url);
    updateTitle(settings.companyName);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("systemThemeChanged"));
    }
  }
};

/**
 * Clear cached settings (call after updating settings)
 */
export const clearCache = () => {
  cachedSettings = null;
  try {
    localStorage.removeItem(SETTINGS_KEY);
  } catch (e) { }
};

/**
 * Get cached settings
 */
export const getCachedSettings = () => {
  return cachedSettings;
};

/**
 * Get company name from business settings with fallback
 */
export const getCompanyName = () => {
  const settings = getCachedSettings();
  return settings?.companyName || "Papa Veg Pizza";
};

/**
 * Get company name asynchronously (loads if not cached)
 */
export const getCompanyNameAsync = async () => {
  try {
    const settings = await loadBusinessSettings();
    return settings?.companyName || "Papa Veg Pizza";
  } catch (error) {
    return "Papa Veg Pizza";
  }
};
