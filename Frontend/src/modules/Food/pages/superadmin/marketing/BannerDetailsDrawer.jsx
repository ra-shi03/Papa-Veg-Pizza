import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Calendar, Target, MapPin, BarChart3, TrendingUp, Loader2, Info, Eye, 
  MousePointerClick, Percent, ShoppingCart, DollarSign, Layers
} from 'lucide-react';
import { apiGetBannerById, apiGetBannerAnalytics, mockStores } from './BannersData';
import { mockRegions, mockFranchises } from './CouponsData';

export default function BannerDetailsDrawer({ bannerId, isOpen, onClose, onEdit }) {
  const [activeTab, setActiveTab] = useState('Overview');
  const [banner, setBanner] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && bannerId) {
      setLoading(true);
      Promise.all([
        apiGetBannerById(bannerId),
        apiGetBannerAnalytics(bannerId)
      ])
        .then(([bData, aData]) => {
          setBanner(bData);
          setAnalytics(aData);
          setLoading(false);
        })
        .catch(err => {
          alert('Error loading details: ' + err.message);
          setLoading(false);
          onClose();
        });
    }
  }, [isOpen, bannerId]);

  // Derived Status Label
  const derivedStatus = useMemo(() => {
    if (!banner) return 'Unknown';
    if (!banner.isActive) return 'Disabled';
    const now = new Date();
    const start = new Date(banner.startDate);
    const end = new Date(banner.endDate);
    if (now > end) return 'Expired';
    if (now < start) return 'Scheduled';
    return 'Active';
  }, [banner]);

  const regionNames = useMemo(() => {
    if (!banner || !banner.regionIds) return [];
    return mockRegions.filter(r => banner.regionIds.includes(r.id)).map(r => r.name);
  }, [banner]);

  const franchiseNames = useMemo(() => {
    if (!banner || !banner.franchiseIds) return [];
    return mockFranchises.filter(f => banner.franchiseIds.includes(f.id)).map(f => f.name);
  }, [banner]);

  const storeNames = useMemo(() => {
    if (!banner || !banner.storeIds) return [];
    return mockStores.filter(s => banner.storeIds.includes(s.id)).map(s => s.name);
  }, [banner]);

  if (!isOpen) return null;

  // Custom SVG line chart helper for Daily Impressions
  const renderImpressionsChart = () => {
    if (!analytics || !analytics.charts.impressionsTrend) return null;
    const data = analytics.charts.impressionsTrend;
    const points = data.map((d, i) => `${i * 50 + 20},${100 - (d.value / 100000) * 80}`).join(' ');
    return (
      <svg className="w-full h-28 overflow-visible" viewBox="0 0 340 100" preserveAspectRatio="none">
        <line x1="10" y1="90" x2="330" y2="90" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-zinc-800" />
        <path d={points} fill="none" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={i * 50 + 20} cy={100 - (d.value / 100000) * 80} r="3.5" fill="var(--primary)" stroke="white" strokeWidth="1" />
            <title>{`Date: ${d.date}\nImpressions: ${d.value.toLocaleString()}`}</title>
          </g>
        ))}
      </svg>
    );
  };

  // Custom SVG bar chart helper for Daily Clicks
  const renderClicksChart = () => {
    if (!analytics || !analytics.charts.clicksTrend) return null;
    const data = analytics.charts.clicksTrend;
    return (
      <svg className="w-full h-28 overflow-visible" viewBox="0 0 340 100" preserveAspectRatio="none">
        <line x1="10" y1="90" x2="330" y2="90" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-zinc-800" />
        {data.map((d, i) => {
          const barH = (d.value / 5000) * 80;
          return (
            <g key={i} className="group cursor-pointer">
              <rect x={i * 50 + 10} y={90 - barH} width="16" height={barH} fill="#3b82f6" rx="2" className="hover:opacity-85 transition-opacity" />
              <title>{`Date: ${d.date}\nClicks: ${d.value.toLocaleString()}`}</title>
            </g>
          );
        })}
      </svg>
    );
  };

  // Custom SVG area chart helper for CTR
  const renderCtrChart = () => {
    if (!analytics || !analytics.charts.ctrTrend) return null;
    const data = analytics.charts.ctrTrend;
    const points = data.map((d, i) => `${i * 50 + 20},${100 - (d.rate / 6) * 80}`).join(' ');
    const areaPath = `M 20 90 L ${points} L 320 90 Z`;
    return (
      <svg className="w-full h-28 overflow-visible" viewBox="0 0 340 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id="ctrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        <line x1="10" y1="90" x2="330" y2="90" stroke="#e2e8f0" strokeWidth="1" className="dark:stroke-zinc-800" />
        <path d={areaPath} fill="url(#ctrGrad)" />
        <path d={points} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
        {data.map((d, i) => (
          <circle key={i} cx={i * 50 + 20} cy={100 - (d.rate / 6) * 80} r="3" fill="#10b981" stroke="white" strokeWidth="1" />
        ))}
      </svg>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Drawer Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full transform transition-all duration-300 animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                  <Layers size={14} />
                </span>
                Banner Performance Details
              </h3>
              <p className="text-[9.5px] text-zinc-500 mt-0.5">ID: {bannerId}</p>
            </div>
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded-full transition-all cursor-pointer"
            >
              <X size={16} />
            </button>
          </div>

          {loading || !banner ? (
            <div className="flex-1 flex flex-col justify-center items-center gap-2">
              <Loader2 className="w-7 h-7 text-[var(--primary)] animate-spin" />
              <span className="text-xs font-bold text-zinc-500">Querying DB stats...</span>
            </div>
          ) : (
            <>
              {/* Tab controller list */}
              <div className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/20 dark:bg-zinc-900/10 flex text-xs font-extrabold select-none">
                {['Overview', 'Schedule', 'Visibility', 'Analytics'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 text-center py-3 text-[10px] font-black border-b-2 transition-all uppercase tracking-wider ${
                      activeTab === tab 
                        ? 'border-b-[var(--primary)] text-[var(--primary)] bg-white dark:bg-zinc-950/20' 
                        : 'border-b-transparent text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-300'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                
                {/* Tab 1: OVERVIEW */}
                {activeTab === 'Overview' && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                    
                    <div className="w-full h-36 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-50 flex items-center justify-center">
                      <img src={banner.image} className="w-full h-full object-cover" alt="Banner Details Cover" />
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-805 space-y-3">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Banner Name</span>
                        <span className="font-extrabold text-zinc-900 dark:text-white mt-1 block leading-snug">{banner.title}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Banner Type</span>
                          <span className="font-bold text-zinc-850 dark:text-zinc-200 mt-0.5 block">{banner.bannerType}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Display Status</span>
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-extrabold mt-1 ${
                            derivedStatus === 'Disabled' ? 'bg-zinc-150 text-zinc-650 dark:bg-zinc-800 dark:text-zinc-400' :
                            derivedStatus === 'Scheduled' ? 'bg-blue-50 text-blue-700 dark:bg-blue-500/10' :
                            derivedStatus === 'Expired' ? 'bg-red-50 text-red-700 dark:bg-red-500/10' :
                            'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10'
                          }`}>
                            {derivedStatus}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Redirect Category</span>
                        <span className="font-extrabold text-zinc-900 dark:text-zinc-100 mt-1 block">{banner.redirectType}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Redirect Target ID</span>
                        <span className="font-semibold text-zinc-650 dark:text-zinc-350 mt-1 block truncate" title={banner.redirectId}>{banner.redirectId}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 border-t border-zinc-150 dark:border-zinc-800 pt-3">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Display Priority</span>
                        <span className="font-black text-[var(--primary)] mt-1 block">Weight {banner.priority} / 100</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider block">Published Date</span>
                        <span className="font-semibold text-zinc-650 dark:text-zinc-355 mt-1 block">
                          {new Date(banner.createdAt).toLocaleDateString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 2: SCHEDULE */}
                {activeTab === 'Schedule' && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-xs">
                    <div className="bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-805 space-y-3.5">
                      <div>
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">Start Publish Date</span>
                        <span className="font-bold text-zinc-900 dark:text-white mt-1 block">
                          {new Date(banner.startDate).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="border-t border-zinc-200 dark:border-zinc-800 pt-2.5">
                        <span className="text-[10px] text-zinc-400 font-bold uppercase block">Expiry End Date</span>
                        <span className="font-bold text-zinc-900 dark:text-white mt-1 block">
                          {new Date(banner.endDate).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-950/20 p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 flex gap-2">
                      <Info size={14} className="text-zinc-400 shrink-0 mt-0.5" />
                      <p className="text-[10px] text-zinc-500 leading-normal font-semibold">
                        This schedule represents when the banner will render on responsive layouts. High priority weights override layouts during scheduled overlap dates.
                      </p>
                    </div>
                  </div>
                )}

                {/* Tab 3: VISIBILITY */}
                {activeTab === 'Visibility' && (
                  <div className="space-y-4 animate-in fade-in duration-200 text-xs select-none">
                    <div className="space-y-3.5">
                      <div>
                        <span className="text-[10px] text-zinc-450 font-bold uppercase block">Regions Targeting ({regionNames.length})</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {regionNames.map((n, i) => (
                            <span key={i} className="px-2.5 py-0.5 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-350">{n}</span>
                          ))}
                          {regionNames.length === 0 && <span className="text-zinc-450 font-bold italic">All Regions (National Display)</span>}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-455 font-bold uppercase block">Franchises ({franchiseNames.length})</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-24 overflow-y-auto">
                          {franchiseNames.map((n, i) => (
                            <span key={i} className="px-2.5 py-0.5 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-355">{n}</span>
                          ))}
                          {franchiseNames.length === 0 && <span className="text-zinc-450 font-bold italic">All Franchises</span>}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] text-zinc-455 font-bold uppercase block">Stores Outlet Scope ({storeNames.length})</span>
                        <div className="flex flex-wrap gap-1.5 mt-1.5 max-h-28 overflow-y-auto">
                          {storeNames.map((n, i) => (
                            <span key={i} className="px-2.5 py-0.5 bg-zinc-50 dark:bg-zinc-800 rounded border border-zinc-200 dark:border-zinc-700 text-[10px] font-bold text-zinc-700 dark:text-zinc-350">{n}</span>
                          ))}
                          {storeNames.length === 0 && <span className="text-zinc-450 font-bold italic">All Outlets</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab 4: ANALYTICS */}
                {activeTab === 'Analytics' && analytics && (
                  <div className="space-y-5 animate-in fade-in duration-200 text-xs">
                    
                    {/* Analytics KPIs grid */}
                    <div className="grid grid-cols-2 gap-3.5 select-none">
                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[9px] text-zinc-450 font-bold uppercase block tracking-wide flex items-center gap-1">
                          <Eye size={11} className="text-zinc-400" /> Impressions
                        </span>
                        <h5 className="text-base font-black text-zinc-900 dark:text-white mt-1">{(analytics.impressions).toLocaleString()}</h5>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[9px] text-zinc-450 font-bold uppercase block tracking-wide flex items-center gap-1">
                          <MousePointerClick size={11} className="text-zinc-400" /> Clicks
                        </span>
                        <h5 className="text-base font-black text-zinc-900 dark:text-white mt-1">{(analytics.clicks).toLocaleString()}</h5>
                      </div>
                      <div className="bg-zinc-50 dark:bg-zinc-950/30 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805">
                        <span className="text-[9px] text-zinc-450 font-bold uppercase block tracking-wide flex items-center gap-1">
                          <Percent size={11} className="text-zinc-400" /> Click-Through Rate
                        </span>
                        <h5 className="text-base font-black text-zinc-900 dark:text-white mt-1">{analytics.ctr}%</h5>
                      </div>
                      <div className="bg-emerald-50/50 dark:bg-emerald-950/10 p-3 rounded-xl border border-emerald-500/10">
                        <span className="text-[9px] text-emerald-800 dark:text-emerald-450 font-bold uppercase block tracking-wide flex items-center gap-1">
                          <DollarSign size={11} className="text-emerald-500" /> Attributed Sales
                        </span>
                        <h5 className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{(analytics.revenueGenerated).toLocaleString()}</h5>
                      </div>
                    </div>

                    {/* Chart 1: Impressions Trend */}
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2 bg-white dark:bg-zinc-900/50 shadow-sm">
                      <div className="flex justify-between items-center select-none mb-1">
                        <span className="text-[9.5px] font-black text-zinc-450 uppercase tracking-wider block">Daily Impressions Trend</span>
                        <span className="text-[8.5px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Weekly</span>
                      </div>
                      {renderImpressionsChart()}
                    </div>

                    {/* Chart 2: Clicks Trend */}
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2 bg-white dark:bg-zinc-900/50 shadow-sm">
                      <div className="flex justify-between items-center select-none mb-1">
                        <span className="text-[9.5px] font-black text-zinc-450 uppercase tracking-wider block">Daily Clicks Split</span>
                        <span className="text-[8.5px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Weekly</span>
                      </div>
                      {renderClicksChart()}
                    </div>

                    {/* Chart 3: CTR Trend */}
                    <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl p-3.5 space-y-2 bg-white dark:bg-zinc-900/50 shadow-sm">
                      <div className="flex justify-between items-center select-none mb-1">
                        <span className="text-[9.5px] font-black text-zinc-450 uppercase tracking-wider block">Click Through Rate Trend (%)</span>
                        <span className="text-[8.5px] font-bold text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-1.5 py-0.5 rounded">Weekly</span>
                      </div>
                      {renderCtrChart()}
                    </div>

                  </div>
                )}

              </div>

              {/* Drawer Footer Actions */}
              <div className="px-5 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex gap-3.5 shrink-0 select-none">
                <button
                  onClick={() => onEdit(banner._id)}
                  className="flex-1 py-2 bg-[var(--primary)] hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 text-center cursor-pointer"
                >
                  Edit Banner Info
                </button>
                <button
                  onClick={onClose}
                  className="py-2 px-5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close Drawer
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
