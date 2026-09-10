import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { Input } from "@food/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@food/components/ui/select";
import { useIngredientDetails } from "../hooks/useIngredientDetails";
import { useInventoryHistory } from "../hooks/useInventoryHistory";
import { Search, Calendar, ChevronLeft, ChevronRight, History } from "lucide-react";

export function HistoryModal({ isOpen, onClose, ingredientId }) {
  const { data: detailsData } = useIngredientDetails(ingredientId);

  // Filters State
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [type, setType] = useState("All");
  const [page, setPage] = useState(1);
  const limit = 5;

  // Search input debouncer
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1); // Reset page to 1 on search change
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  // Reset page when transaction type filter changes
  const handleTypeChange = (val) => {
    setType(val);
    setPage(1);
  };

  const { data: historyData, isLoading } = useInventoryHistory(ingredientId, {
    page,
    limit,
    search: debouncedSearch,
    type: type === "All" ? "" : type
  });

  const ingredient = detailsData?.ingredient;
  const historyList = historyData?.data || [];
  const pagination = historyData?.pagination || { total: 0, page: 1, limit: 5, totalPages: 1 };

  // Transaction type badge helper
  const getTransactionTypeBadge = (t) => {
    switch (t) {
      case "stock_in":
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">▲ Stock In</span>;
      case "stock_out":
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2.5 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">▼ Stock Out</span>;
      case "adjustment":
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30">⚙ Adjustment</span>;
      default:
        return <span className="text-[10px] font-semibold">{t}</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <History className="text-[var(--primary)] w-4 h-4" />
            Audit Transaction History
          </DialogTitle>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Review complete stock ledger movements for auditing and tracing.
          </DialogDescription>
        </DialogHeader>

        {/* Hero Section */}
        {ingredient && (
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 select-none">
            <div>
              <p className="text-xs font-black text-slate-800 dark:text-white">{ingredient.ingredientName}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">Category: {ingredient.category} | SKU ID: {ingredient._id}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Current Stock Ledger</p>
              <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{ingredient.currentStock} {ingredient.unit}</p>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-3 select-none">
          {/* Search bar */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400 w-3.5 h-3.5" />
            <Input 
              type="text"
              placeholder="Search by reason or logger name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 px-8 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus-visible:ring-1 focus-visible:ring-[var(--primary)] bg-white dark:bg-zinc-900 w-full"
            />
          </div>

          {/* Type dropdown */}
          <div className="w-full sm:w-48">
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
                <SelectValue placeholder="Transaction Type" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg">
                <SelectItem value="All" className="text-xs font-semibold py-1.5">All Types</SelectItem>
                <SelectItem value="stock_in" className="text-xs font-semibold py-1.5">Stock In</SelectItem>
                <SelectItem value="stock_out" className="text-xs font-semibold py-1.5">Stock Out</SelectItem>
                <SelectItem value="adjustment" className="text-xs font-semibold py-1.5">Adjustment</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-auto border border-slate-100 dark:border-zinc-850 rounded-xl">
          <table className="w-full text-left text-[11px] table-auto">
            <thead>
              <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-850 font-black uppercase tracking-widest text-[9px] text-slate-400 dark:text-zinc-550 sticky top-0">
                <th className="py-2 px-3">Timestamp</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Quantity</th>
                <th className="py-2 px-3">Prev Stock</th>
                <th className="py-2 px-3">New Stock</th>
                <th className="py-2 px-3">Reason / Notes</th>
                <th className="py-2 px-3">Operator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
              {isLoading ? (
                [1, 2, 3].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-2 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                    <td className="py-2 px-3"><div className="h-4 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                    <td className="py-2 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-8" /></td>
                    <td className="py-2 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-10" /></td>
                    <td className="py-2 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-10" /></td>
                    <td className="py-2 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-24" /></td>
                    <td className="py-2 px-3"><div className="h-3 bg-slate-200 dark:bg-zinc-850 rounded w-16" /></td>
                  </tr>
                ))
              ) : historyList.length > 0 ? (
                historyList.map((txn) => (
                  <tr key={txn._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/20">
                    <td className="py-2 px-3 font-semibold text-zinc-400">
                      {new Date(txn.createdAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit"
                      })}
                    </td>
                    <td className="py-2 px-3">{getTransactionTypeBadge(txn.type)}</td>
                    <td className="py-2 px-3 font-black text-slate-800 dark:text-white">
                      {txn.type === "stock_in" ? "+" : txn.type === "stock_out" ? "-" : ""}
                      {txn.quantity} {ingredient?.unit}
                    </td>
                    <td className="py-2 px-3 text-zinc-400">{txn.previousStock} {ingredient?.unit}</td>
                    <td className="py-2 px-3 font-bold text-slate-800 dark:text-white">{txn.newStock} {ingredient?.unit}</td>
                    <td className="py-2 px-3 break-words max-w-[200px]" title={txn.reason}>{txn.reason}</td>
                    <td className="py-2 px-3 font-medium text-zinc-400">{txn.createdBy}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400 dark:text-zinc-550 font-bold">
                    No transactions matched your query filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Section */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between mt-3 select-none">
            <span className="text-[10px] font-bold text-zinc-400">
              Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total logs)
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-3 pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all"
          >
            Close Ledgers
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
