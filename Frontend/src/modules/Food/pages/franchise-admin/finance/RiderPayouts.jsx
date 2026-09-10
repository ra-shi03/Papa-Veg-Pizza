import React, { useState, useEffect } from "react";
import {
  Card, Table, DatePicker, Select, Tag, Tooltip, Dropdown,
  Pagination, Skeleton, Empty, Result, ConfigProvider, Progress
} from "antd";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis,
  Tooltip as RechartsTooltip, Legend, Cell, PieChart, Pie
} from "recharts";
import {
  TrendingUp, TrendingDown, DollarSign, Calendar, RefreshCw,
  Download, Search, Eye, Award, BarChart2, PieChart as PieIcon,
  AlertCircle, FileText, ChevronDown, SlidersHorizontal, Info,
  CheckCircle, PlusCircle, Landmark, ShieldCheck, Users, CheckSquare,
  Clock
} from "lucide-react";
import { useRiderPayouts } from "./hooks/useRiderPayouts";
import GeneratePayoutModal from "./components/GeneratePayoutModal";
import RiderPayoutDetailsModal from "./components/RiderPayoutDetailsModal";
import MarkPaidModal from "./components/MarkPaidModal";
import RiderExportModal from "./components/RiderExportModal";
import dayjs from "dayjs";
import { toast } from "sonner";

export default function RiderPayouts() {
  const payoutsHook = useRiderPayouts();
  const {
    loading,
    search,
    setSearch,
    riderFilter,
    setRiderFilter,
    statusFilter,
    setStatusFilter,
    dateFilter,
    setDateFilter,
    customRange,
    setCustomRange,
    ridersList,
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
    riderEarningsComparisonData,
    paymentStatusDistributionData,
    tableData,
    payoutDetails,
    loadingDetails,
    fetchPayoutDetails,
    setSelectedPayoutId,
    selectedPayoutId,
    generatePayout,
    markAsPaid,
    bulkMarkAsPaid,
    exportRiderPayoutsReport,
    refetch
  } = payoutsHook;

  // Local state for debouncing
  const [localSearch, setLocalSearch] = useState(search);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Modals visibility
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isError, setIsError] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Debouncing Search (450ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
      setCurrentPage(1);
    }, 450);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch, setCurrentPage]);

  // Format Currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Paid": return "success";
      case "Pending": return "warning";
      case "Failed": return "error";
      default: return "default";
    }
  };

  // Table Columns
  const columns = [
    {
      title: "Rider Name",
      key: "riderName",
      className: "font-bold text-zinc-700 dark:text-zinc-200",
      render: (_, record) => {
        const riderObj = ridersList.find(r => r.id === record.riderId);
        return (
          <span
            className="cursor-pointer hover:text-[var(--primary)] hover:underline block truncate max-w-[200px]"
            onClick={() => {
              fetchPayoutDetails(record._id);
              setShowDetailsModal(true);
            }}
          >
            {riderObj ? riderObj.name : "Unknown"}
          </span>
        );
      }
    },
    {
      title: "Payout Ref",
      dataIndex: "payoutNumber",
      key: "payoutNumber",
      className: "font-semibold"
    },
    {
      title: "Deliveries",
      dataIndex: "totalDeliveries",
      key: "totalDeliveries",
      sorter: true,
      align: "center"
    },
    {
      title: "Base Salary",
      dataIndex: "baseSalary",
      key: "baseSalary",
      className: "font-semibold",
      render: val => formatCurrency(val)
    },
    {
      title: "Incentive",
      dataIndex: "incentive",
      key: "incentive",
      sorter: true,
      className: "font-semibold text-emerald-600 dark:text-emerald-450",
      render: val => formatCurrency(val)
    },
    {
      title: "Bonus",
      dataIndex: "bonus",
      key: "bonus",
      sorter: true,
      className: "font-semibold text-blue-500",
      render: val => formatCurrency(val)
    },
    {
      title: "Penalty",
      dataIndex: "penalties",
      key: "penalties",
      sorter: true,
      className: "font-semibold text-rose-500",
      render: val => (
        <span>{val > 0 ? `-${formatCurrency(val)}` : formatCurrency(val)}</span>
      )
    },
    {
      title: "Total Amount",
      dataIndex: "totalAmount",
      key: "totalAmount",
      sorter: true,
      className: "font-black text-emerald-600",
      render: val => formatCurrency(val)
    },
    {
      title: "Status",
      dataIndex: "paymentStatus",
      key: "paymentStatus",
      render: st => (
        <Tag color={getStatusColor(st)} className="font-extrabold text-[9px] uppercase">
          {st}
        </Tag>
      )
    },
    {
      title: "Paid Date",
      dataIndex: "paidDate",
      key: "paidDate",
      sorter: true,
      render: date => date || "Awaiting Settlement"
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
                <span>View Details</span>
              </span>
            ),
            onClick: () => {
              fetchPayoutDetails(record._id);
              setShowDetailsModal(true);
            }
          },
          ...(record.paymentStatus !== "Paid" ? [{
            key: "pay",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <CheckCircle size={13} className="text-emerald-500" />
                <span>Mark Paid</span>
              </span>
            ),
            onClick: () => {
              fetchPayoutDetails(record._id);
              setShowMarkPaidModal(true);
            }
          }] : []),
          {
            key: "export",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Download size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Export PDF</span>
              </span>
            ),
            onClick: () => {
              exportRiderPayoutsReport("PDF", { id: record._id });
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
    setRiderFilter("All");
    setStatusFilter("All");
    setDateFilter("This Month");
    setCustomRange({ start: null, end: null });
    setCurrentPage(1);
  };

  // Row Selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  };

  // Bulk operations
  const handleBulkPay = () => {
    toast.promise(
      bulkMarkAsPaid(selectedRowKeys),
      {
        loading: "Paying selected payouts...",
        success: () => {
          setSelectedRowKeys([]);
          return "Selected payouts marked as paid successfully.";
        },
        error: "Bulk payment failed."
      }
    );
  };

  const handleBulkExport = () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          exportRiderPayoutsReport("CSV", { ids: selectedRowKeys });
          resolve();
        }, 1200);
      }),
      {
        loading: `Exporting ${selectedRowKeys.length} payouts records...`,
        success: "Bulk records exported successfully.",
        error: "Export failed."
      }
    );
  };

  if (isError) {
    return (
      <ConfigProvider theme={{ token: { fontFamily: "'Poppins', system-ui, sans-serif" } }}>
        <div className="p-8 min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-zinc-950 font-['Poppins']">
          <Result
            status="error"
            title="Unable to load rider payouts."
            subTitle="The payout ledger database is currently unreachable. Please retry your connection request."
            extra={[
              <button
                key="retry"
                onClick={() => {
                  setIsError(false);
                  refetch();
                }}
                className="px-4 py-2 bg-[var(--primary)] hover:opacity-95 text-white font-bold uppercase transition-all rounded-lg cursor-pointer text-xs shadow border-0"
              >
                Retry
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
          .kpi-bento-card {
            background: white;
            border-radius: 12px;
            border: 1px solid #e4e4e7;
            box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            transition: all 0.3s;
          }
          .kpi-bento-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.08);
          }
        `}</style>

        {/* 1. Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs shrink-0 font-['Poppins']">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Rider Payouts
              </h1>
              <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20 uppercase tracking-widest animate-pulse">
                Audited
              </span>
            </div>
            <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-semibold">
              Manage rider salaries, incentives and commission payments.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowGenerateModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:opacity-95 text-white rounded-lg shadow-md font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8 border-0"
            >
              <PlusCircle size={13} />
              <span>Generate Payout</span>
            </button>

            <button
              onClick={() => refetch()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-150 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 rounded-lg shadow-sm font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8 border-0"
            >
              <RefreshCw size={11} className={loading ? "animate-spin text-[var(--primary)]" : "text-[var(--primary)]"} />
              <span>Refresh</span>
            </button>

            <button
              className="text-[8px] font-bold text-zinc-400 hover:text-rose-500 border-0 bg-transparent cursor-pointer"
              onClick={() => setIsError(true)}
              title="Test simulated error page state"
            >
              Simulate Err
            </button>
          </div>
        </header>

        {/* 2. Bulk Actions floating toolbar */}
        {selectedRowKeys.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-zinc-900 text-white rounded-xl shadow-lg animate-fade-up sticky bottom-4 z-50">
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <CheckSquare size={14} className="text-[var(--primary)]" />
              <span>{selectedRowKeys.length} payout(s) selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkPay}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase rounded-lg transition-colors cursor-pointer border-0"
              >
                Mark Paid
              </button>
              <button
                onClick={handleBulkExport}
                className="px-3 py-1.5 bg-[var(--primary)] hover:opacity-95 text-white font-bold text-[9px] uppercase rounded-lg transition-all cursor-pointer border-0"
              >
                Export Selected
              </button>
              <button
                onClick={() => {
                  toast.success("Statements generation process started.");
                  setSelectedRowKeys([]);
                }}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-800 text-white font-bold text-[9px] uppercase rounded-lg transition-colors cursor-pointer border-0"
              >
                Generate Statements
              </button>
              <div className="border-l h-5 border-zinc-750 mx-1"></div>
              <button
                onClick={() => setSelectedRowKeys([])}
                className="text-[9px] bg-transparent text-zinc-450 hover:text-white font-bold cursor-pointer border-0"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 3. Filters Section */}
        <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
          <div className="hidden md:grid grid-cols-5 gap-3">
            {/* Search */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Search Payouts</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Rider Name, Payout Ref..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-850 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold h-[34px]"
                />
              </div>
            </div>

            {/* Rider select */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Delivery Rider</span>
              <Select value={riderFilter} onChange={val => setRiderFilter(val)} className="w-full font-semibold h-[34px]">
                <Select.Option value="All">All Delivery Riders</Select.Option>
                {ridersList.map(r => (
                  <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                ))}
              </Select>
            </div>

            {/* Payment status */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Payment Status</span>
              <Select value={statusFilter} onChange={val => setStatusFilter(val)} className="w-full font-semibold h-[34px]">
                <Select.Option value="All">All Payment Statuses</Select.Option>
                <Select.Option value="Paid">Paid</Select.Option>
                <Select.Option value="Pending">Pending</Select.Option>
                <Select.Option value="Failed">Failed</Select.Option>
              </Select>
            </div>

            {/* Date range filter */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Date settlement Range</span>
              <Select value={dateFilter} onChange={val => setDateFilter(val)} className="w-full font-semibold h-[34px]">
                <Select.Option value="Today">Today</Select.Option>
                <Select.Option value="Last 7 Days">Last 7 Days</Select.Option>
                <Select.Option value="This Month">This Month</Select.Option>
                <Select.Option value="Custom">Custom Date Range</Select.Option>
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
                className="text-[9px] font-bold text-[var(--primary)] hover:underline cursor-pointer bg-transparent border-0 font-['Poppins']"
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
                <span className="font-bold text-zinc-400 uppercase text-[8px]">Search Payouts</span>
                <input
                  type="text"
                  placeholder="Rider Name, Payout Ref..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-lg border bg-white text-zinc-850 focus:outline-none focus:border-[var(--primary)]"
                />
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-bold text-zinc-400 uppercase text-[8px]">Delivery Rider</span>
                <Select value={riderFilter} onChange={val => setRiderFilter(val)} className="w-full">
                  <Select.Option value="All">All Delivery Riders</Select.Option>
                  {ridersList.map(r => (
                    <Select.Option key={r.id} value={r.id}>{r.name}</Select.Option>
                  ))}
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-bold text-zinc-400 uppercase text-[8px]">Payment Status</span>
                <Select value={statusFilter} onChange={val => setStatusFilter(val)} className="w-full">
                  <Select.Option value="All">All Statuses</Select.Option>
                  <Select.Option value="Paid">Paid</Select.Option>
                  <Select.Option value="Pending">Pending</Select.Option>
                  <Select.Option value="Failed">Failed</Select.Option>
                </Select>
              </div>

              <div className="flex flex-col gap-1">
                <span className="font-bold text-zinc-400 uppercase text-[8px]">Date settlement Range</span>
                <Select value={dateFilter} onChange={val => setDateFilter(val)} className="w-full">
                  <Select.Option value="Today">Today</Select.Option>
                  <Select.Option value="Last 7 Days">Last 7 Days</Select.Option>
                  <Select.Option value="This Month">This Month</Select.Option>
                  <Select.Option value="Custom">Custom Date Range</Select.Option>
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

        {/* 4. KPI Bento Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <Skeleton active paragraph={{ rows: 2 }} title={{ width: 100 }} />
              </Card>
            ))
          ) : (
            <>
              {/* Card 1: Total Riders (Blue Theme) */}
              <div className="kpi-bento-card p-4 border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[8.5px] font-black tracking-wider">Total Delivery Partners</span>
                    <h3 className="text-2xl font-black text-blue-600 mt-1">
                      {kpis.totalRiders} Riders
                    </h3>
                    <span className="text-[8.5px] text-zinc-450 mt-1 block">Active logistics fleet size</span>
                  </div>
                  <div className="p-2 rounded-lg bg-blue-50 text-blue-500">
                    <Users size={18} />
                  </div>
                </div>
              </div>

              {/* Card 2: Pending Payouts (Orange Theme) */}
              <div className="kpi-bento-card p-4 border-l-4 border-l-orange-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[8.5px] font-black tracking-wider">Pending Payouts Cycle</span>
                    <h3 className="text-2xl font-black text-orange-500 mt-1">
                      {kpis.pendingPayouts} Pending
                    </h3>
                    <span className="text-[8.5px] text-zinc-450 mt-1 block">Settlements resolution pending</span>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-50 text-orange-500">
                    <Clock size={18} />
                  </div>
                </div>
              </div>

              {/* Card 3: Total Payout Amount (Green Theme) */}
              <div className="kpi-bento-card p-4 border-l-4 border-l-emerald-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[8.5px] font-black tracking-wider">Total Disbursed Payouts</span>
                    <h3 className="text-2xl font-black text-emerald-600 mt-1">
                      {formatCurrency(kpis.totalPayoutAmount)}
                    </h3>
                    <span className="text-[8.5px] text-zinc-450 mt-1 block">Cumulated settlement release</span>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
                    <DollarSign size={18} />
                  </div>
                </div>
              </div>

              {/* Card 4: Average Earnings (Purple Theme) */}
              <div className="kpi-bento-card p-4 border-l-4 border-l-purple-500">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[8.5px] font-black tracking-wider">Average Payout Earnings</span>
                    <h3 className="text-2xl font-black text-purple-600 mt-1">
                      {formatCurrency(kpis.averageEarnings)}
                    </h3>
                    <span className="text-[8.5px] text-zinc-450 mt-1 block">Earnings / Total Riders ratio</span>
                  </div>
                  <div className="p-2 rounded-lg bg-purple-50 text-purple-500">
                    <TrendingUp size={18} />
                  </div>
                </div>
              </div>
            </>
          )}
        </section>

        {/* 5. Analytics Charts Section */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {loading ? (
            <>
              <Card className="shadow-xs border rounded-xl lg:col-span-2" bodyStyle={{ padding: "16px" }}>
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
              <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
            </>
          ) : (
            <>
              {/* Chart 1: Rider Earnings Comparison (Bar Chart) */}
              <Card className="shadow-xs border rounded-xl lg:col-span-2" bodyStyle={{ padding: "16px" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1.5 uppercase">
                      <BarChart2 size={14} className="text-[var(--primary)]" />
                      Rider Payout breakdown Comparison
                    </h3>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">Gross salaries, bonuses, incentives, and net disbursement ratios</span>
                  </div>
                </div>

                <div className="h-[230px] w-full mt-1">
                  {riderEarningsComparisonData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <BarChart data={riderEarningsComparisonData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", fontSize: "10px" }}
                          formatter={v => [formatCurrency(v), null]}
                        />
                        <Legend iconType="circle" wrapperStyle={{ fontSize: "9px" }} />
                        <Bar dataKey="baseSalary" name="Base Salary" fill="#3b82f6" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="incentive" name="Incentive" fill="#10b981" stackId="a" radius={[0, 0, 0, 0]} />
                        <Bar dataKey="bonus" name="Bonus" fill="#8b5cf6" stackId="a" radius={[3, 3, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No comparison data available." />
                    </div>
                  )}
                </div>
              </Card>

              {/* Chart 2: Payout Status Distribution (Pie Chart) */}
              <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1.5 uppercase">
                      <PieIcon size={14} className="text-[var(--primary)]" />
                      Payout Settlement Statuses Share
                    </h3>
                    <span className="text-[8px] font-bold text-zinc-400 uppercase">Paid vs Pending vs Failed disbursements ratio</span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center h-[230px] w-full">
                  <div className="h-[150px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <PieChart>
                        <Pie
                          data={paymentStatusDistributionData.filter(d => d.count > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="amount"
                        >
                          {paymentStatusDistributionData.filter(d => d.count > 0).map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip formatter={(v, name, props) => [`${formatCurrency(v)} (${props.payload.count} payouts)`, "Total Settled"]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex flex-wrap justify-center gap-3 text-[9px] font-bold mt-2">
                    {paymentStatusDistributionData.map((entry, idx) => (
                      <span key={idx} className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }} />
                        {entry.name}: {entry.pct}% ({formatCurrency(entry.amount)})
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </>
          )}
        </section>

        {/* 6. Rider Payouts Table */}
        <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-[var(--primary)]" />
              Settlement Ledger Payout Logs
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-[9.5px] font-black uppercase rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200 cursor-pointer shadow-xs border-0"
              >
                <Download size={11} />
                <span>Export Report</span>
              </button>
              <span className="text-[9px] font-bold text-zinc-450">
                Showing {tableData.length} records
              </span>
            </div>
          </div>

          <Table
            rowSelection={rowSelection}
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
              emptyText: (
                <div className="py-6 flex flex-col items-center justify-center font-['Poppins']">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No rider payouts available." />
                  <button
                    onClick={() => setShowGenerateModal(true)}
                    className="mt-3 px-4 py-2 bg-[var(--primary)] text-white font-bold text-[10px] uppercase rounded-lg cursor-pointer shadow border-0"
                  >
                    Generate Payout
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
        <GeneratePayoutModal
          isOpen={showGenerateModal}
          onClose={() => setShowGenerateModal(false)}
          onGenerate={generatePayout}
          ridersList={ridersList}
        />

        <RiderPayoutDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedPayoutId(null);
          }}
          payoutDetails={payoutDetails}
          onOpenMarkPaid={() => setShowMarkPaidModal(true)}
          onExport={exportRiderPayoutsReport}
        />

        <MarkPaidModal
          isOpen={showMarkPaidModal}
          onClose={() => {
            setShowMarkPaidModal(false);
            setSelectedPayoutId(null);
          }}
          payoutDetails={payoutDetails}
          onConfirm={markAsPaid}
        />

        <RiderExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={exportRiderPayoutsReport}
        />

      </div>
    </ConfigProvider>
  );
}
