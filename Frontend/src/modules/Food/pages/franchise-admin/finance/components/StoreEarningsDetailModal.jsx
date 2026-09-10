import React from "react";
import { Modal, Tabs, Card, Table, Tag } from "antd";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from "recharts";
import {
  TrendingUp,
  ShoppingBag,
  Percent,
  TrendingDown,
  Info,
  DollarSign,
  PieChart as PieIcon,
  BarChart2 as BarIcon,
  RotateCcw,
  Clock,
  Activity,
  X
} from "lucide-react";

export default function StoreEarningsDetailModal({
  isOpen,
  onClose,
  storeDetails,
  onOpenProfitAnalysis,
  onExport
}) {
  // Format Currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (!storeDetails) return null;

  const {
    storeName,
    city,
    totalOrders,
    grossSales,
    discounts,
    refunds,
    expenses,
    netProfit,
    margin,
    aov,
    expensesBreakdown,
    productPerformance,
    refundRequests,
    ordersAnalysis
  } = storeDetails;

  // 1. Overview Tab Content
  const overviewCards = [
    { title: "Store Name", value: storeName, sub: `City: ${city}`, icon: Info, color: "text-blue-500 bg-blue-50" },
    { title: "Total Orders", value: totalOrders, sub: "Completed order count", icon: ShoppingBag, color: "text-indigo-500 bg-indigo-50" },
    { title: "Gross Sales", value: formatCurrency(grossSales), sub: "Sales before deductions", icon: DollarSign, color: "text-emerald-500 bg-emerald-50" },
    { title: "Discounts", value: formatCurrency(discounts), sub: "Coupon campaign deductions", icon: Percent, color: "text-amber-500 bg-amber-50" },
    { title: "Refunds Issued", value: formatCurrency(refunds), sub: "Customer refund claims", icon: RotateCcw, color: "text-red-500 bg-red-50" },
    { title: "Total Expenses", value: formatCurrency(expenses), sub: "Store operating expenditures", icon: TrendingDown, color: "text-orange-500 bg-orange-50" },
    { title: "Net Profit", value: formatCurrency(netProfit), sub: "Take-home store profit", icon: TrendingUp, color: `text-emerald-600 ${netProfit >= 0 ? 'bg-emerald-50' : 'bg-rose-50 text-rose-600'}` },
    { title: "Profit Margin", value: `${margin}%`, sub: "Profit / Gross Sales Ratio", icon: Percent, color: "text-purple-500 bg-purple-50" },
    { title: "Avg Order Value", value: formatCurrency(aov), sub: "AOV for this store", icon: DollarSign, color: "text-cyan-500 bg-cyan-50" }
  ];

  // 2. Revenue Breakdown Tab Data
  const netSales = grossSales - discounts - refunds;
  const revenueChartData = [
    { name: "Net Sales", value: Math.max(0, netSales), color: "#10b981" },
    { name: "Coupon Discounts", value: discounts, color: "#f59e0b" },
    { name: "Refunds Deducted", value: refunds, color: "#ef4444" }
  ];

  // 3. Expense Breakdown Tab Columns
  const expenseColumns = [
    { title: "Category", dataIndex: "category", key: "category", className: "font-bold text-zinc-650" },
    { title: "Amount", dataIndex: "amount", key: "amount", render: val => <span className="font-semibold text-rose-600">{formatCurrency(val)}</span> },
    { title: "Percentage Share", dataIndex: "pct", key: "pct", render: val => <span className="font-semibold">{val}%</span> }
  ];

  const expenseChartColors = ["#ef4444", "#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ec4899", "#6b7280"];

  // 4. Product Performance Tab Columns
  const productColumns = [
    { title: "Product Name", dataIndex: "product", key: "product", className: "font-semibold text-zinc-700" },
    { title: "Quantity Sold", dataIndex: "quantity", key: "quantity", align: "center", className: "font-bold text-zinc-500" },
    { title: "Revenue", dataIndex: "revenue", key: "revenue", render: val => <span className="font-semibold text-emerald-600">{formatCurrency(val)}</span> },
    { title: "Contribution Share", dataIndex: "contribution", key: "contribution", render: val => <span className="font-semibold">{val}%</span> }
  ];

  // 5. Refund Requests Columns
  const refundColumns = [
    { title: "Refund ID", dataIndex: "refundId", key: "refundId", className: "font-bold" },
    { title: "Amount", dataIndex: "amount", key: "amount", render: val => <span className="font-extrabold text-rose-600">{formatCurrency(val)}</span> },
    { title: "Reason", dataIndex: "reason", key: "reason", className: "text-zinc-500 max-w-xs truncate" },
    { title: "Request Date", dataIndex: "date", key: "date" }
  ];

  const refundRate = grossSales > 0 ? (refunds / grossSales) * 100 : 0;

  // 6. Orders Analysis Charts Data
  const orderTypeData = ordersAnalysis.orderTypeDistribution;

  const tabsItems = [
    {
      key: "overview",
      label: "Overview",
      children: (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
          {overviewCards.map((c, i) => {
            const Icon = c.icon;
            return (
              <Card key={i} size="small" className="shadow-xs border rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-zinc-400 uppercase text-[9px] font-black tracking-wider">{c.title}</span>
                    <h3 className="text-xl font-black mt-1 text-zinc-800 dark:text-zinc-100">{c.value}</h3>
                    <span className="text-[10px] text-zinc-400 block mt-0.5 font-semibold">{c.sub}</span>
                  </div>
                  <div className={`p-2 rounded-lg ${c.color}`}>
                    <Icon size={16} />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )
    },
    {
      key: "revenue",
      label: "Revenue Breakdown",
      children: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center pt-2">
          <div className="md:col-span-2 flex flex-col gap-3">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider">Revenue Breakdown metrics</h4>
            <div className="space-y-2">
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center">
                <div>
                  <p className="font-bold text-zinc-850 dark:text-zinc-150">Gross Sales</p>
                  <span className="text-[9px] text-zinc-400">Total bills before discounts</span>
                </div>
                <span className="font-black text-blue-600 text-sm">{formatCurrency(grossSales)}</span>
              </div>
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center">
                <div>
                  <p className="font-bold text-zinc-850 dark:text-zinc-150">Coupon Discounts</p>
                  <span className="text-[9px] text-zinc-400">Discounts and store coupons</span>
                </div>
                <span className="font-black text-amber-500 text-sm">-{formatCurrency(discounts)}</span>
              </div>
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-center">
                <div>
                  <p className="font-bold text-zinc-850 dark:text-zinc-150">Refunds Claims</p>
                  <span className="text-[9px] text-zinc-400">Disbursed returns to client</span>
                </div>
                <span className="font-black text-rose-500 text-sm">-{formatCurrency(refunds)}</span>
              </div>
              <div className="p-3 border rounded-xl bg-emerald-500/5 flex justify-between items-center border-l-4 border-l-emerald-500">
                <div>
                  <p className="font-black text-emerald-800 dark:text-emerald-400">Net Sales</p>
                  <span className="text-[9px] text-zinc-400 font-semibold">Post deductions net sales</span>
                </div>
                <span className="font-black text-emerald-600 text-sm">{formatCurrency(netSales)}</span>
              </div>
            </div>
          </div>
          <div className="md:col-span-3 h-[250px] w-full p-4 border rounded-xl relative">
            <span className="font-bold text-zinc-400 uppercase text-[9px] mb-2 block text-center">Revenue Split Doughnut</span>
            <ResponsiveContainer width="100%" height="85%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={revenueChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {revenueChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={v => [formatCurrency(v), "Revenue"]} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex gap-4 text-[9px] font-bold mt-2">
              {revenueChartData.map((entry, idx) => (
                <span key={idx} className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                  {entry.name}: {formatCurrency(entry.value)}
                </span>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      key: "expenses",
      label: "Expense Breakdown",
      children: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-center pt-2">
          <div className="md:col-span-3">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider mb-2.5">Store Expenditure Ledger</h4>
            <Table
              dataSource={expensesBreakdown}
              columns={expenseColumns}
              rowKey="category"
              pagination={false}
              size="small"
              bordered
            />
          </div>
          <div className="md:col-span-2 h-[250px] w-full p-4 border rounded-xl relative">
            <span className="font-bold text-zinc-400 uppercase text-[9px] mb-2 block text-center">Expense Categories Pie</span>
            <ResponsiveContainer width="100%" height="80%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={expensesBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="amount"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  labelLine={false}
                >
                  {expensesBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={expenseChartColors[index % expenseChartColors.length]} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={v => [formatCurrency(v), "Expenses"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },
    {
      key: "products",
      label: "Product Performance",
      children: (
        <div className="space-y-5 pt-2">
          {/* Bar Chart above */}
          <div className="p-4 border rounded-xl shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <BarIcon size={14} className="text-[var(--primary)]" />
                Top Product Revenues
              </h4>
              <span className="text-[8px] text-zinc-400 uppercase font-bold">Store distribution share</span>
            </div>
            <div className="h-[180px] w-full mt-1 relative">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                <BarChart data={productPerformance.slice(0, 5)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <XAxis dataKey="product" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", fontSize: "10px" }}
                    formatter={v => [formatCurrency(v), "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="var(--primary)" radius={[4, 4, 0, 0]}>
                    {productPerformance.slice(0, 5).map((entry, idx) => (
                      <Cell key={`cell-${idx}`} fill={idx === 0 ? "#10b981" : "var(--primary)"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider mb-2">Top 10 Selling Products List</h4>
            <Table
              dataSource={productPerformance}
              columns={productColumns}
              rowKey="product"
              pagination={{ pageSize: 5 }}
              size="small"
              bordered
            />
          </div>
        </div>
      )
    },
    {
      key: "refunds",
      label: "Refund Analysis",
      children: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-2">
          <div className="md:col-span-2 flex flex-col gap-4">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider">Refund Summary Metrics</h4>
            
            <div className="grid grid-cols-2 gap-3">
              <Card size="small" className="border shadow-xs rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex flex-col">
                  <span className="text-zinc-400 uppercase text-[9px] font-black tracking-wider">Total Refunds</span>
                  <h3 className="text-xl font-black text-rose-500 mt-1">{formatCurrency(refunds)}</h3>
                  <span className="text-[8px] text-zinc-400 block mt-0.5">Claims cleared</span>
                </div>
              </Card>

              <Card size="small" className="border shadow-xs rounded-xl" bodyStyle={{ padding: "16px" }}>
                <div className="flex flex-col">
                  <span className="text-zinc-400 uppercase text-[9px] font-black tracking-wider">Refund Rate %</span>
                  <h3 className="text-xl font-black text-rose-500 mt-1">{refundRate.toFixed(2)}%</h3>
                  <span className="text-[8px] text-zinc-400 block mt-0.5">Refund / Gross sales</span>
                </div>
              </Card>
            </div>

            <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-xl space-y-2">
              <p className="font-bold text-rose-700 text-[10px] uppercase">Audit Action Needed</p>
              <p className="text-[9.5px] leading-normal text-zinc-600 dark:text-zinc-400">
                Any refund rate above 2% requires mandatory audits of kitchen deliveries and delivery boy dispatch delays to prevent leakage.
              </p>
            </div>
          </div>

          <div className="md:col-span-3">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider mb-2">Detailed Refunds Log</h4>
            <Table
              dataSource={refundRequests}
              columns={refundColumns}
              rowKey="refundId"
              pagination={{ pageSize: 5 }}
              size="small"
              bordered
              locale={{ emptyText: "No refunds requests found for this store." }}
            />
          </div>
        </div>
      )
    },
    {
      key: "orders",
      label: "Orders Analysis",
      children: (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-2">
          <div className="md:col-span-2 flex flex-col gap-3">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider">Order Volumes & Statistics</h4>
            
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Total Orders</span>
                <span className="text-base font-black text-indigo-700 mt-1 block">{ordersAnalysis.totalOrders}</span>
              </div>
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Completed</span>
                <span className="text-base font-black text-emerald-600 mt-1 block">{ordersAnalysis.completedOrders}</span>
              </div>
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Cancelled</span>
                <span className="text-base font-black text-rose-500 mt-1 block">{ordersAnalysis.cancelledOrders}</span>
              </div>
              <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30">
                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider block">Average Order</span>
                <span className="text-base font-black text-zinc-700 mt-1 block">{formatCurrency(ordersAnalysis.aov)}</span>
              </div>
            </div>

            <div className="p-3 border rounded-xl bg-zinc-50/50 dark:bg-zinc-900/30 flex items-center justify-between mt-1">
              <div>
                <p className="font-bold text-zinc-800 dark:text-zinc-200">Peak Store Hours</p>
                <span className="text-[9px] text-zinc-400">Highest transactions bandwidth</span>
              </div>
              <span className="text-[10px] font-bold text-[var(--primary)] px-2 py-0.5 bg-[var(--primary)]/10 rounded-md border border-[var(--primary)]/15">
                <Clock size={11} className="inline mr-1" /> {ordersAnalysis.peakHours}
              </span>
            </div>
          </div>

          <div className="md:col-span-3 h-[250px] w-full p-4 border rounded-xl relative">
            <span className="font-bold text-zinc-400 uppercase text-[9px] mb-2 block text-center">Order Type Distribution (Delivery vs Dine-in)</span>
            <ResponsiveContainer width="100%" height="80%" minWidth={0} minHeight={0}>
              <PieChart>
                <Pie
                  data={orderTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {orderTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip formatter={v => [v, "Orders"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    }
  ];

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b pb-2 text-zinc-800 dark:text-zinc-100 font-extrabold text-sm uppercase">
          <Activity size={16} className="text-[var(--primary)] animate-pulse" />
          <span>Store Earnings Detail — {storeName} ({city})</span>
          <Tag color={netProfit >= 0 ? "success" : "error"} className="text-[9px] uppercase font-bold ml-2">
            {netProfit >= 0 ? "PROFIT MAKING" : "LOSS MAKING"}
          </Tag>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      closeIcon={<X size={16} />}
      width={1300}
      footer={[
        <button
          key="close"
          onClick={onClose}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer text-xs"
        >
          Close
        </button>,
        <button
          key="profit"
          onClick={() => {
            onClose();
            onOpenProfitAnalysis();
          }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition-colors cursor-pointer text-xs ml-2"
        >
          Profit Analysis
        </button>,
        <button
          key="export"
          onClick={() => {
            onExport("PDF", { storeId });
          }}
          className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 rounded-lg shadow-sm font-bold transition-all cursor-pointer text-xs ml-2"
        >
          Export Store Report
        </button>
      ]}
    >
      <div className="py-2 text-xs font-['Poppins']">
        <style>{`
          .ant-modal, .ant-modal-title, .ant-tabs-tab-btn, .ant-table, .ant-table-cell, .ant-tag {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
        `}</style>
        <Tabs items={tabsItems} className="font-semibold text-xs" />
      </div>
    </Modal>
  );
}
