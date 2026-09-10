import React, { useState, useEffect } from "react";
import { 
  X, User, Mail, Phone, Calendar, Clock, Star, MapPin, 
  Package, ClipboardList, ShieldAlert, Trophy, Trash2, 
  Edit, Plus, FileText, CheckCircle2, ChevronRight, 
  Check, Eye, AlertTriangle, AlertCircle, RefreshCw,
  Send, ExternalLink, HelpCircle, Download, ZoomIn
} from "lucide-react";
import { mockStores } from "../mockData";

// Helper to format date nicely
const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(value);
  }
};

export default function ReviewDrawer({
  isOpen,
  onClose,
  reviewId,
  useReviewsHook,
  onReplyClick,
  onEditReplyClick,
  onDeleteReplyClick,
  onHideClick,
  onPublishClick,
  onDeleteClick
}) {
  const {
    reviewDetails,
    loadingDetails,
    fetchReviewDetails,
    replyReview
  } = useReviewsHook;

  const [activeTab, setActiveTab] = useState("Review Details");
  const [lightboxImg, setLightboxImg] = useState(null);

  useEffect(() => {
    if (isOpen && reviewId) {
      fetchReviewDetails(reviewId);
      setActiveTab("Review Details");
    }
  }, [isOpen, reviewId, fetchReviewDetails]);

  if (!isOpen) return null;

  const tabs = [
    { name: "Review Details", icon: ShieldAlert },
    { name: "Customer Details", icon: User },
    { name: "Order Information", icon: Package },
    { name: "Images", icon: FileText },
    { name: "Previous Reviews", icon: Star },
    { name: "Admin Response", icon: ClipboardList },
    { name: "Activity Timeline", icon: Clock }
  ];

  // Render Star Badge Color
  const getRatingStars = (r) => {
    return (
      <div className="flex items-center gap-0.5 text-amber-500">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} size={13} fill={i < r ? "currentColor" : "none"} />
        ))}
      </div>
    );
  };

  const getStatusBadgeClass = (s) => {
    switch (s) {
      case "Published": return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Hidden": return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20";
      default: return "bg-slate-550/10 text-slate-500 border-slate-500/20";
    }
  };

  // Mock Rating distribution calculation for progress bars
  const totalMockDist = 120;
  const ratingBreakdown = [
    { stars: 5, count: 80, pct: 67 },
    { stars: 4, count: 25, pct: 21 },
    { stars: 3, count: 10, pct: 8 },
    { stars: 2, count: 3, pct: 3 },
    { stars: 1, count: 2, pct: 1 }
  ];

  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      {/* Backdrop overlay */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel (90% width) */}
      <div className="relative w-full max-w-[90%] md:max-w-[80%] lg:max-w-[70%] xl:max-w-[60%] h-full bg-slate-50 dark:bg-zinc-950 shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col z-10 animate-slide-in-right">
        
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 bg-white dark:bg-zinc-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <Star size={20} fill="currentColor" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-white uppercase tracking-wider">
                  Review Details
                </h3>
                {reviewDetails && (
                  <>
                    <span className="text-[10px] text-amber-500 font-extrabold flex items-center gap-0.5">
                      {reviewDetails.rating}★
                    </span>
                    <span className={`px-1.5 py-0.2 rounded-md text-[8px] font-bold border ${getStatusBadgeClass(reviewDetails.status)}`}>
                      {reviewDetails.status}
                    </span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 mt-0.5">
                Outlet: {reviewDetails?.storeName} | Date: {reviewDetails ? formatDateTime(reviewDetails.createdAt) : "Loading..."}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-150 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selection Bar */}
        <div className="flex bg-white dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-850 px-4 overflow-x-auto scrollbar-none gap-2">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`py-3 px-3 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isSelected 
                    ? "border-[var(--primary)] text-[var(--primary)]" 
                    : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                }`}
              >
                <Icon size={12} />
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          {loadingDetails ? (
            <div className="h-64 flex items-center justify-center flex-col gap-2">
              <div className="w-8 h-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
              <p className="text-xs text-zinc-450 dark:text-zinc-400">Querying feedback database collections...</p>
            </div>
          ) : reviewDetails ? (
            <div className="space-y-4">
              
              {/* TAB 1: REVIEW DETAILS */}
              {activeTab === "Review Details" && (
                <div className="space-y-4 animate-fade-down">
                  {/* Summary Core Card */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <h4 className="text-[10px] font-bold uppercase text-zinc-400">Customer Rating</h4>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="text-sm font-black text-zinc-900 dark:text-white">{reviewDetails.rating} Out of 5</span>
                          {getRatingStars(reviewDetails.rating)}
                        </div>
                      </div>
                      <div className="text-right">
                        <h4 className="text-[10px] font-bold uppercase text-zinc-400">Response Status</h4>
                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold mt-1 inline-block ${reviewDetails.adminReply ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600"}`}>
                          {reviewDetails.adminReply ? "REPLIED" : "AWAITING REPLY"}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <h4 className="text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">Customer Review Content</h4>
                      <p className="text-xs text-zinc-650 dark:text-zinc-300 leading-relaxed bg-zinc-50 dark:bg-zinc-950 p-3 rounded-lg border border-zinc-150 dark:border-zinc-850 font-medium italic">
                        "{reviewDetails.reviewText || 'No text review provided by customer.'}"
                      </p>
                    </div>

                    {reviewDetails.tags?.length > 0 && (
                      <div className="pt-2 flex flex-wrap gap-1">
                        {reviewDetails.tags.map(tag => (
                          <span key={tag} className="px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded text-[9px] font-bold">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Rating breakdown stats */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
                    <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-3">Overall Store Rating Breakdown</h4>
                    <div className="space-y-2">
                      {ratingBreakdown.map((row) => (
                        <div key={row.stars} className="flex items-center gap-3 text-[10px]">
                          <span className="w-8 font-bold text-zinc-500">{row.stars} Star</span>
                          <div className="flex-1 h-2 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                row.stars >= 4 ? "bg-amber-500" : row.stars === 3 ? "bg-yellow-400" : "bg-rose-500"
                              }`}
                              style={{ width: `${row.pct}%` }}
                            />
                          </div>
                          <span className="w-12 text-right text-zinc-400 font-bold">{row.count} ({row.pct}%)</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operational actions */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
                    <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-3">Reputation Management Operations</h4>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {!reviewDetails.adminReply ? (
                        <button
                          onClick={() => onReplyClick(reviewDetails)}
                          className="flex items-center justify-center gap-1 px-3 py-2.5 bg-[var(--primary)] text-white hover:opacity-90 font-bold rounded-lg uppercase tracking-wider text-[10px] cursor-pointer"
                        >
                          <Send size={11} />
                          Reply to review
                        </button>
                      ) : (
                        <button
                          onClick={() => onEditReplyClick(reviewDetails)}
                          className="flex items-center justify-center gap-1 px-3 py-2.5 bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 text-white hover:opacity-90 font-bold rounded-lg uppercase tracking-wider text-[10px] cursor-pointer"
                        >
                          <Edit size={11} />
                          Edit reply
                        </button>
                      )}

                      {reviewDetails.status === "Published" ? (
                        <button
                          onClick={() => onHideClick(reviewDetails)}
                          className="flex items-center justify-center gap-1 px-3 py-2.5 border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/10 text-amber-600 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                        >
                          <AlertTriangle size={11} />
                          Hide review
                        </button>
                      ) : (
                        <button
                          onClick={() => onPublishClick(reviewDetails)}
                          className="flex items-center justify-center gap-1 px-3 py-2.5 border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 text-emerald-600 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                        >
                          <Check size={11} />
                          Publish review
                        </button>
                      )}

                      <button
                        onClick={() => onDeleteClick(reviewDetails._id)}
                        className="flex items-center justify-center gap-1 px-3 py-2.5 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 rounded-lg font-bold uppercase tracking-wider text-[10px] cursor-pointer"
                      >
                        <Trash2 size={11} />
                        Delete review
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CUSTOMER DETAILS */}
              {activeTab === "Customer Details" && (
                <div className="space-y-4 animate-fade-down">
                  {/* Basic Profile Details */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex justify-between items-center">
                      <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider">Customer Profile Summary</h4>
                      <a 
                        href={`/franchise-admin/customers-list?userId=${reviewDetails.customerId}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[9px] font-bold uppercase tracking-wider text-[var(--primary)] hover:underline flex items-center gap-0.5"
                      >
                        <span>View Customer List Profile</span>
                        <ExternalLink size={9} />
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-y-3 gap-x-4 border-t border-zinc-100 dark:border-zinc-800 pt-3">
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Name</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">{reviewDetails.customer?.fullName || "Guest Customer"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Phone Mobile</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">{reviewDetails.customer?.mobile || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Email</span>
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250 truncate block max-w-full">{reviewDetails.customer?.email || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Customer Type</span>
                        <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">
                          {reviewDetails.customer?.customerType || "Regular"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Spending Analytics */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
                    <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-3">Franchise Loyalty & Spending Analytics</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">Total Orders</span>
                        <div className="text-sm font-extrabold text-zinc-850 dark:text-white mt-0.5">{reviewDetails.customer?.totalOrders || 0}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">Total Spent</span>
                        <div className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5">₹{reviewDetails.customer?.totalSpent || 0}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">Avg Order Value</span>
                        <div className="text-sm font-extrabold text-zinc-850 dark:text-white mt-0.5">₹{reviewDetails.customer?.avgOrderValue || 0}</div>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
                        <span className="text-[8px] font-bold text-zinc-400 uppercase">Loyalty Points</span>
                        <div className="text-sm font-extrabold text-purple-600 dark:text-purple-400 mt-0.5">{reviewDetails.customer?.loyaltyPoints || 0} Points</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: ORDER INFORMATION */}
              {activeTab === "Order Information" && (
                <div className="space-y-4 animate-fade-down">
                  {reviewDetails.order ? (
                    <div className="space-y-4">
                      {/* Order Core Meta */}
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs">
                        <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-3">Order Details</h4>
                        
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-3 gap-x-4">
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Order Number</span>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">{reviewDetails.order.orderNumber}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Date & Time</span>
                            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-250">{formatDateTime(reviewDetails.order.date)}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Order Status</span>
                            <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold bg-green-500/10 text-green-600 border border-green-500/20 uppercase">
                              {reviewDetails.order.orderStatus}
                            </span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Payment Method</span>
                            <span className="text-xs font-bold text-zinc-850 dark:text-zinc-200">{reviewDetails.order.paymentMethod}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Delivery Type</span>
                            <span className="text-xs font-extrabold text-[var(--primary)] uppercase">{reviewDetails.order.deliveryType}</span>
                          </div>
                          <div>
                            <span className="text-[9px] font-bold uppercase text-zinc-400 block mb-0.5">Paid Amount</span>
                            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400">₹{reviewDetails.order.amount}</span>
                          </div>
                        </div>
                      </div>

                      {/* Items table */}
                      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                        <div className="px-4 py-3 border-b border-zinc-150 dark:border-zinc-850">
                          <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider">Ordered Products</h4>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-400 border-b border-zinc-150 dark:border-zinc-850 text-[9px] font-bold uppercase">
                              <tr>
                                <th className="px-4 py-2">Item Name</th>
                                <th className="px-4 py-2 text-center">Qty</th>
                                <th className="px-4 py-2 text-right">Price</th>
                                <th className="px-4 py-2 text-right">Total</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                              {reviewDetails.order.items?.map((item, i) => (
                                <tr key={i} className="text-zinc-750 dark:text-zinc-300">
                                  <td className="px-4 py-2.5 font-bold">{item.name}</td>
                                  <td className="px-4 py-2.5 text-center font-bold">{item.quantity}</td>
                                  <td className="px-4 py-2.5 text-right font-medium">₹{item.price}</td>
                                  <td className="px-4 py-2.5 text-right font-bold">₹{item.price * item.quantity}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <div className="bg-zinc-50/50 dark:bg-zinc-900/50 px-4 py-3 border-t border-zinc-150 dark:border-zinc-800 flex justify-end">
                          <div className="w-48 space-y-1 text-[10px]">
                            {reviewDetails.order.discount > 0 && (
                              <div className="flex justify-between text-rose-500 font-medium">
                                <span>Discount:</span>
                                <span>-₹{reviewDetails.order.discount}</span>
                              </div>
                            )}
                            {reviewDetails.order.taxes > 0 && (
                              <div className="flex justify-between text-zinc-450">
                                <span>GST Taxes:</span>
                                <span>+₹{reviewDetails.order.taxes}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs font-extrabold text-zinc-900 dark:text-white border-t border-zinc-200 dark:border-zinc-800 pt-1">
                              <span>Net Paid:</span>
                              <span>₹{reviewDetails.order.amount}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="h-48 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl flex flex-col items-center justify-center text-zinc-400 p-4 gap-2">
                      <Package size={30} className="stroke-1" />
                      <p className="text-xs font-bold uppercase text-zinc-450">No order details linked</p>
                      <p className="text-[10px] text-zinc-400 text-center max-w-xs leading-normal">
                        This review was submitted directly via general feedback without an order number reference.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: IMAGES */}
              {activeTab === "Images" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-5 shadow-xs animate-fade-down">
                  <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-3">Customer Uploaded Photos</h4>
                  {reviewDetails.images && reviewDetails.images.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                      {reviewDetails.images.map((url, index) => (
                        <div 
                          key={index}
                          className="relative aspect-square border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden group bg-slate-50 dark:bg-zinc-950"
                        >
                          <img src={url} alt={`Evidence ${index}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white gap-2">
                            <button
                              onClick={() => setLightboxImg(url)}
                              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full transition-colors cursor-pointer"
                              title="Zoom"
                            >
                              <ZoomIn size={14} />
                            </button>
                            <a
                              href={url}
                              download={`review_image_${index}.jpg`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full transition-colors cursor-pointer text-white"
                              title="Download"
                            >
                              <Download size={14} />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="h-48 flex flex-col items-center justify-center text-zinc-400 gap-2">
                      <FileText size={30} className="stroke-1" />
                      <p className="text-xs font-bold uppercase text-zinc-450">No images attached</p>
                      <p className="text-[10px] text-zinc-400 text-center max-w-xs leading-normal">
                        No photos were attached to this review by the customer.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PREVIOUS REVIEWS */}
              {activeTab === "Previous Reviews" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs animate-fade-down">
                  <div className="px-4 py-3 border-b border-zinc-150 dark:border-zinc-850">
                    <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider">Other Reviews Submitted By This Customer</h4>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs min-w-[600px]">
                      <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-450 dark:text-zinc-400 border-b border-zinc-150 dark:border-zinc-850 text-[9px] font-bold uppercase">
                        <tr>
                          <th className="px-4 py-2">Date</th>
                          <th className="px-4 py-2">Outlet</th>
                          <th className="px-4 py-2">Rating</th>
                          <th className="px-4 py-2">Review Text</th>
                          <th className="px-4 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                        {reviewDetails.previousReviews?.length > 0 ? (
                          reviewDetails.previousReviews.map((rev) => (
                            <tr key={rev._id} className="text-zinc-700 dark:text-zinc-350 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50">
                              <td className="px-4 py-2.5 font-medium whitespace-nowrap">{formatDateTime(rev.createdAt || rev.date)}</td>
                              <td className="px-4 py-2.5 font-bold">{mockStores.find(s => s.id === rev.storeId)?.name || rev.storeName || "N/A"}</td>
                              <td className="px-4 py-2.5 text-amber-500 font-bold whitespace-nowrap">{rev.rating} ★</td>
                              <td className="px-4 py-2.5 italic max-w-xs truncate">"{rev.reviewText || 'No text review'}"</td>
                              <td className="px-4 py-2.5">
                                <span className={`px-1.5 py-0.2 rounded border text-[8px] font-bold ${getStatusBadgeClass(rev.status)}`}>
                                  {rev.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 italic">No previous reviews found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: ADMIN RESPONSE */}
              {activeTab === "Admin Response" && (
                <div className="space-y-4 animate-fade-down">
                  {reviewDetails.adminReply ? (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-4 shadow-xs space-y-4">
                      
                      <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-xl text-emerald-800 dark:text-emerald-400">
                        <CheckCircle2 size={18} className="shrink-0" />
                        <div>
                          <p className="text-xs font-extrabold uppercase">Review Answered</p>
                          <p className="text-[9px] font-bold mt-0.5 opacity-80">Replied by: {reviewDetails.adminReply.createdBy} | Date: {formatDateTime(reviewDetails.adminReply.date)}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800">
                        <h4 className="text-[10px] font-bold uppercase text-zinc-400 mb-1.5">Official Response message</h4>
                        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg font-medium text-zinc-700 dark:text-zinc-300 text-xs">
                          "{reviewDetails.adminReply.message}"
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => onEditReplyClick(reviewDetails)}
                          className="px-3 py-2 bg-zinc-800 dark:bg-zinc-200 dark:text-zinc-900 text-white rounded-lg hover:opacity-90 font-bold uppercase text-[9px] cursor-pointer"
                        >
                          Edit Reply
                        </button>
                        <button
                          onClick={() => onDeleteReplyClick(reviewDetails._id)}
                          className="px-3 py-2 border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/10 text-rose-600 rounded-lg font-bold uppercase text-[9px] cursor-pointer"
                        >
                          Delete Reply
                        </button>
                      </div>

                    </div>
                  ) : (
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-5 shadow-xs text-center space-y-4">
                      <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mx-auto">
                        <ClipboardList size={24} />
                      </div>
                      <div className="space-y-1.5">
                        <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">Awaiting Official Response</h4>
                        <p className="text-[10px] text-zinc-400 max-w-sm mx-auto leading-normal">
                          This review has not received an admin reply yet. Responding to review boosts customer satisfaction score.
                        </p>
                      </div>

                      <button
                        onClick={() => onReplyClick(reviewDetails)}
                        className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 font-extrabold uppercase rounded-lg shadow-sm text-[10px] cursor-pointer"
                      >
                        Write Reply Now
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 7: ACTIVITY TIMELINE */}
              {activeTab === "Activity Timeline" && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-xl p-5 shadow-xs animate-fade-down">
                  <h4 className="text-[10px] font-extrabold uppercase text-zinc-900 dark:text-white tracking-wider mb-5">Review Audit Trail Logs</h4>
                  
                  {reviewDetails.logs && reviewDetails.logs.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-zinc-150 dark:border-zinc-800 space-y-6 ml-2 text-xs">
                      {reviewDetails.logs.map((log, index) => (
                        <div key={log._id || index} className="relative">
                          {/* Dot marker */}
                          <span className="absolute -left-[31px] top-0.5 bg-white dark:bg-zinc-900 border-2 border-[var(--primary)] rounded-full w-4 h-4 flex items-center justify-center">
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)]" />
                          </span>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                            <span className="font-extrabold text-zinc-850 dark:text-zinc-100 uppercase text-[10px]">
                              {log.action}
                            </span>
                            <span className="text-[9px] text-zinc-400 font-bold">
                              {formatDateTime(log.createdAt)}
                            </span>
                          </div>

                          <p className="text-zinc-550 dark:text-zinc-450 mt-1 text-[10px] leading-relaxed font-medium">
                            Performed by: <strong className="font-extrabold text-zinc-700 dark:text-zinc-300">{log.performedBy}</strong>
                          </p>

                          {(log.oldValue || log.newValue) && (
                            <div className="mt-1.5 flex items-center gap-1.5 text-[9px] bg-zinc-50 dark:bg-zinc-950 px-2 py-1 border border-zinc-150 dark:border-zinc-850 rounded w-fit max-w-full font-bold">
                              {log.oldValue && (
                                <>
                                  <span className="text-rose-500 line-through truncate max-w-[120px]">{log.oldValue}</span>
                                  <ChevronRight size={10} className="text-zinc-400" />
                                </>
                              )}
                              <span className="text-emerald-600 truncate max-w-[200px]">{log.newValue}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-zinc-400 py-6">No lifecycle audit records.</div>
                  )}
                </div>
              )}

            </div>
          ) : (
            <div className="h-64 flex items-center justify-center flex-col text-zinc-400">
              <AlertCircle size={28} className="stroke-1 mb-2" />
              <p className="text-xs font-bold uppercase">No Review Context</p>
            </div>
          )}
        </div>

      </div>

      {/* Lightbox for attachments */}
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/85 transition-opacity" onClick={() => setLightboxImg(null)} />
          <div className="relative max-w-4xl max-h-[85vh] z-10 flex flex-col items-center">
            <button
              onClick={() => setLightboxImg(null)}
              className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
            <img src={lightboxImg} alt="Lightbox Preview" className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl" />
          </div>
        </div>
      )}

    </div>
  );
}
