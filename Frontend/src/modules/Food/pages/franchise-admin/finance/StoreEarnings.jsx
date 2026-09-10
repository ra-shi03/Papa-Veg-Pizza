import React, { useState, useEffect } from "react";
import {
  Card, Table, DatePicker, Select, Tabs, Modal, Tag, Tooltip,
  Dropdown, Pagination, Skeleton, Empty, Result, ConfigProvider, Progress
} from "antd";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip as RechartsTooltip, Legend, Cell
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw,
  Download, Search, Eye, Trophy, BarChart2, PieChart as PieIcon,
  AlertCircle, FileText, ChevronDown, SlidersHorizontal, Info
} from "lucide-react";
import { useStoreEarnings } from "./hooks/useStoreEarnings";
import { mockStores } from "./mockData";
import StoreEarningsDetailModal from "./components/StoreEarningsDetailModal";
import ProfitAnalysisModal from "./components/ProfitAnalysisModal";
import StoreExportModal from "./components/StoreExportModal";
import dayjs from "dayjs";

export default function StoreEarnings() {
  const earningsHook = useStoreEarnings();
  const {
    loading,
    search,
    setSearch,
    dateFilter,
    setDateFilter,
    customRange,
    setCustomRange,
    storeFilter,
    setStoreFilter,
    profitStatusFilter,
    setProfitStatusFilter,
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
    storeComparisonChartData,
    revenueProfitTrendChartData,
    tableData,
    storeDetails,
    loadingDetails,
    fetchStoreDetails,
    setSelectedStoreId,
    selectedStoreId,
    exportStoreEarningsReport,
    refetch
  } = earningsHook;

  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(search);

  // Modals Visibility
  const [showExportModal, setShowExportModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showProfitModal, setShowProfitModal] = useState(false);
  const [isError, setIsError] = useState(false); // Developer toggle for testing error state
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debouncing Search Input (450ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch, setCurrentPage]);

  // Format currency helper (Indian Rupee)
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Excellent": return "success";
      case "Good": return "processing";
      case "Average": return "warning";
      case "Low Profit": return "orange";
      case "Loss": return "error";
      default: return "default";
    }
  };

  // Columns Configuration
  const columns = [
    {
      title: "Store",
      dataIndex: "name",
      key: "name",
      className: "font-bold text-zinc-700 dark:text-zinc-200",
      render: (name, record) => (
        <span
          className="cursor-pointer hover:text-[var(--primary)] hover:underline block truncate max-w-[200px]"
          onClick={() => {
            fetchStoreDetails(record.storeId);
            setShowDetailsModal(true);
          }}
        >
          {name.replace("Papa Veg Pizza - ", "")}
        </span>
      )
    },
    {
      title: "Orders",
      dataIndex: "totalOrders",
      key: "totalOrders",
      sorter: true,
      align: "center",
      className: "font-semibold"
    },
    {
      title: "Sales",
      dataIndex: "grossSales",
      key: "grossSales",
      sorter: true,
      className: "font-semibold text-blue-600 dark:text-blue-400",
      render: val => formatCurrency(val)
    },
    {
      title: "Expenses",
      dataIndex: "expenses",
      key: "expenses",
      sorter: true,
      className: "font-semibold text-orange-500",
      render: val => formatCurrency(val)
    },
    {
      title: "Profit / Loss",
      dataIndex: "netProfit",
      key: "netProfit",
      sorter: true,
      className: "font-extrabold",
      render: val => (
        <span className={val >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-405"}>
          {formatCurrency(val)}
        </span>
      )
    },
    {
      title: "Margin %",
      dataIndex: "margin",
      key: "margin",
      sorter: true,
      align: "center",
      render: val => (
        <span className={`font-black ${val >= 30 ? 'text-emerald-600' : val >= 15 ? 'text-amber-500' : 'text-rose-500'}`}>
          {val}%
        </span>
      )
    },
    {
      title: "Refunds",
      dataIndex: "refunds",
      key: "refunds",
      className: "text-rose-500 font-semibold",
      render: val => formatCurrency(val)
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: st => (
        <Tag color={getStatusColor(st)} className="font-extrabold text-[9px] uppercase">
          {st}
        </Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => {
        const items = [
          {
            key: "view",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Eye size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>View Earnings</span>
              </span>
            ),
            onClick: () => {
              fetchStoreDetails(record.storeId);
              setShowDetailsModal(true);
            }
          },
          {
            key: "analysis",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <BarChart2 size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Profit Analysis</span>
              </span>
            ),
            onClick: () => {
              fetchStoreDetails(record.storeId);
              setShowProfitModal(true);
            }
          },
          {
            key: "export",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Download size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Export Report</span>
              </span>
            ),
            onClick: () => {
              exportStoreEarningsReport("PDF", { storeId: record.storeId });
            }
          }
        ];

        return (
          <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
            <button className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 transition-all duration-200 cursor-pointer shadow-xs border-0">
              Actions <ChevronDown size={10} className="opacity-60" />
            </button>
          </Dropdown>
        );
      }
    }
  ];

  // Sorting Handler
  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
      setCurrentPage(1);
    }
  };

  const handleResetFilters = () => {
    setLocalSearch("");
    setSearch("");
    setStoreFilter("All");
    setDateFilter("Last 30 Days");
    setProfitStatusFilter("All");
    setCustomRange({ start: null, end: null });
    setCurrentPage(1);
  };

  if (isError) {
    return (
      <ConfigProvider theme={{ token: { fontFamily: "'Poppins', system-ui, sans-serif" } }}>
        <div className="p-8 min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-zinc-950 font-['Poppins']">
          <Result
            status="error"
            title="Unable to load store earnings."
            subTitle="The backend microservice for Store Profitability database is currently experiencing an outage. Please try again shortly."
            extra={[
              <button
                key="retry"
                onClick={() => {
                  setIsError(false);
                  refetch();
                }}
                className="px-4 py-2 bg-[var(--primary)] hover:opacity-95 text-white font-bold uppercase transition-all rounded-lg cursor-pointer text-xs shadow border-0"
              >
                Retry Request
              </button>
            ]}
          />
        </div>
      </ConfigProvider>
    );
  }

  return (
    <ConfigProvider theme={{ token: { fontFamily: "'Poppins', system-ui, sans-serif", colorPrimary: "#a43c12" } }}>
      <div className="p-3 md:p-5 max-w-7xl mx-auto space-y-4 text-xs bg-slate-50 dark:bg-zinc-950 min-h-screen text-zinc-700 dark:text-zinc-300 font-['Poppins']">
        <style>{`
          .ant-select, .ant-select-item, .ant-picker, .ant-picker-input > input, .ant-table, .ant-table-cell, .ant-tabs, .ant-tabs-tab-btn, .ant-modal, .ant-modal-title, .ant-drawer, .ant-pagination, .ant-pagination-item, .ant-tag, .ant-empty {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
          .custom-kpi-card {
            background: white;
            border-radius: 12px;
            border: 1px solid #e4e4e7;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: all 0.3s;
          }
          .custom-kpi-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
          }
        `}</style>

        {/* 1. Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Store Earnings
              </h1>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20 uppercase tracking-widest animate-pulse">
                Audited
              </span>
            </div>
            <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-semibold">
              Compare revenue and profitability across franchise stores. Identify best-performers and evaluate margins.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:opacity-95 text-white rounded-lg shadow-md font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8 border-0"
            >
              <Download size={13} />
              <span>Export Report</span>
            </button>

            <button
              onClick={() => refetch()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 rounded-lg shadow-sm font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8 border-0"
            >
              <RefreshCw size={11} className={loading ? "animate-spin text-[var(--primary)]" : "text-[var(--primary)]"} />
              <span>Refresh</span>
            </button>

            {/* Simulated Error triggers */}
            <button
              className="text-[8px] font-bold text-zinc-400 hover:text-rose-500 border-0 bg-transparent cursor-pointer"
              onClick={() => setIsError(true)}
              title="Click to test database error result view"
            >
              Test Err
            </button>
          </div>
        </header>

        {/* 2. Global Filters Card */}
        <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
          <div className="hidden md:grid grid-cols-5 gap-3">
            {/* Search */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Search Stores</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search by Store Name..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold h-[34px]"
                />
              </div>
            </div>

            {/* Store Filter */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Franchise Store</span>
              <Select value={storeFilter} onChange={val => setStoreFilter(val)} className="w-full font-semibold h-[34px]">
                <Select.Option value="All">All Stores Combined</Select.Option>
                {mockStores.map(s => (
                  <Select.Option key={s.id} value={s.id}>{s.name.replace("Papa Veg Pizza - ", "")}</Select.Option>
                ))}
              </Select>
            </div>

            {/* Date range filter */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Date Interval</span>
              <Select value={dateFilter} onChange={val => setDateFilter(val)} className="w-full font-semibold h-[34px]">
                <Select.Option value="Today">Today</Select.Option>
                <Select.Option value="Last 7 Days">Last 7 Days</Select.Option>
                <Select.Option value="Last 30 Days">Last 30 Days</Select.Option>
                <Select.Option value="This Month">This Month</Select.Option>
                <Select.Option value="Custom">Custom Date Range</Select.Option>
              </Select>
            </div>

            {/* Profit status */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Profit Status</span>
              <Select value={profitStatusFilter} onChange={val => setProfitStatusFilter(val)} className="w-full font-semibold h-[34px]">
                <Select.Option value="All">All Stores Profitability</Select.Option>
                <Select.Option value="High Profit">High Profit (&ge;30%)</Select.Option>
                <Select.Option value="Medium Profit">Medium Profit (15%-30%)</Select.Option>
                <Select.Option value="Low Profit">Low Profit (0%-15%)</Select.Option>
                <Select.Option value="Loss Making">Loss Making (&lt;0%)</Select.Option>
              </Select>
            </div>

            {/* Reset widget button */}
            <div className="flex items-end justify-end">
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 text-xs font-bold text-[var(--primary)] hover:underline bg-transparent border border-zinc-200 hover:border-[var(--primary)] rounded-lg cursor-pointer h-[34px] w-full transition-all"
              >
                Clear All Filters
              </button>
            </div>
          </div>

          {/* Custom Datepicker row */}
          {dateFilter === "Custom" && (
            <div className="mt-3 flex items-center gap-2 border-t pt-3 animate-fade-down hidden md:flex">
              <span className="font-bold text-zinc-500 text-[9px] uppercase">Select Custom Range:</span>
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
                className="text-[9px] font-bold text-[var(--primary)] hover:underline cursor-pointer bg-transparent border-0"
              >
                Clear Range
              </button>
            </div>
          )}

          {/* Mobile Filter Toggle Button */}
          <div className="md:hidden flex justify-between items-center">
            <span className="font-black text-slate-800 text-[10px]">Filter Records</span>
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 border rounded-lg text-[9px] font-extrabold uppercase cursor-pointer border-0"
            >
              <SlidersHorizontal size={12} />
              <span>{showMobileFilters ? "Hide Filters" : "Show Filters"}</span>
            </button>
          </div>

          {/* Mobile Filter Panel */}
          {showMobileFilters && (
            <div className="md:hidden mt-3 pt-3 border-t space-y-3.5 animate-fade-down">
              <div className="flex flex-col gap-1">
                <span className="font-bold text-zinc-400 uppercase text-[8px]">Search Stores</span>
                <input
                  type="text"
                  placeholder="Search store name..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border bg-white text-zinc-850 focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-bold text-zinc-400 uppercase text-[8px]">Franchise Store</span>
                <Select value={storeFilter} onChange={val => setStoreFilter(val)} className="w-full">
                  <Select.Option value="All">All Stores Combined</Select.Option>
                  {mockStores.map(s => (
                    <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-bold text-zinc-400 uppercase text-[8px]">Date Interval</span>
                <Select value={dateFilter} onChange={val => setDateFilter(val)} className="w-full">
                  <Select.Option value="Today">Today</Select.Option>
                  <Select.Option value="Last 7 Days">Last 7 Days</Select.Option>
                  <Select.Option value="Last 30 Days">Last 30 Days</Select.Option>
                  <Select.Option value="This Month">This Month</Select.Option>
                  <Select.Option value="Custom">Custom Date Range</Select.Option>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-bold text-zinc-400 uppercase text-[8px]">Profit Status</span>
                <Select value={profitStatusFilter} onChange={val => setProfitStatusFilter(val)} className="w-full">
                  <Select.Option value="All">All Profit Statuses</Select.Option>
                  <Select.Option value="High Profit">High Profit (&ge;30%)</Select.Option>
                  <Select.Option value="Medium Profit">Medium Profit (15%-30%)</Select.Option>
                  <Select.Option value="Low Profit">Low Profit (0%-15%)</Select.Option>
                  <Select.Option value="Loss Making">Loss Making (&lt;0%)</Select.Option>
                </Select>
              </div>

              <div className="flex gap-2 pt-2.5">
                <button
                  onClick={handleResetFilters}
                  className="flex-1 py-2 text-[9px] font-extrabold uppercase text-[var(--primary)] border rounded-lg bg-white"
                >
                  Clear All
                </button>
              </div>
            </div>
          )}
        </Card>

        {/* 3. KPI Cards Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <Skeleton active paragraph={{ rows: 2 }} title={{ width: 100 }} />
              </Card>
            ))
          ) : (
            <>
              {/* Card 1: Best Performing Store (Green Theme) */}
              <div className="custom-kpi-card p-4 border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[8.5px] font-black tracking-wider">Best Performing Store</span>
                    <h3 className="text-md font-black text-zinc-800 dark:text-zinc-100 truncate max-w-[160px] mt-1">
                      {kpis.bestStore.name}
                    </h3>
                    <div className="flex items-baseline gap-1 mt-1 font-extrabold text-[15px] text-emerald-600">
                      <span>{formatCurrency(kpis.bestStore.profit)}</span>
                      <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-1 py-0.2 rounded">
                        {kpis.bestStore.growth} Growth
                      </span>
                    </div>
                    <span className="text-[8.5px] text-zinc-450 mt-1 block">
                      Orders count: {kpis.bestStore.orders}
                    </span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-500">
                    <Trophy size={18} />
                  </div>
                </div>
              </div>

              {/* Card 2: Highest Revenue Store (Blue Theme) */}
              <div className="custom-kpi-card p-4 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[8.5px] font-black tracking-wider">Highest Revenue Store</span>
                    <h3 className="text-md font-black text-zinc-800 dark:text-zinc-100 truncate max-w-[160px] mt-1">
                      {kpis.highestRevStore.name}
                    </h3>
                    <h3 className="text-lg font-black text-blue-600 mt-1">
                      {formatCurrency(kpis.highestRevStore.sales)}
                    </h3>
                    <span className="text-[8.5px] text-zinc-450 mt-1.5 block">Peak revenue store</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50/50 text-blue-500">
                    <TrendingUp size={18} />
                  </div>
                </div>
              </div>

              {/* Card 3: Lowest Revenue Store (Orange Theme) */}
              <div className="custom-kpi-card p-4 border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[8.5px] font-black tracking-wider">Lowest Revenue Store</span>
                    <h3 className="text-md font-black text-zinc-800 dark:text-zinc-100 truncate max-w-[160px] mt-1">
                      {kpis.lowestRevStore.name}
                    </h3>
                    <h3 className="text-lg font-black text-orange-600 mt-1">
                      {formatCurrency(kpis.lowestRevStore.sales)}
                    </h3>
                    <span className="text-[8.5px] text-zinc-450 mt-1.5 block">Audit and support required</span>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-500">
                    <TrendingDown size={18} />
                  </div>
                </div>
              </div>

              {/* Card 4: Average Profit (Purple Theme) */}
              <div className="custom-kpi-card p-4 border-l-4 border-l-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[8.5px] font-black tracking-wider">Average Store Profit</span>
                    <h3 className="text-md font-black text-zinc-800 dark:text-zinc-100 mt-1">
                      All Franchise Outlets
                    </h3>
                    <h3 className="text-lg font-black text-purple-600 mt-1">
                      {formatCurrency(kpis.averageProfit)}
                    </h3>
                    <span className="text-[8.5px] text-zinc-450 mt-1.5 block">Average profit margin ratio</span>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-500">
                    <DollarSign size={18} />
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* 4. Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              {/* Store Comparison Chart */}
              <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1.5 uppercase">
                      <BarChart2 size={14} className="text-[var(--primary)]" />
                      Store Earnings & Volume Comparison
                    </h3>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">Gross sales revenue, profit margin, and orders volume</span>
                  </div>
                </div>

                <div className="h-[230px] w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={storeComparisonChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="left" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                      <YAxis yAxisId="right" orientation="right" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", fontSize: "10px" }}
                        formatter={(value, name) => [name === "orders" ? value : formatCurrency(value), name === "orders" ? "Orders Count" : name === "revenue" ? "Gross Sales" : "Net Profit"]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "9px" }} />
                      <Bar yAxisId="left" dataKey="revenue" name="revenue" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                      <Bar yAxisId="left" dataKey="profit" name="profit" fill="#10b981" radius={[3, 3, 0, 0]} />
                      <Bar yAxisId="right" dataKey="orders" name="orders" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Revenue vs Profit Trend Chart */}
              <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1.5 uppercase">
                      <TrendingUp size={14} className="text-[var(--primary)]" />
                      Cumulative Revenue vs Profit Trend
                    </h3>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">Interactive sales growth indices</span>
                  </div>
                </div>

                <div className="h-[230px] w-full mt-1">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <LineChart data={revenueProfitTrendChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <XAxis dataKey="formattedDate" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", fontSize: "10px" }}
                        formatter={v => [formatCurrency(v), null]}
                      />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: "9px" }} />
                      <Line type="monotone" dataKey="revenue" name="Revenue Index" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 5 }} />
                      <Line type="monotone" dataKey="profit" name="Profit Index" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </>
          )}
        </section>

        {/* 5. Store Earnings Table Card */}
        <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
          <div className="flex justify-between items-center mb-3.5">
            <h3 className="font-extrabold text-xs text-zinc-850 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-[var(--primary)]" />
              Store Profitability Comparison Table
            </h3>
            <span className="text-[9px] font-bold text-zinc-450">
              Showing {tableData.length} stores
            </span>
          </div>

          <Table
            columns={columns}
            dataSource={tableData}
            rowKey="storeId"
            loading={loading}
            onChange={handleTableChange}
            pagination={false}
            size="small"
            bordered
            className="text-xs scrollbar-thin overflow-x-auto"
            locale={{
              emptyText: (
                <div className="py-6 flex flex-col items-center justify-center font-['Poppins']">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No store earnings data available." />
                  <button
                    onClick={() => refetch()}
                    className="mt-3 px-4 py-2 bg-[var(--primary)] text-white font-bold text-[10px] uppercase rounded-lg cursor-pointer shadow border-0"
                  >
                    Refresh
                  </button>
                </div>
              )
            }}
          />

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
              pageSizeOptions={["5", "10", "20"]}
              className="font-semibold text-xs"
            />
          </div>
        </Card>

        {/* Modals Mounting */}
        <StoreEarningsDetailModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedStoreId(null);
          }}
          storeDetails={storeDetails}
          onOpenProfitAnalysis={() => setShowProfitModal(true)}
          onExport={exportStoreEarningsReport}
        />

        <ProfitAnalysisModal
          isOpen={showProfitModal}
          onClose={() => {
            setShowProfitModal(false);
            setSelectedStoreId(null);
          }}
          storeDetails={storeDetails}
        />

        <StoreExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={exportStoreEarningsReport}
        />

      </div>
    </ConfigProvider>
  );
}
