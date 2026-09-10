import React, { useState, useEffect } from "react";
import {
  Card, Table, DatePicker, Select, Tabs, Modal, Tag, Tooltip,
  Dropdown, Pagination, Skeleton, Empty, Result, ConfigProvider, Popconfirm
} from "antd";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell
} from "recharts";
import {
  TrendingDown, TrendingUp, DollarSign, Calendar, RefreshCw,
  Download, Search, Eye, Edit, Trash2, CheckSquare, XSquare,
  AlertCircle, FileText, PieChart as PieIcon, Plus, CheckCircle, Clock
} from "lucide-react";
import { useExpenses } from "./hooks/useExpenses";
import { mockStores } from "./mockData";
import AddExpenseModal from "./components/AddExpenseModal";
import EditExpenseModal from "./components/EditExpenseModal";
import ExpenseDetailsModal from "./components/ExpenseDetailsModal";
import ApproveExpenseModal from "./components/ApproveExpenseModal";
import ExportModal from "./components/ExportModal";
import dayjs from "dayjs";
import { toast } from "sonner";

export default function Expenses() {
  const expenseHook = useExpenses();
  const {
    loading,
    search,
    setSearch,
    category,
    setCategory,
    storeId,
    setStoreId,
    status,
    setStatus,
    dateFilter,
    setDateFilter,
    customRange,
    setCustomRange,
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
    expenseTrendChartData,
    categoryDistributionChartData,
    tableData,
    selectedExpense,
    setSelectedExpense,
    addExpense,
    updateExpense,
    deleteExpense,
    updateExpenseStatus,
    bulkUpdateStatus,
    bulkDelete,
    exportExpensesReport,
    refetch
  } = expenseHook;

  // Local search state for debouncing
  const [localSearch, setLocalSearch] = useState(search);

  // Selected row keys for bulk actions
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Modals Visibility
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isError, setIsError] = useState(false); // simulated error state trigger

  // Debouncing Search Input
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
    }).format(val);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved": return "success";
      case "Rejected": return "error";
      default: return "warning";
    }
  };

  // Columns Configuration
  const columns = [
    {
      title: "Expense No",
      dataIndex: "expenseNumber",
      key: "expenseNumber",
      sorter: true,
      className: "font-bold text-zinc-650"
    },
    {
      title: "Category",
      dataIndex: "category",
      key: "category",
      sorter: true,
      render: cat => (
        <span className="font-bold text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px]">
          {cat}
        </span>
      )
    },
    {
      title: "Store",
      dataIndex: "storeId",
      key: "storeId",
      render: id => {
        const store = mockStores.find(s => s.id === id);
        return <span className="font-medium truncate block max-w-[150px]">{store ? store.name.replace("Papa Veg Pizza - ", "") : "All Stores"}</span>;
      }
    },
    {
      title: "Amount",
      dataIndex: "amount",
      key: "amount",
      sorter: true,
      render: val => <span className="font-extrabold text-rose-600">{formatCurrency(val)}</span>
    },
    {
      title: "Payment Method",
      dataIndex: "paymentMethod",
      key: "paymentMethod",
      render: method => <span className="text-zinc-500 font-semibold">{method}</span>
    },
    {
      title: "Date",
      dataIndex: "expenseDate",
      key: "expenseDate",
      sorter: true
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      sorter: true,
      render: st => (
        <Tag color={getStatusColor(st)} className="font-extrabold text-[9px] uppercase">
          {st}
        </Tag>
      )
    },
    {
      title: "Created By",
      dataIndex: "createdBy",
      key: "createdBy",
      render: user => <span className="text-zinc-600 dark:text-zinc-400 font-semibold">{user}</span>
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
              setSelectedExpense(record);
              setShowDetailsModal(true);
            }
          },
          {
            key: "edit",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <Edit size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Edit Expense</span>
              </span>
            ),
            onClick: () => {
              setSelectedExpense(record);
              setShowEditModal(true);
            }
          },
          ...(record.status === "Pending" ? [{
            key: "approve",
            label: (
              <span className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200 py-1">
                <CheckSquare size={13} className="text-zinc-400 dark:text-zinc-500" />
                <span>Approve / Reject</span>
              </span>
            ),
            onClick: () => {
              setSelectedExpense(record);
              setShowApproveModal(true);
            }
          }] : [])
        ];

        return (
          <div className="flex items-center justify-center gap-1">
            <Dropdown menu={{ items }} placement="bottomRight" trigger={["click"]}>
              <button className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-650 dark:text-zinc-300 transition-all duration-200 cursor-pointer shadow-xs">
                Options
              </button>
            </Dropdown>

            <Popconfirm
              title="Delete Expense"
              description="Are you sure you want to delete this expense? This action cannot be undone."
              onConfirm={() => deleteExpense(record._id)}
              okText="Delete"
              cancelText="Cancel"
              okButtonProps={{ danger: true }}
            >
              <button className="p-1 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer rounded-lg hover:bg-rose-50/50">
                <Trash2 size={13} />
              </button>
            </Popconfirm>
          </div>
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

  // Reset all filters
  const handleResetFilters = () => {
    setLocalSearch("");
    setSearch("");
    setCategory("All");
    setStoreId("All");
    setStatus("All");
    setDateFilter("This Month");
    setCustomRange({ start: null, end: null });
    setCurrentPage(1);
  };

  // Checkbox row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys)
  };

  // Bulk Actions
  const handleBulkApprove = () => {
    toast.promise(
      bulkUpdateStatus(selectedRowKeys, "Approved"),
      {
        loading: "Approving selected expenses...",
        success: () => {
          setSelectedRowKeys([]);
          return "Selected expenses approved successfully.";
        },
        error: "Bulk approval failed."
      }
    );
  };

  const handleBulkReject = () => {
    toast.promise(
      bulkUpdateStatus(selectedRowKeys, "Rejected"),
      {
        loading: "Rejecting selected expenses...",
        success: () => {
          setSelectedRowKeys([]);
          return "Selected expenses rejected successfully.";
        },
        error: "Bulk rejection failed."
      }
    );
  };

  const handleBulkDelete = () => {
    Modal.confirm({
      title: "Delete Selected Expenses",
      content: `Are you sure you want to delete the ${selectedRowKeys.length} selected expenses? This action is permanent and cannot be undone.`,
      okText: "Delete All",
      okType: "danger",
      cancelText: "Cancel",
      onOk: () => {
        toast.promise(
          bulkDelete(selectedRowKeys),
          {
            loading: "Deleting selected expenses...",
            success: () => {
              setSelectedRowKeys([]);
              return "Selected expenses deleted successfully.";
            },
            error: "Bulk deletion failed."
          }
        );
      }
    });
  };

  const handleBulkExport = () => {
    toast.promise(
      new Promise((resolve) => {
        setTimeout(() => {
          exportExpensesReport("CSV", { ids: selectedRowKeys });
          resolve();
        }, 1000);
      }),
      {
        loading: `Exporting ${selectedRowKeys.length} selected records...`,
        success: "Bulk records exported successfully.",
        error: "Export failed."
      }
    );
  };

  if (isError) {
    return (
      <ConfigProvider theme={{ token: { fontFamily: "'Poppins', system-ui, sans-serif" } }}>
        <div className="p-8 min-h-[80vh] flex items-center justify-center bg-slate-50 dark:bg-zinc-950">
          <Result
            status="error"
            title="Unable to load expenses."
            subTitle="A network error occurred while contacting the expenditures backend API. Please retry your query."
            extra={[
              <button
                key="retry"
                onClick={() => {
                  setIsError(false);
                  refetch();
                }}
                className="px-4 py-2 bg-[var(--primary)] hover:opacity-95 text-white font-bold uppercase transition-all rounded-lg cursor-pointer text-xs shadow"
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
        `}</style>

        {/* 1. Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-xs shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
                Expenses
              </h1>
              <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[8px] font-bold px-1.5 py-0.2 rounded-full border border-[var(--primary)]/20 uppercase tracking-widest animate-pulse">
                Audited
              </span>
            </div>
            <p className="text-zinc-450 dark:text-zinc-400 mt-0.5 text-[10px] font-semibold">
              Monitor and approve franchise operational expenses.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center justify-center gap-1 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] hover:opacity-95 text-white rounded-lg shadow-md font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8"
            >
              <Plus size={14} />
              <span>Add Expense</span>
            </button>

            <button
              onClick={() => refetch()}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 rounded-lg shadow-sm font-extrabold transition-all duration-200 cursor-pointer text-[10px] uppercase active:scale-[0.97] h-8"
            >
              <RefreshCw size={12} className={loading ? "animate-spin text-[var(--primary)]" : "text-[var(--primary)]"} />
              <span>Refresh</span>
            </button>

            <button
              className="text-[9px] font-bold text-zinc-450 hover:text-rose-500 cursor-pointer transition-colors"
              onClick={() => setIsError(true)}
              title="Test simulated error page state"
            >
              Trigger Error State
            </button>
          </div>
        </header>

        {/* 2. KPI Cards Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">

          {/* Card 1: Total Expenses */}
          <Card size="small" className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 uppercase text-[9px] font-black tracking-wider">Total Expenses</span>
                <h3 className="text-2xl font-black text-rose-600 mt-1">
                  {formatCurrency(kpis.totalExpenses)}
                </h3>
                <span className="text-[10px] text-zinc-450 block mt-0.5">Overall expenditure</span>
              </div>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-500">
                <TrendingDown size={18} />
              </div>
            </div>
          </Card>

          {/* Card 2: Pending Approvals */}
          <Card size="small" className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-zinc-400 uppercase text-[9px] font-black tracking-wider">Pending Approvals</span>
                <h3 className="text-2xl font-black text-amber-500 mt-1">
                  {kpis.pendingApprovals}
                </h3>
                <span className="text-[10px] text-zinc-450 block mt-0.5">Awaiting audit resolution</span>
              </div>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-500">
                <Clock size={18} />
              </div>
            </div>
          </Card>

          {/* Card 3: Monthly Expense (Blue Card) */}
          <Card
            size="small"
            className="shadow-xs border rounded-xl bg-blue-650 text-white"
            bodyStyle={{ padding: "16px" }}
            style={{ backgroundColor: "#2563eb", borderColor: "#1d4ed8" }}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-blue-200 uppercase text-[9px] font-black tracking-wider">Monthly Expense</span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {formatCurrency(kpis.monthlyExpense)}
                </h3>
                <span className="text-[10px] text-blue-100 block mt-0.5">Current month total</span>
              </div>
              <div className="p-2 rounded-lg bg-white/20 text-white">
                <TrendingUp size={18} />
              </div>
            </div>
          </Card>

          {/* Card 4: Average Expense (Purple Card) */}
          <Card
            size="small"
            className="shadow-xs border rounded-xl bg-purple-650 text-white"
            bodyStyle={{ padding: "16px" }}
            style={{ backgroundColor: "#7c3aed", borderColor: "#6d28d9" }}
          >
            <div className="flex justify-between items-start">
              <div>
                <span className="text-purple-200 uppercase text-[9px] font-black tracking-wider">Average Expense</span>
                <h3 className="text-2xl font-black text-white mt-1">
                  {formatCurrency(kpis.averageExpense)}
                </h3>
                <span className="text-[10px] text-purple-100 block mt-0.5">Expense / Total Records</span>
              </div>
              <div className="p-2 rounded-lg bg-white/20 text-white">
                <DollarSign size={18} />
              </div>
            </div>
          </Card>

        </section>

        {/* 3. Analytics Section (Charts) */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Trend Chart */}
          <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1.5 uppercase">
                  <TrendingDown size={14} className="text-rose-500" />
                  Expense Trend Chart
                </h3>
                <span className="text-[8px] font-bold text-zinc-400 uppercase">Daily & Monthly Expenditures tracking</span>
              </div>
            </div>

            <div className="h-[220px] w-full mt-1">
              {loading ? (
                <Skeleton active paragraph={{ rows: 5 }} />
              ) : expenseTrendChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={expenseTrendChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <XAxis dataKey="formattedDate" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", fontSize: "10px" }}
                      formatter={(v) => [formatCurrency(v), "Expense Amount"]}
                    />
                    <Line type="monotone" dataKey="amount" stroke="#e11d48" strokeWidth={2.2} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No trend data available." />
                </div>
              )}
            </div>
          </Card>

          {/* Category Distribution Chart */}
          <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 flex items-center gap-1.5 uppercase">
                  <PieIcon size={14} className="text-[var(--primary)]" />
                  Category Distribution Chart
                </h3>
                <span className="text-[8px] font-bold text-zinc-400 uppercase">Proportional operational expense categories</span>
              </div>
            </div>

            {loading ? (
              <Skeleton active paragraph={{ rows: 5 }} />
            ) : categoryDistributionChartData.length > 0 ? (
              <div className="grid grid-cols-5 gap-3 items-center">
                <div className="col-span-2 h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <PieChart>
                      <Pie
                        data={categoryDistributionChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryDistributionChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={v => [formatCurrency(v), "Amount"]} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="col-span-3 space-y-1.5 max-h-[200px] overflow-y-auto pr-1">
                  {categoryDistributionChartData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center p-1 border rounded-lg bg-zinc-50/50 dark:bg-zinc-900/40 text-[10px]">
                      <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-650 truncate max-w-[100px]">
                        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                        <span className="truncate">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-zinc-800 dark:text-zinc-150">{formatCurrency(item.value)}</span>
                        <span className="text-[8px] font-bold text-zinc-450 block">{item.pct}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-[200px] flex items-center justify-center">
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No categories data available." />
              </div>
            )}
          </Card>

        </section>

        {/* 4. Bulk Actions Floating Toolbar */}
        {selectedRowKeys.length > 0 && (
          <div className="flex items-center justify-between p-3 bg-zinc-900 text-white rounded-xl shadow-lg animate-fade-up sticky bottom-4 z-50">
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <CheckSquare size={14} className="text-[var(--primary)]" />
              <span>{selectedRowKeys.length} selected row(s)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleBulkApprove}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[9px] uppercase rounded-lg transition-colors cursor-pointer"
              >
                Approve Selected
              </button>
              <button
                onClick={handleBulkReject}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[9px] uppercase rounded-lg transition-colors cursor-pointer"
              >
                Reject Selected
              </button>
              <button
                onClick={handleBulkDelete}
                className="px-3 py-1.5 bg-zinc-700 hover:bg-zinc-800 text-white font-bold text-[9px] uppercase rounded-lg transition-colors cursor-pointer"
              >
                Delete Selected
              </button>
              <button
                onClick={handleBulkExport}
                className="px-3 py-1.5 bg-[var(--primary)] hover:opacity-95 text-white font-bold text-[9px] uppercase rounded-lg transition-all cursor-pointer"
              >
                Export Selected
              </button>
              <div className="border-l h-5 border-zinc-700 mx-1"></div>
              <button
                onClick={() => setSelectedRowKeys([])}
                className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* 5. Global Filters Card */}
        <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Search Box */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Search Database</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="Search Expense No, Description..."
                  value={localSearch}
                  onChange={e => setLocalSearch(e.target.value)}
                  className="pl-9 pr-4 py-2 w-full text-xs rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold h-[34px]"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Expense Category</span>
              <Select value={category} onChange={val => setCategory(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Categories</Select.Option>
                <Select.Option value="Inventory">Inventory</Select.Option>
                <Select.Option value="Salary">Salary</Select.Option>
                <Select.Option value="Maintenance">Maintenance</Select.Option>
                <Select.Option value="Electricity">Electricity</Select.Option>
                <Select.Option value="Gas">Gas</Select.Option>
                <Select.Option value="Marketing">Marketing</Select.Option>
                <Select.Option value="Refund">Refund</Select.Option>
                <Select.Option value="Delivery">Delivery</Select.Option>
                <Select.Option value="Miscellaneous">Miscellaneous</Select.Option>
              </Select>
            </div>

            {/* Store Filter */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Store Outlet</span>
              <Select value={storeId} onChange={val => setStoreId(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Store Outlets</Select.Option>
                {mockStores.map(s => (
                  <Select.Option key={s.id} value={s.id}>{s.name}</Select.Option>
                ))}
              </Select>
            </div>

            {/* Status Filter */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Approval Status</span>
              <Select value={status} onChange={val => setStatus(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="All">All Statuses</Select.Option>
                <Select.Option value="Pending">Pending</Select.Option>
                <Select.Option value="Approved">Approved</Select.Option>
                <Select.Option value="Rejected">Rejected</Select.Option>
              </Select>
            </div>

            {/* Date Range Preset Selector */}
            <div className="flex flex-col gap-1">
              <span className="font-bold text-zinc-400 uppercase text-[9px]">Date Interval</span>
              <Select value={dateFilter} onChange={val => setDateFilter(val)} className="w-full font-semibold h-8.5">
                <Select.Option value="Today">Today</Select.Option>
                <Select.Option value="Last 7 Days">Last 7 Days</Select.Option>
                <Select.Option value="This Month">This Month</Select.Option>
                <Select.Option value="Custom">Custom Range</Select.Option>
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

          {/* Reset Filters Option */}
          <div className="flex justify-end mt-2">
            <button
              onClick={handleResetFilters}
              className="text-[10px] font-bold p-0 flex items-center gap-1 text-[var(--primary)] hover:underline cursor-pointer bg-transparent border-0"
            >
              Reset Filters
            </button>
          </div>
        </Card>

        {/* 6. Expenses Table Section */}
        <Card className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-extrabold text-xs text-zinc-800 dark:text-zinc-150 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-[var(--primary)]" />
              Expenses Log Ledger
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center gap-1 px-3 py-1.5 text-[9.5px] font-black uppercase rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all duration-200 cursor-pointer shadow-xs"
              >
                <Download size={12} />
                <span>Export Report</span>
              </button>
              <span className="text-[9px] font-bold text-zinc-450">
                Showing {tableData.length} of {totalRecords} records
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
                <div className="py-6 flex flex-col items-center justify-center">
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No expenses found." />
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-3 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold text-[10px] uppercase rounded-lg cursor-pointer shadow"
                  >
                    Add Expense
                  </button>
                </div>
              )
            }}
          />

          {/* Server-side style Pagination */}
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

        {/* 7. Modals Mounting */}
        <AddExpenseModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={addExpense}
          mockStores={mockStores}
        />

        <EditExpenseModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
          onUpdate={updateExpense}
          mockStores={mockStores}
        />

        <ExpenseDetailsModal
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
          mockStores={mockStores}
          onApprove={(id) => {
            setShowDetailsModal(false);
            setShowApproveModal(true);
          }}
          onReject={(id) => {
            setShowDetailsModal(false);
            setShowApproveModal(true);
          }}
          onEdit={(exp) => {
            setShowDetailsModal(false);
            setShowEditModal(true);
          }}
        />

        <ApproveExpenseModal
          isOpen={showApproveModal}
          onClose={() => {
            setShowApproveModal(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
          mockStores={mockStores}
          onSubmitDecision={updateExpenseStatus}
        />

        <Modal
        // Delete confirmation handled inline via Table Popconfirm component, this is a clean fallback wrapper
        />

        <ExportModal
          isOpen={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={exportExpensesReport}
          mockStores={mockStores}
        />

      </div>
    </ConfigProvider>
  );
}
