import React, { useState } from "react";
import { X, FileText, ShoppingBag, RotateCcw, AlertTriangle, ShieldAlert, Award, TrendingUp, Landmark, Star, Printer, Download, Clock } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip
} from "recharts";
import { 
  useInventoryReportDetail, 
  usePurchaseRequestsList, 
  useStockTransactionsList, 
  useSuppliersSummaryList 
} from "../hooks/useInventoryReport";
import { toast } from "sonner";

export default function InventoryDetailModal({ isOpen, reportId, onClose }) {
  const { data: report, isLoading, error } = useInventoryReportDetail(reportId);
  const { data: purchaseRequests } = usePurchaseRequestsList();
  const { data: transactions } = useStockTransactionsList();
  const { data: suppliers } = useSuppliersSummaryList();

  // Paginations
  const [prPage, setPrPage] = useState(1);
  const [txPage, setTxPage] = useState(1);
  const tableLimit = 3;

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-955 text-xs">
        <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm shrink-0">
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-48 bg-zinc-150 dark:bg-zinc-850 rounded" />
          </div>
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </header>
        <main className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
            <div className="h-64 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
          </div>
        </main>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-955 text-xs items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-955 text-red-500 rounded-full flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Failed to Load Inventory Report</h3>
          <p className="text-zinc-400 text-[10px] font-bold">The detailed stock report logs could not be retrieved.</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    );
  }

  // Paginated sub-data
  const prs = purchaseRequests || [];
  const paginatedPrs = prs.slice((prPage - 1) * tableLimit, prPage * tableLimit);
  const prTotalPages = Math.ceil(prs.length / tableLimit);

  const txs = transactions || [];
  const paginatedTxs = txs.slice((txPage - 1) * tableLimit, txPage * tableLimit);
  const txTotalPages = Math.ceil(txs.length / tableLimit);

  const handlePrint = () => {
    toast.success("Opening print view...");
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <html>
        <head>
          <title>Inventory Audit Report - ${report.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; line-height: 1.5; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #eee; padding-bottom: 20px; }
            .section-title { font-weight: bold; font-size: 16px; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 15px 0; }
            th, td { border: 1px solid #eee; padding: 10px; text-align: left; }
            th { background-color: #f9f9f9; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2>PAPA VEG PIZZA</h2>
              <p>Inventory Movement & Consumption Report</p>
            </div>
            <div style="text-align: right;">
              <h2>ID: ${report.id}</h2>
              <p>Store: ${report.storeName}</p>
            </div>
          </div>
          <p><strong>Report Period:</strong> ${report.startDate} to ${report.endDate}</p>
          
          <div class="section-title">Stock Summary Metrics</div>
          <p>Opening Stock: ${report.openingStock} units</p>
          <p>Purchased Quantity: ${report.purchasedQuantity} units</p>
          <p>Consumed Quantity: ${report.consumedQuantity} units</p>
          <p>Wastage / Spillage: ${report.wastage} units</p>
          <p>Closing Inventory: ${report.closingStock} units</p>
          <p><strong>Current Inventory Value:</strong> INR ${report.currentInventoryValue?.toLocaleString("en-IN")}</p>

          <script>window.print();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleDownload = (format) => {
    toast.success(`Exporting inventory report details as ${format}...`);
    const txt = `
Papa Veg Pizza Inventory Report
--------------------------------------
Report ID: ${report.id}
Store: ${report.storeName}
Period: ${report.startDate} to ${report.endDate}
Generated By: ${report.generatedBy}

STOCK METRICS:
- Opening Inventory: ${report.openingStock}
- Consumed: ${report.consumedQuantity}
- Restocked: ${report.purchasedQuantity}
- Spillage / Wastage: ${report.wastage}
- Closing Inventory: ${report.closingStock}
- Valuation: INR ${report.currentInventoryValue}
`;
    const blob = new Blob([txt], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `inventory-detail-${report.id}.${format.toLowerCase() === "excel" ? "csv" : "txt"}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-955 text-xs select-none">
      
      {/* Header */}
      <header className="px-6 py-3.5 border-b border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-[10px] uppercase">
              {report.status}
            </span>
            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight uppercase">
              Inventory Report: {report.id}
            </h2>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
            Store: {report.storeName} • Period: {report.startDate} to {report.endDate}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Main Content Scroll wrapper */}
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin space-y-6">
        
        {/* KPI Cards Grid */}
        <section className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xs">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">Opening Stock</span>
            <span className="text-base font-black text-slate-900 dark:text-white mt-1 block">{report.openingStock} units</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xs">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">Consumed Quantity</span>
            <span className="text-base font-black text-[var(--primary)] mt-1 block">{report.consumedQuantity} units</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xs">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">Purchased Quantity</span>
            <span className="text-base font-black text-emerald-500 mt-1 block">{report.purchasedQuantity} units</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xs">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">Closing Stock</span>
            <span className="text-base font-black text-slate-900 dark:text-white mt-1 block">{report.closingStock} units</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-855 rounded-xl shadow-xs">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">Wastage / Spills</span>
            <span className="text-base font-black text-rose-500 mt-1 block">{report.wastage} units</span>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-xl shadow-xs">
            <span className="text-[10px] text-zinc-400 font-extrabold uppercase block">Inventory Value</span>
            <span className="text-base font-black text-purple-500 mt-1 block">₹{report.currentInventoryValue?.toLocaleString("en-IN")}</span>
          </div>

        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Area: Chart and Transaction Ledger */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Line Chart section */}
            <section className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs space-y-3">
              <div>
                <h3 className="font-extrabold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-[var(--primary)]" />
                  <span>Ingredient Consumption Trend</span>
                </h3>
              </div>

              {report.ingredientsTrend ? (
                <div className="w-full h-[220px] overflow-x-auto scrollbar-thin">
                  <div className="w-[500px] h-[210px]">
                    <LineChart width={500} height={210} data={report.ingredientsTrend} margin={{ top: 15, right: 10, left: -25, bottom: 0 }}>
                      <XAxis dataKey="date" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <RechartsTooltip contentStyle={{ fontSize: "9px" }} />
                      <Line type="monotone" dataKey="consumption" name="Consumption" stroke="var(--primary)" strokeWidth={2} />
                      <Line type="monotone" dataKey="purchases" name="Purchases" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="wastage" name="Wastage" stroke="#ef4444" strokeWidth={1.5} strokeDasharray="3 3" />
                    </LineChart>
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-zinc-400">No trend log data.</div>
              )}
            </section>

            {/* Transactions Section */}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 flex justify-between items-center">
                <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Clock size={14} className="text-[var(--primary)]" />
                  <span>Transactions Ledger History</span>
                </h3>
              </div>

              {txs.length > 0 ? (
                <div className="flex flex-col">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse font-semibold text-zinc-700 dark:text-zinc-300">
                      <thead>
                        <tr className="border-b border-zinc-250 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 text-[9px] text-zinc-400 uppercase">
                          <th className="p-3">Date</th>
                          <th className="p-3">Ingredient</th>
                          <th className="p-3 text-center">Type</th>
                          <th className="p-3 text-center">Quantity</th>
                          <th className="p-3">Ref No</th>
                          <th className="p-3">Handled By</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedTxs.map((tx, idx) => (
                          <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10">
                            <td className="p-3 text-zinc-400">
                              {new Date(tx.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </td>
                            <td className="p-3 font-bold text-zinc-800 dark:text-zinc-200">{tx.ingredient}</td>
                            <td className="p-3 text-center">
                              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold text-[9px] uppercase">
                                {tx.transactionType}
                              </span>
                            </td>
                            <td className={`p-3 text-center font-bold ${tx.quantity >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                              {tx.quantity >= 0 ? "+" : ""}{tx.quantity}
                            </td>
                            <td className="p-3 font-mono text-[9px] text-zinc-500">{tx.referenceNumber}</td>
                            <td className="p-3">{tx.updatedBy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {txTotalPages > 1 && (
                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-850 flex justify-between items-center bg-zinc-50/10 dark:bg-zinc-900/20">
                      <span className="text-[10px] text-zinc-400 font-bold">Transactions Page {txPage} of {txTotalPages}</span>
                      <div className="flex gap-1">
                        <button disabled={txPage === 1} onClick={() => setTxPage(p => Math.max(p - 1, 1))} className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 disabled:opacity-40 cursor-pointer">Prev</button>
                        <button disabled={txPage === txTotalPages} onClick={() => setTxPage(p => Math.min(p + 1, txTotalPages))} className="px-2.5 py-1 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-100 disabled:opacity-40 cursor-pointer">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center text-zinc-400 font-bold">No transactions found.</div>
              )}
            </section>

          </div>

          {/* Right Area: Purchase Requests & Suppliers */}
          <div className="space-y-6">
            
            {/* Purchase Requests Section */}
            <section className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                <ShoppingBag size={14} className="text-[var(--primary)]" />
                <span>Purchase Requests</span>
              </h3>

              {prs.length > 0 ? (
                <div className="space-y-3">
                  {paginatedPrs.map((pr, idx) => (
                    <div key={idx} className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/20 dark:bg-zinc-900/40 space-y-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-zinc-900 dark:text-white">{pr.requestNumber}</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                          pr.status === "Pending" ? "bg-amber-50 text-amber-600 dark:bg-amber-955/20 dark:text-amber-400" :
                          pr.status === "Approved" || pr.status === "Ordered" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400" :
                          "bg-rose-50 text-rose-600 dark:bg-rose-955/20 dark:text-rose-400"
                        }`}>
                          {pr.status}
                        </span>
                      </div>
                      <div className="text-[10px] text-zinc-500">
                        {pr.ingredient} • Qty: {pr.quantity}
                      </div>
                      <div className="text-[9px] text-zinc-400 flex justify-between">
                        <span>Supplier: {pr.supplier}</span>
                        <span>By: {pr.approvedBy}</span>
                      </div>
                    </div>
                  ))}

                  {prTotalPages > 1 && (
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-[9px] text-zinc-405">PR Page {prPage}/{prTotalPages}</span>
                      <div className="flex gap-1">
                        <button disabled={prPage === 1} onClick={() => setPrPage(p => Math.max(p - 1, 1))} className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded text-[9px] hover:bg-zinc-100 disabled:opacity-40 cursor-pointer">Prev</button>
                        <button disabled={prPage === prTotalPages} onClick={() => setPrPage(p => Math.min(p + 1, prTotalPages))} className="px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 rounded text-[9px] hover:bg-zinc-100 disabled:opacity-40 cursor-pointer">Next</button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-zinc-400 text-center py-4">No requests found.</div>
              )}
            </section>

            {/* Suppliers Summary Section */}
            <section className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                <Landmark size={14} className="text-[var(--primary)]" />
                <span>Supplier Valuation Summary</span>
              </h3>

              {suppliers && suppliers.length > 0 ? (
                <div className="space-y-3">
                  {suppliers.map((sup, idx) => (
                    <div key={idx} className="p-3 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/20 dark:bg-zinc-900/40 space-y-1.5 font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="font-bold text-zinc-900 dark:text-white block">{sup.supplierName}</span>
                      <span className="text-[10px] text-zinc-400 block truncate">Supplies: {sup.itemsSupplied}</span>
                      <div className="flex justify-between text-[9px] text-zinc-400 mt-1">
                        <span>Orders: {sup.ordersCount}</span>
                        <span>Deliv: {sup.averageDeliveryTime}d</span>
                        <span className="font-bold text-[var(--sa-secondary)]">₹{(sup.totalPurchaseValue/1000).toFixed(0)}k Val</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-zinc-400 text-center py-4">No suppliers data.</div>
              )}
            </section>

          </div>

        </div>

      </main>

      {/* Footer */}
      <footer className="px-6 py-3 border-t border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex justify-between items-center shrink-0 shadow-sm">
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="px-3.5 py-1.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl font-bold cursor-pointer text-zinc-850 dark:text-zinc-200 flex items-center gap-1.5"
          >
            <Printer size={13} />
            <span>Print Report</span>
          </button>
          
          <button
            onClick={() => handleDownload("PDF")}
            className="px-3.5 py-1.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-xl font-bold cursor-pointer text-zinc-850 dark:text-zinc-200 flex items-center gap-1.5"
          >
            <Download size={13} className="text-rose-500" />
            <span>Download PDF</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-2 text-white font-black rounded-xl shadow-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer"
        >
          Close View
        </button>
      </footer>

    </div>
  );
}
