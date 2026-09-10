import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import apiClient from "@food/api/axios";
import { adminAPI } from "@food/api";
import { mockBanners, mockStores, mockProducts, mockCategories, mockCoupons, mockCampaigns } from "../../marketing/mockData";

const LOCAL_STORAGE_KEY_BANNERS = "franchise_admin_banners";

export function useBanners() {
  const [loading, setLoading] = useState(false);
  const [rawBanners, setRawBanners] = useState([]);

  // Dynamic Option lists
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [redirectTypeFilter, setRedirectTypeFilter] = useState("All");
  const [storeIdFilter, setStoreIdFilter] = useState("All");

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Selection
  const [selectedBanner, setSelectedBanner] = useState(null);

  // Fetch Outlets
  const fetchStoresList = useCallback(async () => {
    setLoadingStores(true);
    try {
      const res = await adminAPI.getStores({ limit: 1000 });
      const fetchedStores = res?.data?.data?.stores || res?.data?.stores || [];
      if (fetchedStores.length > 0) {
        setStores(fetchedStores);
      } else {
        setStores(mockStores);
      }
    } catch (err) {
      console.warn("Failed fetching outlets from API, using mock stores fallback.", err);
      setStores(mockStores);
    } finally {
      setLoadingStores(false);
    }
  }, []);

  // Fetch Option Dropdowns
  const fetchOptionDropdowns = useCallback(async () => {
    try {
      // Products
      const prodRes = await apiClient.get("/products");
      setProducts(prodRes.data?.data || prodRes.data || mockProducts);
    } catch (_) {
      setProducts(mockProducts);
    }

    try {
      // Categories
      const catRes = await apiClient.get("/categories");
      setCategories(catRes.data?.data || catRes.data || mockCategories);
    } catch (_) {
      setCategories(mockCategories);
    }

    try {
      // Coupons
      const coupRes = await apiClient.get("/coupons");
      setCoupons(coupRes.data?.data || coupRes.data || mockCoupons);
    } catch (_) {
      setCoupons(mockCoupons);
    }

    try {
      // Campaigns
      const campRes = await apiClient.get("/campaigns");
      setCampaigns(campRes.data?.data || campRes.data || mockCampaigns);
    } catch (_) {
      setCampaigns(mockCampaigns);
    }
  }, []);

  // Initialize
  useEffect(() => {
    fetchStoresList();
    fetchOptionDropdowns();

    const localBanners = localStorage.getItem(LOCAL_STORAGE_KEY_BANNERS);
    if (localBanners) {
      try {
        setRawBanners(JSON.parse(localBanners));
      } catch (_) {
        setRawBanners(mockBanners);
      }
    } else {
      setRawBanners(mockBanners);
      localStorage.setItem(LOCAL_STORAGE_KEY_BANNERS, JSON.stringify(mockBanners));
    }
  }, [fetchStoresList, fetchOptionDropdowns]);

  // Search Debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync statuses based on dates
  const syncBannersStatus = useCallback((bannersList) => {
    const now = new Date();
    return bannersList.map(b => {
      const start = new Date(b.startDate);
      const end = new Date(b.endDate);

      let computedStatus = b.status;
      if (end < now) {
        computedStatus = "expired";
      } else if (start > now) {
        computedStatus = "scheduled";
      } else if (b.status === "active") {
        computedStatus = "active";
      } else {
        computedStatus = "inactive";
      }
      return { ...b, computedStatus };
    });
  }, []);

  const syncedBanners = useMemo(() => {
    return syncBannersStatus(rawBanners);
  }, [rawBanners, syncBannersStatus]);

  // Dashboard Stats Calculations
  const dashboardStats = useMemo(() => {
    const total = syncedBanners.length;
    const active = syncedBanners.filter(b => b.computedStatus === "active").length;
    const scheduled = syncedBanners.filter(b => b.computedStatus === "scheduled").length;
    const expired = syncedBanners.filter(b => b.computedStatus === "expired").length;

    return {
      total,
      active,
      scheduled,
      expired,
      trends: {
        totalChange: "+4.2%",
        activeChange: "+8.5%",
        scheduledChange: "+12.1%",
        expiredChange: "-3.6%"
      }
    };
  }, [syncedBanners]);

  // Filtering
  const filteredBanners = useMemo(() => {
    let result = [...syncedBanners];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.subtitle?.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "All") {
      result = result.filter(b => b.computedStatus === statusFilter.toLowerCase());
    }

    if (redirectTypeFilter !== "All") {
      result = result.filter(b => b.redirectType === redirectTypeFilter.toLowerCase());
    }

    if (storeIdFilter !== "All" && storeIdFilter) {
      result = result.filter(b =>
        !b.stores ||
        b.stores.length === 0 ||
        b.stores.includes(storeIdFilter)
      );
    }

    return result;
  }, [syncedBanners, debouncedSearch, statusFilter, redirectTypeFilter, storeIdFilter]);

  // Sorting & Pagination
  const sortedAndPaginatedBanners = useMemo(() => {
    const sorted = [...filteredBanners].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "startDate" || sortBy === "endDate") {
        return sortOrder === "asc"
          ? new Date(aVal) - new Date(bVal)
          : new Date(bVal) - new Date(aVal);
      }

      if (typeof aVal === "string") {
        return sortOrder === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortOrder === "asc" ? aVal - bVal : bVal - aVal;
    });

    const startIndex = (currentPage - 1) * pageSize;
    return sorted.slice(startIndex, startIndex + pageSize);
  }, [filteredBanners, sortBy, sortOrder, currentPage, pageSize]);

  // Reset Filters
  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatusFilter("All");
    setRedirectTypeFilter("All");
    setStoreIdFilter("All");
    setCurrentPage(1);
    toast.info("Banner directory filters cleared.");
  }, []);

  // Save to LocalStorage helper
  const saveToLocalStorage = (updatedList) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_BANNERS, JSON.stringify(updatedList));
    window.dispatchEvent(new Event("franchise_banners_changed"));
  };

  // Operations
  const createBanner = useCallback(async (payload) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/banners", payload);
      toast.success("Promotional banner created successfully on backend!");
      return res.data?.data || res.data;
    } catch (_) {
      console.warn("API Banner creation failed, executing mock fallback.");
      const newBanner = {
        ...payload,
        _id: `banner-${Date.now()}`,
        status: payload.status || "inactive",
        createdBy: "Shubham Jamliya",
        createdAt: new Date().toISOString()
      };
      const updatedList = [newBanner, ...rawBanners];
      setRawBanners(updatedList);
      saveToLocalStorage(updatedList);
      toast.success(`Banner "${payload.title}" created successfully (Offline mode).`);
      return newBanner;
    } finally {
      setLoading(false);
    }
  }, [rawBanners]);

  const updateBanner = useCallback(async (id, payload) => {
    setLoading(true);
    try {
      const res = await apiClient.put(`/banners/${id}`, payload);
      toast.success("Promotional banner updated successfully on backend!");
      return res.data?.data || res.data;
    } catch (_) {
      console.warn("API Banner update failed, executing mock fallback.");
      const updatedList = rawBanners.map(b => b._id === id ? { ...b, ...payload } : b);
      setRawBanners(updatedList);
      saveToLocalStorage(updatedList);
      toast.success("Banner settings updated successfully (Offline mode).");
      return true;
    } finally {
      setLoading(false);
    }
  }, [rawBanners]);

  const deleteBanner = useCallback(async (id) => {
    setLoading(true);
    try {
      await apiClient.delete(`/banners/${id}`);
      toast.success("Promotional banner deleted from backend.");
      return true;
    } catch (_) {
      console.warn("API Banner delete failed, executing mock fallback.");
      const deletedBanner = rawBanners.find(b => b._id === id);
      const updatedList = rawBanners.filter(b => b._id !== id);
      setRawBanners(updatedList);
      saveToLocalStorage(updatedList);
      toast.success(`Banner "${deletedBanner?.title || "selected"}" archived successfully.`);
      return true;
    } finally {
      setLoading(false);
    }
  }, [rawBanners]);

  const updateBannerStatus = useCallback(async (id, newStatus) => {
    setLoading(true);
    try {
      await apiClient.put(`/banners/${id}`, { status: newStatus });
      toast.success(`Banner is now ${newStatus}`);
      return true;
    } catch (_) {
      console.warn("API Banner status toggle failed, executing mock fallback.");
      const updatedList = rawBanners.map(b => b._id === id ? { ...b, status: newStatus } : b);
      setRawBanners(updatedList);
      saveToLocalStorage(updatedList);
      toast.success(`Banner status updated to ${newStatus} (Offline mode).`);
      return true;
    } finally {
      setLoading(false);
    }
  }, [rawBanners]);

  return {
    loading,
    banners: sortedAndPaginatedBanners,
    totalRecords: filteredBanners.length,
    stores,
    loadingStores,
    products,
    categories,
    coupons,
    campaigns,

    // Filters
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    redirectTypeFilter,
    setRedirectTypeFilter,
    storeIdFilter,
    setStoreIdFilter,
    handleResetFilters,

    // Pagination & Sorting
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Selection
    selectedBanner,
    setSelectedBanner,

    // Operations & KPIs
    dashboardStats,
    createBanner,
    updateBanner,
    deleteBanner,
    updateBannerStatus
  };
}
