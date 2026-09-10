import { useState, useEffect, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { mockCoupons, mockCouponUsage, mockStores, mockProducts, mockCategories } from "../../marketing/mockData";

export function useLocalCoupons() {
  const [loading, setLoading] = useState(false);
  const [rawCoupons, setRawCoupons] = useState([]);
  const [rawUsage, setRawUsage] = useState([]);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [discountType, setDiscountType] = useState("All");
  const [storeId, setStoreId] = useState("All");
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  // Selected row keys or active coupon/modal states
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  // Initialize data from mock data source
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const stored = localStorage.getItem("franchise_admin_coupons");
      if (stored) {
        try {
          setRawCoupons(JSON.parse(stored));
        } catch (_) {
          setRawCoupons(mockCoupons);
          localStorage.setItem("franchise_admin_coupons", JSON.stringify(mockCoupons));
        }
      } else {
        setRawCoupons(mockCoupons);
        localStorage.setItem("franchise_admin_coupons", JSON.stringify(mockCoupons));
      }
      setRawUsage(mockCouponUsage);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  // Save to LocalStorage helper
  const saveToLocalStorage = (updatedList) => {
    localStorage.setItem("franchise_admin_coupons", JSON.stringify(updatedList));
    window.dispatchEvent(new Event("franchise_coupons_changed"));
  };

  useEffect(() => {
    if (!loading) {
      localStorage.setItem("franchise_admin_coupons", JSON.stringify(rawCoupons));
      window.dispatchEvent(new Event("franchise_coupons_changed"));
    }
  }, [rawCoupons, loading]);

  // Search Debouncing (300ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Sync coupon status automatically (e.g. check if endDate is past current date, mark expired)
  const syncCouponsStatus = useCallback((couponsList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return couponsList.map(coupon => {
      if (coupon.endDate) {
        const expiry = new Date(coupon.endDate);
        if (expiry < today && coupon.status !== "expired") {
          return { ...coupon, status: "expired" };
        }
      }
      return coupon;
    });
  }, []);

  const activeCouponsList = useMemo(() => {
    return syncCouponsStatus(rawCoupons);
  }, [rawCoupons, syncCouponsStatus]);

  // Aggregate Dashboard statistics (5 Cards)
  const dashboardStats = useMemo(() => {
    const totalCoupons = activeCouponsList.length;
    const activeCoupons = activeCouponsList.filter(c => c.status === "active").length;
    const expiredCoupons = activeCouponsList.filter(c => c.status === "expired").length;
    const totalUsage = rawUsage.length;

    // Revenue Generated Through Coupons: Sum of order amounts for all applied coupon usage records
    const revenueGenerated = rawUsage.reduce((acc, curr) => acc + (curr.orderAmount || 0), 0);

    // Percentage change simulations
    return {
      totalCoupons,
      activeCoupons,
      expiredCoupons,
      totalUsage,
      revenueGenerated,
      trends: {
        totalChange: "+8.5%",
        activeChange: "+4.2%",
        expiredChange: "-2.1%",
        usageChange: "+12.8%",
        revenueChange: "+15.4%"
      }
    };
  }, [activeCouponsList, rawUsage]);

  // Filter Logic
  const filteredCoupons = useMemo(() => {
    let result = [...activeCouponsList];

    // Search coupon code or title
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(c =>
        c.couponCode.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q)
      );
    }

    // Status Filter
    if (status !== "All") {
      result = result.filter(c => c.status === status.toLowerCase());
    }

    // Discount Type Filter
    if (discountType !== "All") {
      let typeKey = discountType.toLowerCase();
      if (discountType === "Percentage") typeKey = "percentage";
      if (discountType === "Fixed") typeKey = "fixed";
      if (discountType === "Free Delivery") typeKey = "free-delivery";

      result = result.filter(c => c.discountType === typeKey);
    }

    // Store Dropdown Filter
    if (storeId !== "All") {
      result = result.filter(c =>
        c.storeIds.length === 0 || c.storeIds.includes(storeId)
      );
    }

    // Date Range Picker Filter
    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      result = result.filter(c => new Date(c.startDate) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      result = result.filter(c => new Date(c.endDate) <= end);
    }

    return result;
  }, [activeCouponsList, debouncedSearch, status, discountType, storeId, startDate, endDate]);

  // Sort and Paginate coupons list
  const sortedAndPaginatedCoupons = useMemo(() => {
    const sorted = [...filteredCoupons].sort((a, b) => {
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
  }, [filteredCoupons, sortBy, sortOrder, currentPage, pageSize]);

  // Reset Filters
  const handleResetFilters = useCallback(() => {
    setSearch("");
    setStatus("All");
    setDiscountType("All");
    setStoreId("All");
    setStartDate(null);
    setEndDate(null);
    setCurrentPage(1);
    toast.info("Filters cleared successfully.");
  }, []);

  // CRUD Operations

  // Create Coupon
  const createCoupon = useCallback((payload) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setTimeout(() => {
        // Validate Code Uniqueness
        const exists = rawCoupons.some(
          c => c.couponCode.toUpperCase() === payload.couponCode.toUpperCase()
        );
        if (exists) {
          setLoading(false);
          toast.error(`Coupon code "${payload.couponCode}" already exists.`);
          reject(new Error("Code uniqueness validation failed."));
          return;
        }

        const newCoupon = {
          ...payload,
          _id: `coupon-${Date.now()}`,
          couponCode: payload.couponCode.toUpperCase(),
          status: payload.status || "active",
          createdBy: "Shubham Jamliya",
          createdAt: new Date().toISOString()
        };

        setRawCoupons(prev => [newCoupon, ...prev]);
        setLoading(false);
        toast.success(`Coupon ${newCoupon.couponCode} created successfully!`);
        resolve(newCoupon);
      }, 500);
    });
  }, [rawCoupons]);

  // Update Coupon
  const updateCoupon = useCallback((id, payload) => {
    return new Promise((resolve, reject) => {
      setLoading(true);
      setTimeout(() => {
        // Validate Code Uniqueness (excluding self)
        const exists = rawCoupons.some(
          c => c._id !== id && c.couponCode.toUpperCase() === payload.couponCode.toUpperCase()
        );
        if (exists) {
          setLoading(false);
          toast.error(`Coupon code "${payload.couponCode}" already exists on another coupon.`);
          reject(new Error("Code uniqueness validation failed."));
          return;
        }

        setRawCoupons(prev =>
          prev.map(c => (c._id === id ? { ...c, ...payload, couponCode: payload.couponCode.toUpperCase() } : c))
        );
        setLoading(false);
        toast.success(`Coupon ${payload.couponCode.toUpperCase()} updated successfully!`);
        resolve(true);
      }, 500);
    });
  }, [rawCoupons]);

  // Delete Coupon (Soft delete simulated by removing from active list)
  const deleteCoupon = useCallback((id) => {
    return new Promise((resolve) => {
      setLoading(true);
      setTimeout(() => {
        const deletedCoupon = rawCoupons.find(c => c._id === id);
        setRawCoupons(prev => prev.filter(c => c._id !== id));
        // Remove related usage
        setRawUsage(prev => prev.filter(u => u.couponId !== id));
        setLoading(false);
        toast.success(`Coupon ${deletedCoupon?.couponCode || "Code"} deleted successfully.`);
        resolve(true);
      }, 400);
    });
  }, [rawCoupons]);

  // Clone Coupon (Suggestions logic: appends _CLONE or increments suffix)
  const cloneCoupon = useCallback((id) => {
    return new Promise((resolve) => {
      const sourceCoupon = rawCoupons.find(c => c._id === id);
      if (!sourceCoupon) return resolve(false);

      // Generate suggested coupon code
      let baseCode = sourceCoupon.couponCode;
      if (baseCode.includes("_CLONE")) {
        baseCode = baseCode.split("_CLONE")[0];
      }
      const randomSuffix = Math.floor(Math.random() * 900) + 100;
      const newSuggestedCode = `${baseCode}_CLONE${randomSuffix}`;

      const clonedPayload = {
        ...sourceCoupon,
        _id: `coupon-clone-${Date.now()}`,
        couponCode: newSuggestedCode,
        createdAt: new Date().toISOString(),
        createdBy: "Shubham Jamliya"
      };

      resolve(clonedPayload);
    });
  }, [rawCoupons]);

  // Toggle Coupon Status (Active/Inactive)
  const toggleCouponStatus = useCallback((id) => {
    return new Promise((resolve) => {
      setRawCoupons(prev =>
        prev.map(c => {
          if (c._id === id) {
            const nextStatus = c.status === "active" ? "inactive" : "active";
            toast.success(`Coupon ${c.couponCode} is now ${nextStatus === "active" ? "Active" : "Deactivated"}.`);
            return { ...c, status: nextStatus };
          }
          return c;
        })
      );
      resolve(true);
    });
  }, []);

  // Fetch usage analytics details for Coupon Details Drawer
  const getCouponUsageDetails = useCallback((couponId) => {
    const coupon = rawCoupons.find(c => c._id === couponId);
    if (!coupon) return null;

    // Filter usage events for this coupon
    const usages = rawUsage.filter(u => u.couponId === couponId);

    // Aggregate Analytics
    const totalUsage = usages.length;
    const totalDiscountGiven = usages.reduce((sum, u) => sum + (u.discountAmount || 0), 0);
    const revenueGenerated = usages.reduce((sum, u) => sum + (u.orderAmount || 0), 0);
    const averageOrderValue = totalUsage > 0 ? Math.round(revenueGenerated / totalUsage) : 0;

    // Simulate dynamic Conversion Rate based on usage vs simulated views
    const mockClicks = Math.max(totalUsage * 10 + 20, 50);
    const conversionRate = mockClicks > 0 ? ((totalUsage / mockClicks) * 100).toFixed(1) + "%" : "0.0%";

    // Aggregate Top Customers using this coupon
    // Group usage by customer
    const customerGroup = {};
    usages.forEach(u => {
      if (!customerGroup[u.customerId]) {
        customerGroup[u.customerId] = {
          customerId: u.customerId,
          customerName: u.customerName,
          ordersCount: 0,
          totalSavings: 0,
          lastUsed: u.usedAt
        };
      }
      customerGroup[u.customerId].ordersCount++;
      customerGroup[u.customerId].totalSavings += u.discountAmount;
      if (new Date(u.usedAt) > new Date(customerGroup[u.customerId].lastUsed)) {
        customerGroup[u.customerId].lastUsed = u.usedAt;
      }
    });

    const topCustomers = Object.values(customerGroup)
      .sort((a, b) => b.totalSavings - a.totalSavings)
      .slice(0, 5); // top 5 customers

    return {
      coupon,
      analytics: {
        totalUsage,
        totalDiscountGiven,
        revenueGenerated,
        averageOrderValue,
        conversionRate
      },
      topCustomers,
      usagesList: usages
    };
  }, [rawCoupons, rawUsage]);

  return {
    loading,
    coupons: sortedAndPaginatedCoupons,
    totalRecords: filteredCoupons.length,

    // Filters & Pagination State
    search,
    setSearch,
    status,
    setStatus,
    discountType,
    setDiscountType,
    storeId,
    setStoreId,
    startDate,
    setStartDate,
    endDate,
    setEndDate,

    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Selections
    selectedCoupon,
    setSelectedCoupon,

    // Stats
    dashboardStats,

    // Operations
    createCoupon,
    updateCoupon,
    deleteCoupon,
    cloneCoupon,
    toggleCouponStatus,
    getCouponUsageDetails,
    handleResetFilters
  };
}
