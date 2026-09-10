import React, { useState, useEffect } from "react";
import { Card, Table, Select, Tag, Tooltip, Dropdown, Pagination, Skeleton, Empty, ConfigProvider } from "antd";
import { 
  Ticket, Calendar, RefreshCw, Download, Search, Eye, Edit, 
  Trash2, Copy, Power, Filter, HelpCircle, ChevronDown, ListFilter, IndianRupee 
} from "lucide-react";
import { useLocalCoupons } from "./hooks/useLocalCoupons";
import { mockStores } from "./mockData";
import LocalCouponModals from "./components/LocalCouponModals";
import dayjs from "dayjs";
import { toast } from "sonner";
import emptyCouponsWebp from "../../../../../assets/empty_reports.webp"; // Reusing high-quality WebP asset

export default function LocalCoupons() {
  const couponsHook = useLocalCoupons();
  const {
    loading,
    coupons,
    totalRecords,
    
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
  } = couponsHook;

  // Debounced search state
  const [localSearch, setLocalSearch] = useState(search);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(localSearch);
    }, 300);
    return () => clearTimeout(handler);
  }, [localSearch, setSearch]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Local Modal Visibility States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Refresh page data
  const handleRefresh = () => {
    toast.success("Refreshing coupons listing...");
    // Simulated refetch
    setCurrentPage(1);
  };

  // Export Coupons as CSV
  const handleExportCSV = () => {
    const filename = `Local_Coupons_Index_${new Date().toISOString().split("T")[0]}.csv`;
    const headers = ["Coupon Code", "Title", "Discount Type", "Value", "Min Order", "Start Date", "Expiry Date", "Status"];
    const csvContent = [
      headers.join(","),
      ...coupons.map(c => [
        c.couponCode,
        `"${c.title}"`,
        c.discountType,
        c.discountType === "percentage" ? `${c.discountValue}%` : c.discountType === "free-delivery" ? "Free Delivery" : `₹${c.discountValue}`,
        c.minimumOrderAmount || 0,
        c.startDate,
        c.endDate,
        c.status
      ].join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported coupons list as CSV!");
  };

  const getDiscountBadgeColor = (type) => {
    switch (type) {
      case "percentage": return "blue";
      case "fixed": return "green";
      case "free-delivery": return "purple";
      default: return "default";
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const columns = [
    {
      title: "Coupon Code",
      dataIndex: "couponCode",
      key: "couponCode",
      sorter: true,
      render: (code, record) => (
        <button
          onClick={() => {
            setSelectedCoupon(record);
            setShowDetailsDrawer(true);
          }}
          className="font-black text-[var(--primary)] bg-[var(--secondary)]/10 dark:bg-[var(--secondary)]/5 px-2 py-0.5 rounded font-mono text-[10px] cursor-pointer hover:underline border-0 text-left"
        >
          {code || record.code || "COUPON"}
        </button>
      )
    },
    {
      title: "Title",
      dataIndex: "title",
      key: "title",
      sorter: true,
      className: "font-bold text-zinc-700 dark:text-zinc-350",
      render: (title, record) => title || record.couponCode || record.code || "Untitled Offer"
    },
    {
      title: "Discount Type",
      dataIndex: "discountType",
      key: "discountType",
      sorter: true,
      render: type => (
        <Tag color={getDiscountBadgeColor(type)} className="font-extrabold text-[8px] uppercase border-0 px-2 py-0.5 rounded">
          {type === "percentage" ? "Percentage" : type === "fixed" ? "Fixed Value" : "Free Delivery"}
        </Tag>
      )
    },
    {
      title: "Value",
      key: "value",
      render: (_, r) => (
        <span className="font-extrabold text-zinc-800 dark:text-zinc-150">
          {r.discountType === "percentage" ? `${r.discountValue}%` : r.discountType === "free-delivery" ? "Free Delivery" : formatCurrency(r.discountValue)}
        </span>
      )
    },
    {
      title: "Minimum Order",
      dataIndex: "minimumOrderAmount",
      key: "minimumOrderAmount",
      sorter: true,
      render: val => <span className="font-bold">{formatCurrency(val)}</span>
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      sorter: true,
      render: date => <span>{new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
    },
    {
      title: "Expiry Date",
      dataIndex: "endDate",
      key: "endDate",
      sorter: true,
      render: (date, r) => {
        const isExpired = r.status === "expired";
        return (
          <span className={`font-bold ${isExpired ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded" : ""}`}>
            {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        );
      }
    },
    {
      title: "Usage Count",
      key: "usageCount",
      align: "center",
      render: (_, r) => {
        const matchingUsage = getCouponUsageDetails(r._id);
        return <span className="font-bold text-zinc-800 dark:text-zinc-100">{matchingUsage?.analytics?.totalUsage || 0}</span>;
      }
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      render: st => (
        <Tag color={st === "active" ? "green" : st === "expired" ? "red" : "default"} className="font-extrabold text-[8px] uppercase border-0 px-2 py-0.5 rounded">
          {st}
        </Tag>
      )
    },
    {
      title: "Actions",
      key: "actions",
      align: "center",
      render: (_, record) => {
        const isExpired = record.status === "expired";
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
              setSelectedCoupon(record);
              setShowDetailsDrawer(true);
            }
          },
          {
            key: "edit",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Edit size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Edit Coupon</span>
              </span>
            ),
            onClick: () => {
              setSelectedCoupon(record);
              setShowEditModal(true);
            }
          },
          {
            key: "clone",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Copy size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Clone Coupon</span>
              </span>
            ),
            onClick: () => {
              setSelectedCoupon(record);
              setShowCloneModal(true);
            }
          },
          ...(!isExpired ? [{
            key: "status",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Power size={13} className={record.status === "active" ? "text-amber-500" : "text-emerald-500"} />
                <span>{record.status === "active" ? "Deactivate" : "Activate"}</span>
              </span>
            ),
            onClick: () => {
              setSelectedCoupon(record);
              setShowStatusModal(true);
            }
          }] : []),
          {
            key: "delete",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-rose-600 py-1">
                <Trash2 size={13} className="text-rose-500" />
                <span>Delete Coupon</span>
              </span>
            ),
            onClick: () => {
              setSelectedCoupon(record);
              setShowDeleteModal(true);
            }
          }
        ];

        return (
          <div className="flex items-center justify-center">
            <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
              <button className="flex items-center gap-1 px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg bg-[var(--secondary)]/10 hover:bg-[var(--primary)] text-[var(--primary)] hover:text-white transition-all duration-200 cursor-pointer shadow-xs border-0">
                Options
                <ChevronDown size={10} className="opacity-60" />
              </button>
            </Dropdown>
          </div>
        );
      }
    }
  ];

  // Sorting and Pagination updates
  const handleTableChange = (pagination, filters, sorter) => {
    if (sorter.field) {
      setSortBy(sorter.field);
      setSortOrder(sorter.order === "ascend" ? "asc" : "desc");
      setCurrentPage(1);
    }
  };

  return (
    <ConfigProvider theme={{ token: { fontFamily: "'Poppins', system-ui, sans-serif", colorPrimary: localStorage.getItem("sa_primary") || "#a43c12" } }}>
      <div className="p-3 md:p-5 max-w-7xl mx-auto space-y-4 text-xs bg-slate-50 dark:bg-zinc-950 min-h-screen text-zinc-700 dark:text-zinc-300 font-['Poppins']">
        <style>{`
          .ant-select, .ant-select-item, .ant-picker, .ant-picker-input > input, .ant-table, .ant-table-cell, .ant-drawer, .ant-pagination, .ant-pagination-item, .ant-tag, .ant-empty {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
          .ant-switch-checked {
            background-color: var(--primary) !important;
          }
        `}</style>

        {/* Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Local Coupons
              </h1>
              <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20 uppercase tracking-widest animate-pulse">
                Franchise Active
              </span>
            </div>
            <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-semibold">
              Manage franchise-specific offers and discount codes.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-4 py-2 border border-[var(--primary)]/20 hover:border-[var(--primary)] hover:text-[var(--primary)] hover:bg-[var(--secondary)]/10 text-zinc-700 dark:text-zinc-200 rounded-lg shadow-sm font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8 bg-transparent"
            >
              <Download size={13} />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] hover:opacity-95 text-white border-0 rounded-lg shadow-md font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8"
            >
              <Ticket size={14} />
              <span>Create Coupon</span>
            </button>

            <button
              onClick={handleRefresh}
              className="flex items-center justify-center p-2 bg-[var(--secondary)]/10 hover:bg-[var(--secondary)]/20 text-[var(--primary)] rounded-lg shadow-sm border border-transparent transition-all duration-200 cursor-pointer active:scale-[0.95] h-8 w-8"
              title="Reload coupons list"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-[var(--primary)]" : "text-[var(--primary)]"} />
            </button>
          </div>
        </header>

        {/* Dashboard Cards Row */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Card 1: Total Coupons */}
          <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Total Coupons
                  <Tooltip title="Cumulative coupon campaigns configured under franchise">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-lg font-black text-blue-600">
                      {dashboardStats.totalCoupons}
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.totalChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20 text-blue-500 shrink-0">
                <Ticket size={14} />
              </div>
            </div>
          </Card>

          {/* Card 2: Active Coupons */}
          <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Active Coupons
                  <Tooltip title="Coupons currently accepting usage from consumers at checkout">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-lg font-black text-emerald-600">
                      {dashboardStats.activeCoupons}
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.activeChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 shrink-0">
                <Power size={14} />
              </div>
            </div>
          </Card>

          {/* Card 3: Expired Coupons */}
          <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Expired Coupons
                  <Tooltip title="Coupons that have passed their expiration date limit">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-lg font-black text-rose-600">
                      {dashboardStats.expiredCoupons}
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.expiredChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500 shrink-0">
                <Calendar size={14} />
              </div>
            </div>
          </Card>

          {/* Card 4: Coupon Usage Count */}
          <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Usage Count
                  <Tooltip title="Aggregate volume of orders processed using discount codes">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-lg font-black text-purple-650">
                      {dashboardStats.totalUsage}
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.usageChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 text-purple-500 shrink-0">
                <Ticket size={14} />
              </div>
            </div>
          </Card>

          {/* Card 5: Revenue Capped */}
          <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Revenue Gen
                  <Tooltip title="Total order values processed with applied coupons">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-[14px] font-black text-emerald-600">
                      {formatCurrency(dashboardStats.revenueGenerated)}
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.revenueChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 shrink-0">
                <IndianRupee size={14} />
              </div>
            </div>
          </Card>
        </section>

        {/* Sticky Filters Section */}
        <Card className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl sticky top-0 z-10" bodyStyle={{ padding: "12px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search Coupon */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px] flex items-center gap-0.5">
                <Search size={10} />
                Search Coupon
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Coupon code or title..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold h-[32px]"
                />
              </div>
            </div>

            {/* Status Dropdown */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px]">Status</span>
              <Select value={status} onChange={val => setStatus(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Statuses</Select.Option>
                <Select.Option value="Active">Active</Select.Option>
                <Select.Option value="Inactive">Inactive</Select.Option>
                <Select.Option value="Expired">Expired</Select.Option>
              </Select>
            </div>

            {/* Discount Type Dropdown */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px]">Discount Type</span>
              <Select value={discountType} onChange={val => setDiscountType(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Types</Select.Option>
                <Select.Option value="Percentage">Percentage</Select.Option>
                <Select.Option value="Fixed">Fixed Amount</Select.Option>
                <Select.Option value="Free Delivery">Free Delivery</Select.Option>
              </Select>
            </div>

            {/* Store Dropdown */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px]">Store Outlet</span>
              <Select value={storeId} onChange={val => setStoreId(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Stores</Select.Option>
                {mockStores.map(s => (
                  <Select.Option key={s._id} value={s._id}>{s.name}</Select.Option>
                ))}
              </Select>
            </div>

            {/* Date Range picker simulation */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px]">Date Limits</span>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  placeholder="Start"
                  value={startDate || ""}
                  onChange={e => setStartDate(e.target.value || null)}
                  className="px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] font-semibold h-[32px] cursor-pointer"
                />
                <input
                  type="date"
                  placeholder="End"
                  value={endDate || ""}
                  onChange={e => setEndDate(e.target.value || null)}
                  className="px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] font-semibold h-[32px] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Reset Filters Toolbar */}
          <div className="flex justify-end mt-2 pt-1.5 border-t border-zinc-100 dark:border-zinc-900">
            <button
              onClick={handleResetFilters}
              className="text-[9.5px] font-extrabold flex items-center gap-1 text-[var(--primary)] hover:underline cursor-pointer bg-transparent border-0"
            >
              <Filter size={10} />
              <span>Reset Filters</span>
            </button>
          </div>
        </Card>

        {/* Coupons Table Section */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-black text-xs text-zinc-805 dark:text-zinc-150 uppercase tracking-wider">
              Coupons Directory Ledger
            </h3>
            <span className="text-[9px] font-bold text-zinc-450">
              Showing {coupons.length} of {totalRecords} records
            </span>
          </div>

          <Table
            columns={columns}
            dataSource={coupons}
            rowKey="_id"
            loading={loading}
            onChange={handleTableChange}
            pagination={false}
            size="small"
            bordered
            className="text-xs scrollbar-thin overflow-x-auto"
            locale={{
              emptyText: (
                <div className="py-10 flex flex-col items-center justify-center text-center">
                  <img
                    src={emptyCouponsWebp}
                    alt="No coupons illustration"
                    className="w-32 h-32 object-contain mb-3 opacity-60 dark:opacity-40"
                  />
                  <h4 className="font-extrabold text-xs text-zinc-650 dark:text-zinc-350">No Coupons Available.</h4>
                  <p className="text-[10px] text-zinc-400 max-w-[260px] mt-0.5 leading-normal">
                    {search ? "Try adjusting your filters or search keywords to locate coupons." : "Start by creating your first franchise local coupon discount campaign."}
                  </p>
                  {!search && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-3 px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[9.5px] font-extrabold uppercase rounded-lg border-0 cursor-pointer shadow-md transition-all"
                    >
                      Create Coupon
                    </button>
                  )}
                </div>
              )
            }}
          />

          {/* Table pagination footer */}
          {totalRecords > 0 && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-zinc-400">
              <span>Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} coupons</span>
              
              <Pagination
                current={currentPage}
                pageSize={pageSize}
                total={totalRecords}
                onChange={(page, size) => {
                  setCurrentPage(page);
                  setPageSize(size);
                }}
                showSizeChanger
                pageSizeOptions={["10", "25", "50", "100"]}
                size="small"
              />
            </div>
          )}
        </div>

        {/* Modal Declarations Container */}
        <LocalCouponModals
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          showCloneModal={showCloneModal}
          setShowCloneModal={setShowCloneModal}
          showDetailsDrawer={showDetailsDrawer}
          setShowDetailsDrawer={setShowDetailsDrawer}
          showStatusModal={showStatusModal}
          setShowStatusModal={setShowStatusModal}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          selectedCoupon={selectedCoupon}
          setSelectedCoupon={setSelectedCoupon}
          createCoupon={createCoupon}
          updateCoupon={updateCoupon}
          deleteCoupon={deleteCoupon}
          toggleCouponStatus={toggleCouponStatus}
          getCouponUsageDetails={getCouponUsageDetails}
        />

      </div>
    </ConfigProvider>
  );
}
