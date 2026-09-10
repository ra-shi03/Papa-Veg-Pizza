import React from "react";
import { X, Calendar, User, ShoppingBag, CreditCard, Truck, RefreshCcw, AlertCircle, CheckCircle } from "lucide-react";
import { useOrderDetails } from "../hooks/useCustomerOrders";
import { Skeleton } from "@food/components/ui/skeleton";

export default function OrderDetailsModal({ visible, onClose, orderId }) {
  const { data, isLoading, isError, refetch } = useOrderDetails(orderId);

  if (!visible) return null;

  const { order = {}, items = [], payments = [], deliveryTracking = [], refunds = [] } = data || {};

  const handleRetry = () => {
    refetch();
  };

  // Helper to parse customizations string into structured display
  const renderCustomizations = (customizationStr) => {
    if (!customizationStr || customizationStr === "None") return null;
    return (
      <div className="text-[9px] text-zinc-400 dark:text-zinc-550 font-bold mt-1 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded border border-zinc-100 dark:border-zinc-850 inline-block">
        {customizationStr}
      </div>
    );
  };

  // Status Style Helpers
  const getStatusBadgeClass = (status) => {
    const s = (status || "").toLowerCase();
    switch (s) {
      case "delivered":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20";
      case "preparing":
      case "ready":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20";
      case "cancelled":
      case "refunded":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20";
      default:
        return "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20";
    }
  };

  // Timeline render helper
  const renderTimeline = () => {
    const defaultStages = [
      "Order Placed",
      "Kitchen Started",
      "Ready",
      "Rider Assigned",
      "Out For Delivery",
      "Delivered"
    ];

    return (
      <div className="relative pl-6 space-y-4 border-l border-zinc-200 dark:border-zinc-800 ml-3">
        {defaultStages.map((stageName, index) => {
          // Find matching node from tracking API
          const trackNode = deliveryTracking.find(
            (t) => (t.status || "").toLowerCase() === stageName.toLowerCase() || 
                   (t.stage || "").toLowerCase() === stageName.toLowerCase()
          );
          
          const isCompleted = !!trackNode;
          
          return (
            <div key={index} className="relative">
              {/* Bullet node */}
              <span className={`absolute -left-[31px] top-0.5 flex h-4 w-4 rounded-full border-2 items-center justify-center ${
                isCompleted 
                  ? "bg-emerald-500 border-emerald-500 text-white" 
                  : "bg-white dark:bg-zinc-900 border-zinc-250 dark:border-zinc-800 text-zinc-300"
              }`}>
                {isCompleted && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
              </span>

              {/* Title & Date */}
              <div className="flex items-center justify-between gap-4">
                <span className={`text-xs font-bold ${isCompleted ? "text-zinc-850 dark:text-white" : "text-zinc-400"}`}>
                  {stageName}
                </span>
                {isCompleted && trackNode.timestamp && (
                  <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550">
                    {new Date(trackNode.timestamp).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit"
                    })}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">
              Order Details File: {order.orderNumber || ""}
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
              Specific line items, dispatch logging timeline, and settlement status.
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
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-32 rounded-2xl col-span-2" />
              </div>
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : isError ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-[var(--primary)] rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">Failed to Load Order Details</h4>
              <p className="text-[10px] text-zinc-400">Please try again.</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <RefreshCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left Column: Order Summary & Delivery Timeline */}
              <div className="space-y-6 lg:col-span-1">
                {/* SECTION: ORDER SUMMARY */}
                <div className="bg-zinc-50/50 dark:bg-zinc-950/20 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-850 space-y-4">
                  <h4 className="text-xs font-black text-zinc-850 dark:text-white uppercase tracking-wider">
                    Order Summary
                  </h4>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-400">Order Number</span>
                      <span className="text-zinc-800 dark:text-white font-mono">{order.orderNumber}</span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-400">Order Date</span>
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-400">Customer</span>
                      <span className="text-[var(--primary)]">{order.customerName}</span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-400">Method</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{order.paymentMethod}</span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-400">Payment Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase ${
                        order.paymentStatus === "paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-400">Delivery Type</span>
                      <span className="capitalize text-zinc-700 dark:text-zinc-300">{order.deliveryType}</span>
                    </div>

                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-400">Store Name</span>
                      <span className="text-zinc-700 dark:text-zinc-300">{order.storeName || "Central Hub"}</span>
                    </div>

                    <div className="border-t border-zinc-150 dark:border-zinc-800 pt-2.5 flex justify-between font-extrabold text-sm">
                      <span className="text-zinc-800 dark:text-zinc-200">Order Total</span>
                      <span className="text-[var(--primary)]">₹{order.totalAmount}</span>
                    </div>
                  </div>
                </div>

                {/* SECTION: DELIVERY TIMELINE */}
                <div className="bg-white dark:bg-zinc-950 p-5 border border-zinc-150 dark:border-zinc-800 rounded-2xl space-y-4">
                  <h4 className="text-xs font-black text-zinc-850 dark:text-white uppercase tracking-wider">
                    Dispatch Timeline
                  </h4>
                  {renderTimeline()}
                </div>
              </div>

              {/* Right Column: Ordered Items & Refunds */}
              <div className="lg:col-span-2 space-y-6">
                {/* SECTION: ORDERED ITEMS */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    Line Item Breakdown
                  </h4>
                  <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
                    <table className="w-full text-left text-xs font-semibold">
                      <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                        <tr>
                          <th className="px-4 py-2.5">Item Description</th>
                          <th className="px-4 py-2.5 text-center">Qty</th>
                          <th className="px-4 py-2.5 text-right">Price</th>
                          <th className="px-4 py-2.5 text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
                        {items.map((it, idx) => (
                          <tr key={idx} className="align-top hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10">
                            <td className="px-4 py-2.5">
                              <p className="font-extrabold text-zinc-900 dark:text-white leading-tight">
                                {it.name}
                              </p>
                              {renderCustomizations(it.customizations)}
                            </td>
                            <td className="px-4 py-2.5 text-center font-bold text-zinc-800 dark:text-white">
                              {it.quantity}
                            </td>
                            <td className="px-4 py-2.5 text-right text-zinc-500 dark:text-zinc-400">
                              ₹{it.price}
                            </td>
                            <td className="px-4 py-2.5 text-right font-extrabold text-zinc-900 dark:text-white">
                              ₹{it.subtotal}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION: REFUND HISTORY */}
                {refunds.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-black text-rose-600 uppercase tracking-wider">
                      Refund Settlements
                    </h4>
                    <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                          <tr>
                            <th className="px-4 py-2.5">Refund ID</th>
                            <th className="px-4 py-2.5">Reason</th>
                            <th className="px-4 py-2.5 text-right">Amount</th>
                            <th className="px-4 py-2.5">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
                          {refunds.map((ref) => (
                            <tr key={ref._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10">
                              <td className="px-4 py-2.5 font-mono font-extrabold text-[10px] text-zinc-900 dark:text-white">
                                {ref._id}
                              </td>
                              <td className="px-4 py-2.5 text-zinc-550 dark:text-zinc-400 font-medium">
                                {ref.reason}
                              </td>
                              <td className="px-4 py-2.5 text-right font-extrabold text-rose-500">
                                ₹{ref.amount}
                              </td>
                              <td className="px-4 py-2.5">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  ref.status === "approved" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"
                                }`}>
                                  {ref.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

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
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
}
