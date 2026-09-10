import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { useShortageDetails } from "../hooks/useShortageDetails";
import { format } from "date-fns";
import { 
  Eye, 
  AlertCircle, 
  TrendingDown, 
  Clock, 
  Users, 
  Calendar, 
  CheckCircle2, 
  HelpCircle,
  Truck,
  IndianRupee,
  Layers,
  MapPin,
  Megaphone
} from "lucide-react";

export function ShortageDetailsModal({ 
  isOpen, 
  onClose, 
  shortageId, 
  role = "store_manager",
  onTransfer,
  onResolve,
  onNotifyAdmin
}) {
  const { data, isLoading, error } = useShortageDetails(shortageId);
  const [activeTab, setActiveTab] = useState("orders");

  const shortage = data?.shortage;
  const ingredient = data?.ingredient;
  const affectedOrders = data?.affectedOrders || [];
  const analytics = data?.analytics || {};
  const timeline = data?.timeline || [];

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

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case "low":
        return <span className="inline-flex items-center text-[10px] font-black text-blue-700 dark:text-blue-405 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/30 uppercase tracking-wider">Low</span>;
      case "medium":
        return <span className="inline-flex items-center text-[10px] font-black text-yellow-700 dark:text-yellow-405 bg-yellow-50 dark:bg-yellow-955/20 px-2.5 py-0.5 rounded-full border border-yellow-100 dark:border-yellow-900/30 uppercase tracking-wider">Medium</span>;
      case "high":
        return <span className="inline-flex items-center text-[10px] font-black text-orange-700 dark:text-orange-405 bg-orange-50 dark:bg-orange-955/20 px-2.5 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/30 uppercase tracking-wider">High</span>;
      case "critical":
        return <span className="inline-flex items-center text-[10px] font-black text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-955/20 px-2.5 py-0.5 rounded-full border border-red-100 dark:border-red-900/30 uppercase tracking-wider animate-pulse">Critical</span>;
      default:
        return <span className="capitalize">{severity}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return <span className="inline-flex items-center text-[10px] font-black text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-955/20 px-2.5 py-0.5 rounded-full border border-red-100 dark:border-red-900/30 uppercase tracking-wider animate-pulse">Active</span>;
      case "resolved":
        return <span className="inline-flex items-center text-[10px] font-black text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-955/20 px-2.5 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/30 uppercase tracking-wider">Resolved</span>;
      default:
        return <span className="capitalize">{status}</span>;
    }
  };

  const getTimelineIcon = (action) => {
    switch (action) {
      case "detected":
        return <div className="w-6 h-6 rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-550 flex items-center justify-center border border-rose-100 dark:border-rose-900/30"><AlertCircle size={12} /></div>;
      case "reported":
        return <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-955/20 text-blue-550 flex items-center justify-center border border-blue-100 dark:border-blue-900/30"><Megaphone size={12} /></div>;
      case "transfer_initiated":
        return <div className="w-6 h-6 rounded-full bg-amber-50 dark:bg-amber-955/20 text-amber-550 flex items-center justify-center border border-amber-100 dark:border-amber-900/30"><Truck size={12} /></div>;
      case "resolved":
        return <div className="w-6 h-6 rounded-full bg-emerald-50 dark:bg-emerald-955/20 text-emerald-550 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/30"><CheckCircle2 size={12} /></div>;
      default:
        return <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-zinc-800 text-slate-550 flex items-center justify-center border border-slate-100 dark:border-zinc-700"><HelpCircle size={12} /></div>;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-40px)] max-w-6xl lg:max-w-[calc(100vw-340px)] xl:max-w-6xl lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[90vh] md:max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <Eye className="text-[var(--primary)] w-4.5 h-4.5" />
              Ingredient Shortage Audit File
            </DialogTitle>
            {shortage && (
              <div className="flex items-center gap-2">
                {getStatusBadge(shortage.status)}
                {getSeverityBadge(shortage.severity)}
              </div>
            )}
          </div>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400 text-[10px]">
            Comprehensive shortage metrics, revenue delays, branch transfers analysis, and resolution trails.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">Loading shortage details...</p>
          </div>
        ) : error ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-955/20 text-rose-500 rounded-full flex items-center justify-center">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white">Failed to Load Details</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm">{error.message}</p>
          </div>
        ) : !shortage ? (
          <div className="flex-1 py-8 text-center text-zinc-400 dark:text-zinc-550 text-xs font-bold">
            No shortage logs found.
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 select-none text-xs">
            
            {/* Top Grid: Ingredient Info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-zinc-950 p-3.5 rounded-2xl border border-slate-100 dark:border-zinc-850 mb-4 shrink-0">
              <div className="space-y-1">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Layers size={10} />
                  Ingredient
                </span>
                <p className="font-bold text-slate-800 dark:text-white truncate">{ingredient?.ingredientName}</p>
                <p className="text-[9px] text-zinc-405 leading-none">Category: {ingredient?.category}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Truck size={10} />
                  Vendor
                </span>
                <p className="font-bold text-slate-850 dark:text-zinc-200 truncate">{ingredient?.supplierName || "Default supplier"}</p>
                <p className="text-[9px] text-zinc-405 leading-none">Cost/Unit: {formatRupee(ingredient?.costPerUnit || 0)}</p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Clock size={10} />
                  Shortage Metrics
                </span>
                <p className="font-bold text-rose-600 dark:text-rose-405">
                  Missing Qty: {ingredient?.missingQty} {ingredient?.unit || "KG"}
                </p>
                <p className="text-[9px] text-zinc-405 leading-none">
                  Current Stock: {ingredient?.currentStock} / Req: {ingredient?.requiredStock}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1">
                  <Calendar size={10} />
                  Detection Timestamp
                </span>
                <p className="font-bold text-slate-800 dark:text-zinc-200">
                  {formatDate(shortage.createdAt)}
                </p>
                <p className="text-[9px] text-zinc-405 leading-none">Created By: {shortage.createdBy}</p>
              </div>
            </div>

            {/* Tab navigation bar */}
            <div className="flex border-b border-zinc-150 dark:border-zinc-800 mb-3 select-none">
              <button
                onClick={() => setActiveTab("orders")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "orders" 
                    ? "border-[var(--primary)] text-slate-900 dark:text-white" 
                    : "border-transparent text-zinc-450 hover:text-slate-700 dark:hover:text-zinc-300"
                }`}
              >
                Affected Orders ({affectedOrders.length})
              </button>
              <button
                onClick={() => setActiveTab("analytics")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "analytics" 
                    ? "border-[var(--primary)] text-slate-900 dark:text-white" 
                    : "border-transparent text-zinc-450 hover:text-slate-700 dark:hover:text-zinc-300"
                }`}
              >
                Analytics & Logistics
              </button>
              <button
                onClick={() => setActiveTab("timeline")}
                className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                  activeTab === "timeline" 
                    ? "border-[var(--primary)] text-slate-900 dark:text-white" 
                    : "border-transparent text-zinc-450 hover:text-slate-700 dark:hover:text-zinc-300"
                }`}
              >
                Audit Timeline ({timeline.length})
              </button>
            </div>

            {/* Scrollable Tab Content */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-3.5">
              
              {/* Tab 1: Affected Orders */}
              {activeTab === "orders" && (
                <div className="space-y-3">
                  {affectedOrders.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-550 font-bold">
                      No active orders affected by this shortage.
                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs table-auto">
                          <thead className="bg-slate-50 dark:bg-zinc-950 text-slate-400 dark:text-zinc-500 text-[9px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-zinc-850">
                            <tr>
                              <th className="py-3 px-4">Order ID</th>
                              <th className="py-3 px-4">Customer</th>
                              <th className="py-3 px-4">Pizza Name</th>
                              <th className="py-3 px-4 text-center">Qty</th>
                              <th className="py-3 px-4">Order Status</th>
                              <th className="py-3 px-4">Expected Delivery</th>
                              <th className="py-3 px-4 text-right">Revenue</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-850">
                            {affectedOrders.map((order, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/15">
                                <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-zinc-200">{order._id}</td>
                                <td className="py-2.5 px-4 font-semibold text-slate-700 dark:text-zinc-300">{order.customer}</td>
                                <td className="py-2.5 px-4 text-zinc-600 dark:text-zinc-450 font-semibold">{order.pizzaName}</td>
                                <td className="py-2.5 px-4 text-center font-bold text-slate-850 dark:text-zinc-200">{order.quantity}</td>
                                <td className="py-2.5 px-4">
                                  <span className={`inline-flex items-center text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                                    order.status === "preparing" 
                                      ? "text-amber-707 bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 animate-pulse"
                                      : "text-red-700 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-900/30 animate-bounce"
                                  }`}>
                                    {order.status}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 font-medium text-zinc-450">{order.expectedDelivery}</td>
                                <td className="py-2.5 px-4 text-right font-black text-slate-800 dark:text-white">
                                  {formatRupee(order.revenue)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 2: Analytics & Alternatives */}
              {activeTab === "analytics" && (
                <div className="space-y-4">
                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {/* Revenue Impact Card */}
                    <div className="p-3.5 rounded-xl border border-rose-100 dark:border-rose-900/20 bg-rose-50/20 dark:bg-rose-955/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">Revenue Impact Delay</p>
                        <p className="text-zinc-505 mt-1 font-semibold leading-relaxed">
                          Sum value of delayed or unfulfilled orders on hold due to missing ingredients.
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-rose-500/10 dark:bg-rose-500/20 rounded-xl text-center">
                        <span className="text-base font-black text-rose-600 dark:text-rose-400 leading-none">
                          {formatRupee(analytics.revenueLoss)}
                        </span>
                      </div>
                    </div>

                    {/* Delay Count Card */}
                    <div className="p-3.5 rounded-xl border border-amber-100 dark:border-amber-900/20 bg-amber-50/20 dark:bg-amber-955/5 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">Delayed Kitchen Orders</p>
                        <p className="text-zinc-505 mt-1 font-semibold leading-relaxed">
                          Total customer pizzas currently stalled on assembly deck prep stations.
                        </p>
                      </div>
                      <div className="px-4 py-2 bg-amber-500/10 dark:bg-amber-500/20 rounded-xl text-center">
                        <span className="text-base font-black text-amber-600 dark:text-amber-400 leading-none">
                          {analytics.delayedOrders} Orders
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nearest Branch Stocks */}
                    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-850 space-y-3">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <MapPin size={11} className="text-[var(--primary)]" />
                        Nearest Branch Availability
                      </h5>
                      <div className="space-y-2">
                        {analytics.stores?.map((store, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <div>
                              <p className="font-bold text-slate-800 dark:text-zinc-200">{store.name}</p>
                              <p className="text-[9px] text-zinc-400 mt-0.5">Distance: {store.distance} km | Manager: {store.managerName}</p>
                            </div>
                            <span className={`text-xs font-black px-2.5 py-1 rounded-lg ${
                              store.availableQty >= shortage.shortageQty 
                                ? "text-emerald-600 bg-emerald-50 dark:text-emerald-450 dark:bg-emerald-950/20 border border-emerald-100/50" 
                                : "text-amber-600 bg-amber-50 dark:text-amber-450 dark:bg-amber-955/20 border border-amber-100/50"
                            }`}>
                              {store.availableQty} {ingredient?.unit || "KG"}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alternatives Availability */}
                    <div className="bg-slate-50 dark:bg-zinc-950 p-4 rounded-xl border border-slate-100 dark:border-zinc-850 space-y-3">
                      <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Layers size={11} className="text-[var(--primary)]" />
                        Alternative Ingredient Stock
                      </h5>
                      <div className="space-y-2">
                        {analytics.alternatives?.map((alt, idx) => (
                          <div key={idx} className="flex justify-between items-center bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                            <span className="font-bold text-slate-800 dark:text-zinc-200">{alt.name}</span>
                            <span className="text-xs font-black text-blue-600 bg-blue-50 dark:text-blue-450 dark:bg-blue-955/20 border border-blue-100/50 px-2.5 py-1 rounded-lg">
                              {alt.stock}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                  </div>

                </div>
              )}

              {/* Tab 3: Timeline */}
              {activeTab === "timeline" && (
                <div className="p-2 space-y-4">
                  {timeline.length === 0 ? (
                    <div className="py-8 text-center text-zinc-400 dark:text-zinc-550 font-bold">
                      No timeline entries registered yet.
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-100 dark:border-zinc-800 ml-3.5 space-y-5">
                      {timeline.map((event, idx) => (
                        <div key={idx} className="relative pl-7 select-none">
                          {/* Left bullet icon */}
                          <div className="absolute -left-3.5 top-0.5 z-10">
                            {getTimelineIcon(event.action)}
                          </div>
                          
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-black text-slate-800 dark:text-zinc-200 capitalize">
                                {event.action.replace("_", " ")}
                              </span>
                              <span className="text-[9px] font-bold text-zinc-400 flex items-center gap-0.5 bg-slate-50 dark:bg-zinc-950 border px-1.5 py-0.5 rounded-md">
                                <Calendar size={8} />
                                {formatDate(event.createdAt)}
                              </span>
                            </div>
                            <p className="text-zinc-505 dark:text-zinc-400 font-semibold">{event.remarks}</p>
                            <p className="text-[9px] font-bold text-zinc-400">By: {event.user}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* Bottom Actions footer inside details */}
            <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 text-xs font-bold text-zinc-705 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all"
              >
                Close Audit File
              </button>

              {shortage.status === "active" && role === "store_manager" && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      onNotifyAdmin(shortage);
                      onClose();
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    Notify Admin
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTransfer(shortage);
                      onClose();
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    Transfer Stock
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onResolve(shortage);
                      onClose();
                    }}
                    className="px-4 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all flex items-center gap-1 shadow-sm cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                </>
              )}
            </div>

          </div>
        )}

      </DialogContent>
    </Dialog>
  );
}
