import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import { Zap, HelpCircle } from 'lucide-react';
import { Skeleton } from '../../../../components/ui/skeleton';
import OptimizedImage from '../../../../components/OptimizedImage';
import { useHourlyHeatmap, useTopProducts, useTaxBreakdown } from '../hooks/useSalesQuery';

export default function HeatmapAndProducts({ filters }) {
  const { data: hourlyData, loading: hourlyLoading } = useHourlyHeatmap(filters);
  const { data: topProducts, loading: productsLoading } = useTopProducts(filters);
  const { data: taxData, loading: taxLoading } = useTaxBreakdown(filters);

  // Accent Colors
  const primaryColor = 'var(--primary, #a43c12)';
  const secondaryColor = 'var(--secondary, #ff7f50)';

  const formatRupee = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  const CustomTaxTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-white text-[10px] space-y-1 font-bold shadow-lg">
          <p className="text-zinc-400 font-extrabold uppercase mb-1">{label}</p>
          {payload.map((item, idx) => (
            <p key={idx} style={{ color: item.color }}>
              {item.name}: ₹{item.value?.toLocaleString('en-IN')}
            </p>
          ))}
          <p className="border-t border-zinc-800 pt-1 text-emerald-400">
            Total Tax: ₹{payload.reduce((acc, curr) => acc + (curr.value || 0), 0).toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* 1. Hourly Sales Heatmap */}
      <div className="col-span-12 lg:col-span-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm flex flex-col justify-between">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Hourly Sales Heatmap</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">24-hour order density and peak traffic channels</p>
          </div>
          
          <div className="flex items-center gap-1.5 text-[9px] text-zinc-500 font-bold bg-zinc-50 dark:bg-zinc-950 px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
            <span>Low</span>
            <div className="flex gap-0.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)] opacity-20"></span>
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)] opacity-60"></span>
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--primary)] opacity-100"></span>
            </div>
            <span>High</span>
          </div>
        </div>

        {hourlyLoading ? (
          <Skeleton className="w-full h-32" />
        ) : (
          <div className="overflow-x-auto pr-1 pb-1 custom-scrollbar">
            <div className="min-w-[480px]">
              {/* Heatmap blocks */}
              <div className="grid grid-cols-12 gap-1.5 p-1 bg-zinc-50 dark:bg-zinc-955 rounded-lg border border-zinc-200 dark:border-zinc-800">
                {hourlyData.map((hourInfo) => {
                  // Determine opacity based on order counts
                  const maxOrders = 70;
                  const intensity = Math.min(Math.max(0.1, hourInfo.orders / maxOrders), 1);
                  return (
                    <div
                      key={hourInfo.hour}
                      className={`relative aspect-square rounded flex flex-col items-center justify-center cursor-pointer group transition-all ${
                        hourInfo.isPeak ? 'ring-1 ring-amber-500 shadow-sm border border-amber-400/50' : ''
                      }`}
                      style={{
                        backgroundColor: `rgba(var(--primary-rgb, 164, 60, 18), ${intensity})`,
                      }}
                    >
                      <span className="text-[9px] font-black text-white mix-blend-difference">{hourInfo.hour}</span>
                      
                      {/* Tooltip on hover */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block bg-zinc-900 border border-zinc-800 text-white text-[9px] p-2 rounded shadow-xl whitespace-nowrap z-30 font-bold">
                        <p className="text-[var(--primary)]">{hourInfo.time}</p>
                        <p>Orders: {hourInfo.orders}</p>
                        {hourInfo.isPeak && <p className="text-amber-400">🔥 Peak Rush Hour</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[8px] font-extrabold text-zinc-400 uppercase tracking-widest mt-2 px-1">
                <span>12 AM</span>
                <span>6 AM</span>
                <span>12 PM</span>
                <span>6 PM</span>
                <span>11 PM</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Top Selling Products (Horizontal Bar List) */}
      <div className="col-span-12 lg:col-span-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm flex flex-col justify-between">
        <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-3">Top Selling Products</h3>
        
        {productsLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, idx) => (
              <Skeleton key={idx} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
            {topProducts.slice(0, 5).map((prod, idx) => {
              const maxUnits = topProducts[0]?.units || 1000;
              const barWidth = `${(prod.units / maxUnits) * 100}%`;
              return (
                <div key={idx} className="flex items-center gap-2.5 p-1 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-lg hover:border-[var(--primary)]/30 transition-all">
                  {/* WebP product image */}
                  <OptimizedImage
                    src={prod.img}
                    alt={prod.name}
                    className="w-9 h-9 rounded-md shrink-0 shadow-sm border border-zinc-200 dark:border-zinc-800"
                    sizes="36px"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-[10px] font-extrabold text-black dark:text-white truncate pr-2">{prod.name}</p>
                      <span className="text-[10px] font-black text-black dark:text-white shrink-0">₹{prod.revenue?.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex-1 h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-[var(--primary)] rounded-full" style={{ width: barWidth }}></div>
                      </div>
                      <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-500 shrink-0">{prod.units} Sold</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Tax Breakdown Stacked Bar Chart */}
      <div className="col-span-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm">
        <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-3">GST Tax Breakdown (CGST, SGST, IGST)</h3>
        <div className="h-[180px] w-full">
          {taxLoading ? (
            <Skeleton className="w-full h-full rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={taxData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={formatRupee} />
                <RechartsTooltip content={CustomTaxTooltip} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                <Bar dataKey="CGST" stackId="tax" fill={primaryColor} />
                <Bar dataKey="SGST" stackId="tax" fill={secondaryColor} />
                <Bar dataKey="IGST" stackId="tax" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
