import React, { useState } from 'react';
import { X, ShieldAlert, DollarSign, TrendingUp, Undo, Tag, Receipt, ShoppingBag } from 'lucide-react';
import { Skeleton } from '../../../../components/ui/skeleton';
import { useRowDetails } from '../hooks/useSalesQuery';
import OptimizedImage from '../../../../components/OptimizedImage';

export default function DetailsModal({ isOpen, onClose, rowId }) {
  const [activeTab, setActiveTab] = useState('revenue');
  const { data, loading } = useRowDetails(rowId);

  if (!isOpen) return null;

  const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${val.toLocaleString('en-IN')}`;
  };

  const tabs = [
    { id: 'revenue', name: 'Revenue Breakdown' },
    { id: 'products', name: 'Top Products' },
    { id: 'stores', name: 'Top Stores' },
    { id: 'regions', name: 'Top Regions' }
  ];

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-[1200px] bg-zinc-50 dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col relative border border-zinc-200 dark:border-zinc-800 max-h-[90vh]">
        
        {/* Modal Header */}
        <header className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-20 rounded-t-2xl">
          <div>
            <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
              <span>Sales Audit Drill-down</span>
              <span className="bg-[var(--primary)]/10 text-[var(--primary)] text-[10px] px-2 py-0.5 rounded font-mono font-bold">
                ID: {rowId}
              </span>
            </h2>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Deep inspection of local channels and product performance</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
          >
            <X size={16} />
          </button>
        </header>

        {/* Custom Navigation Tab bar */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shrink-0 overflow-x-auto">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  isActive
                    ? 'border-[var(--primary)] text-[var(--primary)] bg-[var(--primary)]/[0.02]'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                }`}
              >
                {tab.name}
              </button>
            );
          })}
        </div>

        {/* Modal Content Scrollbox */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : !data ? (
            <div className="text-center py-10 text-zinc-400 font-bold italic">
              <ShieldAlert className="mx-auto mb-2 text-zinc-350" size={24} />
              No row details matching ID found.
            </div>
          ) : (
            <div className="animate-fade-in text-xs">
              
              {/* TAB 1: REVENUE BREAKDOWN */}
              {activeTab === 'revenue' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { title: 'Gross Revenue', val: data.revenueBreakdown.grossRevenue, icon: DollarSign, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
                    { title: 'Coupon Discounts', val: data.revenueBreakdown.couponDiscounts, icon: Tag, color: 'text-orange-500 bg-orange-50 dark:bg-orange-950/20' },
                    { title: 'Promotional Discounts', val: data.revenueBreakdown.promotionalDiscounts, icon: Tag, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20' },
                    { title: 'Refunds', val: data.revenueBreakdown.refunds, icon: Undo, color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/20' },
                    { title: 'Delivery Charges', val: data.revenueBreakdown.deliveryCharges, icon: ShoppingBag, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/20' },
                    { title: 'Taxes', val: data.revenueBreakdown.taxes, icon: Receipt, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/20' },
                    { title: 'Platform Commission', val: data.revenueBreakdown.platformCommission, icon: DollarSign, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/20' },
                    { title: 'Net Revenue', val: data.revenueBreakdown.netRevenue, icon: TrendingUp, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' }
                  ].map((card, index) => {
                    const Icon = card.icon;
                    return (
                      <div key={index} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3.5 rounded-xl shadow-sm hover:scale-[1.01] transition-transform">
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest leading-none">{card.title}</span>
                          <span className={`p-1 rounded ${card.color}`}><Icon size={11} /></span>
                        </div>
                        <h3 className="text-sm font-black text-black dark:text-white font-mono mt-3">
                          {formatCurrency(card.val)}
                        </h3>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: TOP PRODUCTS */}
              {activeTab === 'products' && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-550 dark:bg-zinc-950/45 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="px-4 py-2.5">Product</th>
                        <th className="px-4 py-2.5 text-right">Units Sold</th>
                        <th className="px-4 py-2.5 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-black dark:text-white">
                      {data.products.map((prod, index) => (
                        <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="px-4 py-2.5 flex items-center gap-2">
                            <OptimizedImage
                              src={prod.img}
                              alt={prod.name}
                              className="w-7 h-7 rounded border border-zinc-200 dark:border-zinc-800 shrink-0"
                              sizes="28px"
                            />
                            <span className="truncate">{prod.name}</span>
                          </td>
                          <td className="px-4 py-2.5 text-right">{prod.units?.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[var(--primary)]">{formatCurrency(prod.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 3: TOP STORES */}
              {activeTab === 'stores' && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-550 dark:bg-zinc-950/45 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="px-4 py-2.5">Store</th>
                        <th className="px-4 py-2.5 text-right">Orders</th>
                        <th className="px-4 py-2.5 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-black dark:text-white">
                      {data.stores.map((store, index) => (
                        <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="px-4 py-2.5">{store.name}</td>
                          <td className="px-4 py-2.5 text-right">{store.orders?.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[var(--primary)]">{formatCurrency(store.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* TAB 4: TOP REGIONS */}
              {activeTab === 'regions' && (
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                    <thead className="bg-zinc-550 dark:bg-zinc-950/45 text-zinc-500 font-bold uppercase tracking-wider text-[9px]">
                      <tr>
                        <th className="px-4 py-2.5">Region</th>
                        <th className="px-4 py-2.5 text-right">Orders</th>
                        <th className="px-4 py-2.5 text-right">Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-black dark:text-white">
                      {data.regions.map((reg, index) => (
                        <tr key={index} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="px-4 py-2.5">{reg.name}</td>
                          <td className="px-4 py-2.5 text-right">{reg.orders?.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right font-bold text-[var(--primary)]">{formatCurrency(reg.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            </div>
          )}
        </main>

        {/* Modal Footer */}
        <footer className="p-3 border-t border-zinc-200 dark:border-zinc-800 shrink-0 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-zinc-900 dark:bg-zinc-800 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:opacity-95 transition-opacity cursor-pointer shadow"
          >
            Close Audit
          </button>
        </footer>

      </div>
    </div>
  );
}
