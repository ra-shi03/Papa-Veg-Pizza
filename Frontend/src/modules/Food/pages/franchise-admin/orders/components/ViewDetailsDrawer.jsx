import React, { useState } from "react";
import { 
  X, ShoppingBag, Truck, Clock, Star, 
  CreditCard, MapPin, Phone, Mail, ExternalLink, 
  CheckCircle, ThumbsUp, HelpCircle, AlertTriangle 
} from "lucide-react";
import { format } from "date-fns";

export default function ViewDetailsDrawer({ isOpen, onClose, order }) {
  const [activeTab, setActiveTab] = useState("summary");

  console.log("ViewDetailsDrawer render state:", { isOpen, order });

  if (!isOpen || !order) {
    console.log("ViewDetailsDrawer returned null due to missing isOpen or order:", { isOpen, order });
    return null;
  }

  const tabs = [
    { id: "summary", label: "Order Summary", icon: ShoppingBag },
    { id: "delivery", label: "Delivery Details", icon: Truck },
    { id: "timeline", label: "Timeline", icon: Clock },
    { id: "rating", label: "Customer Rating", icon: Star },
    { id: "payment", label: "Payment Info", icon: CreditCard },
  ];

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      return format(new Date(timeStr), "dd MMM yyyy, hh:mm a");
    } catch {
      return timeStr;
    }
  };

  const getSentimentBadgeColor = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive": return "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400 border-green-200/50";
      case "neutral": return "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350 border-zinc-200";
      case "negative": return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50";
      default: return "bg-zinc-50 text-zinc-550 border-zinc-200";
    }
  };

  const stepperSteps = [
    "Placed", "Confirmed", "Preparing", "Baking", "Packed", 
    "Ready For Pickup", "Rider Assigned", "Out For Delivery", "Delivered"
  ];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer Container (950px Width) */}
      <div className="relative w-full max-w-[950px] h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col z-10 animate-slide-in-right transition-transform">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                Order details: {order.orderNumber}
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-250">
                Delivered
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
              Store: {order.store.name} | Delivered At: {formatTime(order.deliveredAt)}
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Tabs selector */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-900/10 px-4 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-xs font-bold flex items-center gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
                }`}
              >
                <Icon size={14} className="shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Body panels */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-5">
          
          {/* TAB 1: Order Summary */}
          {activeTab === "summary" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* General Info */}
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2.5">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    General Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-zinc-400 font-medium">Order Number:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">{order.orderNumber}</span>

                    <span className="text-zinc-400 font-medium">Store:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">{order.store.name}</span>

                    <span className="text-zinc-400 font-medium">Order Type:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">{order.orderType}</span>

                    <span className="text-zinc-400 font-medium">Placed Time:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">{formatTime(order.placedAt)}</span>

                    <span className="text-zinc-400 font-medium">Delivered Time:</span>
                    <span className="font-semibold text-zinc-805 dark:text-zinc-200 text-right">{formatTime(order.deliveredAt)}</span>
                  </div>
                </div>

                {/* Pricing Summary */}
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2.5 bg-zinc-55/20 dark:bg-zinc-900/10">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Invoice Summary
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-zinc-400 font-medium">Subtotal:</span>
                    <span className="font-semibold text-zinc-850 dark:text-zinc-200 text-right">₹{order.pricing.subtotal.toFixed(2)}</span>

                    <span className="text-zinc-400 font-medium">Taxes (GST):</span>
                    <span className="font-semibold text-zinc-850 dark:text-zinc-200 text-right">₹{order.pricing.tax.toFixed(2)}</span>

                    <span className="text-zinc-400 font-medium">Delivery Fee:</span>
                    <span className="font-semibold text-zinc-850 dark:text-zinc-200 text-right">₹{order.pricing.deliveryFee.toFixed(2)}</span>

                    <span className="text-rose-500 font-semibold">Discount:</span>
                    <span className="font-semibold text-rose-505 text-right">-₹{order.pricing.discount.toFixed(2)}</span>

                    <div className="col-span-2 border-t border-zinc-100 dark:border-zinc-800 my-1" />

                    <span className="text-sm font-black text-zinc-905 dark:text-zinc-50">Total Amount Paid:</span>
                    <span className="text-sm font-black text-[var(--primary)] text-right">₹{order.pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-550 font-bold border-b border-zinc-150 dark:border-zinc-800">
                      <th className="p-3">Product</th>
                      <th className="p-3">Variant</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10">
                        <td className="p-3 flex items-center gap-3">
                          {item.image ? (
                            <img 
                              src={item.image} 
                              alt={item.productName} 
                              className="w-10 h-10 rounded-lg object-cover border border-zinc-100 dark:border-zinc-800"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400">
                              PVP
                            </div>
                          )}
                          <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.productName}</p>
                        </td>
                        <td className="p-3 text-zinc-550 dark:text-zinc-350">{item.variant || "Standard"}</td>
                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                        <td className="p-3 text-right">₹{item.price.toFixed(2)}</td>
                        <td className="p-3 text-right font-black">₹{(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Delivery Details */}
          {activeTab === "delivery" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Courier info */}
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-3 bg-zinc-50/20 dark:bg-zinc-900/10">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Rider Allocated
                  </h4>
                  {order.deliveryPartner ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-zinc-400 text-sm">
                          {order.deliveryPartner.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100">
                            {order.deliveryPartner.name}
                          </p>
                          <p className="text-[9px] text-zinc-400 font-bold mt-0.5">
                            Vehicle: {order.deliveryPartner.vehicleType}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a
                          href={`tel:${order.deliveryPartner.phone}`}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                        >
                          <Phone size={13} />
                          Call Rider
                        </a>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-450 italic">No rider details found.</p>
                  )}
                </div>

                {/* Delivery performance logs */}
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2.5">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Performance Logs
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-zinc-400 font-medium">Pickup Time:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">
                      {order.timeline.find(t => t.status === "Ready For Pickup") 
                        ? formatTime(order.timeline.find(t => t.status === "Ready For Pickup").timestamp)
                        : "N/A"}
                    </span>

                    <span className="text-zinc-400 font-medium">Delivered Time:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">{formatTime(order.deliveredAt)}</span>

                    <span className="text-zinc-400 font-medium">Total Delivery Time:</span>
                    <span className="font-bold text-zinc-900 dark:text-white text-right">35 mins</span>

                    <span className="text-zinc-400 font-medium">Distance Covered:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">2.8 km</span>
                  </div>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Customer Delivery Address
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">{order.customer.address}</p>
                </div>
                <div className="flex gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${order.customer.coords.lat},${order.customer.coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <MapPin size={13} className="text-rose-500" />
                    Open Google Maps
                    <ExternalLink size={11} className="opacity-60" />
                  </a>
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <Phone size={13} className="text-emerald-500" />
                    Call Customer
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Animated Timeline Stepper */}
          {activeTab === "timeline" && (
            <div className="p-5 rounded-xl border border-zinc-150 dark:border-zinc-800 animate-fade-in">
              <div className="relative border-l border-zinc-100 dark:border-zinc-800 ml-3 space-y-6 py-2">
                {stepperSteps.map((stepName) => {
                  const timelineEntry = order.timeline.find(
                    (t) => t.status.toLowerCase() === stepName.toLowerCase()
                  );
                  const isCompleted = !!timelineEntry;
                  const isCurrent = order.orderStatus.toLowerCase() === stepName.toLowerCase();

                  return (
                    <div key={stepName} className="relative pl-6 animate-fade-in">
                      {/* Dot */}
                      <span className={`absolute left-0 -translate-x-[50%] top-1.5 flex h-4 w-4 rounded-full border items-center justify-center transition-all ${
                        isCompleted 
                          ? isCurrent 
                            ? "bg-[var(--primary)] border-[var(--primary)] shadow-md"
                            : "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                      }`}>
                        {isCompleted && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </span>

                      {/* Timeline details */}
                      <div>
                        <h5 className={`text-xs font-bold ${
                          isCompleted ? "text-zinc-800 dark:text-zinc-200" : "text-zinc-400 font-semibold"
                        }`}>
                          {stepName}
                        </h5>
                        {isCompleted && (
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium mt-0.5">
                            <span>Updated By: {timelineEntry.updatedBy}</span>
                            <span>•</span>
                            <span>{formatTime(timelineEntry.timestamp)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Customer Ratings & Feedback */}
          {activeTab === "rating" && (
            <div className="space-y-4 animate-fade-in">
              {order.rating ? (
                <div className="space-y-4">
                  {/* Rating Score Cards */}
                  <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50/20 dark:bg-zinc-900/10">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star 
                            key={i} 
                            size={16} 
                            className={`${
                              i < order.rating.rating 
                                ? "text-amber-500 fill-amber-500" 
                                : "text-zinc-300 dark:text-zinc-700"
                            }`}
                          />
                        ))}
                        <span className="text-sm font-black text-zinc-900 dark:text-white ml-1">
                          {order.rating.rating.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-400 font-semibold">
                        Review Date: {formatTime(order.rating.createdAt)}
                      </p>
                    </div>

                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getSentimentBadgeColor(order.rating.sentiment)}`}>
                      {order.rating.sentiment} Sentiment
                    </span>
                  </div>

                  {/* Rating Comments */}
                  <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20">
                    <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                      Customer Review Comments
                    </h5>
                    <p className="text-xs text-zinc-700 dark:text-zinc-250 italic">
                      "{order.rating.review || "No review comment provided."}"
                    </p>
                  </div>

                  {/* Rating Metrics breakdown */}
                  {order.rating.metrics && (
                    <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-805 space-y-3">
                      <h5 className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                        Satisfaction Metrics Breakdown
                      </h5>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "Food Quality", val: order.rating.metrics.foodQuality },
                          { label: "Packaging Satisfaction", val: order.rating.metrics.packaging },
                          { label: "Delivery Experience", val: order.rating.metrics.deliveryExperience },
                          { label: "Overall Satisfaction", val: order.rating.metrics.overallSatisfaction }
                        ].map((m) => (
                          <div key={m.label} className="space-y-1">
                            <div className="flex justify-between text-xs font-semibold text-zinc-650 dark:text-zinc-350">
                              <span>{m.label}</span>
                              <span className="font-bold">{m.val}★</span>
                            </div>
                            <div className="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                              <div className="h-full bg-amber-500 rounded-full" style={{ width: `${m.val * 20}%` }} />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <Star className="mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5]" size={36} />
                  <p className="text-xs text-zinc-500 font-bold">No customer feedback available.</p>
                  <p className="text-[10px] text-zinc-400">The customer did not provide feedback or ratings for this order.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Payment Info */}
          {activeTab === "payment" && (
            <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-4 animate-fade-in bg-zinc-50/20 dark:bg-zinc-900/10">
              <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Transactional Receipt
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <span className="text-zinc-400 font-medium">Payment Method:</span>
                <span className="font-bold text-zinc-850 dark:text-zinc-200 text-right">{order.paymentMethod}</span>

                <span className="text-zinc-400 font-medium">Payment Status:</span>
                <span className="font-bold text-green-600 dark:text-green-400 text-right">{order.paymentStatus}</span>

                <span className="text-zinc-400 font-medium">Transaction Reference:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-300 text-right">{order.transactionId || "COD / CASH"}</span>

                <span className="text-zinc-400 font-medium">Coupon Code Applied:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">{order.couponApplied || "None"}</span>

                <span className="text-zinc-400 font-medium">Invoice Number:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-200 text-right">INV-{order.orderNumber.split("-")[1]}</span>

                <span className="text-zinc-400 font-medium">Payment Date/Time:</span>
                <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">{formatTime(order.placedAt)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-zinc-400 font-medium">Discount Value:</span>
                <span className="font-bold text-rose-500 text-right">-₹{order.pricing.discount.toFixed(2)}</span>

                <span className="text-zinc-400 font-medium">Tax Collected (GST):</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">₹{order.pricing.tax.toFixed(2)}</span>

                <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">Grand Total:</span>
                <span className="text-sm font-black text-[var(--primary)] text-right">₹{order.pricing.total.toFixed(2)}</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
