import React, { useEffect } from "react";
import { X, Calendar, User, ShoppingBag, CreditCard, Clock, Truck, Users, Star, Gift, AlertTriangle } from "lucide-react";
import { useOrderDetails } from "../hooks/useOrderDetails";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const formatTime = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit"
  });
};

export default function OrderDetailModal({ isOpen, onClose, orderId }) {
  const { data, isLoading, isError } = useOrderDetails(orderId);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const {
    orderInfo = {},
    customer = {},
    items = [],
    coupon = null,
    payment = {},
    preparationTimeline = [],
    deliveryTimeline = [],
    staff = {},
    customerRating = null
  } = data || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] overflow-x-hidden overflow-y-auto outline-none transition-all">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl mx-3 my-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-down duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Order Audit Report
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                Audit summary for Order ID: {orderInfo.orderNumber || "Loading..."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div key={idx} className="h-28 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
                ))}
              </div>
              <div className="h-48 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="h-40 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
                <div className="h-40 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
              </div>
            </div>
          ) : isError ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-sm font-black text-zinc-800 dark:text-white">Failed to Load Order Audit Details</h3>
              <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                There was a problem retrieving data from the backend. Please try again.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              
              {/* Left Column (Stats & Tables) */}
              <div className="md:col-span-8 space-y-6">
                
                {/* SECTION 1: Order Information & SECTION 2: Customer Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Order Info */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5 space-y-2">
                    <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-1.5 mb-2">
                      <ShoppingBag size={12} className="text-[var(--primary)]" />
                      Order Details
                    </h3>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 grid grid-cols-2 gap-y-1.5">
                      <span className="text-zinc-400">Order Number:</span>
                      <span>{orderInfo.orderNumber}</span>
                      <span className="text-zinc-400">Status:</span>
                      <span className="uppercase text-[10px] text-[var(--primary)]">{orderInfo.status}</span>
                      <span className="text-zinc-400">Dining Type:</span>
                      <span className="capitalize">{orderInfo.orderType}</span>
                      <span className="text-zinc-400">Order Date:</span>
                      <span>{formatDate(orderInfo.createdAt)}</span>
                      <span className="text-zinc-400">Total Price:</span>
                      <span className="text-emerald-600 dark:text-emerald-400">{formatINR(orderInfo.totalAmount)}</span>
                    </div>
                  </div>

                  {/* Customer Details */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5 space-y-2">
                    <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-1.5 mb-2">
                      <User size={12} className="text-blue-500" />
                      Customer Profile
                    </h3>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 grid grid-cols-1 gap-y-1">
                      <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">{customer.name}</span>
                      <span className="text-zinc-400 font-semibold">{customer.phone}</span>
                      <span className="text-zinc-400 font-semibold">{customer.email}</span>
                      <span className="text-[10.5px] text-zinc-500 font-semibold mt-1 truncate" title={customer.address}>
                        Address: {customer.address}
                      </span>
                      <span className="text-[10px] text-emerald-500 font-bold uppercase mt-1">
                        Patron Orders Count: {customer.orderHistoryCount}
                      </span>
                    </div>
                  </div>

                </div>

                {/* SECTION 3: Item List Table */}
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5">
                  <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 mb-3">
                    <ShoppingBag size={12} className="text-[var(--primary)]" />
                    Items Ordered Ledger
                  </h3>
                  <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-xl">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 text-left text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <thead className="bg-zinc-50 dark:bg-zinc-950/30 text-[9px] uppercase font-bold text-zinc-400">
                        <tr>
                          <th className="px-3 py-2">Item Name</th>
                          <th className="px-3 py-2">Qty</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-bold text-zinc-800 dark:text-zinc-200">
                        {items.map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20">
                            <td className="px-3 py-2.5 text-zinc-900 dark:text-white">{row.name}</td>
                            <td className="px-3 py-2.5 text-zinc-500">{row.quantity}</td>
                            <td className="px-3 py-2.5 text-right text-zinc-500">{formatINR(row.price)}</td>
                            <td className="px-3 py-2.5 text-right text-[var(--primary)]">{formatINR(row.total)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 4: Coupon Details & SECTION 5: Payment Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Coupon Details */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5 space-y-2">
                    <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-1.5 mb-2">
                      <Gift size={12} className="text-rose-500" />
                      Promo & Coupon Code
                    </h3>
                    {coupon ? (
                      <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 grid grid-cols-2 gap-y-1.5">
                        <span className="text-zinc-400">Coupon Applied:</span>
                        <span className="text-rose-500 font-extrabold uppercase">{coupon.code}</span>
                        <span className="text-zinc-400">Discount type:</span>
                        <span className="capitalize">{coupon.discountType}</span>
                        <span className="text-zinc-400">Discount value:</span>
                        <span>{coupon.discountType === "fixed" ? formatINR(coupon.discountValue) : `${coupon.discountValue}%`}</span>
                        <span className="text-zinc-400">Total Savings:</span>
                        <span className="text-rose-600 font-extrabold">
                          {coupon.discountType === "fixed" ? formatINR(coupon.discountValue) : formatINR(Math.floor(items.reduce((sum, it) => sum + it.total, 0) * (coupon.discountValue / 100)))}
                        </span>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500">No Coupon Applied</p>
                      </div>
                    )}
                  </div>

                  {/* Payment Information */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5 space-y-2">
                    <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-1.5 mb-2">
                      <CreditCard size={12} className="text-emerald-500" />
                      Payment Ledger
                    </h3>
                    <div className="text-xs font-bold text-zinc-800 dark:text-zinc-200 grid grid-cols-2 gap-y-1.5">
                      <span className="text-zinc-400">Channel Mode:</span>
                      <span>{payment.method}</span>
                      <span className="text-zinc-400">Clearance Status:</span>
                      <span className="uppercase text-emerald-600">{payment.status}</span>
                      <span className="text-zinc-400">Txn Reference ID:</span>
                      <span className="font-mono text-[10px] break-all">{payment.transactionId}</span>
                      <span className="text-zinc-400">Amount Paid:</span>
                      <span className="text-emerald-600 font-extrabold">{formatINR(payment.amountPaid)}</span>
                    </div>
                  </div>

                </div>

              </div>

              {/* Right Column (Timelines, Staff & Rating) */}
              <div className="md:col-span-4 space-y-6">
                
                {/* SECTION 6: Preparation Timeline */}
                <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5 space-y-3.5">
                  <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                    <Clock size={12} className="text-amber-500" />
                    Kitchen Preparation Timeline
                  </h3>
                  <div className="relative border-l border-zinc-150 dark:border-zinc-800 pl-3.5 ml-1.5 space-y-4 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    {preparationTimeline.map((node, index) => (
                      <div key={index} className="relative">
                        {/* Dot indicator */}
                        <div className="absolute -left-[19.5px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 bg-amber-500 shadow-sm" />
                        <div>
                          <p className="text-zinc-900 dark:text-white text-[11px] font-extrabold">{node.event}</p>
                          <p className="text-[9.5px] text-zinc-400 font-semibold mt-0.5">{formatTime(node.timestamp)} • {formatDate(node.timestamp).split(",")[0]}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* SECTION 7: Delivery Timeline */}
                {orderInfo.orderType === "delivery" && deliveryTimeline.length > 0 && (
                  <div className="border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5 space-y-3.5">
                    <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                      <Truck size={12} className="text-blue-500" />
                      Delivery Fleet Timeline
                    </h3>
                    <div className="relative border-l border-zinc-150 dark:border-zinc-800 pl-3.5 ml-1.5 space-y-4 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      {deliveryTimeline.map((node, index) => (
                        <div key={index} className="relative">
                          <div className="absolute -left-[19.5px] top-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-zinc-900 bg-blue-500 shadow-sm" />
                          <div>
                            <p className="text-zinc-900 dark:text-white text-[11px] font-extrabold">{node.event}</p>
                            <p className="text-[9.5px] text-zinc-400 font-semibold mt-0.5">{formatTime(node.timestamp)} • {formatDate(node.timestamp).split(",")[0]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* SECTION 8: Staff Involved */}
                <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5 space-y-3">
                  <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                    <Users size={12} className="text-purple-500" />
                    Operational Staff
                  </h3>
                  <div className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Preparation Chef:</span>
                      <span className="text-zinc-900 dark:text-white">{staff.chef || "--"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">POS Cashier:</span>
                      <span className="text-zinc-900 dark:text-white">{staff.cashier || "--"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Supervisor Manager:</span>
                      <span className="text-zinc-900 dark:text-white">{staff.manager || "--"}</span>
                    </div>
                    {orderInfo.orderType === "delivery" && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Delivery Rider:</span>
                        <span className="text-zinc-900 dark:text-white">{staff.rider || "--"}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* SECTION 9: Customer Rating */}
                <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5 space-y-2">
                  <h3 className="text-xs font-extrabold uppercase text-zinc-400 tracking-wider flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-1.5">
                    <Star size={12} className="text-amber-500" />
                    Customer Review & Rating
                  </h3>
                  {customerRating ? (
                    <div className="space-y-1.5 text-xs font-semibold">
                      <div className="flex items-center gap-0.5 text-amber-500">
                        {Array.from({ length: customerRating.stars }).map((_, sIdx) => (
                          <Star key={sIdx} size={11} fill="currentColor" />
                        ))}
                        <span className="text-[10px] text-zinc-400 font-bold ml-1.5">({customerRating.stars} Stars)</span>
                      </div>
                      <p className="text-zinc-800 dark:text-zinc-200 italic leading-relaxed font-bold">
                        "{customerRating.reviewText}"
                      </p>
                      <p className="text-[9px] text-zinc-400 font-semibold text-right">
                        Submitted: {formatDate(customerRating.reviewDate)}
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-2">
                      <p className="text-[10.5px] font-extrabold text-zinc-400 dark:text-zinc-500">No Review Provided</p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-850 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-full text-xs active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
