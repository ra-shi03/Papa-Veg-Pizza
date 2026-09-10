import React, { useState, useEffect } from "react";
import {
  Card, Statistic, Table, DatePicker, Select, Tabs, Modal, Drawer,
  Progress, Tag, Tooltip, Dropdown, Pagination, Skeleton, Empty, Result, ConfigProvider
} from "antd";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell
} from "recharts";
import {
  ShoppingBag, DollarSign, Percent, TrendingUp,
  ArrowUpRight, AlertTriangle, RefreshCw, Calendar,
  Download, Search, Eye, ArrowUp, ArrowDown, FileText, PieChart as PieIcon
} from "lucide-react";
import { useFranchiseRevenue } from "./hooks/useFranchiseRevenue";
import { mockStores } from "./mockData";
import RevenueDetailsModal from "./components/RevenueDetailsModal";
import ExportRevenueModal from "./components/ExportRevenueModal";
import dayjs from "dayjs";
import { toast } from "sonner";

export default function FranchiseRevenue() {
  const revenueHook = useFranchiseRevenue();
  const {
    loading,
    search,
    setSearch,
    dateFilter,
    setDateFilter,
    customRange,
    setCustomRange,
    storeId,
    setStoreId,
    orderType,
    setOrderType,
    paymentMethod,
    setPaymentMethod,
    status,
    setStatus,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,
    totalRecords,
    kpis,
    dailyTrendsChartData,
    distributionChartData,
    tableData,
    recordDetails,
    loadingDetails,
    fetchRevenueDetails,
    selectedRecordId,
    setSelectedRecordId,
    exportRevenueReport,
    refetch
  } = revenueHook;

  // Local search for debouncing
  const [localSearch, setLocalSearch] = useState(search);

  // Modals Visibility
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [isError, setIsError] = useState(false); // simulated error state trigger

  // Debouncing Search Input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch, setCurrentPage]);

  // Format currency helper
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Single Row Export Handler
  const handleExportRow = (record, format) => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          resolve();
        }, 1000);
      }),
      {
        loading: `Exporting record for ${record.date} as ${format}...`,
        success: `Record for ${record.date} downloaded successfully.`,
        error: "Export failed."
      }
    );
  };

  // Table Columns Setup
  const columns = [
    {
      title: "Date",
      dataIndex: "date",
      key: "date",
      sorter: true,
      className: "font-bold text-zinc-650"
    },
    {
      title: "Orders",
      dataIndex: "totalOrders",
      key: "totalOrders",
      sorter: true,
      align: "center"
    },
    {
      title: "Gross Revenue",
      dataIndex: "grossRevenue",
      key: "grossRevenue",
      sorter: true,
      render: val => <span className="font-semibold text-emerald-600">{formatCurrency(val)}</span>
    },
    {
      title: "Discounts",
      dataIndex: "discountAmount",
      key: "discountAmount",
      render: val => <span className="font-medium text-amber-600">-{formatCurrency(val)}</span>
    },
    {
      title: "Refunds",
      dataIndex: "refundAmount",
      key: "refundAmount",
      render: val => <span className="font-medium text-rose-600">-{formatCurrency(val)}</span>
    },
    {
      title: "Delivery Charges",
      dataIndex: "deliveryCharges",
      key: "deliveryCharges",
      render: val => <span className="text-zinc-500">{formatCurrency(val)}</span>
    },
    {
      title: "Tax",
      dataIndex: "taxCollected",
      key: "taxCollected",
      render: val => <span className="text-zinc-500">{formatCurrency(val)}</span>
    },
    {
      title: "Net Revenue",
      dataIndex: "netRevenue",
      key: "netRevenue",
      sorter: true,
      render: val => <span className="font-extrabold text-blue-600">{formatCurrency(val)}</span>
    },
    {
      title: "Profit",
      dataIndex: "totalProfit",
      key: "totalProfit",
      sorter: true,
      render: val => <span className="font-extrabold text-emerald-700">{formatCurrency(val)}</span>
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => {
        const items = [
          {
            key: "csv",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Download size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Download CSV</span>
              </span>
            ),
            onClick: () => handleExportRow(record, "CSV")
          },
          {
            key: "excel",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Download size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Download Excel</span>
              </span>
            ),
            onClick: () => handleExportRow(record, "Excel")
          },
          {
            key: "pdf",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Download size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Download PDF</span>
              </span>
            ),
            onClick: () => handleExportRow(record, "PDF")
          }
        ];

        return (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => {
                fetchRevenueDetails(record._id);
                setShowDetailsModal(true);
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-[9.5px] font-black uppercase rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.97]"
            >
              <Eye size={12} />
              <span>Details</span>
            </button>
            <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
              <button className="flex items-center gap-1 px-3 py-1.5 text-[9.5px] font-black uppercase rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-650 dark:text-zinc-300 transition-all duration-200 cursor-pointer shadow-xs active:scale-[0.97]">
                <Download size={12} />
                <span>Export</span>
              </button>
            </Dropdown>
          </div>
        );
      }
    }
  ];

  // Handle Sort Change
  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
      setCurrentPage(1);
    }
  };

  // Simulated Reset Filters Action
  const handleResetFilters = () => {
    setLocalSearch("");
    setSearch("");
    setDateFilter("Last 30 Days");
    setCustomRange({ start: null, end: null });
    setStoreId("All");
    setOrderType("All");
    setPaymentMethod("All");
    setStatus("All");
    setCurrentPage(1);
  };

  // Dynamic Header/Theme Colors applied
  const themePrimary = "var(--primary)";

  if (isError) {
    return (
      <ConfigProvider theme={{ token: { fontFamily: "'Poppins', system-ui, sans-serif" } }}>
        <div className="p-8 min-h-[80vh] flex items-center justify-center">
          <style>{`
            .ant-result, .ant-result-title, .ant-result-subtitle {
              font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
            }
          `}</style>
          <Result
            status="warning"
            title="Unable to load revenue data."
            subTitle="A gateway timeout occurred while retrieving the franchise financial logs. Please check your internet connection and try again."
            extra={[
              <button
                key="retry"
                onClick={() => {
                  setIsError(false);
                  refetch();
                }}
                className="px-4 py-2 bg-[var(--primary)] hover:opacity-95 text-white font-bold uppercase transition-all rounded-lg cursor-pointer text-xs"
              >
                Retry Connection
              </button>
            ]}
          />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={{ token: { fontFamily: "'Poppins', system-ui, sans-serif" } }}>
      <div className="p-3 md:p-5 max-w-7xl mx-auto space-y-4 text-xs bg-slate-50 dark:bg-zinc-950 min-h-screen text-zinc-700 dark:text-zinc-300 font-['Poppins']">
        <style>{`
          .ant-select, .ant-select-item, .ant-picker, .ant-picker-input > input, .ant-table, .ant-table-cell, .ant-tabs, .ant-tabs-tab-btn, .ant-modal, .ant-modal-title, .ant-drawer, .ant-pagination, .ant-pagination-item, .ant-tag, .ant-empty {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
        `}</style>

        {/* 1. Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Franchise Revenue Desk
              </h1>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20 uppercase tracking-widest animate-pulse">
                Live Feed
              </span>
            </div>
            <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-semibold">
              Monitor overall earnings, profitability, and revenue performance across all franchises.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] hover:opacity-95 text-white rounded-lg shadow-md font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8"
            >
              <Download size={14} />
              <span>Export Revenue</span>
            </button>

            <button
              onClick={() => refetch()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 rounded-lg shadow-sm font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8"
            >
              <RefreshCw size={12} className={loading ? "animate-spin text-[var(--primary)]" : "text-[var(--primary)]"} />
              <span>Refresh</span>
            </button>

            {/* Test Error state switch (developer tool toggle) */}
            <button
              className="text-[9px] font-bold text-zinc-400 hover:text-rose-500 cursor-pointer"
              onClick={() => setIsError(true)}
            >
              Simulate Err
            </button>
          </div>
        </header>



        {/* 2. KPI Cards Bento Grid */}
        <section className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="shadow-xs border rounded-lg" bodyStyle={{ padding: "12px" }}>
                <Skeleton active paragraph={{ rows: 1 }} title={{ width: 60 }} />
              </Card>
            ))
          ) : (
            <>
              {/* Gross Revenue */}
              <Card className="shadow-xs border border-l-4 border-l-emerald-500 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer" bodyStyle={{ padding: "12px" }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Gross Revenue</span>
                  <span className="text-sm font-black text-emerald-600 mt-1">{formatCurrency(kpis.grossRevenue)}</span>
                  <span className="text-[8px] font-bold text-emerald-500 flex items-center gap-0.5 mt-0.5">
                    <ArrowUp size={10} className="inline mr-0.5" /> +12% this month
                  </span>
                </div>
              </Card>

              {/* Net Revenue */}
              <Card className="shadow-xs border border-l-4 border-l-blue-500 bg-blue-50/20 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer" bodyStyle={{ padding: "12px" }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Net Revenue</span>
                  <span className="text-sm font-black text-blue-600 mt-1">{formatCurrency(kpis.netRevenue)}</span>
                  <span className="text-[8px] text-zinc-400 mt-1.5 font-semibold">Post deductions</span>
                </div>
              </Card>

              {/* Total Orders */}
              <Card className="shadow-xs border border-l-4 border-l-indigo-400 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer" bodyStyle={{ padding: "12px" }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Orders</span>
                  <span className="text-sm font-black text-indigo-700 mt-1">{kpis.totalOrders} Orders</span>
                  <span className="text-[8px] text-zinc-400 mt-1.5 font-semibold">Base sales volume</span>
                </div>
              </Card>

              {/* Average Order Value */}
              <Card className="shadow-xs border border-l-4 border-l-cyan-400 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer" bodyStyle={{ padding: "12px" }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Avg Order Value</span>
                  <span className="text-sm font-black text-cyan-700 mt-1">{formatCurrency(kpis.averageOrderValue)}</span>
                  <span className="text-[8px] text-zinc-400 mt-1.5 font-semibold">Gross / Order</span>
                </div>
              </Card>

              {/* Profit Margin % */}
              <Card className="shadow-xs border border-l-4 border-l-purple-500 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer" bodyStyle={{ padding: "12px" }}>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider truncate">Profit Margin</span>
                    <span className="text-sm font-black text-purple-700 mt-1">{kpis.profitMargin}%</span>
                    <span className="text-[8px] text-zinc-400 mt-1 truncate">Total Profit/Net</span>
                  </div>
                  <Progress type="circle" percent={kpis.profitMargin} width={26} strokeWidth={12} strokeColor="purple" showInfo={false} className="shrink-0" />
                </div>
              </Card>

              {/* Today's Revenue */}
              <Card className="shadow-xs border border-l-4 border-l-teal-500 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer" bodyStyle={{ padding: "12px" }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Today's Revenue</span>
                  <span className="text-sm font-black text-teal-600 mt-1">{formatCurrency(kpis.todayRevenue)}</span>
                  <span className="text-[8px] text-zinc-400 mt-1.5 font-semibold">Today's net earnings</span>
                </div>
              </Card>

              {/* Monthly Revenue */}
              <Card className="shadow-xs border border-l-4 border-l-orange-500 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer" bodyStyle={{ padding: "12px" }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Monthly Revenue</span>
                  <span className="text-sm font-black text-orange-600 mt-1">{formatCurrency(kpis.monthlyRevenue)}</span>
                  <span className="text-[8px] text-zinc-400 mt-1.5 font-semibold">Current month net</span>
                </div>
              </Card>

              {/* Yearly Revenue */}
              <Card className="shadow-xs border border-l-4 border-l-pink-500 rounded-lg hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer" bodyStyle={{ padding: "12px" }}>
                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Yearly Revenue</span>
                  <span className="text-sm font-black text-pink-600 mt-1">{formatCurrency(kpis.yearlyRevenue)}</span>
                  <span className="text-[8px] text-zinc-400 mt-1.5 font-semibold">Current year net</span>
                </div>
              </Card>
            </>
          )}
        </section>

        {/* 4. Charts Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {loading ? (
            <>
              <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
              <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
            </>
          ) : (
            <>
              {/* Daily Revenue Trend Chart */}
              <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-[var(--primary)]" />
                      Daily Revenue & Order Trends
                    </h3>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">Rupee sales index & Volume analytics</span>
                  </div>
                </div>

                <div className="h-[220px] w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={dailyTrendsChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="formattedDate" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", fontSize: "10px" }}
                        formatter={(value, name) => [name === "orders" ? value : formatCurrency(value), name === "orders" ? "Orders" : "Gross Revenue"]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "9px" }} />
                      <Line yAxisId="left" type="monotone" dataKey="revenue" name="revenue" stroke="var(--primary)" strokeWidth={2.2} activeDot={{ r: 6 }} />
                      <Line yAxisId="right" type="monotone" dataKey="orders" name="orders" stroke="#3b82f6" strokeWidth={1.8} strokeDasharray="3 3" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Revenue Distribution Chart */}
              <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1.5">
                      <PieIcon size={14} className="text-[var(--primary)]" />
                      Revenue Distribution Index
                    </h3>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">Share of food, courier fees, discounts & refunds</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-3 items-center">
                  <div className="col-span-2 h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={distributionChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={75}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {distributionChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={v => [formatCurrency(v), "Revenue"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="col-span-3 space-y-2">
                    {distributionChartData.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-1.5 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/40">
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-650">
                          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span>{item.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-zinc-800 dark:text-zinc-150">{formatCurrency(item.value)}</span>
                          <span className="text-[8px] font-bold text-zinc-400 block">{item.pct}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </>
          )}
        </section>

        {/* 4. Global Filters Card */}
        <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
            {/* Debounced Search */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Search Database</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search Date, Store..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold h-[34px]"
                />
              </div>
            </div>

            {/* Store Selector */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Store Outlet</span>
              <Select value={storeId} onChange={val => setStoreId(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Store Outlets</Select.Option>
                {mockStores.map(s => (
                  <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                ))}
              </Select>
            </div>

            {/* Order Type */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Order Channel</span>
              <Select value={orderType} onChange={val => setOrderType(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Channels</Select.Option>
                <Select.Option value="Delivery">Delivery Orders</Select.Option>
                <Select.Option value="Pickup">Pickup Orders</Select.Option>
                <Select.Option value="Dine-In">Dine-In Orders</Select.Option>
              </Select>
            </div>

            {/* Payment Method */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Payment Mode</span>
              <Select value={paymentMethod} onChange={val => setPaymentMethod(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Payment Modes</Select.Option>
                <Select.Option value="Cash">Cash On Delivery</Select.Option>
                <Select.Option value="UPI">UPI (Paytm/GPay)</Select.Option>
                <Select.Option value="Card">Credit/Debit Card</Select.Option>
                <Select.Option value="Wallet">Store Wallet</Select.Option>
              </Select>
            </div>

            {/* Status Dropdown */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Order Status</span>
              <Select value={status} onChange={val => setStatus(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Statuses</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
                <Select.Option value="Refunded">Refunded</Select.Option>
                <Select.Option value="Cancelled">Cancelled</Select.Option>
              </Select>
            </div>

            {/* Date Presets Dropdown */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Date Interval</span>
              <Select value={dateFilter} onChange={val => setDateFilter(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="Today">Today</Select.Option>
                <Select.Option value="Last 7 Days">Last 7 Days</Select.Option>
                <Select.Option value="Last 30 Days">Last 30 Days</Select.Option>
                <Select.Option value="This Month">This Month</Select.Option>
                <Select.Option value="Custom">Custom Date Range</Select.Option>
              </Select>
            </div>
          </div>

          {/* Custom Datepicker row */}
          {dateFilter === "Custom" && (
            <div className="mt-3 flex items-center gap-2 border-t pt-3 animate-fade-down">
              <span className="font-bold text-zinc-500 text-[10px] uppercase">Select Custom Range:</span>
              <DatePicker
                placeholder="Start Date"
                value={customRange.start ? dayjs(customRange.start) : null}
                onChange={date => setCustomRange(prev => ({ ...prev, start: date ? date.format("YYYY-MM-DD") : null }))}
              />
              <span className="font-bold text-zinc-400">-</span>
              <DatePicker
                placeholder="End Date"
                value={customRange.end ? dayjs(customRange.end) : null}
                onChange={date => setCustomRange(prev => ({ ...prev, end: date ? date.format("YYYY-MM-DD") : null }))}
              />
              <button
                onClick={() => setCustomRange({ start: null, end: null })}
                className="text-[10px] font-bold text-[var(--primary)] hover:underline cursor-pointer bg-transparent border-0"
              >
                Clear Range
              </button>
            </div>
          )}

          {/* Reset filters link */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-bold p-0 flex items-center gap-1 text-[var(--primary)] hover:underline cursor-pointer bg-transparent border-0"
            >
              Reset Filters
            </button>
          </div>
        </Card>

        {/* 5. Revenue Table Section */}
        <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1">
              <FileText size={14} className="text-[var(--primary)]" />
              Revenue Ledger Log
            </h3>
            <span className="text-[9px] font-bold text-zinc-400">Showing {tableData.length} of {totalRecords} records</span>
          </div>

          <Table
            columns={columns}
            dataSource={tableData}
            rowKey="_id"
            loading={loading}
            onChange={handleTableChange}
            pagination={false}
            size="small"
            bordered
            className="text-xs scrollbar-thin overflow-x-auto"
            locale={{
              emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No revenue records found." />
            }}
          />

          {/* Server Side Look Pagination */}
          <div className="flex justify-end mt-4">
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={totalRecords}
              onChange={(page, size) => {
                setCurrentPage(page);
                setPageSize(size);
              }}
              showSizeChanger
              pageSizeOptions={["10", "20", "50", "100"]}
              className="font-semibold text-xs"
            />
          </div>
        </Card>

        {/* Modals Mounting */}
        <RevenueDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedRecordId(null);
          }}
          recordId={selectedRecordId}
          recordDetails={recordDetails}
          loading={loadingDetails}
          onExport={exportRevenueReport}
        />

        <ExportRevenueModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={exportRevenueReport}
        />

      </div>
    </ConfigProvider>
  );
}
