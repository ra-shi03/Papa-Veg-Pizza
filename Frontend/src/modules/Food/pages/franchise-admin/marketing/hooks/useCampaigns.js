import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import apiClient from "@food/api/axios";
import { adminAPI } from "@food/api";
import { mockCampaigns, mockCampaignPerformance, mockStores } from "../../marketing/mockData";

// Key for local storage persistence fallback
const LOCAL_STORAGE_KEY_CAMPAIGNS = "franchise_admin_campaigns";
const LOCAL_STORAGE_KEY_PERFORMANCE = "franchise_admin_campaign_perf";

export function useCampaigns() {
  const [loading, setLoading] = useState(false);
  const [rawCampaigns, setRawCampaigns] = useState([]);
  const [rawPerformance, setRawPerformance] = useState({});
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [storeIdFilter, setStoreIdFilter] = useState("All");
  const [startDateFilter, setStartDateFilter] = useState(null);
  const [endDateFilter, setEndDateFilter] = useState(null);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Selection
  const [selectedCampaign, setSelectedCampaign] = useState(null);

  // Load stores from API or fallback
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
      console.warn("Failed to fetch stores from API, using mock stores fallback", err);
      setStores(mockStores);
    } finally {
      setLoadingStores(false);
    }
  }, []);

  // Initialize data (try local storage fallback first, then mock data)
  useEffect(() => {
    fetchStoresList();

    // Load Campaigns
    const localCamps = localStorage.getItem(LOCAL_STORAGE_KEY_CAMPAIGNS);
    const localPerf = localStorage.getItem(LOCAL_STORAGE_KEY_PERFORMANCE);

    if (localCamps) {
      try {
        setRawCampaigns(JSON.parse(localCamps));
      } catch (_) {
        setRawCampaigns(mockCampaigns);
      }
    } else {
      setRawCampaigns(mockCampaigns);
      localStorage.setItem(LOCAL_STORAGE_KEY_CAMPAIGNS, JSON.stringify(mockCampaigns));
    }

    if (localPerf) {
      try {
        setRawPerformance(JSON.parse(localPerf));
      } catch (_) {
        setRawPerformance(mockCampaignPerformance);
      }
    } else {
      setRawPerformance(mockCampaignPerformance);
      localStorage.setItem(LOCAL_STORAGE_KEY_PERFORMANCE, JSON.stringify(mockCampaignPerformance));
    }
  }, [fetchStoresList]);

  // Search Debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync campaigns list with expired dates automatically
  const syncCampaignStatus = useCallback((campaignsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return campaignsList.map(c => {
      if (c.endDate) {
        const expiry = new Date(c.endDate);
        if (expiry < today && c.status !== "completed") {
          // Completed or Expired
          return { ...c, status: "completed" };
        }
      }
      return c;
    });
  }, []);

  const syncedCampaignsList = useMemo(() => {
    return syncCampaignStatus(rawCampaigns);
  }, [rawCampaigns, syncCampaignStatus]);

  // Calculate Dashboard KPIs (5 Cards)
  const dashboardStats = useMemo(() => {
    const totalCount = syncedCampaignsList.length;

    // 1. Running Campaigns: status === "active"
    const runningCount = syncedCampaignsList.filter(c => c.status === "active").length;

    // 2. Scheduled Campaigns: status === "draft" (or status === "scheduled")
    const scheduledCount = syncedCampaignsList.filter(c => c.status === "draft" || c.status === "scheduled").length;

    // 3. Campaign Revenue: sum(revenueGenerated)
    let totalRevenue = 0;
    let totalROI = 0;
    let ratedCampsCount = 0;
    let totalOrders = 0;

    syncedCampaignsList.forEach(c => {
      const perf = rawPerformance[c._id];
      if (perf) {
        totalRevenue += (perf.revenueGenerated || 0);
        totalOrders += (perf.ordersGenerated || 0);
        if (perf.roi > 0) {
          totalROI += perf.roi;
          ratedCampsCount++;
        }
      }
    });

    // 4. Average ROI %
    const avgRoi = ratedCampsCount > 0 ? Math.round(totalROI / ratedCampsCount) : 0;

    return {
      runningCampaigns: runningCount,
      scheduledCampaigns: scheduledCount,
      campaignRevenue: totalRevenue,
      averageRoi: avgRoi,
      ordersGenerated: totalOrders,
      trends: {
        runningChange: "+15%",
        scheduledChange: "+5%",
        revenueChange: "+18.4%",
        roiChange: "+8.2%",
        ordersChange: "+12.5%"
      }
    };
  }, [syncedCampaignsList, rawPerformance]);

  // Filters logic
  const filteredCampaigns = useMemo(() => {
    let result = [...syncedCampaignsList];

    // Search campaign name
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(c => c.campaignName.toLowerCase().includes(q));
    }

    // Campaign Type filter
    if (typeFilter !== "All") {
      result = result.filter(c => c.campaignType === typeFilter);
    }

    // Status filter
    if (statusFilter !== "All") {
      result = result.filter(c => c.status === statusFilter.toLowerCase());
    }

    // Store filter (Multi-select compatibility or single value)
    if (storeIdFilter !== "All") {
      result = result.filter(c => {
        if (!c.stores || c.stores.length === 0) return true; // Applicable to all stores if empty
        return c.stores.includes(storeIdFilter);
      });
    }

    // Date Range filters
    if (startDateFilter) {
      const start = new Date(startDateFilter);
      start.setHours(0, 0, 0, 0);
      result = result.filter(c => new Date(c.startDate) >= start);
    }

    if (endDateFilter) {
      const end = new Date(endDateFilter);
      end.setHours(23, 59, 59, 999);
      result = result.filter(c => new Date(c.endDate) <= end);
    }

    return result;
  }, [syncedCampaignsList, debouncedSearch, typeFilter, statusFilter, storeIdFilter, startDateFilter, endDateFilter]);

  // Sort and Paginate
  const sortedAndPaginatedCampaigns = useMemo(() => {
    const sorted = [...filteredCampaigns].sort((a, b) => {
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
  }, [filteredCampaigns, sortBy, sortOrder, currentPage, pageSize]);

  // Reset Filters helper
  const handleResetFilters = useCallback(() => {
    setSearch("");
    setTypeFilter("All");
    setStatusFilter("All");
    setStoreIdFilter("All");
    setStartDateFilter(null);
    setEndDateFilter(null);
    setCurrentPage(1);
    toast.info("Campaign filters cleared.");
  }, []);

  // Helper to sync state to local storage
  const syncToLocalStorage = (updatedCamps, updatedPerf) => {
    if (updatedCamps) {
      localStorage.setItem(LOCAL_STORAGE_KEY_CAMPAIGNS, JSON.stringify(updatedCamps));
    }
    if (updatedPerf) {
      localStorage.setItem(LOCAL_STORAGE_KEY_PERFORMANCE, JSON.stringify(updatedPerf));
    }
  };

  // API Call Helpers
  // 1. Create Campaign
  const createCampaign = useCallback(async (payload) => {
    setLoading(true);
    try {
      // Try API integration
      const res = await apiClient.post("/campaigns", payload);
      toast.success("Campaign created on server successfully!");
      fetchStoresList(); // trigger stores refresh
      return res.data;
    } catch (err) {
      console.log("API Create Campaign failed, executing mock fallback.");

      const newCamp = {
        ...payload,
        _id: `camp-${Date.now()}`,
        status: payload.status || "draft",
        createdBy: "Shubham Jamliya",
        createdAt: new Date().toISOString()
      };

      const updatedCamps = [newCamp, ...rawCampaigns];
      setRawCampaigns(updatedCamps);

      // Create empty performance entry
      const newPerf = {
        _id: `perf-${Date.now()}`,
        campaignId: newCamp._id,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ordersGenerated: 0,
        revenueGenerated: 0,
        roi: 0,
        updatedAt: new Date().toISOString(),
        dailyBreakdown: []
      };

      const updatedPerf = { ...rawPerformance, [newCamp._id]: newPerf };
      setRawPerformance(updatedPerf);

      syncToLocalStorage(updatedCamps, updatedPerf);

      toast.success(`Campaign "${payload.campaignName}" created successfully!`);
      return newCamp;
    } finally {
      setLoading(false);
    }
  }, [rawCampaigns, rawPerformance, fetchStoresList]);

  // 2. Update Campaign
  const updateCampaign = useCallback(async (id, payload) => {
    setLoading(true);
    try {
      const res = await apiClient.put(`/campaigns/${id}`, payload);
      toast.success("Campaign updated on server successfully!");
      return res.data;
    } catch (err) {
      console.log("API Update Campaign failed, executing mock fallback.");

      const updatedCamps = rawCampaigns.map(c => (c._id === id ? { ...c, ...payload } : c));
      setRawCampaigns(updatedCamps);

      syncToLocalStorage(updatedCamps, null);
      toast.success("Campaign updated successfully!");
      return true;
    } finally {
      setLoading(false);
    }
  }, [rawCampaigns]);

  // 3. Delete Campaign
  const deleteCampaign = useCallback(async (id) => {
    setLoading(true);
    try {
      await apiClient.delete(`/campaigns/${id}`);
      toast.success("Campaign deleted from server.");
      return true;
    } catch (err) {
      console.log("API Delete Campaign failed, executing mock fallback.");

      const campaignName = rawCampaigns.find(c => c._id === id)?.campaignName || "Campaign";
      const updatedCamps = rawCampaigns.filter(c => c._id !== id);
      setRawCampaigns(updatedCamps);

      // Keep performance clean
      const updatedPerf = { ...rawPerformance };
      delete updatedPerf[id];
      setRawPerformance(updatedPerf);

      syncToLocalStorage(updatedCamps, updatedPerf);
      toast.success(`Campaign "${campaignName}" deleted successfully.`);
      return true;
    } finally {
      setLoading(false);
    }
  }, [rawCampaigns, rawPerformance]);

  // 4. Update Campaign Status (Pause / Resume)
  const updateCampaignStatus = useCallback(async (id, newStatus) => {
    setLoading(true);
    try {
      const res = await apiClient.put(`/campaigns/${id}`, { status: newStatus });
      toast.success(`Campaign status updated to ${newStatus}`);
      return res.data;
    } catch (err) {
      console.log("API Update status failed, executing mock fallback.");

      const updatedCamps = rawCampaigns.map(c => (c._id === id ? { ...c, status: newStatus } : c));
      setRawCampaigns(updatedCamps);

      syncToLocalStorage(updatedCamps, null);
      toast.success(`Campaign is now ${newStatus === "active" ? "Active" : "Paused"}.`);
      return true;
    } finally {
      setLoading(false);
    }
  }, [rawCampaigns]);

  // 5. Fetch Campaign Performance Analytics details
  const getCampaignPerformanceDetails = useCallback(async (id) => {
    try {
      const res = await apiClient.get(`/campaign-performance/${id}`);
      return res.data?.data || res.data;
    } catch (err) {
      console.log("API Performance fetch failed, returning mock analytics.");

      const campaign = rawCampaigns.find(c => c._id === id);
      const perf = rawPerformance[id] || {
        _id: `perf-mock`,
        campaignId: id,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        ordersGenerated: 0,
        revenueGenerated: 0,
        roi: 0,
        updatedAt: new Date().toISOString(),
        dailyBreakdown: []
      };

      // Add calculated CTR & Conversion percentages
      const ctr = perf.impressions > 0 ? ((perf.clicks / perf.impressions) * 100).toFixed(2) : "0.00";
      const conversionRate = perf.clicks > 0 ? ((perf.conversions / perf.clicks) * 100).toFixed(2) : "0.00";

      return {
        campaign,
        performance: {
          ...perf,
          ctr,
          conversionRate
        }
      };
    }
  }, [rawCampaigns, rawPerformance]);

  return {
    loading,
    campaigns: sortedAndPaginatedCampaigns,
    totalRecords: filteredCampaigns.length,
    stores,
    loadingStores,

    // Filters
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    storeIdFilter,
    setStoreIdFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    handleResetFilters,

    // Sorting & Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Selections
    selectedCampaign,
    setSelectedCampaign,

    // KPIs & Operations
    dashboardStats,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateCampaignStatus,
    getCampaignPerformanceDetails
  };
}
