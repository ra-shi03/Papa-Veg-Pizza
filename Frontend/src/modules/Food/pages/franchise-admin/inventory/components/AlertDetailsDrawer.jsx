import React, { useState, useEffect, useRef } from "react";
import { 
  X, AlertTriangle, AlertCircle, CheckCircle, Clock, User, 
  TrendingUp, ShoppingBag, Calendar, Info, Layers, MessageSquare, Clipboard
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { useAlertDetailQuery, useUpdateAlertMutation, useAlertConsumptionTrend } from "../hooks/useAlerts";
import { mockSuppliers } from "../mockData";

export default function AlertDetailsDrawer({ isOpen, onClose, alertId, onResolve, onCreatePR }) {
  const [activeTab, setActiveTab] = useState("stock"); // stock, consumption, suggestion, timeline
  const [notes, setNotes] = useState("");
  const notesRef = useRef("");

  const { data: detailResponse, isLoading } = useAlertDetailQuery(alertId);
  const updateAlertMutation = useUpdateAlertMutation();

  const alertRecord = detailResponse?.data;
  
  // Consumption trend hook
  const { data: trendResponse } = useAlertConsumptionTrend(
    alertRecord?.ingredientId,
    alertRecord?.storeId
  );
  const trendData = trendResponse?.data?.trend || [];
  const trendMetrics = trendResponse?.data?.metrics || { averageUsage: 1, projectedDepletion: 7 };

  useEffect(() => {
    if (alertRecord) {
      setNotes(alertRecord.notes || "");
      notesRef.current = alertRecord.notes || "";
    }
  }, [alertRecord]);

  if (!isOpen) return null;

  const handleNotesBlur = () => {
    if (notes !== notesRef.current) {
      updateAlertMutation.mutate({
        id: alertId,
        updates: { notes }
      }, {
        onSuccess: () => {
          notesRef.current = notes;
        }
      });
    }
  };

  const getSeverityBadge = (sev) => {
    if (sev === "CRITICAL") {
      return (
        <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-red-500/10 text-red-500 border border-red-500/20">
          Critical
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/20">
        Low
      </span>
    );
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "RESOLVED":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
            <CheckCircle size={10} /> Resolved
          </span>
        );
      case "PURCHASE REQUEST CREATED":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-purple-500/10 text-purple-600 border border-purple-500/20 flex items-center gap-1">
            <ShoppingBag size={10} /> PR Created
          </span>
        );
      case "IN PROGRESS":
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-indigo-500/10 text-indigo-650 border border-indigo-500/20 flex items-center gap-1 animate-pulse">
            <Clock size={10} /> In Progress
          </span>
        );
      case "OPEN":
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[8.5px] font-black uppercase bg-blue-500/10 text-blue-600 border border-blue-500/20 flex items-center gap-1">
            <AlertCircle size={10} /> Open
          </span>
        );
    }
  };

  const ingredient = alertRecord?.ingredient;
  const unit = ingredient?.unit || "Units";
  const idealStock = alertRecord?.reorderLevel ? (alertRecord.reorderLevel * 4) : 100;
  const suggestedPRQty = Math.max(0, idealStock - (alertRecord?.currentStock || 0));

  // Find supplier
  const supplier = mockSuppliers.find(s => s._id === ingredient?.supplierId) || {
    name: "Durga Dairy Farms",
    contact: "Sunil Sharma",
    phone: "+91 98270 12345"
  };

  const estimatedCost = suggestedPRQty * (ingredient?.costPerUnit || 0);

  // Time relative string helper
  const getRelativeTime = (isoString) => {
    if (!isoString) return "";
    const created = new Date(isoString);
    const diffMs = new Date() - created;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      return `${diffMins} minutes ago`;
    }
    if (diffHours < 24) {
      return `${diffHours} hours ago`;
    }
    return created.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <div className="fixed inset-y-0 right-0 left-0 lg:left-[280px] z-50 overflow-hidden text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs z-40 animate-fade-in" onClick={onClose} />

      {/* Sliding Drawer Body */}
      <div className="absolute top-0 bottom-0 right-0 w-full max-w-[650px] bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl z-50 flex flex-col overflow-hidden animate-slide-in">
        
        {/* Header Section */}
        {isLoading ? (
          <div className="p-5 border-b border-zinc-150 dark:border-zinc-850 space-y-3 animate-pulse bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="h-10 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-3/4" />
            <div className="h-4 bg-zinc-100 dark:bg-zinc-900 rounded-lg w-1/2" />
          </div>
        ) : (
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 flex flex-col gap-3">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img 
                  src={ingredient?.image || "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=100&q=80"}
                  alt={ingredient?.name}
                  className="w-12 h-12 rounded-xl object-cover border border-zinc-200 dark:border-zinc-800 bg-white"
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=100&q=80";
                  }}
                />
                <div>
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white leading-tight">
                    {ingredient?.name}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-1 text-[10px] text-zinc-450">
                    <span className="font-mono text-zinc-700 dark:text-zinc-350">{ingredient?.ingredientCode}</span>
                    <span>•</span>
                    <span>{alertRecord?.storeName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5"><Clock size={10} /> {getRelativeTime(alertRecord?.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400">
                <X size={16} />
              </button>
            </div>

            {/* Badges and Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="flex items-center gap-2">
                {getSeverityBadge(alertRecord?.severity)}
                {getStatusBadge(alertRecord?.status)}
              </div>

              {alertRecord?.status !== "RESOLVED" && (
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onCreatePR(alertRecord)}
                    className="px-3 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <ShoppingBag size={12} /> PR Request
                  </button>
                  <button 
                    onClick={() => onResolve(alertRecord)}
                    className="px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all shadow-sm"
                  >
                    <CheckCircle size={12} /> Resolve Alert
                  </button>
                </div>
              )}
            </div>

            {/* Assigned User bar */}
            <div className="p-2.5 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-[10px]">
                  {alertRecord?.assignedUser?.name?.charAt(0) || "U"}
                </div>
                <div>
                  <p className="text-[10px] text-zinc-400 leading-tight">Assigned To</p>
                  <p className="font-extrabold text-zinc-850 dark:text-white mt-0.5">{alertRecord?.assignedUser?.name || "Unassigned"}</p>
                </div>
              </div>
              <span className="text-[8.5px] uppercase font-bold px-2 py-0.5 rounded bg-zinc-50 dark:bg-zinc-800 text-zinc-450">
                {alertRecord?.assignedUser?.role || "Staff Member"}
              </span>
            </div>
          </header>
        )}

        {/* Navigation Tabs */}
        <nav className="flex border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10 px-4">
          {[
            { id: "stock", label: "Stock Levels", icon: Layers },
            { id: "consumption", label: "Consumption Trend", icon: TrendingUp },
            { id: "suggestion", label: "Supplier Details", icon: Clipboard },
            { id: "timeline", label: "Activity Audit Log", icon: Clock }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-3 font-extrabold border-b-2 transition-all cursor-pointer ${
                  activeTab === tab.id
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-zinc-400 hover:text-zinc-650"
                }`}
              >
                <Icon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin bg-white dark:bg-zinc-950">
          
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-28 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
              <div className="h-28 bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
            </div>
          ) : (
            <>
              {/* Tab 1: Stock Information */}
              {activeTab === "stock" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Current Stock</span>
                      <span className="text-sm font-black text-zinc-850 dark:text-white mt-1 block">
                        {alertRecord?.currentStock} {unit}
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Reorder Level</span>
                      <span className="text-sm font-black text-zinc-850 dark:text-white mt-1 block">
                        {alertRecord?.reorderLevel} {unit}
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-55 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Ideal Capacity</span>
                      <span className="text-sm font-black text-zinc-800 dark:text-white mt-1 block">
                        {idealStock} {unit}
                      </span>
                    </div>

                    <div className="p-3 bg-zinc-55 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Days Remaining Est.</span>
                      <span className={`text-sm font-black mt-1 block ${
                        trendMetrics.projectedDepletion <= 2 ? "text-red-650" : "text-amber-600"
                      }`}>
                        ~{trendMetrics.projectedDepletion} Days
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-start gap-2.5">
                    <Info size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-extrabold text-[11px] text-zinc-800 dark:text-white">Replenishment Alert Details</h4>
                      <p className="text-[10px] text-zinc-450 mt-1 leading-normal">
                        Based on consumption records, this store consumes an average of <span className="font-bold text-zinc-800 dark:text-zinc-200">{trendMetrics.averageUsage} {unit} / day</span>. Order replenishment should arrive within the next {trendMetrics.projectedDepletion > 1 ? trendMetrics.projectedDepletion - 1 : 1} days to prevent complete kitchen service stockout.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Recent Consumption */}
              {activeTab === "consumption" && (
                <div className="space-y-4">
                  {/* Consumption chart */}
                  <div className="p-4 bg-zinc-50 dark:bg-zinc-900/30 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Average Consumption</span>
                        <span className="text-xs font-black text-zinc-850 dark:text-white mt-0.5 block">
                          {trendMetrics.averageUsage} {unit} / day
                        </span>
                      </div>
                      <span className="text-[8.5px] font-black uppercase text-emerald-600 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                        Last 7 Days
                      </span>
                    </div>

                    <div className="h-36 w-full text-[9px] font-semibold font-mono">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                          <defs>
                            <linearGradient id="alertColorPrimary" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.25}/>
                              <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" stroke="#888888" tickLine={false} axisLine={false} />
                          <YAxis stroke="#888888" tickLine={false} axisLine={false} />
                          <Tooltip 
                            contentStyle={{ background: "rgba(24, 24, 27, 0.95)", border: "none", borderRadius: "10px", color: "#fff" }}
                            labelStyle={{ fontWeight: "bold" }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="quantity" 
                            stroke="var(--primary)" 
                            strokeWidth={2}
                            fillOpacity={1} 
                            fill="url(#alertColorPrimary)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Total Consumed (7d)</span>
                      <span className="text-xs font-black text-zinc-850 dark:text-white mt-1 block">
                        {trendMetrics.consumedQuantity} {unit}
                      </span>
                    </div>
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-900/35 border border-zinc-150 dark:border-zinc-850 rounded-xl">
                      <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold block">Est. Depletion Date</span>
                      <span className="text-xs font-black text-rose-650 mt-1 block">
                        {new Date(Date.now() + trendMetrics.projectedDepletion * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 3: Suggested Quantity */}
              {activeTab === "suggestion" && (
                <div className="space-y-4">
                  <div className="p-3.5 bg-zinc-55 dark:bg-zinc-900/40 rounded-xl border border-zinc-150 dark:border-zinc-850">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-200 dark:border-zinc-800">
                      <div>
                        <span className="text-[8.5px] uppercase text-zinc-400 font-extrabold">System Recommended PO Qty</span>
                        <span className="text-sm font-black text-[var(--primary)] block mt-0.5">
                          {suggestedPRQty} {unit}
                        </span>
                      </div>
                      <span className="text-[8px] font-extrabold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        Ideal ({idealStock}) - Current ({alertRecord?.currentStock})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 text-[10px] text-zinc-600 dark:text-zinc-300">
                      <div>
                        <span className="text-zinc-400 block font-bold">Supplier</span>
                        <span className="font-extrabold text-zinc-850 dark:text-white">{supplier.name}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block font-bold">Estimated Cost</span>
                        <span className="font-extrabold text-zinc-850 dark:text-white">₹{estimatedCost.toLocaleString("en-IN")}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block font-bold">Supplier Contact</span>
                        <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{supplier.phone}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block font-bold">Lead Time</span>
                        <span className="font-extrabold text-zinc-850 dark:text-white">2 Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-xl">
                    <h4 className="font-extrabold text-[11px] text-emerald-800 dark:text-emerald-450 flex items-center gap-1">
                      <CheckCircle size={13} /> Suggested Delivery Date
                    </h4>
                    <p className="text-[10px] text-zinc-450 mt-1.5 leading-normal">
                      If purchase request is submitted today, the expected delivery date will be <span className="font-black text-emerald-650 dark:text-emerald-450">{new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>, safety margin is clear.
                    </p>
                  </div>
                </div>
              )}

              {/* Tab 4: Timeline */}
              {activeTab === "timeline" && (
                <div className="relative pl-5 border-l border-zinc-150 dark:border-zinc-800 space-y-5 py-2 font-semibold">
                  {alertRecord?.timeline?.map((evt, idx) => (
                    <div key={evt._id || idx} className="relative">
                      {/* Timeline dot */}
                      <span className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-zinc-300 dark:bg-zinc-800 border-2 border-white dark:border-zinc-950 flex items-center justify-center">
                        <span className={`w-1 h-1 rounded-full ${
                          evt.type === "RESOLVED" ? "bg-emerald-500" : evt.type === "PURCHASE_ORDER" ? "bg-purple-500" : "bg-[var(--primary)]"
                        }`} />
                      </span>
                      
                      <div className="space-y-0.5">
                        <div className="flex items-center justify-between text-[9.5px]">
                          <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{evt.title}</span>
                          <span className="text-zinc-400 font-bold">{getRelativeTime(evt.createdAt)}</span>
                        </div>
                        <p className="text-[9.5px] text-zinc-450 leading-relaxed font-bold">{evt.description}</p>
                        <p className="text-[8px] text-zinc-400 font-bold">Performed By: {evt.performedBy}</p>
                      </div>
                    </div>
                  ))}
                  {(!alertRecord?.timeline || alertRecord.timeline.length === 0) && (
                    <p className="text-center text-zinc-400 py-4 font-bold">No activity logs recorded.</p>
                  )}
                </div>
              )}

              {/* Notes Auto-save text area */}
              <div className="border-t border-zinc-150 dark:border-zinc-850 pt-4 space-y-1.5 shrink-0">
                <label className="text-[9.5px] text-zinc-450 font-extrabold uppercase tracking-wider block flex items-center gap-1">
                  <MessageSquare size={11} /> Admin Internal Notes (Auto-saves on blur)
                </label>
                <textarea
                  placeholder="Add notes or adjustment details here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  onBlur={handleNotesBlur}
                  rows={2}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-white focus:border-[var(--primary)] focus:bg-white outline-none resize-none"
                />
                {updateAlertMutation.isPending && (
                  <div className="text-[8px] text-zinc-450 font-bold flex justify-end">Saving notes...</div>
                )}
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
