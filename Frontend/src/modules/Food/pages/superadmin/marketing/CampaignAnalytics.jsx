import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, BarChart3, LineChart, TrendingUp, Users, DollarSign, 
  Percent, Gift, ShoppingBag, Eye, Calendar, ArrowRight, Loader2 
} from 'lucide-react';
import { apiGetCampaignAnalytics } from './CampaignData';

export default function CampaignAnalytics({ campaignId, isOpen, onClose }) {
  const [activeSubTab, setActiveSubTab] = useState('Charts'); // 'Charts' | 'Orders'
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pagination for Recent Orders
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 5;

  useEffect(() => {
    if (isOpen && campaignId) {
      setLoading(true);
      apiGetCampaignAnalytics(campaignId)
        .then(analyticsData => {
          setData(analyticsData);
          setLoading(false);
        })
        .catch(err => {
          alert('Failed to load analytics: ' + err.message);
          setLoading(false);
          onClose();
        });
    }
  }, [isOpen, campaignId]);

  const paginatedOrders = useMemo(() => {
    if (!data || !data.recentOrders) return [];
    const startIndex = (currentPage - 1) * ordersPerPage;
    return data.recentOrders.slice(startIndex, startIndex + ordersPerPage);
  }, [data, currentPage]);

  const totalPages = useMemo(() => {
    if (!data || !data.recentOrders) return 0;
    return Math.ceil(data.recentOrders.length / ordersPerPage);
  }, [data]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-[1400px] h-[800px] max-h-[90vh] rounded-2xl flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                <BarChart3 size={16} />
              </span>
              Campaign Performance Analytics
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {loading ? 'Fetching analytical trends...' : `Detailed performance logs for "${data.campaignTitle}"`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tab Controllers */}
            {!loading && (
              <div className="bg-zinc-100 dark:bg-zinc-800 p-0.5 rounded-lg flex mr-2">
                <button
                  onClick={() => setActiveSubTab('Charts')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    activeSubTab === 'Charts' 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  Visual Analytics
                </button>
                <button
                  onClick={() => setActiveSubTab('Orders')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    activeSubTab === 'Orders' 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  Recent Orders ({data?.recentOrders?.length || 0})
                </button>
              </div>
            )}

            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-all"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex flex-col justify-center items-center gap-2.5">
            <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin" />
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Loading charts &amp; order logs...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 dark:bg-zinc-950/20">
            
            {/* KPI metrics row */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Reach</span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{(data.kpi.reach).toLocaleString()}</h4>
                  <p className="text-[9px] text-zinc-450 mt-0.5">Unique visitors</p>
                </div>
                <div className="p-2 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                  <Users size={14} />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Impressions</span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{(data.kpi.impressions).toLocaleString()}</h4>
                  <p className="text-[9px] text-zinc-450 mt-0.5">Total ad exposures</p>
                </div>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Eye size={14} />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Click Rate (CTR)</span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{data.kpi.ctr}%</h4>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">+1.2% above target</p>
                </div>
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                  <Percent size={14} />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Conversions</span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{(data.kpi.orders).toLocaleString()}</h4>
                  <p className="text-[9px] text-zinc-450 mt-0.5">Completed orders</p>
                </div>
                <div className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg">
                  <ShoppingBag size={14} />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Redemptions</span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">{(data.kpi.redemptions).toLocaleString()}</h4>
                  <p className="text-[9px] text-zinc-450 mt-0.5">Coupon redemptions</p>
                </div>
                <div className="p-2 bg-amber-500/10 text-amber-500 rounded-lg">
                  <Gift size={14} />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block font-bold">Revenue</span>
                  <h4 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{(data.kpi.revenue).toLocaleString()}</h4>
                  <p className="text-[9px] text-zinc-450 mt-0.5">Total sales generated</p>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <DollarSign size={14} />
                </div>
              </div>

            </div>

            {/* TAB 1: VISUAL ANALYTICS */}
            {activeSubTab === 'Charts' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
                
                {/* 1. Daily Traffic Line Chart (Grid Span: 8) */}
                <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Daily Traffic Trend</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Aggregate traffic click logs over campaign timeline</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Line Chart</span>
                  </div>
                  
                  {/* SVG Line Chart */}
                  <div className="h-60 w-full relative pt-4">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      {/* Grid Lines */}
                      <line x1="0" y1="40" x2="700" y2="40" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
                      <line x1="0" y1="90" x2="700" y2="90" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
                      <line x1="0" y1="140" x2="700" y2="140" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
                      <line x1="0" y1="180" x2="700" y2="180" stroke="#e2e8f0" strokeWidth="1.5" className="dark:stroke-zinc-850" />

                      {/* Area beneath path */}
                      <path 
                        d={`M 0 180 L 0 160 L 50 140 L 100 120 L 150 130 L 200 90 L 250 100 L 300 80 L 350 55 L 400 70 L 450 45 L 500 40 L 550 60 L 600 30 L 650 20 L 700 10 L 700 180 Z`} 
                        fill="url(#lineGrad)" 
                      />

                      {/* Line Path */}
                      <path 
                        d="M 0 160 L 50 140 L 100 120 L 150 130 L 200 90 L 250 100 L 300 80 L 350 55 L 400 70 L 450 45 L 500 40 L 550 60 L 600 30 L 650 20 L 700 10" 
                        fill="none" 
                        stroke="var(--primary)" 
                        strokeWidth="3.5" 
                        strokeLinecap="round"
                      />

                      {/* Coordinate Circles */}
                      {[
                        {x: 0, y: 160, val: 1200}, {x: 100, y: 120, val: 2400}, 
                        {x: 200, y: 90, val: 3100}, {x: 300, y: 80, val: 3500}, 
                        {x: 400, y: 70, val: 3800}, {x: 500, y: 40, val: 5200}, 
                        {x: 600, y: 30, val: 5800}, {x: 700, y: 10, val: 7100}
                      ].map((pt, i) => (
                        <g key={i} className="group/dot cursor-pointer">
                          <circle cx={pt.x} cy={pt.y} r="5" fill="var(--primary)" stroke="white" strokeWidth="2" />
                          <circle cx={pt.x} cy={pt.y} r="10" fill="var(--primary)" opacity="0" className="hover:opacity-20 transition-all" />
                        </g>
                      ))}
                    </svg>
                  </div>
                  {/* Legend */}
                  <div className="flex justify-between items-center text-[10px] text-zinc-450 dark:text-zinc-500 mt-2 font-bold px-1">
                    <span>06-01 (Start)</span>
                    <span>06-09</span>
                    <span>06-17</span>
                    <span>06-25</span>
                    <span>06-29 (Latest)</span>
                  </div>
                </div>

                {/* 2. Channel Performance Donut Chart (Grid Span: 4) */}
                <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Channel Split</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Conversions driven by channel</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Donut</span>
                  </div>

                  {/* SVG Donut Layout */}
                  <div className="flex flex-col items-center justify-center h-52">
                    <div className="relative w-36 h-36">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        {/* Background ring */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="3.5" className="dark:stroke-zinc-850" />
                        
                        {/* Segments: Push (35%), Email (25%), SMS (20%), Multi-channel (20%) */}
                        {/* Segment 1: Push 35% (stroke-dasharray="35 65" offset 0) */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="3.5" strokeDasharray="35 65" strokeDashoffset="0" />
                        
                        {/* Segment 2: Email 25% (stroke-dasharray="25 75" offset -35) */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="3.5" strokeDasharray="25 75" strokeDashoffset="-35" />
                        
                        {/* Segment 3: SMS 20% (stroke-dasharray="20 80" offset -60) */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f97316" strokeWidth="3.5" strokeDasharray="20 80" strokeDashoffset="-60" />
                        
                        {/* Segment 4: Multi-channel 20% (stroke-dasharray="20 80" offset -80) */}
                        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="3.5" strokeDasharray="20 80" strokeDashoffset="-80" />
                      </svg>
                      {/* Center details */}
                      <div className="absolute inset-0 flex flex-col justify-center items-center">
                        <span className="text-lg font-black text-zinc-900 dark:text-zinc-150">100%</span>
                        <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold">Split</span>
                      </div>
                    </div>
                  </div>

                  {/* Donut Legend */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-zinc-650 dark:text-zinc-400 mt-2">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500 shrink-0"></span> Push Alert (35%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-purple-500 shrink-0"></span> Email (25%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-orange-500 shrink-0"></span> SMS (20%)</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500 shrink-0"></span> Multi (20%)</div>
                  </div>
                </div>

                {/* 3. Conversion Funnel (Grid Span: 4) */}
                <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Conversion Funnel</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Drop-off stats across key checkout metrics</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Funnel</span>
                  </div>

                  {/* Funnel Layout */}
                  <div className="space-y-3 pt-2">
                    {data.charts.funnelData.map((item, idx) => {
                      const heights = ['w-full bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20', 
                                       'w-[75%] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20', 
                                       'w-[50%] bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20', 
                                       'w-[35%] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20', 
                                       'w-[25%] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'];
                      return (
                        <div key={item.stage} className="flex items-center gap-3">
                          <span className="w-24 text-[10px] font-bold text-zinc-400 truncate text-left">{item.stage}</span>
                          <div className="flex-1">
                            <div className={`border rounded-lg p-2 flex justify-between items-center font-bold text-[10.5px] ${heights[idx]}`}>
                              <span>{item.value.toLocaleString()}</span>
                              {item.percent !== null && <span>{item.percent}%</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 4. Revenue Trend Bar Chart (Grid Span: 4) */}
                <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Revenue Trend (Weekly)</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Sales conversions categorized by weekday</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Bar Chart</span>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="h-44 w-full relative pt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 240 100" preserveAspectRatio="none">
                      {/* Bars: Mon, Tue, Wed, Thu, Fri, Sat, Sun */}
                      {/* Heights mapping: Mon:45%, Tue:52%, Wed:68%, Thu:59%, Fri:110%(max->100%), Sat:145%(100%), Sun:130%(90%) */}
                      {[
                        {day: 'Mon', height: 31, val: '₹45k'},
                        {day: 'Tue', height: 35, val: '₹52k'},
                        {day: 'Wed', height: 46, val: '₹68k'},
                        {day: 'Thu', height: 40, val: '₹59k'},
                        {day: 'Fri', height: 75, val: '₹110k'},
                        {day: 'Sat', height: 98, val: '₹145k'},
                        {day: 'Sun', height: 89, val: '₹130k'}
                      ].map((item, i) => {
                        const barW = 16;
                        const gap = 16;
                        const startX = 12 + i * (barW + gap);
                        return (
                          <g key={item.day} className="cursor-pointer group">
                            {/* Bar background */}
                            <rect x={startX} y="0" width={barW} height="90" fill="#f1f5f9" className="dark:fill-zinc-850" rx="3" />
                            {/* Filled bar */}
                            <rect x={startX} y={90 - item.height} width={barW} height={item.height} fill="var(--primary)" rx="3" className="hover:opacity-90 transition-opacity" />
                            {/* Tooltip value */}
                            <text x={startX + barW/2} y={80 - item.height} textAnchor="middle" className="text-[7.5px] font-black fill-zinc-900 dark:fill-zinc-150 opacity-0 group-hover:opacity-100 transition-opacity">{item.val}</text>
                          </g>
                        );
                      })}
                      {/* Bottom axis line */}
                      <line x1="0" y1="90" x2="240" y2="90" stroke="#e2e8f0" strokeWidth="1.5" className="dark:stroke-zinc-800" />
                    </svg>
                  </div>
                  {/* Legend Labels */}
                  <div className="flex justify-between items-center text-[9px] text-zinc-450 dark:text-zinc-500 font-bold px-2.5 mt-1">
                    <span>Mon</span>
                    <span>Tue</span>
                    <span>Wed</span>
                    <span>Thu</span>
                    <span>Fri</span>
                    <span>Sat</span>
                    <span>Sun</span>
                  </div>
                </div>

                {/* 5. Coupon Usage Trend Area Chart (Grid Span: 4) */}
                <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Coupon Usage Trend</h4>
                      <p className="text-[10px] text-zinc-500 mt-0.5">Coupon redemptions over time</p>
                    </div>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase">Area</span>
                  </div>

                  {/* Area Chart SVG */}
                  <div className="h-44 w-full relative pt-2">
                    <svg className="w-full h-full overflow-visible" viewBox="0 0 240 100" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M 0 90 L 0 80 L 40 70 L 80 60 L 120 50 L 160 35 L 200 20 L 240 10 L 240 90 Z" 
                        fill="url(#areaGrad)" 
                      />
                      <path 
                        d="M 0 80 L 40 70 L 80 60 L 120 50 L 160 35 L 200 20 L 240 10" 
                        fill="none" 
                        stroke="#10b981" 
                        strokeWidth="2.5" 
                        strokeLinecap="round"
                      />
                      {/* Dots */}
                      {[
                        {x: 0, y: 80}, {x: 80, y: 60}, {x: 160, y: 35}, {x: 240, y: 10}
                      ].map((pt, i) => (
                        <circle key={i} cx={pt.x} cy={pt.y} r="3" fill="#10b981" stroke="white" strokeWidth="1" />
                      ))}
                    </svg>
                  </div>
                  {/* Legend Labels */}
                  <div className="flex justify-between items-center text-[9px] text-zinc-450 dark:text-zinc-500 font-bold px-1 mt-1">
                    <span>06-01 (Start)</span>
                    <span>06-13</span>
                    <span>06-25</span>
                    <span>06-29</span>
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: RECENT ORDERS */}
            {activeSubTab === 'Orders' && (
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm animate-in fade-in duration-200">
                <table className="w-full text-left border-collapse min-w-[800px]">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] uppercase tracking-wider font-extrabold">
                    <tr>
                      <th className="px-4 py-3">Order ID</th>
                      <th className="px-4 py-3">Customer</th>
                      <th className="px-4 py-3">Coupon Used</th>
                      <th className="px-4 py-3">Franchise Store</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-semibold">
                    {paginatedOrders.map((ord) => (
                      <tr key={ord.orderId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                        <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-bold">{ord.orderId}</td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-350">{ord.customer}</td>
                        <td className="px-4 py-3">
                          <span className="px-1.5 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded text-[10px] font-extrabold">{ord.couponUsed}</span>
                        </td>
                        <td className="px-4 py-3 text-zinc-700 dark:text-zinc-350">{ord.store}</td>
                        <td className="px-4 py-3 text-right text-zinc-900 dark:text-zinc-150 font-black">₹{ord.amount}</td>
                        <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{ord.date}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            ord.status === 'Delivered' 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                              : 'bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400'
                          }`}>
                            {ord.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Table Pagination Footer */}
                <div className="px-4 py-3 flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 shrink-0">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                    Showing {(currentPage-1)*ordersPerPage+1} - {Math.min(currentPage*ordersPerPage, data.recentOrders.length)} of {data.recentOrders.length} orders
                  </p>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-650 dark:text-zinc-350 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Prev
                    </button>
                    <button 
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-1 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs font-bold text-zinc-650 dark:text-zinc-350 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end shrink-0">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all shadow-sm"
          >
            Close Analytics View
          </button>
        </div>

      </div>
    </div>
  );
}
