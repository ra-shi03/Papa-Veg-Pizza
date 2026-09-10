import React from "react";
import { TrendingUp, DollarSign, Library, ShieldAlert } from "lucide-react";

export default function AddonAnalytics({ addonsList = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-28 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4" />
        ))}
      </div>
    );
  }

  // Calculate statistics from the list
  const getStats = () => {
    if (addonsList.length === 0) return null;

    // Simulate sales and revenue based on item type and price
    const mapped = addonsList.map((a) => {
      let salesCount = (a.assignedCount || 0) * 12 + 5;
      if (a._id === "add-1") salesCount = 145; // Cheese
      if (a._id === "add-2") salesCount = 88;  // Paneer
      if (a._id === "add-3") salesCount = 65;  // Jalapeno

      const revenue = salesCount * a.price;

      return {
        ...a,
        salesCount,
        revenue
      };
    });

    const mostUsed = [...mapped].sort((a, b) => b.salesCount - a.salesCount)[0];
    const highestRevenue = [...mapped].sort((a, b) => b.revenue - a.revenue)[0];
    const mostAssigned = [...addonsList].sort((a, b) => (b.assignedCount || 0) - (a.assignedCount || 0))[0];
    const outOfStockCount = addonsList.filter((a) => a.status === "OUT_OF_STOCK" || a.stockStatus === "OUT OF STOCK").length;

    return {
      mostUsed,
      highestRevenue,
      mostAssigned,
      outOfStockCount
    };
  };

  const stats = getStats();
  if (!stats) return null;

  const analyticsData = [
    {
      title: "Most Used Add-on",
      name: stats.mostUsed ? stats.mostUsed.name : "Extra Cheese",
      value: stats.mostUsed ? `${stats.mostUsed.salesCount} Orders` : "0 Orders",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      chart: [20, 45, 30, 60, 50, 75, 95]
    },
    {
      title: "Highest Revenue Add-on",
      name: stats.highestRevenue ? stats.highestRevenue.name : "Extra Cheese",
      value: stats.highestRevenue ? `₹${stats.highestRevenue.revenue.toLocaleString("en-IN")}` : "₹0",
      icon: DollarSign,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      chart: [30, 25, 45, 40, 60, 70, 90]
    },
    {
      title: "Most Assigned Add-on",
      name: stats.mostAssigned ? stats.mostAssigned.name : "Paneer Cubes",
      value: stats.mostAssigned ? `${stats.mostAssigned.assignedCount || 0} Products` : "0 Products",
      icon: Library,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      chart: [15, 20, 25, 22, 35, 30, 45]
    },
    {
      title: "Alert: Stock Deficiency",
      name: "Out of Stock Add-ons",
      value: `${stats.outOfStockCount} Items`,
      icon: ShieldAlert,
      color: stats.outOfStockCount > 0 ? "text-red-500" : "text-zinc-400",
      bg: stats.outOfStockCount > 0 ? "bg-red-500/10" : "bg-zinc-100 dark:bg-zinc-900",
      chart: stats.outOfStockCount > 0 ? [50, 45, 55, 60, 65, 80, 90] : [10, 10, 10, 10, 10, 10, 10]
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-semibold text-zinc-700 dark:text-zinc-350">
      {analyticsData.map((item, idx) => {
        const IconComponent = item.icon;
        const points = item.chart.map((val, index) => `${index * 12},${40 - val * 0.3}`).join(" ");

        return (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col justify-between h-28 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <p className="text-[9.5px] text-zinc-400 font-extrabold uppercase tracking-wider">{item.title}</p>
                <p className="font-extrabold text-[11px] text-zinc-800 dark:text-zinc-200 truncate max-w-[130px]">
                  {item.name}
                </p>
              </div>
              <div className={`p-1.5 rounded-lg ${item.bg} ${item.color}`}>
                <IconComponent size={14} />
              </div>
            </div>

            <div className="flex items-end justify-between pt-2">
              <span className="text-sm font-black text-zinc-900 dark:text-white leading-none">
                {item.value}
              </span>
              
              {/* Sparkline chart */}
              <div className="w-20 h-8 shrink-0">
                <svg className="w-full h-full overflow-visible" viewBox="0 0 72 40">
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={item.color}
                    points={points}
                  />
                </svg>
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}
