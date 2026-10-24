import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { ArrowLeft, Search, ArrowUpDown, Check, X, Star, ChevronRight, ChevronUp, UtensilsCrossed } from "lucide-react"
import apiClient, { adminClient } from "@/services/api/axios"
import DeliveryMapModal from "@food/components/user/DeliveryMapModal"
import DeliveryOrCollectionModal from "@food/components/user/DeliveryOrCollectionModal"
import { useLocationStore } from "@food/store/locationStore"
import { useLocationGuard } from "@food/hooks/useLocationGuard"
import { useScrollLock } from "@food/hooks/useScrollLock"
import logoNew from "@/assets/logo1.png"
import { renderFormattedText } from "@food/utils/formatText"
import MenuSearchOverlay from "@food/components/user/MenuSearchOverlay"


const CRUST_OPTIONS = [
  {
    name: "New Hand Tossed",
    description: "Fresh Dough, Flavourful Edges",
    price: 0,
    image: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=120&auto=format&fit=crop&q=80"
  }
];

export default function MenuList() {
  const navigate = useNavigate()
  const { isModalOpen, closeLocationModal, confirmLocation, locationConfirmed } = useLocationStore()
  const checkLocation = useLocationGuard()
  const location = useLocation()
  const [isDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem("appTheme")
    return savedTheme ? savedTheme === "dark" : false
  })

  // Dynamic Logo State
  const [logoUrl, setLogoUrl] = useState(() => localStorage.getItem("sa_logo") || logoNew);
  useEffect(() => {
    const handleBrandingSync = () => {
      setLogoUrl(localStorage.getItem("sa_logo") || logoNew);
    };
    window.addEventListener("systemThemeChanged", handleBrandingSync);
    return () => window.removeEventListener("systemThemeChanged", handleBrandingSync);
  }, []);

  // Helper to strictly sort categories according to superadmin configuration
  const sortCategoriesBySuperadmin = (list) => {
    return [...list].sort((a, b) => {
      const aVal = Number(a.sort !== undefined && a.sort !== null ? a.sort : 0);
      const bVal = Number(b.sort !== undefined && b.sort !== null ? b.sort : 0);
      if (aVal !== bVal) {
        return aVal - bVal;
      }
      // If both have the same rank, preserve createdAt ascending
      if (a.createdAt && b.createdAt) {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });
  };

  // Helper to extract category passed from navigation (state or query params)
  const getIncomingCategory = () => {
    const stateCat = location.state?.category || location.state?.categoryId || location.state?.categoryName || location.state?.slug;
    if (stateCat) return stateCat;
    try {
      const searchParams = new URLSearchParams(location.search);
      const queryCat = searchParams.get("category") || searchParams.get("cat") || searchParams.get("search") || searchParams.get("q");
      if (queryCat) return queryCat;
    } catch (_) {}
    return null;
  };

  // Helper to flexibly and accurately match an incoming category request against dynamic categories
  const resolveCategoryTab = (target, categoryList = []) => {
    if (!target || !Array.isArray(categoryList) || categoryList.length === 0) return null;
    const targetStr = String(target).trim().toLowerCase();
    const targetClean = targetStr.replace(/[^a-z0-9]/g, '');
    const targetNoU = targetClean.replace(/u/g, ''); // Handles flavour vs flavor

    // 0. Explicit match for Wow 4-in-1 / 4 in 1 / Big Big
    if (targetClean.includes('4in1') || targetClean.includes('wow') || targetClean.includes('big')) {
      const fourInOneCat = categoryList.find(c => {
        const clean = String(c.label || c.name || c.id || c.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        return clean.includes('4in1') || (clean.includes('wow') && clean.includes('4')) || (targetClean.includes('big') && clean.includes('4in1'));
      });
      if (fourInOneCat) return fourInOneCat.id;
    }

    // 1. Direct match on id, _id, or slug
    const directMatch = categoryList.find(c => {
      const cId = String(c.id || '').trim().toLowerCase();
      const cDbId = String(c._id || '').trim().toLowerCase();
      const cSlug = String(c.slug || '').trim().toLowerCase();
      return cId === targetStr || cDbId === targetStr || cSlug === targetStr;
    });
    if (directMatch) return directMatch.id;

    // 2. Exact match on label or name
    const labelMatch = categoryList.find(c => {
      const cLabel = String(c.label || c.name || '').trim().toLowerCase();
      return cLabel === targetStr;
    });
    if (labelMatch) return labelMatch.id;

    // 3. Clean alphanumeric match (ignoring spaces, hyphens, punctuation)
    const cleanMatch = categoryList.find(c => {
      const cLabelClean = String(c.label || c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cIdClean = String(c.id || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const cSlugClean = String(c.slug || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return cLabelClean === targetClean || cIdClean === targetClean || cSlugClean === targetClean;
    });
    if (cleanMatch) return cleanMatch.id;

    // 4. Match ignoring British/American spelling differences (e.g. flavour vs flavor)
    const spellingMatch = categoryList.find(c => {
      const cLabelNoU = String(c.label || c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/u/g, '');
      const cIdNoU = String(c.id || '').toLowerCase().replace(/[^a-z0-9]/g, '').replace(/u/g, '');
      return cLabelNoU === targetNoU || cIdNoU === targetNoU;
    });
    if (spellingMatch) return spellingMatch.id;

    // 5. Partial / substring match
    const partialMatch = categoryList.find(c => {
      const cLabelClean = String(c.label || c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return Boolean(cLabelClean && targetClean && (cLabelClean.includes(targetClean) || targetClean.includes(cLabelClean)));
    });
    if (partialMatch) return partialMatch.id;

    // 6. Legacy aliases mapping
    if (targetClean.includes('pizza')) {
      const pizzaCat = categoryList.find(c => String(c.label || c.name || c.id).toLowerCase().includes('pizza'));
      if (pizzaCat) return pizzaCat.id;
    }
    if (targetClean.includes('burger')) {
      const burgerCat = categoryList.find(c => String(c.label || c.name || c.id).toLowerCase().includes('burger'));
      if (burgerCat) return burgerCat.id;
    }
    if (targetClean.includes('bread')) {
      const breadCat = categoryList.find(c => String(c.label || c.name || c.id).toLowerCase().includes('bread'));
      if (breadCat) return breadCat.id;
    }
    if (targetClean.includes('drink') || targetClean.includes('beverage')) {
      const drinkCat = categoryList.find(c => {
        const l = String(c.label || c.name || c.id).toLowerCase();
        return l.includes('drink') || l.includes('beverage');
      });
      if (drinkCat) return drinkCat.id;
    }
    if (targetClean.includes('dessert')) {
      const dessertCat = categoryList.find(c => String(c.label || c.name || c.id).toLowerCase().includes('dessert'));
      if (dessertCat) return dessertCat.id;
    }
    if (targetClean.includes('pasta')) {
      const pastaCat = categoryList.find(c => String(c.label || c.name || c.id).toLowerCase().includes('pasta'));
      if (pastaCat) return pastaCat.id;
    }

    return null;
  };

  // Helper to match a product to a category
  const getCategoryKeyForProduct = (p, currentCategories = []) => {
    const pCat = p.categoryId;
    const pCatId = typeof pCat === 'object' && pCat !== null ? pCat._id : (pCat || p.category_id);
    const pCatLabel = (typeof pCat === 'object' && pCat !== null ? (pCat.label || pCat.name) : '') || p.category || p.categoryName || '';

    // 1. Try finding category in currentCategories by _id
    if (pCatId) {
      const foundById = currentCategories.find(c => String(c._id || c.id) === String(pCatId));
      if (foundById) {
        return foundById.id || foundById.slug || (foundById.label || foundById.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      }
    }

    // 2. Try finding category by label / name
    if (pCatLabel) {
      const cleanLabel = pCatLabel.toLowerCase().trim();
      const foundByLabel = currentCategories.find(c => {
        const cLabel = (c.label || c.name || '').toLowerCase().trim();
        const cSlug = c.id || c.slug || cLabel.replace(/[^a-z0-9]+/g, '-');
        return cLabel === cleanLabel || cSlug === cleanLabel.replace(/[^a-z0-9]+/g, '-');
      });
      if (foundByLabel) {
        return foundByLabel.id || foundByLabel.slug || (foundByLabel.label || foundByLabel.name || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
      }
      return cleanLabel.replace(/[^a-z0-9]+/g, '-');
    }

    return pCatId ? String(pCatId) : 'uncategorized';
  };

  // Helper to format a product for user menu display strictly from dynamic API data
  const formatProductForMenu = (p) => {
    const rawSizes = (p.sizes && Array.isArray(p.sizes) && p.sizes.length > 0) ? p.sizes : [];
    const sizes = rawSizes.length > 0
      ? rawSizes.map(s => {
          const sizeName = typeof s === 'string' ? s : (s.size || s.name || 'Regular');
          const sizePrice = typeof s === 'string' ? (Number(p.price) || 0) : (Number(s.price) || Number(p.price) || 0);
          const sizeOriginalPrice = typeof s === 'string' ? 0 : (Number(s.originalPrice) || Number(s.mrp) || 0);
          const sizeDiscount = typeof s === 'string' ? 0 : (Number(s.discount) || 0);
          const sizeDiscountType = s.discountType || 'percentage';
          const sizeSaveAmount = typeof s === 'string' ? 0 : (Number(s.saveAmount) || (sizeOriginalPrice > sizePrice ? sizeOriginalPrice - sizePrice : 0));
          const sizeDesc = s.description || (
            sizeName.toLowerCase() === 'regular' ? 'Serves 1 person only' :
            sizeName.toLowerCase() === 'medium' ? 'Just right for 1-2 people' :
            'Serves 3-4 people'
          );
          return { 
            name: sizeName, 
            size: sizeName,
            price: sizePrice, 
            originalPrice: sizeOriginalPrice > sizePrice ? sizeOriginalPrice : null,
            discount: sizeDiscount,
            discountType: sizeDiscountType,
            saveAmount: sizeSaveAmount,
            description: sizeDesc 
          };
        })
      : [
          { 
            name: "Regular", 
            size: "Regular",
            price: Number(p.price) || 0, 
            originalPrice: (Number(p.originalPrice) > Number(p.price)) ? Number(p.originalPrice) : null,
            discount: Number(p.discount) || 0,
            discountType: p.discountType || "percentage",
            saveAmount: Number(p.saveAmount) || (Number(p.originalPrice) > Number(p.price) ? Number(p.originalPrice) - Number(p.price) : 0),
            description: "Serves 1 person only" 
          }
        ];

    const baseSize = sizes.find(s => s.name?.toLowerCase() === 'regular') || sizes[0] || {};
    const basePrice = baseSize.price || Number(p.price) || 0;
    const originalPrice = baseSize.originalPrice || (Number(p.originalPrice) > basePrice ? Number(p.originalPrice) : null);
    const saveAmount = baseSize.saveAmount || (originalPrice > basePrice ? (Number(p.saveAmount) || (originalPrice - basePrice)) : 0);

    // Strict Dynamic Badge - only when superadmin explicitly provided a badge
    const badge = (p.badge && typeof p.badge === 'string' && p.badge.trim()) ? p.badge.trim() : "";

    let toppingsSummary = p.shortDescription || "";
    if (!toppingsSummary && Array.isArray(p.toppings) && p.toppings.length > 0) {
      toppingsSummary = "Toppings: " + p.toppings.map(t => (typeof t === 'object' ? t.name : t)).filter(Boolean).join(" • ");
    }
    if (!toppingsSummary) {
      toppingsSummary = p.description || "";
    }

    return {
      id: p._id || p.id || `prod-${String(p.name || '').toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      _id: p._id || p.id,
      name: p.name || p.title || "",
      title: p.name || p.title || "",
      price: basePrice,
      originalPrice,
      saveAmount,
      badge,
      image: p.image || "",
      description: p.description || p.shortDescription || "",
      toppingsSummary,
      defaultCrust: p.defaultCrust || "New Hand Tossed",
      showCrust: p.showCrust !== undefined ? Boolean(p.showCrust) : true,
      crusts: p.crusts || [],
      sizes,
      toppings: p.toppings || [],
      isVeg: p.vegType !== 'non-veg',
      rating: p.rating || 4.8,
      ratingCount: p.ratingCount || 28,
      status: p.status || "Active",
      category: (typeof p.categoryId === 'object' && p.categoryId !== null ? (p.categoryId.label || p.categoryId.name) : '') || p.category || p.categoryName || '',
      categoryLabel: (typeof p.categoryId === 'object' && p.categoryId !== null ? (p.categoryId.label || p.categoryId.name) : '') || p.category || '',
      categoryId: typeof p.categoryId === 'object' && p.categoryId !== null ? (p.categoryId._id || p.categoryId.id) : (p.categoryId || ''),
      rawProduct: p
    };
  };

  // Helper to format a superadmin combo (Meal for 1 / 2 / 4) into the same card shape as products
  const formatComboForMenu = (c) => {
    const price = Number(c.price) || 0;
    const originalPrice = Number(c.originalPrice) > price ? Number(c.originalPrice) : null;
    // When superadmin adds customer choices to an item, the item itself (e.g. Coke, Single Corn) is also one of the options
    const comboItems = (c.items || []).map(it => {
      // Add-ons (dips, toppings) are not sized like menu items, so their "Regular" placeholder is not shown
      const extra = (it.choices || []).map(ch => ({ _id: String(ch._id || ch.name), name: ch.name, size: ch.addonId ? "" : (ch.size || "") }));
      const baseName = String(it.name || "").trim().toLowerCase();
      const choices = extra.length > 0 && !extra.some(ch => ch.name.trim().toLowerCase() === baseName)
        ? [{ _id: `base-${it._id || it.name}`, name: it.name, size: it.addonId ? "" : (it.size || "") }, ...extra]
        : extra;
      return {
        _id: String(it._id || it.name),
        name: it.name,
        size: it.addonId ? "" : (it.size || ""),
        quantity: Number(it.quantity) || 1,
        choices
      };
    });
    const itemsLine = comboItems
      .map(it => `${it.quantity > 1 ? `${it.quantity} x ` : ""}${it.choices.length > 0 ? it.choices.map(ch => ch.name).join(" / ") : it.name}`)
      .join(" + ");
    const summary = c.description || itemsLine;
    const cat = c.categoryId && typeof c.categoryId === "object" ? c.categoryId : null;

    return {
      id: String(c._id),
      _id: String(c._id),
      name: c.name || "",
      title: c.name || "",
      price,
      originalPrice,
      saveAmount: originalPrice ? originalPrice - price : 0,
      badge: (c.badge || "").trim(),
      image: c.image || "",
      description: summary,
      toppingsSummary: c.availabilityLabel ? `${c.availabilityLabel.replace(/^Available /, "")} • ${summary}` : summary,
      defaultCrust: "",
      showCrust: false,
      crusts: [],
      sizes: [{ name: "Meal", size: "Meal", price, originalPrice, discount: 0, discountType: "flat", saveAmount: originalPrice ? originalPrice - price : 0, description: "" }],
      toppings: [],
      isVeg: true,
      rating: 4.8,
      ratingCount: 28,
      status: "Active",
      category: cat?.label || "",
      categoryLabel: cat?.label || "",
      categoryId: cat?._id ? String(cat._id) : String(c.categoryId || ""),
      isCombo: true,
      comboItems,
      availableNow: c.availableNow !== false,
      availabilityLabel: c.availabilityLabel || ""
    };
  };

  // Superadmin combos grouped by their menu category _id
  const [comboMenuMap, setComboMenuMap] = useState({});

  useEffect(() => {
    const fetchCombos = async () => {
      try {
        const res = await apiClient.get('/food/combos/public');
        const list = Array.isArray(res?.data?.data) ? res.data.data : [];
        const map = {};
        list.forEach(c => {
          const formatted = formatComboForMenu(c);
          if (!formatted.categoryId) return;
          if (!map[formatted.categoryId]) map[formatted.categoryId] = [];
          map[formatted.categoryId].push(formatted);
        });
        setComboMenuMap(map);
      } catch (e) {
        console.warn("Failed to load combos:", e);
      }
    };
    fetchCombos();
  }, []);

  // Dynamic Categories State
  const [categories, setCategories] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_categories");
      if (stored) {
        const parsed = JSON.parse(stored).filter(c => c.status !== "Inactive");
        if (parsed.length > 0) {
          const sorted = sortCategoriesBySuperadmin(parsed);
          const seen = new Set();
          const list = [];
          sorted.forEach((c, idx) => {
            const label = c.label || c.name || "";
            let id = c.slug || label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
            
            if (seen.has(id)) {
              id = `${id}-${c._id || idx}`;
            }
            seen.add(id);

            list.push({
              id,
              _id: c._id || c.id || `${id}-${idx}`,
              label,
              badge: c.badge || "",
              icon: c.icon || "",
              sort: c.sort ?? 0,
              createdAt: c.createdAt
            });
          });
          return list;
        }
      }
    } catch (e) {}
    return [];
  });

  // Dynamic Promise Header & Campaign Taglines State (Superadmin controlled)
  const [promiseHeaderTitle, setPromiseHeaderTitle] = useState("Papa Veg Promise");
  const [promiseHeaderStars, setPromiseHeaderStars] = useState("★ ★");
  const [campaigns, setCampaigns] = useState([
    {
      _id: "c1",
      tagline: "Where quality food meets honest prices!"
    },
    {
      _id: "c2",
      tagline: "0% Preservatives & Fresh Dough Daily in Every Store"
    },
    {
      _id: "c3",
      tagline: "No Weather Surge & Free Delivery with Minimum Order"
    }
  ]);
  const [activeCampaignIndex, setActiveCampaignIndex] = useState(0);

  // Auto-advance campaign slider every 4 seconds
  useEffect(() => {
    if (campaigns.length <= 1) return;
    const interval = setInterval(() => {
      setActiveCampaignIndex((prev) => (prev + 1) % campaigns.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [campaigns.length]);

  // Fetch campaigns from backend superadmin promise-campaign API
  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        const res = await apiClient.get('/settings/promise-campaign');
        const pData = res?.data?.data || res?.data;
        if (pData?.header?.title) {
          setPromiseHeaderTitle(pData.header.title);
        }
        if (pData?.header?.stars) {
          setPromiseHeaderStars(pData.header.stars);
        }
        if (pData?.tickerItems && pData.tickerItems.length > 0) {
          const activeTickers = pData.tickerItems.filter(t => t.isActive !== false);
          if (activeTickers.length > 0) {
            setCampaigns(activeTickers.map(t => ({
              _id: t.id,
              heading: t.heading || pData.header?.title || "Papa Veg Promise",
              tagline: t.tagline || pData.header?.subtitle || "Where quality food meets honest prices!",
              stars: pData.header?.stars || "★★"
            })));
            return;
          }
        }
      } catch (err) {
        // Ignored
      }
    };
    fetchCampaigns();
  }, []);

  // Fetch dynamic categories and products from backend superadmin
  useEffect(() => {
    const fetchCategoryProducts = async () => {
      try {
        let fetchedCats = [];
        let fetchedProds = [];

        // 1. Fetch Categories using the same endpoint as Superadmin panel (/food/admin/category-products)
        try {
          const cRes = await adminClient.get('/food/admin/category-products?sort=sort_asc');
          if (Array.isArray(cRes?.data?.data) && cRes.data.data.length > 0) {
            fetchedCats = cRes.data.data;
          }
        } catch (_) {}

        if (fetchedCats.length === 0) {
          try {
            const cRes = await apiClient.get('/food/admin/category-products?sort=sort_asc');
            if (Array.isArray(cRes?.data?.data) && cRes.data.data.length > 0) {
              fetchedCats = cRes.data.data;
            }
          } catch (_) {}
        }

        if (fetchedCats.length === 0) {
          try {
            const cRes = await apiClient.get('/food/admin/category-products/public?sort=sort_asc');
            if (Array.isArray(cRes?.data?.data) && cRes.data.data.length > 0) {
              fetchedCats = cRes.data.data;
            }
          } catch (_) {}
        }

        // 2. Fetch Products using the same endpoint as Superadmin panel (/food/admin/products)
        try {
          const pRes = await adminClient.get('/food/admin/products', { params: { limit: 250, page: 1 } });
          const items = Array.isArray(pRes?.data?.data) ? pRes.data.data : (pRes?.data?.data?.foods || []);
          if (items.length > 0) fetchedProds = items;
        } catch (_) {}

        if (fetchedProds.length === 0) {
          try {
            const pRes = await apiClient.get('/food/admin/products', { params: { limit: 250, page: 1 } });
            const items = Array.isArray(pRes?.data?.data) ? pRes.data.data : (pRes?.data?.data?.foods || []);
            if (items.length > 0) fetchedProds = items;
          } catch (_) {}
        }

        if (fetchedProds.length === 0) {
          try {
            const pRes = await apiClient.get('/food/admin/products/public');
            const items = Array.isArray(pRes?.data?.data) ? pRes.data.data : [];
            if (items.length > 0) fetchedProds = items;
          } catch (_) {}
        }

        if (fetchedCats.length === 0 || fetchedProds.length === 0) {
          try {
            const menuRes = await apiClient.get('/food/admin/menu/public');
            const mData = menuRes?.data?.data;
            if (fetchedCats.length === 0 && Array.isArray(mData?.categories) && mData.categories.length > 0) {
              fetchedCats = mData.categories;
            }
            if (fetchedProds.length === 0 && Array.isArray(mData?.products) && mData.products.length > 0) {
              fetchedProds = mData.products;
            }
          } catch (_) {}
        }

        if (fetchedProds.length === 0) {
          try {
            const stored = localStorage.getItem("pvp_products_v2");
            if (stored) {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed) && parsed.length > 0) {
                fetchedProds = parsed;
              }
            }
          } catch (_) {}
        }

        // Process Categories
        let mappedCats = [];
        if (fetchedCats.length > 0) {
          const activeCats = fetchedCats.filter(c => c.status !== "Inactive" && (c.type === "Category" || !c.type));
          if (activeCats.length > 0) {
            const sortedCats = sortCategoriesBySuperadmin(activeCats);
            const seen = new Set();
            sortedCats.forEach((c, idx) => {
              const label = c.label || c.name || "";
              let id = c.slug || label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

              if (seen.has(id)) {
                id = `${id}-${c._id || idx}`;
              }
              seen.add(id);

              mappedCats.push({
                id,
                _id: c._id || c.id || `${id}-${idx}`,
                label,
                badge: c.badge || "",
                icon: c.icon || "",
                sort: c.sort ?? 0,
                createdAt: c.createdAt
              });
            });

            setCategories(mappedCats);
            localStorage.setItem("pvp_categories", JSON.stringify(mappedCats));

            const incoming = getIncomingCategory();
            if (incoming && mappedCats.length > 0) {
              const resolved = resolveCategoryTab(incoming, mappedCats);
              if (resolved) {
                userManuallySelectedCategoryRef.current = true;
                setActiveTab(resolved);
              }
            } else if (mappedCats.length > 0) {
              setActiveTab(prev => {
                if (userManuallySelectedCategoryRef.current && mappedCats.some(c => c.id === prev)) {
                  return prev;
                }
                return mappedCats[0].id;
              });
            }
          }
        }

        // Process Products category-wise
        if (fetchedProds.length > 0) {
          const currentCats = mappedCats.length > 0 ? mappedCats : categories;
          const map = {};
          fetchedProds.forEach(p => {
            if (p.status && p.status.toLowerCase() !== "active") return;
            const catKey = getCategoryKeyForProduct(p, currentCats);
            if (!map[catKey]) map[catKey] = [];

            const formatted = formatProductForMenu(p);
            const matchedCat = currentCats.find(c => c.id === catKey || String(c._id) === catKey);
            if (matchedCat && !formatted.category) {
              formatted.category = matchedCat.label;
              formatted.categoryLabel = matchedCat.label;
            }

            if (!map[catKey].some(item => item.id === formatted.id || item.title.toLowerCase() === formatted.title.toLowerCase())) {
              map[catKey].push(formatted);
            }

            // Also map by MongoDB ObjectId
            const pCat = p.categoryId;
            const pCatId = typeof pCat === 'object' && pCat !== null ? pCat._id : (pCat || p.category_id);
            if (pCatId && String(pCatId) !== catKey) {
              const idKey = String(pCatId);
              if (!map[idKey]) map[idKey] = [];
              if (!map[idKey].some(item => item.id === formatted.id || item.title.toLowerCase() === formatted.title.toLowerCase())) {
                map[idKey].push(formatted);
              }
            }
          });

          setProductsMap(map);
        }
      } catch (e) {
        console.warn("Failed to load backend category products:", e);
      }
    };
    fetchCategoryProducts();
  }, []);

  useEffect(() => {
    const handleCategoriesSync = () => {
      try {
        const stored = localStorage.getItem("pvp_categories");
        if (stored) {
          const parsed = JSON.parse(stored).filter(c => c.status !== "Inactive");
          if (parsed.length > 0) {
            const sorted = sortCategoriesBySuperadmin(parsed);
            const seen = new Set();
            const mapped = [];
            sorted.forEach((c, idx) => {
              const label = c.label || c.name || "";
              let id = c.slug || label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");

              if (seen.has(id)) {
                id = `${id}-${c._id || idx}`;
              }
              seen.add(id);

              mapped.push({
                id,
                _id: c._id || c.id || `${id}-${idx}`,
                label,
                badge: c.badge || "",
                icon: c.icon || "",
                sort: c.sort ?? 0,
                createdAt: c.createdAt
              });
            });
            setCategories(mapped);
          }
        }
      } catch (e) {}
    };
    window.addEventListener("pvp_categories_changed", handleCategoriesSync);
    return () => window.removeEventListener("pvp_categories_changed", handleCategoriesSync);
  }, []);

  // Dynamic Products Map State
  const [productsMap, setProductsMap] = useState(() => {
    try {
      const stored = localStorage.getItem("pvp_products_v2");
      if (stored) {
        const parsed = JSON.parse(stored).filter(p => p.status === "Active");
        if (parsed.length > 0) {
          const map = {};
          const curCats = categories || [];
          parsed.forEach(p => {
            const catKey = getCategoryKeyForProduct(p, curCats);
            if (!map[catKey]) map[catKey] = [];
            const formatted = formatProductForMenu(p);
            if (!map[catKey].some(item => item.id === formatted.id || item.title.toLowerCase() === formatted.title.toLowerCase())) {
              map[catKey].push(formatted);
            }
            const pCat = p.categoryId;
            const pCatId = typeof pCat === 'object' && pCat !== null ? pCat._id : (pCat || p.category_id);
            if (pCatId && String(pCatId) !== catKey) {
              const idKey = String(pCatId);
              if (!map[idKey]) map[idKey] = [];
              if (!map[idKey].some(item => item.id === formatted.id || item.title.toLowerCase() === formatted.title.toLowerCase())) {
                map[idKey].push(formatted);
              }
            }
          });
          return map;
        }
      }
    } catch (e) {}
    return null;
  });

  useEffect(() => {
    const handleProductsSync = () => {
      try {
        const stored = localStorage.getItem("pvp_products_v2");
        if (stored) {
          const parsed = JSON.parse(stored).filter(p => p.status === "Active");
          if (parsed.length > 0) {
            const map = {};
            const curCats = categories || [];
            parsed.forEach(p => {
              const catKey = getCategoryKeyForProduct(p, curCats);
              if (!map[catKey]) map[catKey] = [];
              const formatted = formatProductForMenu(p);
              if (!map[catKey].some(item => item.id === formatted.id || item.title.toLowerCase() === formatted.title.toLowerCase())) {
                map[catKey].push(formatted);
              }
              const pCat = p.categoryId;
              const pCatId = typeof pCat === 'object' && pCat !== null ? pCat._id : (pCat || p.category_id);
              if (pCatId && String(pCatId) !== catKey) {
                const idKey = String(pCatId);
                if (!map[idKey]) map[idKey] = [];
                if (!map[idKey].some(item => item.id === formatted.id || item.title.toLowerCase() === formatted.title.toLowerCase())) {
                  map[idKey].push(formatted);
                }
              }
            });
            setProductsMap(map);
          }
        }
      } catch (e) {}
    };
    window.addEventListener("pvp_products_changed_v2", handleProductsSync);
    return () => window.removeEventListener("pvp_products_changed_v2", handleProductsSync);
  }, [categories]);

  // Dynamic Toppings State
  const [toppings, setToppings] = useState(() => {
    const defaultToppings = [
      { name: "Jalapeno", price: 45 },
      { name: "Paneer", price: 55 },
      { name: "Capsicum", price: 45 },
      { name: "Mushroom", price: 45 },
      { name: "Onion", price: 45 },
      { name: "Red Paprika", price: 45 },
      { name: "Red Capsicum", price: 45 },
      { name: "Sweet Corn", price: 45 },
      { name: "Tomato", price: 45 }
    ];
    try {
      const stored = localStorage.getItem("pvp_addons");
      if (stored) {
        const parsed = JSON.parse(stored).filter(a => a.status === "active" && a.type === "topping");
        if (parsed.length > 0) {
          return parsed.map(a => ({
            name: a.name,
            price: a.price,
            badge: a.category === "Pizza" ? "Bestseller" : ""
          }));
        }
      }
    } catch (e) {}
    return defaultToppings;
  });

  const [allAddonsList, setAllAddonsList] = useState([]);

  // Fetch toppings from backend public addons API
  useEffect(() => {
    const fetchAddons = async () => {
      try {
        const res = await apiClient.get('/food/admin/addons/public');
        const data = res?.data?.data;
        if (Array.isArray(data) && data.length > 0) {
          setAllAddonsList(data);
          const mapped = data.filter(a => (a.status || 'Active').toLowerCase() === 'active').map(a => {
            const defaultPrice = (a.prices && a.prices.length > 0) ? Number(a.prices[0].price) : (Number(a.price) || 45);
            return {
              name: a.name,
              price: defaultPrice,
              badge: a.type?.toLowerCase() === 'topping' ? '' : (a.type || '')
            };
          });
          if (mapped.length > 0) {
            setToppings(mapped);
          }
        }
      } catch (_) {}
    };
    fetchAddons();
  }, []);

  useEffect(() => {
    const handleToppingsSync = () => {
      try {
        const stored = localStorage.getItem("pvp_addons");
        if (stored) {
          const parsed = JSON.parse(stored).filter(a => a.status === "active" && a.type === "topping");
          if (parsed.length > 0) {
            setToppings(parsed.map(a => ({
              name: a.name,
              price: a.price,
              badge: a.category === "Pizza" ? "Bestseller" : ""
            })));
          }
        }
      } catch (e) {}
    };
    window.addEventListener("pvp_addons_changed", handleToppingsSync);
    return () => window.removeEventListener("pvp_addons_changed", handleToppingsSync);
  }, []);

  // Combos are keyed by category _id, so Meal for 1 / 2 / 4 sections pick them up like regular products
  const currentMenuItems = useMemo(() => {
    const merged = { ...(productsMap || {}) };
    Object.entries(comboMenuMap).forEach(([catId, combos]) => {
      const cat = categories.find(c => String(c._id) === catId);
      // Products are stored under both the category slug and its _id; mirror that for combos
      [...new Set([catId, cat?.id].filter(Boolean))].forEach(key => {
        merged[key] = [...combos, ...(merged[key] || [])];
      });
    });
    return merged;
  }, [productsMap, comboMenuMap, categories]);

  const userManuallySelectedCategoryRef = useRef(false);
  const activeTabButtonRef = useRef(null);
  const isProgrammaticScrollRef = useRef(false);
  const scrollTimeoutRef = useRef(null);
  const activeTabRef = useRef("");
  const categorySectionsWithItemsRef = useRef([]);
  const [showQuickMenuModal, setShowQuickMenuModal] = useState(false);

  const [activeTab, setActiveTab] = useState(() => {
    const incoming = getIncomingCategory();
    if (incoming) {
      userManuallySelectedCategoryRef.current = true;
      try {
        const stored = localStorage.getItem("pvp_categories");
        if (stored) {
          const parsed = JSON.parse(stored).filter(c => c.status !== "Inactive");
          const resolved = resolveCategoryTab(incoming, parsed);
          if (resolved) return resolved;
        }
      } catch (_) {}
      return incoming;
    }
    try {
      const stored = localStorage.getItem("pvp_categories");
      if (stored) {
        const parsed = JSON.parse(stored).filter(c => c.status !== "Inactive");
        if (parsed.length > 0) {
          const sorted = sortCategoriesBySuperadmin(parsed);
          if (sorted.length > 0 && sorted[0]?.id) return sorted[0].id;
        }
      }
    } catch (_) {}
    return "";
  });

  const [menuFilters, setMenuFilters] = useState(() => {
    try {
      const saved = localStorage.getItem("pvp_menu_filters");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      vegOnly: { enabled: true, label: "Veg Only", defaultActive: true },
      sortBy: { enabled: true, label: "Sort by", defaultOption: "default" }
    };
  });

  const [isVegOnly, setIsVegOnly] = useState(() => {
    try {
      const saved = localStorage.getItem("pvp_menu_filters");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.vegOnly?.defaultActive !== undefined) return parsed.vegOnly.defaultActive;
      }
    } catch (_) {}
    return true;
  });

  const [isVegetarian, setIsVegetarian] = useState(true);

  const [sortBy, setSortBy] = useState(() => {
    try {
      const saved = localStorage.getItem("pvp_menu_filters");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.sortBy?.defaultOption) return parsed.sortBy.defaultOption;
      }
    } catch (_) {}
    return "default";
  });

  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef(null);
  const compactSortMenuRef = useRef(null);

  // Track scroll position to dynamically collapse ← Menu, make compact sticky header, and spy active category
  const [isScrolled, setIsScrolled] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const anchorScrollYRef = useRef(0);
  const lastScrollYRef = useRef(0);
  // Collapsing the header changes the page height; ignore the scroll events that shift causes so it doesn't flip back and forth
  const headerToggleAtRef = useRef(0);

  useEffect(() => {
    let ticking = false;
    const prevOverflowAnchor = document.documentElement.style.overflowAnchor;
    document.documentElement.style.overflowAnchor = "none";
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const rawScrollY = window.scrollY || document.documentElement.scrollTop || 0;
          const scrollY = Math.max(0, rawScrollY);

          // Update floating scroll-to-top button visibility
          setShowScrollToTop(scrollY > 280);

          // Dynamic Header Collapse / Expand:
          // Scrolling down slightly -> hide menu & collapse into compact header (Image 2)
          // Scrolling up slightly (to top side) -> show menu & expand header (Image 1)
          if (!isProgrammaticScrollRef.current) {
            if (Date.now() - headerToggleAtRef.current < 450) {
              anchorScrollYRef.current = scrollY;
            } else if (scrollY <= 20) {
              // Always show full menu when at or near top
              setIsScrolled(prev => {
                if (prev) headerToggleAtRef.current = Date.now();
                return false;
              });
              anchorScrollYRef.current = scrollY;
            } else {
              const diff = scrollY - anchorScrollYRef.current;

              // Scrolling down by threshold (>= 12px)
              if (diff >= 24) {
                setIsScrolled(prev => {
                  if (!prev) headerToggleAtRef.current = Date.now();
                  return true;
                });
                setShowSortMenu(false);
                anchorScrollYRef.current = scrollY;
              } 
              // Scrolling up towards top side by threshold (<= -10px)
              else if (diff <= -24) {
                setIsScrolled(prev => {
                  if (prev) headerToggleAtRef.current = Date.now();
                  return false;
                });
                anchorScrollYRef.current = scrollY;
              }
            }
          } else {
            anchorScrollYRef.current = scrollY;
          }

          lastScrollYRef.current = scrollY;

          // Scrollspy: automatically move category tab as user scrolls through products
          if (!isProgrammaticScrollRef.current) {
            const sections = categorySectionsWithItemsRef.current;
            if (sections && sections.length > 0) {
              const headerOffset = 135;
              let newActiveId = null;

              for (let i = 0; i < sections.length; i++) {
                const catId = sections[i].category.id;
                const el = document.getElementById(`category-section-${catId}`);
                if (el) {
                  const rect = el.getBoundingClientRect();
                  if (rect.top <= headerOffset) {
                    newActiveId = catId;
                  }
                }
              }

              const isNearBottom = (window.innerHeight + scrollY) >= (document.documentElement.scrollHeight - 50);
              if (isNearBottom) {
                newActiveId = sections[sections.length - 1].category.id;
              } else if (!newActiveId && sections.length > 0) {
                newActiveId = sections[0].category.id;
              }

              if (newActiveId && newActiveId !== activeTabRef.current) {
                setActiveTab(newActiveId);
              }
            }
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    const handleUserInterrupt = () => {
      isProgrammaticScrollRef.current = false;
      anchorScrollYRef.current = Math.max(0, window.scrollY || document.documentElement.scrollTop || 0);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("wheel", handleUserInterrupt, { passive: true });
    window.addEventListener("touchmove", handleUserInterrupt, { passive: true });
    handleScroll();

    return () => {
      document.documentElement.style.overflowAnchor = prevOverflowAnchor;
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("wheel", handleUserInterrupt);
      window.removeEventListener("touchmove", handleUserInterrupt);
    };
  }, []);

  // Sync menuFilters from backend & localStorage
  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const res = await apiClient.get('/settings/home-page');
        const mf = res?.data?.data?.menuFilters;
        if (mf) {
          setMenuFilters(mf);
          localStorage.setItem("pvp_menu_filters", JSON.stringify(mf));
        }
      } catch (_) {}
    };
    fetchFilters();

    const handleFilterSync = (e) => {
      if (e?.detail) {
        setMenuFilters(e.detail);
      } else {
        try {
          const saved = localStorage.getItem("pvp_menu_filters");
          if (saved) setMenuFilters(JSON.parse(saved));
        } catch (_) {}
      }
    };
    window.addEventListener("pvp_menu_filters_changed", handleFilterSync);
    return () => window.removeEventListener("pvp_menu_filters_changed", handleFilterSync);
  }, []);

  // Close sort menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideExpanded = sortMenuRef.current && sortMenuRef.current.contains(event.target);
      const clickedInsideCompact = compactSortMenuRef.current && compactSortMenuRef.current.contains(event.target);
      if (!clickedInsideExpanded && !clickedInsideCompact) {
        setShowSortMenu(false);
      }
    };
    if (showSortMenu) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showSortMenu]);

  const [showServiceSelector, setShowServiceSelector] = useState(false)
  const [showMapModal, setShowMapModal] = useState(false)
  const [showStoreModal, setShowStoreModal] = useState(false)
  const [showCarModal, setShowCarModal] = useState(false)
  const [deliveryAddress, setDeliveryAddress] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("deliveryAddress") || "") : ""
  })
  const [takeawayHut, setTakeawayHut] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("takeawayHut") || "") : ""
  })
  const [carNumber, setCarNumber] = useState(() => {
    return locationConfirmed ? (localStorage.getItem("carNumber") || "") : ""
  })

  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedQuery, setDebouncedQuery] = useState("")
  const [isSearchOverlayOpen, setIsSearchOverlayOpen] = useState(false)
  const [expandedItems, setExpandedItems] = useState({})

  // Record products viewed/clicked by user into localStorage for recently viewed carousel
  const recordViewedProduct = (item) => {
    try {
      if (!item) return;
      const current = localStorage.getItem("pvp_recently_viewed_products");
      const list = current ? JSON.parse(current) : [];
      const itemId = item.id || item._id;
      const filtered = list.filter(p => (p.id || p._id) !== itemId);
      const toSave = {
        id: itemId,
        _id: item._id || item.id,
        title: item.title || item.name,
        name: item.name || item.title,
        price: item.price,
        originalPrice: item.originalPrice || null,
        saveAmount: item.saveAmount || 0,
        image: item.image || "",
        defaultCrust: item.defaultCrust,
        showCrust: item.showCrust,
        category: item.category,
        categoryLabel: item.categoryLabel,
        toppingsSummary: item.toppingsSummary,
        sizes: item.sizes,
        toppings: item.toppings,
        crusts: item.crusts,
        viewedAt: Date.now()
      };
      const updated = [toSave, ...filtered].slice(0, 10);
      localStorage.setItem("pvp_recently_viewed_products", JSON.stringify(updated));
      window.dispatchEvent(new Event("pvp_recently_viewed_changed"));
    } catch (_) {}
  };

  // Flattened products list across all categories for full-screen search overlay
  const allFlattenedProducts = useMemo(() => {
    const list = [];
    const seen = new Set();
    Object.values(productsMap || {}).forEach(arr => {
      if (Array.isArray(arr)) {
        arr.forEach(p => {
          const key = p.id || p._id || p.title;
          if (key && !seen.has(key)) {
            seen.add(key);
            list.push(p);
          }
        });
      }
    });
    return list;
  }, [productsMap]);


  // Custom Customize Modal States
  const [customizeItem, setCustomizeItem] = useState(null)
  const [selectedSize, setSelectedSize] = useState("")
  const [selectedToppings, setSelectedToppings] = useState([])
  const [selectedCheeseDip, setSelectedCheeseDip] = useState([])
  const [selectedKetchup, setSelectedKetchup] = useState([])
  const [selectedBreadDips, setSelectedBreadDips] = useState([])
  const [selectedCrust, setSelectedCrust] = useState("New Hand Tossed")
  const [selectedSizeOption, setSelectedSizeOption] = useState({ name: "Regular", price: 299, description: "Serves 1 person only" })
  const [selectedExtraCheese, setSelectedExtraCheese] = useState(false)
  const [selectedMealOptions, setSelectedMealOptions] = useState([])
  const [selectedToppingsList, setSelectedToppingsList] = useState([])
  const [selectedComboChoices, setSelectedComboChoices] = useState({}) // combo item _id -> chosen option name
  const [quantity, setQuantity] = useState(1)

  // Block background page scroll when any modal/sheet is open
  const isAnyModalOpen = Boolean(
    customizeItem ||
    showQuickMenuModal ||
    showMapModal ||
    showServiceSelector ||
    showStoreModal ||
    showCarModal
  );
  useScrollLock(isAnyModalOpen);

  const getItemAssignedAddons = (item) => {
    if (!item || !Array.isArray(item.toppings) || item.toppings.length === 0) {
      return [];
    }
    return item.toppings.map(t => {
      if (typeof t === 'object' && t && (t._id || t.name)) return t;
      const found = allAddonsList.find(a => (a._id === t || a.id === t || a.name === t));
      return found || (typeof t === 'string' ? { _id: t, name: t, type: 'topping', prices: [] } : t);
    }).filter(Boolean);
  };

  const getAddonPriceForSize = (addon, sizeName = "Regular") => {
    if (!addon) return 0;
    // Hand Tossed / Default crust is always ₹0 by default
    const isHandTossed = addon.isDefault || 
      (addon.name || '').toLowerCase().includes('hand tossed') || 
      addon.name === (customizeItem?.defaultCrust || 'New Hand Tossed');
    if (isHandTossed) {
      return 0;
    }
    if (Array.isArray(addon.prices) && addon.prices.length > 0) {
      const matched = addon.prices.find(p => p.size?.toLowerCase() === sizeName?.toLowerCase());
      if (matched && typeof matched.price === 'number') return matched.price;
      return Number(addon.prices[0].price) || 0;
    }
    const basePrice = Number(addon.price) || 0;
    if (sizeName?.toLowerCase() === 'medium') return basePrice > 0 ? basePrice + 20 : 0;
    if (sizeName?.toLowerCase() === 'large') return basePrice > 0 ? basePrice + 45 : 0;
    return basePrice;
  };

  const currentItemAddons = React.useMemo(() => {
    return getItemAssignedAddons(customizeItem);
  }, [customizeItem, allAddonsList]);

  // Fetch only crust addons for crust customization
  const currentItemCrusts = React.useMemo(() => {
    if (customizeItem && customizeItem.showCrust === false) {
      return [];
    }

    let crusts = [];
    if (customizeItem?.crusts && Array.isArray(customizeItem.crusts) && customizeItem.crusts.length > 0) {
      crusts = customizeItem.crusts
        .map(c => (typeof c === 'object' && c ? c : (allAddonsList || []).find(a => (a._id === c || a.id === c))))
        .filter(Boolean);
    }

    if (crusts.length === 0) {
      const fromProduct = currentItemAddons.filter(a => (a.type || '').toLowerCase().includes('crust'));
      if (fromProduct.length > 0) {
        crusts = fromProduct;
      }
    }

    if (crusts.length === 0) {
      const dbCrusts = (allAddonsList || []).filter(a => (a.type || '').toLowerCase().includes('crust'));
      if (dbCrusts.length > 0) {
        crusts = dbCrusts;
      } else {
        crusts = CRUST_OPTIONS.map(c => ({
          _id: c.name,
          name: c.name,
          type: 'crust',
          description: c.description,
          image: c.image,
          prices: [
            { size: 'Regular', price: c.price },
            { size: 'Medium', price: c.price > 0 ? c.price + 20 : 0 },
            { size: 'Large', price: c.price > 0 ? c.price + 45 : 0 }
          ]
        }));
      }
    }

    const defaultCrustName = (customizeItem?.defaultCrust || "New Hand Tossed").toLowerCase();
    return [...crusts].sort((a, b) => {
      const aName = (a.name || "").toLowerCase();
      const bName = (b.name || "").toLowerCase();
      const aIsDefault = a.isDefault || aName === defaultCrustName || aName.includes("hand tossed");
      const bIsDefault = b.isDefault || bName === defaultCrustName || bName.includes("hand tossed");
      if (aIsDefault && !bIsDefault) return -1;
      if (!aIsDefault && bIsDefault) return 1;
      return 0;
    });
  }, [customizeItem, currentItemAddons, allAddonsList]);

  const currentItemToppings = React.useMemo(() => {
    return currentItemAddons.filter(a => (a.type || '').toLowerCase().includes('topping'));
  }, [currentItemAddons]);

  const currentItemDips = React.useMemo(() => {
    return currentItemAddons.filter(a => !(a.type || '').toLowerCase().includes('crust') && !(a.type || '').toLowerCase().includes('topping'));
  }, [currentItemAddons]);

  const openCustomizeModal = (item) => {
    recordViewedProduct(item);
    setCustomizeItem(item);
    const initialSizes = (item.sizes && item.sizes.length > 0 && typeof item.sizes[0] === 'object')
      ? item.sizes
      : [
          { name: "Regular", price: item.price, description: "Serves 1 person only" }
        ];
    setSelectedSizeOption(initialSizes[0]);

    const defaultCrustName = item.defaultCrust || "New Hand Tossed";
    setSelectedCrust(defaultCrustName);

    setSelectedExtraCheese(false);
    setSelectedMealOptions([]);
    setSelectedToppingsList([]);
    setSelectedComboChoices(
      item.isCombo
        ? Object.fromEntries((item.comboItems || []).filter(it => it.choices.length > 0).map(it => [it._id, it.choices[0].name]))
        : {}
    );
    setQuantity(1);
  };

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }))
  }

  // Debouncing logic for search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery)
    }, 300)
    return () => {
      clearTimeout(handler)
    }
  }, [searchQuery])


  // Sync local location state with global location confirmation changes
  useEffect(() => {
    if (locationConfirmed) {
      setDeliveryAddress(localStorage.getItem("deliveryAddress") || "")
      setTakeawayHut(localStorage.getItem("takeawayHut") || "")
      setCarNumber(localStorage.getItem("carNumber") || "")
    } else {
      setDeliveryAddress("")
      setTakeawayHut("")
      setCarNumber("")
    }
  }, [locationConfirmed])
  const [activeService, setActiveService] = useState(localStorage.getItem("activeService") || "delivery")
  const [toast, setToast] = useState({ visible: false, message: "" })

  const [notifiedCategories, setNotifiedCategories] = useState({})
  const handleToggleNotify = (catName) => {
    const isCurrentlyNotified = Boolean(notifiedCategories[catName])
    setNotifiedCategories(prev => ({
      ...prev,
      [catName]: !isCurrentlyNotified
    }))
    if (!isCurrentlyNotified) {
      triggerToast(`🔔 You're subscribed! We'll alert you when ${catName} items arrive.`)
    } else {
      triggerToast(`Notification removed for ${catName}`)
    }
  }

  // Sync global location modal open state with local modal trigger
  useEffect(() => {
    if (isModalOpen) {
      setShowServiceSelector(true)
    } else {
      setShowServiceSelector(false)
    }
  }, [isModalOpen])

  const triggerToast = (message) => {
    setToast({ visible: true, message })
    setTimeout(() => {
      setToast({ visible: false, message: "" })
    }, 2500)
  }

  useEffect(() => {
    const incoming = getIncomingCategory();
    if (incoming) {
      userManuallySelectedCategoryRef.current = true;
      const resolved = resolveCategoryTab(incoming, categories);
      const targetId = resolved || incoming;
      setActiveTab(targetId);

      const timer = setTimeout(() => {
        const targetEl = document.getElementById(`category-section-${targetId}`);
        if (targetEl) {
          isProgrammaticScrollRef.current = true;
          const stickyHeaderOffset = 100;
          const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = Math.max(0, elementPosition - stickyHeaderOffset);
          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
          setTimeout(() => {
            isProgrammaticScrollRef.current = false;
          }, 700);
        }
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [location.state, location.search, categories]);

  // Smoothly scroll active category tab button into view
  useEffect(() => {
    if (!activeTab) return;
    const timer = setTimeout(() => {
      if (activeTabButtonRef.current) {
        activeTabButtonRef.current.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "center"
        });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [activeTab, categories]);
  const [locationName, setLocationName] = useState(localStorage.getItem("deliveryAddress") || "")
  const [cart, setCart] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("userCart") || "{}")
    } catch (e) {
      return {}
    }
  })

  // Sync cart from localStorage dynamically
  useEffect(() => {
    const handleCartSync = () => {
      try {
        const storedCart = JSON.parse(localStorage.getItem("userCart") || "{}")
        setCart(storedCart)
      } catch (e) {
        setCart({})
      }
    }
    window.addEventListener("cartUpdated", handleCartSync)
    return () => window.removeEventListener("cartUpdated", handleCartSync)
  }, [])


  // Load fonts and icons
  useEffect(() => {
    const linkFonts = document.createElement("link")
    linkFonts.href = "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap"
    linkFonts.rel = "stylesheet"
    document.head.appendChild(linkFonts)

    const linkIcons = document.createElement("link")
    linkIcons.href = "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
    linkIcons.rel = "stylesheet"
    document.head.appendChild(linkIcons)

    // Load active location
    const storedLoc = localStorage.getItem("deliveryAddress")
    if (storedLoc) {
      setLocationName(storedLoc)
      setDeliveryAddress(storedLoc)
    }

    return () => {
      document.head.removeChild(linkFonts)
      document.head.removeChild(linkIcons)
    }
  }, [])

  const addToCart = (item, size = "") => {
    recordViewedProduct(item);
    const key = size ? `${item.id}-${size}` : item.id
    setCart(prev => {
      const existing = prev[key]
      const newQty = existing ? existing.quantity + 1 : 1
      return {
        ...prev,
        [key]: {
          ...item,
          selectedSize: size,
          quantity: newQty
        }
      }
    })

    // Save to global localStorage cart for sync
    const currentLocalCart = JSON.parse(localStorage.getItem("userCart") || "{}")
    currentLocalCart[key] = (currentLocalCart[key] || 0) + 1
    localStorage.setItem("userCart", JSON.stringify(currentLocalCart))

    // Dispatch event to trigger Home basket recalculation
    window.dispatchEvent(new Event("cartUpdated"))
  }

  const calculateTotalPrice = () => {
    if (!customizeItem) return 0;
    let base = Number(selectedSizeOption.price) || Number(customizeItem.price) || 0;

    // Add selected crust price
    const matchedCrust = currentItemCrusts.find(c => c.name === selectedCrust);
    if (matchedCrust) {
      base += getAddonPriceForSize(matchedCrust, selectedSizeOption.name);
    }

    if (selectedExtraCheese) base += 65;

    // Add selected toppings
    selectedToppingsList.forEach(opt => {
      const matched = currentItemToppings.find(t => t.name === opt);
      if (matched) {
        base += getAddonPriceForSize(matched, selectedSizeOption.name);
      } else {
        base += 45;
      }
    });

    // Add selected dips / meal extras
    selectedMealOptions.forEach(opt => {
      const matched = currentItemDips.find(d => d.name === opt);
      if (matched) {
        base += getAddonPriceForSize(matched, selectedSizeOption.name);
      } else {
        base += 30;
      }
    });

    return base * (quantity || 1);
  };

  // Human-readable list of what the chosen meal contains, e.g. "Classic Margherita (Regular), 2 x Aloo Tikki Taco, Coke"
  const describeComboSelection = (item) =>
    (item.comboItems || []).map(it => {
      const label = it.choices.length > 0 ? (selectedComboChoices[it._id] || it.choices[0].name) : it.name;
      const size = it.choices.find(ch => ch.name === label)?.size ?? it.size;
      return `${it.quantity > 1 ? `${it.quantity} x ` : ""}${label}${size ? ` (${size})` : ""}`;
    }).join(", ");

  const addCustomizedToCart = () => {
    if (customizeItem.isCombo && !customizeItem.availableNow) {
      triggerToast(customizeItem.availabilityLabel || "This meal is not available right now");
      return;
    }

    const toppingsKey = selectedToppingsList.sort().join("-");
    const mealsKey = selectedMealOptions.sort().join("-");
    const key = customizeItem.isCombo
      ? `${customizeItem.id}-meal-${Object.keys(selectedComboChoices).sort().map(k => selectedComboChoices[k]).join("-")}`
      : `${customizeItem.id}-${selectedSizeOption.name}-${selectedCrust}-${selectedExtraCheese ? 'cheese' : 'no'}-${toppingsKey}-${mealsKey}`;

    const customizedItemDetails = customizeItem.isCombo ? {
      ...customizeItem,
      id: customizeItem.id,
      title: customizeItem.title,
      price: calculateTotalPrice() / quantity,
      description: describeComboSelection(customizeItem),
      customized: true,
      selectedSize: "",
      comboChoices: selectedComboChoices
    } : {
      ...customizeItem,
      id: customizeItem.id,
      title: `${customizeItem.title} (${selectedSizeOption.name})`,
      price: calculateTotalPrice() / quantity, // Price per unit
      description: `Size: ${selectedSizeOption.name}${selectedCrust ? ', Crust: ' + selectedCrust : ''}${selectedToppingsList.length > 0 ? ', Toppings: ' + selectedToppingsList.join(', ') : ''}${selectedMealOptions.length > 0 ? ', Extras: ' + selectedMealOptions.join(', ') : ''}`,
      customized: true,
      selectedSize: selectedSizeOption.name,
      toppings: selectedToppingsList,
      meals: selectedMealOptions,
      crust: selectedCrust,
      extraCheese: selectedExtraCheese
    };

    // Persist the full line spec so Cart.jsx resolves the exact price / selections (same contract as Home)
    try {
      const customMap = JSON.parse(localStorage.getItem("pvp_customized_items") || "{}")
      customMap[key] = customizedItemDetails
      localStorage.setItem("pvp_customized_items", JSON.stringify(customMap))
    } catch (_) {}

    setCart(prev => {
      const existing = prev[key]
      const newQty = existing ? existing.quantity + quantity : quantity
      return {
        ...prev,
        [key]: {
          ...customizedItemDetails,
          quantity: newQty
        }
      }
    })
    
    // Save to localStorage
    const currentLocalCart = JSON.parse(localStorage.getItem("userCart") || "{}")
    currentLocalCart[key] = (currentLocalCart[key] || 0) + quantity
    localStorage.setItem("userCart", JSON.stringify(currentLocalCart))
    
    window.dispatchEvent(new Event("cartUpdated"))
    setCustomizeItem(null)
    triggerToast(`Added ${customizeItem.title} to cart!`)
  }

  const totalCartCount = Object.values(cart).reduce((sum, item) => sum + item.quantity, 0)
  const totalCartPrice = Object.values(cart).reduce((sum, item) => sum + (item.price * item.quantity), 0)

  // Helper to safely parse numeric price
  const getNumericPrice = (item) => {
    if (typeof item.price === "number") return item.price;
    const num = parseFloat(String(item.price || 0).replace(/[^\d.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  // Helper to safely parse numeric rating
  const getNumericRating = (item) => {
    if (typeof item.rating === "number") return item.rating;
    const num = parseFloat(String(item.rating || 0).replace(/[^\d.]/g, ""));
    return isNaN(num) ? 0 : num;
  };

  // Helper to reliably find products for a category regardless of how keys were stored
  const getRawItemsForCategory = useCallback((cat) => {
    if (!currentMenuItems || !cat) return [];

    const keysToTry = [
      cat.id,
      cat._id ? String(cat._id) : null,
      cat.slug,
      cat.label,
      cat.name,
      cat.label ? cat.label.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : null,
      cat.name ? cat.name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-') : null,
      cat.label ? cat.label.toLowerCase().trim() : null,
      cat.name ? cat.name.toLowerCase().trim() : null,
    ].filter(Boolean);

    // 1. Direct key match
    for (const key of keysToTry) {
      const list = currentMenuItems[key];
      if (Array.isArray(list) && list.length > 0) return list;
    }

    // 2. Normalized key match
    const currentKeys = Object.keys(currentMenuItems);
    for (const key of keysToTry) {
      const target = String(key).toLowerCase().trim().replace(/[^a-z0-9]/g, '');
      const foundKey = currentKeys.find(k => String(k).toLowerCase().trim().replace(/[^a-z0-9]/g, '') === target);
      if (foundKey) {
        const list = currentMenuItems[foundKey];
        if (Array.isArray(list) && list.length > 0) return list;
      }
    }

    return [];
  }, [currentMenuItems]);

  // Filter and sort menu items for all categories (continuous scroll feed)
  const categorySections = useMemo(() => {
    return categories.map((cat) => {
      const rawItems = getRawItemsForCategory(cat);
      const items = rawItems.filter((item) => {
        if (isVegOnly && item.isVeg === false) {
          return false;
        }
        const titleMatch = item.title?.toLowerCase().includes(debouncedQuery.toLowerCase());
        const descMatch = item.description?.toLowerCase().includes(debouncedQuery.toLowerCase());
        return !debouncedQuery || titleMatch || descMatch;
      }).sort((a, b) => {
        if (sortBy === "price_asc") return getNumericPrice(a) - getNumericPrice(b);
        if (sortBy === "price_desc") return getNumericPrice(b) - getNumericPrice(a);
        if (sortBy === "rating") return getNumericRating(b) - getNumericRating(a);
        return 0;
      });

      // Deduplicate items by unique key if needed
      const uniqueItems = [];
      const seenIds = new Set();
      for (const it of items) {
        const itKey = it.id || it._id || it.title;
        if (!seenIds.has(itKey)) {
          seenIds.add(itKey);
          uniqueItems.push(it);
        }
      }

      return {
        category: cat,
        items: uniqueItems,
        totalRaw: rawItems.length
      };
    });
  }, [categories, getRawItemsForCategory, isVegOnly, debouncedQuery, sortBy]);

  // Only sections that contain items matching current filters/search
  const categorySectionsWithItems = useMemo(() => {
    return categorySections.filter((section) => section.items.length > 0);
  }, [categorySections]);

  const totalFilteredCount = useMemo(() => {
    return categorySectionsWithItems.reduce((acc, curr) => acc + curr.items.length, 0);
  }, [categorySectionsWithItems]);

  const activeCategoryObj = categories.find(c => c.id === activeTab || String(c._id) === activeTab);
  const activeCategoryName = activeCategoryObj?.label || (typeof activeTab === 'string' ? activeTab.replace(/-/g, ' ') : "this category");

  const otherCategoriesWithItems = useMemo(() => {
    return categories.filter(c => {
      if (c.id === activeTab || String(c._id) === activeTab) return false;
      const items = currentMenuItems[c.id] || (c._id && currentMenuItems[String(c._id)]) || [];
      return Array.isArray(items) && items.length > 0;
    });
  }, [categories, activeTab, currentMenuItems]);

  const firstCategoryWithItems = useMemo(() => {
    return otherCategoriesWithItems[0] || (categorySectionsWithItems[0]?.category) || null;
  }, [otherCategoriesWithItems, categorySectionsWithItems]);

  // Keep refs in sync for scrollspy window listener
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  useEffect(() => {
    categorySectionsWithItemsRef.current = categorySectionsWithItems;
  }, [categorySectionsWithItems]);

  // Smooth scroll handler when a category tab is clicked
  const handleCategoryTabClick = (catId) => {
    userManuallySelectedCategoryRef.current = true;
    setActiveTab(catId);

    const targetEl = document.getElementById(`category-section-${catId}`);
    if (targetEl) {
      isProgrammaticScrollRef.current = true;
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);

      const stickyHeaderOffset = 100;
      const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = Math.max(0, elementPosition - stickyHeaderOffset);

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });

      scrollTimeoutRef.current = setTimeout(() => {
        isProgrammaticScrollRef.current = false;
      }, 700);
    } else {
      isProgrammaticScrollRef.current = false;
    }
  };

  const modalTextPrimary = isDarkMode ? "text-white" : "text-zinc-900"
  const modalTextSecondary = isDarkMode ? "text-zinc-400" : "text-zinc-500"
  const modalLabelMuted = isDarkMode ? "text-white/50" : "text-zinc-400 font-bold"
  const modalCheckboxText = isDarkMode ? "text-white/80" : "text-zinc-750 font-semibold"
  const modalBorder = isDarkMode ? "border-white/10" : "border-zinc-200"

  return (
    <div className={`min-h-screen flex justify-center transition-colors duration-300 ${isDarkMode ? "bg-[#0a0a0a]" : "bg-[#F8F6F2]"}`}>
      <div className={`page-wrapper w-full max-w-md min-h-screen pb-32 font-body-md overflow-x-clip relative shadow-2xl border-x ${
        isDarkMode ? "border-zinc-800/40" : "border-gray-200/50"
      }`} style={{ backgroundColor: isDarkMode ? "#111111" : "#F8F6F2", color: isDarkMode ? "#e5e2e1" : "#1c1b1b" }}>
      {/* CSS overrides to keep design exact */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .glass-card {
          background: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(255, 255, 255, 0.92)"} !important;
          backdrop-filter: blur(20px) !important;
          border: 1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(229, 57, 53, 0.16)"} !important;
          box-shadow: ${isDarkMode ? "none" : "0 10px 30px -5px rgba(229, 57, 53, 0.08), 0 4px 16px -4px rgba(0, 0, 0, 0.06)"} !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }
        .glass-card:hover {
          box-shadow: ${isDarkMode ? "none" : "0 20px 40px -8px rgba(229, 57, 53, 0.16), 0 10px 20px -6px rgba(0, 0, 0, 0.08)"} !important;
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(229, 57, 53, 0.3)"} !important;
          transform: translateY(-2px) !important;
        }
        fieldset.glass-card {
          display: block !important;
          margin: 0 0 16px 0 !important;
          min-width: 0 !important;
          width: 100% !important;
          box-sizing: border-box !important;
        }
        .hide-scrollbar::-webkit-scrollbar { display: none !important; }
        .hide-scrollbar { -ms-overflow-style: none !important; scrollbar-width: none !important; }
        
        .font-headline-lg-mobile {
          font-family: 'Poppins', sans-serif !important;
          font-weight: 600 !important;
          font-size: 20px !important;
          line-height: 1.3 !important;
        }
        .font-body-md {
          font-family: 'Poppins', sans-serif !important;
          font-size: 16px !important;
          line-height: 24px !important;
          font-weight: 400 !important;
        }
        .font-label-sm {
          font-family: 'Poppins', sans-serif !important;
          font-size: 12px !important;
          line-height: 16px !important;
          font-weight: 600 !important;
          letter-spacing: 0.04em !important;
        }
        
        .veg-box {
          border: 2px solid #00C853;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .veg-circle {
          background-color: #00C853;
          border-radius: 50%;
          width: 6px;
          height: 6px;
        }
        .text-primary {
          color: #E53935 !important;
        }
        .bg-primary {
          background-color: #E53935 !important;
        }
        .text-on-primary {
          color: #ffffff !important;
        }
        
        .bg-surface\/80 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.8)" : "rgba(255, 255, 255, 0.8)"} !important;
        }
        .bg-surface\/85 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.85)" : "rgba(255, 255, 255, 0.85)"} !important;
        }
        .bg-surface\/90 {
          background-color: ${isDarkMode ? "rgba(19, 19, 19, 0.9)" : "rgba(255, 255, 255, 0.9)"} !important;
        }
        .bg-surface {
          background-color: ${isDarkMode ? "#131313" : "#ffffff"} !important;
        }
        .border-white\/10 {
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.08)"} !important;
        }
        .border-white\/12 {
          border-color: ${isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.1)"} !important;
        }
        .bg-white\/5 {
          background-color: ${isDarkMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.04)"} !important;
        }
        .text-white\/70 {
          color: ${isDarkMode ? "rgba(255, 255, 255, 0.7)" : "rgba(19, 19, 19, 0.7)"} !important;
        }
        .text-white\/50 {
          color: ${isDarkMode ? "rgba(255, 255, 255, 0.5)" : "rgba(19, 19, 19, 0.5)"} !important;
        }
        .bg-black\/40 {
          background-color: ${isDarkMode ? "rgba(0, 0, 0, 0.4)" : "rgba(255, 255, 255, 0.5)"} !important;
        }
        
        @keyframes slideUp {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        .slide-up-modal {
          animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        `
      }} />

      {/* Custom Toast Alert */}
      {toast.visible && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-55 bg-[#E53935] text-white px-6 py-3 rounded-full shadow-2xl glass-card font-label-sm text-xs border border-white/20 animate-bounce">
          {toast.message}
        </div>
      )}

      {/* ── TOP STICKY CONTAINER (Header + Filters + Category Tabs) ── */}
      <div className={`sticky top-0 z-45 bg-[#F8F6F2] dark:bg-[#111111] border-b border-zinc-200 dark:border-zinc-800 transition-all duration-200 ${
        isScrolled ? "shadow-md" : "shadow-xs"
      }`}>
        
        {/* Row 1: Back + Menu Title + Search Bar + Compact Filters (when scrolled) */}
        <div className="px-3.5 sm:px-4 pt-3 pb-2.5 flex items-center gap-2 sm:gap-2.5">
          {/* Back Navigation & Menu Title (Visible at top, smoothly hides when scrolled) */}
          <div className={`flex items-center gap-2 overflow-hidden transition-all duration-300 shrink-0 ${
            isScrolled 
              ? "max-w-0 opacity-0 -mr-2 pointer-events-none" 
              : "max-w-[140px] opacity-100"
          }`}>
            <button
              onClick={() => navigate('/user')}
              className="p-1.5 -ml-1 text-gray-800 dark:text-white hover:bg-black/5 dark:hover:bg-zinc-800 rounded-full transition-colors flex items-center justify-center bg-transparent border-0 outline-none cursor-pointer"
              aria-label="Go back to user home"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
            </button>
            
            <h1 
              className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-gray-100 shrink-0 tracking-normal"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              Menu
            </h1>
          </div>

          {/* Search in menu input (Expands to full width on left when back/menu hides) */}
          <div 
            onClick={() => setIsSearchOverlayOpen(true)}
            className="flex-1 min-w-0 relative cursor-pointer"
          >
            <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              readOnly
              onClick={() => setIsSearchOverlayOpen(true)}
              onFocus={(e) => {
                e.target.blur();
                setIsSearchOverlayOpen(true);
              }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search in menu..."
              style={{ fontFamily: "'Poppins', sans-serif" }}
              className="w-full h-10 pl-10 pr-9 bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 focus:border-[var(--accent-red,#EE3A43)] dark:focus:border-[var(--accent-red,#EE3A43)] rounded-xl text-xs sm:text-sm font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 outline-none transition-all shadow-xs cursor-pointer"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSearchQuery("");
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 bg-transparent border-0 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Compact Action Buttons on Right (Appears when scrolled, matching Image 2 & 3) */}
          <div className={`flex items-center gap-1.5 overflow-hidden transition-all duration-300 shrink-0 ${
            isScrolled 
              ? "max-w-[120px] opacity-100 ml-0.5" 
              : "max-w-0 opacity-0 -ml-2 pointer-events-none"
          }`}>
            {/* Compact Veg Only Button */}
            {menuFilters.vegOnly?.enabled !== false && (
              <button
                type="button"
                onClick={() => setIsVegOnly(!isVegOnly)}
                title={isVegOnly ? "Show All items" : "Show Veg Only"}
                className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                  isVegOnly
                    ? "bg-green-50 dark:bg-green-950/40 border-green-600 text-green-700 shadow-xs ring-1 ring-green-600/30"
                    : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 hover:border-zinc-400"
                }`}
              >
                <span className="w-4 h-4 border-[1.5px] border-green-600 p-[1.5px] rounded-[3px] flex items-center justify-center bg-transparent">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 block" />
                </span>
              </button>
            )}

            {/* Compact Sort Button */}
            {menuFilters.sortBy?.enabled !== false && (
              <div className="relative" ref={compactSortMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  title="Sort Menu"
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all cursor-pointer shadow-xs ${
                    sortBy !== "default"
                      ? "border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/30 ring-1 ring-red-500/30"
                      : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:border-zinc-400"
                  }`}
                >
                  <ArrowUpDown className="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
                </button>

                {/* Dropdown for compact sort */}
                {isScrolled && showSortMenu && (
                  <div className="absolute right-0 top-full mt-1.5 w-44 bg-[#F8F6F2] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { id: "default", label: "Recommended" },
                      { id: "price_asc", label: "Price: Low to High" },
                      { id: "price_desc", label: "Price: High to Low" },
                      { id: "rating", label: "Rating: High to Low" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id);
                          setShowSortMenu(false);
                        }}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                        className={`w-full px-3 py-2 text-left text-xs font-normal flex items-center justify-between hover:bg-black/5 dark:hover:bg-zinc-800 cursor-pointer border-0 ${
                          sortBy === opt.id
                            ? "text-red-600 dark:text-red-400 font-medium bg-red-50/50 dark:bg-red-950/20"
                            : "text-gray-700 dark:text-gray-300 bg-transparent"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-red-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Expanded Filters (Visible only when at top / !isScrolled) */}
        {(menuFilters.vegOnly?.enabled !== false || menuFilters.sortBy?.enabled !== false) && (
          <div className={`px-3.5 sm:px-4 flex items-center gap-2 relative overflow-hidden transition-all duration-300 ${
            isScrolled 
              ? "max-h-0 opacity-0 pb-0 pointer-events-none" 
              : "max-h-12 opacity-100 pb-3"
          }`}>
            {/* Veg Only Button */}
            {menuFilters.vegOnly?.enabled !== false && (
              <button
                type="button"
                onClick={() => setIsVegOnly(!isVegOnly)}
                style={{ fontFamily: "'Poppins', sans-serif" }}
                className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-xs ${
                  isVegOnly
                    ? "bg-green-50 dark:bg-green-950/30 border-green-600 text-green-700 dark:text-green-400 ring-1 ring-green-600/20"
                    : "bg-white hover:bg-zinc-50 dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300"
                }`}
              >
                {/* Green Veg Indicator icon */}
                <span className="w-3.5 h-3.5 border border-green-600 p-[1.5px] rounded-[3px] flex items-center justify-center bg-transparent">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 block" />
                </span>
                <span>{menuFilters.vegOnly?.label || "Veg Only"}</span>
              </button>
            )}

            {/* Sort By Button */}
            {menuFilters.sortBy?.enabled !== false && (
              <div className="relative" ref={sortMenuRef}>
                <button
                  type="button"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  className={`h-9 px-3 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                    sortBy !== "default"
                      ? "border-red-500 text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20 ring-1 ring-red-500/20"
                      : "border-zinc-300 dark:border-zinc-700 bg-white hover:bg-zinc-50 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                  }`}
                >
                  <span>{menuFilters.sortBy?.label || "Sort by"}</span>
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {/* Sort Dropdown when not scrolled */}
                {!isScrolled && showSortMenu && (
                  <div className="absolute left-0 top-full mt-1.5 w-44 bg-[#F8F6F2] dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {[
                      { id: "default", label: "Recommended" },
                      { id: "price_asc", label: "Price: Low to High" },
                      { id: "price_desc", label: "Price: High to Low" },
                      { id: "rating", label: "Rating: High to Low" },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setSortBy(opt.id);
                          setShowSortMenu(false);
                        }}
                        style={{ fontFamily: "'Poppins', sans-serif" }}
                        className={`w-full px-3 py-2 text-left text-xs font-normal flex items-center justify-between hover:bg-black/5 dark:hover:bg-zinc-800 cursor-pointer border-0 ${
                          sortBy === opt.id
                            ? "text-red-600 dark:text-red-400 font-medium bg-red-50/50 dark:bg-red-950/20"
                            : "text-gray-700 dark:text-gray-300 bg-transparent"
                        }`}
                      >
                        <span>{opt.label}</span>
                        {sortBy === opt.id && <Check className="w-3.5 h-3.5 text-red-600" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Row 3: Horizontal Categories Tabs */}
        <div className="flex items-center overflow-x-auto hide-scrollbar px-3 border-t border-zinc-200/80 dark:border-zinc-800 bg-[#F8F6F2] dark:bg-[#111111]">
          {categories.map((cat, idx) => {
            const isActive = activeTab === cat.id || String(cat._id) === activeTab;
            return (
              <button
                key={cat._id || `${cat.id}-${idx}`}
                ref={isActive ? activeTabButtonRef : null}
                type="button"
                onClick={() => handleCategoryTabClick(cat.id)}
                className="flex flex-col items-center pt-2 px-3.5 shrink-0 transition-colors group cursor-pointer relative bg-transparent border-0 outline-none"
              >
                {/* Badge Tag */}
                {cat.badge ? (
                  <span className="text-[9px] font-bold text-white bg-[#E53935] px-2 py-0.5 rounded-full uppercase leading-none tracking-tight mb-1 shadow-xs whitespace-nowrap">
                    {cat.badge}
                  </span>
                ) : (
                  <span className="h-4 block" />
                )}

                {/* Category Title */}
                <span 
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                  className={`whitespace-nowrap pb-2 transition-all ${
                    isActive
                      ? "text-sm font-bold text-zinc-950 dark:text-white"
                      : "text-xs font-normal text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-800"
                  }`}
                >
                  {cat.label || cat.name || cat.id}
                </span>

                {/* Red Underline Active Indicator */}
                {isActive && (
                  <div className="h-[3px] bg-[#E53935] w-full rounded-full transition-all" />
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Campaign Promise Slider (Superadmin dynamic) - Full Width */}
      {campaigns.length > 0 && (
        <div 
          onClick={() => navigate('/user/promise')}
          className="w-full bg-[#F8F6F2] dark:bg-[#18181a] py-3.5 px-4 border-b border-zinc-200/60 dark:border-zinc-800 shadow-xs transition-all hover:bg-[#f3ece4] dark:hover:bg-[#1f1f23] cursor-pointer group"
          role="button"
          tabIndex={0}
          title="Click to view Papa Veg Promise details"
        >
          <div className="max-w-xl mx-auto relative text-center">
            {/* Campaign Promise Heading - STATIC SINGLE LINE (Does NOT slide) */}
            <div className="flex items-center justify-center gap-1.5 mb-1 group-hover:scale-[1.01] transition-transform whitespace-nowrap overflow-hidden">
              <span className="text-[var(--primary,#EE3A43)] font-black text-lg md:text-xl tracking-tight flex items-center gap-1 font-sans truncate">
                {promiseHeaderTitle || "Papa Veg Promise"}
              </span>
            </div>
            
            {/* Subtle accent underline */}
            <div className="w-24 h-[2.5px] bg-[#70e000] mx-auto rounded-full mb-2 shadow-xs" />

            {/* Tagline / Promise text - THIS IS THE ONLY PART THAT SLIDES */}
            <div className="overflow-hidden min-h-[20px] flex items-center justify-center">
              <p 
                key={activeCampaignIndex}
                className="text-gray-800 dark:text-gray-200 text-xs sm:text-sm font-bold tracking-tight px-4 line-clamp-1 transition-opacity duration-300"
              >
                {renderFormattedText(campaigns[activeCampaignIndex]?.tagline || "Where **quality food** meets **honest prices**!")}
              </p>
            </div>

            {/* Carousel Dot Indicators - changed active dot to #70e000 (3rd image update) */}
            <div className="flex items-center justify-center gap-1.5 mt-2.5">
              {campaigns.map((_, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCampaignIndex(idx);
                  }}
                  className={`transition-all rounded-full border-0 p-0 cursor-pointer ${
                    activeCampaignIndex === idx 
                      ? "w-2.5 h-2.5 bg-[#70e000] shadow-xs" 
                      : "w-2 h-2 bg-gray-300 dark:bg-zinc-700 hover:bg-gray-400"
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Categories Layout container */}
      <main className="w-full pt-0 pb-10">
        {totalFilteredCount === 0 ? (
          <div className="py-12 sm:py-16 px-4 flex flex-col items-center justify-center text-center select-none w-full max-w-sm mx-auto animate-fade-in" style={{ fontFamily: "'Poppins', sans-serif" }}>
            {/* Beautiful Modern Line-Art Illustration with Soft Organic Blush Blobs (inspired by Reference 2) */}
            <div className="w-60 h-48 sm:w-68 sm:h-52 relative flex items-center justify-center mb-5">
              <svg viewBox="0 0 280 230" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-sm">
                {/* Soft Organic Blush Blobs */}
                <path d="M196,28 C238,12 272,46 264,90 C256,132 214,146 188,124 C162,102 154,44 196,28 Z" fill="#FFEAE8" className="dark:opacity-25" />
                <path d="M38,120 C70,98 106,124 98,164 C90,204 44,216 24,188 C4,160 8,132 38,120 Z" fill="#FFF0F0" className="dark:opacity-20" />
                
                <g stroke="var(--accent-red, #EE3A43)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  {/* DRINK CUP (LEFT) */}
                  {/* Straw with stripes */}
                  <path d="M78 78 L78 46 L96 34" fill="none" />
                  <line x1="78" y1="56" x2="84" y2="52" strokeWidth="2.5" />
                  <line x1="78" y1="65" x2="85" y2="60" strokeWidth="2.5" />
                  
                  {/* Cup Lid */}
                  <rect x="52" y="78" width="52" height="10" rx="5" fill="white" className="dark:fill-zinc-900" />
                  
                  {/* Cup Body */}
                  <path d="M57 88 L65 168 C65.5 173 70 177 75 177 L89 177 C94 177 98.5 173 99 168 L107 88 Z" fill="white" className="dark:fill-zinc-900" />
                  
                  {/* Cup Details */}
                  <line x1="60" y1="112" x2="104" y2="112" strokeWidth="2" strokeDasharray="4 3" />
                  <circle cx="82" cy="138" r="9" fill="white" className="dark:fill-zinc-900" strokeWidth="2.2" />
                  <path d="M78 137 Q82 142 86 137" fill="none" strokeWidth="2" />

                  {/* STEAMING PIZZA SLICE (RIGHT) */}
                  {/* Aroma Steam Curls */}
                  <path d="M166 56 C170 46 164 38 168 28" fill="none" strokeWidth="2.5" />
                  <path d="M188 64 C192 54 186 46 190 36" fill="none" strokeWidth="2.5" />
                  <path d="M210 58 C214 50 208 42 212 32" fill="none" strokeWidth="2.5" />

                  {/* Pizza Slice Body */}
                  <path d="M130 96 C144 89 204 89 224 96 C229 98 231 104 227 109 L181 184 C179 188 173 188 170 184 L125 109 C122 104 124 98 130 96 Z" fill="white" className="dark:fill-zinc-900" />
                  
                  {/* Crust Rim line */}
                  <path d="M134 107 C150 101 200 101 219 107" fill="none" strokeWidth="2.5" />

                  {/* Delicious Toppings */}
                  <circle cx="160" cy="136" r="5.5" fill="white" className="dark:fill-zinc-900" strokeWidth="2.5" />
                  <circle cx="190" cy="128" r="5" fill="white" className="dark:fill-zinc-900" strokeWidth="2.5" />
                  <circle cx="177" cy="162" r="4.5" fill="white" className="dark:fill-zinc-900" strokeWidth="2.5" />

                  {/* Veggie & Basil Marks */}
                  <path d="M172 116 Q182 114 185 120" fill="none" strokeWidth="2.2" />
                  <path d="M146 122 Q154 120 152 126" fill="none" strokeWidth="2.2" />
                  <path d="M202 142 Q208 148 202 152" fill="none" strokeWidth="2.2" />

                  {/* Melting Cheese drop */}
                  <path d="M168 180 Q170 188 173 182" fill="none" strokeWidth="2" />

                  {/* Ground Table Accent Lines */}
                  <line x1="36" y1="198" x2="244" y2="198" strokeWidth="3" />
                  <line x1="92" y1="208" x2="188" y2="208" strokeWidth="2.5" />
                </g>
              </svg>
            </div>

            {/* Clean Title (Medium Weight, Not Bold) */}
            <h3 className="text-base sm:text-lg font-medium text-[var(--accent-red,#EE3A43)] leading-snug">
              {searchQuery
                ? `No Dishes Found`
                : `Fresh Dishes Coming Soon !`}
            </h3>

            {/* Short Quote / Description */}
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-[280px] leading-relaxed font-normal">
              {searchQuery
                ? `“We couldn't find any dish matching '${searchQuery}'. Discover our other favorites!”`
                : `“We are handcrafting fresh recipes for you. Delicious options await!”`}
            </p>

            {/* Single Rounded Red Pill Action Button */}
            <button
              type="button"
              onClick={() => {
                if (searchQuery) {
                  setSearchQuery("");
                } else if (firstCategoryWithItems) {
                  handleCategoryTabClick(firstCategoryWithItems.id);
                }
              }}
              className="mt-6 w-full max-w-[210px] py-3 px-6 bg-[var(--accent-red,#EE3A43)] hover:bg-[#d92d36] active:scale-95 text-white text-xs font-medium tracking-wider rounded-full shadow-sm hover:shadow transition-all cursor-pointer border-0 uppercase"
            >
              {searchQuery
                ? "Clear Search"
                : firstCategoryWithItems
                ? `Explore Menu`
                : "Explore Menu"}
            </button>
          </div>
        ) : (
          categorySectionsWithItems.map(({ category, items }) => (
            <div
              key={category._id || category.id}
              id={`category-section-${category.id}`}
              className="w-full scroll-mt-24"
            >
              {/* Category Section Divider Header (Matches Domino's screenshot media_1792050211697_9dee3bdf.png) */}
              <div className="flex items-center justify-center py-5 sm:py-6 px-4 select-none">
                <div className="flex-1 h-[1.5px] bg-zinc-300 dark:bg-zinc-700 max-w-[130px]"></div>
                <h2 
                  className="px-4 text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight leading-none"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  {category.label || category.name || (typeof category.id === 'string' ? category.id.replace(/-/g, ' ') : category.id)}
                </h2>
                <div className="flex-1 h-[1.5px] bg-zinc-300 dark:bg-zinc-700 max-w-[130px]"></div>
              </div>

              {/* Menu list grid - Domino's full width cards with modern sleek spacing */}
              <section className="flex flex-col w-full gap-5 sm:gap-6">
                {items.map((item) => {
                  const hasDiscount = Boolean(item.originalPrice && Number(item.originalPrice) > Number(item.price) && (Number(item.saveAmount) > 0 || (Number(item.originalPrice) - Number(item.price)) > 0));
                  const saveAmount = hasDiscount ? (item.saveAmount || (Number(item.originalPrice) - Number(item.price))) : 0;
                  const toppingsLine = item.toppingsSummary || item.description || "";

                  return (
                    <div 
                      key={item.id} 
                      onClick={() => checkLocation(() => openCustomizeModal(item))}
                      className="relative w-full overflow-hidden flex flex-col justify-end min-h-[330px] sm:min-h-[360px] aspect-[4/3.2] bg-zinc-950 group shadow-sm transition-all duration-300 cursor-pointer"
                    >
                      {/* Full-bleed Product Image covering entire card */}
                      {item.image && (
                        <img
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          alt={item.title}
                          src={item.image}
                          loading="lazy"
                        />
                      )}

                      {/* Top Badges - strictly dynamic from Superadmin */}
                      {Boolean(item.badge && item.badge.trim()) && (
                        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
                          <span className="bg-[#E53935] text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full tracking-wider shadow-sm">
                            {item.badge}
                          </span>
                        </div>
                      )}

                      {/* Meal availability window (e.g. Lunch Treats 11 AM - 4 PM) */}
                      {item.isCombo && item.availabilityLabel && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full shadow-sm backdrop-blur-sm ${item.availableNow ? "bg-white/90 text-zinc-800" : "bg-black/70 text-amber-300"}`}>
                            <span className="material-symbols-outlined" style={{ fontSize: 13 }}>schedule</span>
                            {item.availabilityLabel.replace(/^Available /, "")}
                          </span>
                        </div>
                      )}

                      {/* Title + description sit on the image; price / variant / Add live in a solid footer bar */}
                      <div className="relative z-10 w-full bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-16 pb-3 px-4 text-left">
                        <div className="flex items-center gap-2">
                          <span className="veg-box scale-90 shrink-0 shadow-xs">
                            <span className="veg-circle"></span>
                          </span>
                          <h3 className="text-white text-lg sm:text-xl font-semibold leading-snug drop-shadow-md font-['Poppins',sans-serif]">
                            {item.title}
                          </h3>
                        </div>

                        {toppingsLine && (
                          <p className="text-zinc-200 text-[13px] mt-1.5 line-clamp-2 leading-snug font-normal font-['Poppins',sans-serif] drop-shadow-sm">
                            {toppingsLine}
                          </p>
                        )}
                      </div>

                      <div className="relative z-10 w-full bg-gradient-to-b from-[#4a4a4d] via-[#2b2b2d] to-[#0e0e0f] border-t border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] px-4 py-3 text-left">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex flex-col gap-1.5 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-white font-bold text-xl font-['Poppins',sans-serif]">
                                ₹{item.price}
                              </span>
                              {hasDiscount && (
                                <>
                                  <span className="text-zinc-400 line-through text-sm font-medium">
                                    ₹{item.originalPrice}
                                  </span>
                                  <span className="bg-[#169B45] text-white text-[11px] font-semibold pl-2.5 pr-2 py-0.5 rounded-[3px] border border-[#2fbf64] whitespace-nowrap">
                                    Save ₹{saveAmount}
                                  </span>
                                </>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                checkLocation(() => openCustomizeModal(item));
                              }}
                              className="flex flex-col items-start w-full max-w-[210px] cursor-pointer text-left select-none bg-transparent border-0 p-0"
                            >
                              <span className="flex items-center gap-1 text-xs sm:text-[13px] text-white font-medium pb-1">
                                {item.isCombo
                                  ? ((item.comboItems || []).some(it => it.choices.length > 0) ? "Choose your items" : "View meal items")
                                  : `Regular | ${item.defaultCrust || "New Hand Tossed"}`}
                                <ChevronRight size={13} className="text-white shrink-0" />
                              </span>
                              <span className="w-full border-b-[1.5px] border-dashed border-white/80"></span>
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              checkLocation(() => openCustomizeModal(item));
                            }}
                            className="shrink-0 h-11 px-6 bg-[var(--accent-red,#EE3A43)] hover:opacity-95 active:scale-95 text-white font-semibold text-lg rounded-lg transition-all cursor-pointer flex items-center gap-1.5 select-none font-['Poppins',sans-serif] border-0"
                          >
                            <span>Add</span>
                            <span className="text-xl leading-none">+</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </section>
            </div>
          ))
        )}
      </main>

      {/* Floating Modern Customization Sheet (matching Reference Image 2) */}
      {customizeItem && (
        <div 
          onClick={() => setCustomizeItem(null)}
          className="fixed inset-0 z-55 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm touch-none"
        >
          {/* Modal Container */}
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#18181a] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col max-h-[85vh] sm:max-h-[90vh] overflow-hidden transition-colors duration-300 slide-up-modal font-['Poppins',sans-serif] touch-auto"
          >
            
            {/* Header: Sticky Top with Veg Icon, Title, Toppings summary, and Close button */}
            <div className="bg-white dark:bg-[#1f1f22] px-5 py-4 flex items-start justify-between border-b border-zinc-200/70 dark:border-white/5 shrink-0 select-none">
              <div className="flex items-start gap-2.5 text-left min-w-0 pr-2">
                <span className="veg-box scale-90 shrink-0 mt-1">
                  <span className="veg-circle"></span>
                </span>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-zinc-900 dark:text-white truncate">
                    {customizeItem.title}
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-1 font-medium">
                    {customizeItem.toppingsSummary || customizeItem.description || "Toppings: Mozzarella Cheese • Fresh Herbs"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCustomizeItem(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer bg-transparent border-0 outline-none transition-colors shrink-0"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Content Area */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-5 space-y-5 text-left">
              
              {/* Meal (combo) contents & choices - replaces size / crust / toppings for Meal for 1 / 2 / 4 items */}
              {customizeItem.isCombo && (
                <>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2.5">
                      What's in your meal
                    </h4>
                    <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-3 shadow-xs border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                      {(customizeItem.comboItems || []).map(it => (
                        <div key={it._id} className="flex items-center justify-between py-2.5 first:pt-1 last:pb-1">
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="veg-box scale-75 shrink-0">
                              <span className="veg-circle"></span>
                            </span>
                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                              {it.choices.length > 0 ? (selectedComboChoices[it._id] || it.choices[0].name) : it.name}
                              {(it.choices.find(ch => ch.name === (selectedComboChoices[it._id] || it.choices[0]?.name))?.size ?? it.size) ? ` (${it.choices.find(ch => ch.name === (selectedComboChoices[it._id] || it.choices[0]?.name))?.size ?? it.size})` : ""}
                            </span>
                          </div>
                          <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300 shrink-0">x{it.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {(customizeItem.comboItems || []).filter(it => it.choices.length > 0).map(it => (
                    <div key={`choice-${it._id}`}>
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                          Choose {it.name}
                        </h4>
                        <span className="text-[11px] text-zinc-400 font-medium">Pick 1</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {it.choices.map(ch => {
                          const isSelected = (selectedComboChoices[it._id] || it.choices[0].name) === ch.name;
                          return (
                            <div
                              key={ch._id}
                              onClick={() => setSelectedComboChoices(prev => ({ ...prev, [it._id]: ch.name }))}
                              className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer ${
                                isSelected
                                  ? "border-zinc-800 dark:border-white bg-zinc-50/80 dark:bg-zinc-800/60 shadow-xs"
                                  : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                              }`}
                            >
                              {isSelected && (
                                <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#0066CC] dark:bg-[#3B82F6] text-white flex items-center justify-center shadow-xs">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                              <div className="font-bold text-xs text-zinc-900 dark:text-white pr-6 leading-snug">
                                {ch.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </>
              )}

              {/* 1. Change Size Section (Reference Image 2: side-by-side selectable cards with checkmarks & discounts) */}
              {!customizeItem.isCombo && (
              <div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2.5">
                  Change Size
                </h4>
                <div className={`grid ${((customizeItem.sizes?.length || 2) > 2) ? 'grid-cols-3' : 'grid-cols-2'} gap-2.5`}>
                  {(customizeItem.sizes || []).map(sizeObj => {
                    const isSelected = selectedSizeOption.name === sizeObj.name;
                    const hasDiscount = sizeObj.originalPrice && Number(sizeObj.originalPrice) > Number(sizeObj.price);
                    const savings = sizeObj.saveAmount || (hasDiscount ? Number(sizeObj.originalPrice) - Number(sizeObj.price) : 0);

                    return (
                      <div
                        key={sizeObj.name}
                        onClick={() => setSelectedSizeOption(sizeObj)}
                        className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? "border-zinc-800 dark:border-white bg-zinc-50/80 dark:bg-zinc-800/60 shadow-xs"
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                        }`}
                      >
                        {/* Checkmark circle badge */}
                        {isSelected && (
                          <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#0066CC] dark:bg-[#3B82F6] text-white flex items-center justify-center shadow-xs">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-sm text-zinc-900 dark:text-white">
                            {sizeObj.name}
                          </div>
                          <div className="flex items-baseline gap-1.5 mt-1 flex-wrap">
                            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                              ₹{sizeObj.price}
                            </span>
                            {hasDiscount && (
                              <span className="text-[11px] text-zinc-400 line-through">
                                ₹{sizeObj.originalPrice}
                              </span>
                            )}
                          </div>
                          {hasDiscount && savings > 0 && (
                            <span className="inline-block mt-1 bg-[#169B45] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
                              Save ₹{savings}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 leading-tight">
                          {sizeObj.description}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              )}

              {/* 2. Change Crust Section (Image 2: crust cards with image, desc, size-based price and checkmark) */}
              {currentItemCrusts.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-2.5">
                    Change Crust
                  </h4>
                  <div className="space-y-2.5">
                    {currentItemCrusts.map(crust => {
                      const isSelected = selectedCrust === crust.name;
                      const crustPrice = getAddonPriceForSize(crust, selectedSizeOption.name);
                      const crustImg = crust.image || "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300&auto=format&fit=crop&q=80";

                      return (
                        <div
                          key={crust.name || crust._id}
                          onClick={() => setSelectedCrust(crust.name)}
                          className={`relative p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected
                              ? "border-zinc-800 dark:border-white bg-zinc-50/80 dark:bg-zinc-800/60 shadow-xs"
                              : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-white dark:bg-zinc-900"
                          }`}
                        >
                          <img 
                            src={crustImg} 
                            alt={crust.name} 
                            className="w-12 h-12 rounded-xl object-cover shrink-0 bg-zinc-100 dark:bg-zinc-800"
                          />
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="font-bold text-xs text-zinc-900 dark:text-white truncate">
                              {crust.name}
                            </div>
                            <div className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-tight line-clamp-1">
                              {crust.description || (crust.name.includes("Burst") ? "Crust overflowing with molten liquid..." : "Fresh Dough, Flavourful Edges")}
                            </div>
                          </div>
                          <div className="text-right shrink-0 flex flex-col items-end justify-center min-w-[48px]">
                            {isSelected && (
                              <div className="w-5 h-5 rounded-full bg-[#0066CC] dark:bg-[#3B82F6] text-white flex items-center justify-center shadow-xs mb-1">
                                <Check size={12} strokeWidth={3} />
                              </div>
                            )}
                            <span className="font-bold text-xs text-zinc-800 dark:text-zinc-200">
                              {crustPrice > 0 ? `+ ₹${crustPrice}` : "₹0"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 3. Customizable Toppings with Prices Section (Showing ONLY assigned toppings for this product) */}
              {currentItemToppings.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Toppings
                    </h4>
                    <span className="text-[11px] text-zinc-400 font-medium">
                      {selectedToppingsList.length > 0 ? `${selectedToppingsList.length} selected` : "Optional add-ons"}
                    </span>
                  </div>
                  <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-3 shadow-xs border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {currentItemToppings.map(top => {
                      const isSelected = selectedToppingsList.includes(top.name);
                      const topPrice = getAddonPriceForSize(top, selectedSizeOption.name);

                      return (
                        <div
                          key={top.name || top._id}
                          onClick={() => {
                            setSelectedToppingsList(prev => 
                              prev.includes(top.name)
                                ? prev.filter(t => t !== top.name)
                                : [...prev, top.name]
                            );
                          }}
                          className="flex items-center justify-between cursor-pointer py-2.5 first:pt-1 last:pb-1 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="veg-box scale-75 shrink-0">
                              <span className="veg-circle"></span>
                            </span>
                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                              {top.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                              + ₹{topPrice}
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected 
                                ? "bg-[#0066CC] dark:bg-[#3B82F6] border-[#0066CC] dark:border-[#3B82F6] text-white" 
                                : "border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400"
                            }`}>
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 4. Dips & Extras Section (Showing ONLY assigned dips for this product) */}
              {currentItemDips.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white">
                      Dips & Extras
                    </h4>
                  </div>
                  <div className="bg-white dark:bg-[#1f1f22] rounded-2xl p-3 shadow-xs border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800">
                    {currentItemDips.map(dip => {
                      const isSelected = selectedMealOptions.includes(dip.name);
                      const dipPrice = getAddonPriceForSize(dip, selectedSizeOption.name);

                      return (
                        <div
                          key={dip.name || dip._id}
                          onClick={() => {
                            setSelectedMealOptions(prev =>
                              prev.includes(dip.name)
                                ? prev.filter(d => d !== dip.name)
                                : [...prev, dip.name]
                            );
                          }}
                          className="flex items-center justify-between cursor-pointer py-2.5 first:pt-1 last:pb-1 group"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 pr-2">
                            <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                              {dip.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="text-xs font-bold text-zinc-600 dark:text-zinc-300">
                              + ₹{dipPrice}
                            </span>
                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${
                              isSelected 
                                ? "bg-[#0066CC] dark:bg-[#3B82F6] border-[#0066CC] dark:border-[#3B82F6] text-white" 
                                : "border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400"
                            }`}>
                              {isSelected && <Check size={13} strokeWidth={3} />}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Sticky Bottom Footer (matching Reference Image 2) */}
            <div className="bg-white dark:bg-[#1f1f22] p-4 border-t border-zinc-200/80 dark:border-white/5 shrink-0 space-y-2 select-none">
              <div className="text-xs text-zinc-600 dark:text-zinc-400 text-left truncate font-medium">
                {customizeItem.isCombo ? (
                  <>
                    Meal • {(customizeItem.comboItems || []).length} Items
                    {customizeItem.originalPrice ? ` • Save ₹${customizeItem.saveAmount}` : ""}
                  </>
                ) : (
                  <>
                    {selectedSizeOption.name} {selectedCrust ? `| ${selectedCrust}` : ""}
                    {selectedToppingsList.length > 0 && ` • ${selectedToppingsList.length} Toppings`}
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={addCustomizedToCart}
                disabled={customizeItem.isCombo && !customizeItem.availableNow}
                className="w-full h-12 bg-[var(--accent-red,#EE3A43)] hover:opacity-95 active:scale-[0.99] text-white font-bold text-sm tracking-wide rounded-xl shadow-lg shadow-[var(--accent-red,#EE3A43)]/20 transition-all flex items-center justify-center gap-2 cursor-pointer uppercase select-none disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {customizeItem.isCombo && !customizeItem.availableNow ? (
                  <span className="normal-case">{customizeItem.availabilityLabel || "Not available right now"}</span>
                ) : (
                  <>
                    <span>₹{calculateTotalPrice()}</span>
                    <span className="opacity-60">|</span>
                    <span>Add</span>
                    <span className="text-base leading-none font-bold">+</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Delivery Map Modal Selector */}
      <DeliveryMapModal
        show={showMapModal}
        onClose={() => setShowMapModal(false)}
        deliveryAddress={deliveryAddress}
        setDeliveryAddress={(addr) => {
          setDeliveryAddress(addr)
          setLocationName(addr)
        }}
        setActiveService={setActiveService}
        triggerToast={triggerToast}
        isDarkMode={isDarkMode}
      />

      {/* Delivery or Collection Selection Modal */}
      <DeliveryOrCollectionModal
        show={showServiceSelector}
        onClose={() => {
          setShowServiceSelector(false)
          if (isModalOpen) closeLocationModal()
        }}
        onSelect={(id) => {
          if (id === "delivery") {
            if (!deliveryAddress) {
              setDeliveryAddress("Joshi Colony, Bk Sindhi Colony, Indore, Indore")
            }
            setShowMapModal(true)
          } else if (id === "takeaway") {
            setShowStoreModal(true)
          } else if (id === "incar") {
            setShowCarModal(true)
          } else if (id === "train") {
            navigate("/user/deliver-on-train")
          }
        }}
        isDarkMode={isDarkMode}
      />

      {/* Takeaway Store Finder Modal */}
      {showStoreModal && (
        <div 
          onClick={() => setShowStoreModal(false)}
          className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm dark touch-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass-card rounded-3xl p-6 space-y-4 text-left bg-[#131313] border border-white/10 touch-auto overflow-y-auto overscroll-contain max-h-[85vh]"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline-lg-mobile text-lg text-white">Find your nearest hut</h3>
              <button
                onClick={() => setShowStoreModal(false)}
                className="material-symbols-outlined text-white/50 hover:text-white cursor-pointer bg-transparent border-0 outline-none"
              >
                close
              </button>
            </div>
            <p className="text-xs opacity-60 leading-relaxed text-white">
              We suggested the following Pizza Veg Huts near your coordinates:
            </p>

            {/* Store List Options */}
            <div className="space-y-3">
              {[
                { id: "hut-cp", name: "Pizza Veg Hut - Connaught Place", dist: "0.8 km", status: "Open Now", hours: "11 AM - 11 PM" },
                { id: "hut-kb", name: "Pizza Veg Hut - Karol Bagh", dist: "2.1 km", status: "Open Now", hours: "11 AM - 11 PM" },
                { id: "hut-sk", name: "Pizza Veg Hut - Saket Terminal", dist: "4.5 km", status: "Closed", hours: "Opens tomorrow" }
              ].map((store) => (
                <div
                  key={store.id}
                  onClick={() => {
                    setTakeawayHut(store.name)
                    setLocationName(store.name)
                    confirmLocation({
                      address: store.name,
                      serviceType: "takeaway"
                    })
                    setShowStoreModal(false)
                    triggerToast(`Selected outlet: ${store.name}`)
                  }}
                  className="p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-between cursor-pointer active:scale-98 transition-all"
                >
                  <div className="text-left space-y-1">
                    <h4 className="text-xs font-bold text-white leading-tight">{store.name}</h4>
                    <div className="flex gap-2 text-[9px] font-bold">
                      <span className="text-[#00C853]">{store.status}</span>
                      <span className="opacity-50">•</span>
                      <span className="opacity-60">{store.hours}</span>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-1">
                    <span className="text-[10px] bg-[#E53935]/10 text-[#E53935] px-2 py-0.5 rounded font-black tracking-wide">{store.dist}</span>
                    <span className="material-symbols-outlined text-xs text-white/40">arrow_forward_ios</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* In-Car Details Modal */}
      {showCarModal && (
        <div 
          onClick={() => setShowCarModal(false)}
          className="fixed inset-0 z-55 flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm dark touch-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm glass-card rounded-3xl p-6 space-y-4 text-left bg-[#131313] border border-white/10 touch-auto overflow-y-auto overscroll-contain max-h-[85vh]"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-headline-lg-mobile text-lg text-white">In-Car Dining</h3>
              <button
                onClick={() => setShowCarModal(false)}
                className="material-symbols-outlined text-white/50 hover:text-white cursor-pointer bg-transparent border-0 outline-none"
              >
                close
              </button>
            </div>
            <p className="text-xs opacity-60 leading-relaxed text-white">
              Please enter your car number or vehicle registration details so we can deliver your hot pizza straight to your window:
            </p>

            {/* Input field */}
            <div className="space-y-1.5">
              <span className="text-[10px] uppercase opacity-50 font-bold tracking-wider text-white">Car Number</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. DL 3C AB 1234"
                  value={carNumber}
                  onChange={(e) => setCarNumber(e.target.value)}
                  className="w-full h-11 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white outline-none"
                />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-white/50 text-sm">
                  directions_car
                </span>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={() => {
                const cleanCar = carNumber.trim()
                if (!cleanCar) {
                  triggerToast("Please enter a valid car number")
                  return
                }
                setCarNumber(cleanCar)
                setLocationName(cleanCar)
                confirmLocation({
                  address: cleanCar,
                  serviceType: "incar"
                })
                setShowCarModal(false)
                triggerToast("Car details confirmed!")
              }}
              className="w-full h-11 bg-[#E53935] text-on-primary font-bold rounded-xl text-xs uppercase cursor-pointer border-0 shadow-lg active:scale-95 transition-all"
            >
              Confirm Vehicle
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Cart basket FAB */}
      {totalCartCount > 0 && (
        <div className="fixed bottom-24 right-4 pointer-events-none z-45">
          <button
            onClick={() => {
              navigate("/user/cart")
            }}
            className="pointer-events-auto w-14 h-14 bg-primary text-on-primary rounded-full shadow-[0_0_20px_rgba(229,57,53,0.4)] flex items-center justify-center active:scale-95 transition-transform cursor-pointer"
          >
            <span className="material-symbols-outlined text-[28px]">shopping_basket</span>
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-white text-on-primary-container rounded-full text-[10px] font-bold flex items-center justify-center border border-primary animate-bounce">
              {totalCartCount}
            </div>
          </button>
        </div>
      )}

      {/* Floating Action Controls (Domino's style matching media_1792050211697_9dee3bdf.png) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-md px-4 pointer-events-none z-40 flex items-center justify-between">
        {/* Scroll-to-Top Floating Circular Button */}
        {showScrollToTop ? (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            title="Scroll to top"
            aria-label="Scroll to top"
            className="pointer-events-auto w-11 h-11 bg-white/95 dark:bg-zinc-800/95 text-zinc-800 dark:text-zinc-100 rounded-full shadow-lg border border-zinc-200 dark:border-zinc-700 flex items-center justify-center cursor-pointer hover:scale-105 active:scale-95 transition-all backdrop-blur-sm"
          >
            <ChevronUp className="w-5 h-5 stroke-[2.5]" />
          </button>
        ) : (
          <div className="w-11 h-11" />
        )}

        {/* Floating "Menu" Pill Button (Opens Quick Jump Category Sheet) */}
        <button
          type="button"
          onClick={() => setShowQuickMenuModal(true)}
          className="pointer-events-auto px-5 py-2.5 bg-[var(--secondary-off-white,#F8F6F2)] dark:bg-[#18181a] text-[var(--primary,#EE3A43)] rounded-full shadow-2xl backdrop-blur-md flex items-center gap-2 font-bold text-xs tracking-wider uppercase cursor-pointer hover:scale-105 active:scale-95 transition-all border border-zinc-300/80 dark:border-zinc-700/80"
        >
          <UtensilsCrossed className="w-4 h-4 text-[var(--primary,#EE3A43)] stroke-[2.5]" />
          <span className="text-[var(--primary,#EE3A43)]">Menu</span>
        </button>

        <div className="w-11 h-11" />
      </div>

      {/* Quick Category Jump Sheet */}
      {showQuickMenuModal && (
        <div 
          onClick={() => setShowQuickMenuModal(false)}
          className="fixed inset-0 z-55 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 touch-none"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white dark:bg-[#18181a] rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden p-5 max-h-[75vh] flex flex-col slide-up-modal font-['Poppins',sans-serif] touch-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-200 dark:border-zinc-800">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-[var(--primary,#EE3A43)]" />
                <span>Categories</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowQuickMenuModal(false)}
                className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 hover:text-zinc-800 dark:hover:text-white cursor-pointer border-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain py-2 divide-y divide-zinc-100 dark:divide-zinc-800/60 max-h-[60vh]">
              {categorySectionsWithItems.map(({ category, items }) => {
                const isActive = activeTab === category.id || String(category._id) === activeTab;
                return (
                  <button
                    key={category._id || category.id}
                    type="button"
                    onClick={() => {
                      setShowQuickMenuModal(false);
                      handleCategoryTabClick(category.id);
                    }}
                    className={`w-full py-3 px-2 flex items-center justify-between text-left transition-colors cursor-pointer border-0 bg-transparent rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/50 ${
                      isActive ? "text-[#E53935] font-bold" : "text-zinc-800 dark:text-zinc-200 font-medium"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      {isActive && <div className="w-2 h-2 rounded-full bg-[var(--primary,#EE3A43)] shrink-0" />}
                      <span className="text-sm">{category.label || category.name || category.id}</span>
                      {category.badge && (
                        <span className="text-[9px] font-bold text-white bg-[var(--primary,#EE3A43)] px-1.5 py-0.5 rounded-full uppercase">
                          {category.badge}
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-xs tabular-nums font-semibold shrink-0 ml-4 ${
                        isActive
                          ? "text-[var(--primary,#EE3A43)] font-bold"
                          : "text-zinc-400 dark:text-zinc-500"
                      }`}
                    >
                      {items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
      {/* Dynamic Full-Screen Search Overlay matching user's Image 2 */}
      <MenuSearchOverlay
        isOpen={isSearchOverlayOpen}
        onClose={() => setIsSearchOverlayOpen(false)}
        allProducts={allFlattenedProducts}
        allAddons={allAddonsList}
        categories={categories}
        initialQuery={searchQuery}
        onOpenCustomize={(product) => {
          setIsSearchOverlayOpen(false);
          checkLocation(() => openCustomizeModal(product));
        }}
        onAddToCart={(product) => {
          checkLocation(() => {
            if (product.sizes && product.sizes.length > 1) {
              setIsSearchOverlayOpen(false);
              openCustomizeModal(product);
            } else {
              addToCart(product);
              triggerToast(`Added ${product.title} to cart!`);
            }
          });
        }}
      />
      </div>
    </div>
  )
}

