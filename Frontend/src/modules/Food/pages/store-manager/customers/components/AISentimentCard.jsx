import React from "react";
import { Sparkles } from "lucide-react";

const TONES = {
  positive: { label: "Positive", range: "4 or 5 stars", bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", width: "w-full" },
  neutral: { label: "Neutral", range: "3 stars", bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400", width: "w-2/3" },
  negative: { label: "Negative", range: "1 or 2 stars", bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", width: "w-1/3" },
};

/** The review's sentiment, which follows its star rating (4-5 positive, 3 neutral, 1-2 negative). */
export default function AISentimentCard({ sentiment = "" }) {
  const tone = TONES[String(sentiment || "").toLowerCase()];

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-3 text-left">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-800 pb-2">
        <Sparkles size={15} className="text-emerald-500" />
        Sentiment
      </h4>
      {tone ? (
        <>
          <div className="flex items-center justify-between text-xs font-bold">
            <span className={tone.text}>{tone.label}</span>
            <span className="text-slate-400 dark:text-zinc-500">{tone.range}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
            <div className={`h-full rounded-full ${tone.bar} ${tone.width}`} />
          </div>
          <p className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 leading-snug">Worked out from the star rating the customer gave.</p>
        </>
      ) : (
        <p className="text-xs font-semibold text-slate-400 dark:text-zinc-500">No sentiment for this review.</p>
      )}
    </div>
  );
}
