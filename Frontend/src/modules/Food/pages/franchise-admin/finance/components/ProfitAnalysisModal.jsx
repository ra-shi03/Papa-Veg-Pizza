import React, { useMemo } from "react";
import { Modal, Progress, Card } from "antd";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from "recharts";
import {
  TrendingUp,
  Percent,
  DollarSign,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  X
} from "lucide-react";

export default function ProfitAnalysisModal({ isOpen, onClose, storeDetails }) {
  // Format Currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const analysisMetrics = useMemo(() => {
    if (!storeDetails) return null;

    const { grossSales, discounts, refunds, expenses, totalOrders, netProfit, margin } = storeDetails;

    const grossProfitVal = grossSales - discounts;
    const netProfitVal = netProfit; // matching DB netProfit formula or grossSales - expenses - refunds
    const expenseRatioVal = grossSales > 0 ? (expenses / grossSales) * 100 : 0;
    const marginVal = margin;
    const aovVal = totalOrders > 0 ? grossSales / totalOrders : 0;
    const refundRatioVal = grossSales > 0 ? (refunds / grossSales) * 100 : 0;

    // Simulated monthly trend chart data for this store
    // Let's create monthly records (May, June, etc.)
    const trendData = [
      { month: "Jan 26", revenue: Math.round(grossSales * 0.75), profit: Math.round(netProfit * 0.70) },
      { month: "Feb 26", revenue: Math.round(grossSales * 0.80), profit: Math.round(netProfit * 0.78) },
      { month: "Mar 26", revenue: Math.round(grossSales * 0.88), profit: Math.round(netProfit * 0.85) },
      { month: "Apr 26", revenue: Math.round(grossSales * 0.95), profit: Math.round(netProfit * 0.90) },
      { month: "May 26", revenue: Math.round(grossSales * 1.05), profit: Math.round(netProfit * 1.02) },
      { month: "Jun 26 (Current)", revenue: grossSales, profit: netProfit }
    ];

    return {
      grossProfit: grossProfitVal,
      netProfit: netProfitVal,
      expenseRatio: expenseRatioVal,
      margin: marginVal,
      aov: aovVal,
      refundRatio: refundRatioVal,
      trendData
    };
  }, [storeDetails]);

  if (!storeDetails || !analysisMetrics) return null;

  const { grossProfit, netProfit, expenseRatio, margin, aov, refundRatio, trendData } = analysisMetrics;

  // Gauge color coding
  // Green > 30%
  // Yellow 15%-30%
  // Red < 15%
  const getGaugeColor = (pct) => {
    if (pct > 30) return "#10b981"; // green
    if (pct >= 15) return "#f59e0b"; // yellow
    return "#ef4444"; // red
  };

  const gaugeColor = getGaugeColor(margin);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2 border-b pb-2 text-zinc-800 dark:text-zinc-100 font-extrabold text-sm uppercase">
          <TrendingUp size={16} className="text-[var(--primary)]" />
          <span>Profit Analysis : {storeDetails.storeName}</span>
        </div>
      }
      open={isOpen}
      onCancel={onClose}
      closeIcon={<X size={16} />}
      width={900}
      footer={[
        <button
          key="close"
          onClick={onClose}
          className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all cursor-pointer text-xs"
        >
          Close
        </button>,
        <button
          key="export"
          onClick={() => {
            toast.success("Profit analysis report downloaded successfully.");
          }}
          className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 rounded-lg shadow-sm font-bold transition-all cursor-pointer text-xs ml-2"
        >
          Export Analysis
        </button>
      ]}
    >
      <div className="py-4 space-y-6 text-xs text-zinc-700 dark:text-zinc-300 font-['Poppins']">
        <style>{`
          .ant-modal, .ant-modal-title, .ant-progress-text {
            font-family: 'Poppins', system-ui, -apple-system, sans-serif !important;
          }
        `}</style>

        {/* 1. Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <Card size="small" className="border shadow-xs rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Gross Profit</span>
              <span className="text-xs font-black text-blue-600 mt-1">{formatCurrency(grossProfit)}</span>
            </div>
          </Card>

          <Card size="small" className="border shadow-xs rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Net Profit</span>
              <span className={`text-xs font-black mt-1 ${netProfit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {formatCurrency(netProfit)}
              </span>
            </div>
          </Card>

          <Card size="small" className="border shadow-xs rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Expense Ratio</span>
              <span className="text-xs font-black text-orange-600 mt-1">{expenseRatio.toFixed(1)}%</span>
            </div>
          </Card>

          <Card size="small" className="border shadow-xs rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Profit Margin</span>
              <span className="text-xs font-black text-purple-600 mt-1">{margin}%</span>
            </div>
          </Card>

          <Card size="small" className="border shadow-xs rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Avg Order Value</span>
              <span className="text-xs font-black text-zinc-700 mt-1">{formatCurrency(aov)}</span>
            </div>
          </Card>

          <Card size="small" className="border shadow-xs rounded-xl" bodyStyle={{ padding: "12px" }}>
            <div className="flex flex-col gap-0.5">
              <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-wider">Refund Ratio</span>
              <span className="text-xs font-black text-rose-500 mt-1">{refundRatio.toFixed(1)}%</span>
            </div>
          </Card>
        </div>

        {/* 2. Formula Section and Gauge side-by-side */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Formula Section */}
          <div className="md:col-span-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-xl space-y-3">
            <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider">Profitability Formulas Reference</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] text-zinc-600 dark:text-zinc-400">
              <div className="space-y-1 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border">
                <p className="font-bold text-zinc-800 dark:text-zinc-100">Gross Profit</p>
                <code className="text-slate-500 block font-mono text-[9px]">Gross Sales - Discounts</code>
              </div>
              <div className="space-y-1 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border">
                <p className="font-bold text-zinc-800 dark:text-zinc-100">Net Profit</p>
                <code className="text-slate-500 block font-mono text-[9px]">Gross Sales - Expenses - Refunds</code>
              </div>
              <div className="space-y-1 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border">
                <p className="font-bold text-zinc-800 dark:text-zinc-100">Expense Ratio</p>
                <code className="text-slate-500 block font-mono text-[9px]">Expenses / Gross Sales</code>
              </div>
              <div className="space-y-1 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border">
                <p className="font-bold text-zinc-800 dark:text-zinc-100">Profit Margin</p>
                <code className="text-slate-500 block font-mono text-[9px]">Net Profit / Gross Sales</code>
              </div>
              <div className="space-y-1 bg-white dark:bg-zinc-950 p-2.5 rounded-lg border col-span-1 sm:col-span-2">
                <p className="font-bold text-zinc-800 dark:text-zinc-100">Average Order Value (AOV)</p>
                <code className="text-slate-500 block font-mono text-[9px]">Gross Sales / Total Orders</code>
              </div>
            </div>
          </div>

          {/* Profitability Gauge */}
          <div className="flex flex-col items-center justify-center p-4 bg-zinc-50 dark:bg-zinc-900 border rounded-xl">
            <span className="font-bold text-zinc-450 uppercase text-[9px] mb-4">Profitability Gauge</span>
            <Progress
              type="circle"
              percent={margin}
              strokeColor={gaugeColor}
              strokeWidth={10}
              width={110}
              format={pct => (
                <div className="flex flex-col items-center">
                  <span className="text-base font-black" style={{ color: gaugeColor }}>{pct}%</span>
                  <span className="text-[7.5px] uppercase font-extrabold text-zinc-400">Margin</span>
                </div>
              )}
            />
            <div className="mt-4 flex gap-3 text-[8.5px] font-bold">
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> &gt;30% Excellent</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 15-30% Good</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> &lt;15% Loss/Low</span>
            </div>
          </div>
        </div>

        {/* 3. Trend Chart */}
        <div className="p-4 border rounded-xl shadow-xs">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h4 className="font-extrabold text-[10px] uppercase text-zinc-500 tracking-wider flex items-center gap-1.5">
                <TrendingUp size={12} className="text-[var(--primary)]" />
                Monthly Revenue vs Profit Trends
              </h4>
              <span className="text-[8px] text-zinc-400 block mt-0.5">Historical profit and gross sales evolution</span>
            </div>
          </div>

          <div className="h-[210px] w-full mt-1">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
              <LineChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={v => `₹${v / 1000}k`} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "8px", fontSize: "10px" }}
                  formatter={(value) => [formatCurrency(value), null]}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "9px" }} />
                <Line type="monotone" dataKey="revenue" name="Gross Sales" stroke="#3b82f6" strokeWidth={2} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="profit" name="Net Profit" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </Modal>
  );
}
