import React from "react";
import { X, Clock, RefreshCw, AlertCircle } from "lucide-react";
import { useOrderDetails } from "../hooks/useCustomerOrders";
import { Skeleton } from "@food/components/ui/skeleton";

export default function OrderTimelineModal({ visible, onClose, orderId }) {
  const { data, isLoading, isError, refetch } = useOrderDetails(orderId);

  if (!visible) return null;

  const { order = {}, deliveryTracking = [] } = data || {};

  const defaultStages = [
    "Order Placed",
    "Kitchen Started",
    "Ready",
    "Rider Assigned",
    "Out For Delivery",
    "Delivered"
  ];

  return (
    <div className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">
              Dispatch Timeline Audit
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-semibold mt-0.5">
              Real-time route checkpoints for Order: <strong className="text-[var(--primary)] font-mono">{order.orderNumber || ""}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-805 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4 py-4">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="flex gap-4">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                  <Skeleton className="h-5 w-40 rounded flex-1" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-[var(--primary)] rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">Failed to Load Timeline Data</h4>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="py-3 px-2">
              <div className="relative pl-7 space-y-6 border-l border-zinc-200 dark:border-zinc-800 ml-4">
                {defaultStages.map((stageName, index) => {
                  const trackNode = deliveryTracking.find(
                    (t) => (t.status || "").toLowerCase() === stageName.toLowerCase() || 
                           (t.stage || "").toLowerCase() === stageName.toLowerCase()
                  );
                  
                  const isCompleted = !!trackNode;

                  return (
                    <div key={index} className="relative">
                      {/* Timeline Node Icon */}
                      <span className={`absolute -left-[38px] top-0.5 flex h-5.5 w-5.5 rounded-full border-2 items-center justify-center transition-all ${
                        isCompleted 
                          ? "bg-emerald-500 border-emerald-500 text-white shadow-sm shadow-emerald-500/25" 
                          : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-300"
                      }`}>
                        <Clock size={10} className={isCompleted ? "stroke-[3]" : ""} />
                      </span>

                      {/* Content */}
                      <div>
                        <h4 className={`text-xs font-black transition-colors ${
                          isCompleted ? "text-zinc-850 dark:text-white" : "text-zinc-400"
                        }`}>
                          {stageName}
                        </h4>
                        
                        {isCompleted && trackNode.timestamp ? (
                          <p className="text-[10px] text-zinc-450 dark:text-zinc-500 font-bold mt-1 bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 border border-zinc-100 dark:border-zinc-850 rounded inline-block">
                            {new Date(trackNode.timestamp).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}{" "}
                            at{" "}
                            {new Date(trackNode.timestamp).toLocaleTimeString("en-IN", {
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </p>
                        ) : (
                          <span className="text-[9px] text-zinc-350 dark:text-zinc-650 font-bold italic mt-0.5 block">
                            Pending Dispatch Checkpoint
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-150 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl text-xs transition-all cursor-pointer"
          >
            Close Timeline
          </button>
        </div>
      </div>
    </div>
  );
}
