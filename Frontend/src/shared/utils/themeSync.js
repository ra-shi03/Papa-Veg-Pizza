import { useEffect, useState } from "react";

/**
 * Get the resolved colors — DB (food_business_settings) is authoritative.
 * localStorage keys (sa_primary etc.) are only for live preview within SuperAdmin's own tab.
 * For all other panels, the DB value stored in food_business_settings takes priority.
 */
const getResolvedColors = () => {
  let dbPrimary = null;
  let dbSecondary = null;
  let dbThemeMode = null;
  let dbName = null;
  try {
    const settingsStr = localStorage.getItem("food_business_settings");
    if (settingsStr) {
      const s = JSON.parse(settingsStr);
      dbPrimary = s.primaryColor || null;
      dbSecondary = s.secondaryColor || null;
      dbThemeMode = s.themeMode || null;
      dbName = s.companyName || null;
    }
  } catch (e) {}

  return {
    // DB value wins; sa_ keys only used as live-preview override (SA panel only)
    primaryColor: dbPrimary || localStorage.getItem("sa_primary") || "#a43c12",
    secondaryColor: dbSecondary || localStorage.getItem("sa_secondary") || "#ff7f50",
    themeMode: localStorage.getItem("sa_themeMode") || dbThemeMode || "light",
    favicon: localStorage.getItem("sa_favicon") || null,
    logo: localStorage.getItem("sa_logo") || null,
    companyName: localStorage.getItem("sa_companyName") || dbName || "Papa Veg Pizza India Ltd.",
  };
};

/**
 * Apply the resolved theme to CSS root variables and the dark-mode class.
 */
export const applySystemTheme = () => {
  if (typeof window === "undefined") return;
  const { primaryColor, secondaryColor, themeMode, favicon, companyName } = getResolvedColors();

  // Apply light/dark mode class
  if (themeMode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  // Apply CSS custom properties
  document.documentElement.style.setProperty("--sa-primary", primaryColor);
  document.documentElement.style.setProperty("--sa-primary-hover", `${primaryColor}cc`);
  document.documentElement.style.setProperty("--sa-secondary", secondaryColor);
  document.documentElement.style.setProperty("--sa-secondary-hover", `${secondaryColor}cc`);
  document.documentElement.style.setProperty("--primary", primaryColor);
  document.documentElement.style.setProperty("--primary-hover", `${primaryColor}cc`);
  document.documentElement.style.setProperty("--secondary", secondaryColor);
  document.documentElement.style.setProperty("--secondary-hover", `${secondaryColor}cc`);

  // Apply Favicon (from sa_ key only — DB favicon handled by businessSettings.js)
  if (favicon) {
    const existingFavicons = document.querySelectorAll("link[rel*='icon']");
    existingFavicons.forEach(el => el.remove());
    fetch(favicon)
      .then(res => res.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = favicon.endsWith(".ico") ? "image/x-icon" : "image/png";
        link.href = objectUrl;
        document.head.appendChild(link);
      })
      .catch(() => {
        const link = document.createElement("link");
        link.rel = "icon";
        link.href = favicon;
        link.crossOrigin = "anonymous";
        document.head.appendChild(link);
      });
  }

  // Apply Title
  if (companyName) {
    document.title = companyName;
  }
};

/**
 * React hook to consume and react to system theme, color, logo, and favicon updates.
 */
export const useSystemTheme = () => {
  const [themeState, setThemeState] = useState(() => {
    if (typeof window === "undefined") {
      return {
        themeMode: "light",
        primaryColor: "#a43c12",
        secondaryColor: "#ff7f50",
        logo: null,
        favicon: null,
        companyName: "Papa Veg Pizza India Ltd.",
      };
    }
    return getResolvedColors();
  });

  useEffect(() => {
    const handleThemeChange = () => {
      applySystemTheme();
      setThemeState(getResolvedColors());
    };

    // Run initially
    handleThemeChange();

    // Listen to same-tab live-preview events (dispatched by SuperAdmin color picker)
    window.addEventListener("systemThemeChanged", handleThemeChange);

    // Listen to cross-tab updates (other panels detect DB setting changes via storage event)
    const handleStorageChange = (e) => {
      if (
        ["sa_themeMode", "sa_primary", "sa_secondary", "sa_logo", "sa_favicon", "sa_companyName", "food_business_settings"].includes(e.key)
      ) {
        handleThemeChange();
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("systemThemeChanged", handleThemeChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  return themeState;
};
