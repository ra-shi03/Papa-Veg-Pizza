import React, { useState, useEffect, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
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
  Eye,
  Check
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
  Switch
} from "antd";

// Custom Hooks
import {
  useReadyOrders,
  useAssignRider,
  useConfirmPickup,
  useEscalateOrder
} from "./hooks/useReadyOrders";

// Connected Modals
import AssignRiderModal from "./components/AssignRiderModal";
import ConfirmPickupModal from "./components/ConfirmPickupModal";
import EscalateOrderModal from "./components/EscalateOrderModal";
import PrintReceiptPreviewModal from "./components/PrintReceiptPreviewModal";
import ReadyOrderDetailsModal from "./components/ReadyOrderDetailsModal";

export default function ReadyOrders() {
  const { role } = useOutletContext();

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
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedRiderStatus, setSelectedRiderStatus] = useState("All");
  const [selectedWaitingTime, setSelectedWaitingTime] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");

  // Modals States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // "details", "assign", "pickup", "escalate", "print"

  // Debounce search text (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Live Timer tick every 1s for accurate live countdown timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch ready orders data
  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
    socketConnected
  } = useReadyOrders({
    search: debouncedSearch,
    orderType: selectedType === "All" ? "" : selectedType,
    riderStatus: selectedRiderStatus === "All" ? "" : selectedRiderStatus,
    waitingTime: selectedWaitingTime === "All" ? "" : selectedWaitingTime,
    priority: selectedPriority === "All" ? "" : selectedPriority
  });

  // Helper: Calculate Waiting Duration in Minutes
  const getWaitingTimeDetails = (readyAt) => {
    if (!readyAt) return { minutes: 0, text: "0m", colorClass: "text-emerald-500" };
    
    const diffMs = currentTime - new Date(readyAt);
    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
    const diffSecs = Math.max(0, Math.floor((diffMs % 60000) / 1000));
    
    let colorClass = "text-emerald-600 dark:text-emerald-400";
    if (diffMins >= 10 && diffMins < 15) {
      colorClass = "text-amber-500 dark:text-amber-400 font-bold";
    } else if (diffMins >= 15) {
      colorClass = "text-red-500 dark:text-red-400 font-black animate-pulse";
    }

    return {
      minutes: diffMins,
      seconds: diffSecs,
      text: `${diffMins}m ${diffSecs}s`,
      colorClass
    };
  };

  // KPI Calculations
  const readyOrdersCount = orders.length;

  // Average Waiting Time calculation based on current mock database
  const averageWaitingTime = useMemo(() => {
    if (orders.length === 0) return 0;
    const totalWaitingTimeMins = orders.reduce((acc, order) => {
      const readyTime = new Date(order.readyAt || order.createdAt);
      const diffMs = currentTime - readyTime;
      return acc + Math.max(0, Math.round(diffMs / 60000));
    }, 0);
    return Math.round(totalWaitingTimeMins / orders.length);
  }, [orders, currentTime]);

  const unassignedOrdersCount = orders.filter(
    (o) => o.orderType === "delivery" && o.deliveryPartnerId === null
  ).length;

  // Retrieve count of busy riders
  const assignedRidersCount = useMemo(() => {
    try {
      const riders = JSON.parse(localStorage.getItem("pvp_riders")) || [];
      return riders.filter((r) => r.availability === "busy" || r.currentDeliveries > 0).length;
    } catch (e) {
      return 0;
    }
  }, [orders]);

  const delayedPickupOrdersCount = orders.filter((o) => {
    const readyTime = new Date(o.readyAt || o.createdAt);
    const diffMins = Math.round((currentTime - readyTime) / 60000);
    return diffMins >= 15;
  }).length;

  // Find if any order is critically delayed (> 15 mins) to show warning banner
  const criticalDelayedOrder = useMemo(() => {
    return orders.find((o) => {
      const readyTime = new Date(o.readyAt || o.createdAt);
      const diffMins = Math.round((currentTime - readyTime) / 60000);
      return diffMins >= 15;
    });
  }, [orders, currentTime]);

  // Modal Open Handlers
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

  // Render Table Columns (Aesthetic color highlighting applied to rows)
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
      render: (text, record) => (
        <div>
          <p className="font-extrabold text-slate-900 dark:text-white text-xs">{text}</p>
          <p className="text-[10px] text-zinc-400 font-semibold">{record.customer?.phone}</p>
        </div>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Type</span>,
      dataIndex: "orderType",
      key: "orderType",
      render: (type) => (
        <Tag color={type === "delivery" ? "purple" : "cyan"} className="font-extrabold border-0 px-2 py-0.5 rounded-full text-[10px] capitalize">
          {type}
        </Tag>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Priority</span>,
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        let tagColor = "default";
        let icon = null;
        if (priority === "urgent") {
          tagColor = "volcano";
          icon = <ShieldAlert size={10} className="inline mr-0.5" />;
        }
        if (priority === "vip") {
          tagColor = "gold";
          icon = <Sparkles size={10} className="inline mr-0.5" />;
        }
        return (
          <Tag color={tagColor} className="font-bold border-0 px-2.5 py-0.5 rounded-full capitalize text-[10px]">
            {icon}
            {priority || "normal"}
          </Tag>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Waiting Duration</span>,
      dataIndex: "readyAt",
      key: "waitingDuration",
      render: (readyAt, record) => {
        const timer = getWaitingTimeDetails(readyAt || record.createdAt);
        return (
          <div className="flex items-center gap-1">
            <Clock size={12} className={timer.colorClass} />
            <span className={`font-black text-xs ${timer.colorClass}`}>
              {timer.text}
            </span>
          </div>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Assigned Rider</span>,
      key: "rider",
      render: (_, record) => {
        if (record.orderType === "pickup") {
          return <span className="text-[10px] text-zinc-400 font-bold uppercase italic">Customer Pickup</span>;
        }

        const riders = JSON.parse(localStorage.getItem("pvp_riders")) || [];
        const rider = record.deliveryPartnerId
          ? riders.find((r) => r._id === record.deliveryPartnerId)
          : null;

        if (rider) {
          return (
            <div className="flex items-center gap-1.5">
              <div className="w-5 h-5 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center font-bold text-[10px]">
                {rider.name.charAt(0)}
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-tight">{rider.name}</p>
                <p className="text-[9px] text-zinc-400 font-medium">ETA: {record.riderAssignedAt ? "En Route" : "Assigned"}</p>
              </div>
            </div>
          );
        }

        return (
          <Tag color="error" className="font-extrabold border-0 px-2 py-0.5 rounded-full text-[9px] uppercase flex items-center gap-0.5 w-fit">
            <UserX size={10} /> Unassigned
          </Tag>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Total Bill</span>,
      dataIndex: "grandTotal",
      key: "grandTotal",
      render: (val) => (
        <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs">
          {formatCurrency(val)}
        </span>
      )
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Actions</span>,
      key: "actions",
      width: 140,
      render: (_, record) => {
        const timer = getWaitingTimeDetails(record.readyAt || record.createdAt);
        const isDelivery = record.orderType === "delivery";
        const hasRider = !!record.deliveryPartnerId;

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

            {role !== "kitchen_staff" && isDelivery && !hasRider && (
              <Tooltip title="Assign Rider">
                <Button
                  size="small"
                  onClick={() => openModal("assign", record)}
                  icon={<Bike size={12} />}
                  className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-primary/15 active:scale-95 transition-all"
                />
              </Tooltip>
            )}

            {role !== "kitchen_staff" && (!isDelivery || hasRider) && (
              <Tooltip title="Confirm Pickup">
                <Button
                  size="small"
                  onClick={() => openModal("pickup", record)}
                  icon={<Check size={12} />}
                  className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-primary/15 active:scale-95 transition-all"
                />
              </Tooltip>
            )}

            <Tooltip title="Print Receipt">
              <Button
                size="small"
                onClick={() => openModal("print", record)}
                icon={<Printer size={12} className="text-primary" />}
                className="border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full flex items-center justify-center w-7 h-7 p-0 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
              />
            </Tooltip>

            {!record.isEscalated && timer.minutes >= 10 && (
              <Tooltip title="Escalate Order">
                <Button
                  size="small"
                  danger
                  type="text"
                  onClick={() => openModal("escalate", record)}
                  icon={<AlertOctagon size={12} className="text-red-500" />}
                  className="hover:bg-red-50 dark:hover:bg-red-955/20 active:scale-95 rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
                />
              </Tooltip>
            )}
          </div>
        );
      }
    }
  ];

  // Card view layout for card grid layout
  const renderCardView = (orderObj) => {
    const timer = getWaitingTimeDetails(orderObj.readyAt || orderObj.createdAt);
    const isDelivery = orderObj.orderType === "delivery";
    const hasRider = !!orderObj.deliveryPartnerId;

    let priorityBadge = null;
    if (orderObj.priority === "urgent") {
      priorityBadge = (
        <Tag color="volcano" className="font-extrabold capitalize px-2 py-0.5 rounded-full border-0 text-[9px] flex items-center gap-0.5">
          <ShieldAlert size={10} /> Urgent
        </Tag>
      );
    } else if (orderObj.priority === "vip") {
      priorityBadge = (
        <Tag color="gold" className="font-extrabold capitalize px-2 py-0.5 rounded-full border-0 text-[9px] flex items-center gap-0.5">
          <Sparkles size={10} /> VIP
        </Tag>
      );
    } else {
      priorityBadge = (
        <Tag color="blue" className="font-extrabold capitalize px-2 py-0.5 rounded-full border-0 text-[9px]">
          Normal
        </Tag>
      );
    }

    // Dynamic row highlight card border matching waiting time
    let borderStyle = "border-zinc-200 dark:border-zinc-800";
    if (timer.minutes < 5) {
      borderStyle = "border-emerald-350 dark:border-emerald-900 bg-emerald-50/10 dark:bg-emerald-950/5";
    } else if (timer.minutes >= 10 && timer.minutes < 15) {
      borderStyle = "border-amber-350 dark:border-amber-900 bg-amber-50/10 dark:bg-amber-950/5";
    } else if (timer.minutes >= 15) {
      borderStyle = "border-rose-455 dark:border-rose-950 bg-rose-50/10 dark:bg-rose-950/5 animate-pulse-subtle";
    }

    const riders = JSON.parse(localStorage.getItem("pvp_riders")) || [];
    const rider = orderObj.deliveryPartnerId
      ? riders.find((r) => r._id === orderObj.deliveryPartnerId)
      : null;

    return (
      <div
        key={orderObj._id}
        className={`bg-white dark:bg-zinc-900 border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all space-y-3 relative overflow-hidden ${borderStyle}`}
      >
        {/* Escalated Tag */}
        {orderObj.isEscalated && (
          <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-[9px] font-black py-0.5 px-2 text-center flex items-center justify-center gap-1">
            <AlertOctagon size={8} className="animate-bounce" /> CRITICAL ESCALATION: {orderObj.escalationReason}
          </div>
        )}

        {/* Card Header */}
        <div className="flex items-start justify-between pt-2">
          <div>
            <span
              onClick={() => openModal("details", orderObj)}
              className="text-xs font-black text-slate-855 dark:text-zinc-100 hover:text-primary hover:underline cursor-pointer block"
            >
              {orderObj.orderNumber}
            </span>
            <p className="text-[10px] text-zinc-400 font-bold mt-0.5 capitalize">{orderObj.customer?.name}</p>
          </div>
          <div className="flex items-center gap-1">
            {priorityBadge}
            <Tag color={orderObj.orderType === "delivery" ? "purple" : "cyan"} className="font-bold border-0 px-2 py-0.5 rounded-full text-[9px] capitalize m-0">
              {orderObj.orderType}
            </Tag>
          </div>
        </div>

        {/* Card Body - Item List Summary */}
        <div className="bg-slate-50 dark:bg-zinc-955 p-2.5 rounded-xl border border-zinc-150 dark:border-zinc-800/40 text-[10px] space-y-1">
          {orderObj.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between font-semibold text-slate-700 dark:text-zinc-350">
              <span className="truncate pr-2">{item.name}</span>
              <span className="text-primary font-black shrink-0">x{item.quantity}</span>
            </div>
          ))}
          <div className="border-t border-zinc-200 dark:border-zinc-800 pt-1 mt-1 flex justify-between items-center text-[9px] font-black text-slate-900 dark:text-white">
            <span>Bill Total:</span>
            <span>{formatCurrency(orderObj.grandTotal)}</span>
          </div>
        </div>

        {/* Card Delivery Partner Details */}
        <div className="flex justify-between items-center text-[9px] text-zinc-450 font-bold border-t border-zinc-100 dark:border-zinc-800/30 pt-2">
          <div>
            {isDelivery ? (
              rider ? (
                <div className="flex items-center gap-1 text-slate-800 dark:text-zinc-300">
                  <Bike size={12} className="text-blue-500" />
                  <span>Rider: <span className="font-extrabold">{rider.name}</span></span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-red-500">
                  <UserX size={12} />
                  <span>Awaiting Rider Assignment</span>
                </div>
              )
            ) : (
              <span className="text-zinc-400 font-extrabold uppercase tracking-wide">Customer Self-Pickup</span>
            )}
          </div>

          {/* Waiting Timer display */}
          <div className="flex items-center gap-1">
            <Clock size={10} className={timer.colorClass} />
            <span className={`font-black text-[10px] ${timer.colorClass}`}>
              {timer.text}
            </span>
          </div>
        </div>

        {/* Card Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/30 pt-2">
          <Tooltip title="View Details">
            <Button
              size="small"
              onClick={() => openModal("details", orderObj)}
              icon={<Eye size={12} />}
              className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
            />
          </Tooltip>

          {role !== "kitchen_staff" && isDelivery && !hasRider && (
            <Tooltip title="Assign Rider">
              <Button
                size="small"
                onClick={() => openModal("assign", orderObj)}
                icon={<Bike size={12} />}
                className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-primary/15 active:scale-95 transition-all"
              />
            </Tooltip>
          )}

          {role !== "kitchen_staff" && (!isDelivery || hasRider) && (
            <Tooltip title="Confirm Pickup">
              <Button
                size="small"
                onClick={() => openModal("pickup", orderObj)}
                icon={<Check size={12} />}
                className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-primary/15 active:scale-95 transition-all"
              />
            </Tooltip>
          )}

          <Tooltip title="Print Receipt">
            <Button
              size="small"
              onClick={() => openModal("print", orderObj)}
              icon={<Printer size={12} className="text-primary" />}
              className="border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full flex items-center justify-center w-7 h-7 p-0 hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            />
          </Tooltip>
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
                Ready Orders
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
              Manage completed orders waiting for customer pickup or delivery rider handover
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

        {/* Delay Alert Banner */}
        {criticalDelayedOrder && (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 p-3 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 animate-pulse">
            <div className="flex gap-2.5 items-start">
              <AlertTriangle className="text-red-500 mt-0.5 shrink-0" size={18} />
              <div>
                <p className="text-xs font-black text-red-800 dark:text-red-400">Critical Dispatch Delay Alert</p>
                <p className="text-[10px] text-red-755/80 dark:text-red-500 font-semibold mt-0.5">
                  Order <span className="font-extrabold">{criticalDelayedOrder.orderNumber}</span> has been waiting in ready queue for over 15 minutes! Please dispatch immediately.
                </p>
              </div>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="small"
                onClick={() => openModal("details", criticalDelayedOrder)}
                className="text-[10px] font-black border border-red-200 bg-white hover:bg-red-50 text-red-600 rounded-full px-3 py-1 cursor-pointer"
              >
                View Details
              </Button>
              {role !== "kitchen_staff" && !criticalDelayedOrder.isEscalated && (
                <Button
                  size="small"
                  danger
                  type="primary"
                  onClick={() => openModal("escalate", criticalDelayedOrder)}
                  className="text-[10px] font-black !bg-red-650 hover:!bg-red-700 text-white rounded-full px-3 py-1 cursor-pointer"
                >
                  Escalate Now
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Stat 1: Ready Orders */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "14px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Ready Orders</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{readyOrdersCount}</h3>
              </div>
              <div className="p-2.5 bg-green-50 dark:bg-green-950/20 text-green-500 rounded-full border border-green-100 dark:border-green-950/30">
                <Package size={16} />
              </div>
            </div>
          </Card>

          {/* Stat 2: Avg Waiting Time */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "14px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Avg Waiting Time</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{averageWaitingTime} Mins</h3>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-full border border-blue-100 dark:border-blue-955/30">
                <Clock size={16} />
              </div>
            </div>
          </Card>

          {/* Stat 3: Unassigned Orders */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "14px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Unassigned</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{unassignedOrdersCount}</h3>
              </div>
              <div className={`p-2.5 rounded-full border ${
                unassignedOrdersCount > 0 
                  ? "bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20" 
                  : "bg-zinc-50 text-zinc-400 border-zinc-150 dark:bg-zinc-900"
              }`}>
                <UserX size={16} />
              </div>
            </div>
          </Card>

          {/* Stat 4: Assigned Riders */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "14px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Active Riders</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{assignedRidersCount}</h3>
              </div>
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-full border border-purple-100 dark:border-purple-950/30">
                <Bike size={16} />
              </div>
            </div>
          </Card>

          {/* Stat 5: Delayed Pickup Count */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "14px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Delayed Pickup</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{delayedPickupOrdersCount}</h3>
              </div>
              <div className={`p-2.5 rounded-full border ${
                delayedPickupOrdersCount > 0 
                  ? "bg-rose-50 text-rose-500 border-rose-100 dark:bg-rose-950/20 animate-pulse" 
                  : "bg-zinc-50 text-zinc-400 border-zinc-150 dark:bg-zinc-900"
              }`}>
                <AlertCircle size={16} />
              </div>
            </div>
          </Card>
        </div>

        {/* Collapsible Filter Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setFiltersOpen(!filtersOpen)}>
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-primary" />
              <span className="text-xs font-black text-slate-800 dark:text-zinc-200">Filter Ready Orders</span>
              {(searchText || selectedType !== "All" || selectedRiderStatus !== "All" || selectedWaitingTime !== "All" || selectedPriority !== "All") && (
                <Badge status="processing" className="ml-1" />
              )}
            </div>
            {filtersOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800 animate-fade-in">
              {/* Search */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Search Ready Queue</span>
                <Input
                  placeholder="ID, Customer, Phone"
                  prefix={<Search size={12} className="text-zinc-400" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              {/* Order Type Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Order Type</span>
                <Select
                  value={selectedType}
                  onChange={(val) => setSelectedType(val)}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Types</Select.Option>
                  <Select.Option value="delivery">Delivery</Select.Option>
                  <Select.Option value="pickup">Pickup / Takeaway</Select.Option>
                </Select>
              </div>

              {/* Rider Status Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-455 font-bold uppercase">Rider Status</span>
                <Select
                  value={selectedRiderStatus}
                  onChange={(val) => setSelectedRiderStatus(val)}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Statuses</Select.Option>
                  <Select.Option value="Assigned">Assigned Rider</Select.Option>
                  <Select.Option value="Unassigned">Unassigned / Awaiting</Select.Option>
                </Select>
              </div>

              {/* Waiting Time Filter */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-455 font-bold uppercase">Waiting Duration</span>
                <Select
                  value={selectedWaitingTime}
                  onChange={(val) => setSelectedWaitingTime(val)}
                  className="w-full h-10 rounded-xl font-semibold"
                >
                  <Select.Option value="All">All Wait Times</Select.Option>
                  <Select.Option value="Under 5 min">Under 5 min</Select.Option>
                  <Select.Option value="5-15 min">5-15 min</Select.Option>
                  <Select.Option value="More than 15 min">More than 15 min</Select.Option>
                </Select>
              </div>

              {/* Priority Select & Reset Button */}
              <div className="grid grid-cols-2 gap-2 items-end">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Priority</span>
                  <Select
                    value={selectedPriority}
                    onChange={(val) => setSelectedPriority(val)}
                    className="w-full h-10 rounded-xl font-semibold"
                  >
                    <Select.Option value="All">All Priorities</Select.Option>
                    <Select.Option value="normal">Normal</Select.Option>
                    <Select.Option value="urgent">Urgent</Select.Option>
                    <Select.Option value="vip">VIP</Select.Option>
                  </Select>
                </div>
                <Button
                  onClick={() => {
                    setSearchText("");
                    setSelectedType("All");
                    setSelectedRiderStatus("All");
                    setSelectedWaitingTime("All");
                    setSelectedPriority("All");
                  }}
                  className="text-[10px] font-bold !border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all cursor-pointer rounded-full h-10 flex items-center justify-center"
                >
                  Clear Filters
                </Button>
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
          /* Kanban Board View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.length === 0 ? (
              <div className="col-span-full bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-150 dark:border-zinc-800 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
                <Package size={36} className="text-zinc-400 mb-2" />
                <h3 className="text-sm font-black text-zinc-900 dark:text-white">No Ready Orders Found</h3>
                <p className="text-zinc-400 text-xs mt-1">Try refining search terms or filters.</p>
              </div>
            ) : (
              orders.map(renderCardView)
            )}
          </div>
        ) : (
          /* Table Row Highlighting applied dynamically based on waiting time */
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <Table
              dataSource={orders}
              columns={columns}
              rowKey="_id"
              rowClassName={(record) => {
                const timer = getWaitingTimeDetails(record.readyAt || record.createdAt);
                if (timer.minutes < 5) {
                  return "bg-emerald-50/20 hover:bg-emerald-50/30 dark:bg-emerald-950/5 dark:hover:bg-emerald-950/10 border-l-4 border-l-emerald-500 transition-colors";
                }
                if (timer.minutes >= 10 && timer.minutes < 15) {
                  return "bg-amber-50/20 hover:bg-amber-50/30 dark:bg-amber-950/5 dark:hover:bg-amber-950/10 border-l-4 border-l-amber-500 transition-colors";
                }
                if (timer.minutes >= 15) {
                  return "bg-rose-50/20 hover:bg-rose-50/35 dark:bg-rose-955/5 dark:hover:bg-rose-955/10 border-l-4 border-l-rose-500 transition-colors font-semibold";
                }
                return "hover:bg-slate-50 dark:hover:bg-zinc-850/30 transition-colors";
              }}
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                className: "px-4"
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span className="text-xs font-bold text-zinc-400">No ready dispatch orders found</span>}
                  />
                )
              }}
              className="ready-orders-table"
            />
          </div>
        )}

        {/* Connected Modals */}
        <ReadyOrderDetailsModal
          visible={activeModal === "details"}
          onClose={closeModal}
          order={selectedOrder}
          role={role}
          onAssignRider={(o) => openModal("assign", o)}
          onConfirmPickup={(o) => openModal("pickup", o)}
          onPrint={(o) => openModal("print", o)}
        />

        <AssignRiderModal
          visible={activeModal === "assign"}
          onClose={closeModal}
          order={selectedOrder}
        />

        <ConfirmPickupModal
          visible={activeModal === "pickup"}
          onClose={closeModal}
          order={selectedOrder}
        />

        <EscalateOrderModal
          visible={activeModal === "escalate"}
          onClose={closeModal}
          order={selectedOrder}
        />

        <PrintReceiptPreviewModal
          visible={activeModal === "print"}
          onClose={closeModal}
          order={selectedOrder}
        />
      </div>
    </ConfigProvider>
  );
}
