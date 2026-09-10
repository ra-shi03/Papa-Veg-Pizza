import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { Skeleton } from '../../../../components/ui/skeleton';
import { useRevenueTrend, useCategorySales, usePaymentDistribution } from '../hooks/useSalesQuery';

export default function ChartsSection({ filters }) {
  const [interval, setInterval] = useState('monthly');
  const { data: trendData, loading: trendLoading } = useRevenueTrend(filters, interval);
  const { data: catData, loading: catLoading } = useCategorySales(filters);
  const { data: payData, loading: payLoading } = usePaymentDistribution(filters);

  // Dynamic Theme primary color
  const primaryColor = 'var(--primary, #a43c12)';
  const secondaryColor = 'var(--secondary, #ff7f50)';
  
  // Static colors for pie cells
  const PIE_COLORS = [primaryColor, secondaryColor, '#a1a1aa', '#71717a'];

  const formatRupee = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  // Custom tooltips
  const CustomAreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-white text-[10px] space-y-1 font-bold shadow-lg">
          <p className="text-zinc-400 font-extrabold uppercase mb-1">{label}</p>
          <p>Revenue: ₹{data.revenue?.toLocaleString('en-IN')}</p>
          <p>Orders: {data.orders?.toLocaleString()}</p>
          <p className="text-[var(--primary)]">Profit: ₹{data.profit?.toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-white text-[10px] space-y-1 font-bold shadow-lg">
          <p className="text-zinc-400 font-extrabold uppercase mb-1">{label}</p>
          <p>Revenue: ₹{data.revenue?.toLocaleString('en-IN')}</p>
          <p className="text-amber-500">Orders: {data.orders?.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-12 gap-4">
      {/* 1. Large Line/Area Revenue Trend Chart */}
      <div className="col-span-12 lg:col-span-8 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Revenue & Earnings Trend</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Comparative index of sales volume and profits</p>
          </div>

          <div className="flex bg-zinc-50 dark:bg-zinc-950 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
            {['daily', 'weekly', 'monthly'].map((t) => (
              <button
                key={t}
                onClick={() => setInterval(t)}
                className={`px-2.5 py-1 text-[9px] font-bold rounded uppercase transition-all cursor-pointer ${
                  interval === t
                    ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white'
                    : 'text-zinc-500 hover:text-black dark:hover:text-white'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="h-[200px] w-full mt-2">
          {trendLoading ? (
            <Skeleton className="w-full h-full rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevTrend" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={formatRupee} />
                <RechartsTooltip content={CustomAreaTooltip} />
                <Area type="monotone" dataKey="revenue" stroke={primaryColor} strokeWidth={2.2} fillOpacity={1} fill="url(#colorRevTrend)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Sales by Category Pie Chart */}
      <div className="col-span-12 md:col-span-6 lg:col-span-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm flex flex-col justify-between">
        <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-2">Category Revenue</h3>
        <div className="flex-1 flex flex-col items-center justify-center min-h-[200px]">
          {catLoading ? (
            <Skeleton className="w-28 h-28 rounded-full" />
          ) : (
            <>
              <div className="h-40 w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={catData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {catData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value) => [`${value}%`, 'Share']} />
                  </PieChart>
                </ResponsiveContainer>
                {/* Core Stats Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-black text-black dark:text-white">Veg Menu</span>
                  <span className="text-[8px] text-zinc-400 font-bold uppercase mt-0.5">Distribution</span>
                </div>
              </div>

              {/* Legends list */}
              <div className="w-full space-y-1.5 mt-2">
                {catData.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center text-[10px] font-bold p-1 px-2 rounded bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/40">
                    <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350">
                      <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}></span>
                      {item.name}
                    </div>
                    <span className="text-black dark:text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 3. Payment Method Distribution Vertical Bar Chart */}
      <div className="col-span-12 md:col-span-6 lg:col-span-12 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm">
        <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-3">Payment Method Breakdown</h3>
        <div className="h-[200px] w-full">
          {payLoading ? (
            <Skeleton className="w-full h-full rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={payData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={formatRupee} />
                <RechartsTooltip content={CustomBarTooltip} />
                <Bar dataKey="revenue" fill={primaryColor} radius={[4, 4, 0, 0]} maxBarSize={45}>
                  {payData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? primaryColor : secondaryColor} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
