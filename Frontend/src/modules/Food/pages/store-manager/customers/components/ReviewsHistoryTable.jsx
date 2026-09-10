import React from "react";
import { Star } from "lucide-react";

export default function ReviewsHistoryTable({ reviews = [] }) {
  if (reviews.length === 0) {
    return (
      <div className="py-8 text-center text-zinc-400 dark:text-zinc-650 text-xs font-semibold">
        No reviews posted by this customer yet.
      </div>
    );
  }

  return (
    <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
      <table className="w-full text-left text-xs font-semibold">
        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
          <tr>
            <th className="px-4 py-2.5">Rating</th>
            <th className="px-4 py-2.5">Comment</th>
            <th className="px-4 py-2.5">Product Ordered</th>
            <th className="px-4 py-2.5">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
          {reviews.map((rev) => (
            <tr key={rev._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
              <td className="px-4 py-2.5">
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={11}
                      className={
                        i < rev.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-zinc-200 dark:text-zinc-800"
                      }
                    />
                  ))}
                </div>
              </td>
              <td className="px-4 py-2.5 text-zinc-850 dark:text-zinc-200 font-bold max-w-[250px] truncate" title={rev.comment}>
                "{rev.comment}"
              </td>
              <td className="px-4 py-2.5 text-[var(--primary)] font-bold">
                {rev.productName}
              </td>
              <td className="px-4 py-2.5 text-zinc-450 dark:text-zinc-500 font-bold">
                {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric"
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
