import React from "react";
import { X, User, Phone, Mail, MapPin, Gift, CreditCard, Clock, Truck, ShieldAlert, Receipt, ShoppingBag, Check } from "lucide-react";
import { useOrderDetail } from "../hooks/useOrdersReport";

export default function OrderDetailModal({ isOpen, orderId, onClose, onExportInvoice }) {
  const { data: order, isLoading, error } = useOrderDetail(orderId);

  if (!isOpen) return null;

  // Render loading skeleton
  if (isLoading) {
    return (
      <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 text-xs">
        <header className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm shrink-0">
          <div className="space-y-2 animate-pulse">
            <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded" />
            <div className="h-3 w-48 bg-zinc-150 dark:bg-zinc-850 rounded" />
          </div>
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-xl" />
        </header>
        <main className="flex-1 overflow-y-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
            <div className="h-64 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
          </div>
          <div className="space-y-6">
            <div className="h-96 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800" />
          </div>
        </main>
      </div>
    );
  }

  // Render error state
  if (error || !order) {
    return (
      <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 text-xs items-center justify-center p-6">
        <div className="bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl max-w-sm w-full text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-950 text-red-500 rounded-full flex items-center justify-center">
            <ShieldAlert size={24} />
          </div>
          <h3 className="text-sm font-black text-slate-900 dark:text-white">Failed to Load Order Details</h3>
          <p className="text-zinc-400 text-[10px] font-bold">The order details could not be retrieved from the server.</p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-colors cursor-pointer"
          >
            Close Dialog
          </button>
        </div>
      </div>
    );
  }

  // Format UTC dates to Local Indian Time
  const formatDate = (isoString) => {
    if (!isoString) return "N/A";
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden flex flex-col bg-zinc-50 dark:bg-zinc-950 text-xs select-none">
      
      {/* Header */}
      <header className="px-6 py-3 border-b border-zinc-200 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex justify-between items-center shadow-sm shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-md bg-[var(--primary)]/10 text-[var(--primary)] font-bold text-[10px] uppercase">
              {order.payment?.method ? "PAID" : "UNPAID"}
            </span>
            <h2 className="text-sm md:text-base font-black text-slate-900 dark:text-white tracking-tight">
              Order Details: {order.orderNumber || `PVP-${orderId}`}
            </h2>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
            Placed on: {formatDate(order.timeline?.[0]?.timestamp)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onExportInvoice && (
            <button
              onClick={() => onExportInvoice(orderId)}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Receipt size={13} />
              <span>Export Invoice</span>
            </button>
          )}
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      </header>

      {/* Scrollable Layout Content */}
      <main className="flex-1 overflow-y-auto p-6 scrollbar-thin">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Left Column: Items, Customer, Payment details */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Customer Information Card */}
            <section className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs space-y-3">
              <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                <User size={14} className="text-[var(--primary)]" />
                <span>Customer Information</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-zinc-700 dark:text-zinc-300 font-semibold">
                <div className="space-y-2">
                  <div>
                    <span className="text-[10px] text-zinc-400 block">Full Name</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-bold">{order.customer?.name}</span>
                  </div>
                  <div className="flex gap-4">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Phone Number</span>
                      <a href={`tel:${order.customer?.phone}`} className="hover:text-[var(--primary)] text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                        <Phone size={10} />
                        <span>{order.customer?.phone}</span>
                      </a>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Email Address</span>
                      <a href={`mailto:${order.customer?.email}`} className="hover:text-[var(--primary)] text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                        <Mail size={10} />
                        <span>{order.customer?.email}</span>
                      </a>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-1">
                    <div>
                      <span className="text-[10px] text-zinc-400 block">Delivery Address</span>
                      <span className="text-zinc-800 dark:text-zinc-200 flex items-start gap-1 font-bold">
                        <MapPin size={12} className="text-zinc-400 shrink-0 mt-0.5" />
                        <span>{order.customer?.address || "N/A"}</span>
                      </span>
                    </div>
                  </div>
                  {order.customer?.loyaltyPoints !== undefined && (
                    <div className="flex items-center gap-1 text-[var(--sa-secondary)] bg-[var(--sa-secondary)]/10 px-2 py-0.5 rounded-md w-fit">
                      <Gift size={10} />
                      <span>Loyalty Points: {order.customer?.loyaltyPoints}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Order Items Table Card */}
            <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs overflow-hidden">
              <div className="p-4 border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/20 dark:bg-zinc-900/10">
                <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                  <ShoppingBag size={14} className="text-[var(--primary)]" />
                  <span>Items Ordered</span>
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse font-semibold text-zinc-700 dark:text-zinc-300">
                  <thead>
                    <tr className="border-b border-zinc-200 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-900/30 text-[10px] text-zinc-400 uppercase">
                      <th className="p-3">Item Description</th>
                      <th className="p-3 text-center w-20">Quantity</th>
                      <th className="p-3 text-right w-24">Price</th>
                      <th className="p-3 text-right w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map((item, idx) => (
                      <tr key={idx} className="border-b border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
                        <td className="p-3">
                          <span className="font-bold text-zinc-900 dark:text-white block">{item.name}</span>
                          {item.customization && (
                            <span className="text-[10px] text-zinc-400 italic block mt-0.5">
                              Customization: {item.customization}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-center font-bold text-zinc-800 dark:text-zinc-200">
                          {item.quantity}
                        </td>
                        <td className="p-3 text-right text-zinc-800 dark:text-zinc-200">
                          ₹{item.price?.toFixed(2)}
                        </td>
                        <td className="p-3 text-right font-bold text-slate-900 dark:text-white">
                          ₹{item.subtotal?.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Invoice Breakdown Grid */}
              <div className="p-4 bg-zinc-50/20 dark:bg-zinc-900/10 border-t border-zinc-100 dark:border-zinc-850 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-zinc-400">Payment Information</h4>
                  <div className="p-3 border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Method</span>
                      <span className="text-zinc-800 dark:text-zinc-250 font-bold flex items-center gap-1">
                        <CreditCard size={10} className="text-zinc-400" />
                        {order.payment?.method}
                      </span>
                    </div>
                    {order.payment?.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Txn ID</span>
                        <span className="text-zinc-800 dark:text-zinc-200 font-mono text-[9px] select-all font-bold">
                          {order.payment.transactionId}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Status</span>
                      <span className="font-bold text-emerald-500 uppercase text-[9px] bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-md">
                        {order.payment?.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-[10px] uppercase font-bold text-zinc-400 text-right">Summary Charges</h4>
                  <div className="space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Subtotal</span>
                      <span className="text-zinc-850 dark:text-zinc-300">₹{order.invoiceSummary?.subtotal?.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Tax (GST)</span>
                      <span className="text-zinc-850 dark:text-zinc-300">₹{order.invoiceSummary?.tax?.toFixed(2)}</span>
                    </div>
                    {order.invoiceSummary?.discount > 0 && (
                      <div className="flex justify-between text-emerald-600 dark:text-emerald-400">
                        <span>Discount Coupon</span>
                        <span>-₹{order.invoiceSummary.discount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Delivery Charges</span>
                      <span className="text-zinc-850 dark:text-zinc-300">₹{order.invoiceSummary?.deliveryCharges?.toFixed(2)}</span>
                    </div>
                    <hr className="border-zinc-200 dark:border-zinc-800 my-1" />
                    <div className="flex justify-between text-sm">
                      <span className="font-black text-slate-900 dark:text-white">Grand Total</span>
                      <span className="font-black text-[var(--primary)] text-sm">
                        ₹{order.invoiceSummary?.grandTotal?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Order Timeline & Rider Assignment */}
          <div className="space-y-6">
            
            {/* Timeline Stepper */}
            <section className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs space-y-4">
              <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                <Clock size={14} className="text-[var(--primary)]" />
                <span>Order Timeline & Status</span>
              </h3>
              <div className="relative pl-2 space-y-4">
                
                {/* Vertical Line */}
                <div className="absolute left-[16px] top-2 bottom-2 w-0.5 bg-zinc-200 dark:bg-zinc-800" />

                {order.timeline?.map((step, idx) => {
                  const isDelivered = step.stage.toLowerCase() === "delivered";
                  const isCancelled = step.stage.toLowerCase() === "cancelled";
                  const isRefunded = step.stage.toLowerCase() === "refunded";

                  let bulletColor = "bg-zinc-200 text-zinc-400 border-zinc-300 dark:bg-zinc-800 dark:border-zinc-700";
                  if (step.completed) {
                    if (isCancelled || isRefunded) {
                      bulletColor = "bg-red-500 text-white border-red-500";
                    } else if (isDelivered) {
                      bulletColor = "bg-emerald-500 text-white border-emerald-500";
                    } else {
                      bulletColor = "bg-[var(--primary)] text-white border-[var(--primary)]";
                    }
                  }

                  return (
                    <div key={idx} className="flex gap-3.5 items-center text-[11px]">
                      
                      {/* Timeline Bullet */}
                      <div className={`relative w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 text-[8px] shrink-0 ${bulletColor}`}>
                        {step.completed && <Check size={8} className="stroke-[3]" />}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className={`font-bold ${step.completed ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400"}`}>
                            {step.stage}
                          </span>
                          {step.completed && step.timestamp && (
                            <span className="text-[9px] text-zinc-400 font-medium">
                              {new Date(step.timestamp).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Rider Assignment Info */}
            {order.rider && (
              <section className="bg-white dark:bg-zinc-900 p-4 border border-zinc-200 dark:border-zinc-850 rounded-2xl shadow-xs space-y-3">
                <h3 className="text-xs font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                  <Truck size={14} className="text-[var(--primary)]" />
                  <span>Rider Assignment</span>
                </h3>
                <div className="space-y-3 font-semibold">
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold">Rider Partner</span>
                    <span className="text-zinc-800 dark:text-zinc-200 font-black">{order.rider.name}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block font-bold">Contact Number</span>
                    <a href={`tel:${order.rider.phone}`} className="hover:text-[var(--primary)] text-zinc-800 dark:text-zinc-200 flex items-center gap-1">
                      <Phone size={10} />
                      <span>{order.rider.phone}</span>
                    </a>
                  </div>
                  <div className="p-3 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-1.5">
                    {order.rider.assignedTime && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Assigned</span>
                        <span className="text-zinc-700 dark:text-zinc-300">{formatDate(order.rider.assignedTime)}</span>
                      </div>
                    )}
                    {order.rider.pickupTime && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Picked Up</span>
                        <span className="text-zinc-700 dark:text-zinc-300">{formatDate(order.rider.pickupTime)}</span>
                      </div>
                    )}
                    {order.rider.deliveryTime && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Delivered</span>
                        <span className="text-zinc-700 dark:text-zinc-300">{formatDate(order.rider.deliveryTime)}</span>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

          </div>

        </div>
      </main>

    </div>
  );
}
