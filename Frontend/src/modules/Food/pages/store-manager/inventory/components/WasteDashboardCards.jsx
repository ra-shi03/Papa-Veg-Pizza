import React from "react";
import { Card, CardContent } from "@food/components/ui/card";
import { Skeleton } from "@food/components/ui/skeleton";
import { 
  Trash2, 
  Calendar, 
  TrendingDown, 
  AlertTriangle 
} from "lucide-react";

export function WasteDashboardCards({ data, isLoading }) {
  
  // Format currency helper
  const formatRupee = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(value);
  };

  const cardsConfig = [
    {
      title: "Total Waste Today",
      value: data?.totalWasteToday !== undefined ? `${data.totalWasteToday} units` : "0 units",
      icon: Trash2,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30",
      description: "Spoilage logs tracked today"
    },
    {
      title: "Weekly Waste",
      value: data?.weeklyWaste !== undefined ? `${data.weeklyWaste} units` : "0 units",
      icon: Calendar,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
      description: "Past 7 days volume sum"
    },
    {
      title: "Estimated Loss Amount",
      value: data?.lossAmount ? formatRupee(data.lossAmount) : "₹0",
      icon: TrendingDown,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30",
      description: "Wastage valued at cost price"
    },
    {
      title: "Top Wasted Ingredient",
      value: data?.topWastedIngredient || "None",
      icon: AlertTriangle,
      color: "text-[var(--primary)] bg-[var(--primary)]/10 border-[var(--primary)]/20",
      description: "Highest waste category contributor"
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((n) => (
          <Card key={n} className="rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <Skeleton className="h-2.5 w-16 bg-slate-100 dark:bg-zinc-800" />
                <Skeleton className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-zinc-800" />
              </div>
              <Skeleton className="h-5 w-12 bg-slate-100 dark:bg-zinc-800" />
              <Skeleton className="h-2.5 w-24 bg-slate-100 dark:bg-zinc-800" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
      {cardsConfig.map((card, idx) => {
        const IconComponent = card.icon;
        
        return (
          <Card 
            key={idx} 
            className="rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-300 hover:shadow-md"
          >
            <CardContent className="p-3 flex flex-col justify-between h-full min-h-[85px]">
              <div className="flex items-start justify-between gap-1.5">
                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest leading-none truncate max-w-[80%]">
                  {card.title}
                </span>
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center border flex-shrink-0 ${card.color}`}>
                  <IconComponent size={13} />
                </div>
              </div>
              
              <div className="mt-2">
                <h3 className="text-lg font-black text-slate-800 dark:text-white tracking-tight leading-none truncate" title={card.value}>
                  {card.value}
                </h3>
                <p className="text-[9px] text-zinc-400 mt-1 font-semibold leading-none truncate" title={card.description}>
                  {card.description}
                </p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
