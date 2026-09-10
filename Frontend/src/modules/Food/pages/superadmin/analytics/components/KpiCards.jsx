import React from 'react';
import {
  IndianRupee,
  ShoppingBasket,
  TrendingUp,
  Undo,
  Tag,
  Receipt,
  Shield,
  Activity
} from 'lucide-react';
import { Skeleton } from '../../../../components/ui/skeleton';

// Helper for sparklines
const Sparkline = ({ data = [10, 15, 8, 22, 14, 28, 20], stroke, className = "w-full h-4 overflow-visible opacity-60" }) => {
  if (!data || data.length < 2) return null;
  return (
    <svg className={className} viewBox="0 0 100 30" preserveAspectRatio="none">
      <path
        d={`M ${data.map((val, idx) => `${(idx / (data.length - 1)) * 100} ${30 - val}`).join(" L ")}`}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

export default function KpiCards({ stats, loading }) {
  // Format amount to Indian localized format
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)}Cr`;
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const kpis = [
    {
      title: 'Gross Revenue',
      value: formatCurrency(stats?.grossRevenue),
      trend: stats?.grossTrend > 0 ? `+${stats.grossTrend}%` : `${stats?.grossTrend}%`,
      up: (stats?.grossTrend || 0) >= 0,
      icon: IndianRupee,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
      spark: [12, 18, 15, 24, 20, 28, 30]
    },
    {
      title: 'Net Revenue',
      value: formatCurrency(stats?.netRevenue),
      trend: stats?.netTrend > 0 ? `+${stats.netTrend}%` : `${stats?.netTrend}%`,
      up: (stats?.netTrend || 0) >= 0,
      icon: TrendingUp,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
      spark: [10, 14, 18, 16, 22, 25, 28]
    },
    {
      title: 'Total Orders',
      value: stats?.totalOrders?.toLocaleString('en-IN') || '0',
      trend: stats?.ordersTrend > 0 ? `+${stats.ordersTrend}%` : `${stats?.ordersTrend}%`,
      up: (stats?.ordersTrend || 0) >= 0,
      icon: ShoppingBasket,
      color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/20',
      spark: [15, 12, 19, 22, 20, 26, 25]
    },
    {
      title: 'Average Order Value',
      value: `₹${Math.round(stats?.averageOrderValue || 0)}`,
      trend: stats?.aovTrend > 0 ? `+${stats.aovTrend}%` : `${stats?.aovTrend}%`,
      up: (stats?.aovTrend || 0) >= 0,
      icon: Activity,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20',
      spark: [20, 22, 21, 24, 23, 25, 26]
    },
    {
      title: 'Refund Amount',
      value: formatCurrency(stats?.refundAmount),
      trend: stats?.refundsTrend > 0 ? `+${stats.refundsTrend}%` : `${stats?.refundsTrend}%`,
      up: (stats?.refundsTrend || 0) < 0, // refunds decreasing is positive
      icon: Undo,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20',
      spark: [15, 18, 12, 10, 8, 9, 7]
    },
    {
      title: 'Total Discounts',
      value: formatCurrency(stats?.discountAmount),
      trend: stats?.discountsTrend > 0 ? `+${stats.discountsTrend}%` : `${stats?.discountsTrend}%`,
      up: (stats?.discountsTrend || 0) <= 0,
      icon: Tag,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20',
      spark: [8, 12, 15, 14, 18, 16, 17]
    },
    {
      title: 'GST Collection',
      value: formatCurrency(stats?.gstCollected),
      trend: stats?.gstTrend > 0 ? `+${stats.gstTrend}%` : `${stats?.gstTrend}%`,
      up: (stats?.gstTrend || 0) >= 0,
      icon: Receipt,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/20',
      spark: [10, 11, 14, 13, 16, 18, 19]
    },
    {
      title: 'Platform Profit',
      value: formatCurrency(stats?.platformProfit),
      trend: stats?.profitTrend > 0 ? `+${stats.profitTrend}%` : `${stats?.profitTrend}%`,
      up: (stats?.profitTrend || 0) >= 0,
      icon: Shield,
      color: 'text-indigo-600 bg-indigo-50 dark:bg-indigo-950/20',
      spark: [12, 16, 14, 20, 18, 25, 27]
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl shadow-sm space-y-2">
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((kpi, idx) => {
        const Icon = kpi.icon;
        return (
          <div
            key={idx}
            className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl flex items-center justify-between hover:scale-[1.01] transition-transform duration-300 shadow-sm cursor-default"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest truncate">
                {kpi.title}
              </span>
              <span className="text-base font-black text-black dark:text-white mt-0.5">
                {kpi.value}
              </span>
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                <span
                  className={`text-[8px] font-extrabold px-1.5 py-0.2 rounded-full ${
                    kpi.up
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20'
                      : 'text-rose-600 bg-rose-50 dark:bg-rose-950/20'
                  }`}
                >
                  {kpi.trend}
                </span>
                <span className="text-[8px] text-zinc-400 font-semibold uppercase tracking-wider">vs prev</span>
              </div>
              <div className="w-16 mt-1.5">
                <Sparkline data={kpi.spark} stroke={kpi.up ? 'var(--primary, #a43c12)' : '#ef4444'} />
              </div>
            </div>

            <div className={`p-2 rounded-lg border border-zinc-100 dark:border-zinc-800 shrink-0 ${kpi.color}`}>
              <Icon size={16} className="stroke-[2.2]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
