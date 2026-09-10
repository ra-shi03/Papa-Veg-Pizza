import React, { useRef } from 'react';
import { X, Briefcase, User, Map, MapPin, Store, Receipt, DollarSign, Percent, AlertCircle, FileText, FileSpreadsheet } from 'lucide-react';
import { useCommissionDetails, useExportCommission } from './hooks/useCommissionQuery';
import { ResponsiveContainer, ComposedChart, Line, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, CartesianGrid } from 'recharts';

export default function CommissionDetails({ isOpen, onClose, id }) {
  const { data, loading, error, refetch } = useCommissionDetails(id);
  const { exportCommission, exportLoading } = useExportCommission();
  const chartRef = useRef(null);

  if (!isOpen) return null;

  const formatRupee = (value) => {
    if (value === undefined || value === null) return '₹0';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleDownloadPNG = () => {
    // Basic browser message for demo/dev purposes
    alert("Downloading chart visualization canvas as PNG image...");
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-[1100px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-955/40">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-white flex items-center gap-2">
              Franchise Commission Detail Drill-down
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                data?.settlementStatus === 'Settled' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' :
                data?.settlementStatus === 'Partial' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' :
                'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
              }`}>
                {data?.settlementStatus || 'Awaiting Sync'}
              </span>
            </h3>
            <p className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-400 mt-0.5">
              Financial performance audit, active fee structures, and store-level details
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 flex-1 overflow-y-auto max-h-[calc(100vh-180px)] custom-scrollbar space-y-6">
          {loading ? (
            <div className="space-y-6">
              {/* Skeletons */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-16 bg-zinc-100 dark:bg-zinc-800 rounded-xl"></div>
                ))}
              </div>
              <div className="h-44 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
              <div className="h-44 bg-zinc-100 dark:bg-zinc-800 rounded-xl animate-pulse"></div>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="text-rose-500 mb-2.5" size={32} />
              <p className="text-sm font-bold text-zinc-850 dark:text-zinc-200">Unable to load details</p>
              <button 
                onClick={refetch}
                className="mt-4 bg-[var(--primary)] text-white px-4 py-1.5 rounded-lg text-xs font-bold shadow hover:brightness-110 active:scale-95 transition-all"
              >
                Retry
              </button>
            </div>
          ) : data ? (
            <>
              {/* Section 1: Franchise Information */}
              <section className="bg-zinc-50/50 dark:bg-zinc-900/40 p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl space-y-3 shadow-inner">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Briefcase size={14} className="text-[var(--primary)]" />
                  Franchise Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Franchise Name</p>
                    <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5">{data.franchise.name}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Owner / Partner</p>
                    <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5 flex items-center gap-1">
                      <User size={12} className="text-zinc-400" />
                      {data.franchise.ownerName}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Territory Region</p>
                    <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5 flex items-center gap-1">
                      <Map size={12} className="text-zinc-400" />
                      {data.franchise.region} • {data.franchise.territory}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Stores Count</p>
                    <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5 flex items-center gap-1">
                      <Store size={12} className="text-zinc-400" />
                      {data.franchise.storesCount} Stores
                    </p>
                  </div>
                  
                  <div className="border-t border-zinc-200/50 dark:border-zinc-800 pt-2 col-span-2 sm:col-span-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">GSTIN Number</p>
                      <p className="font-mono font-bold text-zinc-800 dark:text-zinc-250 mt-0.5">{data.franchise.gstNumber}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">PAN Number</p>
                      <p className="font-mono font-bold text-zinc-800 dark:text-zinc-250 mt-0.5">{data.franchise.panNumber}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wide">Settlement Bank Account</p>
                      <p className="font-mono font-bold text-zinc-800 dark:text-zinc-250 mt-0.5">HDFC Bank Acc: {data.franchise.bankAccount}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Section 2: Commission Summary */}
              <section className="space-y-3">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Receipt size={14} className="text-[var(--primary)]" />
                  Commission Summary
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-7 gap-3">
                  <div className="p-3 bg-zinc-50/70 dark:bg-zinc-955/20 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold text-zinc-450 uppercase tracking-wider">Gross Sales</span>
                    <span className="text-sm font-black text-black dark:text-white mt-1.5 font-mono">{formatRupee(data.grossSales)}</span>
                  </div>
                  <div className="p-3 bg-zinc-50/70 dark:bg-zinc-955/20 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider">Rate %</span>
                    <span className="text-sm font-black text-[var(--primary)] mt-1.5 font-mono">{data.commissionRate}%</span>
                  </div>
                  <div className="p-3 bg-zinc-50/70 dark:bg-zinc-955/20 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col justify-between shadow-sm border-t-2 border-t-[var(--primary)]">
                    <span className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider font-semibold">Earnings</span>
                    <span className="text-sm font-black text-[var(--primary)] mt-1.5 font-mono">{formatRupee(data.platformEarnings)}</span>
                  </div>
                  <div className="p-3 bg-zinc-50/70 dark:bg-zinc-955/20 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col justify-between shadow-sm border-t-2 border-t-emerald-500">
                    <span className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider">Paid Amount</span>
                    <span className="text-sm font-black text-emerald-600 mt-1.5 font-mono">{formatRupee(data.paidCommission)}</span>
                  </div>
                  <div className="p-3 bg-zinc-50/70 dark:bg-zinc-955/20 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col justify-between shadow-sm border-t-2 border-t-amber-500">
                    <span className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider">Pending</span>
                    <span className="text-sm font-black text-amber-600 mt-1.5 font-mono">{formatRupee(data.pendingCommission)}</span>
                  </div>
                  <div className="p-3 bg-zinc-50/70 dark:bg-zinc-955/20 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col justify-between shadow-sm">
                    <span className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider">Refund Deducts</span>
                    <span className="text-sm font-black text-rose-600 mt-1.5 font-mono">-{formatRupee(data.refundAdjustments)}</span>
                  </div>
                  <div className="p-3 bg-zinc-50/70 dark:bg-zinc-955/20 border border-zinc-200 dark:border-zinc-800/80 rounded-xl flex flex-col justify-between shadow-sm col-span-2 md:col-span-1">
                    <span className="text-[9px] font-bold text-zinc-455 uppercase tracking-wider">Status</span>
                    <span className="text-[10px] font-bold text-zinc-900 dark:text-zinc-100 mt-1.5 font-bold uppercase">{data.settlementStatus}</span>
                  </div>
                </div>
              </section>

              {/* Section 3: Monthly Commission Trend Chart */}
              <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 shadow-sm flex flex-col justify-between h-[320px]">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Monthly Commission Trend</h4>
                    <p className="text-[9px] font-semibold text-zinc-400 mt-0.5">Overview comparisons of Sales revenue vs earnings vs actual settlements</p>
                  </div>
                  <button 
                    onClick={handleDownloadPNG}
                    className="px-2.5 py-1 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer text-black dark:text-white"
                  >
                    Download PNG
                  </button>
                </div>
                <div className="flex-1 w-full h-[220px]" ref={chartRef}>
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data.monthlyTrend} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" className="dark:hidden" />
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272a" className="hidden dark:block" />
                      <XAxis dataKey="month" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v >= 100000 ? `${(v/100000).toFixed(0)}L` : v}`} />
                      <RechartsTooltip 
                        formatter={(val, name) => [formatRupee(val), name === 'grossSales' ? 'Gross Sales' : name === 'commissionEarnings' ? 'Earnings' : 'Paid Amount']}
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', border: '1px solid #e4e4e7', fontSize: '10px', borderRadius: '8px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                      <Bar dataKey="grossSales" name="grossSales" fill="#e4e4e7" barSize={20} radius={[4, 4, 0, 0]} className="dark:fill-zinc-805" />
                      <Bar dataKey="paidAmount" name="paidAmount" fill="#10b981" barSize={14} radius={[4, 4, 0, 0]} />
                      <Line type="monotone" dataKey="commissionEarnings" name="commissionEarnings" stroke="var(--primary)" strokeWidth={2} dot={{ r: 3 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </section>

              {/* Section 4: Store Performance Table */}
              <section className="space-y-2">
                <h4 className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Store size={14} className="text-[var(--primary)]" />
                  Store Performance Leaderboard
                </h4>
                <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 font-bold text-[9px] text-zinc-455 uppercase tracking-widest">
                      <tr>
                        <th className="px-4 py-2">Store Outlet</th>
                        <th className="px-4 py-2 text-center">Orders Count</th>
                        <th className="px-4 py-2 text-right">Revenue Generated</th>
                        <th className="px-4 py-2 text-right font-semibold">Commissions Shared</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 font-medium">
                      {data.stores.map((store, i) => (
                        <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors">
                          <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-zinc-100">{store.name}</td>
                          <td className="px-4 py-2.5 text-center font-mono">{store.orders}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-zinc-800 dark:text-zinc-200">{formatRupee(store.revenue)}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-black text-[var(--primary)]">{formatRupee(store.commission)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </>
          ) : null}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex flex-wrap justify-end gap-2 bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          <button 
            onClick={onClose}
            className="px-4 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all cursor-pointer"
          >
            Close
          </button>
          <button 
            disabled={exportLoading || loading}
            onClick={() => exportCommission('excel', { franchiseId: id })}
            className="px-4 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-black dark:text-white rounded-lg text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <FileSpreadsheet size={13} className="text-emerald-600" />
            Export Excel
          </button>
          <button 
            disabled={exportLoading || loading}
            onClick={() => exportCommission('pdf', { franchiseId: id })}
            className="px-4 py-1.5 bg-[var(--primary)] hover:brightness-110 text-white rounded-lg text-xs font-bold shadow transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
          >
            <FileText size={13} className="text-white" />
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
