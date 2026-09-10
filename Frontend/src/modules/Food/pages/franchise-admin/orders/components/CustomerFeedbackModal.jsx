import React from "react";
import { X, MessageSquare, Star, Smile, Meh, Frown, ThumbsUp, ShieldAlert, Award } from "lucide-react";
import { format } from "date-fns";
import { useOrderReview, useOrderDetails } from "../ordersQuery";

export default function CustomerFeedbackModal({ isOpen, onClose, orderId }) {
  const { data: review, isLoading: isReviewLoading } = useOrderReview(orderId);
  const { data: order, isLoading: isOrderLoading } = useOrderDetails(orderId);

  if (!isOpen) return null;

  const isLoading = isReviewLoading || isOrderLoading;

  const renderStars = (rating) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            size={16}
            className={star <= rating ? "fill-amber-450 text-amber-450" : "text-zinc-200 dark:text-zinc-700"}
          />
        ))}
      </div>
    );
  };

  const getSentimentBadge = (sentiment) => {
    switch (sentiment?.toLowerCase()) {
      case "positive":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
            <Smile size={13} />
            Positive Sentiment
          </span>
        );
      case "neutral":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-450 border border-amber-100 dark:border-amber-900/30">
            <Meh size={13} />
            Neutral Sentiment
          </span>
        );
      case "negative":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-450 border border-rose-100 dark:border-rose-900/30">
            <Frown size={13} />
            Negative Sentiment
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Modal Container */}
      <div className="relative w-full max-w-[700px] bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden animate-scale-up flex flex-col">
        {/* Header */}
        <header className="p-5 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <MessageSquare size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-50">
                Customer Feedback Detail
              </h3>
              <p className="text-xs text-zinc-500 font-medium">
                Detailed customer review and operations score audit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 hover:text-zinc-650 transition-colors"
          >
            <X size={18} />
          </button>
        </header>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center space-y-3 py-16">
              <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-semibold text-zinc-500">Retrieving feedback logs...</p>
            </div>
          ) : !review ? (
            <div className="h-full flex flex-col items-center justify-center py-16 text-center space-y-2">
              <ShieldAlert size={28} className="text-zinc-400" />
              <p className="text-sm font-bold text-zinc-650 dark:text-zinc-400">No Review Left</p>
              <p className="text-xs text-zinc-400">This customer has not submitted a rating or comment for this order yet.</p>
            </div>
          ) : (
            <>
              {/* Reviewer Overview Card */}
              <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150/60 dark:border-zinc-850 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={order?.customer?.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                    alt={order?.customer?.name}
                    className="w-12 h-12 object-cover rounded-full border border-zinc-200"
                    onError={(e) => {
                      e.target.src = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100";
                    }}
                  />
                  <div>
                    <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200">
                      {order?.customer?.name || "Anonymous Customer"}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                      Order: {order?.orderNumber} ({order?.store?.name})
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  {getSentimentBadge(review.sentiment)}
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Posted: {review.createdAt ? format(new Date(review.createdAt), "dd MMM yyyy, hh:mm a") : "N/A"}
                  </p>
                </div>
              </div>

              {/* Review Comment Box */}
              <div className="space-y-2">
                <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Review Comment</h5>
                <div className="p-4 bg-amber-50/20 dark:bg-zinc-900 border border-amber-100/50 dark:border-zinc-800 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    {renderStars(review.rating)}
                    <span className="text-xs font-bold text-amber-500">({review.rating}.0 / 5.0)</span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium italic leading-relaxed">
                    "{review.review || "No written review text provided, customer gave star rating only."}"
                  </p>
                </div>
              </div>

              {/* Satisfaction Metrics */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Operations Satisfaction Breakdown</h5>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Food Quality */}
                  <div className="p-3 border border-zinc-100 dark:border-zinc-850 rounded-xl bg-zinc-50/20 dark:bg-zinc-900/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Food Quality</span>
                      <span className="text-xs font-black text-amber-500">{review.metrics?.foodQuality || review.rating} / 5</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-450 h-full rounded-full" 
                        style={{ width: `${((review.metrics?.foodQuality || review.rating) / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Packaging */}
                  <div className="p-3 border border-zinc-100 dark:border-zinc-850 rounded-xl bg-zinc-50/20 dark:bg-zinc-900/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Packaging Quality</span>
                      <span className="text-xs font-black text-amber-500">{review.metrics?.packaging || review.rating} / 5</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-450 h-full rounded-full" 
                        style={{ width: `${((review.metrics?.packaging || review.rating) / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Delivery Experience */}
                  <div className="p-3 border border-zinc-100 dark:border-zinc-850 rounded-xl bg-zinc-50/20 dark:bg-zinc-900/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Delivery Speed & Manners</span>
                      <span className="text-xs font-black text-amber-500">{review.metrics?.deliveryExperience || review.rating} / 5</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-450 h-full rounded-full" 
                        style={{ width: `${((review.metrics?.deliveryExperience || review.rating) / 5) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Overall Satisfaction */}
                  <div className="p-3 border border-zinc-100 dark:border-zinc-850 rounded-xl bg-zinc-50/20 dark:bg-zinc-900/10">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Overall Satisfaction</span>
                      <span className="text-xs font-black text-amber-500">{review.metrics?.overallSatisfaction || review.rating} / 5</span>
                    </div>
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-amber-450 h-full rounded-full" 
                        style={{ width: `${((review.metrics?.overallSatisfaction || review.rating) / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Note */}
              <div className="p-3 bg-blue-50/20 dark:bg-blue-950/10 border border-blue-100/50 dark:border-blue-900/20 rounded-xl flex items-start gap-2">
                <Award size={16} className="text-blue-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-zinc-500 dark:text-zinc-450 font-medium leading-normal">
                  Admins can use customer sentiment triggers to launch instant discount campaigns or automatically prompt support responses for low-rated orders.
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end shrink-0 gap-2">
          {review?.rating <= 3 && (
            <button
              onClick={() => {
                onClose();
                // Simple feedback trigger demo
                alert(`Direct ticket initiated to support agent regarding Order ${order?.orderNumber}.`);
              }}
              className="px-4 py-2 bg-zinc-105 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 hover:bg-zinc-150 text-zinc-750 dark:text-zinc-200 rounded-xl text-xs font-bold transition-colors active:scale-95"
            >
              Raise Support Ticket
            </button>
          )}
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-900 dark:bg-zinc-800 hover:bg-zinc-850 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors active:scale-95"
          >
            Acknowledge Review
          </button>
        </footer>
      </div>
    </div>
  );
}
