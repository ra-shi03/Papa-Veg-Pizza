import React, { useState, useEffect } from 'react';
import { Search, Eye, AlertTriangle, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Skeleton } from '../../../../components/ui/skeleton';
import { useCustomerTable } from '../hooks/useCustomerQuery';

export default function CustomerTable({ filters, setFilters, onViewDetails }) {
  // Local state for debounced search
  const [searchTerm, setSearchTerm] = useState('');

  // Pagination states
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5
  });

  // Debounce search query by 600ms
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchTerm }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 600);
    return () => clearTimeout(handler);
  }, [searchTerm, setFilters]);

  // Sync external filters with page resets (e.g. changing location resets page to 1)
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [filters.location, filters.ageGroup, filters.gender, filters.customerType, filters.loyaltyTier]);

  const { data: rows, total, loading, error, refetch } = useCustomerTable(filters, pagination);

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

  const getRetentionColor = (score) => {
    if (score >= 80) return 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800';
    if (score >= 50) return 'text-amber-700 bg-amber-50 dark:bg-amber-950/20 border-amber-250 dark:border-amber-800';
    return 'text-rose-700 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800';
  };

  const getStatusColor = (status) => {
    if (status?.toLowerCase() === 'active') {
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400';
    }
    return 'bg-rose-500/10 text-rose-600 dark:text-rose-455';
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
      {/* Table Header Controls */}
      <div className="p-3 border-b border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-zinc-50/50 dark:bg-zinc-955/20">
        <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
          <Users size={13} className="text-[var(--primary)]" />
          Customer Database Directory
        </h4>

        {/* Search Input with Debounce */}
        <div className="relative w-full sm:max-w-xs">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 bg-zinc-100 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
          />
        </div>
      </div>

      {/* Main Table Content */}
      <div className="overflow-x-auto min-h-[220px]">
        <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-850">
          <thead className="bg-zinc-50/40 dark:bg-zinc-955 text-zinc-500 uppercase tracking-wider text-[9px] font-bold">
            <tr>
              <th className="px-4 py-2.5">Customer details</th>
              <th className="px-4 py-2.5 text-center">Orders</th>
              <th className="px-4 py-2.5 text-right">Total Spent</th>
              <th className="px-4 py-2.5 text-right">Avg Order Basket</th>
              <th className="px-4 py-2.5 text-center">Loyalty Tier</th>
              <th className="px-4 py-2.5 text-center">Retention Health</th>
              <th className="px-4 py-2.5 text-center">Last Active</th>
              <th className="px-4 py-2.5 text-center">Status</th>
              <th className="px-4 py-2.5 text-center">Actions</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-150 dark:divide-zinc-855 text-black dark:text-white font-semibold">
            {loading ? (
              Array.from({ length: pagination.limit }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="px-4 py-3"><Skeleton className="h-3.5 w-32" /></td>
                  <td className="px-4 py-3 text-center"><Skeleton className="h-3.5 w-8 mx-auto" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-3.5 w-16 ml-auto" /></td>
                  <td className="px-4 py-3 text-right"><Skeleton className="h-3.5 w-14 ml-auto" /></td>
                  <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-14 mx-auto rounded" /></td>
                  <td className="px-4 py-3 text-center"><Skeleton className="h-5 w-14 mx-auto rounded" /></td>
                  <td className="px-4 py-3 text-center"><Skeleton className="h-3.5 w-16 mx-auto" /></td>
                  <td className="px-4 py-3 text-center"><Skeleton className="h-4.5 w-12 mx-auto rounded" /></td>
                  <td className="px-4 py-3 text-center"><Skeleton className="h-7 w-8 mx-auto rounded" /></td>
                </tr>
              ))
            ) : error ? (
              <tr>
                <td colSpan="9" className="px-4 py-10 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-rose-500 font-bold text-xs">Error loading customer profiles.</span>
                    <button
                      onClick={refetch}
                      className="px-3 py-1 bg-[var(--primary)] text-white text-xs rounded font-bold hover:opacity-90 cursor-pointer shadow-sm"
                    >
                      Try Again
                    </button>
                  </div>
                </td>
              </tr>
            ) : rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/10 transition-colors group">
                  {/* Customer details */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[var(--primary)] text-white flex items-center justify-center font-bold text-xs uppercase shrink-0">
                        {row.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-black dark:text-white truncate group-hover:text-[var(--primary)] transition-colors">
                          {row.name}
                        </span>
                        <span className="text-[10px] text-zinc-400 font-medium truncate">
                          {row.email} | {row.phone}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Orders */}
                  <td className="px-4 py-3 text-center font-bold">
                    {row.orders}
                  </td>

                  {/* Total spent */}
                  <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-500 font-black">
                    ₹{row.spend?.toLocaleString('en-IN')}
                  </td>

                  {/* Avg Basket */}
                  <td className="px-4 py-3 text-right text-zinc-650 dark:text-zinc-350 font-bold">
                    ₹{row.averageSpend?.toLocaleString('en-IN')}
                  </td>

                  {/* Tier */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border uppercase tracking-wider ${getTierColor(row.tier)}`}>
                      {row.tier}
                    </span>
                  </td>

                  {/* Retention Score */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[9px] font-extrabold border tracking-wider ${getRetentionColor(row.retentionScore)}`}>
                      {row.retentionScore}% Score
                    </span>
                  </td>

                  {/* Last Active */}
                  <td className="px-4 py-3 text-center font-mono text-[10px] text-zinc-500 dark:text-zinc-400">
                    {row.lastOrderDate}
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${getStatusColor(row.status)}`}>
                      {row.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => onViewDetails(row.id)}
                      className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-500 hover:text-[var(--primary)] hover:border-[var(--primary)] transition-all cursor-pointer inline-flex items-center justify-center"
                      title="View Details Drill-Down"
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="px-4 py-12 text-center text-zinc-400 font-medium italic">
                  <div className="flex flex-col items-center gap-2">
                    <AlertTriangle size={20} className="text-zinc-400" />
                    <span>No customer profile found matching requirements.</span>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {total > 0 && (
        <div className="px-4 py-2.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20 text-xs font-bold">
          <div className="flex items-center gap-2">
            <span className="text-zinc-500">Rows:</span>
            <select
              value={pagination.limit}
              onChange={(e) => setPagination({ page: 1, limit: Number(e.target.value) })}
              className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded text-[11px] font-bold outline-none text-black dark:text-white"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span className="text-zinc-400 font-normal hidden sm:inline">
              {Math.min((pagination.page - 1) * pagination.limit + 1, total)} - {Math.min(pagination.page * pagination.limit, total)} of {total}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
              disabled={pagination.page === 1}
              className="p-1 px-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded disabled:opacity-40 flex items-center gap-0.5 cursor-pointer text-black dark:text-white"
            >
              <ChevronLeft size={12} />
              Prev
            </button>
            <span className="text-zinc-550 px-1">{pagination.page} / {Math.ceil(total / pagination.limit) || 1}</span>
            <button
              onClick={() => setPagination(p => ({ ...p, page: Math.min(Math.ceil(total / pagination.limit), p.page + 1) }))}
              disabled={pagination.page >= Math.ceil(total / pagination.limit)}
              className="p-1 px-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded disabled:opacity-40 flex items-center gap-0.5 cursor-pointer text-black dark:text-white"
            >
              Next
              <ChevronRight size={12} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
