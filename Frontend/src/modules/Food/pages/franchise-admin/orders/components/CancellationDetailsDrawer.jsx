import React, { useState } from "react";
import { 
  X, ShoppingBag, Info, ShieldAlert, CreditCard, Clock, 
  MapPin, Phone, Mail, FileText, CheckCircle, AlertTriangle, ArrowRight, User, UserCheck
} from "lucide-react";
import { format } from "date-fns";

export default function CancellationDetailsDrawer({ isOpen, onClose, order }) {
  const [activeTab, setActiveTab] = useState("orderInfo");

  if (!isOpen || !order) return null;

  const tabs = [
    { id: "orderInfo", label: "Order Information", icon: ShoppingBag },
    { id: "cancelDetails", label: "Cancellation Details", icon: Info },
    { id: "timeline", label: "Timeline Stepper", icon: Clock },
    { id: "refundInfo", label: "Refund Information", icon: CreditCard },
    { id: "investigation", label: "Investigation Notes", icon: ShieldAlert },
  ];

  const formatTime = (timeStr) => {
    if (!timeStr) return "N/A";
    try {
      return format(new Date(timeStr), "dd MMM yyyy, hh:mm a");
    } catch {
      return timeStr;
    }
  };

  const getReasonColor = (reason) => {
    switch (reason) {
      case "Customer Request": return "bg-orange-50 text-orange-700 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200/50";
      case "Out Of Stock": return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50";
      case "Kitchen Issue": return "bg-purple-50 text-purple-700 dark:bg-purple-950/20 dark:text-purple-400 border-purple-200/50";
      case "Payment Failure": return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200/50";
      case "System Failure": return "bg-zinc-105 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-350 border-zinc-200";
      default: return "bg-zinc-50 text-zinc-550 border-zinc-200";
    }
  };

  const getRefundBadgeColor = (status) => {
    switch (status) {
      case "Completed": return "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200/50";
      case "Initiated": return "bg-yellow-50 text-yellow-750 dark:bg-yellow-950/20 dark:text-yellow-450 border-yellow-200/50";
      case "Pending": return "bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-450 border-blue-250";
      case "Rejected": return "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-200/50";
      default: return "bg-zinc-50 text-zinc-450 border-zinc-200";
    }
  };

  const getPriorityColor = (p) => {
    switch (p) {
      case "High": return "text-rose-600 bg-rose-50 dark:bg-rose-950/20 font-black";
      case "Medium": return "text-amber-600 bg-amber-50 dark:bg-amber-950/20 font-bold";
      default: return "text-blue-600 bg-blue-50 dark:bg-blue-950/20 font-semibold";
    }
  };

  // Determine Refund Eligibility Badge
  const isRefundEligible = order.cancellation?.refundRequired === true && order.paymentStatus === "Paid";

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
        <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                Cancellation details: {order.orderNumber}
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full border bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border-rose-250 animate-pulse">
                Cancelled
              </span>
            </div>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
              Store Branch: {order.store.name} | Amount: ₹{order.pricing.total.toFixed(2)}
            </p>
          </div>
          
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg border border-zinc-100 dark:border-zinc-800 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Tab Selectors */}
        <div className="flex border-b border-zinc-150 dark:border-zinc-850 bg-zinc-50/30 dark:bg-zinc-900/10 px-4 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-4 text-[11px] font-black flex items-center gap-1.5 border-b-2 transition-all relative whitespace-nowrap ${
                  activeTab === tab.id
                    ? "border-[var(--primary)] text-[var(--primary)]"
                    : "border-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
                }`}
              >
                <Icon size={13} className="shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin space-y-5 text-xs text-zinc-700 dark:text-zinc-300">
          
          {/* TAB 1: Order Information */}
          {activeTab === "orderInfo" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* General Summary */}
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2.5 bg-zinc-50/20 dark:bg-zinc-900/10">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    General Info
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <span className="text-zinc-400">Order Number:</span>
                    <span className="font-bold text-right text-zinc-800 dark:text-zinc-200">{order.orderNumber}</span>

                    <span className="text-zinc-400">Store Branch:</span>
                    <span className="font-semibold text-right text-zinc-800 dark:text-zinc-200">{order.store.name}</span>

                    <span className="text-zinc-400">Payment Status:</span>
                    <span className={`font-bold text-right ${order.paymentStatus === 'Paid' ? 'text-green-600' : 'text-rose-500'}`}>
                      {order.paymentStatus}
                    </span>

                    <span className="text-zinc-400">Payment Method:</span>
                    <span className="font-bold text-right text-zinc-800 dark:text-zinc-200">{order.paymentMethod}</span>

                    <span className="text-zinc-400">Order Date:</span>
                    <span className="font-medium text-right text-zinc-800 dark:text-zinc-200">{formatTime(order.placedAt)}</span>

                    <span className="text-zinc-400">Cancelled Date:</span>
                    <span className="font-semibold text-right text-zinc-800 dark:text-zinc-200">
                      {formatTime(order.cancellation?.createdAt || order.placedAt)}
                    </span>
                  </div>
                </div>

                {/* Customer Card */}
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Customer Information
                  </h4>
                  <div className="flex items-center gap-3">
                    <img 
                      src={order.customer.avatar} 
                      alt="" 
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                      onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50"; }}
                    />
                    <div>
                      <p className="font-bold text-sm text-zinc-800 dark:text-zinc-100">{order.customer.name}</p>
                      <p className="text-[10px] text-zinc-450 font-semibold mt-0.5">{order.customer.phone}</p>
                    </div>
                  </div>
                  <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2.5 space-y-1">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide block">Delivery Address</span>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-semibold">{order.customer.address}</p>
                  </div>
                </div>

              </div>

              {/* Items Table */}
              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden mt-4">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900/50 text-zinc-500 font-bold border-b border-zinc-150 dark:border-zinc-800">
                      <th className="p-3">Product Name</th>
                      <th className="p-3">Variant</th>
                      <th className="p-3 text-center">Qty</th>
                      <th className="p-3 text-right">Price</th>
                      <th className="p-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50/30 dark:hover:bg-zinc-900/10">
                        <td className="p-3 font-bold text-zinc-900 dark:text-zinc-100">{item.productName}</td>
                        <td className="p-3 text-zinc-500">{item.variant || "Standard"}</td>
                        <td className="p-3 text-center font-bold">{item.quantity}</td>
                        <td className="p-3 text-right">₹{item.price.toFixed(2)}</td>
                        <td className="p-3 text-right font-black text-zinc-900 dark:text-white">
                          ₹{(item.price * item.quantity).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-zinc-50/10 dark:bg-zinc-900/10 font-bold">
                      <td colSpan={3} className="p-3 text-right">Grand Total Paid:</td>
                      <td colSpan={2} className="p-3 text-right text-sm font-black text-[var(--primary)]">
                        ₹{order.pricing.total.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: Cancellation Details */}
          {activeTab === "cancelDetails" && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Details Card */}
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-3 bg-zinc-50/20 dark:bg-zinc-900/10">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Cancellation Meta
                  </h4>
                  <div className="grid grid-cols-2 gap-2.5">
                    <span className="text-zinc-400">Cancelled By:</span>
                    <span className="font-bold text-right text-zinc-800 dark:text-zinc-100">{order.cancellation?.cancelledBy || "System Auto"}</span>

                    <span className="text-zinc-400">Responsible Role:</span>
                    <span className="font-bold text-right text-zinc-800 dark:text-zinc-100">{order.cancellation?.role || "SYSTEM"}</span>

                    <span className="text-zinc-400">Primary Reason:</span>
                    <span className={`font-bold text-right px-2 py-0.5 rounded border text-[10px] self-start inline-block ${getReasonColor(order.cancellation?.reason)}`}>
                      {order.cancellation?.reason || "System Failure"}
                    </span>

                    <span className="text-zinc-400">Cancelled Date/Time:</span>
                    <span className="font-semibold text-right text-zinc-800 dark:text-zinc-200">
                      {formatTime(order.cancellation?.createdAt || order.placedAt)}
                    </span>
                  </div>
                </div>

                {/* Eligibility and Refund Required */}
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-3.5">
                  <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    Refund Eligibility
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-400 font-medium">Eligibility Status:</span>
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-black ${
                      isRefundEligible 
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border-emerald-200/50" 
                        : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-455 border-rose-250"
                    }`}>
                      {isRefundEligible ? "Eligible" : "Not Eligible"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-zinc-100 dark:border-zinc-800 pt-3">
                    <span className="text-zinc-400 font-medium">Refund Required:</span>
                    <span className="font-bold text-right text-zinc-800 dark:text-zinc-100">
                      {order.cancellation?.refundRequired ? "Yes" : "No"}
                    </span>

                    <span className="text-zinc-400 font-medium">Total Refund amount:</span>
                    <span className="font-black text-right text-[var(--primary)]">
                      ₹{(order.cancellation?.refundAmount || 0).toFixed(2)}
                    </span>

                    <span className="text-zinc-400 font-medium">Refund Status:</span>
                    <span className={`font-bold text-right ${getRefundBadgeColor(order.cancellation?.refundStatus)}`}>
                      {order.cancellation?.refundStatus || "N/A"}
                    </span>
                  </div>
                </div>

              </div>

              {/* Remarks Box */}
              <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
                <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide block mb-1">
                  Cancellation Remarks / Remarks
                </span>
                <p className="text-xs text-zinc-850 dark:text-zinc-200 italic leading-relaxed">
                  "{order.cancellation?.remarks || "No remarks stated."}"
                </p>
              </div>

            </div>
          )}

          {/* TAB 3: Animated Timeline Stepper */}
          {activeTab === "timeline" && (
            <div className="p-5 rounded-xl border border-zinc-150 dark:border-zinc-800 animate-fade-in">
              <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider mb-4">
                Lifecycle Timeline
              </h4>

              <div className="relative border-l border-zinc-150 dark:border-zinc-800 ml-3.5 space-y-6 py-2">
                {order.timeline.map((step, idx) => {
                  const isCurrent = idx === order.timeline.length - 1;
                  const isCancel = step.status.toLowerCase().includes("cancelled") || step.status.toLowerCase().includes("cancellation");

                  return (
                    <div key={idx} className="relative pl-6 animate-fade-in">
                      {/* Stepper Node Dot */}
                      <span className={`absolute left-0 -translate-x-[50%] top-1 flex h-4 w-4 rounded-full border items-center justify-center transition-all ${
                        isCancel 
                          ? "bg-rose-500 border-rose-500 text-white shadow-md shadow-rose-500/10"
                          : isCurrent 
                            ? "bg-[var(--primary)] border-[var(--primary)] text-white shadow-md shadow-[var(--primary)]/10"
                            : "bg-emerald-500 border-emerald-500 text-white"
                      }`}>
                        {isCancel ? (
                          <X size={10} strokeWidth={3} />
                        ) : (
                          <CheckCircle size={10} className="text-white fill-emerald-500 stroke-[3]" />
                        )}
                      </span>

                      {/* Detail Text */}
                      <div>
                        <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                          {step.status}
                          {isCurrent && (
                            <span className="text-[8px] uppercase bg-[var(--primary)]/10 text-[var(--primary)] px-1 rounded font-black border border-[var(--primary)]/20 animate-pulse">
                              Current
                            </span>
                          )}
                        </h5>
                        <div className="flex items-center gap-1 text-[10px] text-zinc-400 font-semibold mt-0.5">
                          <span>Updated By: {step.updatedBy}</span>
                          <span>•</span>
                          <span>{formatTime(step.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: Refund Information */}
          {activeTab === "refundInfo" && (
            <div className="space-y-4 animate-fade-in bg-zinc-50/10 dark:bg-zinc-900/5 p-4 rounded-xl border border-zinc-150 dark:border-zinc-800">
              <h4 className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                Refund Transaction Audit
              </h4>

              {order.refund?.refundRequired ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Left Column stats */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Refund Required:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-105">Yes (Paid order Cancelled)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Refund Amount:</span>
                      <span className="font-black text-[var(--primary)]">₹{(order.refund.refundAmount || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Refund Method/Mode:</span>
                      <span className="font-bold text-zinc-800 dark:text-zinc-105">{order.refund.refundMethod || "UPI"}</span>
                    </div>
                  </div>

                  {/* Right Column stats */}
                  <div className="space-y-2.5 text-xs border-l border-zinc-100 dark:border-zinc-800 pl-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Refund Status:</span>
                      <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${getRefundBadgeColor(order.refund.refundStatus)}`}>
                        {order.refund.refundStatus || "Pending"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Gateway Reference:</span>
                      <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {order.refund.transactionReference || "AWAITING_INITIATION"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Initiated Date:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {order.refund.initiatedAt ? formatTime(order.refund.initiatedAt) : "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Completed Date:</span>
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {order.refund.completedAt ? formatTime(order.refund.completedAt) : "N/A"}
                      </span>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="p-6 text-center space-y-2">
                  <CreditCard className="mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5]" size={36} />
                  <p className="font-bold text-zinc-500">Refund Not Required</p>
                  <p className="text-[10px] text-zinc-400">No payment transaction was made (e.g. COD Checkout abandoned or payment failed).</p>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Investigation Notes */}
          {activeTab === "investigation" && (
            <div className="space-y-4 animate-fade-in">
              
              {/* Investigation Header stats */}
              <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-zinc-50/20 dark:bg-zinc-900/10">
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Case Status</span>
                  <span className={`inline-flex items-center gap-1 mt-0.5 text-[10px] font-black px-2 py-0.5 rounded-full border ${
                    order.investigation?.caseStatus === "Open"
                      ? "bg-blue-50 text-blue-700 border-blue-200/50"
                      : order.investigation?.caseStatus === "Under Review"
                        ? "bg-amber-50 text-amber-700 border-amber-250 animate-pulse"
                        : "bg-zinc-100 text-zinc-700 border-zinc-200"
                  }`}>
                    {order.investigation?.caseStatus || "Open"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Assigned Staff</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-100 flex items-center gap-1 mt-1">
                    <User size={11} className="text-zinc-405" />
                    {order.investigation?.assignedStaff || "Unassigned"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Case Priority</span>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] ${getPriorityColor(order.investigation?.priority)}`}>
                    {order.investigation?.priority || "Low"}
                  </span>
                </div>
                <div>
                  <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Evidence Files</span>
                  <span className="font-bold text-zinc-850 dark:text-zinc-100 mt-1 block">
                    {order.investigation?.attachments?.length || 0} attachments
                  </span>
                </div>
              </div>

              {/* Case details description */}
              <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-2">
                <span className="text-[9px] uppercase font-bold text-zinc-405 tracking-wider block">Case Description & Notes</span>
                <p className="text-xs text-zinc-800 dark:text-zinc-200 font-semibold leading-relaxed">
                  {order.investigation?.description || "No dispute case description available."}
                </p>
                <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2.5 mt-2.5">
                  <span className="text-[9px] uppercase font-bold text-zinc-405 tracking-wider block mb-1">Latest Auditor Action Remarks</span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 italic">
                    "{order.investigation?.notes || "No auditor notes entered."}"
                  </p>
                </div>
              </div>

              {/* Attachments list if any */}
              {order.investigation?.attachments && order.investigation.attachments.length > 0 && (
                <div className="p-3 bg-zinc-55/10 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-2">
                  <span className="text-[9px] uppercase font-bold text-zinc-405 tracking-wider block">Attached Auditing Files</span>
                  <div className="grid grid-cols-2 gap-2">
                    {order.investigation.attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-850 text-[10px]">
                        <FileText size={14} className="text-zinc-400" />
                        <span className="font-mono text-zinc-800 dark:text-zinc-200 truncate">{file}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Audit logs timeline */}
              {order.investigation?.auditLogs && (
                <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-3">
                  <span className="text-[9px] uppercase font-bold text-zinc-405 tracking-wider block">Case Action Audit Trails</span>
                  <div className="space-y-3 text-xs">
                    {order.investigation.auditLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start justify-between border-b border-zinc-50 dark:border-zinc-850/50 pb-2 last:border-b-0 last:pb-0">
                        <div>
                          <p className="font-bold text-zinc-800 dark:text-zinc-200">{log.action}</p>
                          <p className="text-[10px] text-zinc-450 mt-0.5">Executed by: {log.staff}</p>
                        </div>
                        <span className="text-[10px] text-zinc-400 font-semibold">{formatTime(log.timestamp)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
