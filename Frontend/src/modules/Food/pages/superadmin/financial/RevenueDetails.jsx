import React from 'react';
import { X, TrendingUp, DollarSign, ShoppingBag, Store, Percent, AlertCircle } from 'lucide-react';
import { useRevenueDetails, useExportRevenue } from './hooks/useRevenueQuery';
import apiClient from '../../../../../services/api/axios';

export default function RevenueDetails({ isOpen, onClose, date }) {
  const { data, loading, error, refetch } = useRevenueDetails(date);
  const { exportRevenue, exportLoading } = useExportRevenue();

  if (!isOpen) return null;

  const formatRupee = (value) => {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  // SVG Donut helpers
  const getDonutData = () => {
    if (!data) return [];
    const { grossSales, netSales, discounts, refunds, taxes, platformFee } = data;
    const foodRevenue = netSales - platformFee;
    const total = foodRevenue + platformFee + taxes; // breakdown total
    if (total === 0) return [];

    return [
      { name: 'Food Revenue', value: foodRevenue, color: '#3b82f6', pct: Math.round((foodRevenue / total) * 100) },
      { name: 'Platform Fees', value: platformFee, color: '#a855f7', pct: Math.round((platformFee / total) * 100) },
      { name: 'Tax Revenue', value: taxes, color: '#f97316', pct: Math.round((taxes / total) * 100) }
    ];
  };

  const donutSegments = getDonutData();

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="relative w-full max-w-[1000px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-white">
              Revenue Audit Details
            </h3>
            <p className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-400 mt-0.5">
              Detailed financial reporting snapshot for {date || 'Selected Date'}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Loading / Error / Content */}
        <div className="p-6 flex-1">
          {loading ? (
            <div className="space-y-6">
              {/* Skeletons summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-pulse">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
                ))}
              </div>
              {/* Skeletons columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-pulse">
                <div className="h-44 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
                <div className="h-44 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
              </div>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="text-rose-500 mb-2.5" size={32} />
              <p className="text-sm font-bold text-zinc-850 dark:text-zinc-200">Unable to load revenue data</p>
              <p className="text-xs text-zinc-500 mt-1">Check your network connection or try again.</p>
              <button 
                onClick={refetch}
                className="mt-4 bg-[var(--primary)] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow hover:brightness-110 active:scale-95 transition-all"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <div className="space-y-6">
              
              {/* Summary Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
                {/* Gross Sales */}
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Gross Sales</p>
                    <p className="text-sm font-black text-black dark:text-white mt-1 font-mono">{formatRupee(data.grossSales)}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20 shrink-0">
                    <DollarSign size={13} />
                  </div>
                </div>

                {/* Net Sales */}
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between shadow-sm border-t-2 border-t-emerald-500">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Net Sales</p>
                    <p className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1 font-mono">{formatRupee(data.netSales)}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-605 border border-emerald-100 dark:border-emerald-900/20 shrink-0">
                    <DollarSign size={13} />
                  </div>
                </div>

                {/* Discounts */}
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between shadow-sm border-t-2 border-t-amber-500">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Discounts</p>
                    <p className="text-sm font-black text-amber-600 dark:text-amber-400 mt-1 font-mono">{formatRupee(data.discounts)}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 border border-amber-100 dark:border-amber-900/30 shrink-0">
                    <Percent size={13} />
                  </div>
                </div>

                {/* Refunds */}
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between shadow-sm border-t-2 border-t-rose-500">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Refunds</p>
                    <p className="text-sm font-black text-rose-600 dark:text-rose-455 mt-1 font-mono">{formatRupee(data.refunds)}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-105 dark:border-rose-900/30 shrink-0">
                    <X size={13} />
                  </div>
                </div>

                {/* Taxes */}
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Taxes (GST)</p>
                    <p className="text-sm font-black text-black dark:text-white mt-1 font-mono">{formatRupee(data.taxes)}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 shrink-0">
                    <Percent size={13} />
                  </div>
                </div>

                {/* Platform Fee */}
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Platform Earnings</p>
                    <p className="text-sm font-black text-black dark:text-white mt-1 font-mono">{formatRupee(data.platformFee)}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-600 shrink-0">
                    <DollarSign size={13} />
                  </div>
                </div>

                {/* Orders Count */}
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Orders Count</p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white mt-1 font-mono">{data.ordersCount}</p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 shrink-0">
                    <ShoppingBag size={13} />
                  </div>
                </div>

                {/* Average Ticket Size */}
                <div className="p-3 bg-zinc-50/70 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-800/80 rounded-xl flex items-center justify-between shadow-sm">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Avg Ticket Size</p>
                    <p className="text-sm font-black text-zinc-900 dark:text-white mt-1 font-mono">
                      {data.ordersCount > 0 ? formatRupee(Math.round(data.grossSales / data.ordersCount)) : '₹0'}
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 shrink-0">
                    <Percent size={13} />
                  </div>
                </div>
              </div>

              {/* Bottom Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Performers */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Outlets Leaderboard</h4>
                  
                  {/* Top Store */}
                  <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="text-[var(--primary)]" size={15} />
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Top Performing Store</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <TrendingUp size={10} />
                        +{data.topStore.growth}%
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white">{data.topStore.name}</h5>
                      <span className="text-xs font-black font-mono text-[var(--primary)]">{formatRupee(data.topStore.revenue)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-semibold">{data.topStore.orders} completed deliveries today</p>
                  </div>

                  {/* Top Franchise */}
                  <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-3 shadow-inner">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="text-blue-500" size={15} />
                        <span className="text-[10px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Top Franchise</span>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                        <TrendingUp size={10} />
                        +{data.topFranchise.growth}%
                      </span>
                    </div>
                    <div className="flex justify-between items-baseline pt-1">
                      <h5 className="text-xs font-extrabold text-zinc-900 dark:text-white">{data.topFranchise.name}</h5>
                      <span className="text-xs font-black font-mono text-blue-550">{formatRupee(data.topFranchise.revenue)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 font-semibold">{data.topFranchise.orders} orders processed</p>
                  </div>
                </div>

                {/* Revenue Breakdown Mini Chart */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Revenue Share distribution</h4>
                  
                  <div className="p-4 bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-800 rounded-xl shadow-inner flex flex-col justify-between h-[230px]">
                    <div className="flex justify-around items-center h-full">
                      
                      {/* SVG Donut */}
                      <div className="relative w-24 h-24 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                          {/* Segment calculations */}
                          {donutSegments.map((segment, index) => {
                            // Cumulative dashes
                            const accumulated = donutSegments.slice(0, index).reduce((acc, curr) => acc + curr.pct, 0);
                            return (
                              <circle 
                                key={index}
                                cx="18" 
                                cy="18" 
                                fill="transparent" 
                                r="15.9" 
                                stroke={segment.color} 
                                strokeDasharray={`${segment.pct} ${100 - segment.pct}`}
                                strokeDashoffset={-accumulated}
                                strokeWidth="4.5"
                              />
                            );
                          })}
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center select-none">
                          <span className="text-sm font-black text-black dark:text-white">100%</span>
                          <span className="text-[7px] font-bold text-zinc-450 uppercase tracking-wider">Volume</span>
                        </div>
                      </div>

                      {/* Legends */}
                      <div className="space-y-2 max-w-[180px] w-full pl-3">
                        {donutSegments.map((segment, index) => (
                          <div key={index} className="flex justify-between items-center text-[10px] font-bold">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: segment.color }}></span>
                              <span className="text-zinc-700 dark:text-zinc-350 truncate">{segment.name}</span>
                            </div>
                            <div className="text-right pl-2 shrink-0">
                              <span className="text-zinc-900 dark:text-white font-black">{segment.pct}%</span>
                            </div>
                          </div>
                        ))}
                      </div>

                    </div>
                  </div>

                </div>

              </div>

            </div>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-205 dark:border-zinc-800 flex flex-wrap justify-end gap-2 bg-zinc-50 dark:bg-zinc-950/40">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            Close
          </button>
          <button 
            disabled={exportLoading}
            onClick={() => exportRevenue('excel', { date })}
            className="px-4 py-1.5 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-200 dark:hover:bg-zinc-100 text-white dark:text-zinc-900 rounded-lg text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50"
          >
            Export Excel
          </button>
          <button 
            disabled={exportLoading}
            onClick={() => exportRevenue('pdf', { date })}
            className="px-4 py-1.5 bg-[var(--primary)] hover:brightness-110 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50"
          >
            Download PDF
          </button>
        </div>

      </div>
    </div>
  );
}
