import React, { useState, useEffect } from "react";
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
  Play,
  Pause,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Pizza,
  Filter,
  CheckCircle2,
  ChefHat,
  Flame,
  Package,
  Calendar,
  Sparkles,
  ShieldAlert,
  ArrowRight,
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
  Switch
} from "antd";

// Custom Hooks
import {
  useActiveOrders,
  useActiveKitchenStaff,
  useUpdateKitchenStage
} from "./hooks/useActiveOrders";

// Connected Modals
import AssignStaffModal from "./components/AssignStaffModal";
import ChangePriorityModal from "./components/ChangePriorityModal";
import PauseOrderModal from "./components/PauseOrderModal";
import MarkReadyModal from "./components/MarkReadyModal";
import DelayAlertModal from "./components/DelayAlertModal";
import ActiveOrderDetailsModal from "./components/ActiveOrderDetailsModal";

export default function ActiveOrders() {
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
  const [viewType, setViewType] = useState("board"); // "board" or "table"
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filter States
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedStage, setSelectedStage] = useState("All");
  const [selectedPriority, setSelectedPriority] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedStaff, setSelectedStaff] = useState("All");
  const [delayedOnly, setDelayedOnly] = useState(false);

  // Modals States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // "details", "assign", "priority", "pause", "ready", "delay"
  const [alertedOrders, setAlertedOrders] = useState(new Set()); // Keep track of autotriggered delay alerts

  // Debounce search text (350ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchText);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchText]);

  // Live Timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 10000); // Check timers every 10s
    return () => clearInterval(timer);
  }, []);

  // Fetch active orders data
  const {
    data: orders = [],
    isLoading,
    isRefetching,
    refetch,
    socketConnected
  } = useActiveOrders({
    search: debouncedSearch,
    kitchenStage: selectedStage === "All" ? "" : selectedStage,
    priority: selectedPriority === "All" ? "" : selectedPriority,
    orderType: selectedType === "All" ? "" : selectedType,
    assignedStaff: selectedStaff === "All" ? "" : selectedStaff,
    delayedOnly
  });

  const { data: allStaff = [] } = useActiveKitchenStaff("");
  const updateStageMutation = useUpdateKitchenStage();

  // Autotrigger Delay Modal Check
  useEffect(() => {
    if (orders.length > 0) {
      // Find any order that is delayed but hasn't been alerted in this session yet
      const firstDelayedOrder = orders.find(
        (o) =>
          o.expectedReadyAt &&
          new Date(o.expectedReadyAt) < currentTime &&
          o.status !== "ready" &&
          !alertedOrders.has(o._id) &&
          !o.isPaused
      );

      if (firstDelayedOrder) {
        setAlertedOrders((prev) => new Set([...prev, firstDelayedOrder._id]));
        setSelectedOrder(firstDelayedOrder);
        setActiveModal("delay");
      }
    }
  }, [orders, currentTime, alertedOrders]);

  // Drag and Drop States
  const [dragOverColumn, setDragOverColumn] = useState(null); // 'preparing', 'baking', 'packaging'

  const handleDragStart = (e, orderId) => {
    e.dataTransfer.setData("text/plain", orderId);
  };

  const handleDragOver = (e, column) => {
    e.preventDefault();
    setDragOverColumn(column);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = async (e, targetStage) => {
    e.preventDefault();
    setDragOverColumn(null);
    const orderId = e.dataTransfer.getData("text/plain");
    
    // Find order
    const orderObj = orders.find((o) => o._id === orderId);
    if (!orderObj) return;

    // Check permissions: Kitchen Staff can advance but not Supervise/Manage role constraints if any
    // Typically kitchen staff can move order stages
    if (orderObj.status === targetStage) return;

    try {
      await updateStageMutation.mutateAsync({
        orderId,
        status: targetStage
      });
    } catch (err) {
      // Mutate handles toast
    }
  };

  // Helper: Calculate Remaining/Elapsed Minutes
  const getTimerDetails = (expectedReadyAt) => {
    if (!expectedReadyAt) return { minutes: 0, isDelayed: false, text: "0m" };
    
    const diffMs = new Date(expectedReadyAt) - currentTime;
    const diffMins = Math.round(diffMs / 60000);
    
    if (diffMins < 0) {
      return {
        minutes: Math.abs(diffMins),
        isDelayed: true,
        text: `Delayed by ${Math.abs(diffMins)}m`
      };
    }
    return {
      minutes: diffMins,
      isDelayed: false,
      text: `${diffMins}m left`
    };
  };

  // KPI Calculations
  const activeOrdersCount = orders.filter((o) => o.status !== "ready").length;
  
  // Kitchen Load Formula: (Active Orders / (Total Staff * 2)) * 100
  const totalStaffCount = allStaff.length || 1;
  const kitchenLoad = Math.min(
    100,
    Math.round((activeOrdersCount / (totalStaffCount * 2)) * 100)
  );

  const delayedOrdersCount = orders.filter(
    (o) => o.expectedReadyAt && new Date(o.expectedReadyAt) < currentTime && !o.isPaused
  ).length;

  const averagePrepTimeText = "22 Mins"; // Mock static value or computed

  // Modal Open Handlers
  const openModal = (modalName, order) => {
    setSelectedOrder(order);
    setActiveModal(modalName);
  };

  const closeModal = () => {
    setSelectedOrder(null);
    setActiveModal(null);
  };

  // Format Currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Render Table Columns (For Table Fallback)
  const columns = [
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Order ID</span>,
      dataIndex: "orderNumber",
      key: "orderNumber",
      render: (text, record) => (
        <span
          onClick={() => openModal("details", record)}
          className="font-extrabold text-primary hover:underline cursor-pointer"
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
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Stage</span>,
      dataIndex: "status",
      key: "status",
      render: (status) => {
        let tagColor = "blue";
        if (status === "preparing") tagColor = "processing";
        if (status === "baking") tagColor = "warning";
        if (status === "packaging") tagColor = "purple";
        return (
          <Tag color={tagColor} className="font-bold border-0 px-2 py-0.5 rounded-full capitalize">
            {status}
          </Tag>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Priority</span>,
      dataIndex: "priority",
      key: "priority",
      render: (priority) => {
        let tagColor = "default";
        if (priority === "urgent") tagColor = "volcano";
        if (priority === "vip") tagColor = "gold";
        return (
          <Tag color={tagColor} className="font-bold border-0 px-2 py-0.5 rounded-full capitalize">
            {priority || "normal"}
          </Tag>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Time Left</span>,
      dataIndex: "expectedReadyAt",
      key: "timeLeft",
      render: (expectedReadyAt, record) => {
        if (record.isPaused) {
          return <Tag color="error">Paused</Tag>;
        }
        const timer = getTimerDetails(expectedReadyAt);
        return (
          <span className={`font-black text-xs ${timer.isDelayed ? "text-red-500 animate-pulse" : "text-slate-700 dark:text-zinc-300"}`}>
            {timer.text}
          </span>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Assigned Staff</span>,
      key: "staff",
      render: (_, record) => {
        const staff = record.assignedStaff || {};
        return (
          <div className="text-[10px] text-zinc-400 font-semibold space-y-0.5">
            <p><span className="text-slate-650 dark:text-zinc-300 font-bold">Pizza:</span> {staff.pizza_chef?.name || "Unassigned"}</p>
            <p><span className="text-slate-650 dark:text-zinc-300 font-bold">Bake:</span> {staff.baking_chef?.name || "Unassigned"}</p>
            <p><span className="text-slate-650 dark:text-zinc-300 font-bold">Pack:</span> {staff.packaging_staff?.name || "Unassigned"}</p>
          </div>
        );
      }
    },
    {
      title: <span className="text-xs font-black text-slate-700 dark:text-zinc-300">Actions</span>,
      key: "actions",
      width: 140,
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

          {(role === "store_manager" || role === "kitchen_supervisor") && (
            <>
              <Tooltip title="Assign Staff">
                <Button
                  size="small"
                  onClick={() => openModal("assign", record)}
                  icon={<UserCheck size={12} />}
                  className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
                />
              </Tooltip>
              <Tooltip title="Change Priority">
                <Button
                  size="small"
                  onClick={() => openModal("priority", record)}
                  icon={<ShieldAlert size={12} />}
                  className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
                />
              </Tooltip>
            </>
          )}

          {(role === "store_manager" || role === "kitchen_supervisor" || role === "packaging_staff") && (
            <Tooltip title="Mark Ready">
              <Button
                size="small"
                onClick={() => openModal("ready", record)}
                icon={<CheckCircle2 size={12} />}
                className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-primary/15 active:scale-95 transition-all"
              />
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  // Render Kanban Card Component
  const renderKanbanCard = (orderObj) => {
    const timer = getTimerDetails(orderObj.expectedReadyAt);
    const staff = orderObj.assignedStaff || {};
    const isUrgent = orderObj.priority === "urgent";
    const isVip = orderObj.priority === "vip";

    let priorityBadge = null;
    if (isUrgent) {
      priorityBadge = (
        <Tag color="volcano" className="font-extrabold capitalize px-2 py-0.5 rounded-full border-0 text-[9px] flex items-center gap-0.5">
          <ShieldAlert size={10} /> Urgent
        </Tag>
      );
    } else if (isVip) {
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

    return (
      <div
        key={orderObj._id}
        draggable={!orderObj.isPaused}
        onDragStart={(e) => handleDragStart(e, orderObj._id)}
        className={`bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm hover:shadow-md transition-all space-y-3 cursor-grab active:cursor-grabbing relative overflow-hidden ${
          orderObj.isPaused ? "opacity-60 border-dashed border-red-300 dark:border-red-900" : ""
        } ${timer.isDelayed ? "border-red-400 dark:border-red-950/60" : ""}`}
      >
        {/* Card Pause Overlay Banner */}
        {orderObj.isPaused && (
          <div className="absolute top-0 left-0 right-0 bg-amber-500 text-white text-[9px] font-black py-0.5 px-2 text-center flex items-center justify-center gap-1">
            <Pause size={8} /> PREPARATION PAUSED
          </div>
        )}

        {/* Card Header */}
        <div className="flex items-start justify-between">
          <div>
            <span
              onClick={() => openModal("details", orderObj)}
              className="text-xs font-black text-slate-800 dark:text-zinc-100 hover:text-primary hover:underline cursor-pointer block"
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
        <div className="bg-slate-50 dark:bg-zinc-950 p-2 rounded-xl border border-zinc-150 dark:border-zinc-800/40 text-[10px] space-y-1">
          {orderObj.items?.map((item, idx) => (
            <div key={idx} className="flex justify-between font-semibold text-slate-700 dark:text-zinc-300">
              <span className="truncate pr-2">{item.name}</span>
              <span className="text-primary font-black shrink-0">x{item.quantity}</span>
            </div>
          ))}
          {orderObj.kitchenNote && (
            <div className="border-t border-zinc-200 dark:border-zinc-800 pt-1 mt-1 text-[9px] text-amber-800 dark:text-amber-400 italic">
              Note: {orderObj.kitchenNote}
            </div>
          )}
        </div>

        {/* Card Staff Assignments */}
        <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold border-t border-zinc-100 dark:border-zinc-800/30 pt-2">
          <div className="flex gap-1.5 items-center">
            {/* Chef roles indicators */}
            <Tooltip title={`Pizza Chef: ${staff.pizza_chef?.name || "Not Assigned"}`}>
              <div className={`p-1 rounded-full border ${staff.pizza_chef ? "bg-blue-50 border-blue-200 text-blue-500" : "bg-zinc-50 border-zinc-200 text-zinc-350"}`}>
                <ChefHat size={12} />
              </div>
            </Tooltip>
            <Tooltip title={`Baking Chef: ${staff.baking_chef?.name || "Not Assigned"}`}>
              <div className={`p-1 rounded-full border ${staff.baking_chef ? "bg-amber-50 border-amber-200 text-amber-500" : "bg-zinc-50 border-zinc-200 text-zinc-350"}`}>
                <Flame size={12} />
              </div>
            </Tooltip>
            <Tooltip title={`Packaging Staff: ${staff.packaging_staff?.name || "Not Assigned"}`}>
              <div className={`p-1 rounded-full border ${staff.packaging_staff ? "bg-purple-50 border-purple-200 text-purple-500" : "bg-zinc-50 border-zinc-200 text-zinc-350"}`}>
                <Package size={12} />
              </div>
            </Tooltip>
          </div>

          {/* Card Timer */}
          <div>
            {orderObj.isPaused ? (
              <span className="text-[10px] text-amber-500 font-black">Paused</span>
            ) : (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                timer.isDelayed 
                  ? "bg-red-50 text-red-600 border border-red-200 animate-pulse font-extrabold" 
                  : "bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}>
                {timer.text}
              </span>
            )}
          </div>
        </div>

        {/* Card Responsive Actions */}
        <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800/30 pt-2">
          <Tooltip title="View Details">
            <Button
              size="small"
              onClick={() => openModal("details", orderObj)}
              icon={<Eye size={12} />}
              className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
            />
          </Tooltip>

          {(role === "store_manager" || role === "kitchen_supervisor") && (
            <Tooltip title="Assign Staff">
              <Button
                size="small"
                onClick={() => openModal("assign", orderObj)}
                icon={<UserCheck size={12} />}
                className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
              />
            </Tooltip>
          )}

          {(role === "store_manager" || role === "kitchen_supervisor" || role === "packaging_staff") && 
           (orderObj.status === "packaging" || role === "store_manager" || role === "kitchen_supervisor") && (
            <Tooltip title="Mark Ready">
              <Button
                size="small"
                onClick={() => openModal("ready", orderObj)}
                icon={<CheckCircle2 size={12} />}
                className="!bg-primary hover:!bg-primary-hover border-0 !text-white rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer shadow-md shadow-primary/15 active:scale-95 transition-all"
              />
            </Tooltip>
          )}
        </div>
      </div>
    );
  };

  // Stage Categories for Board
  const columnsData = [
    {
      id: "preparing",
      title: "Preparing Line",
      color: "bg-blue-500",
      textColor: "text-blue-500",
      bgCol: "bg-blue-50/30 dark:bg-blue-950/5",
      borderCol: "border-blue-200 dark:border-blue-950/20",
      icon: <ChefHat size={16} />,
      statuses: ["confirmed", "preparing"]
    },
    {
      id: "baking",
      title: "Baking Oven",
      color: "bg-amber-500",
      textColor: "text-amber-600",
      bgCol: "bg-amber-50/20 dark:bg-amber-950/5",
      borderCol: "border-amber-200 dark:border-amber-950/20",
      icon: <Flame size={16} />,
      statuses: ["baking"]
    },
    {
      id: "packaging",
      title: "Packaging Station",
      color: "bg-purple-500",
      textColor: "text-purple-600",
      bgCol: "bg-purple-50/20 dark:bg-purple-950/5",
      borderCol: "border-purple-200 dark:border-purple-950/20",
      icon: <Package size={16} />,
      statuses: ["packaging"]
    }
  ];

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
      <div className="p-4 space-y-4 min-h-screen bg-slate-50/50 dark:bg-zinc-950 text-slate-900 dark:text-white transition-colors duration-300">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Active Orders
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
              Kitchen board preparation tracking and operations panel
            </p>
          </div>

          {/* Right Header: Toggle Board/Table & Refresh */}
          <div className="flex items-center gap-2">
            <Segmented
              options={[
                { value: "board", icon: <LayoutGrid size={13} className="inline mr-1" /> },
                { value: "table", icon: <TableProperties size={13} className="inline mr-1" /> }
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Stat 1: Live Orders */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "14px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Live Orders</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{activeOrdersCount}</h3>
              </div>
              <div className="p-2.5 bg-blue-50 dark:bg-blue-950/20 text-blue-500 rounded-full border border-blue-100 dark:border-blue-950/30">
                <Pizza size={16} />
              </div>
            </div>
          </Card>

          {/* Stat 2: Load */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "14px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Kitchen Load</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{kitchenLoad}%</h3>
              </div>
              <div className={`p-2.5 rounded-full border ${
                kitchenLoad > 75 
                  ? "bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20" 
                  : "bg-green-50 text-green-500 border-green-100 dark:bg-green-950/20"
              }`}>
                <ChefHat size={16} />
              </div>
            </div>
          </Card>

          {/* Stat 3: Delayed */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "14px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Delayed Orders</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{delayedOrdersCount}</h3>
              </div>
              <div className={`p-2.5 rounded-full border ${
                delayedOrdersCount > 0 
                  ? "bg-red-50 text-red-500 border-red-100 dark:bg-red-950/20 animate-pulse" 
                  : "bg-zinc-50 text-zinc-400 border-zinc-150 dark:bg-zinc-900"
              }`}>
                <AlertTriangle size={16} />
              </div>
            </div>
          </Card>

          {/* Stat 4: Average prep time */}
          <Card className="rounded-2xl border-zinc-200 dark:border-zinc-800/80 shadow-sm" bodyStyle={{ padding: "14px" }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">Avg Prep Time</p>
                <h3 className="text-lg font-black text-slate-900 dark:text-white mt-1">{averagePrepTimeText}</h3>
              </div>
              <div className="p-2.5 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-full border border-purple-100 dark:border-purple-950/30">
                <Clock size={16} />
              </div>
            </div>
          </Card>
        </div>

        {/* Collapsible Filter Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3 shadow-sm">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setFiltersOpen(!filtersOpen)}>
            <div className="flex items-center gap-1.5">
              <Filter size={14} className="text-primary" />
              <span className="text-xs font-black text-slate-800 dark:text-zinc-200">Filter Workspace</span>
              {(searchText || selectedStage !== "All" || selectedPriority !== "All" || selectedType !== "All" || selectedStaff !== "All" || delayedOnly) && (
                <Badge status="processing" className="ml-1" />
              )}
            </div>
            {filtersOpen ? <ChevronUp size={14} className="text-zinc-400" /> : <ChevronDown size={14} className="text-zinc-400" />}
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-800">
              {/* Search */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-450 dark:text-zinc-450 font-bold uppercase">Search Order</span>
                <Input
                  placeholder="ID, Customer, Phone"
                  prefix={<Search size={12} className="text-zinc-400" />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="rounded-xl h-10 text-xs"
                />
              </div>

              {/* Stage Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Kitchen Stage</span>
                <Select
                  value={selectedStage}
                  onChange={(val) => setSelectedStage(val)}
                  className="w-full h-10 rounded-xl"
                >
                  <Select.Option value="All">All Stages</Select.Option>
                  <Select.Option value="preparing">Preparing</Select.Option>
                  <Select.Option value="baking">Baking</Select.Option>
                  <Select.Option value="packaging">Packaging</Select.Option>
                </Select>
              </div>

              {/* Priority Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Priority</span>
                <Select
                  value={selectedPriority}
                  onChange={(val) => setSelectedPriority(val)}
                  className="w-full h-10 rounded-xl"
                >
                  <Select.Option value="All">All Priorities</Select.Option>
                  <Select.Option value="Normal">Normal</Select.Option>
                  <Select.Option value="Urgent">Urgent</Select.Option>
                  <Select.Option value="VIP">VIP</Select.Option>
                </Select>
              </div>

              {/* Staff Select */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Assigned Staff</span>
                <Select
                  value={selectedStaff}
                  onChange={(val) => setSelectedStaff(val)}
                  className="w-full h-10 rounded-xl"
                >
                  <Select.Option value="All">All Staff</Select.Option>
                  {allStaff.map((s) => (
                    <Select.Option key={s._id} value={s._id}>
                      {s.name} ({s.role.replace("_", " ")})
                    </Select.Option>
                  ))}
                </Select>
              </div>

              {/* Delayed Only & Reset */}
              <div className="flex items-center justify-between lg:justify-start gap-4 lg:pt-5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-zinc-455 dark:text-zinc-450 font-bold uppercase">Delayed Only</span>
                  <Switch checked={delayedOnly} onChange={(val) => setDelayedOnly(val)} size="small" />
                </div>
                <Button
                  onClick={() => {
                    setSearchText("");
                    setSelectedStage("All");
                    setSelectedPriority("All");
                    setSelectedType("All");
                    setSelectedStaff("All");
                    setDelayedOnly(false);
                  }}
                  className="text-[10px] font-bold !border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all cursor-pointer rounded-full px-3 py-1 cursor-pointer"
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {columnsData.map((col) => {
              // Filter orders belonging to this column stage
              const columnOrders = orders.filter((o) => col.statuses.includes(o.status));
              const isOver = dragOverColumn === col.id;

              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleDragOver(e, col.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`flex flex-col rounded-2xl border min-h-[450px] p-3 transition-colors ${col.bgCol} ${col.borderCol} ${
                    isOver ? "border-dashed border-primary bg-primary/5 scale-[1.01]" : ""
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-zinc-150 dark:border-zinc-800/40 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-2.5 h-2.5 rounded-full ${col.color}`}></div>
                      <span className="text-xs font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                        {col.icon} {col.title}
                      </span>
                    </div>
                    <Badge
                      count={columnOrders.length}
                      showZero
                      style={{
                        backgroundColor: themePrimary,
                        color: "#fff",
                        fontWeight: "black",
                        fontSize: "10px"
                      }}
                    />
                  </div>

                  {/* Column Cards Container */}
                  <div className="flex-1 space-y-3 overflow-y-auto max-h-[600px] pr-1">
                    {columnOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                        <Pizza size={24} className="text-zinc-400 mb-1" />
                        <span className="text-[10px] font-bold text-zinc-500">Awaiting Orders</span>
                      </div>
                    ) : (
                      columnOrders.map(renderKanbanCard)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table Fallback View */
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
            <Table
              dataSource={orders}
              columns={columns}
              rowKey="_id"
              pagination={{
                pageSize: 10,
                showSizeChanger: false,
                className: "px-4"
              }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<span className="text-xs font-bold text-zinc-400">No active kitchen orders found</span>}
                  />
                )
              }}
              className="active-orders-table"
            />
          </div>
        )}

        {/* Multi Modals */}
        <ActiveOrderDetailsModal
          visible={activeModal === "details"}
          onClose={closeModal}
          order={selectedOrder}
          role={role}
          onPause={(o) => openModal("pause", o)}
          onAssignStaff={(o) => openModal("assign", o)}
          onChangePriority={(o) => openModal("priority", o)}
          onMarkReady={(o) => openModal("ready", o)}
        />

        <AssignStaffModal
          visible={activeModal === "assign"}
          onClose={closeModal}
          order={selectedOrder}
        />

        <ChangePriorityModal
          visible={activeModal === "priority"}
          onClose={closeModal}
          order={selectedOrder}
        />

        <PauseOrderModal
          visible={activeModal === "pause"}
          onClose={closeModal}
          order={selectedOrder}
        />

        <MarkReadyModal
          visible={activeModal === "ready"}
          onClose={closeModal}
          order={selectedOrder}
        />

        <DelayAlertModal
          visible={activeModal === "delay"}
          onClose={closeModal}
          order={selectedOrder}
        />
      </div>
    </ConfigProvider>
  );
}
