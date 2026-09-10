import React, { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Wifi,
  RefreshCw,
  Search,
  LayoutGrid,
  TableProperties,
  Clock,
  Printer,
  ChevronRight,
  Eye,
  Check,
  XCircle,
  Pizza,
  Filter,
  AlertCircle
} from "lucide-react";
import { Input, Button, Select, Badge, Table, Skeleton, Card, Tag, Tooltip, Empty, Segmented, ConfigProvider } from "antd";

// Hooks & Modals
import { useIncomingOrders, useAcceptOrder, useRejectOrder } from "./hooks/useIncomingOrders";
import ViewDetailsModal from "./components/ViewDetailsModal";
import AcceptOrderModal from "./components/AcceptOrderModal";
import RejectOrderModal from "./components/RejectOrderModal";
import PrintReceiptModal from "./components/PrintReceiptModal";

export default function IncomingOrders() {
  const { role } = useOutletContext();

  const [themePrimary, setThemePrimary] = useState(localStorage.getItem("sa_primary") || "#a43c12");
  const [themeSecondary, setThemeSecondary] = useState(localStorage.getItem("sa_secondary") || "#ff7f50");

  // Dynamic color synchronization from SuperAdmin theme settings
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
    document.documentElement.style.setProperty("--secondary", secondaryColor);
    document.documentElement.style.setProperty("--secondary-hover", `${secondaryColor}cc`);
  }, []);

  // View state
  const [viewType, setViewType] = useState("Card"); // "Card" or "Table"

  // Search input and debounced search
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debouncing effect for search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 350);

    return () => {
      clearTimeout(handler);
    };
  }, [searchInput]);

  // Filters State
  const [filters, setFilters] = useState({
    search: "",
    dateRange: "All",
    priority: "All",
    scheduled: "All",
    paymentMethod: "All",
    orderSource: "All",
    orderType: "All"
  });

  // Active filters applied to hook
  const [appliedFilters, setAppliedFilters] = useState(filters);

  // Sync debounced search to filters object
  useEffect(() => {
    setAppliedFilters((prev) => ({ ...prev, search: debouncedSearch }));
  }, [debouncedSearch]);

  // Fetch Orders hook
  const { data = [], isLoading, isFetching, refetch, socketConnected } = useIncomingOrders(appliedFilters);
  const orders = Array.isArray(data) ? data : [];

  // Mutation hooks
  const acceptOrderMutation = useAcceptOrder();
  const rejectOrderMutation = useRejectOrder();

  // Active Modal States
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // 'view', 'accept', 'reject', 'print'

  // Time calculations since order creation (forces component rerender to keep minutes ticking)
  const [ticker, setTicker] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setTicker((t) => t + 1), 60000);
    return () => clearInterval(timer);
  }, []);

  const getTimeAgo = (dateStr) => {
    const minutes = Math.floor((new Date() - new Date(dateStr)) / 60000);
    if (minutes < 1) return "Just now";
    if (minutes === 1) return "1 min ago";
    return `${minutes} mins ago`;
  };

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters, search: debouncedSearch });
  };

  const handleResetFilters = () => {
    const cleared = {
      search: "",
      dateRange: "All",
      priority: "All",
      scheduled: "All",
      paymentMethod: "All",
      orderSource: "All",
      orderType: "All"
    };
    setSearchInput("");
    setFilters(cleared);
    setAppliedFilters(cleared);
  };

  // Trigger Action handlers
  const handleOpenAccept = (order) => {
    setSelectedOrder(order);
    setActiveModal("accept");
  };

  const handleOpenReject = (order) => {
    setSelectedOrder(order);
    setActiveModal("reject");
  };

  const handleOpenView = (order) => {
    setSelectedOrder(order);
    setActiveModal("view");
  };

  const handleOpenPrint = (order) => {
    setSelectedOrder(order);
    setActiveModal("print");
  };

  // Mutation confirm wrappers
  const handleAcceptConfirm = (payload) => {
    acceptOrderMutation.mutate(
      { orderId: selectedOrder._id, payload },
      {
        onSuccess: () => {
          setActiveModal(null);
          setSelectedOrder(null);
        }
      }
    );
  };

  const handleRejectConfirm = (payload) => {
    rejectOrderMutation.mutate(
      { orderId: selectedOrder._id, payload },
      {
        onSuccess: () => {
          setActiveModal(null);
          setSelectedOrder(null);
        }
      }
    );
  };

  // Role verification helper flags
  const isManager = role === "store_manager";
  const isSupervisor = role === "kitchen_supervisor";

  // Table Column Definitions
  const tableColumns = [
    {
      title: "Order ID",
      dataIndex: "orderNumber",
      key: "orderNumber",
      fixed: "left",
      width: 100,
      render: (num, record) => (
        <span
          onClick={() => handleOpenView(record)}
          className="font-mono font-black text-[var(--primary)] hover:underline cursor-pointer"
        >
          #{num}
        </span>
      )
    },
    {
      title: "Customer",
      key: "customerName",
      width: 140,
      render: (_, record) => (
        <div>
          <p className="font-extrabold text-slate-800 dark:text-zinc-200">{record.customer?.name}</p>
          <span className="text-[10px] text-zinc-400 font-semibold uppercase">{record.orderSource}</span>
        </div>
      )
    },
    {
      title: "Phone",
      dataIndex: ["customer", "phone"],
      key: "phone",
      width: 120
    },
    {
      title: "Type",
      dataIndex: "orderType",
      key: "orderType",
      width: 90,
      render: (type) => (
        <Tag color={type === "delivery" ? "purple" : "blue"} className="font-bold border-0 px-2 py-0.5 rounded-full capitalize">
          {type}
        </Tag>
      )
    },
    {
      title: "Items Count",
      key: "itemsCount",
      width: 100,
      render: (_, record) => {
        const qty = record.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        return <span className="font-bold">{qty} items</span>;
      }
    },
    {
      title: "Order Value",
      dataIndex: "grandTotal",
      key: "grandTotal",
      width: 100,
      render: (val) => <span className="font-black text-slate-850 dark:text-zinc-150">₹{val}</span>
    },
    {
      title: "Priority",
      dataIndex: "priority",
      key: "priority",
      width: 100,
      render: (priority) => {
        const isUrgent = priority?.toLowerCase() === "urgent";
        return (
          <Tag color={isUrgent ? "volcano" : "blue"} className="font-bold border-0 rounded-full capitalize">
            {priority || "Normal"}
          </Tag>
        );
      }
    },
    {
      title: "Payment Status",
      key: "paymentStatus",
      width: 120,
      render: (_, record) => (
        <Tag color={record.paymentStatus === "paid" ? "green" : "red"} className="font-bold border-0 rounded-full">
          {record.paymentStatus === "paid" ? "Paid" : "Pending"}
        </Tag>
      )
    },
    {
      title: "Received Time",
      dataIndex: "createdAt",
      key: "createdAt",
      width: 120,
      render: (date) => (
        <span className="font-bold text-slate-500 flex items-center gap-1">
          <Clock size={11} />
          {getTimeAgo(date)}
        </span>
      )
    },
    {
      title: "Actions",
      key: "actions",
      fixed: "right",
      width: 140,
      render: (_, record) => (
        <div className="flex items-center gap-1.5">
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<Eye size={14} className="text-zinc-500" />}
              onClick={() => handleOpenView(record)}
              className="hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
            />
          </Tooltip>
          
          {(isManager || isSupervisor) && (
            <Tooltip title="Quick Print">
              <Button
                type="text"
                icon={<Printer size={14} className="text-zinc-500" />}
                onClick={() => handleOpenPrint(record)}
                className="hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
              />
            </Tooltip>
          )}

          {(isManager || isSupervisor) && (
            <Tooltip title="Accept Order">
              <Button
                type="primary"
                size="small"
                icon={<Check size={12} />}
                onClick={() => handleOpenAccept(record)}
                className="!bg-primary hover:!bg-primary-hover border-0 text-white rounded-full flex items-center justify-center w-7 h-7 p-0 active:scale-95 transition-all cursor-pointer shadow-md shadow-primary/10"
              />
            </Tooltip>
          )}

          {isManager && (
            <Tooltip title="Reject Order">
              <Button
                danger
                size="small"
                icon={<XCircle size={12} />}
                onClick={() => handleOpenReject(record)}
                className="hover:bg-rose-50 text-rose-600 border border-rose-150 rounded-full flex items-center justify-center w-7 h-7 p-0 active:scale-95 transition-all cursor-pointer dark:bg-card dark:border-border"
              />
            </Tooltip>
          )}
        </div>
      )
    }
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: themePrimary,
          colorLink: themePrimary,
          colorLinkHover: `${themePrimary}cc`,
        },
      }}
    >
      <div className="superadmin-theme p-4 md:p-6 space-y-4 max-w-full bg-background text-foreground transition-colors duration-300">
        {/* 1. Header Area */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-card p-4 rounded-2xl border border-border shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-foreground">
                Incoming Orders
              </h1>
              <Badge
                count={orders.length}
                style={{ backgroundColor: "var(--primary)" }}
                className="live-orders-badge scale-95"
              />
            </div>
            <p className="text-muted-foreground text-xs font-medium mt-0.5">
              New orders awaiting store confirmation
            </p>
          </div>

          {/* Live sync buttons & states */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Socket connectivity status */}
            <span
              className={`inline-flex items-center gap-1.5 text-[9px] font-black px-2.5 py-1 rounded-full border ${
                socketConnected
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-250 dark:border-emerald-900/30"
                  : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border-amber-250 dark:border-amber-900/30"
              }`}
            >
              <Wifi size={10} className={socketConnected ? "animate-pulse" : ""} />
              {socketConnected ? "Socket Connected" : "Standalone Feed"}
            </span>

            <Button
              onClick={() => refetch()}
              loading={isFetching}
              icon={<RefreshCw size={12} className={isFetching ? "animate-spin" : ""} />}
              className="text-[10px] font-bold bg-card border border-border rounded-xl px-3.5 py-1.5 text-foreground hover:bg-muted active:scale-95 transition-all cursor-pointer"
            >
              Refresh
            </Button>

            {/* Toggle View Cards / Table */}
            <div className="bg-muted p-0.5 rounded-full border border-border flex items-center">
              <Button
                type={viewType === "Card" ? "primary" : "text"}
                size="small"
                icon={<LayoutGrid size={13} />}
                onClick={() => setViewType("Card")}
                className={`rounded-full px-3.5 py-1.5 text-xs font-bold border-0 active:scale-95 transition-all cursor-pointer ${
                  viewType === "Card"
                    ? "!bg-primary hover:!bg-primary-hover text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
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
                  viewType === "Table"
                    ? "!bg-primary hover:!bg-primary-hover text-white shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Table View
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Filters Section */}
        <div className="bg-card p-4 rounded-2xl border border-border shadow-sm space-y-4">
          {/* Row 1: Search & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-zinc-400" size={14} />
              <Input
                placeholder="Search Order ID, name, phone..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 pr-3 py-1.5 rounded-xl border-border bg-muted text-xs font-medium focus:border-primary"
              />
            </div>

            <div>
              <Select
                value={filters.dateRange}
                onChange={(val) => setFilters({ ...filters, dateRange: val })}
                className="w-full custom-select"
                placeholder="Filter Date"
              >
                <Select.Option value="All">All Dates</Select.Option>
                <Select.Option value="Today">Today</Select.Option>
                <Select.Option value="Yesterday">Yesterday</Select.Option>
              </Select>
            </div>

            <div>
              <Select
                value={filters.priority}
                onChange={(val) => setFilters({ ...filters, priority: val })}
                className="w-full custom-select"
                placeholder="Filter Priority"
              >
                <Select.Option value="All">All Priorities</Select.Option>
                <Select.Option value="Normal">Normal Priority</Select.Option>
                <Select.Option value="Urgent">Urgent Priority</Select.Option>
              </Select>
            </div>

            <div>
              <Select
                value={filters.scheduled}
                onChange={(val) => setFilters({ ...filters, scheduled: val })}
                className="w-full custom-select"
                placeholder="Scheduled Orders"
              >
                <Select.Option value="All">All Delivery Modes</Select.Option>
                <Select.Option value="Immediate">Immediate Orders</Select.Option>
                <Select.Option value="Scheduled">Scheduled Orders</Select.Option>
              </Select>
            </div>
          </div>

          {/* Row 2: Payment, Source, Type */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Select
                value={filters.paymentMethod}
                onChange={(val) => setFilters({ ...filters, paymentMethod: val })}
                className="w-full custom-select"
                placeholder="Payment Method"
              >
                <Select.Option value="All">All Payment Types</Select.Option>
                <Select.Option value="Online">Online Payments</Select.Option>
                <Select.Option value="COD">Cash on Delivery (COD)</Select.Option>
              </Select>
            </div>

            <div>
              <Select
                value={filters.orderSource}
                onChange={(val) => setFilters({ ...filters, orderSource: val })}
                className="w-full custom-select"
                placeholder="Order Source"
              >
                <Select.Option value="All">All Sources</Select.Option>
                <Select.Option value="Website">Website</Select.Option>
                <Select.Option value="Android">Android App</Select.Option>
                <Select.Option value="iOS">iOS App</Select.Option>
                <Select.Option value="POS">POS Terminal</Select.Option>
                <Select.Option value="Swiggy">Swiggy Integration</Select.Option>
                <Select.Option value="Zomato">Zomato Integration</Select.Option>
              </Select>
            </div>

            <div>
              <Select
                value={filters.orderType}
                onChange={(val) => setFilters({ ...filters, orderType: val })}
                className="w-full custom-select"
                placeholder="Order Type"
              >
                <Select.Option value="All">All Types</Select.Option>
                <Select.Option value="delivery">Delivery</Select.Option>
                <Select.Option value="pickup">Pickup</Select.Option>
              </Select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end items-center gap-2 pt-1">
            <Button
              onClick={handleResetFilters}
              className="text-xs font-bold border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-200 rounded-full px-4 py-2 shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
            >
              Reset Filters
            </Button>
            <Button
              type="primary"
              onClick={handleApplyFilters}
              className="text-xs font-bold !bg-primary hover:!bg-primary-hover border-0 text-white rounded-full px-4 py-2 flex items-center gap-1 shadow-md shadow-primary/15 active:scale-95 transition-all cursor-pointer"
            >
              <Filter size={12} />
              Apply Filters
            </Button>
          </div>
        </div>

        {/* 3. Orders Grid/Table Display */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((n) => (
              <Card key={n} className="rounded-2xl border-border bg-card">
                <Skeleton active paragraph={{ rows: 4 }} />
              </Card>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-card border border-border p-12 rounded-3xl text-center flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-16 h-16 bg-muted text-zinc-400 rounded-2xl flex items-center justify-center mb-4">
              <Pizza size={32} />
            </div>
            <h3 className="font-extrabold text-sm text-foreground">No Incoming Orders</h3>
            <p className="text-muted-foreground text-xs mt-1 max-w-sm">
              All orders confirmed! New orders submitted via customer application will dynamically load in real-time.
            </p>
          </div>
        ) : viewType === "Card" ? (
          // Grid View of Cards
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <Card
                key={order._id}
                className="incoming-order-card rounded-2xl border-border hover:border-primary hover:shadow-lg transition-all duration-300 bg-card text-xs"
                bodyStyle={{ padding: "16px" }}
              >
                {/* Card Header */}
                <div className="flex justify-between items-start pb-3 border-b border-border">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        onClick={() => handleOpenView(order)}
                        className="font-mono font-black text-foreground text-[13px] hover:underline cursor-pointer"
                      >
                        #{order.orderNumber}
                      </span>
                      <Tag color="cyan" className="font-bold border-0 px-1.5 py-0 rounded-full text-[9px]">
                        {order.orderSource || "Web"}
                      </Tag>
                    </div>
                    {order.priority?.toLowerCase() === "urgent" && (
                      <Tag color="volcano" className="font-extrabold border-0 px-1.5 py-0 rounded-full text-[9px]">
                        URGENT
                      </Tag>
                    )}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-0.5 mt-0.5">
                    <Clock size={10} />
                    {getTimeAgo(order.createdAt)}
                  </span>
                </div>

                {/* Customer Section */}
                <div className="py-3 space-y-2">
                  <div className="flex justify-between">
                    <div>
                      <p className="font-extrabold text-foreground leading-snug">{order.customer?.name}</p>
                      <p className="text-[10px] text-zinc-400 font-semibold">{order.customer?.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-[13px] text-primary">₹{order.grandTotal}</p>
                      <span className="text-[9px] text-zinc-400 font-bold">{order.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex gap-1.5">
                    <Tag color={order.orderType === "delivery" ? "purple" : "blue"} className="font-bold border-0 px-2 rounded-full text-[9px] capitalize">
                      {order.orderType}
                    </Tag>
                    <Tag color={order.paymentStatus === "paid" ? "green" : "red"} className="font-bold border-0 px-2 rounded-full text-[9px]">
                      {order.paymentStatus === "paid" ? "Paid" : "Pending"}
                    </Tag>
                  </div>
                </div>

                {/* Items Preview */}
                <div className="bg-muted p-2.5 rounded-xl mb-3.5 space-y-1">
                  {order.items?.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex justify-between text-zinc-500 font-bold text-[10px]">
                      <span className="truncate pr-4">{item.quantity} x {item.name}</span>
                      <span className="shrink-0">{item.size}</span>
                    </div>
                  ))}
                  {order.items?.length > 3 && (
                    <p className="text-[9px] text-primary font-black pt-1">
                      +{order.items.length - 3} More Items
                    </p>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-border">
                  <div className="flex items-center gap-1.5">
                    {(isManager || isSupervisor) && (
                      <Tooltip title="Quick Print Receipt">
                        <Button
                          shape="circle"
                          icon={<Printer size={12} />}
                          onClick={() => handleOpenPrint(order)}
                          className="bg-muted hover:bg-muted text-muted-foreground hover:text-foreground border-0 flex items-center justify-center w-7 h-7 p-0 shrink-0 cursor-pointer"
                        />
                      </Tooltip>
                    )}
                    <Tooltip title="View Details">
                      <Button
                        onClick={() => handleOpenView(order)}
                        icon={<Eye size={12} />}
                        className="!border-primary/45 !text-primary bg-white dark:bg-zinc-900 hover:!bg-primary/5 hover:!border-primary hover:!text-primary-hover active:scale-95 transition-all rounded-full flex items-center justify-center w-7 h-7 p-0 cursor-pointer"
                      />
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {isManager && (
                      <Tooltip title="Reject Order">
                        <Button
                          danger
                          onClick={() => handleOpenReject(order)}
                          icon={<XCircle size={12} />}
                          className="hover:bg-rose-50 text-rose-600 border border-rose-150 rounded-full flex items-center justify-center w-7 h-7 p-0 dark:bg-card dark:border-border active:scale-95 transition-all cursor-pointer"
                        />
                      </Tooltip>
                    )}
                    {(isManager || isSupervisor) && (
                      <Tooltip title="Accept Order">
                        <Button
                          type="primary"
                          onClick={() => handleOpenAccept(order)}
                          icon={<Check size={12} />}
                          className="!bg-primary hover:!bg-primary-hover border-0 text-white rounded-full flex items-center justify-center w-7 h-7 p-0 shadow-md shadow-primary/15 active:scale-95 transition-all cursor-pointer"
                        />
                      </Tooltip>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          // Table View of orders
          <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
            <Table
              columns={tableColumns}
              dataSource={orders}
              rowKey="_id"
              scroll={{ x: 1000 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                size: "small",
                className: "pr-4"
              }}
              className="custom-orders-table text-xs"
            />
          </div>
        )}

        {/* 4. Modals */}
        {selectedOrder && activeModal === "view" && (
          <ViewDetailsModal
            visible={true}
            onClose={() => {
              setActiveModal(null);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            role={role}
            onAccept={handleOpenAccept}
            onReject={handleOpenReject}
            onPrint={handleOpenPrint}
          />
        )}

        {selectedOrder && activeModal === "accept" && (
          <AcceptOrderModal
            visible={true}
            onClose={() => {
              setActiveModal(null);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            onConfirm={handleAcceptConfirm}
            loading={acceptOrderMutation.isPending}
          />
        )}

        {selectedOrder && activeModal === "reject" && (
          <RejectOrderModal
            visible={true}
            onClose={() => {
              setActiveModal(null);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            onConfirm={handleRejectConfirm}
            loading={rejectOrderMutation.isPending}
          />
        )}

        {selectedOrder && activeModal === "print" && (
          <PrintReceiptModal
            visible={true}
            onClose={() => {
              setActiveModal(null);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
          />
        )}
      </div>
    </ConfigProvider>
  );
}
