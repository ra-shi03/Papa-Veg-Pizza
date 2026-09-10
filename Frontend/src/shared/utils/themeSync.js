import { useEffect, useState } from "react";

/**
 * Apply the system theme settings stored in localStorage to the document.
 */
export const applySystemTheme = () => {
  if (typeof window === "undefined") return;

  const themeMode = localStorage.getItem("sa_themeMode") || "light";
  const primaryColor = localStorage.getItem("sa_primary") || "#a43c12";
  const secondaryColor = localStorage.getItem("sa_secondary") || "#ff7f50";
  const favicon = localStorage.getItem("sa_favicon");
  const companyName = localStorage.getItem("sa_companyName");

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

  // Apply Favicon
  if (favicon) {
    // Remove existing favicons
    const existingFavicons = document.querySelectorAll("link[rel*='icon']");
    existingFavicons.forEach(el => el.remove());

    fetch(favicon)
      .then(res => res.blob())
      .then(blob => {
        const objectUrl = URL.createObjectURL(blob);
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = favicon.startsWith("data:image/x-icon") || favicon.endsWith(".ico") ? "image/x-icon" : "image/png";
        link.href = objectUrl;
        document.head.appendChild(link);
      })
      .catch(err => {
        // Fallback to normal if fetch fails (CORS etc)
        const link = document.createElement("link");
        link.rel = "icon";
        link.type = favicon.startsWith("data:image/x-icon") || favicon.endsWith(".ico") ? "image/x-icon" : "image/png";
        link.href = favicon;
        link.crossOrigin = "anonymous";
        link.referrerPolicy = "no-referrer";
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
        companyName: "Papa Veg Pizza India Ltd."
      };
    }
    return {
      themeMode: localStorage.getItem("sa_themeMode") || "light",
      primaryColor: localStorage.getItem("sa_primary") || "#a43c12",
      secondaryColor: localStorage.getItem("sa_secondary") || "#ff7f50",
      logo: localStorage.getItem("sa_logo") || null,
      favicon: localStorage.getItem("sa_favicon") || null,
      companyName: localStorage.getItem("sa_companyName") || "Papa Veg Pizza India Ltd."
    };
  });

  useEffect(() => {
    const handleThemeChange = () => {
      applySystemTheme();
      setThemeState({
        themeMode: localStorage.getItem("sa_themeMode") || "light",
        primaryColor: localStorage.getItem("sa_primary") || "#a43c12",
        secondaryColor: localStorage.getItem("sa_secondary") || "#ff7f50",
        logo: localStorage.getItem("sa_logo") || null,
        favicon: localStorage.getItem("sa_favicon") || null,
        companyName: localStorage.getItem("sa_companyName") || "Papa Veg Pizza India Ltd."
      });
    };

    // Run initially
    handleThemeChange();

    // Listen to local tab updates
    window.addEventListener("systemThemeChanged", handleThemeChange);
    
    // Listen to other tab updates via localStorage
    const handleStorageChange = (e) => {
      if (["sa_themeMode", "sa_primary", "sa_secondary", "sa_logo", "sa_favicon", "sa_companyName"].includes(e.key)) {
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
