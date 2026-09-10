import React from "react";
import { Smile, Meh, Frown } from "lucide-react";

export default function SentimentBadge({ sentiment = "" }) {
  const norm = sentiment?.toLowerCase();
  
  if (norm === "positive") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tracking-wider">
        <Smile size={10} />
        <span>Positive</span>
      </span>
    );
  }
  
  if (norm === "negative") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 tracking-wider animate-pulse">
        <Frown size={10} />
        <span>Negative</span>
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tracking-wider">
      <Meh size={10} />
      <span>Neutral</span>
    </span>
  );
}
