import React from 'react';
import {
  Users,
  Activity,
  UserPlus,
  RefreshCw,
  Heart,
  IndianRupee,
  TrendingUp,
  AlertTriangle
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

export default function CustomerKpiCards({ stats, loading }) {
  // Format currency
  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const kpis = [
    {
      title: 'Total Customers',
      value: stats?.totalCustomers?.toLocaleString('en-IN') || '0',
      trend: stats?.totalTrend > 0 ? `+${stats.totalTrend}%` : `${stats?.totalTrend || 0}%`,
      up: (stats?.totalTrend || 0) >= 0,
      icon: Users,
      color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20',
      spark: [12, 14, 18, 17, 22, 24, 28]
    },
    {
      title: 'Active Customers',
      value: stats?.activeCustomers?.toLocaleString('en-IN') || '0',
      trend: stats?.activeTrend > 0 ? `+${stats.activeTrend}%` : `${stats?.activeTrend || 0}%`,
      up: (stats?.activeTrend || 0) >= 0,
      icon: Activity,
      color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20',
      spark: [15, 18, 16, 20, 22, 21, 25]
    },
    {
      title: 'New Customers',
      value: stats?.newCustomers?.toLocaleString('en-IN') || '0',
      trend: stats?.newTrend > 0 ? `+${stats.newTrend}%` : `${stats?.newTrend || 0}%`,
      up: (stats?.newTrend || 0) >= 0,
      icon: UserPlus,
      color: 'text-violet-600 bg-violet-50 dark:bg-violet-950/20',
      spark: [8, 12, 14, 13, 19, 21, 24]
    },
    {
      title: 'Returning Customers',
      value: stats?.returningCustomers?.toLocaleString('en-IN') || '0',
      trend: stats?.returningTrend > 0 ? `+${stats.returningTrend}%` : `${stats?.returningTrend || 0}%`,
      up: (stats?.returningTrend || 0) >= 0,
      icon: RefreshCw,
      color: 'text-orange-600 bg-orange-50 dark:bg-orange-950/20',
      spark: [20, 18, 22, 24, 25, 23, 26]
    },
    {
      title: 'Retention Rate',
      value: `${stats?.retentionRate || 0}%`,
      trend: stats?.retentionTrend > 0 ? `+${stats.retentionTrend}%` : `${stats?.retentionTrend || 0}%`,
      up: (stats?.retentionTrend || 0) >= 0,
      icon: Heart,
      color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/20',
      spark: [28, 27, 28, 29, 30, 29, 31]
    },
    {
      title: 'Average Spend',
      value: formatCurrency(stats?.averageSpend),
      trend: stats?.spendTrend > 0 ? `+${stats.spendTrend}%` : `${stats?.spendTrend || 0}%`,
      up: (stats?.spendTrend || 0) >= 0,
      icon: IndianRupee,
      color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20',
      spark: [10, 12, 14, 15, 18, 16, 19]
    },
    {
      title: 'Lifetime Value (LTV)',
      value: formatCurrency(stats?.lifetimeValue),
      trend: stats?.ltvTrend > 0 ? `+${stats.ltvTrend}%` : `${stats?.ltvTrend || 0}%`,
      up: (stats?.ltvTrend || 0) >= 0,
      icon: TrendingUp,
      color: 'text-sky-600 bg-sky-50 dark:bg-sky-950/20',
      spark: [12, 15, 18, 19, 22, 25, 28]
    },
    {
      title: 'Churn Rate',
      value: `${stats?.churnRate || 0}%`,
      trend: stats?.churnTrend < 0 ? `${stats.churnTrend}%` : stats?.churnTrend > 0 ? `+${stats.churnTrend}%` : '0%',
      up: (stats?.churnTrend || 0) <= 0, // Lower churn is positive (up = green indicator)
      icon: AlertTriangle,
      color: 'text-pink-600 bg-pink-50 dark:bg-pink-950/20',
      spark: [18, 16, 15, 14, 12, 13, 11]
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, idx) => (
          <div key={idx} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm space-y-2">
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
