import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  Sparkles,
  TrendingUp,
  Info,
  TrendingDown,
  Verified,
  ArrowRight,
  MoreHorizontal,
  RefreshCw,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';

export default function LoyaltyAnalytics({ onViewDetails }) {
  const [dateRange, setDateRange] = useState('30D');
  const [tierFilter, setTierFilter] = useState('All');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomDates, setShowCustomDates] = useState(false);

  // Dynamic metrics depending on date filter selection
  const statsMap = {
    '30D': { members: 185420, activePoints: '14.2M', redeemedPoints: '2.85M', conversion: '68.4%', trendMembers: '+12%', trendRedeemed: '-4%', convBars: 2, liabilityDesc: 'Liability across last 30d logs' },
    '90D': { members: 210180, activePoints: '21.5M', redeemedPoints: '8.40M', conversion: '71.2%', trendMembers: '+15%', trendRedeemed: '+2%', convBars: 3, liabilityDesc: 'Liability across last 90d logs' },
    '1Y': { members: 245600, activePoints: '42.8M', redeemedPoints: '34.20M', conversion: '74.5%', trendMembers: '+24%', trendRedeemed: '+8%', convBars: 3, liabilityDesc: 'Liability across last 1y logs' }
  };

  const currentStats = statsMap[dateRange] || statsMap['30D'];

  const allRows = [
    { id: 'C-001', rank: '#01', init: 'RK', name: 'Rajesh Kumar', points: '12,450', tier: 'Platinum', activity: '2 hours ago', color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
    { id: 'C-002', rank: '#02', init: 'AS', name: 'Anita Sharma', points: '11,200', tier: 'Platinum', activity: 'Yesterday', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
    { id: 'C-003', rank: '#03', init: 'SD', name: 'Sanjay Dutt', points: '9,840', tier: 'Gold', activity: '3 days ago', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
    { id: 'C-004', rank: '#04', init: 'PP', name: 'Priya Patel', points: '8,150', tier: 'Gold', activity: 'May 24, 2026', color: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' },
    { id: 'C-005', rank: '#05', init: 'AS', name: 'Amit Singh', points: '6,200', tier: 'Silver', activity: 'June 02, 2026', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
  ];

  // Filtering top spenders table based on selected tier dropdown
  const filteredRows = tierFilter === 'All' 
    ? allRows 
    : allRows.filter(row => row.tier.toLowerCase() === tierFilter.toLowerCase());

  const handleApplyCustomDates = () => {
    if (!customStartDate || !customEndDate) {
      toast.error('Please specify both start and end date');
      return;
    }
    setDateRange('Custom');
    toast.success(`Custom range applied: ${customStartDate} to ${customEndDate}`);
  };

  const handleResetFilters = () => {
    setDateRange('30D');
    setTierFilter('All');
    setCustomStartDate('');
    setCustomEndDate('');
    setShowCustomDates(false);
    toast.success('Loyalty filter attributes reset');
  };

  return (
    <div className="animate-fade-in space-y-4 mt-4">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 pb-2 border-b border-zinc-200 dark:border-zinc-800">
        <div>
          <h2 className="text-base md:text-lg font-bold text-zinc-900 dark:text-zinc-50">Loyalty Analytics & Tiers</h2>
          <p className="text-[10px] font-medium text-zinc-500 dark:text-zinc-400 mt-0.5">Franchise-wide member engagement and reward performance.</p>
        </div>
      </div>

      {/* 1. KPI Grid (Moved here above filter/banner) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* KPI 1 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm hover:border-[var(--primary)] transition-colors">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Total Loyalty Members</span>
            <span className="text-emerald-600 dark:text-emerald-500 font-bold text-[10px] flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded">
              <TrendingUp size={12} /> {currentStats.trendMembers}
            </span>
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-50">
            {currentStats.members.toLocaleString('en-IN')}
          </div>
          <div className="h-1 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full mt-3 overflow-hidden">
            <div className="h-full bg-[var(--primary)] rounded-full w-3/4"></div>
          </div>
        </div>
        
        {/* KPI 2 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm hover:border-[var(--primary)] transition-colors">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Active Points Balance</span>
            <Info size={14} className="text-zinc-400" />
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-50">
            {currentStats.activePoints}
          </div>
          <p className="text-[9px] font-bold text-zinc-450 dark:text-zinc-400 mt-2.5 uppercase tracking-wide">
            {currentStats.liabilityDesc}
          </p>
        </div>

        {/* KPI 3 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm hover:border-[var(--primary)] transition-colors">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Points Redeemed (MTD)</span>
            <span className={`font-bold text-[10px] flex items-center gap-0.5 px-1.5 py-0.5 rounded ${currentStats.trendRedeemed.startsWith('+') ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30' : 'text-rose-600 bg-rose-50 dark:bg-rose-955/30'}`}>
              {currentStats.trendRedeemed.startsWith('+') ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {currentStats.trendRedeemed}
            </span>
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-50">
            {currentStats.redeemedPoints}
          </div>
          <p className="text-[9px] font-bold text-zinc-450 dark:text-zinc-400 mt-2.5 uppercase tracking-wide">Estimated ₹35L value</p>
        </div>

        {/* KPI 4 */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm hover:border-[var(--primary)] transition-colors">
          <div className="flex justify-between items-start mb-2.5">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Conversion Rate</span>
            <span className="text-emerald-600 dark:text-emerald-500 font-bold text-[10px] flex items-center gap-0.5 bg-emerald-50 dark:bg-emerald-955/30 px-1.5 py-0.5 rounded">
              <Verified size={12} /> Target met
            </span>
          </div>
          <div className="text-xl font-black text-zinc-900 dark:text-zinc-50">
            {currentStats.conversion}
          </div>
          <div className="flex gap-1 mt-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div 
                key={i} 
                className={`h-1 rounded-full flex-1 ${i < currentStats.convBars ? 'bg-[var(--primary)]' : 'bg-zinc-150 dark:bg-zinc-800'}`} 
              />
            ))}
          </div>
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="bg-zinc-950 dark:bg-black rounded-xl p-3 flex items-center gap-3 relative overflow-hidden shadow-sm border border-zinc-800">
        <div className="bg-[var(--primary)] p-2 flex items-center justify-center rounded-lg text-white shadow-sm z-10 shrink-0">
          <Sparkles size={16} className="fill-current" />
        </div>
        <p className="text-zinc-200 font-medium z-10 text-xs">
          <span className="font-bold text-[var(--primary)] uppercase tracking-wider mr-1 text-[10px]">AI Recommendation:</span> Loyalty members spend <span className="text-emerald-400 font-bold">2.4x more</span> than non-members on average this month. Consider launching a Gold Tier exclusive campaign.
        </p>
        <div className="absolute right-0 top-0 w-64 h-64 bg-[var(--primary)] blur-[80px] opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Points Trends */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Points Earned vs Redeemed (Last 30 Days)</h3>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[var(--primary)] rounded-full"></span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Earned</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-zinc-300 dark:bg-zinc-700 rounded-full"></span>
                <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Redeemed</span>
              </div>
            </div>
          </div>
          <div className="h-[180px] flex items-end gap-2 relative">
            <svg className="w-full h-full absolute inset-0" viewBox="0 0 800 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="lineGrad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d="M0,150 Q100,140 200,80 T400,100 T600,60 T800,90" fill="transparent" stroke="var(--primary)" strokeWidth="3" vectorEffect="non-scaling-stroke"></path>
              <path d="M0,150 Q100,140 200,80 T400,100 T600,60 T800,90 V200 H0 Z" fill="url(#lineGrad)"></path>
              <path d="M0,180 Q100,170 200,150 T400,160 T600,140 T800,155" fill="transparent" stroke="currentColor" className="text-zinc-300 dark:text-zinc-700" strokeDasharray="5,5" strokeWidth="2" vectorEffect="non-scaling-stroke"></path>
            </svg>
            <div className="absolute bottom-[-18px] w-full flex justify-between px-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              <span>MAY 01</span>
              <span>MAY 08</span>
              <span>MAY 15</span>
              <span>MAY 22</span>
              <span>MAY 30</span>
            </div>
          </div>
        </div>

        {/* Tier Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm">
          <h3 className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider mb-5">Loyalty Tier Distribution</h3>
          <div className="relative flex justify-center mb-5">
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" fill="transparent" r="15.9" className="text-zinc-100 dark:text-zinc-800" stroke="currentColor" strokeWidth="3.5"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="var(--primary)" strokeDasharray="100" strokeDashoffset="85" strokeWidth="3.5" className="transition-all duration-1000 ease-out"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#fbbf24" strokeDasharray="100" strokeDashoffset="60" strokeWidth="3.5" className="transition-all duration-1000 ease-out"></circle>
              <circle cx="18" cy="18" fill="transparent" r="15.9" stroke="#94a3b8" strokeDasharray="100" strokeDashoffset="30" strokeWidth="3.5" className="transition-all duration-1000 ease-out"></circle>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-lg font-black text-zinc-900 dark:text-zinc-50">185k</span>
              <span className="text-[8px] font-bold uppercase tracking-wider text-zinc-450">Members</span>
            </div>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[var(--primary)]"></span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Platinum</span>
              </div>
              <span className="font-mono text-zinc-500 font-bold">15%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Gold</span>
              </div>
              <span className="font-mono text-zinc-500 font-bold">25%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Silver</span>
              </div>
              <span className="font-mono text-zinc-500 font-bold">30%</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-700"></span>
                <span className="font-bold text-zinc-700 dark:text-zinc-300">Bronze</span>
              </div>
              <span className="font-mono text-zinc-500 font-bold">30%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Filter Section (Moved here, directly above the table) */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-sm">
        <div>
          <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-50 uppercase tracking-wider">Top Loyalty Customers</h3>
          <p className="text-[9px] text-zinc-450 font-bold mt-0.5">Filter members by tier, activity, and date range parameters</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Interval selectors */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/50 p-0.5 rounded-lg border border-zinc-200 dark:border-zinc-700">
            {['30D', '90D', '1Y'].map(range => (
              <button 
                key={range}
                onClick={() => {
                  setDateRange(range);
                  setShowCustomDates(false);
                  toast.success(`Date filter updated to last ${range}`);
                }}
                className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider rounded transition-all cursor-pointer ${
                  dateRange === range && !showCustomDates
                    ? 'bg-white dark:bg-zinc-900 text-[var(--primary)] shadow-sm' 
                    : 'text-zinc-550 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          {/* Toggle Custom Date picker input */}
          <button
            onClick={() => setShowCustomDates(prev => !prev)}
            className={`flex items-center gap-1.5 border rounded-lg px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer ${
              showCustomDates
                ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]'
                : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50'
            }`}
          >
            <Calendar size={12} />
            <span>Date Range</span>
          </button>

          {/* Tier select Dropdown */}
          <div className="flex items-center gap-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-1 rounded-lg text-[9px] font-extrabold uppercase text-zinc-600 dark:text-zinc-400">
            <Filter size={11} className="text-zinc-400" />
            <select
              value={tierFilter}
              onChange={(e) => {
                setTierFilter(e.target.value);
                toast.success(`Filtering top loyalty ledger by ${e.target.value} tier`);
              }}
              className="bg-transparent border-none outline-none pr-4 cursor-pointer focus:ring-0"
            >
              <option value="All">All Tiers</option>
              <option value="Bronze">Bronze</option>
              <option value="Silver">Silver</option>
              <option value="Gold">Gold</option>
              <option value="Platinum">Platinum</option>
            </select>
          </div>

          {/* Reset button */}
          <button 
            onClick={handleResetFilters}
            className="p-1.5 border border-zinc-205 dark:border-zinc-805 bg-white dark:bg-zinc-900 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-400 transition-colors cursor-pointer flex items-center justify-center shadow-sm"
            title="Reset filters"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Inline Custom Date Picker Panel */}
      {showCustomDates && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl flex items-end gap-3 flex-wrap animate-fade-down shadow-sm">
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-zinc-400 uppercase">From</label>
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-8 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg text-[10px] font-bold outline-none text-black dark:text-white"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[8px] font-bold text-zinc-400 uppercase">To</label>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-8 px-2 bg-zinc-50 dark:bg-zinc-955 border border-zinc-200 dark:border-zinc-850 rounded-lg text-[10px] font-bold outline-none text-black dark:text-white"
            />
          </div>
          <button
            onClick={handleApplyCustomDates}
            className="px-4 py-1.5 h-8 bg-[var(--primary)] text-white text-[10px] font-bold uppercase rounded-lg hover:opacity-90 cursor-pointer shadow"
          >
            Apply Range
          </button>
        </div>
      )}

      {/* Top Loyalty Customers Table */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="bg-zinc-50/50 dark:bg-zinc-955/30 border-b border-zinc-200 dark:border-zinc-850 text-zinc-500 uppercase tracking-widest text-[9px] font-bold">
                <th className="px-4 py-2.5">Rank</th>
                <th className="px-4 py-2.5">Member details</th>
                <th className="px-4 py-2.5 text-right">Points Balance</th>
                <th className="px-4 py-2.5 text-center">Current Tier</th>
                <th className="px-4 py-2.5 text-center">Last Active Log</th>
                <th className="px-4 py-2.5 text-center w-16">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100/50 dark:divide-zinc-800/50 text-[11px] font-semibold text-black/80 dark:text-white/80">
              {filteredRows.map((cust, i) => (
                <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20 transition-colors group">
                  <td className="px-4 py-3 font-black text-[var(--primary)]">{cust.rank}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${cust.color}`}>
                        {cust.init}
                      </div>
                      <span className="font-extrabold text-black dark:text-white group-hover:text-[var(--primary)] transition-colors">{cust.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-black text-emerald-650 dark:text-emerald-500">{cust.points} pts</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider rounded bg-[var(--primary)] text-white shadow-sm">
                      {cust.tier}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-zinc-500 font-bold">{cust.activity}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => {
                        if (onViewDetails) {
                          onViewDetails(cust.id);
                        } else {
                          toast.error("Audit details modal handler is offline");
                        }
                      }}
                      className="p-1 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] text-zinc-500 hover:text-[var(--primary)] hover:bg-zinc-50 dark:hover:bg-zinc-950 transition-colors cursor-pointer"
                      title="Drill-down Member Profile"
                    >
                      <Eye size={12} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-4 py-8 text-center text-zinc-400 italic">No member logs matching selected filter parameters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
