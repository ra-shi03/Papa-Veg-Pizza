import React, { useState } from "react";
import { X, Edit, Sliders, Calendar, ArrowUpRight, ArrowDownRight, Layers, FileText, Activity } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { useStockHistory, useConsumptionTrend } from "../hooks/useStock";

export default function StockDetailsDrawer({ isOpen, onClose, stockRecord, onAdjustClick }) {
  const [trendRange, setTrendRange] = useState(7); // 7, 30, or 90 days

  // Fetch stock history for this specific ingredient and store
  const { data: historyResponse, isLoading: historyLoading } = useStockHistory({
    ingredientId: stockRecord?.ingredientId,
    storeId: stockRecord?.storeId,
    limit: 10
  });
  const recentTransactions = historyResponse?.data || [];

  // Fetch consumption trends
  const { data: trendResponse, isLoading: trendLoading } = useConsumptionTrend(
    stockRecord?.ingredientId,
    stockRecord?.storeId
  );
  const trendData = trendResponse?.data?.trend || [];
  const trendMetrics = trendResponse?.data?.metrics || { consumedQuantity: 0, averageUsage: 0, projectedDepletion: 0 };

  if (!isOpen || !stockRecord) return null;

  const name = stockRecord.ingredient?.name || "Raw Material";
  const code = stockRecord.ingredient?.ingredientCode || "ING-UNK";
  const sku = stockRecord.ingredient?.sku || "N/A";
  const store = stockRecord.storeName || "Store Outlet";
  const image = stockRecord.ingredient?.image;
  const status = stockRecord.status;
  const unit = stockRecord.ingredient?.unit || stockRecord.unit;
  const costPerUnit = stockRecord.ingredient?.costPerUnit || 0;

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case "OUT_OF_STOCK":
        return "bg-red-500/10 text-red-750 border-red-200 dark:bg-red-950/30";
      case "CRITICAL":
        return "bg-rose-500/10 text-rose-750 border-rose-200 dark:bg-rose-950/30";
      case "LOW":
        return "bg-amber-550/10 text-amber-700 border-amber-200 dark:bg-amber-950/20";
      case "HEALTHY":
      default:
        return "bg-emerald-500/10 text-emerald-700 border-emerald-250 dark:bg-emerald-950/20";
    }
  };

  const formattedDate = (isoStr) => {
    if (!isoStr) return "N/A";
    const date = new Date(isoStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getRelativeTime = (isoStr) => {
    if (!isoStr) return "N/A";
    const elapsed = Date.now() - new Date(isoStr).getTime();
    const minutes = Math.floor(elapsed / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Sliding Drawer Body */}
      <div className="absolute right-0 top-0 bottom-0 w-full max-w-[600px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col z-50 animate-slide-left">
        
        {/* Drawer Header */}
        <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100">
              <img src={image} alt={name} className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white flex items-center gap-1.5">
                <span>{name}</span>
                <span className={`px-2 py-0.5 border rounded text-[7.5px] font-black uppercase ${getStatusBadgeClass(status)}`}>
                  {status?.replace("_", " ")}
                </span>
              </h3>
              <p className="text-[9.5px] text-zinc-400 font-bold mt-0.5">
                {store} • Code: {code} {sku !== "N/A" && `• SKU: ${sku}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => onAdjustClick(stockRecord)}
              className="p-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-lg shadow flex items-center gap-1 cursor-pointer text-[10px]"
            >
              <Edit size={12} />
              <span>Adjust Stock</span>
            </button>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Scroll Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 scrollbar-thin bg-white dark:bg-zinc-950">
          
          {/* Overview Cards */}
          <section className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 rounded-xl">
              <span className="text-[8.5px] text-zinc-400 uppercase font-extrabold block">Current Stock</span>
              <span className="text-sm font-black text-zinc-900 dark:text-white mt-1 block">{stockRecord.currentStock} {unit}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 rounded-xl">
              <span className="text-[8.5px] text-zinc-400 uppercase font-extrabold block">Reserved Stock</span>
              <span className="text-sm font-black text-zinc-400 mt-1 block">{stockRecord.reservedStock} {unit}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 rounded-xl">
              <span className="text-[8.5px] text-zinc-400 uppercase font-extrabold block">Available Stock</span>
              <span className="text-sm font-black text-[var(--primary)] mt-1 block">{stockRecord.availableStock} {unit}</span>
            </div>
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 rounded-xl">
              <span className="text-[8.5px] text-zinc-400 uppercase font-extrabold block">Stock Value</span>
              <span className="text-sm font-black text-emerald-600 mt-1 block">₹{stockRecord.stockValue?.toLocaleString("en-IN")}</span>
            </div>
          </section>

          {/* Consumption Trend Line Chart */}
          <section className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3 bg-white dark:bg-zinc-900/10">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Activity size={14} className="text-[var(--primary)]" />
                <span>Daily Consumption Trend</span>
              </h4>
              <div className="flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg p-0.5 text-[8.5px]">
                {[7, 30, 90].map((days) => (
                  <button
                    key={days}
                    onClick={() => setTrendRange(days)}
                    className={`px-2 py-0.5 rounded font-black transition-all cursor-pointer ${
                      trendRange === days 
                        ? "bg-zinc-950 dark:bg-zinc-800 text-white" 
                        : "text-zinc-400 hover:text-zinc-650"
                    }`}
                  >
                    {days} Days
                  </button>
                ))}
              </div>
            </div>

            {/* Consumption metrics */}
            <div className="grid grid-cols-3 gap-2 py-1 text-center bg-zinc-50/50 dark:bg-zinc-900/20 rounded-lg border border-zinc-100 dark:border-zinc-900">
              <div>
                <span className="text-[8px] text-zinc-400 uppercase block">Total Consumed</span>
                <span className="text-xs font-black text-zinc-850 dark:text-zinc-200">{trendMetrics.consumedQuantity} {unit}</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-400 uppercase block">Daily Avg</span>
                <span className="text-xs font-black text-zinc-850 dark:text-zinc-200">{trendMetrics.averageUsage} {unit}/day</span>
              </div>
              <div>
                <span className="text-[8px] text-zinc-400 uppercase block">Depletion Projection</span>
                <span className={`text-xs font-black ${
                  trendMetrics.projectedDepletion <= 3 
                    ? "text-rose-650 animate-pulse" 
                    : trendMetrics.projectedDepletion <= 7 
                      ? "text-amber-600" 
                      : "text-emerald-650"
                }`}>
                  {trendMetrics.projectedDepletion === 99 ? "Stable" : `~${trendMetrics.projectedDepletion} days left`}
                </span>
              </div>
            </div>

            {/* Recharts Area Chart */}
            <div className="h-40 w-full pt-2">
              {trendLoading ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                </div>
              ) : trendData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCons" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} style={{ fontSize: "8px", fontWeight: "bold", fill: "#888" }} />
                    <YAxis tickLine={false} axisLine={false} style={{ fontSize: "8px", fontWeight: "bold", fill: "#888" }} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#18181b", borderColor: "#27272a", borderRadius: "10px", fontSize: "9px", color: "#fff", fontWeight: "bold" }} 
                      labelStyle={{ color: "#a1a1aa" }}
                    />
                    <Area type="monotone" dataKey="quantity" name={`Quantity (${unit})`} stroke="var(--primary)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCons)" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-zinc-400">
                  No consumption history found
                </div>
              )}
            </div>
          </section>

          {/* Recent Transactions Table */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <FileText size={14} className="text-zinc-450" />
                <span>Recent Ledger Logs</span>
              </h4>
              <span className="text-[8.5px] text-zinc-400">Last 10 entries</span>
            </div>

            {historyLoading ? (
              <div className="py-8 flex justify-center">
                <div className="w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : recentTransactions.length > 0 ? (
              <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden shadow-xs bg-white dark:bg-zinc-950">
                <div className="overflow-x-auto max-h-[250px] scrollbar-thin">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[8px] uppercase text-zinc-400">
                        <th className="p-2 pl-3">Date</th>
                        <th className="p-2">Type</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Closing</th>
                        <th className="p-2 pr-3">Performed By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-650 dark:text-zinc-350">
                      {recentTransactions.map((txn, idx) => (
                        <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 transition-all text-[9.5px]">
                          <td className="p-2 pl-3 font-mono text-[8px] whitespace-nowrap">{formattedDate(txn.createdAt)}</td>
                          <td className="p-2">
                            <span className={`px-1.5 py-0.5 rounded text-[7px] font-black uppercase ${
                              txn.type === "Purchase" || txn.type === "Goods Received"
                                ? "bg-emerald-50 text-emerald-650 dark:bg-emerald-950/20"
                                : txn.type === "Consumption"
                                ? "bg-blue-50 text-blue-650 dark:bg-blue-950/20"
                                : txn.type === "Waste" || txn.type === "Expired"
                                ? "bg-red-50 text-red-650 dark:bg-red-950/20"
                                : "bg-zinc-100 text-zinc-650 dark:bg-zinc-900"
                            }`}>
                              {txn.type}
                            </span>
                          </td>
                          <td className={`p-2 text-right font-black ${txn.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                            {txn.quantity > 0 ? `+${txn.quantity}` : txn.quantity}
                          </td>
                          <td className="p-2 text-right font-mono text-zinc-450">{txn.newStock} {unit}</td>
                          <td className="p-2 pr-3 text-zinc-400 font-medium truncate max-w-[80px]" title={txn.createdBy}>{txn.createdBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400">
                No stock transactions matches found.
              </div>
            )}
          </section>

          {/* Ledger Footer/Info */}
          <footer className="text-center text-[9px] text-zinc-400 font-bold shrink-0">
            Last Inventory Audit: {getRelativeTime(stockRecord.lastUpdated)} by {stockRecord.updatedBy}
          </footer>

        </div>
      </div>
    </div>
  );
}
