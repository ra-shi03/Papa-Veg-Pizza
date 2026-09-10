import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
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
import {
  useCustomerGrowth,
  useNewVsReturning,
  useRetentionCurve,
  useLoyaltyDistribution,
  useSpendByCity
} from '../hooks/useCustomerQuery';

export default function CustomerCharts({ filters }) {
  const [interval, setInterval] = useState('monthly');

  const { data: growthData, loading: growthLoading } = useCustomerGrowth(filters, interval);
  const { data: nvrData, loading: nvrLoading } = useNewVsReturning(filters);
  const { data: retentionData, loading: retentionLoading } = useRetentionCurve(filters);
  const { data: loyaltyData, loading: loyaltyLoading } = useLoyaltyDistribution(filters);
  const { data: cityData, loading: cityLoading } = useSpendByCity(filters);

  // Theme primary/secondary colors
  const primaryColor = 'var(--primary, #a43c12)';
  const secondaryColor = 'var(--secondary, #ff7f50)';

  const NVR_COLORS = [primaryColor, '#38bdf8'];
  const LOYALTY_COLORS = {
    Bronze: '#b45309', // Brown/Bronze
    Silver: '#94a3b8', // Silver
    Gold: '#eab308',   // Gold
    Platinum: '#0ea5e9' // Platinum
  };

  const formatRupee = (val) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  // Tooltips
  const CustomGrowthTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-white text-[10px] space-y-1 font-bold shadow-lg">
          <p className="text-zinc-400 font-extrabold uppercase mb-1">{label}</p>
          <p className="text-[var(--primary)]">New Customers: {data.customers?.toLocaleString()}</p>
          <p className="text-sky-400">Total Orders: {data.orders?.toLocaleString()}</p>
          <p className="text-emerald-400">Revenue: ₹{data.revenue?.toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  const CustomRetentionTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-white text-[10px] font-bold shadow-lg">
          <p className="text-zinc-400 font-extrabold uppercase mb-1">{label}</p>
          <p className="text-emerald-400">Retention: {data.value}%</p>
        </div>
      );
    }
    return null;
  };

  const CustomCityTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-2.5 rounded-lg text-white text-[10px] font-bold shadow-lg">
          <p className="text-zinc-400 font-extrabold uppercase mb-1">{label}</p>
          <p className="text-[var(--primary)]">Average Spend: ₹{data.spend?.toLocaleString('en-IN')}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* 1. Large Acquisition Growth Trend */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3">
          <div>
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Acquisition & Engagement Growth</h3>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">Track customer onboarding against actual transaction volumes</p>
          </div>

          <div className="flex bg-zinc-50 dark:bg-zinc-955 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-800 shrink-0">
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
          {growthLoading ? (
            <Skeleton className="w-full h-full rounded" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCust" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={primaryColor} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={primaryColor} stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorOrd" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#38bdf8" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} dy={5} />
                <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                <RechartsTooltip content={CustomGrowthTooltip} />
                <Area type="monotone" dataKey="customers" name="Customers" stroke={primaryColor} strokeWidth={2.2} fillOpacity={1} fill="url(#colorCust)" />
                <Area type="monotone" dataKey="orders" name="Orders" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="3 3" fillOpacity={1} fill="url(#colorOrd)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Composition Grid (New vs Returning Donut & Loyalty Distribution Pie) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* New vs Returning */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-2">New vs Returning Composition</h3>
          <div className="flex flex-col items-center justify-center min-h-[180px] mt-2">
            {nvrLoading ? (
              <Skeleton className="w-28 h-28 rounded-full" />
            ) : (
              <>
                <div className="h-36 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={nvrData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {nvrData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={NVR_COLORS[index % NVR_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value) => [`${value}%`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-base font-black text-black dark:text-white">
                      {nvrData.find(d => d.name.includes('Returning'))?.value || 60}%
                    </span>
                    <span className="text-[7px] text-zinc-400 font-extrabold uppercase tracking-widest mt-0.5">Returning</span>
                  </div>
                </div>

                <div className="w-full space-y-1 mt-2">
                  {nvrData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] font-bold p-1 px-2 rounded bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/40">
                      <div className="flex items-center gap-1.5 text-zinc-650 dark:text-zinc-350">
                        <span className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: NVR_COLORS[idx % NVR_COLORS.length] }}></span>
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

        {/* Loyalty Distribution */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm flex flex-col justify-between">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-2">Loyalty Tier Share</h3>
          <div className="flex flex-col items-center justify-center min-h-[180px] mt-2">
            {loyaltyLoading ? (
              <Skeleton className="w-28 h-28 rounded-full" />
            ) : (
              <>
                <div className="h-36 w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={loyaltyData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {loyaltyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={LOYALTY_COLORS[entry.name] || primaryColor} />
                        ))}
                      </Pie>
                      <RechartsTooltip formatter={(value, name, props) => [`${value}% (${props.payload.count?.toLocaleString()})`, 'Share']} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-sm font-black text-black dark:text-white">Bronze-to-Plat</span>
                    <span className="text-[7px] text-zinc-400 font-extrabold uppercase tracking-widest mt-0.5">Tier Split</span>
                  </div>
                </div>

                <div className="w-full grid grid-cols-2 gap-1.5 mt-2">
                  {loyaltyData.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[9px] font-bold p-1 px-1.5 rounded bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800/40">
                      <div className="flex items-center gap-1 text-zinc-650 dark:text-zinc-350 truncate">
                        <span className="w-1.5 h-1.5 rounded-full shadow-sm shrink-0" style={{ backgroundColor: LOYALTY_COLORS[item.name] || primaryColor }}></span>
                        <span className="truncate">{item.name}</span>
                      </div>
                      <span className="text-black dark:text-white font-extrabold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 3. Deep-Dive Grid (Retention Cohort LineChart & Average Spend by City BarChart) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Retention Cohort */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-2">Customer Retention Curve</h3>
          <p className="text-[9px] text-zinc-400 font-semibold mb-3">Retention rate over subsequent cohorts from purchase date</p>
          <div className="h-[180px] w-full">
            {retentionLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={retentionData} margin={{ top: 5, right: 10, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                  <RechartsTooltip content={CustomRetentionTooltip} />
                  <Line type="monotone" dataKey="value" stroke={primaryColor} strokeWidth={2.5} activeDot={{ r: 6 }} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Avg Spend by City */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3.5 shadow-sm">
          <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider mb-2">Average Ticket Size by Metro</h3>
          <p className="text-[9px] text-zinc-400 font-semibold mb-3">Comparison of average order basket value (AOV) across cities</p>
          <div className="h-[180px] w-full">
            {cityLoading ? (
              <Skeleton className="w-full h-full rounded" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cityData} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={9} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={9} tickLine={false} axisLine={false} tickFormatter={formatRupee} />
                  <RechartsTooltip content={CustomCityTooltip} />
                  <Bar dataKey="spend" fill={primaryColor} radius={[4, 4, 0, 0]} maxBarSize={32}>
                    {cityData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={index === 0 || index === 1 ? primaryColor : secondaryColor}
                        opacity={1 - index * 0.1}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
