import React from "react";
import { Card, CardContent } from "@food/components/ui/card";
import { Skeleton } from "@food/components/ui/skeleton";
import { 
  AlertTriangle, 
  Flame, 
  CheckCircle2, 
  Boxes 
} from "lucide-react";

export function AlertsDashboardCards({ data, isLoading }) {
  const cardsConfig = [
    {
      title: "Active Alerts",
      value: data?.activeAlerts !== undefined ? `${data.activeAlerts}` : "0",
      icon: AlertTriangle,
      color: "text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30",
      description: "Ingredients below minimum stock"
    },
    {
      title: "Critical Alerts",
      value: data?.criticalAlerts !== undefined ? `${data.criticalAlerts}` : "0",
      icon: Flame,
      color: "text-rose-500 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 animate-pulse",
      description: "Severe inventory depletion (<40%)"
    },
    {
      title: "Resolved Alerts",
      value: data?.resolvedAlerts !== undefined ? `${data.resolvedAlerts}` : "0",
      icon: CheckCircle2,
      color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/30",
      description: "Replenished or cleared items"
    },
    {
      title: "Affected Ingredients",
      value: data?.ingredientsAffected !== undefined ? `${data.ingredientsAffected}` : "0",
      icon: Boxes,
      color: "text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-900/30",
      description: "Unique inventory lines affected"
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
                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-505 uppercase tracking-widest leading-none truncate max-w-[80%]">
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
