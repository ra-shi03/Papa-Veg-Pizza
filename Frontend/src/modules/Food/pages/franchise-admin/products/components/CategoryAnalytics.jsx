import React from "react";
import { TrendingUp, DollarSign, Package, Star } from "lucide-react";

export default function CategoryAnalytics({ categoriesList = [], isLoading }) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="h-28 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-4" />
        ))}
      </div>
    );
  }

  // Calculate statistics (simulated from listing)
  const getStats = () => {
    if (categoriesList.length === 0) return null;

    // Simulate sales and revenue based on category type
    const mapped = categoriesList.map((c) => {
      let sales = 150;
      let revenue = 35000;
      const idStr = String(c._id || c.id || "").toLowerCase();
      if (idStr.includes("pizza")) {
        sales = 480;
        revenue = 119000;
      } else if (idStr.includes("sides")) {
        sales = 320;
        revenue = 47000;
      } else if (idStr.includes("dessert")) {
        sales = 210;
        revenue = 20790;
      } else if (idStr.includes("drinks")) {
        sales = 90;
        revenue = 4500;
      }

      return {
        ...c,
        sales,
        revenue
      };
    });

    const topSelling = [...mapped].sort((a, b) => b.sales - a.sales)[0];
    const topRevenue = [...mapped].sort((a, b) => b.revenue - a.revenue)[0];
    const mostProducts = [...mapped].sort((a, b) => b.productsCount - a.productsCount)[0];
    const featuredCount = categoriesList.filter((c) => c.isFeatured).length;

    return {
      topSelling,
      topRevenue,
      mostProducts,
      featuredCount
    };
  };

  const stats = getStats();
  if (!stats) return null;

  const data = [
    {
      title: "Top Selling Category",
      name: stats.topSelling.name,
      value: `${stats.topSelling.sales} Units`,
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      chart: [20, 35, 25, 45, 55, 60, 80] // svg line path points
    },
    {
      title: "Highest Revenue Category",
      name: stats.topRevenue.name,
      value: `₹${stats.topRevenue.revenue.toLocaleString("en-IN")}`,
      icon: DollarSign,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
      chart: [30, 45, 40, 60, 50, 75, 90]
    },
    {
      title: "Most Products",
      name: stats.mostProducts.name,
      value: `${stats.mostProducts.productsCount} Products`,
      icon: Package,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
      chart: [15, 20, 25, 22, 35, 30, 45]
    },
    {
      title: "Featured Distribution",
      name: "Featured Categories",
      value: `${stats.featuredCount} Active`,
      icon: Star,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
      chart: [10, 15, 12, 18, 22, 20, 30]
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {data.map((item, idx) => {
        const IconComponent = item.icon;
        // Generate simple sparkline SVG path
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
