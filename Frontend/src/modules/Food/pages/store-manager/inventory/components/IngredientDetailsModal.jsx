import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { 
  Tabs, 
  TabsList, 
  TabsTrigger, 
  TabsContent 
} from "@food/components/ui/tabs";
import { Badge } from "@food/components/ui/badge";
import { useIngredientDetails } from "../hooks/useIngredientDetails";
import { 
  ClipboardList, 
  TrendingUp, 
  Activity, 
  Info, 
  ShieldAlert, 
  Calendar, 
  Coins, 
  Package, 
  Boxes 
} from "lucide-react";

export function IngredientDetailsModal({ isOpen, onClose, ingredientId }) {
  const { data, isLoading, error } = useIngredientDetails(ingredientId);

  // Status badge style helper
  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-emerald-50 hover:bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30 rounded-xl px-2.5 py-1 text-xs font-bold capitalize">
            Available
          </Badge>
        );
      case "low_stock":
        return (
          <Badge className="bg-amber-50 hover:bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/30 rounded-xl px-2.5 py-1 text-xs font-bold capitalize">
            Low Stock
          </Badge>
        );
      case "out_of_stock":
        return (
          <Badge className="bg-rose-50 hover:bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30 rounded-xl px-2.5 py-1 text-xs font-bold capitalize animate-pulse">
            Out of Stock
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-xl px-2.5 py-1 text-xs capitalize">
            {status}
          </Badge>
        );
    }
  };

  // Transaction type badge helper
  const getTransactionTypeBadge = (type) => {
    switch (type) {
      case "stock_in":
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30">▲ Stock In</span>;
      case "stock_out":
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">▼ Stock Out</span>;
      case "adjustment":
        return <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2 py-0.5 rounded-full border border-amber-100 dark:border-amber-900/30">⚙ Adj</span>;
      default:
        return <span className="text-[10px] font-semibold">{type}</span>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl lg:max-w-[calc(100vw-340px)] xl:max-w-3xl lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Modal Header */}
        <DialogHeader className="mb-3">
          <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
            <Boxes className="text-[var(--primary)] w-4 h-4" />
            Ingredient Details
          </DialogTitle>
          <DialogDescription className="text-zinc-550 dark:text-zinc-400 text-[10px]">
            Review detailed reports, threshold configurations, and usage statistics.
          </DialogDescription>
        </DialogHeader>

        {/* Loading and Error Handlers */}
        {isLoading ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">Fetching ingredient metrics...</p>
          </div>
        ) : error ? (
          <div className="flex-1 py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center">
              <ShieldAlert size={24} />
            </div>
            <p className="text-sm font-bold text-zinc-900 dark:text-white">Failed to Load Details</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">{error.message || "An unexpected error occurred."}</p>
          </div>
        ) : !data || !data.ingredient ? (
          <div className="flex-1 py-12 text-center text-zinc-400 dark:text-zinc-500 text-sm">
            No ingredient records found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6 pr-1 select-none">
            
            {/* Quick Hero Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850">
              <div>
                <h3 className="text-sm font-black text-slate-900 dark:text-white leading-tight">{data.ingredient.ingredientName}</h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-505 mt-0.5">ID: {data.ingredient._id} | Last Updated by {data.ingredient.lastUpdatedBy}</p>
              </div>
              <div className="flex items-center gap-2">
                {getStatusBadge(data.ingredient.status)}
                <span className="text-[10px] font-bold text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-lg">
                  {data.ingredient.category}
                </span>
              </div>
            </div>

            {/* Content Tabs */}
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid grid-cols-4 gap-1 p-0.5 bg-slate-100 dark:bg-zinc-950 rounded-xl border border-slate-200/50 dark:border-zinc-850 mb-4">
                <TabsTrigger value="basic" className="rounded-lg py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm">
                  <Info size={13} className="inline mr-1" /> Basic
                </TabsTrigger>
                <TabsTrigger value="stock" className="rounded-lg py-1.5 text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm">
                  <ClipboardList size={13} className="inline mr-1" /> Stock Info
                </TabsTrigger>
                <TabsTrigger value="stats" className="rounded-xl py-2 text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm">
                  <Activity size={14} className="inline mr-1.5" /> Consumption
                </TabsTrigger>
                <TabsTrigger value="txns" className="rounded-xl py-2 text-xs font-bold transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-900 data-[state=active]:shadow-sm">
                  <Calendar size={14} className="inline mr-1.5" /> History
                </TabsTrigger>
              </TabsList>

              {/* Tab 1: Basic Information */}
              <TabsContent value="basic" className="space-y-4 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Ingredient Name</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{data.ingredient.ingredientName}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Category Group</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{data.ingredient.category}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Supplier Vendor</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{data.ingredient.supplierName || "Direct Franchise Procurement"}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Purchase Unit</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-100">{data.ingredient.unit}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1 md:col-span-2 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cost Per Unit</p>
                      <p className="text-lg font-black text-[var(--primary)] mt-0.5">₹{data.ingredient.costPerUnit.toFixed(2)} <span className="text-xs font-normal text-zinc-400">/ {data.ingredient.unit}</span></p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                      <Coins size={20} />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Tab 2: Stock Information */}
              <TabsContent value="stock" className="space-y-4 outline-none">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Current Stock</p>
                    <p className="text-xl font-black text-slate-900 dark:text-white">{data.ingredient.currentStock} <span className="text-xs font-bold text-slate-500">{data.ingredient.unit}</span></p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Minimum Threshold</p>
                    <p className="text-xl font-black text-slate-700 dark:text-zinc-300">{data.ingredient.minimumStock} <span className="text-xs font-bold text-slate-500">{data.ingredient.unit}</span></p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Reorder Level</p>
                    <p className="text-xl font-black text-slate-700 dark:text-zinc-300">{data.ingredient.reorderLevel} <span className="text-xs font-bold text-slate-500">{data.ingredient.unit}</span></p>
                  </div>
                </div>

                {/* Stock Level Warning Panel */}
                {data.ingredient.currentStock <= data.ingredient.reorderLevel && (
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-900/30 flex items-start gap-3">
                    <ShieldAlert className="text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" size={18} />
                    <div>
                      <h4 className="text-xs font-black text-amber-900 dark:text-amber-400">Reorder Threshold Reached</h4>
                      <p className="text-[11px] text-amber-700 dark:text-amber-500 mt-0.5 leading-relaxed">
                        This item has fallen below its reorder level of {data.ingredient.reorderLevel} {data.ingredient.unit}. Please coordinate with store managers to initiate replenishment immediately to prevent operational kitchen shortages.
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Tab 3: Consumption Statistics */}
              <TabsContent value="stats" className="space-y-4 outline-none">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Used Today</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{data.consumption.today} <span className="text-xs font-bold text-slate-400">{data.ingredient.unit}</span></p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Used This Week</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{data.consumption.week} <span className="text-xs font-bold text-slate-400">{data.ingredient.unit}</span></p>
                  </div>
                  <div className="p-4 rounded-2xl border border-slate-100 dark:border-zinc-850 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Used This Month</p>
                    <p className="text-base font-black text-slate-900 dark:text-white">{data.consumption.month} <span className="text-xs font-bold text-slate-400">{data.ingredient.unit}</span></p>
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/10 border border-indigo-100 dark:border-indigo-950/30 space-y-1">
                    <p className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">Daily Average</p>
                    <p className="text-base font-black text-indigo-700 dark:text-indigo-400">{data.consumption.averageDaily} <span className="text-xs font-bold text-indigo-500/70">{data.ingredient.unit}</span></p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center">
                      <TrendingUp size={16} />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-900 dark:text-white">Estimated Stock Runway</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">Based on average daily kitchen usage rates</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-slate-800 dark:text-slate-100">
                    {data.ingredient.currentStock > 0 && data.consumption.averageDaily > 0
                      ? `${Math.round(data.ingredient.currentStock / data.consumption.averageDaily)} Operations Days`
                      : "0 Days (Refill Needed)"}
                  </p>
                </div>
              </TabsContent>

              {/* Tab 4: Recent Transactions */}
              <TabsContent value="txns" className="space-y-4 outline-none">
                <div className="border border-slate-100 dark:border-zinc-850 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-zinc-950 border-b border-slate-100 dark:border-zinc-850 font-black uppercase tracking-widest text-[9px] text-slate-400 dark:text-zinc-550">
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Qty</th>
                        <th className="py-2.5 px-3">Reason</th>
                        <th className="py-2.5 px-3">Logged By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
                      {data.recentTransactions && data.recentTransactions.length > 0 ? (
                        data.recentTransactions.map((txn) => (
                          <tr key={txn._id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/20">
                            <td className="py-2 px-3 font-semibold text-zinc-400">
                              {new Date(txn.createdAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </td>
                            <td className="py-2 px-3">{getTransactionTypeBadge(txn.type)}</td>
                            <td className="py-2 px-3 font-black">
                              {txn.type === "stock_in" ? "+" : txn.type === "stock_out" ? "-" : ""}
                              {txn.quantity} {data.ingredient.unit}
                            </td>
                            <td className="py-2 px-3 truncate max-w-[180px]" title={txn.reason}>{txn.reason}</td>
                            <td className="py-2 px-3 font-medium text-zinc-400">{txn.createdBy}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-zinc-400 dark:text-zinc-500 font-bold">
                            No recent transactions found for this ingredient.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
          >
            Close Panel
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
}
