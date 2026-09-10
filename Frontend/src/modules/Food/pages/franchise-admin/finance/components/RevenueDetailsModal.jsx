import React from "react";
import { Modal, Tabs, Card, Table, Skeleton, Progress, Tag } from "antd";
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, Legend, PieChart, Pie, Cell
} from "recharts";
import {
  DollarSign, ShoppingBag, ArrowUpRight, TrendingUp,
  AlertTriangle, Truck, Award, Percent, Download, X
} from "lucide-react";

export default function RevenueDetailsModal({ isOpen, onClose, recordId, recordDetails, loading, onExport }) {
  if (loading) {
    return (
      <Modal open={isOpen} onCancel={onClose} width={1200} footer={null}>
        <div className="p-6 space-y-6">
          <style>{`
            .ant-modal {
              font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
            }
          `}</style>
          <Skeleton active paragraph={{ rows: 2 }} />
          <div className="grid grid-cols-4 gap-4">
            <Skeleton.Button active size="large" block />
            <Skeleton.Button active size="large" block />
            <Skeleton.Button active size="large" block />
            <Skeleton.Button active size="large" block />
          </div>
          <Skeleton active paragraph={{ rows: 6 }} />
        </div>
      </Modal>
    );
  }

  if (!recordDetails) return null;

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  // Helper to format Rupees
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val);
  };

  // Top Products Table Column Config
  const productColumns = [
    { title: "Product Name", dataIndex: "name", key: "name", className: "font-bold text-zinc-700" },
    { title: "Quantity Sold", dataIndex: "quantity", key: "quantity", render: val => <span>{val} pcs</span> },
    { title: "Revenue Generated", dataIndex: "revenue", key: "revenue", render: val => <span className="font-extrabold text-emerald-600">{formatCurrency(val)}</span> },
    {
      title: "Contribution %",
      dataIndex: "contribution",
      key: "contribution",
      render: val => (
        <div className="flex items-center gap-2">
          <Progress percent={val} size="small" strokeColor="var(--primary)" showInfo={false} className="w-16" />
          <span className="font-bold">{val}%</span>
        </div>
      )
    }
  ];

  // Store Contribution Columns
  const storeColumns = [
    { title: "Store Outlet", dataIndex: "name", key: "name", className: "font-bold text-zinc-700" },
    { title: "Orders", dataIndex: "orders", key: "orders" },
    { title: "Revenue", dataIndex: "revenue", key: "revenue", render: val => <span className="font-extrabold text-blue-600">{formatCurrency(val)}</span> },
    { title: "Profit Earned", dataIndex: "profit", key: "profit", render: val => <span className="font-extrabold text-emerald-600">{formatCurrency(val)}</span> },
    { title: "Share %", dataIndex: "pct", key: "pct", render: val => <Tag color="purple" className="font-bold">{val}%</Tag> }
  ];

  // Refunds Columns
  const refundColumns = [
    { title: "Refund ID", dataIndex: "id", key: "id", className: "font-bold text-zinc-500" },
    { title: "Order ID", dataIndex: "orderId", key: "orderId", className: "font-bold text-zinc-700" },
    { title: "Reason", dataIndex: "reason", key: "reason" },
    { title: "Amount", dataIndex: "amount", key: "amount", render: val => <span className="font-bold text-rose-500">{formatCurrency(val)}</span> },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: val => (
        <Tag color={val === "Completed" || val === "Refunded" ? "green" : val === "Pending" ? "orange" : "red"}>
          {val}
        </Tag>
      )
    },
    { title: "Processed By", dataIndex: "processedBy", key: "processedBy" },
    { title: "Date", dataIndex: "date", key: "date" }
  ];

  const overviewCards = [
    { title: "Total Sales", val: `${recordDetails.totalOrders} Orders`, sub: "Completed Orders", icon: ShoppingBag, color: "border-blue-500 text-blue-600 bg-blue-50/50" },
    { title: "Gross Revenue", val: formatCurrency(recordDetails.grossRevenue), sub: "Total base sales", icon: DollarSign, color: "border-emerald-500 text-emerald-600 bg-emerald-50/50" },
    { title: "Discount Deductions", val: formatCurrency(recordDetails.discountAmount), sub: "Coupon discount impact", icon: Percent, color: "border-amber-500 text-amber-600 bg-amber-50/50" },
    { title: "Refund Adjustments", val: formatCurrency(recordDetails.refundAmount), sub: "Loss due to cancel/refund", icon: AlertTriangle, color: "border-rose-500 text-rose-600 bg-rose-50/50" },
    { title: "Taxes Collected", val: formatCurrency(recordDetails.taxCollected), sub: "5% GST collected", icon: Award, color: "border-purple-500 text-purple-600 bg-purple-50/50" },
    { title: "Delivery Charges", val: formatCurrency(recordDetails.deliveryCharges), sub: "Total courier earnings", icon: Truck, color: "border-cyan-500 text-cyan-600 bg-cyan-50/50" },
    { title: "Net Revenue", val: formatCurrency(recordDetails.netRevenue), sub: "Post adjustment sales", icon: TrendingUp, color: "border-indigo-500 text-indigo-600 bg-indigo-50/50" },
    { title: "Franchise Profit", val: formatCurrency(recordDetails.totalProfit), sub: "Net take home earnings", icon: ArrowUpRight, color: "border-emerald-600 text-emerald-700 bg-emerald-100/30" }
  ];

  // Tabs structure
  const tabItems = [
    {
      key: "overview",
      label: <span className="font-extrabold uppercase text-[10px]">Overview</span>,
      children: (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-3">
          {overviewCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Card
                key={i}
                className={`border-l-4 shadow-xs rounded-xl ${c.color} overflow-hidden`}
                bodyStyle={{ padding: "16px" }}
              >
                <div className="flex justify-between items-center">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-zinc-550 truncate">{c.title}</p>
                    <p className="text-lg font-black mt-1 text-zinc-800 dark:text-zinc-100">{c.val}</p>
                    <p className="text-[8px] text-zinc-400 mt-0.5 truncate">{c.sub}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white shadow-xs">
                    <Icon size={16} className="stroke-[2.2]" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )
    },
    {
      key: "products",
      label: <span className="font-extrabold uppercase text-[10px]">Top Products</span>,
      children: (
        <div className="space-y-6 py-2">
          {/* Bar Chart */}
          <div className="h-[220px] bg-slate-50 dark:bg-zinc-950 p-3 border rounded-xl shadow-inner">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <BarChart data={recordDetails.topProducts.slice(0, 5)} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                <RechartsTooltip formatter={v => [formatCurrency(v), "Revenue"]} />
                <Bar dataKey="revenue" fill="var(--primary)" radius={[6, 6, 0, 0]} barSize={40}>
                  {recordDetails.topProducts.slice(0, 5).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Table */}
          <Table
            columns={productColumns}
            dataSource={recordDetails.topProducts}
            rowKey="name"
            pagination={{ pageSize: 5 }}
            size="small"
            bordered
          />
        </div>
      )
    },
    {
      key: "stores",
      label: <span className="font-extrabold uppercase text-[10px]">Store Contribution</span>,
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-2">
          {/* Pie Chart Column */}
          <div className="lg:col-span-1 flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 border p-4 rounded-xl shadow-inner">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Revenue Share</h4>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={recordDetails.storeContribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="revenue"
                  >
                    {recordDetails.storeContribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={v => [formatCurrency(v), "Revenue"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {recordDetails.storeContribution.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Table Column */}
          <div className="lg:col-span-2">
            <Table
              columns={storeColumns}
              dataSource={recordDetails.storeContribution}
              rowKey="name"
              pagination={false}
              size="small"
              bordered
            />
          </div>
        </div>
      )
    },
    {
      key: "payments",
      label: <span className="font-extrabold uppercase text-[10px]">Payment Breakdown</span>,
      children: (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-2">
          {/* Cards Column */}
          <div className="lg:col-span-2 grid grid-cols-2 gap-4">
            {recordDetails.paymentBreakdown.map((pay, i) => (
              <Card key={i} className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-[10px] font-bold text-zinc-450 uppercase">{pay.method}</h5>
                    <p className="text-base font-black text-zinc-800 dark:text-zinc-100 mt-1">{formatCurrency(pay.amount)}</p>
                    <p className="text-[9px] text-zinc-400 mt-0.5">{pay.count} successful orders</p>
                  </div>
                  <Tag color="cyan" className="font-extrabold">{pay.pct}%</Tag>
                </div>
                <Progress percent={pay.pct} size="small" strokeColor={pay.color} className="mt-3" />
              </Card>
            ))}
          </div>
          {/* Doughnut Chart Column */}
          <div className="lg:col-span-1 flex flex-col justify-center items-center bg-slate-50 dark:bg-zinc-950 border p-4 rounded-xl shadow-inner">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Payment Channels</h4>
            <div className="h-[200px] w-full relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <PieChart>
                  <Pie
                    data={recordDetails.paymentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="amount"
                  >
                    {recordDetails.paymentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={v => [formatCurrency(v), "Amount"]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-3">
              {recordDetails.paymentBreakdown.map((item, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[9px] font-bold">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                  <span>{item.method.replace(" Transactions", "").replace(" Payments", "").replace(" Deductions", "")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "refunds",
      label: <span className="font-extrabold uppercase text-[10px]">Refund Summary</span>,
      children: (
        <div className="py-2">
          <Table
            columns={refundColumns}
            dataSource={recordDetails.refundSummary}
            rowKey="id"
            pagination={{ pageSize: 5 }}
            size="small"
            bordered
          />
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-3.5 pr-10">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm uppercase text-zinc-800 dark:text-white tracking-wider">
                Franchise Revenue Details
              </h3>
              <Tag color="geekblue" className="font-extrabold">{recordDetails.date}</Tag>
            </div>
            <p className="text-[10px] text-zinc-400 mt-0.5 font-bold uppercase">{recordDetails.storeName}</p>
          </div>
          <button
            onClick={() => onExport("PDF", {})}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] text-white hover:opacity-95 rounded-lg shadow-sm font-bold uppercase transition-all cursor-pointer text-[10px] mr-2"
          >
            <Download size={13} />
            <span>Export Day Summary</span>
          </button>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      closeIcon={<X size={16} />}
      width={1200}
      footer={[
        <button
          key="close"
          onClick={onClose}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-305 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer text-xs"
        >
          Close Details
        </button>
      ]}
    >
      <div className="py-4">
        <style>{`
          .ant-modal, .ant-modal-title, .ant-tabs, .ant-tabs-tab-btn, .ant-card, .ant-table, .ant-table-cell, .ant-tag, .ant-progress-text {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
        `}</style>
        <Tabs defaultActiveKey="overview" items={tabItems} className="font-semibold" />
      </div>
    </Modal>
  );
}
