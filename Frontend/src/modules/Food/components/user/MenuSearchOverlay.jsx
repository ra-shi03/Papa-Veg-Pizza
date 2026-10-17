import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { 
  ArrowLeft, 
  Search, 
  X, 
  TrendingUp, 
  ChevronUp, 
  ChevronDown, 
  Plus, 
  Sparkles,
  ShoppingBag,
  Clock,
  ArrowRight
} from 'lucide-react';
import apiClient from '@/services/api/axios';

const RECENTLY_VIEWED_KEY = 'pvp_recently_viewed_products';
const RECENT_SEARCHES_KEY = 'pvp_recent_searches_list';

const DEFAULT_NEW_LAUNCHES = [
  {
    _id: 'launch-default-1',
    title: 'Paneer Maxxx',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&auto=format&fit=crop&q=80',
    searchQuery: 'paneer',
    sortOrder: 1,
    isActive: true
  },
  {
    _id: 'launch-default-2',
    title: 'Four Cheese Sourdough Pizza',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800&auto=format&fit=crop&q=80',
    searchQuery: 'cheese',
    sortOrder: 2,
    isActive: true
  },
  {
    _id: 'launch-default-3',
    title: 'Big Pizza Bonanza',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&auto=format&fit=crop&q=80',
    searchQuery: 'pizza',
    sortOrder: 3,
    isActive: true
  }
];

export default function MenuSearchOverlay({
  isOpen,
  onClose,
  allProducts = [],
  allAddons = [],
  categories = [],
  onOpenCustomize,
  onAddToCart,
  initialQuery = ''
}) {
  const inputRef = useRef(null);

  // Search input state with debouncing
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);

  // Active filter metadata (if triggered via Popular tag or Search By sub-pill)
  const [activeFilterMeta, setActiveFilterMeta] = useState(null);

  // Active category filter pill for search results view (e.g. 'all', 'Veg Pizza', etc.)
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('all');

  // Dynamic superadmin search config
  const [searchConfig, setSearchConfig] = useState({
    popularSearches: [],
    searchByTabs: [],
    newLaunches: DEFAULT_NEW_LAUNCHES,
    isPopularEnabled: true,
    isSearchByEnabled: true,
    isRecentlyViewedEnabled: true,
    isNewLaunchesEnabled: true
  });

  // Recent search queries persisted in localStorage (max 5)
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.slice(0, 5);
      }
    } catch (_) {}
    return [];
  });

  // Active "SEARCH BY" tab (e.g. Crusts, Toppings, Flavours)
  const [activeSearchByTabKey, setActiveSearchByTabKey] = useState('crust');

  // Recently viewed products from localStorage
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  // Menu Filters configuration from localStorage (matches MenuList.jsx)
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

  // Veg Only Filter State (hydrated from localStorage)
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

  // Sync menu filters and veg-only state across components and tabs
  useEffect(() => {
    const handleFiltersSync = () => {
      try {
        const saved = localStorage.getItem("pvp_menu_filters");
        if (saved) {
          const parsed = JSON.parse(saved);
          setMenuFilters(parsed);
          if (parsed?.vegOnly?.defaultActive !== undefined) {
            setIsVegOnly(parsed.vegOnly.defaultActive);
          }
        }
      } catch (_) {}
    };
    window.addEventListener("pvp_menu_filters_changed", handleFiltersSync);
    window.addEventListener("storage", handleFiltersSync);
    return () => {
      window.removeEventListener("pvp_menu_filters_changed", handleFiltersSync);
      window.removeEventListener("storage", handleFiltersSync);
    };
  }, []);

  const toggleVegOnly = () => {
    const next = !isVegOnly;
    setIsVegOnly(next);
    try {
      const saved = localStorage.getItem("pvp_menu_filters");
      const parsed = saved ? JSON.parse(saved) : {};
      parsed.vegOnly = { ...(parsed.vegOnly || {}), defaultActive: next };
      localStorage.setItem("pvp_menu_filters", JSON.stringify(parsed));
      window.dispatchEvent(new Event("pvp_menu_filters_changed"));
    } catch (_) {}
  };

  // Focus search input when overlay opens
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 50);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Sync initial query
  useEffect(() => {
    if (isOpen) {
      setSearchQuery(initialQuery || '');
      setDebouncedQuery(initialQuery || '');
    }
  }, [isOpen, initialQuery]);

  // 300ms Debouncing Logic for Search Bar
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

// Helper to map realistic ingredient food thumbnails if addon doesn't have an image
const getImageForAddon = (name, type, existingImage) => {
  if (existingImage && existingImage.trim()) return existingImage.trim();
  const n = (name || '').toLowerCase();
  const t = (type || '').toLowerCase();

  if (n.includes('hand tossed') || t.includes('crust')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80';
  }
  if (n.includes('paneer')) {
    return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80';
  }
  if (n.includes('capsicum') || n.includes('onion') || n.includes('paprika')) {
    return 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=160&auto=format&fit=crop&q=80';
  }
  if (n.includes('corn')) {
    return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80';
  }
  if (n.includes('mushroom')) {
    return 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=160&auto=format&fit=crop&q=80';
  }
  if (n.includes('olive') || n.includes('jalapeno')) {
    return 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?w=160&auto=format&fit=crop&q=80';
  }
  if (n.includes('cheese') || t.includes('cheese')) {
    return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80';
  }
  if (t.includes('dip') || n.includes('dip') || t.includes('sauce')) {
    return 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=160&auto=format&fit=crop&q=80';
  }
  return 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=160&auto=format&fit=crop&q=80';
};

  // Fetch dynamic search config from backend & localStorage fallback
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        // Check localStorage cached config first for instant load
        const cached = localStorage.getItem('pvp_search_config');
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed) {
              if (!Array.isArray(parsed.newLaunches) || parsed.newLaunches.length === 0) {
                parsed.newLaunches = DEFAULT_NEW_LAUNCHES;
              }
              setSearchConfig(parsed);
            }
          } catch (_) {}
        }

        const res = await apiClient.get(`/settings/search-config/public?_t=${Date.now()}`);
        const data = res?.data?.data;
        if (data) {
          let tabs = data.searchByTabs || [];

          // Check if tabs still have initial mock placeholder items
          const isMockTabs = tabs.some(t => 
            (t.items || []).some(i => i.title === 'Double Cheeseburst' || i.title === 'Cheese Volcano Crust')
          );

          if (isMockTabs || tabs.length === 0) {
            try {
              const [addonsRes, typesRes] = await Promise.all([
                apiClient.get('/food/admin/addons/public').catch(() => null),
                apiClient.get('/food/admin/addon-types/public').catch(() => null)
              ]);
              const addons = addonsRes?.data?.data || [];
              const types = typesRes?.data?.data || [];

              if (Array.isArray(addons) && addons.length > 0) {
                const typeMap = {};
                (types || []).forEach(t => {
                  const slug = (t.slug || t.name).toLowerCase();
                  let displayName = t.name;
                  if (!displayName.toLowerCase().endsWith('s')) displayName = `${displayName}s`;
                  typeMap[slug] = {
                    _id: String(t._id || slug),
                    name: displayName,
                    key: slug,
                    sortOrder: t.sortOrder || 1,
                    items: []
                  };
                });

                addons.forEach(a => {
                  if (a.status === 'Inactive') return;
                  const rawType = (a.type || 'Other').trim().toLowerCase();
                  let targetKey = rawType;
                  if (rawType.includes('crust')) targetKey = 'crust';
                  else if (rawType.includes('topping')) targetKey = 'topping';
                  else if (rawType.includes('dip')) targetKey = 'dip';
                  else if (rawType.includes('cheese')) targetKey = 'cheese';

                  if (!typeMap[targetKey]) {
                    let displayName = a.type ? (a.type.charAt(0).toUpperCase() + a.type.slice(1)) : 'Other';
                    if (!displayName.toLowerCase().endsWith('s')) displayName = `${displayName}s`;
                    typeMap[targetKey] = {
                      _id: `tab-${targetKey}`,
                      name: displayName,
                      key: targetKey,
                      sortOrder: Object.keys(typeMap).length + 1,
                      items: []
                    };
                  }

                  typeMap[targetKey].items.push({
                    _id: String(a._id || a.name),
                    addonId: a._id ? String(a._id) : undefined,
                    addonType: a.type || targetKey,
                    title: a.name,
                    image: getImageForAddon(a.name, a.type, a.image),
                    query: a.name,
                    sortOrder: typeMap[targetKey].items.length + 1,
                    isActive: true
                  });
                });

                const realTabs = Object.values(typeMap)
                  .filter(t => t.items.length > 0)
                  .sort((a, b) => a.sortOrder - b.sortOrder);

                if (realTabs.length > 0) {
                  tabs = realTabs;
                }
              }
            } catch (_) {}
          }

          const launches = (Array.isArray(data.newLaunches) && data.newLaunches.length > 0)
            ? data.newLaunches
            : DEFAULT_NEW_LAUNCHES;

          const updatedConfig = { 
            ...data, 
            newLaunches: launches,
            searchByTabs: tabs 
          };
          setSearchConfig(updatedConfig);
          localStorage.setItem('pvp_search_config', JSON.stringify(updatedConfig));
          if (tabs.length > 0) {
            setActiveSearchByTabKey(tabs[0].key || 'crust');
          }
        }
      } catch (err) {
        console.warn('Using default search config', err);
      }
    };

    if (isOpen) {
      fetchConfig();
      loadRecentlyViewed();
    }

    const handleConfigChange = () => fetchConfig();
    const handleStorageChange = (e) => {
      if (e.key === 'pvp_search_config') {
        fetchConfig();
      }
    };
    window.addEventListener('pvp_search_config_changed', handleConfigChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('pvp_search_config_changed', handleConfigChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [isOpen]);

  // Load recently viewed products from localStorage and hydrate with latest allProducts
  const loadRecentlyViewed = () => {
    try {
      const stored = localStorage.getItem(RECENTLY_VIEWED_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const liveMap = new Map();
          (allProducts || []).forEach(p => {
            const k = p.id || p._id;
            if (k) liveMap.set(String(k), p);
          });

          const hydrated = parsed.map(item => {
            const live = liveMap.get(String(item.id || item._id));
            if (live) {
              return {
                ...live,
                ...item,
                price: live.price ?? item.price,
                originalPrice: live.originalPrice ?? item.originalPrice,
                saveAmount: live.saveAmount ?? item.saveAmount,
                image: live.image || item.image,
                defaultCrust: live.defaultCrust || item.defaultCrust,
                category: live.category || item.category,
                categoryLabel: live.categoryLabel || item.categoryLabel
              };
            }
            return item;
          });

          setRecentlyViewed(hydrated);
          return;
        }
      }
    } catch (_) {}

    // Real data only! Never fallback to fake mock dishes when unviewed.
    setRecentlyViewed([]);
  };

  // Re-hydrate recently viewed whenever allProducts updates or when overlay opens
  useEffect(() => {
    if (isOpen) {
      loadRecentlyViewed();
    }
  }, [isOpen, allProducts]);

  // Listen to recently viewed changes dispatched anywhere in the app
  useEffect(() => {
    const handleRecentlyViewedChanged = () => {
      loadRecentlyViewed();
    };
    window.addEventListener('pvp_recently_viewed_changed', handleRecentlyViewedChanged);
    return () => window.removeEventListener('pvp_recently_viewed_changed', handleRecentlyViewedChanged);
  }, [allProducts]);

  // Ensure we always have the real products created by superadmin
  const [internalProducts, setInternalProducts] = useState(allProducts || []);

  useEffect(() => {
    if (Array.isArray(allProducts) && allProducts.length > 0) {
      setInternalProducts(allProducts);
    }
  }, [allProducts]);

  useEffect(() => {
    const fetchDirectProducts = async () => {
      if (internalProducts.length > 0) return;
      try {
        const cached = localStorage.getItem('pvp_products_v2');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setInternalProducts(parsed);
            return;
          }
        }

        const [pRes, mRes] = await Promise.all([
          apiClient.get('/food/admin/products/public').catch(() => null),
          apiClient.get('/food/admin/menu/public').catch(() => null)
        ]);

        const items = pRes?.data?.data || mRes?.data?.data?.products || [];
        if (Array.isArray(items) && items.length > 0) {
          setInternalProducts(items);
        }
      } catch (_) {}
    };

    if (isOpen) {
      fetchDirectProducts();
    }
  }, [isOpen, internalProducts.length]);

  const effectiveProducts = useMemo(() => {
    const prods = (allProducts && allProducts.length > 0) ? allProducts : internalProducts;
    return (prods || []).filter(p => (p.status || 'Active').toLowerCase() === 'active');
  }, [allProducts, internalProducts]);

  // Filter products live by debounced search term, active popular tag, active category, or active addon
  const filteredProducts = useMemo(() => {
    const rawQ = (debouncedQuery || activeFilterMeta?.query || activeFilterMeta?.label || '').trim().toLowerCase();
    
    // If no query and no active filter, nothing to show in results (show default home state)
    if (!rawQ && !activeFilterMeta) return [];

    const normalize = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    // -------------------------------------------------------------
    // CASE 1: FILTERING BY CATEGORY (Tapped on a Category Suggestion Card)
    // -------------------------------------------------------------
    if (activeFilterMeta?.type === 'category') {
      const catName = (activeFilterMeta.label || '').toLowerCase().trim();
      const normCatName = normalize(catName);

      return effectiveProducts.filter(item => {
        const pCat = (item.category || item.categoryLabel || '').toLowerCase().trim();
        const normPCat = normalize(pCat);
        const pCatId = String(item.categoryId || '');
        if (activeFilterMeta.categoryId && pCatId === String(activeFilterMeta.categoryId)) return true;
        if (pCat === catName || normPCat === normCatName) return true;
        if (normCatName && (normPCat.includes(normCatName) || normCatName.includes(normPCat))) return true;
        return false;
      });
    }

    // -------------------------------------------------------------
    // CASE 2: FILTERING BY ADDON (Dishes that use this addon)
    // -------------------------------------------------------------
    if (activeFilterMeta?.type === 'addon') {
      const addonId = activeFilterMeta.addonId ? String(activeFilterMeta.addonId) : '';
      const addonName = (activeFilterMeta.addonName || activeFilterMeta.label || '').toLowerCase().trim();
      const normAddonName = normalize(addonName);
      const addonTokens = addonName
        .split(/\s+/)
        .map(w => w.trim())
        .filter(w => w.length > 2 && !['fresh', 'best', 'crust', 'dip', 'new', 'sauce', 'extra'].includes(w));

      const matched = [];

      for (const item of effectiveProducts) {
        let isMatch = false;
        let matchReason = `Uses ${activeFilterMeta.addonName}`;

        // 1. Check toppings array (handles populated Addon objects and IDs)
        if (Array.isArray(item.toppings) && item.toppings.length > 0) {
          for (const t of item.toppings) {
            if (!t) continue;
            if (typeof t === 'object') {
              const tId = String(t._id || t.id || '');
              const tName = (t.name || '').toLowerCase();
              if ((addonId && tId === addonId) || (addonName && (tName.includes(addonName) || addonName.includes(tName)))) {
                isMatch = true;
                matchReason = `Topping: ${t.name || activeFilterMeta.addonName}`;
                break;
              }
            } else if (addonId && String(t) === addonId) {
              isMatch = true;
              break;
            }
          }
        }

        // 2. Check crusts array (handles populated Addon objects and IDs)
        if (!isMatch && Array.isArray(item.crusts) && item.crusts.length > 0) {
          for (const c of item.crusts) {
            if (!c) continue;
            if (typeof c === 'object') {
              const cId = String(c._id || c.id || '');
              const cName = (c.name || '').toLowerCase();
              if ((addonId && cId === addonId) || (addonName && (cName.includes(addonName) || addonName.includes(cName)))) {
                isMatch = true;
                matchReason = `Crust: ${c.name || activeFilterMeta.addonName}`;
                break;
              }
            } else if (addonId && String(c) === addonId) {
              isMatch = true;
              break;
            }
          }
        }

        // 3. Check defaultCrust string
        if (!isMatch && item.defaultCrust) {
          const dCrust = item.defaultCrust.toLowerCase();
          if (dCrust.includes(addonName) || addonName.includes(dCrust) || (normAddonName && normalize(dCrust).includes(normAddonName))) {
            isMatch = true;
            matchReason = `Crust: ${item.defaultCrust}`;
          }
        }

        // 4. Check toppingsSummary / description
        if (!isMatch && item.toppingsSummary) {
          const summary = item.toppingsSummary.toLowerCase();
          if (summary.includes(addonName) || (normAddonName && normalize(summary).includes(normAddonName))) {
            isMatch = true;
            matchReason = `Includes ${activeFilterMeta.addonName}`;
          }
        }

        // 5. Check product title / name
        if (!isMatch) {
          const title = (item.title || item.name || '').toLowerCase();
          if (title.includes(addonName) || (normAddonName && normalize(title).includes(normAddonName))) {
            isMatch = true;
            matchReason = `Dish with ${activeFilterMeta.addonName}`;
          }
        }

        // 6. Token matching for compound names (e.g. "Paneer" in "Peppy Paneer")
        if (!isMatch && addonTokens.length > 0) {
          const title = (item.title || item.name || '').toLowerCase();
          const summary = (item.toppingsSummary || '').toLowerCase();
          const desc = (item.description || item.shortDescription || '').toLowerCase();
          const hasToken = addonTokens.some(tok => title.includes(tok) || summary.includes(tok) || desc.includes(tok));
          if (hasToken) {
            isMatch = true;
            matchReason = `Related to ${activeFilterMeta.addonName}`;
          }
        }

        // 7. For Dips/Sides: match dip products or items paired with dips
        if (!isMatch && (activeFilterMeta.tabKey?.includes('dip') || addonName.includes('dip'))) {
          const cat = (item.category || item.categoryLabel || '').toLowerCase();
          const title = (item.title || item.name || '').toLowerCase();
          if (cat.includes('dip') || cat.includes('side') || cat.includes('bread') || title.includes('garlic bread') || title.includes('dip')) {
            isMatch = true;
            matchReason = `Pairs with ${activeFilterMeta.addonName}`;
          }
        }

        if (isMatch) {
          matched.push({ ...item, _matchedReason: matchReason });
        }
      }

      return matched;
    }

    // -------------------------------------------------------------
    // CASE 3: POPULAR TAG OR KEYWORD SEARCHED BY USER
    // -------------------------------------------------------------
    const q = rawQ;
    const normQ = normalize(q);

    // Stopwords filter for modifier words like 'more', 'pizza', etc.
    const STOP_WORDS = new Set(['more', 'the', 'a', 'an', 'and', 'or', 'in', 'on', 'with', 'of', 'for', 'to', 'at', 'by', 'our', 'all', 'new']);
    const rawTokens = q.split(/\s+/).filter(Boolean);
    const meaningfulTokens = rawTokens.filter(t => !STOP_WORDS.has(t));
    const searchTokens = meaningfulTokens.length > 0 ? meaningfulTokens : rawTokens;

    const scoredItems = [];

    for (const item of effectiveProducts) {
      const title = (item.title || item.name || '').toLowerCase();
      const desc = (item.description || item.shortDescription || '').toLowerCase();
      const summary = (item.toppingsSummary || '').toLowerCase();
      const crust = (item.defaultCrust || '').toLowerCase();
      const cat = (item.category || item.categoryLabel || '').toLowerCase();
      const badge = (item.badge || '').toLowerCase();

      // Collect all topping names
      const toppingNames = Array.isArray(item.toppings) 
        ? item.toppings.map(t => (typeof t === 'object' ? (t.name || '') : String(t))).join(' ').toLowerCase()
        : '';

      // Collect all crust names
      const crustNames = Array.isArray(item.crusts)
        ? item.crusts.map(c => (typeof c === 'object' ? (c.name || '') : String(c))).join(' ').toLowerCase()
        : '';

      let score = 0;
      let matchedReason = '';

      // 1. Direct contains check
      if (title.includes(q)) {
        score += 200;
        matchedReason = item.title;
      } else if (normQ && normalize(title).includes(normQ)) {
        score += 180;
        matchedReason = item.title;
      }

      if (toppingNames.includes(q)) {
        score += 120;
        matchedReason = matchedReason || 'Topping match';
      }
      if (crust.includes(q) || crustNames.includes(q)) {
        score += 110;
        matchedReason = matchedReason || `Crust: ${item.defaultCrust || 'Cheese Burst'}`;
      }
      if (summary.includes(q)) {
        score += 90;
        matchedReason = matchedReason || 'Topping ingredients';
      }
      if (cat.includes(q)) {
        score += 80;
        matchedReason = matchedReason || (item.categoryLabel || item.category);
      }
      if (desc.includes(q)) {
        score += 50;
      }

      // 2. Token Matching (e.g. 'paneer' in 'more paneer' or 'paneer maxxx')
      for (const tok of searchTokens) {
        if (title.includes(tok)) {
          score += 80;
          matchedReason = matchedReason || `${tok.charAt(0).toUpperCase() + tok.slice(1)} dish`;
        }
        if (toppingNames.includes(tok)) {
          score += 70;
          matchedReason = matchedReason || `With ${tok}`;
        }
        if (crust.includes(tok) || crustNames.includes(tok)) {
          score += 60;
          matchedReason = matchedReason || `Crust: ${tok}`;
        }
        if (summary.includes(tok)) {
          score += 50;
          matchedReason = matchedReason || `Topping: ${tok}`;
        }
        if (cat.includes(tok)) {
          score += 40;
        }
        if (desc.includes(tok)) {
          score += 20;
        }
      }

      // 3. Keyword / Ingredient Semantic helpers
      if (q.includes('paneer') && (title.includes('paneer') || toppingNames.includes('paneer') || summary.includes('paneer'))) {
        score += 150;
        matchedReason = matchedReason || 'Fresh Paneer Special';
      }
      if (q.includes('cheese') && (title.includes('cheese') || crust.includes('cheese') || crustNames.includes('cheese') || summary.includes('cheese') || title.includes('margherita'))) {
        score += 150;
        matchedReason = matchedReason || 'Cheesy Choice';
      }
      if (q.includes('chicken') && (title.includes('chicken') || summary.includes('chicken') || desc.includes('chicken'))) {
        score += 150;
        matchedReason = matchedReason || 'Chicken Special';
      }
      if (q.includes('corn') && (title.includes('corn') || toppingNames.includes('corn') || summary.includes('corn'))) {
        score += 120;
        matchedReason = matchedReason || 'Golden Sweet Corn';
      }
      if (q.includes('capsicum') && (title.includes('capsicum') || toppingNames.includes('capsicum') || summary.includes('capsicum'))) {
        score += 120;
        matchedReason = matchedReason || 'Crispy Capsicum';
      }
      if (q.includes('onion') && (title.includes('onion') || toppingNames.includes('onion') || summary.includes('onion'))) {
        score += 120;
        matchedReason = matchedReason || 'Fresh Onion';
      }
      if (q.includes('mushroom') && (title.includes('mushroom') || toppingNames.includes('mushroom') || summary.includes('mushroom'))) {
        score += 120;
        matchedReason = matchedReason || 'Mushroom Delight';
      }
      if ((q.includes('maxxx') || q.includes('ultimate') || q.includes('feast') || q.includes('wow')) && 
          (title.includes('ultimate') || title.includes('max') || title.includes('feast') || badge.includes('ultimate') || badge.includes('bestseller') || item.price >= 250)) {
        score += 100;
        matchedReason = matchedReason || 'Feast Special';
      }
      if (q.includes('big') && (title.includes('big') || cat.includes('combo') || cat.includes('feast') || item.price >= 280)) {
        score += 100;
        matchedReason = matchedReason || 'Big Pizza Special';
      }

      if (score > 0) {
        scoredItems.push({
          ...item,
          _matchedReason: matchedReason,
          _relevanceScore: score
        });
      }
    }

    // Sort by relevance score descending
    scoredItems.sort((a, b) => b._relevanceScore - a._relevanceScore);

    return scoredItems;
  }, [debouncedQuery, activeFilterMeta, effectiveProducts]);

  // Add a product to recently viewed in localStorage
  const recordViewedProduct = (product) => {
    try {
      if (!product) return;
      const current = localStorage.getItem(RECENTLY_VIEWED_KEY);
      const list = current ? JSON.parse(current) : [];
      const prodId = product.id || product._id;
      const filtered = list.filter(p => (p.id || p._id) !== prodId);
      
      const itemToSave = {
        id: prodId,
        _id: product._id || product.id,
        title: product.title || product.name,
        name: product.name || product.title,
        price: product.price,
        originalPrice: product.originalPrice || null,
        saveAmount: product.saveAmount || 0,
        image: product.image || "",
        defaultCrust: product.defaultCrust,
        showCrust: product.showCrust,
        category: product.category,
        categoryLabel: product.categoryLabel,
        toppingsSummary: product.toppingsSummary,
        sizes: product.sizes,
        toppings: product.toppings,
        crusts: product.crusts,
        viewedAt: Date.now()
      };

      const updated = [itemToSave, ...filtered].slice(0, 10);
      localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(updated));
      setRecentlyViewed(updated);
      window.dispatchEvent(new Event("pvp_recently_viewed_changed"));
    } catch (_) {}
  };

  // Persist recent search queries (strictly capped to 5 items)
  const recordRecentSearch = useCallback((rawTerm) => {
    const term = (rawTerm || '').trim();
    if (!term || term.length < 2) return;
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      const list = stored ? JSON.parse(stored) : [];
      const filtered = list.filter(t => t.toLowerCase() !== term.toLowerCase());
      const updated = [term, ...filtered].slice(0, 5);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      setRecentSearches(updated);
    } catch (_) {}
  }, []);

  // Clear all recent searches and restore dynamic superadmin popular tabs
  const handleClearRecent = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
      setRecentSearches([]);
    } catch (_) {}
  };

  // Record recent search when debounced query settles
  useEffect(() => {
    if (debouncedQuery && debouncedQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        recordRecentSearch(debouncedQuery.trim());
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [debouncedQuery, recordRecentSearch]);

  // Auto focus search input when opened
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Reset category filter when search query or filter meta changes
  useEffect(() => {
    setActiveCategoryFilter('all');
  }, [debouncedQuery, activeFilterMeta]);

  // Combined Recent & Popular search pills (STRICTLY CAPPED AT 5 PILLS TOTAL)
  // When a new keyword is searched, it enters Recent and pushes off the last item.
  // Clearing recent searches immediately restores the 5 dynamic superadmin tabs.
  const displayPopularPills = useMemo(() => {
    const dynamicPopular = (searchConfig.popularSearches || []).filter(p => p.isActive !== false);
    const recentTerms = (recentSearches || []).slice(0, 5);
    const recentLowerSet = new Set(recentTerms.map(t => t.toLowerCase().trim()));

    const recentPills = recentTerms.map((term, idx) => ({
      _id: `recent-${idx}-${term}`,
      text: term,
      searchQuery: term,
      isRecent: true
    }));

    const remainingPopular = dynamicPopular
      .filter(p => !recentLowerSet.has((p.text || '').toLowerCase().trim()))
      .map(p => ({
        ...p,
        isRecent: false
      }));

    return [...recentPills, ...remainingPopular].slice(0, 5);
  }, [recentSearches, searchConfig.popularSearches]);

  // Helper actions for user interactions
  const handleClearFilter = () => {
    setSearchQuery('');
    setDebouncedQuery('');
    setActiveFilterMeta(null);
    setActiveCategoryFilter('all');
    inputRef.current?.focus();
  };

  const handlePopularClick = (item) => {
    const queryToSet = item.searchQuery || item.text;
    recordRecentSearch(queryToSet);
    setActiveFilterMeta({
      type: item.isRecent ? 'recent' : 'popular',
      label: item.text,
      query: queryToSet
    });
    setSearchQuery(queryToSet);
    setDebouncedQuery(queryToSet);
  };

  const handleAddonClick = (subPill) => {
    const q = subPill.query || subPill.title;
    recordRecentSearch(q);
    setActiveFilterMeta({
      type: 'addon',
      label: subPill.title,
      addonId: subPill.addonId || subPill._id,
      addonName: subPill.title,
      tabKey: activeSearchByTab?.key,
      query: q
    });
    setSearchQuery(q);
    setDebouncedQuery(q);
  };

  // Active Tab object for Search By
  const activeSearchByTab = useMemo(() => {
    const tabs = searchConfig.searchByTabs || [];
    return tabs.find(t => (t.key || '').toLowerCase() === (activeSearchByTabKey || '').toLowerCase()) || tabs[0];
  }, [searchConfig.searchByTabs, activeSearchByTabKey]);

  // Available category filter pills derived from filteredProducts (respecting isVegOnly)
  const availableCategories = useMemo(() => {
    const set = new Set();
    const source = isVegOnly
      ? filteredProducts.filter(p => p.isVeg !== false && p.foodType !== 'Non-Veg')
      : filteredProducts;
    source.forEach(p => {
      const c = p.categoryLabel || p.category;
      if (c && c.trim()) set.add(c.trim());
    });
    return ['all', ...Array.from(set)];
  }, [filteredProducts, isVegOnly]);

  // Products after category filter and veg-only filter are applied
  const displayedProducts = useMemo(() => {
    let prods = filteredProducts;
    if (activeCategoryFilter !== 'all') {
      prods = prods.filter(p => {
        const c = (p.categoryLabel || p.category || '').toLowerCase();
        return c === activeCategoryFilter.toLowerCase();
      });
    }
    if (isVegOnly) {
      prods = prods.filter(p => p.isVeg !== false && p.foodType !== 'Non-Veg');
    }
    return prods;
  }, [filteredProducts, activeCategoryFilter, isVegOnly]);

  // Top Suggestion / Category Carousel Cards matching Image 3 (Strictly dynamic from superadmin categories)
  const suggestionCards = useMemo(() => {
    const list = [];
    const seenTitles = new Set();

    // Include dynamic categories created by superadmin
    (categories || []).forEach((cat, idx) => {
      const catLabel = cat.label || cat.name;
      if (!catLabel || seenTitles.has(catLabel.toLowerCase())) return;

      const catProducts = effectiveProducts.filter(p => 
        (p.category && p.category.toLowerCase() === catLabel.toLowerCase()) ||
        (p.categoryLabel && p.categoryLabel.toLowerCase() === catLabel.toLowerCase())
      );

      const firstImage = catProducts[0]?.image || cat.icon || '';

      list.push({
        id: `cat-${cat.id || cat._id || idx}`,
        title: catLabel,
        subtitle: catProducts.length > 0 ? `${catProducts.length} ${catProducts.length === 1 ? 'Dish' : 'Dishes'}` : catLabel,
        image: firstImage,
        categoryName: catLabel,
        categoryId: cat.id || cat._id,
        isNew: Boolean(cat.badge && cat.badge.toLowerCase().includes('new'))
      });
      seenTitles.add(catLabel.toLowerCase());
    });

    return list.slice(0, 10);
  }, [categories, effectiveProducts]);

  // Click on a top suggestion card (Filters to that category and shows related products)
  const handleSuggestionCardClick = (card) => {
    if (card.categoryName) {
      setActiveCategoryFilter('all');
      setSearchQuery('');
      setDebouncedQuery('');
      setActiveFilterMeta({
        type: 'category',
        label: card.categoryName,
        categoryId: card.categoryId,
        query: card.categoryName
      });
      recordRecentSearch(card.categoryName);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] bg-white dark:bg-[#0a0a0a] flex flex-col overflow-hidden animate-in fade-in duration-200"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* ============================================================== */}
      {/* 1. TOP SEARCH BAR (Exact matching user's Image 2) */}
      {/* ============================================================== */}
      <div className="shrink-0 bg-white dark:bg-[#121214] px-4 pt-3 pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="max-w-2xl mx-auto flex items-center gap-2.5">
          {/* Rounded Search Container with left arrow & Search... placeholder (Image 2) */}
          <div className="flex-1 flex items-center bg-white dark:bg-zinc-900 rounded-2xl px-3.5 h-12 border border-zinc-300 dark:border-zinc-700 focus-within:border-zinc-500 dark:focus-within:border-zinc-400 transition-all shadow-xs">
            <button
              type="button"
              onClick={onClose}
              title="Go back"
              aria-label="Go back"
              className="p-1 -ml-1 text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-transform cursor-pointer bg-transparent border-0 flex items-center justify-center shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-700 dark:text-zinc-300" strokeWidth={2.2} />
            </button>

            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                setSearchQuery(val);
                if (!val.trim()) {
                  setActiveFilterMeta(null);
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (searchQuery.trim()) {
                    recordRecentSearch(searchQuery.trim());
                    inputRef.current?.blur();
                  }
                }
              }}
              placeholder="Search..."
              className="w-full bg-transparent border-0 outline-none px-2.5 text-sm sm:text-base font-medium text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
            />

            {(searchQuery || activeFilterMeta) && (
              <button
                type="button"
                onClick={handleClearFilter}
                className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer bg-transparent border-0 flex items-center justify-center shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 2. BODY CONTENT (Scrollable) */}
      {/* ============================================================== */}
      <div className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
        <div className="max-w-2xl mx-auto space-y-6 pb-20">

          {/* ============================================================== */}
          {/* CASE A: USER IS SEARCHING -> SHOW EXACT SEARCH RESULTS (IMAGE 3) */}
          {/* ============================================================== */}
          {(debouncedQuery.trim() !== '' || activeFilterMeta) ? (
            <div className="space-y-4">
              {/* Top Horizontal Suggestions / Category Cards Carousel matching user screenshot */}
              {suggestionCards.length > 0 && (
                <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
                  {suggestionCards.map((card) => (
                    <div
                      key={card.id}
                      onClick={() => handleSuggestionCardClick(card)}
                      className="border border-zinc-200/90 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-900 p-2.5 flex items-center gap-3 shrink-0 min-w-[210px] sm:min-w-[240px] shadow-2xs hover:shadow-xs transition-all cursor-pointer group hover:border-zinc-300 dark:hover:border-zinc-700"
                    >
                      {/* Round Image with optional NEW badge */}
                      <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0 border border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800">
                        {card.image ? (
                          <img
                            src={card.image}
                            alt={card.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg">
                            🍕
                          </div>
                        )}
                        {card.isNew && (
                          <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-[#FFD700] text-black text-[7px] font-extrabold px-1.5 py-0.2 rounded-full shadow-2xs uppercase tracking-tight">
                            NEW
                          </span>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                          {card.title}
                        </h4>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                          {card.subtitle}
                        </p>
                      </div>

                      {/* Right Arrow */}
                      <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-700 dark:group-hover:text-zinc-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Header: "{Count} Picks for query" + Veg Mark Toggle Button */}
              <div className="pt-1 flex items-center justify-between gap-2">
                <h3 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                  {displayedProducts.length} Picks for "{searchQuery || debouncedQuery || activeFilterMeta?.label || 'your search'}"
                </h3>
                {menuFilters?.vegOnly?.enabled !== false && (
                  <button
                    type="button"
                    onClick={toggleVegOnly}
                    title={isVegOnly ? "Showing Veg Only items" : "Show All items"}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer shrink-0 shadow-2xs ${
                      isVegOnly
                        ? "bg-green-50 dark:bg-green-950/40 border-green-600 text-green-700 dark:text-green-400 ring-1 ring-green-600/30"
                        : "bg-white hover:bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300"
                    }`}
                  >
                    <span className="w-3.5 h-3.5 border-[1.5px] border-green-600 p-[1.5px] rounded-[3px] flex items-center justify-center bg-transparent shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600 block" />
                    </span>
                    <span className="text-[11px] font-bold">Veg</span>
                  </button>
                )}
              </div>

              {/* Horizontal Category Filter Pills matching screenshot: [ All ] [ Veg Pizza ] [ Cheese Burst Pizza ] ... */}
              {availableCategories.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
                  {availableCategories.map((catKey) => {
                    const isActive = activeCategoryFilter.toLowerCase() === catKey.toLowerCase();
                    const label = catKey === 'all' ? 'All' : catKey;
                    return (
                      <button
                        key={catKey}
                        type="button"
                        onClick={() => setActiveCategoryFilter(catKey)}
                        className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                          isActive
                            ? 'bg-zinc-900 text-white shadow-2xs'
                            : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/90 dark:border-zinc-700 hover:border-zinc-300 shadow-2xs'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Food Product List matching screenshot (Image 3) */}
              {displayedProducts.length > 0 ? (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {displayedProducts.map((item) => {
                    const hasDiscount = item.originalPrice && Number(item.originalPrice) > Number(item.price);
                    const calculatedDiscount = hasDiscount ? Number(item.originalPrice) - Number(item.price) : 0;
                    const saveAmount = (item.saveAmount && Number(item.saveAmount) > 0) ? Number(item.saveAmount) : calculatedDiscount;

                    let subtitle = '';
                    if (item.showCrust !== false && item.defaultCrust) {
                      subtitle = `Regular | ${item.defaultCrust}`;
                    } else if (item.categoryLabel || item.category) {
                      subtitle = item.categoryLabel || item.category;
                    } else {
                      subtitle = 'Regular';
                    }

                    return (
                      <div
                        key={item.id || item._id}
                        onClick={() => {
                          recordViewedProduct(item);
                          recordRecentSearch(item.title);
                          onOpenCustomize(item);
                        }}
                        className="flex items-start gap-3.5 py-4 cursor-pointer group hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 -mx-2 px-2 rounded-xl transition-colors"
                      >
                        {/* Left: Square Food Thumbnail */}
                        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden bg-zinc-100 dark:bg-zinc-800 shrink-0 shadow-2xs">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300 text-2xl">
                              🍕
                            </div>
                          )}
                          {saveAmount > 0 && (
                            <span className="absolute top-1.5 left-1.5 bg-[#169B45] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                              Save ₹{saveAmount}
                            </span>
                          )}
                        </div>

                        {/* Right: Product Info */}
                        <div className="flex-1 min-w-0 flex flex-col justify-between self-stretch py-0.5">
                          <div>
                            {/* Veg dot icon + Title */}
                            <div className="flex items-center gap-1.5">
                              <span className="border border-green-600 p-[1.5px] rounded-[3px] w-3.5 h-3.5 flex items-center justify-center shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-green-600 block" />
                              </span>
                              <h4 className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white truncate">
                                {item.title}
                              </h4>
                            </div>

                            {/* Subtitle Line (Regular | Crust) */}
                            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 truncate font-medium">
                              {subtitle}
                            </p>

                            {/* Ingredients or Matched Reason */}
                            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5 line-clamp-2 leading-relaxed">
                              {item._matchedReason ? (
                                <span className="text-emerald-600 dark:text-emerald-400 font-semibold inline-flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                  {item._matchedReason}
                                </span>
                              ) : (
                                item.toppingsSummary || item.description || ''
                              )}
                            </p>
                          </div>

                          {/* Bottom: Price + Red Add Button */}
                          <div className="flex items-center justify-between pt-2 mt-auto">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-white">
                                ₹{item.price}
                              </span>
                              {hasDiscount && (
                                <span className="text-xs text-zinc-400 line-through">
                                  ₹{item.originalPrice}
                                </span>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                recordViewedProduct(item);
                                recordRecentSearch(item.title);
                                if (onAddToCart) {
                                  onAddToCart(item);
                                } else {
                                  onOpenCustomize(item);
                                }
                              }}
                              className="px-5 py-1.5 rounded-lg bg-[#EE3A43] hover:bg-[#d92d36] text-white font-bold text-xs sm:text-sm shadow-xs active:scale-95 transition-all cursor-pointer"
                            >
                              Add +
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mx-auto text-zinc-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-200">
                      {activeFilterMeta?.type === 'addon'
                        ? `No dishes currently use "${activeFilterMeta.label}"`
                        : `No dishes found matching "${debouncedQuery || activeFilterMeta?.label}"`}
                    </h4>
                    <p className="text-xs text-zinc-400 mt-1">
                      {activeFilterMeta?.type === 'addon'
                        ? 'Try selecting another topping or crust, or check popular pizzas below:'
                        : 'Check your spelling or explore our popular trending pizza picks below:'}
                    </p>
                  </div>
                  {/* Quick fallback popular pills */}
                  <div className="flex flex-wrap justify-center gap-2 pt-2">
                    {displayPopularPills.slice(0, 4).map((p, i) => (
                      <button
                        key={p._id || i}
                        type="button"
                        onClick={() => handlePopularClick(p)}
                        className="px-3 py-1 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 text-xs rounded-full text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer"
                      >
                        {p.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* ============================================================== */}
              {/* SECTION 1: RECENT & POPULAR (Strictly 5 Pills, Clear Recent) */}
              {/* Exact matching user's Image 1 */}
              {/* ============================================================== */}
              {searchConfig.isPopularEnabled !== false && displayPopularPills.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block">
                      {recentSearches.length > 0 ? 'RECENT & POPULAR' : 'POPULAR'}
                    </span>
                    {recentSearches.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearRecent}
                        className="text-xs text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 font-medium underline decoration-dotted underline-offset-2 transition-colors cursor-pointer bg-transparent border-0"
                      >
                        Clear Recent
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2.5">
                    {displayPopularPills.map((item) => (
                      <button
                        key={item._id || item.text}
                        type="button"
                        onClick={() => handlePopularClick(item)}
                        className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-zinc-200/90 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 text-xs sm:text-sm font-medium shadow-2xs hover:border-zinc-400 dark:hover:border-zinc-500 active:scale-95 transition-all cursor-pointer"
                      >
                        {item.isRecent ? (
                          <Search className="w-3.5 h-3.5 text-zinc-400 shrink-0" strokeWidth={2.2} />
                        ) : (
                          <span className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600 flex items-center justify-center text-[10px] text-zinc-400 font-bold shrink-0">
                            ↗
                          </span>
                        )}
                        <span>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SECTION 2: SEARCH BY (Tabs with Light Blue Bubble Container) */}
              {/* ============================================================== */}
              {searchConfig.isSearchByEnabled !== false && Array.isArray(searchConfig.searchByTabs) && searchConfig.searchByTabs.length > 0 && (
                <div className="space-y-2.5 pt-1">
                  <span className="text-[11px] font-bold tracking-wider text-zinc-500 uppercase block">
                    SEARCH BY
                  </span>

                  {/* Tabs row with Chevron indicator matching screenshot */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {searchConfig.searchByTabs.map((tab) => {
                      const isActive = (tab.key || '').toLowerCase() === (activeSearchByTabKey || '').toLowerCase();

                      return (
                        <button
                          key={tab._id || tab.name}
                          type="button"
                          onClick={() => setActiveSearchByTabKey(tab.key || tab.name.toLowerCase())}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
                            isActive
                              ? 'bg-[#EBF3FF] text-[#0066CC] border border-[#BFDBFE]'
                              : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200/80 dark:border-zinc-700 hover:border-zinc-300'
                          }`}
                        >
                          <span>{tab.name}</span>
                          {isActive ? (
                            <ChevronUp className="w-3.5 h-3.5 text-[#0066CC]" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Light Blue Container Bubble with Caret Indicator */}
                  {activeSearchByTab && Array.isArray(activeSearchByTab.items) && activeSearchByTab.items.length > 0 && (
                    <div className="relative mt-2">
                      {/* Caret pointer pointing up to active tab */}
                      <div className="absolute -top-1.5 left-7 w-3 h-3 bg-[#EEF5FF] dark:bg-blue-950/40 border-l border-t border-[#BFDBFE] dark:border-blue-900/40 transform rotate-45 z-10" />

                      <div className="relative bg-[#EEF5FF] dark:bg-blue-950/20 border border-[#BFDBFE] dark:border-blue-900/40 rounded-2xl p-3.5 shadow-2xs">
                        <div className="flex flex-wrap gap-2.5">
                          {activeSearchByTab.items.map((subPill, idx) => (
                            <button
                              key={subPill._id || idx}
                              type="button"
                              onClick={() => handleAddonClick(subPill)}
                              className="inline-flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-700 rounded-xl shadow-2xs hover:border-zinc-400 active:scale-95 transition-all cursor-pointer text-left"
                            >
                              {/* Pizza slice or thumbnail image matching screenshot */}
                              {subPill.image ? (
                                <img
                                  src={subPill.image}
                                  alt={subPill.title}
                                  className="w-5 h-5 rounded-md object-cover bg-zinc-100 dark:bg-zinc-800 shrink-0"
                                  onError={(e) => {
                                    e.target.style.display = 'none';
                                  }}
                                />
                              ) : (
                                <span className="text-sm">🍕</span>
                              )}
                              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 whitespace-nowrap">
                                {subPill.title}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ============================================================== */}
              {/* SECTION 3: RECENTLY VIEWED BY YOU (Horizontal Cards) */}
              {/* ============================================================== */}
              {searchConfig.isRecentlyViewedEnabled !== false && recentlyViewed.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white">
                    Recently Viewed by You
                  </h3>

                  {/* Horizontal Scroll Cards matching exact screenshot */}
                  <div className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
                    {recentlyViewed.map((item) => {
                      const hasDiscount = item.originalPrice && Number(item.originalPrice) > Number(item.price);
                      const calculatedDiscount = hasDiscount ? Number(item.originalPrice) - Number(item.price) : 0;
                      const saveAmount = (item.saveAmount && Number(item.saveAmount) > 0) ? Number(item.saveAmount) : calculatedDiscount;

                      let subtitle = "";
                      if (item.showCrust !== false && item.defaultCrust) {
                        subtitle = `Regular | ${item.defaultCrust}`;
                      } else if (item.categoryLabel || item.category) {
                        subtitle = item.categoryLabel || item.category;
                      } else if (item.toppingsSummary) {
                        subtitle = item.toppingsSummary;
                      } else {
                        subtitle = "Regular";
                      }

                      return (
                        <div
                          key={item.id || item._id}
                          onClick={() => {
                            recordViewedProduct(item);
                            onOpenCustomize(item);
                          }}
                          className="w-40 sm:w-44 shrink-0 rounded-2xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xs hover:shadow-xs transition-all overflow-hidden flex flex-col cursor-pointer group"
                        >
                          {/* Image with Green Save Badge */}
                          <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                loading="lazy"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-300 text-xl">
                                🍕
                              </div>
                            )}

                            {/* Green Save Badge on top left matching screenshot */}
                            {saveAmount > 0 && (
                              <span className="absolute top-0 left-0 bg-[#DCFCE7] text-[#15803D] dark:bg-emerald-950/90 dark:text-emerald-300 font-bold text-[10px] px-2.5 py-0.5 rounded-br-lg shadow-2xs">
                                Save ₹{saveAmount}
                              </span>
                            )}
                          </div>

                          {/* Info Area */}
                          <div className="p-3 flex-1 flex flex-col justify-between">
                            <div>
                              {/* Veg Icon + Product Title */}
                              <div className="flex items-center gap-1.5">
                                <span className="border border-green-600 p-[1.5px] rounded-[3px] w-3 h-3 flex items-center justify-center shrink-0">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 block" />
                                </span>
                                <h4 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">
                                  {item.title}
                                </h4>
                              </div>

                              {/* Subtitle / variant description */}
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1 truncate">
                                {subtitle}
                              </p>
                            </div>

                            {/* Price & Add Button */}
                            <div className="mt-2.5 flex items-center justify-between gap-1">
                              <div className="flex items-baseline gap-1">
                                <span className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white">
                                  ₹{item.price}
                                </span>
                                {hasDiscount && (
                                  <span className="text-[10px] text-zinc-400 line-through">
                                    ₹{item.originalPrice}
                                  </span>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  recordViewedProduct(item);
                                  onOpenCustomize(item);
                                }}
                                className="px-3 py-1 rounded-lg bg-[#EE3A43] hover:bg-[#d92d36] text-white font-bold text-xs shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                              >
                                Add +
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ============================================================== */}
              {/* SECTION 4: OUR NEW LAUNCHES (Horizontal Pure Poster Cards) */}
              {/* ============================================================== */}
              {searchConfig.isNewLaunchesEnabled !== false && (
                ((searchConfig.newLaunches && searchConfig.newLaunches.length > 0) ? searchConfig.newLaunches : DEFAULT_NEW_LAUNCHES).length > 0
              ) && (
                <div className="space-y-3 pt-2">
                  <h3 className="font-bold text-base sm:text-lg text-zinc-900 dark:text-white">
                    Our New Launches
                  </h3>

                  {/* Horizontal Scroll of pure poster images matching user's exact specification */}
                  <div className="flex items-stretch gap-3.5 overflow-x-auto pb-2 scrollbar-none -mx-4 px-4">
                    {((searchConfig.newLaunches && searchConfig.newLaunches.length > 0) ? searchConfig.newLaunches : DEFAULT_NEW_LAUNCHES).map((launch, idx) => (
                      <div
                        key={launch._id || idx}
                        onClick={() => {
                          const q = launch.searchQuery || launch.title;
                          if (q && q.trim()) {
                            setSearchQuery(q.trim());
                            setDebouncedQuery(q.trim());
                          }
                        }}
                        className="w-44 sm:w-52 shrink-0 aspect-[4/5] rounded-2xl overflow-hidden shadow-2xs border border-zinc-200/80 dark:border-zinc-800 relative group cursor-pointer bg-zinc-100 dark:bg-zinc-800 transition-transform active:scale-95"
                      >
                        <img
                          src={launch.image}
                          alt={launch.title || 'New Launch Poster'}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}
