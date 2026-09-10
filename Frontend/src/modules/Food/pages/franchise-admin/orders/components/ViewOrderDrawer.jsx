import React, { useState } from "react";
import { 
  X, ShoppingBag, User, CreditCard, Truck, 
  MapPin, Phone, Mail, Clock, ExternalLink 
} from "lucide-react";
import { format } from "date-fns";

export default function ViewOrderDrawer({ isOpen, onClose, order }) {
  const [activeTab, setActiveTab] = useState("details");

  if (!isOpen || !order) return null;

  const tabs = [
    { id: "details", label: "Details", icon: ShoppingBag },
    { id: "items", label: "Items", icon: ShoppingBag },
    { id: "customer", label: "Customer Info", icon: User },
    { id: "payment", label: "Payment Details", icon: CreditCard },
    { id: "delivery", label: "Delivery Info", icon: Truck },
    { id: "timeline", label: "Timeline", icon: Clock },
  ];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "pending": return "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-200";
      case "confirmed": return "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 border-blue-200/50";
      case "preparing": return "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border-orange-200/50";
      case "baking": return "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border-amber-200/50";
      case "packed": return "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 border-purple-200/50";
      case "ready for pickup": return "bg-cyan-50 text-cyan-700 dark:bg-cyan-950/30 dark:text-cyan-400 border-cyan-200/50";
      case "rider assigned": return "bg-teal-50 text-teal-700 dark:bg-teal-950/30 dark:text-teal-400 border-teal-200/50";
      case "out for delivery": return "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 border-green-200/50";
      case "delivered": return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 border-emerald-200/50";
      case "cancelled": return "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400 border-rose-200/50";
      default: return "bg-zinc-50 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200";
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      return format(new Date(timeStr), "dd MMM yyyy, hh:mm a");
    } catch {
      return timeStr;
    }
  };

  // Timeline Stepper steps
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

      {/* Drawer Container (900px Width) */}
      <div className="relative w-full max-w-[900px] h-full bg-white dark:bg-zinc-950 shadow-2xl flex flex-col z-10 animate-slide-in-right transition-transform">
        
        {/* Drawer Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">
                Order: {order.orderNumber}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(order.orderStatus)}`}>
                {order.orderStatus}
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
              Store: {order.store.name} | Type: {order.orderType}
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Tab Selection */}
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
                    : "border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                <Icon size={14} className="shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Tab Panels */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-5">
          
          {/* TAB 1: Order Details */}
          {activeTab === "details" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2.5">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    General Info
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-zinc-400 font-medium">Order Number:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">{order.orderNumber}</span>

                    <span className="text-zinc-400 font-medium">Store Name:</span>
                    <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">{order.store.name}</span>

                    <span className="text-zinc-400 font-medium">Order Type:</span>
                    <span className="font-bold text-zinc-850 dark:text-zinc-200 text-right">{order.orderType}</span>

                    <span className="text-zinc-400 font-medium">Placed Time:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-250 text-right">{formatTime(order.placedAt)}</span>

                    <span className="text-zinc-400 font-medium">ETA Delivery:</span>
                    <span className="font-semibold text-zinc-805 dark:text-zinc-250 text-right">{formatTime(order.estimatedDeliveryTime)}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2.5 bg-zinc-50/20 dark:bg-zinc-900/10">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Amount Breakdown
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <span className="text-zinc-400 font-medium">Subtotal:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">₹{order.pricing.subtotal.toFixed(2)}</span>

                    <span className="text-zinc-400 font-medium">Taxes (GST):</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">₹{order.pricing.tax.toFixed(2)}</span>

                    <span className="text-zinc-400 font-medium">Delivery Fee:</span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200 text-right">₹{order.pricing.deliveryFee.toFixed(2)}</span>

                    <span className="text-rose-500 font-medium font-semibold">Discount:</span>
                    <span className="font-semibold text-rose-500 text-right">-₹{order.pricing.discount.toFixed(2)}</span>

                    <div className="col-span-2 border-t border-zinc-100 dark:border-zinc-800 my-1" />
                    
                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">Total Amount:</span>
                    <span className="text-sm font-black text-[var(--primary)] text-right">₹{order.pricing.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {order.remarks && (
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 bg-amber-50/10 dark:bg-amber-950/5">
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-100 mb-1">
                    Special Instructions / Remarks
                  </h4>
                  <p className="text-xs text-zinc-600 dark:text-zinc-300 italic">"{order.remarks}"</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Items list */}
          {activeTab === "items" && (
            <div className="space-y-4 animate-fade-in">
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-bold border-b border-zinc-150 dark:border-zinc-800">
                      <th className="p-3">Product</th>
                      <th className="p-3">Variant</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20">
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
                          <div>
                            <p className="font-bold text-zinc-900 dark:text-zinc-100">{item.productName}</p>
                            {item.specialInstructions && (
                              <p className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">
                                Inst: {item.specialInstructions}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-zinc-600 dark:text-zinc-350">{item.variant || "Standard"}</td>
                        <td className="p-3 text-center font-semibold text-zinc-800 dark:text-zinc-205">{item.quantity}</td>
                        <td className="p-3 text-right font-medium">₹{item.price.toFixed(2)}</td>
                        <td className="p-3 text-right font-bold text-zinc-900 dark:text-zinc-100">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end p-2">
                <div className="text-right space-y-1">
                  <span className="text-xs text-zinc-400 font-semibold">Grand Total:</span>
                  <p className="text-lg font-black text-[var(--primary)]">₹{order.pricing.total.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Customer Info */}
          {activeTab === "customer" && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <img 
                  src={order.customer.avatar} 
                  alt={order.customer.name}
                  className="w-16 h-16 rounded-full object-cover border border-zinc-100 dark:border-zinc-800 shadow-sm"
                />
                <div className="space-y-1 min-w-0">
                  <h4 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{order.customer.name}</h4>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-500 font-medium">
                    <span className="flex items-center gap-1"><Phone size={12} className="text-zinc-400" />{order.customer.phone}</span>
                    <span className="flex items-center gap-1"><Mail size={12} className="text-zinc-400" />{order.customer.email}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-3.5">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    Delivery Address
                  </span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-semibold">{order.customer.address}</p>
                </div>

                <div className="flex gap-2">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${order.customer.coords.lat},${order.customer.coords.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-center gap-1.5 px-3 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold bg-white dark:bg-zinc-900 text-zinc-750 dark:text-zinc-200 shadow-xs hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <MapPin size={13} className="text-rose-500" />
                    Google Maps Location
                    <ExternalLink size={11} className="opacity-60" />
                  </a>
                  
                  <a
                    href={`tel:${order.customer.phone}`}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white shadow-md active:scale-95 transition-all"
                  >
                    <Phone size={13} />
                    Call Customer
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Payment Details */}
          {activeTab === "payment" && (
            <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-4 animate-fade-in bg-zinc-50/20 dark:bg-zinc-900/10">
              <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Transaction Ledger
              </h4>
              <div className="grid grid-cols-2 gap-3 text-xs border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <span className="text-zinc-400 font-medium">Payment Method:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">{order.paymentMethod}</span>

                <span className="text-zinc-400 font-medium">Payment Status:</span>
                <span className={`font-bold text-right ${
                  order.paymentStatus === "Paid" ? "text-green-600 dark:text-green-400" : "text-amber-500"
                }`}>{order.paymentStatus}</span>

                <span className="text-zinc-400 font-medium">Transaction ID:</span>
                <span className="font-mono text-zinc-800 dark:text-zinc-300 text-right">{order.transactionId || "N/A"}</span>

                <span className="text-zinc-400 font-medium">Coupon Code Applied:</span>
                <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">{order.couponApplied || "None"}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <span className="text-zinc-400 font-medium">Discount Amount:</span>
                <span className="font-bold text-rose-500 text-right">-₹{order.pricing.discount.toFixed(2)}</span>

                <span className="text-sm font-black text-zinc-900 dark:text-zinc-50">Final Paid Amount:</span>
                <span className="text-sm font-black text-[var(--primary)] text-right">₹{order.pricing.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* TAB 5: Delivery Info */}
          {activeTab === "delivery" && (
            <div className="space-y-4 animate-fade-in">
              {order.deliveryPartner ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-zinc-50/20 dark:bg-zinc-900/10">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-lg">
                        {order.deliveryPartner.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                          {order.deliveryPartner.name}
                        </h4>
                        <p className="text-[10px] text-zinc-400 font-medium mt-0.5">
                          Vehicle: {order.deliveryPartner.vehicleType}
                        </p>
                      </div>
                    </div>
                    <a
                      href={`tel:${order.deliveryPartner.phone}`}
                      className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-50 dark:hover:bg-zinc-800 shadow-xs transition-colors"
                    >
                      <Phone size={13} />
                      Contact Rider
                    </a>
                  </div>

                  <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
                    <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-2.5">
                      Delivery ETA
                    </h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="text-zinc-400 font-medium">Estimated Delivery Time:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">
                        {formatTime(order.estimatedDeliveryTime)}
                      </span>

                      <span className="text-zinc-400 font-medium">Estimated Distance:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">2.8 km</span>

                      <span className="text-zinc-400 font-medium">Estimated Pickup Time:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-200 text-right">
                        {order.estimatedPickupTime ? formatTime(order.estimatedPickupTime) : "10-15 mins"}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2">
                  <Truck className="mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5]" size={36} />
                  <p className="text-xs text-zinc-500 font-bold">Rider Not Assigned</p>
                  <p className="text-[10px] text-zinc-400">Please assign a delivery partner from the live dashboard actions.</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: Stepper Timeline */}
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
                    <div key={stepName} className="relative pl-6">
                      {/* Stepper Dot */}
                      <span className={`absolute left-0 -translate-x-[50%] top-1.5 flex h-4 w-4 rounded-full border items-center justify-center transition-all ${
                        isCompleted 
                          ? isCurrent 
                            ? "bg-[var(--primary)] border-[var(--primary)] shadow-md animate-pulse"
                            : "bg-emerald-500 border-emerald-500 text-white"
                          : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800"
                      }`}>
                        {isCompleted && !isCurrent && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                        {isCurrent && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>

                      {/* Content */}
                      <div>
                        <h5 className={`text-xs font-bold transition-colors ${
                          isCurrent 
                            ? "text-[var(--primary)] font-black" 
                            : isCompleted 
                              ? "text-zinc-800 dark:text-zinc-200" 
                              : "text-zinc-400 font-semibold"
                        }`}>
                          {stepName}
                        </h5>
                        {isCompleted && (
                          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-medium mt-0.5">
                            <span>By: {timelineEntry.updatedBy}</span>
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

        </div>
      </div>
    </div>
  );
}
