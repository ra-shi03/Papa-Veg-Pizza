import React, { useState, useEffect } from 'react';
import { X, Search, Filter, Calendar, History, ArrowDownLeft, ArrowUpRight, Download, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, formatINR } from './LoyaltyData';
import { toast } from 'sonner';

export default function LoyaltyHistoryModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [retryTrigger, setRetryTrigger] = useState(0);

  // Filters State
  const [filters, setFilters] = useState({
    search: '',
    type: 'All',
    startDate: '',
    endDate: ''
  });

  // Local Search Input (for debouncing or filter apply)
  const [searchInput, setSearchInput] = useState('');

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 8
  });

  // KPI aggregation derived from active filtered transactions
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalRedeemed: 0,
    netPoints: 0,
    ordersCount: 0
  });

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, filters, pagination.page, retryTrigger]);

  // Debounced search sync
  useEffect(() => {
    const handler = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
      setPagination(prev => ({ ...prev, page: 1 }));
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await api.getHistory(filters, pagination);
      setTransactions(res.data);
      setTotalCount(res.totalCount);
      setTotalPages(res.totalPages);

      // Fetch all transactions to compile overall KPI statistics accurately
      const allRes = await api.getHistory(filters, { page: 1, limit: 10000 });
      const allTxns = allRes.data;
      
      const earned = allTxns.filter(t => t.type === 'earn').reduce((sum, t) => sum + t.points, 0);
      const redeemed = allTxns.filter(t => t.type === 'redeem').reduce((sum, t) => sum + t.points, 0);
      const orders = allTxns.filter(t => t.orderId && t.orderId.startsWith('PV-ORD')).length;

      setStats({
        totalEarned: earned,
        totalRedeemed: redeemed,
        netPoints: earned - redeemed,
        ordersCount: orders
      });
    } catch (err) {
      toast.error("Failed to sync points transactions ledger.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: 'All',
      startDate: '',
      endDate: ''
    });
    setSearchInput('');
    setPagination({ page: 1, limit: 8 });
    toast.success("Transaction filters reset.");
  };

  const handleExportCSV = () => {
    if (transactions.length === 0) {
      toast.error("No transactions found to export.");
      return;
    }

    const headers = ['Transaction ID', 'Customer ID', 'Customer Name', 'Order ID', 'Type', 'Points', 'Amount (INR)', 'Created Date'];
    const rows = transactions.map(t => [
      t._id,
      t.customerId,
      `"${t.customerName.replace(/"/g, '""')}"`,
      t.orderId,
      t.type.toUpperCase(),
      t.points,
      t.amount,
      new Date(t.createdAt).toLocaleDateString('en-IN')
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `PapaVegPizza_PointsLedger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Points ledger exported successfully.");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-[1400px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col text-zinc-800 dark:text-zinc-100 max-h-[95vh] animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
              <History size={18} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-black dark:text-white">Loyalty Transaction Ledger</h2>
              <p className="text-[10px] text-zinc-555 font-medium font-semibold">Audit logs of all point earn and redeem transactions issued via customer checks or manual adjustments.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCSV}
              className="h-8.5 px-3 border border-zinc-350 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-xs font-bold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-1.5 cursor-pointer"
            >
              <Download size={13} />
              Export ledger CSV
            </button>
            <button 
              onClick={onClose} 
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-650 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 flex flex-col min-h-0">
          
          {/* 4 Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 shrink-0 select-none">
            
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Total Points Issued</span>
                <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                  {loading ? '...' : `+${stats.totalEarned.toLocaleString()}`}
                </h4>
              </div>
              <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <ArrowUpRight size={16} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Total Redeemed</span>
                <h4 className="text-base font-black text-rose-600 dark:text-rose-400 mt-1 font-mono">
                  {loading ? '...' : `-${stats.totalRedeemed.toLocaleString()}`}
                </h4>
              </div>
              <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                <ArrowDownLeft size={16} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Net Balance Outstanding</span>
                <h4 className="text-base font-black text-zinc-900 dark:text-white mt-1 font-mono">
                  {loading ? '...' : `${stats.netPoints.toLocaleString()} Pts`}
                </h4>
              </div>
              <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                <History size={16} />
              </div>
            </div>

            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-805 p-3.5 rounded-xl shadow-sm flex items-center justify-between">
              <div className="min-w-0">
                <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Attributed Loyalty Orders</span>
                <h4 className="text-base font-black text-blue-500 mt-1 font-mono">
                  {loading ? '...' : `${stats.ordersCount} Orders`}
                </h4>
              </div>
              <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                <History size={16} />
              </div>
            </div>

          </div>

          {/* Filtering row */}
          <div className="p-4 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-4 shrink-0 text-xs font-semibold select-none">
            
            {/* Search customer */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-zinc-450 uppercase tracking-wider">Search Customer</label>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-400" />
                <input 
                  type="text"
                  placeholder="ID, name, order, transaction..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full h-9 pl-8 pr-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-zinc-450 uppercase tracking-wider">Transaction Type</label>
              <select
                value={filters.type}
                onChange={(e) => {
                  setFilters(prev => ({ ...prev, type: e.target.value }));
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="w-full h-9 px-2 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white cursor-pointer font-semibold"
              >
                <option value="All">All Types</option>
                <option value="Earn">Earn</option>
                <option value="Redeem">Redeem</option>
              </select>
            </div>

            {/* Date range start */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-zinc-450 uppercase tracking-wider">Start Date</label>
              <div className="relative">
                <Calendar size={13} className="absolute right-3 top-2.5 text-zinc-450" />
                <input 
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, startDate: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
                />
              </div>
            </div>

            {/* Date range end */}
            <div className="flex flex-col gap-1">
              <label className="text-[9px] font-black text-zinc-450 uppercase tracking-wider">End Date</label>
              <div className="relative flex gap-2">
                <input 
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => {
                    setFilters(prev => ({ ...prev, endDate: e.target.value }));
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className="w-full h-9 px-3 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none focus:border-[var(--primary)] text-black dark:text-white"
                />
                <button
                  onClick={handleResetFilters}
                  className="h-9 px-3.5 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-250 hover:dark:bg-zinc-750 rounded-lg text-[10px] font-black text-zinc-700 dark:text-zinc-300 border border-zinc-300 dark:border-zinc-700 cursor-pointer whitespace-nowrap"
                >
                  Reset
                </button>
              </div>
            </div>

          </div>

          {/* Table Area */}
          <div className="flex-1 overflow-y-auto min-h-0 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-inner bg-white dark:bg-zinc-900 flex flex-col">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3">
                <RefreshCw size={24} className="text-[var(--primary)] animate-spin" />
                <p className="text-xs font-bold text-zinc-450">Querying database ledger logs...</p>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-16 text-center select-none text-zinc-400">
                <History className="text-zinc-300 dark:text-zinc-800 mb-2" size={32} />
                <h4 className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wide">No transaction logs matches</h4>
                <p className="text-[10px] max-w-xs leading-normal mt-0.5">Try resetting search queries or date range boundary parameters.</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-800 text-left text-xs">
                <thead className="bg-zinc-50 dark:bg-zinc-950 text-[9px] font-black uppercase text-zinc-450 tracking-wider sticky top-0 z-10 border-b border-zinc-150 dark:border-zinc-800">
                  <tr>
                    <th className="px-5 py-3">Transaction ID</th>
                    <th className="px-5 py-3">Customer ID</th>
                    <th className="px-5 py-3">Customer Name</th>
                    <th className="px-5 py-3">Order ID</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Points</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Created Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 bg-white dark:bg-zinc-900 font-medium">
                  {transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors">
                      <td className="px-5 py-3.5 whitespace-nowrap text-zinc-450 font-mono text-[10px]">{t._id}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-zinc-850 dark:text-zinc-205 font-mono text-[10px] font-bold">{t.customerId}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap text-zinc-900 dark:text-zinc-100 font-extrabold">{t.customerName}</td>
                      <td className="px-5 py-3.5 whitespace-nowrap font-mono text-[10.5px] font-semibold text-zinc-600 dark:text-zinc-400">{t.orderId}</td>
                      
                      <td className="px-5 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase border tracking-wider ${
                          t.type === 'earn'
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30'
                            : 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-450 border-rose-100 dark:border-rose-900/30'
                        }`}>
                          {t.type}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-mono font-black text-[11.5px]">
                        <span className={t.type === 'earn' ? 'text-emerald-600' : 'text-rose-600'}>
                          {t.type === 'earn' ? '+' : '-'}{t.points}
                        </span>
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap font-mono font-bold text-zinc-800 dark:text-zinc-200">
                        {t.amount > 0 ? formatINR(t.amount) : '₹0'}
                      </td>

                      <td className="px-5 py-3.5 whitespace-nowrap text-zinc-500 font-medium">
                        {new Date(t.createdAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/30 p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shrink-0 text-xs font-semibold select-none">
              <span className="text-zinc-450">Showing {transactions.length} of {totalCount} records</span>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.max(1, p.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="p-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <span className="px-3 py-1.5 border border-zinc-300 dark:border-zinc-750 bg-white dark:bg-zinc-850 rounded-lg text-[10.5px] font-mono">
                  {pagination.page} / {totalPages}
                </span>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: Math.min(totalPages, p.page + 1) }))}
                  disabled={pagination.page === totalPages}
                  className="p-1.5 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 rounded-lg text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-955 flex justify-end">
          <button 
            onClick={onClose}
            className="h-9 px-4 border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-50 transition-colors"
          >
            Close History
          </button>
        </div>

      </div>
    </div>
  );
}
