import React from "react";
import { Sparkles, Phone, Ticket, ArrowLeftRight, HelpCircle, Send } from "lucide-react";
import { toast } from "sonner";

export default function SuggestedActionsCard({ sentiment = "" }) {
  const norm = sentiment?.toLowerCase();

  const handleActionClick = (actionName) => {
    toast.success("AI Recommendation Triggered", {
      description: `Action initiated: ${actionName}`
    });
  };

  const getRecommendations = () => {
    if (norm === "negative") {
      return [
        { name: "Offer Discount Coupon", desc: "Send 20% off coupon code PVP-SORRY20 via SMS", icon: Ticket },
        { name: "Call Customer", desc: "Initiate direct feedback call to resolve complaints", icon: Phone },
        { name: "Issue Refund", desc: "Refund bill amount for missing or cold food", icon: ArrowLeftRight },
        { name: "Replacement Order", desc: "Place a fresh complimentary order for immediate delivery", icon: Send }
      ];
    }
    
    if (norm === "neutral") {
      return [
        { name: "Request Additional Feedback", desc: "Send standard feedback clarification email", icon: HelpCircle },
        { name: "Offer Loyalty Points", desc: "Add 50 goodwill points to customer profile", icon: Ticket }
      ];
    }

    return [
      { name: "Send Thank You Message", desc: "Dispatch official thank you message to diner", icon: Send },
      { name: "Reward Loyalty Points", desc: "Add 30 appreciation loyalty points", icon: Ticket },
      { name: "Highlight Review", desc: "Pin review on store public landing page", icon: Sparkles }
    ];
  };

  const recommendations = getRecommendations();

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <Sparkles size={15} className="text-amber-500" />
        AI Suggested Actions
      </h4>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {recommendations.map((rec, idx) => {
          const Icon = rec.icon;
          return (
            <div 
              key={idx}
              onClick={() => handleActionClick(rec.name)}
              className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 p-3 rounded-2xl hover:border-[var(--primary)] hover:shadow-sm cursor-pointer transition-all duration-200 group flex items-start gap-3"
            >
              <div className="p-2 bg-neutral-50 dark:bg-zinc-800 text-zinc-500 group-hover:text-[var(--primary)] group-hover:bg-[var(--primary)]/5 rounded-xl border border-zinc-100 dark:border-zinc-800 transition-colors">
                <Icon size={14} className="stroke-[2.5]" />
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="font-extrabold text-zinc-900 dark:text-white truncate text-[11px]">
                  {rec.name}
                </h5>
                <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold leading-relaxed mt-0.5">
                  {rec.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
