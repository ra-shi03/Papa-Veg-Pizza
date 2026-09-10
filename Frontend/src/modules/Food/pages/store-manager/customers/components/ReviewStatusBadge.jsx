import React from "react";
import { CheckCircle2, AlertCircle } from "lucide-react";

export default function ReviewStatusBadge({ hasReply = false }) {
  if (hasReply) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 tracking-wider">
        <CheckCircle2 size={10} />
        <span>Replied</span>
      </span>
    );
  }
  
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 tracking-wider">
      <AlertCircle size={10} />
      <span>Pending Reply</span>
    </span>
  );
}
