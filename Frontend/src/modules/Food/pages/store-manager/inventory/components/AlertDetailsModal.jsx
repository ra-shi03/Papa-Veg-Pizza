import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { useAlertDetails } from "../hooks/useAlertDetails";
import { format } from "date-fns";
import { 
  Eye, 
  AlertCircle, 
  Calendar, 
  TrendingDown, 
  CheckCircle2, 
  Clock,
  Layers,
  Truck,
  IndianRupee,
  FilePlus
} from "lucide-react";
import { SeverityBadge } from "./SeverityBadge";
import { StatusBadge } from "./StatusBadge";

export function AlertDetailsModal({ 
  isOpen, 
  onClose, 
  alertId, 
  role = "store_manager",
  onResolve,
  onCreateRequest
}) {
  const { data: alert, isLoading, error } = useAlertDetails(alertId);

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const formatRupee = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-32px)] sm:w-full max-w-3xl lg:max-w-[calc(100vw-340px)] xl:max-w-3xl lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[90vh] md:max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <Eye className="text-[var(--primary)] w-4.5 h-4.5" />
              Low Stock Alert Audit Report
            </DialogTitle>
            {alert && (
              <div className="flex items-center gap-2">
                <StatusBadge status={alert.status} />
                <SeverityBadge severity={alert.severity} />
              </div>
            )}
          </div>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-[10px]">
            System-generated alert details, estimated depletion analysis, and resolution logs.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">Loading alert details...</p>
          </div>
        ) : error ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white">Failed to Load Details</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm">{error.message}</p>
          </div>
        ) : !alert ? (
          <div className="flex-1 py-8 text-center text-zinc-400 dark:text-zinc-550 text-xs font-bold">
            No alert data found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 select-none text-xs">
            
            {/* Grid 1: Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Ingredient Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <Layers size={10} className="text-zinc-400" />
                    Ingredient
                  </span>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1.5 leading-tight">
                    {alert.ingredientName}
                  </h4>
                  <p className="text-[9px] text-zinc-400 mt-1">ID: {alert.ingredientId}</p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400 font-semibold">Category:</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">{alert.category}</span>
                </div>
              </div>

              {/* Stock Levels Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <TrendingDown size={10} className="text-[var(--primary)]" />
                    Stock Metrics
                  </span>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase">Current Stock</p>
                      <p className="text-sm font-black text-rose-600 dark:text-rose-400 mt-0.5">
                        {alert.currentStock} {alert.unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-400 font-bold uppercase">Min Stock</p>
                      <p className="text-sm font-black text-slate-800 dark:text-white mt-0.5">
                        {alert.minimumStock} {alert.unit}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400 font-semibold">Reorder Level:</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">
                    {alert.reorderLevel} {alert.unit}
                  </span>
                </div>
              </div>

              {/* Procurement & Pricing */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                    <Truck size={10} className="text-zinc-400" />
                    Supplier & Cost
                  </span>
                  <p className="text-xs font-black text-slate-800 dark:text-white mt-1.5 leading-tight truncate">
                    {alert.supplierName}
                  </p>
                  <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-0.5">
                    <IndianRupee size={9} />
                    Cost/Unit: {formatRupee(alert.costPerUnit)}
                  </p>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400 font-semibold">Timeline:</span>
                  <span className="font-bold text-slate-750 dark:text-zinc-300 flex items-center gap-1">
                    <Calendar size={10} />
                    {formatDate(alert.createdAt)}
                  </span>
                </div>
              </div>

            </div>

            {/* Consumption Analytics */}
            <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl p-4">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Clock size={11} className="text-[var(--primary)]" />
                Consumption Analytics & Forecast
              </h5>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Today's Consumption</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
                    {alert.consumption.today} {alert.unit}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Last 7 Days</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
                    {alert.consumption.week} {alert.unit}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Last 30 Days</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
                    {alert.consumption.month} {alert.unit}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-900/30">
                  <p className="text-[9px] text-zinc-400 font-bold uppercase">Daily Average</p>
                  <p className="text-sm font-black text-slate-800 dark:text-white mt-1">
                    {alert.consumption.averageDaily} {alert.unit}
                  </p>
                </div>
              </div>

              {/* Forecast indicator */}
              <div className="mt-4 p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/20 bg-amber-50/30 dark:bg-amber-950/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Depletion Estimation</p>
                  <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                    Estimated duration of remaining stock based on daily average kitchen usage patterns.
                  </p>
                </div>
                <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/20 dark:border-amber-500/40 rounded-xl text-center shrink-0">
                  <span className="text-xs font-black text-amber-707 dark:text-amber-350">
                    {alert.depletionEstimation}
                  </span>
                </div>
              </div>
            </div>

            {/* Resolution History (only if status is resolved) */}
            {alert.status === "resolved" && (
              <div className="bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-[10px] font-black text-emerald-800 dark:text-emerald-450 uppercase tracking-widest flex items-center gap-1.5">
                    <CheckCircle2 size={12} />
                    Resolution Summary
                  </h5>
                  <span className="text-[9px] text-emerald-700 dark:text-emerald-400 font-bold">
                    Resolved {formatDate(alert.resolvedAt)}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px]">
                  <div>
                    <span className="text-zinc-400 font-medium">Audited & Resolved By:</span>
                    <p className="font-bold text-slate-800 dark:text-white mt-0.5">{alert.resolvedBy}</p>
                  </div>
                  <div>
                    <span className="text-zinc-400 font-medium">Resolution Notes:</span>
                    <p className="font-semibold text-slate-700 dark:text-zinc-350 mt-0.5 bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-100 dark:border-zinc-800">
                      {alert.resolutionNote || "No notes provided."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Footer Buttons inside Dialog */}
            <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                Close Audit
              </button>

              {alert.status === "active" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onCreateRequest(alert);
                      onClose();
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    <FilePlus size={12} />
                    Raise Stock Request
                  </button>

                  {role === "store_manager" && (
                    <button
                      type="button"
                      onClick={() => {
                        onResolve(alert);
                        onClose();
                      }}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                    >
                      <CheckCircle2 size={12} />
                      Resolve Alert
                    </button>
                  )}
                </>
              )}
            </div>

          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
