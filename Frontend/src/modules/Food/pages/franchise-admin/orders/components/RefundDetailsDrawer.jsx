import React, { useState } from "react";
import { 
  X, User, ShoppingBag, Landmark, Image as ImageIcon, GitCommit, ShieldCheck, 
  Clock, CheckCircle, Ban, ArrowRight, Download, Eye, Calendar, Sparkles, UserCheck 
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useRefundRequest } from "../ordersQuery";
import ImagePreviewModal from "./ImagePreviewModal";

export default function RefundDetailsDrawer({ isOpen, onClose, requestId }) {
  const { data: request, isLoading } = useRefundRequest(requestId);
  const [activeTab, setActiveTab] = useState("customer");
  const [previewImage, setPreviewImage] = useState(null);

  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return "text-orange-600 bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900/30";
      case "Approved":
        return "text-blue-600 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/30";
      case "Rejected":
        return "text-red-600 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30";
      case "Processed":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30";
      default:
        return "text-zinc-600 bg-zinc-50 border-zinc-200";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Pending": return <Clock size={12} />;
      case "Approved": return <CheckCircle size={12} />;
      case "Rejected": return <Ban size={12} />;
      case "Processed": return <ShieldCheck size={12} />;
      default: return null;
    }
  };

  const tabs = [
    { id: "customer", label: "Customer Details", icon: User },
    { id: "order", label: "Order Details", icon: ShoppingBag },
    { id: "refund", label: "Refund Details", icon: Landmark },
    { id: "images", label: "Uploaded Images", icon: ImageIcon },
    { id: "timeline", label: "Timeline Logs", icon: GitCommit },
    { id: "payment", label: "Payment Info", icon: ShieldCheck },
  ];

  return (
    <div className="fixed inset-0 z-40 overflow-hidden text-xs">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/45 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out Panel Container */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-[1000px] h-full bg-white dark:bg-zinc-950 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col animate-slide-in">
          
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[var(--primary)] text-white rounded-xl shadow-sm">
                <Landmark size={18} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                    Refund Request Details
                  </h3>
                  {request && (
                    <span className={`px-2.5 py-0.5 border rounded-full font-bold flex items-center gap-1 text-[9.5px] ${getStatusBadge(request.refundStatus)}`}>
                      {getStatusIcon(request.refundStatus)}
                      {request.refundStatus}
                    </span>
                  )}
                </div>
                {request && (
                  <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                    Request ID: {request.requestId} • Order No: {request.orderNumber}
                  </p>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center space-y-3">
              <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
              <p className="font-extrabold text-zinc-400">Fetching refund records...</p>
            </div>
          ) : request ? (
            <div className="flex-1 flex overflow-hidden">
              
              {/* Left Tab Menu (Vertical bar) */}
              <nav className="w-56 bg-zinc-50/50 dark:bg-zinc-900/10 border-r border-zinc-150 dark:border-zinc-850 p-3 space-y-1 shrink-0 flex flex-col">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl font-bold transition-all text-left cursor-pointer ${
                        active 
                          ? "bg-[var(--primary)] text-white shadow-sm"
                          : "text-zinc-550 dark:text-zinc-450 hover:bg-zinc-100 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      <Icon size={14} className={active ? "text-white" : "text-zinc-400"} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Tab Panel Content (Scrollable) */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 scrollbar-thin dark:text-zinc-350">
                
                {/* 1. Customer Details Tab */}
                {activeTab === "customer" && (
                  <div className="space-y-5">
                    <div className="flex items-center gap-4 p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-2xl">
                      <img
                        src={request.customer?.avatar}
                        alt={request.customer?.name}
                        className="w-14 h-14 rounded-full border border-zinc-200 dark:border-zinc-800 object-cover bg-zinc-100 shrink-0"
                      />
                      <div className="space-y-0.5">
                        <h4 className="font-extrabold text-sm text-zinc-800 dark:text-zinc-200">{request.customer?.name}</h4>
                        <p className="text-[10px] text-zinc-400 font-bold">{request.customer?.phone}</p>
                        <p className="text-[10px] text-zinc-450">{request.customer?.email}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-1">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Account Statistics</span>
                        <div className="pt-2 grid grid-cols-2 gap-2 text-center">
                          <div className="p-2 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl">
                            <p className="text-[9px] text-zinc-450 uppercase font-semibold">Total Orders</p>
                            <p className="font-extrabold text-xs text-zinc-800 dark:text-zinc-200 mt-0.5">{request.customer?.totalOrders || 0}</p>
                          </div>
                          <div className="p-2 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl">
                            <p className="text-[9px] text-zinc-450 uppercase font-semibold">LTV Spend</p>
                            <p className="font-extrabold text-xs text-[var(--primary)] mt-0.5">₹{(request.customer?.lifetimeValue || 0).toLocaleString("en-IN")}</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-1 flex flex-col justify-center">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Customer Since</span>
                        <p className="font-extrabold text-zinc-800 dark:text-zinc-250 mt-1 flex items-center gap-1.5">
                          <Calendar size={13} className="text-zinc-450" />
                          <span>{request.customer?.memberSince || "N/A"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-2">
                      <span className="text-[9px] uppercase font-bold text-zinc-400">Delivery Address</span>
                      <p className="font-bold text-zinc-750 dark:text-zinc-250 leading-relaxed bg-zinc-50/30 dark:bg-zinc-900/20 p-2.5 rounded-xl border border-zinc-100 dark:border-zinc-900 font-mono text-[10px]">
                        {request.customer?.address || "Address not provided."}
                      </p>
                    </div>
                  </div>
                )}

                {/* 2. Order Details Tab */}
                {activeTab === "order" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Order Number</p>
                        <p className="font-black text-zinc-800 dark:text-zinc-200">{request.orderNumber}</p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Franchise Branch</p>
                        <p className="font-black text-zinc-800 dark:text-zinc-200 truncate">{request.store?.name}</p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Placed Date</p>
                        <p className="font-black text-zinc-850 dark:text-zinc-200">
                          {request.requestedAt ? format(new Date(request.requestedAt), "dd MMM yyyy, hh:mm a") : "N/A"}
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Payment Gateway</p>
                        <p className="font-black text-zinc-800 dark:text-zinc-200">{request.paymentInfo?.gateway || "Razorpay"}</p>
                      </div>
                    </div>

                    {/* Simple summary table */}
                    <div className="border border-zinc-150 dark:border-zinc-850 rounded-2xl overflow-hidden">
                      <div className="bg-zinc-50/50 dark:bg-zinc-900/30 px-4 py-2 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between">
                        <span className="font-bold text-[9px] uppercase text-zinc-400">Billing Summary</span>
                        <span className="text-[10px] font-bold text-zinc-400">Txn: {request.paymentTransactionId}</span>
                      </div>
                      <div className="p-4 space-y-2">
                        <div className="flex justify-between font-semibold">
                          <span>Subtotal</span>
                          <span>₹{(request.refundAmount * 0.9).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Delivery & Packaging Fees</span>
                          <span>₹40.00</span>
                        </div>
                        <div className="flex justify-between font-semibold text-rose-500">
                          <span>Applied Coupon Discounts</span>
                          <span>-₹30.00</span>
                        </div>
                        <div className="flex justify-between font-semibold">
                          <span>Taxes & GST (5%)</span>
                          <span>₹{(request.refundAmount * 0.05).toFixed(2)}</span>
                        </div>
                        <div className="h-[1px] bg-zinc-100 dark:bg-zinc-900 my-2" />
                        <div className="flex justify-between font-black text-zinc-900 dark:text-white text-xs">
                          <span>Total Paid Amount</span>
                          <span>₹{request.refundAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 3. Refund Details Tab */}
                {activeTab === "refund" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Requested Refund</p>
                        <p className="font-black text-sm text-zinc-850 dark:text-white">₹{request.refundAmount.toFixed(2)}</p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Settled Payout Amount</p>
                        <p className="font-black text-sm text-emerald-600">
                          ₹{request.paymentInfo?.processedAmount ? request.paymentInfo.processedAmount.toFixed(2) : "0.00"}
                        </p>
                      </div>
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-0.5 col-span-2 md:col-span-1">
                        <p className="text-[8.5px] uppercase font-bold text-zinc-400">Authorized Operator</p>
                        <p className="font-black text-zinc-850 dark:text-zinc-200 flex items-center gap-1">
                          <UserCheck size={12} className="text-blue-500" />
                          <span>{request.approvedBy || "Not Approved Yet"}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="text-zinc-400" size={14} />
                        <span className="font-black text-zinc-800 dark:text-zinc-100">Claim Reason: {request.reason}</span>
                      </div>
                      
                      <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-xl border border-zinc-100 dark:border-zinc-900 space-y-1.5">
                        <p className="text-[9px] uppercase font-bold text-zinc-400">Full Description</p>
                        <p className="font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                          {request.description || "No full explanation provided by customer."}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. Uploaded Images Tab */}
                {activeTab === "images" && (
                  <div className="space-y-4">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block">Uploaded Attachments</span>
                    
                    {!request.attachments || request.attachments.length === 0 ? (
                      <div className="p-8 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center space-y-2">
                        <ImageIcon className="mx-auto text-zinc-300" size={24} />
                        <p className="font-bold text-zinc-400">No attachments uploaded by customer</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 gap-4">
                        {request.attachments.map((imgUrl, index) => (
                          <div 
                            key={index} 
                            className="relative group aspect-square bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs cursor-pointer"
                            onClick={() => setPreviewImage(imgUrl)}
                          >
                            <img
                              src={imgUrl}
                              alt={`Refund Proof ${index + 1}`}
                              className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-350 select-none"
                            />
                            
                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-200">
                              <button
                                type="button"
                                className="p-2 bg-white text-zinc-900 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPreviewImage(imgUrl);
                                }}
                                title="Zoom View"
                              >
                                <Eye size={13} strokeWidth={2.5} />
                              </button>
                              <a
                                href={imgUrl}
                                download={`claim-proof-${index + 1}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-2 bg-white text-zinc-900 rounded-full hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                                title="Download"
                              >
                                <Download size={13} strokeWidth={2.5} />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Timeline Tab */}
                {activeTab === "timeline" && (
                  <div className="space-y-4">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 block">Workflow Event logs</span>
                    
                    <div className="relative pl-6 border-l-2 border-zinc-100 dark:border-zinc-850 space-y-6">
                      {request.timeline?.map((evt, idx) => (
                        <div key={idx} className="relative">
                          {/* Stepper Dot */}
                          <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full border-2 border-white dark:border-zinc-950 bg-[var(--primary)] flex items-center justify-center text-white ring-4 ring-zinc-50 dark:ring-zinc-900/35">
                            <span className="w-1.5 h-1.5 rounded-full bg-white" />
                          </span>

                          <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/25 border border-zinc-150 dark:border-zinc-850 rounded-xl space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-extrabold text-zinc-800 dark:text-zinc-200">{evt.status}</span>
                              <span className="text-[9px] text-zinc-400 font-bold">
                                {evt.timestamp ? format(new Date(evt.timestamp), "dd MMM, hh:mm a") : ""}
                              </span>
                            </div>
                            <p className="text-[9.5px] text-zinc-450 font-semibold">Operator: {evt.updatedBy}</p>
                            {evt.remarks && (
                              <p className="text-[10px] text-zinc-500 bg-white dark:bg-zinc-950 px-2 py-1.5 rounded border border-zinc-100 dark:border-zinc-900 mt-1 font-mono leading-relaxed">
                                {evt.remarks}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 6. Payment Information Tab */}
                {activeTab === "payment" && (
                  <div className="space-y-4">
                    <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] uppercase font-bold text-zinc-400">Gateway Transaction Mapping</span>
                        <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 font-bold text-[9px]">
                          Node status: OK
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-zinc-400 font-bold">ORIGINAL TRANSACTION ID</p>
                          <p className="font-bold font-mono text-zinc-800 dark:text-zinc-250 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-150 dark:border-zinc-850">
                            {request.paymentInfo?.originalTransactionId || request.paymentTransactionId || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-zinc-400 font-bold">REFUND GATEWAY ID</p>
                          <p className="font-bold font-mono text-zinc-800 dark:text-zinc-250 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-150 dark:border-zinc-850">
                            {request.paymentInfo?.refundTransactionId || "No settlement transaction logged"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-zinc-400 font-bold">PAYOUT GATEWAY</p>
                          <p className="font-bold text-zinc-850 dark:text-zinc-250 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-150 dark:border-zinc-850">
                            {request.paymentInfo?.gateway || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-zinc-400 font-bold">PROCESSED AMOUNT</p>
                          <p className="font-bold text-emerald-600 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-150 dark:border-zinc-850">
                            ₹{request.paymentInfo?.processedAmount ? request.paymentInfo.processedAmount.toFixed(2) : "0.00"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-zinc-400 font-bold">PROCESSING CLERK</p>
                          <p className="font-bold text-zinc-850 dark:text-zinc-255 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-150 dark:border-zinc-850">
                            {request.paymentInfo?.processedBy || "N/A"}
                          </p>
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-[9px] text-zinc-400 font-bold">SETTLEMENT DATE</p>
                          <p className="font-bold text-zinc-855 dark:text-zinc-255 bg-zinc-50 dark:bg-zinc-900 p-2 rounded-lg border border-zinc-150 dark:border-zinc-850">
                            {request.paymentInfo?.processingDate ? format(new Date(request.paymentInfo.processingDate), "dd MMM yyyy, hh:mm a") : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center space-y-2">
              <span className="font-black text-zinc-400">Record not found.</span>
            </div>
          )}

          {/* Footer controls */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end bg-zinc-50/30 dark:bg-zinc-900/10 shrink-0">
            <button
              onClick={onClose}
              className="px-5 py-2 bg-zinc-950 dark:bg-zinc-800 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white font-bold rounded-xl shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              Close Drawer
            </button>
          </footer>

        </div>
      </div>

      {/* Embedded Image Preview Modal */}
      {request?.attachments && (
        <ImagePreviewModal
          isOpen={!!previewImage}
          onClose={() => setPreviewImage(null)}
          images={request.attachments}
          initialIndex={request.attachments.indexOf(previewImage)}
        />
      )}
    </div>
  );
}
