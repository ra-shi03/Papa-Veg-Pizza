import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import {
  Wifi,
  RefreshCw,
  Search,
  LayoutGrid,
  TableProperties,
  Clock,
  UserCheck,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pizza,
  Filter,
  CheckCircle2,
  Package,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Bike,
  Printer,
  AlertOctagon,
  Phone,
  UserX,
  CreditCard,
  FileText,
  MessageSquare,
  Gift,
  Download,
  Star,
  DollarSign,
  Coins,
  Eye
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
  Switch,
  Rate,
  DatePicker
} from "antd";

// Custom Hooks
import {
  useCompletedOrders,
  useReorderOrder
} from "./hooks/useCompletedOrders";

// Connected Modals & Drawers
import CompletedOrderDetailsModal from "./components/CompletedOrderDetailsModal";
import DownloadInvoiceModal from "./components/DownloadInvoiceModal";
import ReorderModal from "./components/ReorderModal";
import ExportReportModal from "./components/ExportReportModal";

export default function CompletedOrders() {
  const { role } = useOutletContext();
  const navigate = useNavigate();

  // Themes
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
  const [viewType, setViewType] = useState("table"); // Default view is table
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [dateRangeType, setDateRangeType] = useState("All");
  const [customRange, setCustomRange] = useState(null);
  const [paymentType, setPaymentType] = useState("All");
  const [paymentStatus, setPaymentStatus] = useState("All");
  const [deliveryType, setDeliveryType] = useState("All");
  const [orderSource, setOrderSource] = useState("All");
  const [orderValue, setOrderValue] = useState("All");
  const [rating, setRating] = useState("All");

  // Modals States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // "details", "invoice", "reorder", "export"

  // Debounce search text (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
      setCurrentPage(1); // Reset page on search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Fetch completed orders data (API support query parameters)
  const {
    data: result = {
      orders: [],
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      averageDeliveryTime: 0,
      averageCustomerRating: 0,
      highValueOrdersCount: 0,
      pagination: { total: 0, page: 1, limit: 10 }
    },
    isLoading,
    isRefetching,
    refetch,
    socketConnected
  } = useCompletedOrders({
    page: currentPage,
    limit: pageSize,
    search: debouncedSearch,
    paymentType,
    paymentStatus,
    deliveryType,
    orderSource,
    orderValue,
    rating,
    dateRangeType,
    startDate: dateRangeType === "Custom" && customRange ? customRange[0]?.toISOString() : "",
    endDate: dateRangeType === "Custom" && customRange ? customRange[1]?.toISOString() : ""
  });

  const orders = result.orders || [];

  // Modal handlers
  const openModal = (modalName, order) => {
    setSelectedOrder(order);
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setActiveModal(null);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleString("en-IN", {
      dateStyle: "short",
      timeStyle: "short"
    });
  };

  const isKitchenSupervisor = role === "kitchen_supervisor";

  // Table Columns config with sticky action column
  const columns = [
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Order ID</span>,
      dataIndex: "orderNumber",
      key: "orderNumber",
      sorter: (a, b) => a.orderNumber.localeCompare(b.orderNumber),
      render: (text, record) => {
        const isHighValue = record.grandTotal > 1000;
        return (
          <div className="flex items-center gap-1">
            <span
              onClick={() => openModal("details", record)}
              className="font-extrabold text-primary hover:underline cursor-pointer text-xs"
            >
              {text}
            </span>
            {isHighValue && (
              <Tooltip title="High Value Order (> ₹1000)">
                <Sparkles size={11} className="text-amber-500 fill-amber-500 animate-pulse" />
              </Tooltip>
            )}
          </div>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Customer</span>,
      dataIndex: ["customer", "name"],
      key: "customerName",
      render: (text, record) => (
        <Tooltip title={record.customer?.email || "No email"}>
          <div>
            <p className="font-extrabold text-slate-900 dark:text-white text-xs">{text}</p>
            <p className="text-[10px] text-zinc-400 font-semibold">{record.customer?.phone}</p>
          </div>
        </Tooltip>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Type</span>,
      dataIndex: "orderType",
      key: "orderType",
      render: (type) => (
        <Tag color={type === "delivery" ? "purple" : "cyan"} className="font-extrabold border-0 px-2.5 py-0.5 rounded-full text-[10px] capitalize">
          {type}
        </Tag>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Amount</span>,
      dataIndex: "grandTotal",
      key: "grandTotal",
      sorter: (a, b) => a.grandTotal - b.grandTotal,
      render: (val, record) => {
        const isHighValue = val > 1000;
        return (
          <span className={`text-xs font-extrabold ${isHighValue ? "text-amber-600 dark:text-amber-400 font-black" : "text-slate-800 dark:text-zinc-200"}`}>
            {formatCurrency(val)}
          </span>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Payment</span>,
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: (method, record) => (
        <div>
          <p className="font-extrabold text-slate-800 dark:text-zinc-300 text-xs">{method}</p>
          <p className="text-[9px] text-zinc-400 uppercase font-semibold">{record.paymentGateway || "Cash"}</p>
        </div>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Duration</span>,
      dataIndex: "totalDuration",
      key: "totalDuration",
      render: (val) => (
        <span className="font-semibold text-xs text-slate-700 dark:text-zinc-300">
          {val || 30} mins
        </span>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Rating</span>,
      dataIndex: "customerRating",
      key: "customerRating",
      render: (val) => {
        const isFive = val === 5;
        const isOne = val === 1;
        
        let colorClass = "text-zinc-400";
        if (isFive) colorClass = "text-emerald-500";
        if (isOne) colorClass = "text-red-500 animate-pulse";

        return (
          <div className="flex items-center gap-0.5">
            <Star size={11} className={`${colorClass} fill-current`} />
            <span className={`text-xs font-black ${colorClass}`}>{val || "N/A"}</span>
          </div>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Completed Time</span>,
      dataIndex: "deliveredAt",
      key: "deliveredAt",
      render: (time) => (
        <span className="text-[11px] text-zinc-450 dark:text-zinc-400 font-semibold">
          {formatDate(time)}
        </span>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Status</span>,
      dataIndex: "status",
      key: "status",
      render: (status, record) => {
        let tagColor = "success";
        if (status === "delivered") tagColor = "processing";
        if (record.refundStatus === "refunded") tagColor = "error";

        return (
          <Tag color={tagColor} className="font-extrabold border-0 px-2.5 py-0.5 rounded-full text-[10px] capitalize">
            {record.refundStatus === "refunded" ? "Refunded" : status}
          </Tag>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Actions</span>,
      key: "actions",
      fixed: "right",
      width: 120,
      render: (_, record) => (
        <div className="flex gap-1.5 items-center">
          <Tooltip title="View Details">
            <Button
              size="small"
              onClick={() => openModal("details", record)}
              icon={<Eye size={12} />}
              className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
            />
          </Tooltip>

          {!isKitchenSupervisor && (
            <Tooltip title="Download Invoice">
              <Button
                size="small"
                onClick={() => openModal("invoice", record)}
                icon={<FileText size={12} className="text-primary" />}
                className="border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full flex items-center justify-center w-7 h-7 p-0 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              />
            </Tooltip>
          )}

          {!isKitchenSupervisor && (
            <Tooltip title="Reorder">
              <Button
                size="small"
                onClick={() => openModal("reorder", record)}
                icon={<RefreshCw size={12} />}
                className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-primary/10 active:scale-95 transition-all"
              />
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  // Card View component layout
  const renderCard = (orderObj) => {
    const isHighValue = orderObj.grandTotal > 1000;
    
    let borderStyle = "border-zinc-200 dark:border-zinc-800";
    if (isHighValue) {
      borderStyle = "border-amber-300 dark:border-amber-900 bg-amber-50/5 dark:bg-amber-950/5";
    }

    return (
      <div 
        key={orderObj._id}
        className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden ${borderStyle}`}
      >
        {isHighValue && (
          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[9px] font-black py-0.5 px-3 rounded-bl-xl flex items-center gap-0.5">
            <Sparkles size={8} /> High Value
          </div>
        )}

        {/* Card Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span 
              onClick={() => openModal("details", orderObj)}
              className="text-xs font-black text-primary hover:underline cursor-pointer"
            >
              {orderObj.orderNumber}
            </span>
            <Tag color={orderObj.orderType === "delivery" ? "purple" : "cyan"} className="font-bold border-0 px-2 py-0.2 rounded-full text-[9px] capitalize m-0">
              {orderObj.orderType}
            </Tag>
          </div>
          <Tag color={orderObj.refundStatus === "refunded" ? "error" : orderObj.status === "completed" ? "success" : "processing"} className="font-extrabold border-0 px-2.5 py-0.2 rounded-full text-[9px] capitalize m-0">
            {orderObj.refundStatus === "refunded" ? "Refunded" : orderObj.status}
          </Tag>
        </div>

        {/* Card Body */}
        <div className="space-y-2 text-xs font-semibold text-slate-700 dark:text-zinc-350">
          <div className="flex justify-between">
            <span className="text-zinc-400">Customer</span>
            <span className="text-slate-805 dark:text-zinc-200 font-extrabold">{orderObj.customer?.name} ({orderObj.customer?.phone})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Bill Amount</span>
            <span className="font-black text-slate-800 dark:text-zinc-200">{formatCurrency(orderObj.grandTotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Payment</span>
            <span>{orderObj.paymentMethod} ({orderObj.paymentGateway || "Cash"})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-400">Duration</span>
            <span>{orderObj.totalDuration || 30} Mins</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-400">Feedback</span>
            <div className="flex items-center gap-0.5">
              <Star size={10} className="text-yellow-500 fill-current" />
              <span>{orderObj.customerRating || "N/A"}</span>
            </div>
          </div>
          <div className="flex justify-between text-[10px] text-zinc-450 dark:text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-800/40">
            <span>Completed</span>
            <span>{formatDate(orderObj.deliveredAt || orderObj.updatedAt)}</span>
          </div>
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/30 pt-2.5">
          <Tooltip title="View Details">
            <Button
              size="small"
              onClick={() => openModal("details", orderObj)}
              icon={<Eye size={12} />}
              className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
            />
          </Tooltip>

          {!isKitchenSupervisor && (
            <Tooltip title="Download Invoice">
              <Button
                size="small"
                onClick={() => openModal("invoice", orderObj)}
                icon={<FileText size={12} className="text-primary" />}
                className="border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full flex items-center justify-center w-7 h-7 p-0 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              />
            </Tooltip>
          )}

          {!isKitchenSupervisor && (
            <Tooltip title="Reorder">
              <Button
                size="small"
                onClick={() => openModal("reorder", orderObj)}
                icon={<RefreshCw size={12} />}
                className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-primary/10 active:scale-95 transition-all"
              />
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

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
      <div className="p-4 space-y-4 min-h-screen bg-slate-50/50 dark:bg-zinc-955 text-slate-900 dark:text-white transition-colors duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Completed Orders
              </h1>
              <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-full px-2 py-0.5">
                <span className={`relative flex h-2 w-2`}>
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${socketConnected ? "bg-green-400" : "bg-amber-400"}`}></span>
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${socketConnected ? "bg-green-500" : "bg-amber-500"}`}></span>
                </span>
                <span className="text-[9px] font-bold text-zinc-400 capitalize">{socketConnected ? "Live" : "Offline Feed"}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 font-semibold mt-0.5">
              Historical completed and delivered orders details
            </p>
          </div>

          {/* Right Header: Toggle Board/Table & Refresh */}
          <div className="flex items-center gap-2">
            <Segmented
              options={[
                { value: "table", icon: <TableProperties size={13} className="inline mr-1" /> },
                { value: "board", icon: <LayoutGrid size={13} className="inline mr-1" /> }
              ]}
              value={viewType}
              onChange={(val) => setViewType(val)}
              className="rounded-full shadow-sm"
            />
            
            <Button
              type="default"
              onClick={() => refetch()}
              loading={isLoading || isRefetching}
              className="text-xs font-bold !border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all cursor-pointer rounded-full px-3.5 py-2 shadow-sm flex items-center gap-1.5"
            >
              <RefreshCw size={12} className={`${isLoading || isRefetching ? "animate-spin" : ""}`} />
              Refresh Feed
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
          {/* Stat 1: Total Orders */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "12px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Total Orders</p>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{result.totalOrders || 0}</h3>
              </div>
              <div className="p-2 bg-green-50 dark:bg-green-950/20 text-green-500 rounded-full">
                <CheckCircle2 size={14} />
              </div>
            </div>
          </Card>

          {/* Stat 2: Total Revenue */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "12px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Total Revenue</p>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{formatCurrency(result.totalRevenue || 0)}</h3>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-full">
                <DollarSign size={14} />
              </div>
            </div>
          </Card>

          {/* Stat 3: AOV */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "12px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Avg Order Value</p>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{formatCurrency(result.averageOrderValue || 0)}</h3>
              </div>
              <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-full">
                <Coins size={14} />
              </div>
            </div>
          </Card>

          {/* Stat 4: Avg Delivery Time */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "12px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Avg Delivery Time</p>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{result.averageDeliveryTime || 30} mins</h3>
              </div>
              <div className="p-2 bg-amber-50 dark:bg-amber-950/20 text-amber-500 rounded-full">
                <Clock size={14} />
              </div>
            </div>
          </Card>

          {/* Stat 5: Avg Rating */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "12px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">Avg Rating</p>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{result.averageCustomerRating || 5.0}★</h3>
              </div>
              <div className="p-2 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-550 rounded-full">
                <Star size={14} />
              </div>
            </div>
          </Card>

          {/* Stat 6: High Value Count */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "12px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] text-zinc-400 font-extrabold uppercase tracking-wider">High Value (&gt; ₹1k)</p>
                <h3 className="text-base font-black text-slate-900 dark:text-white mt-1">{result.highValueOrdersCount || 0}</h3>
              </div>
              <div className="p-2 bg-red-50 dark:bg-red-950/20 text-red-500 rounded-full">
                <Sparkles size={14} />
              </div>
            </div>
          </Card>
        </div>

        {/* Collapsible Filter Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setFiltersOpen(!filtersOpen)}>
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-primary" />
              <span className="text-xs font-black text-slate-800 dark:text-zinc-200">Filter History Logs</span>
              {(searchText || dateRangeType !== "All" || paymentType !== "All" || paymentStatus !== "All" || deliveryType !== "All" || orderSource !== "All" || orderValue !== "All" || rating !== "All") && (
                <Badge status="processing" className="ml-1" />
              )}
            </div>
            {filtersOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 animate-fade-in text-xs">
              
              {/* Search */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-450 dark:text-zinc-450 font-bold uppercase">Search order</span>
                <Input
                  placeholder="ID, Customer, Phone"
                  prefix={<Search size={12} className="text-zinc-400" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              {/* Date Scope Select */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Date Scope</span>
                <Select
                  value={dateRangeType}
                  onChange={(val) => {
                    setDateRangeType(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Dates</Select.Option>
                  <Select.Option value="Today">Today</Select.Option>
                  <Select.Option value="Yesterday">Yesterday</Select.Option>
                  <Select.Option value="Last 7 Days">Last 7 Days</Select.Option>
                  <Select.Option value="Last 30 Days">Last 30 Days</Select.Option>
                  <Select.Option value="Custom">Custom Range</Select.Option>
                </Select>
              </div>

              {/* Custom Date Range Picker */}
              {dateRangeType === "Custom" && (
                <div className="flex flex-col gap-1 animate-fade-in">
                  <span className="text-[10px] text-zinc-450 font-bold uppercase">Custom Date Range</span>
                  <DatePicker.RangePicker 
                    className="w-full h-10 rounded-xl"
                    onChange={(dates) => {
                      setCustomRange(dates);
                      setCurrentPage(1);
                    }}
                  />
                </div>
              )}

              {/* Payment Type */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Payment Type</span>
                <Select
                  value={paymentType}
                  onChange={(val) => {
                    setPaymentType(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Types</Select.Option>
                  <Select.Option value="Online">Online</Select.Option>
                  <Select.Option value="COD">Cash on Delivery (COD)</Select.Option>
                  <Select.Option value="Wallet">Wallet</Select.Option>
                </Select>
              </div>

              {/* Payment Status */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Payment Status</span>
                <Select
                  value={paymentStatus}
                  onChange={(val) => {
                    setPaymentStatus(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Statuses</Select.Option>
                  <Select.Option value="Paid">Paid</Select.Option>
                  <Select.Option value="Refunded">Refunded</Select.Option>
                </Select>
              </div>

              {/* Delivery Type */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Delivery Type</span>
                <Select
                  value={deliveryType}
                  onChange={(val) => {
                    setDeliveryType(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Deliveries</Select.Option>
                  <Select.Option value="delivery">Delivery</Select.Option>
                  <Select.Option value="pickup">Pickup</Select.Option>
                </Select>
              </div>

              {/* Order Source */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-455 font-bold uppercase">Order Source</span>
                <Select
                  value={orderSource}
                  onChange={(val) => {
                    setOrderSource(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Sources</Select.Option>
                  <Select.Option value="Website">Website</Select.Option>
                  <Select.Option value="Android">Android</Select.Option>
                  <Select.Option value="iOS">iOS</Select.Option>
                  <Select.Option value="POS">POS</Select.Option>
                  <Select.Option value="Swiggy">Swiggy</Select.Option>
                  <Select.Option value="Zomato">Zomato</Select.Option>
                </Select>
              </div>

              {/* Order Value Tier */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Order Value</span>
                <Select
                  value={orderValue}
                  onChange={(val) => {
                    setOrderValue(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Amounts</Select.Option>
                  <Select.Option value="High Value">High Value (&gt; ₹1k)</Select.Option>
                </Select>
              </div>

              {/* Customer Rating Filter */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Customer Rating</span>
                <Select
                  value={rating}
                  onChange={(val) => {
                    setRating(val);
                    setCurrentPage(1);
                  }}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Ratings</Select.Option>
                  <Select.Option value="1">1 Star</Select.Option>
                  <Select.Option value="2">2 Star</Select.Option>
                  <Select.Option value="3">3 Star</Select.Option>
                  <Select.Option value="4">4 Star</Select.Option>
                  <Select.Option value="5">5 Star</Select.Option>
                </Select>
              </div>

              {/* Filter Action Buttons */}
              <div className="grid grid-cols-2 gap-2 items-end pt-3 lg:col-span-2">
                <Button
                  onClick={() => {
                    setSearchText("");
                    setDateRangeType("All");
                    setPaymentType("All");
                    setPaymentStatus("All");
                    setDeliveryType("All");
                    setOrderSource("All");
                    setOrderValue("All");
                    setRating("All");
                    setCustomRange(null);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full h-10 flex items-center justify-center cursor-pointer transition-all active:scale-95 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                >
                  Reset Filters
                </Button>
                
                {!isKitchenSupervisor && (
                  <Button
                    onClick={() => openModal("export", null)}
                    className="text-xs font-bold !border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all cursor-pointer rounded-full h-10 flex items-center justify-center gap-1.5"
                  >
                    <Download size={13} className="text-primary" />
                    Export Report
                  </Button>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Main Content Area */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Skeleton active paragraph={{ rows: 6 }} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl" />
            <Skeleton active paragraph={{ rows: 6 }} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl" />
            <Skeleton active paragraph={{ rows: 6 }} className="bg-white dark:bg-zinc-900 p-4 rounded-2xl" />
          </div>
        ) : viewType === "board" ? (
          /* Card View Layout */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {orders.length === 0 ? (
                <div className="col-span-full bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
                  <Package size={36} className="text-zinc-400 mb-2" />
                  <h3 className="text-sm font-black text-zinc-900 dark:text-white">No Completed Orders</h3>
                  <p className="text-zinc-400 text-xs mt-1">Refine filters or check query params.</p>
                </div>
              ) : (
                orders.map(renderCard)
              )}
            </div>
            
            {/* Cards Pagination */}
            {orders.length > 0 && (
              <div className="flex justify-end pr-2 py-2">
                <Table
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: result.totalOrders,
                    onChange: (page) => setCurrentPage(page),
                    showSizeChanger: false,
                    className: "m-0"
                  }}
                  dataSource={[]}
                  columns={[]}
                  className="cards-dummy-table"
                />
              </div>
            )}
          </div>
        ) : (
          /* Table View Layout (Default) */
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <Table
              dataSource={orders}
              columns={columns}
              rowKey="_id"
              pagination={{
                current: currentPage,
                pageSize: pageSize,
                total: result.totalOrders,
                onChange: (page) => setCurrentPage(page),
                showSizeChanger: false,
                className: "px-4"
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span className="text-xs font-bold text-zinc-400">No historical completed orders found</span>}
                  />
                )
              }}
              className="completed-orders-table"
            />
          </div>
        )}

        {/* Connected Drawers and Modals */}
        <CompletedOrderDetailsModal
          visible={activeModal === "details"}
          onClose={closeModal}
          order={selectedOrder}
          role={role}
          onDownloadInvoice={(o) => openModal("invoice", o)}
          onReorder={(o) => openModal("reorder", o)}
        />

        <DownloadInvoiceModal
          visible={activeModal === "invoice"}
          onClose={closeModal}
          order={selectedOrder}
        />

        <ReorderModal
          visible={activeModal === "reorder"}
          onClose={closeModal}
          order={selectedOrder}
        />

        <ExportReportModal
          visible={activeModal === "export"}
          onClose={closeModal}
        />
      </div>
    </ConfigProvider>
  );
}
