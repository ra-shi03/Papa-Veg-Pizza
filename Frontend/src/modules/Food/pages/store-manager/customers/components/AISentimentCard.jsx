import React from "react";
import { Sparkles } from "lucide-react";

export default function AISentimentCard({ sentiment = "" }) {
  const norm = sentiment?.toLowerCase();
  
  // Calculate mock confidence score breakdown
  const confidenceScores = {
    positive: norm === "positive" ? 95 : norm === "neutral" ? 15 : 5,
    neutral: norm === "neutral" ? 80 : norm === "positive" ? 4 : 12,
    negative: norm === "negative" ? 92 : norm === "neutral" ? 5 : 3
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <Sparkles size={15} className="text-emerald-500" />
        AI Sentiment Breakdown
      </h4>

      <div className="space-y-3">
        {/* Positive Meter */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-extrabold text-zinc-650 dark:text-zinc-400">Positive Sentiment</span>
            <span className="font-black text-emerald-600 dark:text-emerald-450">{confidenceScores.positive}% Confidence</span>
          </div>
          <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden">
            <div 
              style={{ width: `${confidenceScores.positive}%` }} 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
            />
          </div>
        </div>

        {/* Neutral Meter */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-extrabold text-zinc-650 dark:text-zinc-400">Neutral Sentiment</span>
            <span className="font-black text-amber-600 dark:text-amber-450">{confidenceScores.neutral}% Confidence</span>
          </div>
          <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden">
            <div 
              style={{ width: `${confidenceScores.neutral}%` }} 
              className="h-full bg-amber-500 rounded-full transition-all duration-500" 
            />
          </div>
        </div>

        {/* Negative Meter */}
        <div className="space-y-1">
          <div className="flex justify-between items-center text-[10px]">
            <span className="font-extrabold text-zinc-650 dark:text-zinc-400">Negative Sentiment</span>
            <span className="font-black text-rose-600 dark:text-rose-455">{confidenceScores.negative}% Confidence</span>
          </div>
          <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-850 rounded-full overflow-hidden">
            <div 
              style={{ width: `${confidenceScores.negative}%` }} 
              className="h-full bg-rose-500 rounded-full transition-all duration-500" 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
