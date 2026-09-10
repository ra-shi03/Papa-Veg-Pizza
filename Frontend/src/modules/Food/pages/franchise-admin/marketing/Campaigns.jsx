import React, { useState, useEffect } from "react";
import { Card, Table, Select, Tag, Tooltip, Dropdown, Pagination, Skeleton, ConfigProvider, Progress } from "antd";
import { 
  Megaphone, Plus, Download, RefreshCw, Search, Eye, Edit, 
  Trash2, Power, Filter, HelpCircle, ChevronDown, ListFilter, IndianRupee,
  Calendar, ShoppingBag, TrendingUp, Play
} from "lucide-react";
import { useCampaigns } from "./hooks/useCampaigns";
import CampaignModals from "./components/CampaignModals";
import dayjs from "dayjs";
import { toast } from "sonner";
import emptyReportsWebp from "../../../../../assets/empty_reports.webp";

export default function Campaigns() {
  const campaignsHook = useCampaigns();
  const {
    loading,
    campaigns,
    totalRecords,
    stores,
    loadingStores,

    // Filters
    search,
    setSearch,
    typeFilter,
    setTypeFilter,
    statusFilter,
    setStatusFilter,
    storeIdFilter,
    setStoreIdFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    handleResetFilters,

    // Sorting & Pagination
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    sortBy,
    setSortBy,
    sortOrder,
    setSortOrder,

    // Selections
    selectedCampaign,
    setSelectedCampaign,

    // KPIs & Operations
    dashboardStats,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    updateCampaignStatus,
    getCampaignPerformanceDetails
  } = campaignsHook;

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

  // Modal Visibility States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDetailsDrawer, setShowDetailsDrawer] = useState(false);

  // Stats / Performance mapping fallback helper
  const [tempPerfCache, setTempPerfCache] = useState({});

  // Reload action
  const handleRefresh = () => {
    toast.success("Refreshing campaign directory...");
    setCurrentPage(1);
  };

  // Export Campaigns list to CSV
  const handleExportCSV = () => {
    if (campaigns.length === 0) {
      toast.warning("No campaign data available to export.");
      return;
    }
    const filename = `Franchise_Campaigns_Index_${new Date().toISOString().split("T")[0]}.csv`;
    const headers = ["Campaign Name", "Type", "Budget", "Target Audience", "Start Date", "End Date", "Status", "Created By"];
    const csvContent = [
      headers.join(","),
      ...campaigns.map(c => [
        `"${c.campaignName}"`,
        c.campaignType,
        c.budget || 0,
        c.targetAudience,
        c.startDate,
        c.endDate,
        c.status,
        `"${c.createdBy}"`
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
    toast.success("Exported campaigns list as CSV!");
  };

  const getCampaignTypeTag = (type) => {
    switch (type) {
      case "festival":
        return <Tag color="purple" className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">Festival</Tag>;
      case "weekend_offer":
        return <Tag color="blue" className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">Weekend Offer</Tag>;
      case "combo_offer":
        return <Tag color="green" className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">Combo Offer</Tag>;
      case "flash_sale":
        return <Tag color="orange" className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">Flash Sale</Tag>;
      default:
        return <Tag className="font-extrabold uppercase text-[8px] px-2 py-0.5 border-0 rounded">{type}</Tag>;
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getRoiProgressColor = (roi) => {
    if (roi >= 40) return "#10b981"; // Green
    if (roi >= 20) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  // Table Columns config
  const columns = [
    {
      title: "Campaign Name",
      dataIndex: "campaignName",
      key: "campaignName",
      sorter: true,
      render: (name, record) => (
        <button
          onClick={() => {
            setSelectedCampaign(record);
            setShowDetailsDrawer(true);
          }}
          className="font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2 py-0.5 rounded cursor-pointer hover:underline border-0 text-left text-[11px]"
        >
          {name}
        </button>
      )
    },
    {
      title: "Type",
      dataIndex: "campaignType",
      key: "campaignType",
      sorter: true,
      render: type => getCampaignTypeTag(type)
    },
    {
      title: "Budget",
      dataIndex: "budget",
      key: "budget",
      sorter: true,
      render: val => <span className="font-extrabold text-zinc-800 dark:text-zinc-150">{formatCurrency(val)}</span>
    },
    {
      title: "Stores",
      key: "stores",
      render: (_, r) => {
        if (!r.stores || r.stores.length === 0) {
          return <Tag className="font-extrabold text-[8px] uppercase border-0 bg-zinc-100 text-zinc-650">Global</Tag>;
        }
        const displayLimit = 2;
        const storeNames = r.stores.map(id => {
          const st = stores.find(s => s._id === id);
          return st ? (st.name || st.storeName || "").split(" ")[0] : "Store";
        });
        const overflow = storeNames.length - displayLimit;
        
        return (
          <div className="flex flex-wrap gap-1 items-center max-w-[130px]">
            {storeNames.slice(0, displayLimit).map((name, i) => (
              <Tag key={i} color="cyan" className="font-bold text-[8px] uppercase border-0 px-1 py-0.2 rounded">
                {name}
              </Tag>
            ))}
            {overflow > 0 && (
              <span className="text-[8px] font-black text-zinc-400">+{overflow}</span>
            )}
          </div>
        );
      }
    },
    {
      title: "Start Date",
      dataIndex: "startDate",
      key: "startDate",
      sorter: true,
      render: date => <span>{new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</span>
    },
    {
      title: "End Date",
      dataIndex: "endDate",
      key: "endDate",
      sorter: true,
      render: (date, r) => {
        const isExpired = new Date(date) < new Date() && r.status !== "completed";
        return (
          <span className={`font-bold ${isExpired ? "text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded" : ""}`}>
            {new Date(date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
          </span>
        );
      }
    },
    {
      title: "Revenue",
      key: "revenue",
      render: (_, r) => {
        // Find in cached perform lists
        // Fallback to static mock representation
        const mockRevenue = {
          "camp-2": 345000,
          "camp-3": 128600,
          "camp-4": 420000,
          "camp-5": 980000,
          "camp-6": 108000,
          "camp-7": 156000,
          "camp-8": 115000
        }[r._id] || 0;
        return <span className="font-extrabold text-zinc-800 dark:text-zinc-150">{formatCurrency(mockRevenue)}</span>;
      }
    },
    {
      title: "ROI",
      key: "roi",
      sorter: true,
      render: (_, r) => {
        const mockRoi = {
          "camp-2": 305,
          "camp-3": 185,
          "camp-4": 342,
          "camp-5": 1860,
          "camp-6": 208,
          "camp-7": 290,
          "camp-8": 76
        }[r._id] || 0;
        
        return (
          <div className="flex items-center gap-2 min-w-[80px]">
            <Progress 
              percent={Math.min(100, mockRoi)} 
              size="small" 
              strokeColor={getRoiProgressColor(mockRoi)} 
              showInfo={false}
              className="m-0"
            />
            <span className="font-black text-[9px]" style={{ color: getRoiProgressColor(mockRoi) }}>
              {mockRoi}%
            </span>
          </div>
        );
      }
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      render: status => (
        <Tag color={status === "active" ? "green" : status === "paused" ? "orange" : status === "completed" ? "blue" : "default"} className="font-extrabold text-[8px] uppercase border-0 px-2 py-0.5 rounded">
          {status}
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
                <span>View Performance</span>
              </span>
            ),
            onClick: () => {
              setSelectedCampaign(record);
              setShowDetailsDrawer(true);
            }
          },
          {
            key: "edit",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Edit size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Edit Details</span>
              </span>
            ),
            onClick: () => {
              setSelectedCampaign(record);
              setShowEditModal(true);
            }
          },
          ...(record.status === "active" ? [{
            key: "pause",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-amber-600 py-1">
                <Power size={13} className="text-amber-500" />
                <span>Pause Campaign</span>
              </span>
            ),
            onClick: () => {
              setSelectedCampaign(record);
              setShowPauseModal(true);
            }
          }] : []),
          ...(record.status === "paused" ? [{
            key: "resume",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-emerald-600 py-1">
                <Play size={13} className="text-emerald-500" />
                <span>Resume Campaign</span>
              </span>
            ),
            onClick: () => {
              setSelectedCampaign(record);
              setShowResumeModal(true);
            }
          }] : []),
          {
            key: "delete",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-rose-600 py-1">
                <Trash2 size={13} className="text-rose-500" />
                <span>Delete Campaign</span>
              </span>
            ),
            onClick: () => {
              setSelectedCampaign(record);
              setShowDeleteModal(true);
            }
          }
        ];

        return (
          <div className="flex items-center justify-center">
            <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
              <button className="flex items-center gap-1 px-2.5 py-1 text-[8px] font-black uppercase rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-750 dark:text-zinc-250 transition-all duration-200 cursor-pointer border-0">
                Options
                <ChevronDown size={9} className="opacity-60" />
              </button>
            </Dropdown>
          </div>
        );
      }
    }
  ];

  // Sorting & pagination updates
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
          .ant-progress-circle-path {
            stroke: var(--primary) !important;
          }
        `}</style>

        {/* Page Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Campaigns
              </h1>
              <span className="bg-emerald-500/10 text-emerald-600 text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-emerald-500/20 uppercase tracking-widest animate-pulse">
                Live Console
              </span>
            </div>
            <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-semibold">
              Manage promotional campaigns running across franchise stores.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-zinc-250 dark:border-zinc-800 hover:border-[var(--primary)] hover:text-[var(--primary)] text-zinc-700 dark:text-zinc-200 rounded-lg shadow-sm font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8 bg-transparent"
            >
              <Download size={13} />
              <span>Export</span>
            </button>

            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] hover:opacity-95 text-white border-0 rounded-lg shadow-md font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8"
            >
              <Plus size={14} />
              <span>Create Campaign</span>
            </button>

            <button
              onClick={handleRefresh}
              className="flex items-center justify-center p-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-750 dark:text-zinc-200 rounded-lg shadow-sm border-0 transition-all duration-200 cursor-pointer active:scale-[0.95] h-8 w-8"
              title="Reload data grid"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-[var(--primary)]" : "text-[var(--primary)]"} />
            </button>
          </div>
        </header>

        {/* Dashboard Cards Section */}
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Running Campaigns */}
          <Card size="small" className="shadow-xs border border-emerald-500/20 bg-emerald-50/15 dark:bg-emerald-950/5 rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Running Campaigns
                  <Tooltip title="Campaigns currently running and active.">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-lg font-black text-emerald-600">
                      {dashboardStats.runningCampaigns}
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.runningChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 shrink-0">
                <Play size={14} fill="currentColor" />
              </div>
            </div>
          </Card>

          {/* Scheduled Campaigns */}
          <Card size="small" className="shadow-xs border border-blue-500/20 bg-blue-50/15 dark:bg-blue-950/5 rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Scheduled Campaigns
                  <Tooltip title="Draft or scheduled campaigns awaiting publishing.">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-lg font-black text-blue-600">
                      {dashboardStats.scheduledCampaigns}
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-blue-650 bg-blue-50 dark:bg-blue-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.scheduledChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-500 shrink-0">
                <Calendar size={14} />
              </div>
            </div>
          </Card>

          {/* Campaign Revenue */}
          <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Campaign Revenue
                  <Tooltip title="Aggregate revenue generated from orders matching these campaigns.">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-[14px] font-black text-emerald-600">
                      {formatCurrency(dashboardStats.campaignRevenue)}
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.revenueChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-zinc-650 shrink-0">
                <IndianRupee size={14} />
              </div>
            </div>
          </Card>

          {/* Average ROI % */}
          <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Average ROI %
                  <Tooltip title="Average return on marketing budgets.">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-lg font-black text-[var(--primary)]">
                      {dashboardStats.averageRoi}%
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.roiChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-zinc-650 shrink-0">
                <TrendingUp size={14} />
              </div>
            </div>
          </Card>

          {/* Orders Generated */}
          <Card size="small" className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950" bodyStyle={{ padding: "12px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 dark:text-zinc-500 uppercase text-[8px] font-black tracking-wider flex items-center gap-1">
                  Orders Generated
                  <Tooltip title="Cumulative pizza orders generated.">
                    <HelpCircle size={10} className="text-zinc-350 cursor-help" />
                  </Tooltip>
                </span>
                {loading ? (
                  <Skeleton.Input active size="small" className="mt-1" style={{ width: 80 }} />
                ) : (
                  <div className="flex items-baseline gap-1.5 mt-1">
                    <h3 className="text-lg font-black text-purple-650">
                      {dashboardStats.ordersGenerated?.toLocaleString("en-IN") || 0}
                    </h3>
                    <span className="text-[7.5px] font-extrabold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1 py-0.2 rounded-full leading-none">
                      {dashboardStats.trends.ordersChange}
                    </span>
                  </div>
                )}
              </div>
              <div className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-850 text-zinc-650 shrink-0">
                <ShoppingBag size={14} />
              </div>
            </div>
          </Card>
        </section>

        {/* Sticky Filters Section */}
        <Card className="shadow-xs border border-zinc-200 dark:border-zinc-800 rounded-xl sticky top-0 z-10 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs" bodyStyle={{ padding: "12px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search Campaign */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px] flex items-center gap-0.5">
                <Search size={10} />
                Search Campaign
              </span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search campaign name..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-full text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold h-[32px]"
                />
              </div>
            </div>

            {/* Campaign Type Dropdown */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px]">Campaign Type</span>
              <Select value={typeFilter} onChange={val => setTypeFilter(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Types</Select.Option>
                <Select.Option value="festival">Festival Campaign</Select.Option>
                <Select.Option value="weekend_offer">Weekend Offer</Select.Option>
                <Select.Option value="combo_offer">Combo Offer</Select.Option>
                <Select.Option value="flash_sale">Flash Sale</Select.Option>
              </Select>
            </div>

            {/* Status Dropdown */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px]">Status</span>
              <Select value={statusFilter} onChange={val => setStatusFilter(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Statuses</Select.Option>
                <Select.Option value="Draft">Draft</Select.Option>
                <Select.Option value="Active">Active</Select.Option>
                <Select.Option value="Paused">Paused</Select.Option>
                <Select.Option value="Completed">Completed</Select.Option>
              </Select>
            </div>

            {/* Store Outlets Dropdown */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px]">Target Store Outlet</span>
              <Select 
                value={storeIdFilter} 
                onChange={val => setStoreIdFilter(val)} 
                className="w-full font-semibold h-8.5"
                loading={loadingStores}
              >
                <Select.Option value="All">All Stores</Select.Option>
                {stores.map(s => (
                  <Select.Option key={s._id} value={s._id}>{s.name || s.storeName}</Select.Option>
                ))}
              </Select>
            </div>

            {/* Date limits */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[8px]">Campaign Dates</span>
              <div className="grid grid-cols-2 gap-1.5">
                <input
                  type="date"
                  placeholder="Start"
                  value={startDateFilter || ""}
                  onChange={e => setStartDateFilter(e.target.value || null)}
                  className="px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] font-semibold h-[32px] cursor-pointer"
                />
                <input
                  type="date"
                  placeholder="End"
                  value={endDateFilter || ""}
                  onChange={e => setEndDateFilter(e.target.value || null)}
                  className="px-2 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] font-semibold h-[32px] cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Reset Filters */}
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

        {/* Campaign Data Table */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-black text-xs text-zinc-805 dark:text-zinc-150 uppercase tracking-wider">
              Promotional Campaigns ledger
            </h3>
            <span className="text-[9px] font-bold text-zinc-450">
              Showing {campaigns.length} of {totalRecords} records
            </span>
          </div>

          <Table
            columns={columns}
            dataSource={campaigns}
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
                    src={emptyReportsWebp}
                    alt="No campaigns found"
                    className="w-32 h-32 object-contain mb-3 opacity-60 dark:opacity-40"
                  />
                  <h4 className="font-extrabold text-xs text-zinc-650 dark:text-zinc-350">No Campaigns Available.</h4>
                  <p className="text-[10px] text-zinc-400 max-w-[260px] mt-0.5 leading-normal">
                    {search ? "Try adjusting filters or search queries to locate campaign files." : "Create your first franchise marketing campaign using the wizard."}
                  </p>
                  {!search && (
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="mt-3 px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[9.5px] font-extrabold uppercase rounded-lg border-0 cursor-pointer shadow-md transition-all"
                    >
                      Create Campaign
                    </button>
                  )}
                </div>
              )
            }}
          />

          {/* Table Pagination Footer */}
          {totalRecords > 0 && (
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800 text-[10px] font-semibold text-zinc-400">
              <span>Showing {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} campaigns</span>
              
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

        {/* MODALS */}

        {/* MODALS CONTAINER */}
        <CampaignModals
          showCreateModal={showCreateModal}
          setShowCreateModal={setShowCreateModal}
          showEditModal={showEditModal}
          setShowEditModal={setShowEditModal}
          showPauseModal={showPauseModal}
          setShowPauseModal={setShowPauseModal}
          showResumeModal={showResumeModal}
          setShowResumeModal={setShowResumeModal}
          showDeleteModal={showDeleteModal}
          setShowDeleteModal={setShowDeleteModal}
          showDetailsDrawer={showDetailsDrawer}
          setShowDetailsDrawer={setShowDetailsDrawer}
          selectedCampaign={selectedCampaign}
          setSelectedCampaign={setSelectedCampaign}
          createCampaign={createCampaign}
          updateCampaign={updateCampaign}
          deleteCampaign={deleteCampaign}
          updateCampaignStatus={updateCampaignStatus}
          getCampaignPerformanceDetails={getCampaignPerformanceDetails}
          stores={stores}
        />

      </div>
    </ConfigProvider>
  );
}
