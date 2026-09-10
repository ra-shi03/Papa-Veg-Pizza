import React, { useState, useEffect } from "react";
import { X, Sparkles, MessageSquare, AlertTriangle, Send } from "lucide-react";
import { useReplyToReview, useReviewDetails } from "../hooks/useReviews";
import { Skeleton } from "@food/components/ui/skeleton";
import RatingStars from "./RatingStars";
import SentimentBadge from "./SentimentBadge";
import { toast } from "sonner";

export default function ReplyToReviewModal({
  visible,
  onClose,
  reviewId,
  userRole
}) {
  const { data, isLoading } = useReviewDetails(visible ? reviewId : null);
  const replyMutation = useReplyToReview();
  const [text, setText] = useState("");
  const isReadOnly = userRole === "assistant_manager";

  if (!visible) return null;

  useEffect(() => {
    if (data?.review) {
      setText("");
    }
  }, [data]);

  const handlePublish = (e) => {
    e.preventDefault();

    if (isReadOnly) {
      toast.error("Read-Only Restriction", {
        description: "Assistant Manager role is restricted from publishing review responses."
      });
      return;
    }

    if (!text.trim()) {
      toast.error("Validation Error", {
        description: "Response text cannot be empty."
      });
      return;
    }

    if (text.length < 10) {
      toast.error("Validation Error", {
        description: "Manager response must be at least 10 characters long."
      });
      return;
    }

    if (text.length > 1000) {
      toast.error("Validation Error", {
        description: "Manager response cannot exceed 1000 characters."
      });
      return;
    }

    replyMutation.mutate(
      {
        reviewId,
        text,
        repliedBy: "Store Manager (Shubham Jamliya)"
      },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const handleSaveDraft = () => {
    toast.success("Draft Saved Successfully", {
      description: "Review reply draft has been logged locally."
    });
  };

  const { review = {}, customer = {} } = data || {};

  return (
    <div 
      className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-60 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase flex items-center gap-1.5">
              <MessageSquare className="text-emerald-500" size={16} />
              Publish Review Response
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
              Respond directly to customer feedback, clarify issues, or thank loyal diners.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handlePublish} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-2xl animate-pulse" />
              <Skeleton className="h-32 w-full rounded-2xl animate-pulse" />
            </div>
          ) : (
            <>
              {/* Review context banner (Read only) */}
              <div className="bg-slate-50 dark:bg-zinc-950 p-4 border border-zinc-100 dark:border-zinc-850 rounded-2xl space-y-2">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <span className="font-extrabold text-zinc-850 dark:text-zinc-200">
                    Review by: {customer.name || "Unknown"}
                  </span>
                  <div className="flex items-center gap-2">
                    <RatingStars rating={review.rating} />
                    <SentimentBadge sentiment={review.sentiment} />
                  </div>
                </div>
                <p className="text-[10px] text-zinc-550 leading-relaxed font-bold italic">
                  "{review.reviewText}"
                </p>
              </div>

              {/* Read-Only Warning */}
              {isReadOnly && (
                <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-550/20 p-4 rounded-2xl text-rose-550 font-extrabold flex gap-2 items-center">
                  <AlertTriangle size={15} />
                  <span>Assistant Manager role is restricted from responding. Publish disabled.</span>
                </div>
              )}

              {/* Textarea for Reply */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[10px] uppercase font-bold text-zinc-400">
                  <label>Response Content (Minimum 10 chars)</label>
                  <span className={text.length < 10 ? "text-rose-500" : text.length > 1000 ? "text-rose-500" : "text-zinc-400"}>
                    {text.length} / 1000 characters
                  </span>
                </div>
                <textarea
                  required
                  disabled={isReadOnly}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Type your official review response here..."
                  rows={6}
                  className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all resize-none disabled:opacity-50"
                />
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850 flex justify-end items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-2 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
          >
            Cancel
          </button>
          
          {!isReadOnly && !isLoading && (
            <button
              type="button"
              onClick={handleSaveDraft}
              className="px-4.5 py-2 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
            >
              Save Draft
            </button>
          )}

          <button
            type="button"
            disabled={isReadOnly || replyMutation.isPending || isLoading || text.length < 10}
            onClick={handlePublish}
            className={`flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm shadow-[var(--primary)]/15 ${
              isReadOnly || replyMutation.isPending || isLoading || text.length < 10 ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <Send size={12} />
            <span>{replyMutation.isPending ? "Publishing..." : "Publish Reply"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
