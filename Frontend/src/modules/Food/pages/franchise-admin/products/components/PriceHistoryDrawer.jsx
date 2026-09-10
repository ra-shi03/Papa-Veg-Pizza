import React, { useState } from "react";
import { X, History, AlertCircle, ArrowUpRight, ArrowDownRight, Calendar, User, Info, Building2 } from "lucide-react";
import { usePriceHistory } from "../hooks/usePriceHistory";

export default function PriceHistoryDrawer({ isOpen, onClose, product, storesList = [] }) {
  const [storeFilter, setStoreFilter] = useState("all");
  const [page, setPage] = useState(1);
  const limit = 5;

  const { data: response, isLoading } = usePriceHistory(product?._id, {
    storeId: storeFilter,
    page,
    limit
  });

  if (!isOpen) return null;

  const historyList = response?.history || [];
  const totalCount = response?.totalCount || 0;
  const totalPages = response?.totalPages || 1;

  // Helper to compare prices and return change indicator
  const getPriceChangeType = (oldPrice = {}, newPrice = {}) => {
    const oldAvg = (Number(oldPrice.smallPrice || 0) + Number(oldPrice.mediumPrice || 0) + Number(oldPrice.largePrice || 0)) / 3;
    const newAvg = (Number(newPrice.smallPrice || 0) + Number(newPrice.mediumPrice || 0) + Number(newPrice.largePrice || 0)) / 3;

    if (newAvg > oldAvg) {
      return { label: "Increase", color: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 border border-emerald-250 dark:border-emerald-900/30", icon: ArrowUpRight };
    } else if (newAvg < oldAvg) {
      return { label: "Decrease", color: "bg-rose-50 dark:bg-rose-950/20 text-rose-650 border border-rose-250 dark:border-rose-900/30", icon: ArrowDownRight };
    }
    return { label: "No Change", color: "bg-zinc-50 dark:bg-zinc-850 text-zinc-450 border border-zinc-200 dark:border-zinc-800", icon: Info };
  };

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Slide-out Panel Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10 z-50 animate-slide-in">
        <div className="w-screen max-w-[650px] h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col overflow-hidden">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)] text-white rounded-xl shadow-sm">
                <History size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Price Change History
                </h3>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                  Audit trail logs for: {product?.name || "Unknown Product"}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {/* Filter Toolbar */}
          <div className="p-3 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/20 dark:bg-zinc-950/20">
            <div className="flex items-center gap-2">
              <Building2 size={13} className="text-zinc-400" />
              <span className="font-extrabold text-zinc-500">Filter by Store:</span>
            </div>
            <select
              value={storeFilter}
              onChange={(e) => { setStoreFilter(e.target.value); setPage(1); }}
              className="px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-[11px] focus:outline-none focus:border-[var(--primary)] font-bold text-zinc-700 dark:text-zinc-350 cursor-pointer"
            >
              <option value="all">All Stores</option>
              {storesList.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.storeName}
                </option>
              ))}
            </select>
          </div>

          {/* Body Content */}
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3 bg-white dark:bg-zinc-950">
              <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="font-extrabold text-zinc-450">Loading price history...</p>
            </div>
          ) : historyList.length > 0 ? (
            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin dark:text-zinc-350">
              
              {/* Timeline Container */}
              <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-4 pl-6 space-y-6">
                {historyList.map((log) => {
                  const changeInfo = getPriceChangeType(log.oldPrice, log.newPrice);
                  const Icon = changeInfo.icon;
                  return (
                    <div key={log._id} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[32px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white dark:bg-zinc-950 border-2 border-primary z-10">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                      </span>

                      {/* Log card */}
                      <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3.5 shadow-2xs hover:shadow-xs transition-shadow">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-extrabold text-zinc-900 dark:text-white text-xs leading-none">
                              {log.storeName}
                            </p>
                            <span className="text-[8px] font-bold text-zinc-400 font-mono tracking-tight uppercase leading-none mt-1 inline-block">
                              ID: {log._id}
                            </span>
                          </div>
                          
                          <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center gap-0.5 ${changeInfo.color}`}>
                            <Icon size={10} className="stroke-[2.5]" />
                            {changeInfo.label}
                          </span>
                        </div>

                        {/* Price Details table */}
                        <div className="grid grid-cols-3 gap-2.5 font-bold text-center">
                          <div className="p-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850">
                            <span className="text-[7.5px] text-zinc-400 uppercase font-semibold">Small Override</span>
                            <p className="text-[10px] text-zinc-500 line-through leading-none mt-1">₹{log.oldPrice?.smallPrice || 0}</p>
                            <p className="text-zinc-900 dark:text-white text-xs font-black leading-none mt-0.5">₹{log.newPrice?.smallPrice || 0}</p>
                          </div>
                          <div className="p-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850">
                            <span className="text-[7.5px] text-zinc-400 uppercase font-semibold">Medium Override</span>
                            <p className="text-[10px] text-zinc-500 line-through leading-none mt-1">₹{log.oldPrice?.mediumPrice || 0}</p>
                            <p className="text-zinc-900 dark:text-white text-xs font-black leading-none mt-0.5">₹{log.newPrice?.mediumPrice || 0}</p>
                          </div>
                          <div className="p-2 bg-white dark:bg-zinc-950 rounded-xl border border-zinc-100 dark:border-zinc-850">
                            <span className="text-[7.5px] text-zinc-400 uppercase font-semibold">Large Override</span>
                            <p className="text-[10px] text-zinc-500 line-through leading-none mt-1">₹{log.oldPrice?.largePrice || 0}</p>
                            <p className="text-zinc-900 dark:text-white text-xs font-black leading-none mt-0.5">₹{log.newPrice?.largePrice || 0}</p>
                          </div>
                        </div>

                        {/* Audit message details */}
                        <div className="p-2.5 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-855 rounded-xl text-zinc-650 dark:text-zinc-400 font-bold leading-normal">
                          <span className="text-[7.5px] uppercase font-bold text-zinc-400 block mb-0.5">Reason for change</span>
                          {log.reason || "No specific reason logged."}
                        </div>

                        {/* Editor and timestamp */}
                        <div className="flex justify-between items-center pt-2.5 border-t border-zinc-100 dark:border-zinc-900 text-[8.5px] text-zinc-400 font-bold">
                          <span className="flex items-center gap-1 font-semibold">
                            <User size={10} /> Editor: {log.changedBy || "Franchise Admin"}
                          </span>
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar size={10} /> {new Date(log.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2 bg-white dark:bg-zinc-950">
              <AlertCircle size={28} className="text-zinc-350" />
              <p className="font-extrabold text-zinc-450">No price history found for this store.</p>
            </div>
          )}

          {/* Footer & Pagination */}
          <footer className="p-4 border-t border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/20 flex items-center justify-between shrink-0">
            {totalPages > 1 ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page === 1}
                  className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Prev
                </button>
                <span className="text-[10px] text-zinc-400 px-1 font-semibold">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="px-2.5 py-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg font-bold disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                >
                  Next
                </button>
              </div>
            ) : (
              <div className="text-[9.5px] text-zinc-400 font-semibold font-mono">
                Audit trail total: {totalCount} updates
              </div>
            )}
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-zinc-950 dark:bg-zinc-850 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer text-xs"
            >
              Close History
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
}
