import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Wifi,
  RefreshCw,
  Search,
  LayoutGrid,
  TableProperties,
  Clock,
  Eye,
  RotateCcw,
  AlertTriangle,
  Filter,
  CheckCircle2,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Receipt,
  FileText,
  DollarSign,
  Undo2,
  AlertOctagon,
  Percent,
  TrendingDown
} from "lucide-react";
import {
  Input,
  Button,
  Select,
  Badge,
  Table,
  Skeleton,
  Card,
  Tag,
  Tooltip,
  Empty,
  Segmented,
  ConfigProvider,
  DatePicker
} from "antd";

// Custom Hooks & Modals
import {
  useCancelledOrders,
  useInitiateRefund,
  useReopenOrder
} from "./hooks/useCancelledOrders";
import CancelledOrderDetailsDrawer from "./components/CancelledOrderDetailsDrawer";
import ProcessRefundModal from "./components/ProcessRefundModal";
import ReopenOrderModal from "./components/ReopenOrderModal";
import RefundHistoryModal from "./components/RefundHistoryModal";

export default function CancelledOrders() {
  const { role } = useOutletContext();
  const isManager = role === "store_manager";

  // Dynamic Theme Colors
  const [themePrimary, setThemePrimary] = useState(localStorage.getItem("sa_primary") || "#a43c12");
  const [themeSecondary, setThemeSecondary] = useState(localStorage.getItem("sa_secondary") || "#ff7f50");

  useEffect(() => {
    const primaryColor = localStorage.getItem("sa_primary") || "#a43c12";
    const secondaryColor = localStorage.getItem("sa_secondary") || "#ff7f50";
    setThemePrimary(primaryColor);
    setThemeSecondary(secondaryColor);
    
    document.documentElement.style.setProperty("--sa-primary", primaryColor);
    document.documentElement.style.setProperty("--sa-primary-hover", `${primaryColor}cc`);
    document.documentElement.style.setProperty("--sa-secondary", secondaryColor);
    document.documentElement.style.setProperty("--sa-secondary-hover", `${secondaryColor}cc`);
    document.documentElement.style.setProperty("--primary", primaryColor);
    document.documentElement.style.setProperty("--primary-hover", `${primaryColor}cc`);
  }, []);

  // UI States
  const [viewType, setViewType] = useState("Table"); // "Table" or "Card"
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Search input & Debounced search
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Filters State
  const [filters, setFilters] = useState({
    dateRange: "All",
    customDateRange: null,
    cancellationType: "All",
    refundStatus: "All",
    paymentMethod: "All",
    reopenEligible: "All",
  });

  const [appliedFilters, setAppliedFilters] = useState({
    search: "",
    page: 1,
    limit: 10,
    sortField: "cancelledAt",
    sortOrder: "descend",
    ...filters
  });

  // Debouncing Search Input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Sync Search and Pagination to Applied Filters
  useEffect(() => {
    setAppliedFilters((prev) => ({
      ...prev,
      search: debouncedSearch,
      page: currentPage,
      limit: pageSize
    }));
  }, [debouncedSearch, currentPage, pageSize]);

  // Fetch cancelled orders data
  const {
    data: result = { orders: [], totalCancelledOrders: 0, totalRefundAmount: 0, refundPendingCount: 0, refundCompletedCount: 0 },
    isLoading,
    isRefetching,
    refetch,
    socketConnected
  } = useCancelledOrders(appliedFilters);

  // Mutation hooks
  const refundMutation = useInitiateRefund();
  const reopenMutation = useReopenOrder();

  // Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // "details", "refund", "reopen", "history"

  const openModal = (modalName, order) => {
    setSelectedOrder(order);
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setActiveModal(null);
  };

  // Helper functions
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short"
    });
  };

  const isReopenEligible = (o) => {
    const cancelledAtDate = new Date(o.cancelledAt || o.updatedAt);
    const timeDiffMins = (new Date() - cancelledAtDate) / 60000;
    const isTimeEligible = timeDiffMins <= 5;
    const isKitchenNotStarted = o.status !== "preparing" && o.status !== "baking" && o.status !== "packaging" && o.status !== "ready";
    return isTimeEligible && isKitchenNotStarted;
  };

  const getCancellationTypeTag = (type) => {
    switch (type?.toLowerCase()) {
      case "customer":
        return <Tag color="volcano" className="font-bold border-0 px-2 py-0.5 rounded-full capitalize text-[10px]">Customer</Tag>;
      case "store":
        return <Tag color="orange" className="font-bold border-0 px-2 py-0.5 rounded-full capitalize text-[10px]">Store</Tag>;
      case "system":
        return <Tag color="red" className="font-bold border-0 px-2 py-0.5 rounded-full capitalize text-[10px]">System</Tag>;
      default:
        return <Tag className="font-bold border-0 px-2 py-0.5 rounded-full capitalize text-[10px]">{type || "Unknown"}</Tag>;
    }
  };

  const getRefundStatusTag = (status) => {
    switch (status?.toLowerCase()) {
      case "refund_pending":
      case "pending":
        return <Tag color="blue" className="font-bold border-0 px-2.5 py-0.5 rounded-full capitalize text-[10px]">Pending</Tag>;
      case "refund_completed":
      case "completed":
        return <Tag color="green" className="font-bold border-0 px-2.5 py-0.5 rounded-full capitalize text-[10px]">Completed</Tag>;
      case "refund_failed":
      case "failed":
        return <Tag color="red" className="font-bold border-0 px-2.5 py-0.5 rounded-full capitalize text-[10px]">Failed</Tag>;
      case "none":
      default:
        return <Tag color="default" className="font-bold border-0 px-2.5 py-0.5 rounded-full capitalize text-[10px]">No Refund</Tag>;
    }
  };

  const handleApplyFilters = () => {
    setCurrentPage(1);
    setAppliedFilters((prev) => ({
      ...prev,
      ...filters,
      page: 1
    }));
  };

  const handleResetFilters = () => {
    const cleared = {
      dateRange: "All",
      customDateRange: null,
      cancellationType: "All",
      refundStatus: "All",
      paymentMethod: "All",
      reopenEligible: "All",
    };
    setSearchInput("");
    setFilters(cleared);
    setCurrentPage(1);
    setAppliedFilters((prev) => ({
      ...prev,
      ...cleared,
      search: "",
      page: 1
    }));
  };

  // Table Column Definitions
  const columns = [
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Order ID</span>,
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text, record) => (
        <span
          onClick={() => openModal("details", record)}
          className="font-extrabold text-primary hover:underline cursor-pointer text-xs"
        >
          {text}
        </span>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Customer</span>,
      dataIndex: ["customer", "name"],
      key: "customerName",
      render: (text) => <span className="font-bold text-xs text-slate-900 dark:text-white">{text}</span>
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Phone</span>,
      dataIndex: ["customer", "phone"],
      key: "phone",
      render: (text) => <span className="font-semibold text-xs text-zinc-450">{text}</span>
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Amount</span>,
      dataIndex: "grandTotal",
      key: "grandTotal",
      render: (val) => <span className="font-extrabold text-xs">{formatCurrency(val)}</span>
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Cancellation By</span>,
      dataIndex: "cancelledBy",
      key: "cancelledBy",
      render: (val) => getCancellationTypeTag(val)
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Cancel Reason</span>,
      dataIndex: "cancelReason",
      key: "cancelReason",
      width: 220,
      render: (text) => (
        <Tooltip title={text}>
          <span className="text-xs font-medium text-zinc-550 line-clamp-1 truncate block max-w-[200px]">
            {text}
          </span>
        </Tooltip>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Refund Status</span>,
      dataIndex: "refundStatus",
      key: "refundStatus",
      render: (val) => getRefundStatusTag(val)
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Refund Amt</span>,
      dataIndex: "refundAmount",
      key: "refundAmount",
      render: (val) => <span className="font-bold text-xs text-red-500">{formatCurrency(val)}</span>
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Cancelled Date</span>,
      dataIndex: "cancelledAt",
      key: "cancelledAt",
      render: (text, record) => <span className="text-xs text-zinc-450 font-medium">{formatDate(text || record.updatedAt)}</span>
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Actions</span>,
      key: "actions",
      fixed: "right",
      width: 130,
      render: (_, record) => {
        const canReopen = isReopenEligible(record);
        const canRefund = isManager && record.paymentMethod !== "COD" && record.refundStatus !== "refund_completed" && record.refundStatus !== "refund_pending";

        return (
          <div className="flex gap-1.5 items-center">
            <Tooltip title="View Details">
              <Button
                size="small"
                onClick={() => openModal("details", record)}
                icon={<Eye size={12} />}
                className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
              />
            </Tooltip>

            {canRefund ? (
              <Tooltip title="Process Refund">
                <Button
                  size="small"
                  onClick={() => openModal("refund", record)}
                  icon={<DollarSign size={12} />}
                  className="!border-red-400/40 !text-red-500 bg-white dark:bg-zinc-900 hover:!bg-red-50 dark:hover:!bg-red-950/20 active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
                />
              </Tooltip>
            ) : (
              record.refundStatus !== "none" && (
                <Tooltip title="Refund History">
                  <Button
                    size="small"
                    onClick={() => openModal("history", record)}
                    icon={<Receipt size={12} />}
                    className="!border-zinc-300 !text-zinc-400 bg-white dark:bg-zinc-900 hover:!bg-zinc-50 dark:hover:!bg-zinc-800 active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
                  />
                </Tooltip>
              )
            )}

            {isManager && canReopen && (
              <Tooltip title="Reopen Order">
                <Button
                  size="small"
                  onClick={() => openModal("reopen", record)}
                  icon={<RotateCcw size={12} />}
                  className="!bg-purple-650 hover:!bg-purple-600 border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-purple-600/10 active:scale-95 transition-all"
                />
              </Tooltip>
            )}
          </div>
        );
      }
    }
  ];

  // Card view mapping component
  const renderCardView = (orderObj) => {
    const canReopen = isReopenEligible(orderObj);
    const canRefund = isManager && orderObj.paymentMethod !== "COD" && orderObj.refundStatus !== "refund_completed" && orderObj.refundStatus !== "refund_pending";

    return (
      <Card
        key={orderObj._id}
        className="rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300 bg-white dark:bg-zinc-900 text-xs"
        bodyStyle={{ padding: "14px" }}
      >
        {/* Card Header */}
        <div className="flex justify-between items-start pb-2.5 border-b border-zinc-100 dark:border-zinc-800/40">
          <div>
            <span
              onClick={() => openModal("details", orderObj)}
              className="font-mono font-black text-slate-800 dark:text-zinc-100 hover:text-primary hover:underline cursor-pointer block text-xs"
            >
              {orderObj.orderNumber}
            </span>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5 capitalize">{orderObj.customer?.name}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {getCancellationTypeTag(orderObj.cancelledBy)}
            {getRefundStatusTag(orderObj.refundStatus)}
          </div>
        </div>

        {/* Card Body */}
        <div className="py-2.5 space-y-2">
          <div className="flex justify-between font-semibold">
            <span className="text-zinc-450">Phone Number:</span>
            <span className="text-slate-800 dark:text-zinc-200">{orderObj.customer?.phone}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-zinc-450">Total Amount:</span>
            <span className="font-extrabold">{formatCurrency(orderObj.grandTotal)}</span>
          </div>
          <div className="flex justify-between font-semibold">
            <span className="text-zinc-450">Payment Method:</span>
            <span className="text-slate-800 dark:text-zinc-200 font-bold">{orderObj.paymentMethod}</span>
          </div>
          {orderObj.refundAmount > 0 && (
            <div className="flex justify-between font-semibold">
              <span className="text-zinc-450">Refund Amount:</span>
              <span className="text-red-500 font-extrabold">{formatCurrency(orderObj.refundAmount)}</span>
            </div>
          )}
          <div className="pt-1.5 border-t border-zinc-50 dark:border-zinc-900 text-[10px] text-zinc-450 flex items-center gap-1 font-bold">
            <Clock size={11} />
            <span>Cancelled: {formatDate(orderObj.cancelledAt || orderObj.updatedAt)}</span>
          </div>
        </div>

        {/* Card Footer Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/40">
          <Tooltip title="View Details">
            <Button
              size="small"
              onClick={() => openModal("details", orderObj)}
              icon={<Eye size={12} />}
              className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
            />
          </Tooltip>

          {canRefund ? (
            <Tooltip title="Process Refund">
              <Button
                size="small"
                onClick={() => openModal("refund", orderObj)}
                icon={<DollarSign size={12} />}
                className="!border-red-400/40 !text-red-500 bg-white dark:bg-zinc-900 hover:!bg-red-50 dark:hover:!bg-red-950/20 active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
              />
            </Tooltip>
          ) : (
            orderObj.refundStatus !== "none" && (
              <Tooltip title="Refund History">
                <Button
                  size="small"
                  onClick={() => openModal("history", orderObj)}
                  icon={<Receipt size={12} />}
                  className="!border-zinc-300 !text-zinc-400 bg-white dark:bg-zinc-900 hover:!bg-zinc-50 dark:hover:!bg-zinc-800 active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
                />
              </Tooltip>
            )
          )}

          {isManager && canReopen && (
            <Tooltip title="Reopen Order">
              <Button
                size="small"
                onClick={() => openModal("reopen", orderObj)}
                icon={<RotateCcw size={12} />}
                className="!bg-purple-650 hover:!bg-purple-600 border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-purple-600/10 active:scale-95 transition-all"
              />
            </Tooltip>
          )}
        </div>
      </Card>
    );
  };

  // Percentages distribution helper calculations
  const totalCount = result.totalCancelledOrders || 1;
  const customerCancelledPercent = Math.round(
    ((result.orders.filter((o) => o.cancelledBy === "customer").length) / totalCount) * 100
  );
  const storeRejectedPercent = Math.round(
    ((result.orders.filter((o) => o.cancelledBy === "store").length) / totalCount) * 100
  );

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: themePrimary,
          colorSuccess: "#16a34a",
          colorWarning: "#f59e0b",
          colorError: "#dc2626",
          borderRadius: 12
        }
      }}
    >
      <div className="p-4 md:p-6 space-y-5 min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white transition-colors duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-zinc-900 p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Cancelled Orders
              </h1>
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-2.5 py-0.5">
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${socketConnected ? "bg-green-400" : "bg-amber-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${socketConnected ? "bg-green-500" : "bg-amber-500"}`}></span>
                </span>
                <span className="text-[9px] font-bold text-zinc-400 capitalize">{socketConnected ? "Live Connection" : "Standalone Feed"}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">
              Track failed orders, refunds, and reopen eligible orders
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={() => refetch()}
              loading={isLoading || isRefetching}
              icon={<RefreshCw size={12} className={isLoading || isRefetching ? "animate-spin" : ""} />}
              className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-3.5 py-1.5 hover:bg-zinc-50 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              Refresh
            </Button>
            
            <div className="bg-slate-100 dark:bg-zinc-800 p-0.5 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center">
              <Button
                type={viewType === "Card" ? "primary" : "text"}
                size="small"
                icon={<LayoutGrid size={13} />}
                onClick={() => setViewType("Card")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold border-0 active:scale-95 transition-all cursor-pointer ${
                  viewType === "Card" ? "!bg-primary text-white shadow-xs" : "text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                }`}
              >
                Card View
              </Button>
              <Button
                type={viewType === "Table" ? "primary" : "text"}
                size="small"
                icon={<TableProperties size={13} />}
                onClick={() => setViewType("Table")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold border-0 active:scale-95 transition-all cursor-pointer ${
                  viewType === "Table" ? "!bg-primary text-white shadow-xs" : "text-zinc-400 hover:text-zinc-950 dark:hover:text-white"
                }`}
              >
                Table View
              </Button>
            </div>
          </div>
        </div>

        {/* Dashboard Dashboard KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs" bodyStyle={{ padding: "12px" }}>
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Total Cancelled</p>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{result.totalCancelledOrders || 0}</h3>
          </Card>
          
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs" bodyStyle={{ padding: "12px" }}>
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Refund Pending</p>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{result.refundPendingCount || 0}</h3>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs" bodyStyle={{ padding: "12px" }}>
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Refund Completed</p>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{result.refundCompletedCount || 0}</h3>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs" bodyStyle={{ padding: "12px" }}>
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Total Refunded</p>
            <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{formatCurrency(result.totalRefundAmount || 0)}</h3>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs" bodyStyle={{ padding: "12px" }}>
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Customer Cancel %</p>
            <h3 className="text-base font-black text-orange-550 dark:text-orange-400 mt-1">{customerCancelledPercent || 0}%</h3>
          </Card>

          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-xs" bodyStyle={{ padding: "12px" }}>
            <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Store Rejected %</p>
            <h3 className="text-base font-black text-red-500 mt-1">{storeRejectedPercent || 0}%</h3>
          </Card>
        </div>

        {/* Filter Section */}
        <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-zinc-150 dark:border-zinc-800 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Search by Order ID, Customer, Phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                prefix={<Search size={14} className="text-zinc-400" />}
                className="rounded-xl border-zinc-200 dark:border-zinc-800 text-xs font-semibold py-1.5"
              />
            </div>
            
            <Button
              type="text"
              onClick={() => setFiltersOpen(!filtersOpen)}
              icon={<Filter size={13} className="text-primary" />}
              className="text-xs font-bold hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl px-4 flex items-center justify-center gap-1 cursor-pointer"
            >
              {filtersOpen ? "Hide Filters" : "Advanced Filters"}
            </Button>
          </div>

          {/* Advanced Filters Expand Panel */}
          {filtersOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 pt-3 border-t border-zinc-50 dark:border-zinc-850">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date Range</label>
                <Select
                  value={filters.dateRange}
                  onChange={(val) => setFilters((prev) => ({ ...prev, dateRange: val }))}
                  className="w-full text-xs font-semibold rounded-xl"
                  options={[
                    { value: "All", label: "All Dates" },
                    { value: "Today", label: "Today" },
                    { value: "Yesterday", label: "Yesterday" },
                    { value: "Last 7 Days", label: "Last 7 Days" },
                    { value: "Last 30 Days", label: "Last 30 Days" },
                    { value: "Custom", label: "Custom Range" }
                  ]}
                />
              </div>

              {filters.dateRange === "Custom" && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Custom Dates</label>
                  <DatePicker.RangePicker
                    onChange={(dates, strings) => setFilters((prev) => ({ ...prev, customDateRange: strings }))}
                    className="w-full text-xs font-semibold rounded-xl"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cancellation By</label>
                <Select
                  value={filters.cancellationType}
                  onChange={(val) => setFilters((prev) => ({ ...prev, cancellationType: val }))}
                  className="w-full text-xs font-semibold rounded-xl"
                  options={[
                    { value: "All", label: "All Cancellation Types" },
                    { value: "Customer", label: "Customer Cancelled" },
                    { value: "Store", label: "Store Rejected" },
                    { value: "System", label: "System Cancelled" }
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Refund Status</label>
                <Select
                  value={filters.refundStatus}
                  onChange={(val) => setFilters((prev) => ({ ...prev, refundStatus: val }))}
                  className="w-full text-xs font-semibold rounded-xl"
                  options={[
                    { value: "All", label: "All Refund Statuses" },
                    { value: "pending", label: "Pending" },
                    { value: "refund_pending", label: "Initiated/Pending" },
                    { value: "refund_completed", label: "Completed" },
                    { value: "refund_failed", label: "Failed" }
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                <Select
                  value={filters.paymentMethod}
                  onChange={(val) => setFilters((prev) => ({ ...prev, paymentMethod: val }))}
                  className="w-full text-xs font-semibold rounded-xl"
                  options={[
                    { value: "All", label: "All Payment Methods" },
                    { value: "Online", label: "Online" },
                    { value: "COD", label: "COD" },
                    { value: "Wallet", label: "Wallet" }
                  ]}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reopen Eligible</label>
                <Select
                  value={filters.reopenEligible}
                  onChange={(val) => setFilters((prev) => ({ ...prev, reopenEligible: val }))}
                  className="w-full text-xs font-semibold rounded-xl"
                  options={[
                    { value: "All", label: "All Orders" },
                    { value: "Yes", label: "Reopen Eligible" },
                    { value: "No", label: "Not Eligible" }
                  ]}
                />
              </div>

              <div className="col-span-full flex justify-end items-center gap-2 pt-2 border-t border-zinc-50 dark:border-zinc-850">
                <Button
                  onClick={handleResetFilters}
                  className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 active:scale-95 transition-all cursor-pointer"
                >
                  Reset Filters
                </Button>
                <Button
                  type="primary"
                  onClick={handleApplyFilters}
                  className="text-xs font-bold !bg-primary hover:!bg-primary-hover border-0 text-white rounded-full px-4 flex items-center gap-1 shadow-md shadow-primary/15 active:scale-95 transition-all cursor-pointer"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Content View Grid / Table */}
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton active paragraph={{ rows: 6 }} className="p-6 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl" />
          </div>
        ) : result.orders.length === 0 ? (
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-12 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px] shadow-xs">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/20 text-[var(--primary)] rounded-2xl flex items-center justify-center mb-4">
              <AlertTriangle size={32} />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">No Cancelled Orders</h3>
            <p className="text-zinc-400 text-xs mt-1 max-w-sm">
              No voided or cancelled logs match your filters. Hooray! All system transactions are successful.
            </p>
          </div>
        ) : viewType === "Card" ? (
          /* Card View Layout */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {result.orders.map(renderCardView)}
          </div>
        ) : (
          /* Table View Layout */
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-xs">
            <Table
              columns={columns}
              dataSource={result.orders}
              rowKey="_id"
              scroll={{ x: 1200 }}
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: result.pagination?.total || 0,
                onChange: (page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                },
                showSizeChanger: true,
                size: "small",
                className: "pr-4"
              }}
              className="cancelled-orders-table text-xs"
            />
          </div>
        )}

        {/* Modals & Drawer */}
        {selectedOrder && activeModal === "details" && (
          <CancelledOrderDetailsDrawer
            visible={true}
            onClose={closeModal}
            order={selectedOrder}
            role={role}
            onInitiateRefund={(o) => openModal("refund", o)}
            onReopenOrder={(o) => openModal("reopen", o)}
          />
        )}

        {selectedOrder && activeModal === "refund" && (
          <ProcessRefundModal
            visible={true}
            onClose={closeModal}
            order={selectedOrder}
            confirmLoading={refundMutation.isPending}
            onConfirmRefund={async (payload) => {
              try {
                await refundMutation.mutateAsync(payload);
                closeModal();
              } catch (e) {
                // Mutate handles error toast
              }
            }}
          />
        )}

        {selectedOrder && activeModal === "reopen" && (
          <ReopenOrderModal
            visible={true}
            onClose={closeModal}
            order={selectedOrder}
            confirmLoading={reopenMutation.isPending}
            onConfirmReopen={async (payload) => {
              try {
                await reopenMutation.mutateAsync(payload);
                closeModal();
              } catch (e) {
                // Mutate handles error toast
              }
            }}
          />
        )}

        {selectedOrder && activeModal === "history" && (
          <RefundHistoryModal
            visible={true}
            onClose={closeModal}
            order={selectedOrder}
          />
        )}
      </div>
    </ConfigProvider>
  );
}
