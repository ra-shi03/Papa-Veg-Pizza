import React, { useState } from 'react';
import { X, Search, RefreshCw, AlertTriangle, Inbox } from 'lucide-react';
import { useAdjustmentHistory } from './hooks/useCommissionQuery';

export default function AdjustmentHistoryModal({ isOpen, onClose, franchiseId, franchiseName }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 5 });

  const filters = React.useMemo(() => ({
    franchiseId,
    search: searchTerm
  }), [franchiseId, searchTerm]);

  const { data: logs, total, loading, error, refetch } = useAdjustmentHistory(filters, pagination);

  if (!isOpen) return null;

  const totalPages = Math.ceil(total / pagination.limit) || 1;

  const formatRupee = (value) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-[720px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-955/40">
          <div>
            <h3 className="text-sm font-bold text-black dark:text-white">
              Adjustment Audit Logs
            </h3>
            <p className="text-[10px] font-semibold text-zinc-550 mt-0.5">
              Historical overrides statement list for {franchiseName || 'Selected Franchise'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters and Controls */}
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={13} />
            <input 
              type="text"
              placeholder="Search by reason, admin..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPagination(prev => ({ ...prev, page: 1 })); }}
              className="pl-8 pr-3 h-8.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-2 focus:ring-[var(--primary)] outline-none w-full font-semibold text-black dark:text-white"
            />
          </div>
          <button 
            onClick={refetch}
            className="p-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-500 transition-colors shadow-sm cursor-pointer shrink-0"
            title="Refresh database logs"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Content canvas */}
        <div className="flex-1 overflow-x-auto min-h-[220px]">
          {loading ? (
            <table className="w-full text-left border-collapse">
              <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-2 font-bold text-[9px] text-zinc-400 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-2 font-bold text-[9px] text-zinc-400 uppercase tracking-wider">Type</th>
                  <th className="px-4 py-2 font-bold text-[9px] text-zinc-400 uppercase tracking-wider text-right">Amount</th>
                  <th className="px-4 py-2 font-bold text-[9px] text-zinc-400 uppercase tracking-wider">Reason</th>
                  <th className="px-4 py-2 font-bold text-[9px] text-zinc-400 uppercase tracking-wider">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-16"></div></td>
                    <td className="px-4 py-3"><div className="h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded w-12"></div></td>
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-14 ml-auto"></div></td>
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-32"></div></td>
                    <td className="px-4 py-3"><div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-20"></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-rose-500">
              <AlertTriangle className="mb-2" size={28} />
              <p className="text-xs font-bold">Unable to load commission records</p>
              <button 
                onClick={refetch}
                className="mt-3 text-[10px] bg-rose-500 text-white font-bold px-3 py-1 rounded hover:bg-rose-600 transition-colors"
              >
                Retry
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center text-zinc-500">
              <Inbox className="mb-2 text-zinc-400" size={32} />
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">No commission adjustments available</p>
              <p className="text-[10px] text-zinc-450 mt-1">Try changing filters or search criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-bold text-[9px] text-zinc-400 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-2">Date</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2 text-right">Amount</th>
                  <th className="px-4 py-2">Reason</th>
                  <th className="px-4 py-2">Adjusted By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                {logs.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                    <td className="px-4 py-2.5 font-bold whitespace-nowrap text-zinc-900 dark:text-zinc-100">{row.date}</td>
                    <td className="px-4 py-2.5">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${row.type === 'Increase' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-rose-50 dark:bg-rose-955/20 text-rose-500'}`}>
                        {row.type}
                      </span>
                    </td>
                    <td className={`px-4 py-2.5 text-right font-mono font-bold ${row.type === 'Increase' ? 'text-emerald-600' : 'text-rose-500'}`}>
                      {row.type === 'Increase' ? '+' : '-'}{formatRupee(row.amount)}
                    </td>
                    <td className="px-4 py-2.5 text-zinc-700 dark:text-zinc-300">
                      <div>{row.reason}</div>
                      {row.remarks && <p className="text-[10px] text-zinc-400 mt-0.5 font-normal leading-normal">{row.remarks}</p>}
                    </td>
                    <td className="px-4 py-2.5 font-semibold text-zinc-900 dark:text-zinc-100">{row.adjustedBy}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with pagination */}
        <div className="px-5 py-3.5 border-t border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-955/40 shrink-0">
          <span className="text-[10px] text-zinc-500 font-bold">
            Showing Page {pagination.page} of {totalPages} ({total} overrides)
          </span>
          <div className="flex gap-1.5">
            <button
              disabled={pagination.page <= 1}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              className="px-2.5 py-1 text-[10px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer text-black dark:text-white"
            >
              Prev
            </button>
            <button
              disabled={pagination.page >= totalPages}
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              className="px-2.5 py-1 text-[10px] font-bold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded shadow-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40 cursor-pointer text-black dark:text-white"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
