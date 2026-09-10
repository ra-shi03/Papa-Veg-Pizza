import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import apiClient from "@food/api/axios";
import { adminAPI } from "@food/api";
import { mockNotifications, mockStores, mockNotificationLogs } from "../mockData";

const LOCAL_STORAGE_KEY_NOTIFICATIONS = "franchise_admin_notifications";
const LOCAL_STORAGE_KEY_NOTIF_LOGS = "franchise_admin_notification_logs";

export function useNotifications() {
  const [loading, setLoading] = useState(false);
  const [rawNotifications, setRawNotifications] = useState([]);
  
  // Option lists
  const [stores, setStores] = useState([]);
  const [loadingStores, setLoadingStores] = useState(false);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [channelFilter, setChannelFilter] = useState("All");
  const [audienceFilter, setAudienceFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [startDateFilter, setStartDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Selection & Details
  const [selectedNotification, setSelectedNotification] = useState(null);
  
  // Analytics Drawer States
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [logsList, setLogsList] = useState({ list: [], totalCount: 0, page: 1, limit: 10 });
  const [logSearch, setLogSearch] = useState("");
  const [debouncedLogSearch, setDebouncedLogSearch] = useState("");
  const [logPage, setLogPage] = useState(1);
  const [logLimit, setLogLimit] = useState(10);

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

  // Initialize
  useEffect(() => {
    fetchStoresList();

    const localNotifs = localStorage.getItem(LOCAL_STORAGE_KEY_NOTIFICATIONS);
    if (localNotifs) {
      try {
        setRawNotifications(JSON.parse(localNotifs));
      } catch (_) {
        setRawNotifications(mockNotifications);
      }
    } else {
      setRawNotifications(mockNotifications);
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTIFICATIONS, JSON.stringify(mockNotifications));
    }

    const localLogs = localStorage.getItem(LOCAL_STORAGE_KEY_NOTIF_LOGS);
    if (!localLogs) {
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTIF_LOGS, JSON.stringify(mockNotificationLogs));
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

  // Log Search Debouncing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedLogSearch(logSearch);
      setLogPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [logSearch]);

  // Sync / Calculate Dynamic KPI Stats
  const syncedNotifications = useMemo(() => {
    let localLogs = [];
    try {
      localLogs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTIF_LOGS)) || mockNotificationLogs;
    } catch (_) {
      localLogs = mockNotificationLogs;
    }

    return rawNotifications.map(n => {
      const logs = localLogs.filter(l => l.notificationId === n._id);
      const sentCount = logs.length;
      const openedCount = logs.filter(l => l.opened).length;
      const openRate = sentCount > 0 ? Math.round((openedCount / sentCount) * 100) : 0;
      
      return {
        ...n,
        sentCount: n.status === "sent" ? (sentCount || 1450) : 0,
        openRate: n.status === "sent" ? (openRate || 68) : 0
      };
    });
  }, [rawNotifications]);

  // Dashboard Stats Calculations
  const dashboardStats = useMemo(() => {
    let localLogs = [];
    try {
      localLogs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTIF_LOGS)) || mockNotificationLogs;
    } catch (_) {
      localLogs = mockNotificationLogs;
    }

    const total = syncedNotifications.length;
    const sentNotifs = syncedNotifications.filter(n => n.status === "sent");
    const scheduledCount = syncedNotifications.filter(n => n.status === "scheduled").length;

    // Total sent logs count
    const sentLogs = localLogs.length;
    const deliveredLogs = localLogs.filter(l => l.sentStatus === "delivered").length;
    const openedLogs = localLogs.filter(l => l.opened).length;
    const clickedLogs = localLogs.filter(l => l.clicked).length;

    const deliverySuccessRate = sentLogs > 0 ? parseFloat(((deliveredLogs / sentLogs) * 100).toFixed(1)) : 98.4;
    const openRate = deliveredLogs > 0 ? Math.round((openedLogs / deliveredLogs) * 100) : 67;
    const clickRate = deliveredLogs > 0 ? Math.round((clickedLogs / deliveredLogs) * 100) : 21;

    return {
      sent: sentLogs || 4560,
      deliverySuccessRate: `${deliverySuccessRate}%`,
      openRate: `${openRate}%`,
      clickRate: `${clickRate}%`,
      scheduled: scheduledCount,
      trends: {
        sentChange: "+12.4%",
        deliveryChange: "+0.5%",
        openChange: "+3.2%",
        clickChange: "+1.8%",
        scheduledChange: "+2"
      }
    };
  }, [syncedNotifications]);

  // Filtering
  const filteredNotifications = useMemo(() => {
    let result = [...syncedNotifications];

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(n => 
        n.title?.toLowerCase().includes(q) || 
        n.message?.toLowerCase().includes(q)
      );
    }

    if (channelFilter !== "All") {
      result = result.filter(n => n.notificationType && n.notificationType.includes(channelFilter.toLowerCase()));
    }

    if (audienceFilter !== "All") {
      result = result.filter(n => n.targetAudience === audienceFilter.toLowerCase());
    }

    if (statusFilter !== "All") {
      result = result.filter(n => n.status === statusFilter.toLowerCase());
    }

    if (startDateFilter) {
      result = result.filter(n => new Date(n.createdAt) >= new Date(startDateFilter));
    }

    if (endDateFilter) {
      const endLimit = new Date(endDateFilter);
      endLimit.setHours(23, 59, 59, 999);
      result = result.filter(n => new Date(n.createdAt) <= endLimit);
    }

    return result;
  }, [syncedNotifications, debouncedSearch, channelFilter, audienceFilter, statusFilter, startDateFilter, endDateFilter]);

  // Sorting & Pagination
  const sortedAndPaginatedNotifications = useMemo(() => {
    const sorted = [...filteredNotifications].sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === "createdAt" || sortBy === "scheduleTime") {
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
  }, [filteredNotifications, sortBy, sortOrder, currentPage, pageSize]);

  // Reset Filters
  const handleResetFilters = useCallback(() => {
    setSearch("");
    setChannelFilter("All");
    setAudienceFilter("All");
    setStatusFilter("All");
    setStartDateFilter("");
    setEndDateFilter("");
    setCurrentPage(1);
    toast.info("Notifications browser filters cleared.");
  }, []);

  // Save Helper
  const syncLocalStorage = (notifsList, logsList = null) => {
    localStorage.setItem(LOCAL_STORAGE_KEY_NOTIFICATIONS, JSON.stringify(notifsList));
    if (logsList) {
      localStorage.setItem(LOCAL_STORAGE_KEY_NOTIF_LOGS, JSON.stringify(logsList));
    }
  };

  // Helper to generate simulated logs (Offline Mode)
  const generateSimulatedLogs = (notificationId, targetAudience, channels, storeIds) => {
    const customerNames = [
      "Rohan Malhotra", "Aarav Sharma", "Pooja Patel", "Rashi Kumar", "Amit Verma", 
      "Siddharth Jain", "Neha Gupta", "Vikram Singh", "Preeti Mishra", "Deepak Rawat",
      "Priya Verma", "Aman Gupta", "Kunal Sen", "Kiran Joshi", "Aanchal Mehta",
      "Devendra Rajput", "Shalini Dwivedi", "Rajesh Tiwari", "Meera Nair", "Harsh Vardhan"
    ];
    const channelsList = channels && channels.length > 0 ? channels : ["push"];
    const storesList = storeIds && storeIds.length > 0 ? storeIds : stores.map(s => s._id);

    const generated = [];
    customerNames.forEach((name, idx) => {
      channelsList.forEach(chan => {
        const isDelivered = Math.random() < 0.96;
        const isOpened = isDelivered && Math.random() < 0.70;
        const isClicked = isOpened && Math.random() < 0.35;
        const storeId = storesList[Math.floor(Math.random() * storesList.length)];
        
        generated.push({
          _id: `log-${notificationId}-${idx}-${chan}`,
          notificationId,
          customerId: `cust-${idx + 20}`,
          customerName: name,
          channel: chan,
          sentStatus: isDelivered ? "delivered" : "failed",
          opened: isOpened,
          clicked: isClicked,
          deliveredAt: isDelivered ? new Date().toISOString() : null,
          storeId
        });
      });
    });
    return generated;
  };

  // CRUD Operations
  const createNotification = useCallback(async (payload) => {
    setLoading(true);
    try {
      const res = await apiClient.post("/notifications", payload);
      toast.success("Notification configured successfully on backend!");
      return res.data?.data || res.data;
    } catch (_) {
      console.warn("API notifications post failed, using local simulation.");
      const newNotif = {
        ...payload,
        _id: `notif-${Date.now()}`,
        createdBy: "Shubham Jamliya",
        createdAt: new Date().toISOString()
      };

      const updatedNotifs = [newNotif, ...rawNotifications];
      let updatedLogs = [];
      try {
        updatedLogs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTIF_LOGS)) || [];
      } catch (_) {}

      if (newNotif.status === "sent") {
        const sim = generateSimulatedLogs(newNotif._id, newNotif.targetAudience, newNotif.notificationType, newNotif.stores);
        updatedLogs.push(...sim);
      }

      setRawNotifications(updatedNotifs);
      syncLocalStorage(updatedNotifs, updatedLogs);
      toast.success(`Notification "${payload.title}" created successfully (Offline mode).`);
      return newNotif;
    } finally {
      setLoading(false);
    }
  }, [rawNotifications, stores]);

  const updateNotification = useCallback(async (id, payload) => {
    setLoading(true);
    try {
      const res = await apiClient.put(`/notifications/${id}`, payload);
      toast.success("Notification updated successfully on backend!");
      return res.data?.data || res.data;
    } catch (_) {
      console.warn("API notifications put failed, using local simulation.");
      
      const prevNotif = rawNotifications.find(n => n._id === id);
      const updatedNotifs = rawNotifications.map(n => n._id === id ? { ...n, ...payload, updatedAt: new Date().toISOString() } : n);
      
      let updatedLogs = [];
      try {
        updatedLogs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTIF_LOGS)) || [];
      } catch (_) {}

      // If transitioning to sent
      if (payload.status === "sent" && prevNotif?.status !== "sent") {
        updatedLogs = updatedLogs.filter(l => l.notificationId !== id);
        const sim = generateSimulatedLogs(id, payload.targetAudience || prevNotif.targetAudience, payload.notificationType || prevNotif.notificationType, payload.stores || prevNotif.stores);
        updatedLogs.push(...sim);
      }

      setRawNotifications(updatedNotifs);
      syncLocalStorage(updatedNotifs, updatedLogs);
      toast.success("Notification configurations saved (Offline mode).");
      return true;
    } finally {
      setLoading(false);
    }
  }, [rawNotifications, stores]);

  const deleteNotification = useCallback(async (id) => {
    setLoading(true);
    try {
      await apiClient.delete(`/notifications/${id}`);
      toast.success("Notification archived from database.");
      return true;
    } catch (_) {
      console.warn("API notifications delete failed, using local simulation.");
      const item = rawNotifications.find(n => n._id === id);
      const updatedNotifs = rawNotifications.filter(n => n._id !== id);
      
      let updatedLogs = [];
      try {
        updatedLogs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTIF_LOGS)) || [];
      } catch (_) {}
      updatedLogs = updatedLogs.filter(l => l.notificationId !== id);

      setRawNotifications(updatedNotifs);
      syncLocalStorage(updatedNotifs, updatedLogs);
      toast.success(`Notification "${item?.title || "selected"}" deleted (Offline mode).`);
      return true;
    } finally {
      setLoading(false);
    }
  }, [rawNotifications]);

  const cancelNotification = useCallback(async (id) => {
    return await updateNotification(id, { status: "cancelled" });
  }, [updateNotification]);

  const resendNotification = useCallback(async (id, resendType) => {
    setLoading(true);
    try {
      const prevNotif = rawNotifications.find(n => n._id === id);
      if (!prevNotif) throw new Error("Not found");

      if (resendType === "all") {
        const payload = {
          title: prevNotif.title,
          message: prevNotif.message,
          notificationType: prevNotif.notificationType,
          targetAudience: prevNotif.targetAudience,
          stores: prevNotif.stores,
          scheduleTime: new Date().toISOString(),
          status: "sent"
        };
        await createNotification(payload);
      } else {
        // failed only retry - simulate logs refresh
        let updatedLogs = [];
        try {
          updatedLogs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTIF_LOGS)) || [];
        } catch (_) {}

        updatedLogs = updatedLogs.map(l => {
          if (l.notificationId === id && l.sentStatus === "failed") {
            const isDelivered = Math.random() < 0.90;
            return {
              ...l,
              sentStatus: isDelivered ? "delivered" : "failed",
              opened: isDelivered && Math.random() < 0.60,
              clicked: isDelivered && Math.random() < 0.20,
              deliveredAt: isDelivered ? new Date().toISOString() : null
            };
          }
          return l;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY_NOTIF_LOGS, JSON.stringify(updatedLogs));
        toast.success("Retried failed notifications (Simulated logs update).");
      }
      return true;
    } catch (_) {
      toast.error("Failed to resend notification.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [rawNotifications, createNotification]);

  // Fetch Analytics Drawer data
  const fetchAnalytics = useCallback(async (id) => {
    setLoadingAnalytics(true);
    try {
      const res = await apiClient.get(`/notification-logs/${id}`, {
        params: {
          search: debouncedLogSearch,
          page: logPage,
          limit: logLimit
        }
      });
      const data = res.data?.data || res.data;
      setAnalyticsData(data);
      setLogsList(data.logsList || { list: [], totalCount: 0, page: 1, limit: 10 });
    } catch (_) {
      console.warn("API analytics fetch failed, building local mock data aggregates.");
      // Fallback local calculations
      const targetNotif = rawNotifications.find(n => n._id === id);
      if (!targetNotif) {
        setAnalyticsData(null);
        setLogsList({ list: [], totalCount: 0, page: 1, limit: 10 });
        setLoadingAnalytics(false);
        return;
      }

      let localLogs = [];
      try {
        localLogs = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY_NOTIF_LOGS)) || [];
      } catch (_) {}

      let logs = localLogs.filter(l => l.notificationId === id);
      if (targetNotif.status === "sent" && logs.length === 0) {
        logs = generateSimulatedLogs(id, targetNotif.targetAudience, targetNotif.notificationType, targetNotif.stores);
        localLogs.push(...logs);
        localStorage.setItem(LOCAL_STORAGE_KEY_NOTIF_LOGS, JSON.stringify(localLogs));
      }

      // Filter
      let filtered = [...logs];
      if (debouncedLogSearch.trim()) {
        const q = debouncedLogSearch.toLowerCase().trim();
        filtered = filtered.filter(l => 
          l.customerName.toLowerCase().includes(q) || 
          l.channel.toLowerCase().includes(q)
        );
      }

      const totalCount = filtered.length;
      const startIndex = (logPage - 1) * logLimit;
      const paginatedLogs = filtered.slice(startIndex, startIndex + logLimit);

      // aggregates
      const sent = logs.length;
      const delivered = logs.filter(l => l.sentStatus === "delivered").length;
      const failed = logs.filter(l => l.sentStatus === "failed").length;
      const opened = logs.filter(l => l.opened).length;
      const clicked = logs.filter(l => l.clicked).length;

      const openRate = delivered > 0 ? Math.round((opened / delivered) * 100) : 0;
      const ctr = delivered > 0 ? Math.round((clicked / delivered) * 100) : 0;

      const deviceData = [
        { device: "Android", count: Math.round(sent * 0.58), percentage: 58 },
        { device: "iOS", count: Math.round(sent * 0.30), percentage: 30 },
        { device: "Web Browser", count: Math.round(sent * 0.12), percentage: 12 }
      ];

      const pieChartData = [
        { name: "Delivered", value: delivered, color: "#10b981" },
        { name: "Failed", value: failed, color: "#ef4444" },
        { name: "Pending", value: targetNotif.status === "scheduled" ? sent : 0, color: "#3b82f6" }
      ];

      const storesList = targetNotif.stores && targetNotif.stores.length > 0 ? targetNotif.stores : stores.map(s => s._id);
      const storeData = storesList.map(storeId => {
        const storeName = stores.find(s => s._id === storeId)?.name || "Unknown Store";
        const storeLogs = logs.filter(l => l.storeId === storeId);
        const sDelivered = storeLogs.filter(l => l.sentStatus === "delivered").length;
        const sOpened = storeLogs.filter(l => l.opened).length;
        const sClicked = storeLogs.filter(l => l.clicked).length;
        const sCtr = sDelivered > 0 ? parseFloat(((sClicked / sDelivered) * 100).toFixed(1)) : 0;

        return {
          store: storeName,
          delivered: sDelivered,
          opened: sOpened,
          clicked: sClicked,
          ctr: sCtr
        };
      });

      setAnalyticsData({
        aggregates: {
          sent: targetNotif.status === "sent" ? (sent || 1450) : 0,
          delivered: targetNotif.status === "sent" ? (delivered || 1390) : 0,
          failed: targetNotif.status === "sent" ? (failed || 60) : 0,
          opened: targetNotif.status === "sent" ? (opened || 950) : 0,
          clicked: targetNotif.status === "sent" ? (clicked || 310) : 0,
          openRate: targetNotif.status === "sent" ? (openRate || 68) : 0,
          ctr: targetNotif.status === "sent" ? (ctr || 22) : 0
        },
        pieChartData,
        deviceData,
        storeData
      });
      setLogsList({
        list: paginatedLogs,
        totalCount,
        page: logPage,
        limit: logLimit
      });
    } finally {
      setLoadingAnalytics(false);
    }
  }, [rawNotifications, debouncedLogSearch, logPage, logLimit, stores]);

  // Trigger analytics reload when logs paging/searching changes
  useEffect(() => {
    if (selectedNotification) {
      fetchAnalytics(selectedNotification._id);
    }
  }, [selectedNotification, debouncedLogSearch, logPage, logLimit, fetchAnalytics]);

  return {
    loading,
    notifications: sortedAndPaginatedNotifications,
    totalRecords: filteredNotifications.length,
    stores,
    loadingStores,

    // Filters
    search,
    setSearch,
    channelFilter,
    setChannelFilter,
    audienceFilter,
    setAudienceFilter,
    statusFilter,
    setStatusFilter,
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
    selectedNotification,
    setSelectedNotification,

    // Operations & KPIs
    dashboardStats,
    createNotification,
    updateNotification,
    deleteNotification,
    cancelNotification,
    resendNotification,

    // Detailed Analytics States & Triggers
    loadingAnalytics,
    analyticsData,
    logsList,
    logSearch,
    setLogSearch,
    logPage,
    setLogPage,
    logLimit,
    setLogLimit,
    fetchAnalytics
  };
}
