import React, { useState } from "react";
import { X, Calendar, Search, RefreshCw, ChevronLeft, ChevronRight, SlidersHorizontal, Download } from "lucide-react";
import { useStockHistory, useStores } from "../hooks/useStock";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

const TYPES = ["All", "Purchase", "Consumption", "Adjustment", "Waste", "Transfer", "Goods Received", "Expired", "Return"];
const REASONS = ["All", "Damage", "Manual Correction", "Expired", "Transfer", "Waste", "Order Preparation", "New Stock Arrival"];

export default function TransactionHistoryModal({ isOpen, onClose }) {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    storeId: "all",
    type: "all",
    reason: "all",
    search: ""
  });
  
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Fetch stores list
  const { data: storesResponse } = useStores();
  const stores = storesResponse?.data || [];

  // Fetch full transaction history
  const { data: historyResponse, isLoading, refetch } = useStockHistory({
    ...filters,
    page,
    limit
  });
  const transactions = historyResponse?.data || [];
  const totalCount = historyResponse?.totalCount || 0;

  if (!isOpen) return null;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
    setPage(1);
  };

  const handleReset = () => {
    setFilters({
      startDate: "",
      endDate: "",
      storeId: "all",
      type: "all",
      reason: "all",
      search: ""
    });
    setPage(1);
  };

  // CSV Export
  const exportToCSV = () => {
    if (transactions.length === 0) return;
    
    const headers = ["Date", "Store", "Ingredient", "Type", "Quantity", "Prev Stock", "New Stock", "Reason", "Ref ID", "By"];
    const rows = transactions.map(t => [
      new Date(t.createdAt).toLocaleString("en-IN"),
      t.storeName,
      t.ingredientName,
      t.type,
      t.quantity,
      t.previousStock,
      t.newStock,
      t.reason,
      t.referenceId,
      t.createdBy
    ]);

    const csvContent = [headers.join(","), ...rows.map(e => e.map(val => `"${val}"`).join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_audit_log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // PDF Export using jsPDF
  const exportToPDF = () => {
    if (transactions.length === 0) return;
    const doc = new jsPDF();
    
    // Title & Metadata
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("Papa Veg Pizza - Stock Ledger Audit Log", 14, 18);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Generated on: ${new Date().toLocaleString("en-IN")}`, 14, 25);
    
    const tableHeaders = [["Date", "Store", "Ingredient", "Type", "Qty", "Prev", "New", "Reason", "Ref ID"]];
    const tableRows = transactions.map(t => [
      new Date(t.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
      t.storeName.replace("Papa Veg Pizza - ", ""),
      t.ingredientName,
      t.type,
      t.quantity > 0 ? `+${t.quantity}` : t.quantity,
      t.previousStock,
      t.newStock,
      t.reason,
      t.referenceId
    ]);

    doc.autoTable({
      head: tableHeaders,
      body: tableRows,
      startY: 30,
      theme: "striped",
      styles: { fontSize: 8, font: "helvetica" },
      headStyles: { fillColor: [164, 60, 18], textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    doc.save(`stock_ledger_report_${Date.now()}.pdf`);
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal alignment wrapper */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[1100px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up h-[90vh]">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30 shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg shadow-sm">
                <SlidersHorizontal size={14} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  Stock Transactions History & Audit Ledger
                </h3>
                <p className="text-[9.5px] text-zinc-400 font-bold mt-0.5">
                  Complete historic record of all inventory transactions and material adjustments.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Exports dropdown */}
              <div className="flex bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-0.5 shadow-sm text-[10px]">
                <button 
                  onClick={exportToCSV}
                  className="px-2.5 py-1 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download size={11} className="text-zinc-400" />
                  <span>CSV</span>
                </button>
                <button 
                  onClick={exportToPDF}
                  className="px-2.5 py-1 hover:bg-zinc-150 dark:hover:bg-zinc-800 rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Download size={11} className="text-zinc-400" />
                  <span>PDF</span>
                </button>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
                <X size={15} />
              </button>
            </div>
          </header>

          {/* Sticky Filters Section */}
          <section className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 flex flex-wrap items-center gap-3 shrink-0">
            
            {/* Search */}
            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-450 uppercase font-extrabold block">Search Log</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ingredient, Code, Ref ID..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-7 pr-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 min-w-[150px] focus:border-[var(--primary)] outline-none"
                />
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              </div>
            </div>

            {/* Store */}
            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-455 uppercase font-extrabold block">Store Outlet</span>
              <select
                value={filters.storeId}
                onChange={(e) => handleFilterChange("storeId", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 cursor-pointer min-w-[130px]"
              >
                <option value="all">All Stores</option>
                {stores.map((s) => (
                  <option key={s._id} value={s._id}>{s.storeName.replace("Papa Veg Pizza - ", "")}</option>
                ))}
              </select>
            </div>

            {/* Transaction Type */}
            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-455 uppercase font-extrabold block">Type</span>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 cursor-pointer min-w-[100px]"
              >
                {TYPES.map((type) => (
                  <option key={type} value={type === "All" ? "all" : type.toLowerCase()}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-455 uppercase font-extrabold block">Reason</span>
              <select
                value={filters.reason}
                onChange={(e) => handleFilterChange("reason", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 cursor-pointer min-w-[120px]"
              >
                {REASONS.map((r) => (
                  <option key={r} value={r === "All" ? "all" : r.toLowerCase()}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Inputs */}
            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-455 uppercase font-extrabold block">Start Date</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-455 uppercase font-extrabold block">End Date</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-2 self-end pt-1">
              <button
                onClick={handleReset}
                className="px-3.5 py-1.5 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold transition-all cursor-pointer text-[10px]"
              >
                Reset
              </button>
              <button
                onClick={() => refetch()}
                className="px-2 py-1.5 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-lg transition-all cursor-pointer"
                title="Refresh ledger"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </section>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto p-4 scrollbar-thin bg-white dark:bg-zinc-950">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <p className="font-extrabold text-zinc-450">Loading historic audit ledger...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden shadow-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[9px] uppercase text-zinc-400 font-extrabold sticky top-0 z-10">
                      <th className="p-3 pl-4">Date & Time</th>
                      <th className="p-3">Store Outlet</th>
                      <th className="p-3">Ingredient</th>
                      <th className="p-3">Type</th>
                      <th className="p-3 text-right">Adjustment Qty</th>
                      <th className="p-3 text-right">Previous Stock</th>
                      <th className="p-3 text-right">Closing Stock</th>
                      <th className="p-3">Reason / Details</th>
                      <th className="p-3">Reference ID</th>
                      <th className="p-3 pr-4">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-650 dark:text-zinc-350">
                    {transactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 font-semibold transition-all">
                        <td className="p-3 text-[9.5px] font-mono whitespace-nowrap">
                          {new Date(t.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-3 font-bold">{t.storeName.replace("Papa Veg Pizza - ", "")}</td>
                        <td className="p-3">
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-white">{t.ingredientName}</p>
                            <p className="text-[8px] text-zinc-400 font-mono mt-0.5">{t.ingredientCode}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${
                            t.type === "Purchase" || t.type === "Goods Received"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                              : t.type === "Consumption"
                              ? "bg-blue-50 text-blue-650 dark:bg-blue-950/20"
                              : t.type === "Waste" || t.type === "Expired"
                              ? "bg-red-50 text-red-650 dark:bg-red-950/20"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900"
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className={`p-3 text-right font-black ${t.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {t.quantity > 0 ? `+${t.quantity}` : t.quantity}
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-500">{t.previousStock} {t.unit}</td>
                        <td className="p-3 text-right font-bold font-mono text-zinc-900 dark:text-white">{t.newStock} {t.unit}</td>
                        <td className="p-3 font-medium text-zinc-450 truncate max-w-[150px]" title={t.reason}>{t.reason}</td>
                        <td className="p-3 font-mono text-[9px] text-zinc-400">{t.referenceId}</td>
                        <td className="p-3 pr-4 text-zinc-450 font-medium truncate max-w-[100px]" title={t.createdBy}>{t.createdBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-400 flex flex-col items-center justify-center gap-2">
                <SlidersHorizontal size={24} className="opacity-30" />
                <p className="font-extrabold">No matching ledger records found.</p>
              </div>
            )}
          </div>

          {/* Footer Pagination */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <span className="text-[10px] text-zinc-450">Showing {Math.min(totalCount, (page - 1) * limit + 1)} - {Math.min(totalCount, page * limit)} of {totalCount} transactions</span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                className="p-1 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={13} />
              </button>
              <span className="px-2.5 py-0.5 rounded bg-zinc-900 dark:bg-zinc-850 text-white font-extrabold">
                {page}
              </span>
              <button
                disabled={page * limit >= totalCount}
                onClick={() => setPage((p) => p + 1)}
                className="p-1 border border-zinc-250 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={13} />
              </button>
            </div>
          </footer>

        </div>
      </div>
    </div>
  );
}
