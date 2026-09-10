import React, { useState } from "react";
import { X, Search, Calendar, SlidersHorizontal, RefreshCw } from "lucide-react";
import { useStockTransactions, useIngredientDetails } from "../hooks/useIngredients";

const TRANSACTION_TYPES = ["All", "Purchase", "Consumption", "Adjustment", "Wastage", "Transfer"];
const STORES = ["All", "Indore Central", "Bhopal Zone", "Ujjain Branch"];

export default function StockHistoryModal({ isOpen, onClose, ingredientId }) {
  const [filters, setFilters] = useState({
    type: "all",
    store: "all",
    startDate: "",
    endDate: ""
  });

  const { data: detailsResponse } = useIngredientDetails(ingredientId);
  const ingredient = detailsResponse?.data;

  // React Query fetch for transactions
  const { data: transactionsResponse, isLoading, refetch } = useStockTransactions(ingredientId, {
    type: filters.type,
    store: filters.store,
    startDate: filters.startDate,
    endDate: filters.endDate
  });
  const transactions = transactionsResponse?.data || [];

  if (!isOpen) return null;

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      type: "all",
      store: "all",
      startDate: "",
      endDate: ""
    });
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Modal Alignment */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-[1000px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg shadow-sm">
                <SlidersHorizontal size={14} />
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white">
                  Stock Transactions History & Ledger Ledger
                </h3>
                <p className="text-[9.5px] text-zinc-400 font-bold mt-0.5">
                  Audit logs of inventory changes for <span className="text-[var(--primary)]">{ingredient?.name || "Loading..."}</span> ({ingredient?.ingredientCode})
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
              <X size={15} />
            </button>
          </header>

          {/* Filters Bar */}
          <section className="p-4 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/20 flex flex-wrap items-center gap-3 shrink-0">
            
            {/* Transaction Type */}
            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Type</span>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange("type", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 cursor-pointer min-w-[120px]"
              >
                {TRANSACTION_TYPES.map((type) => (
                  <option key={type} value={type === "All" ? "all" : type.toLowerCase()}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Store */}
            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Store Outlet</span>
              <select
                value={filters.store}
                onChange={(e) => handleFilterChange("store", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350 cursor-pointer min-w-[140px]"
              >
                {STORES.map((store) => (
                  <option key={store} value={store === "All" ? "all" : store.toLowerCase()}>
                    {store}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Inputs */}
            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">Start Date</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="px-2.5 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-700 dark:text-zinc-350"
              />
            </div>

            <div className="space-y-1">
              <span className="text-[8.5px] text-zinc-400 uppercase font-bold block">End Date</span>
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
                onClick={handleResetFilters}
                className="px-3.5 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold transition-all cursor-pointer text-[10px]"
              >
                Reset Filters
              </button>
              <button
                onClick={() => refetch()}
                className="px-2 py-1.5 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 rounded-lg transition-all cursor-pointer"
                title="Refresh logs"
              >
                <RefreshCw size={13} />
              </button>
            </div>
          </section>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto p-4 max-h-[50vh] scrollbar-thin bg-white dark:bg-zinc-950">
            {isLoading ? (
              <div className="py-24 flex flex-col items-center justify-center space-y-3">
                <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <p className="font-extrabold text-zinc-450">Trimming ledger records...</p>
              </div>
            ) : transactions.length > 0 ? (
              <div className="border border-zinc-150 dark:border-zinc-850 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[9px] uppercase text-zinc-400">
                      <th className="p-3 font-bold">Date & Time</th>
                      <th className="p-3 font-bold">Store Outlet</th>
                      <th className="p-3 font-bold">Transaction Type</th>
                      <th className="p-3 font-bold">Reference ID</th>
                      <th className="p-3 font-bold text-right">Quantity</th>
                      <th className="p-3 font-bold text-right">Opening Stock</th>
                      <th className="p-3 font-bold text-right">Closing Stock</th>
                      <th className="p-3 font-bold">Performed By</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900 text-zinc-650 dark:text-zinc-350">
                    {transactions.map((t, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/10 font-semibold transition-all">
                        <td className="p-3 text-[10px] font-mono whitespace-nowrap">
                          {new Date(t.date).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="p-3 font-bold">{t.store}</td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase inline-block ${
                            t.type === "Purchase"
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20"
                              : t.type === "Consumption"
                              ? "bg-blue-50 text-blue-600 dark:bg-blue-950/20"
                              : t.type === "Wastage"
                              ? "bg-red-50 text-red-650 dark:bg-red-950/20"
                              : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900"
                          }`}>
                            {t.type}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-[9px] text-zinc-450">{t.reference}</td>
                        <td className={`p-3 text-right font-bold ${t.quantity > 0 ? "text-emerald-600" : "text-rose-600"}`}>
                          {t.quantity > 0 ? `+${t.quantity}` : t.quantity} {ingredient?.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-zinc-500">{t.openingStock} {ingredient?.unit}</td>
                        <td className="p-3 text-right font-bold font-mono text-zinc-900 dark:text-white">{t.closingStock} {ingredient?.unit}</td>
                        <td className="p-3 text-zinc-450 font-medium truncate max-w-[120px]" title={t.performedBy}>{t.performedBy}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-450 flex flex-col items-center justify-center gap-2">
                <SlidersHorizontal size={24} className="opacity-30" />
                <p className="font-extrabold text-zinc-400">No stock transactions matches found in local ledger.</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-950 dark:bg-zinc-850 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm cursor-pointer text-xs"
            >
              Close Ledger
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
