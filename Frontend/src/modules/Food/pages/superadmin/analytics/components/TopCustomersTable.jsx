import React from 'react';
import { Eye, Award } from 'lucide-react';
import { Skeleton } from '../../../../components/ui/skeleton';

export default function TopCustomersTable({ data, loading, onViewDetails }) {
  const getTierColor = (tier) => {
    switch (tier?.toLowerCase()) {
      case 'platinum':
        return 'text-sky-600 bg-sky-50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-800';
      case 'gold':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-255 dark:border-yellow-800';
      case 'silver':
        return 'text-slate-600 bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800';
      default:
        return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800';
    }
  };

  const getRankBadge = (idx) => {
    switch (idx) {
      case 0:
        return 'bg-yellow-500 text-white ring-2 ring-yellow-200 dark:ring-yellow-900';
      case 1:
        return 'bg-zinc-400 text-white ring-2 ring-zinc-200 dark:ring-zinc-800';
      case 2:
        return 'bg-amber-600 text-white ring-2 ring-amber-250 dark:ring-amber-900';
      default:
        return 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-450';
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm space-y-3">
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-6 w-16" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm">
      <div className="flex items-center justify-between mb-4 border-b border-zinc-150 dark:border-zinc-850 pb-2">
        <div>
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Award size={14} className="text-amber-500" />
            Top Spenders (VIP Leaders)
          </h3>
          <p className="text-[9px] text-zinc-400 font-semibold mt-0.5">Top 5 loyalty members by total wallet contribution</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800/80 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
              <th className="py-2.5 px-2 text-center w-12">Rank</th>
              <th className="py-2.5 px-2">Customer Details</th>
              <th className="py-2.5 px-2 text-center">Orders</th>
              <th className="py-2.5 px-2 text-right">Total Spent</th>
              <th className="py-2.5 px-2 text-center">Loyalty Tier</th>
              <th className="py-2.5 px-2 text-right">Points</th>
              <th className="py-2.5 px-2 text-center w-16">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100/50 dark:divide-zinc-800/50 text-[11px] font-semibold text-black/80 dark:text-white/80">
            {data?.slice(0, 5).map((row, idx) => (
              <tr
                key={row.id}
                className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors group"
              >
                {/* Rank Badge */}
                <td className="py-2.5 px-2 text-center">
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full font-black text-[9px] ${getRankBadge(idx)}`}>
                    {idx + 1}
                  </span>
                </td>

                {/* Profile Detail */}
                <td className="py-2.5 px-2">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-[10px] shrink-0 uppercase">
                      {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-extrabold text-black dark:text-white truncate group-hover:text-[var(--primary)] transition-colors">
                        {row.name}
                      </span>
                      <span className="text-[8px] text-zinc-400 font-semibold uppercase tracking-wider mt-0.2">
                        {row.id}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Orders */}
                <td className="py-2.5 px-2 text-center font-black">
                  {row.orders}
                </td>

                {/* Spent */}
                <td className="py-2.5 px-2 text-right text-emerald-600 dark:text-emerald-500 font-black">
                  ₹{row.spend?.toLocaleString('en-IN')}
                </td>

                {/* Tier Badge */}
                <td className="py-2.5 px-2 text-center">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getTierColor(row.tier)}`}>
                    {row.tier}
                  </span>
                </td>

                {/* Points */}
                <td className="py-2.5 px-2 text-right font-extrabold text-zinc-650 dark:text-zinc-350">
                  {row.points?.toLocaleString()} pts
                </td>

                {/* Actions */}
                <td className="py-2.5 px-2 text-center">
                  <button
                    onClick={() => onViewDetails(row.id)}
                    className="p-1 rounded-md border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] text-zinc-500 hover:text-[var(--primary)] hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors shadow-sm cursor-pointer"
                    title="View Drill-Down Profile"
                  >
                    <Eye size={12} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
