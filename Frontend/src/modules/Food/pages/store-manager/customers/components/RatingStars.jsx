import React from "react";
import { Star } from "lucide-react";

export default function RatingStars({ rating = 0, size = 12 }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          className={`${
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-zinc-200 dark:text-zinc-800 fill-zinc-100 dark:fill-zinc-900"
          }`}
        />
      ))}
    </div>
  );
}
