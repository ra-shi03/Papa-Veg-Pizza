import React from "react";
import { FolderOpen, CheckCircle, Star, GitMerge } from "lucide-react";

export default function CategoryStatsCards({ categoriesList, isLoading }) {
  // Compute metrics
  const total = categoriesList?.length || 0;
  const active = categoriesList?.filter((c) => c.status === "ACTIVE").length || 0;
  const featured = categoriesList?.filter((c) => c.isFeatured).length || 0;
  const subcategories = categoriesList?.filter((c) => !!c.parentCategory).length || 0;

  const cardConfig = [
    {
      title: "Total Categories",
      value: total,
      icon: FolderOpen,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      border: "border-blue-100 dark:border-blue-900/30"
    },
    {
      title: "Active Categories",
      value: active,
      icon: CheckCircle,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "border-emerald-100 dark:border-emerald-900/30"
    },
    {
      title: "Featured Categories",
      value: featured,
      icon: Star,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      border: "border-purple-100 dark:border-purple-900/30"
    },
    {
      title: "Subcategories",
      value: subcategories,
      icon: GitMerge,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      border: "border-orange-100 dark:border-orange-900/30"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-between animate-pulse"
          >
            <div className="space-y-2">
              <div className="h-3.5 w-24 bg-zinc-200 dark:bg-zinc-850 rounded" />
              <div className="h-6 w-12 bg-zinc-350 dark:bg-zinc-800 rounded" />
            </div>
            <div className="w-10 h-10 rounded-full bg-zinc-200 dark:bg-zinc-850" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cardConfig.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`p-4 bg-white dark:bg-zinc-900 border ${card.border} rounded-2xl flex items-center justify-between shadow-sm transition-all hover:translate-y-[-2px]`}
          >
            <div className="space-y-1">
              <p className="text-[10px] text-zinc-400 font-extrabold uppercase tracking-wider">{card.title}</p>
              <p className="text-xl lg:text-2xl font-black text-zinc-900 dark:text-white leading-tight">
                {card.value}
              </p>
            </div>
            <div className={`p-2.5 rounded-xl ${card.bg} ${card.color} flex items-center justify-center shrink-0`}>
              <IconComponent size={20} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
