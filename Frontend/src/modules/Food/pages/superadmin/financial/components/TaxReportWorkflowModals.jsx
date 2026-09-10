import React, { useState, useEffect } from 'react';
import { X, Shield, Search, Calendar, Laptop, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuditLogs } from '../hooks/useTaxQuery';

export function AuditLogModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 5;

  // Search input debouncer (600ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1); // Reset page to 1 on search
    }, 600);

    return () => clearTimeout(handler);
  }, [searchQuery]);

  const { data: rawLogs, loading, refetch } = useAuditLogs({ search: debouncedSearch });

  if (!isOpen) return null;

  // Pagination logic
  const totalLogs = rawLogs.length;
  const totalPages = Math.ceil(totalLogs / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedLogs = rawLogs.slice(startIndex, startIndex + limit);

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-[850px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-black dark:text-white">
                Compliance & Regulatory Audit Trails
              </h3>
              <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">
                Detailed ledger records mapping administrative logins, exports, downloads, and IPs for GST compliance audits
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Filters Panel */}
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex flex-wrap justify-between items-center gap-3 bg-zinc-50/50 dark:bg-zinc-950/20 shrink-0">
          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search user, action, remarks (600ms debounce)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 h-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
            />
          </div>

          {/* Refresh Action */}
          <button
            onClick={() => refetch()}
            className="p-1.5 border border-zinc-250 dark:border-zinc-800 text-zinc-550 dark:text-zinc-350 hover:bg-zinc-100 dark:hover:bg-zinc-850 rounded-lg flex items-center gap-1.5 text-[10px] font-bold cursor-pointer transition-colors"
          >
            <RefreshCw size={11} />
            Reload Audits
          </button>
        </div>

        {/* Logs Table Area */}
        <div className="overflow-x-auto min-h-[220px] max-h-[350px] custom-scrollbar flex-1">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <RefreshCw size={24} className="animate-spin text-[var(--primary)]" />
              <p className="text-[10px] font-bold text-zinc-500">Querying security ledger records...</p>
            </div>
          ) : (
            <table className="w-full text-[11px] font-semibold text-left text-zinc-700 dark:text-zinc-300">
              <thead className="text-[9px] text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-850 sticky top-0">
                <tr>
                  <th className="px-4 py-2.5">Date & Time</th>
                  <th className="px-4 py-2.5">Operator ID</th>
                  <th className="px-4 py-2.5">Action Code</th>
                  <th className="px-4 py-2.5">IP Address</th>
                  <th className="px-4 py-2.5">Compliance Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                {paginatedLogs.length > 0 ? (
                  paginatedLogs.map((log, index) => (
                    <tr key={index} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/40">
                      <td className="px-4 py-3 font-mono text-zinc-500 flex items-center gap-1.5">
                        <Calendar size={11} className="text-zinc-400" />
                        {log.timestamp}
                      </td>
                      <td className="px-4 py-3 font-extrabold text-zinc-900 dark:text-white">
                        {log.user}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-extrabold ${
                          log.action.includes('Generate') || log.action.includes('Upload')
                            ? 'bg-emerald-500/10 text-emerald-650'
                            : log.action.includes('Export') || log.action.includes('View')
                            ? 'bg-blue-500/10 text-blue-650'
                            : 'bg-amber-500/10 text-amber-650'
                        }`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-zinc-650 dark:text-zinc-400 flex items-center gap-1">
                        <Laptop size={11} className="text-zinc-400" />
                        {log.ipAddress}
                      </td>
                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 max-w-[220px] truncate" title={log.remarks}>
                        {log.remarks}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-450 font-bold">
                      No security audit matches found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer with Pagination */}
        <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          {/* Close button */}
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-zinc-350 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
          >
            Close Logs
          </button>

          {/* Pagination Controls */}
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-zinc-450 font-bold">
              Showing page {page} of {totalPages} ({totalLogs} records)
            </span>
            <div className="flex gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                className="p-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded text-zinc-500 dark:text-zinc-450 disabled:opacity-40 cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                className="p-1 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded text-zinc-500 dark:text-zinc-450 disabled:opacity-40 cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
