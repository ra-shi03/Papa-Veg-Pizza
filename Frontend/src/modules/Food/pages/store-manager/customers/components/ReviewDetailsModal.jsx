import React from "react";
import { X, AlertCircle, RefreshCcw, User, Receipt, Pizza, MessageSquare } from "lucide-react";
import { useReviewDetails } from "../hooks/useReviews";
import { Skeleton } from "@food/components/ui/skeleton";
import RatingStars from "./RatingStars";
import SentimentBadge from "./SentimentBadge";
import ReviewStatusBadge from "./ReviewStatusBadge";
import ReviewImagesGallery from "./ReviewImagesGallery";
import AISentimentCard from "./AISentimentCard";
import SuggestedActionsCard from "./SuggestedActionsCard";
import ManagerReplySection from "./ManagerReplySection";
import { toast } from "sonner";

export default function ReviewDetailsModal({
  visible,
  onClose,
  reviewId,
  onReplyTrigger,
  userRole
}) {
  const { data, isLoading, isError, refetch } = useReviewDetails(visible ? reviewId : null);
  const isReadOnly = userRole === "assistant_manager";

  if (!visible) return null;

  const handleRetry = () => {
    refetch();
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const { review = {}, customer = {}, order = {}, orderItems = [], customerStatistics = {} } = data || {};

  return (
    <div 
      className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                Customer Review File
              </h3>
              {review && (
                <>
                  <RatingStars rating={review.rating} />
                  <SentimentBadge sentiment={review.sentiment} />
                  <ReviewStatusBadge hasReply={!!review.reply} />
                </>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
              Detailed analysis of customer feedback, AI sentiment metrics, order contents, and manager replies.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 space-y-4">
                <Skeleton className="h-32 w-full rounded-3xl" />
                <Skeleton className="h-40 w-full rounded-3xl" />
                <Skeleton className="h-36 w-full rounded-3xl" />
              </div>
              <div className="lg:col-span-5 space-y-4">
                <Skeleton className="h-44 w-full rounded-3xl" />
                <Skeleton className="h-48 w-full rounded-3xl" />
              </div>
            </div>
          ) : isError ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-[var(--primary)] rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">Failed to Load Review Details</h4>
              <p className="text-[10px] text-zinc-400">Please check your network and try again.</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <RefreshCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Review Text, Images, AI Sentiment, Suggestions */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Review Text Box */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-3 text-xs font-semibold">
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    <MessageSquare size={15} className="text-[var(--primary)]" />
                    Customer Feedback Text
                  </h4>
                  <div className="flex justify-between items-center text-[10px] text-zinc-400">
                    <span>REVIEW ID: {review._id}</span>
                    <span>SUBMITTED: {formatDate(review.createdAt)}</span>
                  </div>
                  <p className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-3.5 rounded-2xl text-zinc-750 dark:text-zinc-350 font-bold leading-relaxed text-xs">
                    "{review.reviewText}"
                  </p>
                </div>

                {/* Evidence Image Gallery */}
                <ReviewImagesGallery images={review.images} />

                {/* AI Sentiment Analysis */}
                <AISentimentCard sentiment={review.sentiment} />

                {/* AI Suggested Actions */}
                <SuggestedActionsCard sentiment={review.sentiment} />
              </div>

              {/* Right Column: Customer Info, Order summary, Manager Reply */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Customer Information Card */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    <User size={15} className="text-[var(--primary)]" />
                    Customer Context
                  </h4>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[10px] text-zinc-400 block mb-0.5">Name</span>
                      <span className="text-zinc-900 dark:text-white font-extrabold text-sm">{customer.name || "Unknown"}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-zinc-400 block">Mobile</span>
                        <span className="text-zinc-850 dark:text-zinc-250 font-bold">{customer.mobile || "N/A"}</span>
                      </div>
                      <div>
                        <span className="text-zinc-400 block">Email</span>
                        <span className="text-zinc-850 dark:text-zinc-250 font-bold truncate block max-w-[120px]">{customer.email || "N/A"}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-center pt-2">
                      <div className="bg-white dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                        <span className="text-[8px] text-zinc-450 uppercase block font-extrabold tracking-wider">Orders</span>
                        <span className="text-xs font-black text-zinc-900 dark:text-white">{customerStatistics.totalOrders || 0}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                        <span className="text-[8px] text-zinc-450 uppercase block font-extrabold tracking-wider">Spent</span>
                        <span className="text-xs font-black text-zinc-900 dark:text-white">₹{customerStatistics.totalSpent || 0}</span>
                      </div>
                      <div className="bg-white dark:bg-zinc-900 p-2 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                        <span className="text-[8px] text-zinc-455 uppercase block font-extrabold tracking-wider">Avg Rating</span>
                        <span className="text-xs font-black text-amber-500">{customerStatistics.averageRatingGiven || "0.0"}★</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Connected Order Summary */}
                {order && (
                  <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
                    <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                      <Receipt size={15} className="text-[var(--primary)]" />
                      Order Details
                    </h4>
                    <div className="grid grid-cols-2 gap-2 pb-2.5 border-b border-zinc-100 dark:border-zinc-850">
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Order ID</span>
                        <span className="font-mono text-[10px] font-extrabold text-zinc-800 dark:text-zinc-350">{order.orderNumber}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Total Bill</span>
                        <span className="font-extrabold text-zinc-900 dark:text-white">{formatCurrency(order.totalAmount)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Payment Method</span>
                        <span className="capitalize font-bold text-zinc-700 dark:text-zinc-300">{order.paymentMethod}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 block">Payment Status</span>
                        <span className="uppercase font-extrabold text-zinc-700 dark:text-zinc-300">{order.paymentStatus}</span>
                      </div>
                    </div>

                    {/* Order items table */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-bold text-zinc-400">Items Ordered</label>
                      <div className="space-y-2 max-h-[120px] overflow-y-auto pr-1">
                        {orderItems.map((item) => (
                          <div key={item._id} className="flex justify-between items-center gap-2 bg-white dark:bg-zinc-900 p-2.5 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                            <div>
                              <div className="flex items-center gap-1">
                                <Pizza size={10} className="text-emerald-500 shrink-0" />
                                <span className="font-extrabold text-zinc-850 dark:text-zinc-200">{item.name}</span>
                                <span className="text-zinc-400">x{item.quantity}</span>
                              </div>
                              {item.customizations && (
                                <span className="text-[9px] font-semibold text-zinc-450 italic pl-3.5 block leading-none">{item.customizations}</span>
                              )}
                            </div>
                            <span className="font-bold text-zinc-800 dark:text-zinc-350 shrink-0">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Manager Response */}
                <ManagerReplySection 
                  reply={review.reply} 
                  onReplyTrigger={() => onReplyTrigger(review._id)} 
                  isReadOnly={isReadOnly}
                />

              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850 flex justify-end items-center gap-2">
          <button
            onClick={onClose}
            className="px-4.5 py-2 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
          >
            Close
          </button>
          {review && !review.reply && (
            <button
              onClick={() => {
                if (isReadOnly) {
                  toast.error("Access Denied", {
                    description: "Assistant Manager is in Read-Only mode."
                  });
                } else {
                  onReplyTrigger(review._id);
                }
              }}
              className={`flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm shadow-[var(--primary)]/15 ${
                isReadOnly ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <MessageSquare size={13} />
              <span>Reply to Review</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
