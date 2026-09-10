import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Search, Bell, Smartphone, Mail, MessageSquare, 
  BarChart3, Loader2, ShieldAlert, Users, CheckCircle, 
  XCircle, Info, Calendar, Download, ChevronLeft, ChevronRight,
  TrendingUp, Percent, PieChart
} from 'lucide-react';
import { apiGetNotificationLogs, apiGetNotificationAnalytics } from './NotificationData';

export default function NotificationLogs({ notificationId, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('Charts'); // 'Charts' | 'Logs'
  const [logsData, setLogsData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Pagination for Device Logs
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    if (isOpen && notificationId) {
      setLoading(true);
      Promise.all([
        apiGetNotificationLogs(notificationId),
        apiGetNotificationAnalytics()
      ])
        .then(([logs, analytics]) => {
          setLogsData(logs);
          setAnalyticsData(analytics);
          setLoading(false);
        })
        .catch(err => {
          alert('Error loading logs & analytics: ' + err.message);
          setLoading(false);
          onClose();
        });
    }
  }, [isOpen, notificationId]);

  // Filter and Paginate Logs
  const filteredLogs = useMemo(() => {
    if (!logsData || !logsData.logs) return [];
    const query = searchTerm.toLowerCase().trim();
    if (!query) return logsData.logs;
    return logsData.logs.filter(log => 
      log.customer.toLowerCase().includes(query) ||
      log.device.toLowerCase().includes(query) ||
      log.status.toLowerCase().includes(query) ||
      (log.failureReason && log.failureReason.toLowerCase().includes(query))
    );
  }, [logsData, searchTerm]);

  const paginatedLogs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentPage]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  }, [filteredLogs]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (!isOpen) return null;

  // Render SVG charts
  const renderDeliveryChart = () => {
    if (!analyticsData || !analyticsData.charts.deliveryTrend) return null;
    const trend = analyticsData.charts.deliveryTrend;
    const pointsSent = trend.map((t, i) => `${i * 100 + 50},${180 - (t.sent / 30000) * 150}`).join(' ');
    const pointsDelivered = trend.map((t, i) => `${i * 100 + 50},${180 - (t.delivered / 30000) * 150}`).join(' ');

    return (
      <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="deliverySentGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="deliveryDelivGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1="50" y1="30" x2="650" y2="30" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
        <line x1="50" y1="80" x2="650" y2="80" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
        <line x1="50" y1="130" x2="650" y2="130" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
        <line x1="50" y1="180" x2="650" y2="180" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-zinc-700" />

        {/* Areas */}
        <path d={`M 50 180 L ${pointsSent} L 650 180 Z`} fill="url(#deliverySentGrad)" />
        <path d={`M 50 180 L ${pointsDelivered} L 650 180 Z`} fill="url(#deliveryDelivGrad)" />

        {/* Lines */}
        <path d={pointsSent} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
        <path d={pointsDelivered} fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />

        {/* X axis labels */}
        {trend.map((t, i) => (
          <text key={i} x={i * 100 + 50} y="196" textAnchor="middle" className="text-[9px] font-bold fill-zinc-400 dark:fill-zinc-500">
            {t.date}
          </text>
        ))}

        {/* Dots */}
        {trend.map((t, i) => (
          <g key={i} className="group/dot cursor-pointer">
            <circle cx={i * 100 + 50} cy={180 - (t.sent / 30000) * 150} r="4" fill="#3b82f6" stroke="white" strokeWidth="1.5" />
            <circle cx={i * 100 + 50} cy={180 - (t.delivered / 30000) * 150} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
            <title>{`Sent: ${t.sent.toLocaleString()}\nDelivered: ${t.delivered.toLocaleString()}`}</title>
          </g>
        ))}
      </svg>
    );
  };

  const renderOpenRateChart = () => {
    if (!analyticsData || !analyticsData.charts.openRateTrend) return null;
    const trend = analyticsData.charts.openRateTrend;
    const points = trend.map((t, i) => `${i * 100 + 50},${180 - (t.rate / 40) * 140}`).join(' ');

    return (
      <svg className="w-full h-full overflow-visible" viewBox="0 0 700 200" preserveAspectRatio="none">
        <defs>
          <linearGradient id="openRateGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--primary)" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Grid lines */}
        <line x1="50" y1="40" x2="650" y2="40" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
        <line x1="50" y1="90" x2="650" y2="90" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
        <line x1="50" y1="140" x2="650" y2="140" stroke="#f1f5f9" strokeWidth="1" className="dark:stroke-zinc-800" />
        <line x1="50" y1="180" x2="650" y2="180" stroke="#cbd5e1" strokeWidth="1.5" className="dark:stroke-zinc-700" />

        {/* Area */}
        <path d={`M 50 180 L ${points} L 650 180 Z`} fill="url(#openRateGrad)" />

        {/* Line */}
        <path d={points} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />

        {/* X axis labels */}
        {trend.map((t, i) => (
          <text key={i} x={i * 100 + 50} y="196" textAnchor="middle" className="text-[9px] font-bold fill-zinc-400 dark:fill-zinc-500">
            {t.date}
          </text>
        ))}

        {/* Dots */}
        {trend.map((t, i) => (
          <g key={i} className="group/dot cursor-pointer">
            <circle cx={i * 100 + 50} cy={180 - (t.rate / 40) * 140} r="4" fill="var(--primary)" stroke="white" strokeWidth="1.5" />
            <title>{`Open Rate: ${t.rate}%`}</title>
          </g>
        ))}
      </svg>
    );
  };

  const renderChannelDonut = () => {
    if (!analyticsData || !analyticsData.charts.channelDistribution) return null;
    const dist = analyticsData.charts.channelDistribution;
    
    // Percentages are: App Push: 50%, SMS: 30%, Email: 20%
    return (
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4" className="dark:stroke-zinc-800" />
          
          {/* Segment 1: App Push (50%) -> Dash: 50 50, Offset: 0 */}
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4" strokeDasharray="50 50" strokeDashoffset="0" />
          {/* Segment 2: SMS (30%) -> Dash: 30 70, Offset: -50 */}
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f97316" strokeWidth="4" strokeDasharray="30 70" strokeDashoffset="-50" />
          {/* Segment 3: Email (20%) -> Dash: 20 80, Offset: -80 */}
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="4" strokeDasharray="20 80" strokeDashoffset="-80" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-base font-extrabold text-zinc-800 dark:text-zinc-200">100k</span>
          <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold">Channels</span>
        </div>
      </div>
    );
  };

  const renderSuccessFailedBar = () => {
    if (!analyticsData || !analyticsData.charts.successVsFailed) return null;
    const dataList = analyticsData.charts.successVsFailed;
    
    return (
      <svg className="w-full h-full overflow-visible" viewBox="0 0 240 100" preserveAspectRatio="none">
        {dataList.map((item, i) => {
          const barW = 14;
          const gap = 16;
          const startX = 14 + i * (barW + gap);
          
          // Stacked Bars: total height = 90
          const successHeight = (item.success / 100) * 80;
          const failedHeight = (item.failed / 100) * 80;

          return (
            <g key={item.day} className="cursor-pointer group">
              {/* Success part */}
              <rect x={startX} y={90 - successHeight} width={barW} height={successHeight} fill="#10b981" rx="2" className="hover:opacity-90 transition-opacity" />
              {/* Failed part */}
              <rect x={startX} y={90 - successHeight - failedHeight} width={barW} height={failedHeight} fill="#ef4444" rx="2" className="hover:opacity-90 transition-opacity" />
              <title>{`${item.day}: Success ${item.success}%, Failed ${item.failed}%`}</title>
            </g>
          );
        })}
        {/* Bottom line */}
        <line x1="0" y1="90" x2="240" y2="90" stroke="#e2e8f0" strokeWidth="1.5" className="dark:stroke-zinc-800" />
      </svg>
    );
  };

  const renderAudiencePie = () => {
    if (!analyticsData || !analyticsData.charts.audienceRegions) return null;
    const regions = analyticsData.charts.audienceRegions;
    
    // Render custom pie segments or stacked ring representational charts
    // Let's draw a beautiful visual donut for simplicity with 4 regions:
    // North: 45%, South: 25%, West: 20%, East: 10%
    return (
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f1f5f9" strokeWidth="4.5" className="dark:stroke-zinc-800" />
          
          {/* North (45%) -> Dash: 45 55, Offset: 0 */}
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="4.5" strokeDasharray="45 55" strokeDashoffset="0" />
          {/* South (25%) -> Dash: 25 75, Offset: -45 */}
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#10b981" strokeWidth="4.5" strokeDasharray="25 75" strokeDashoffset="-45" />
          {/* West (20%) -> Dash: 20 80, Offset: -70 */}
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#f97316" strokeWidth="4.5" strokeDasharray="20 80" strokeDashoffset="-70" />
          {/* East (10%) -> Dash: 10 90, Offset: -90 */}
          <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="#a855f7" strokeWidth="4.5" strokeDasharray="10 90" strokeDashoffset="-90" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-sm font-black text-zinc-800 dark:text-zinc-200">Regions</span>
          <span className="text-[8px] uppercase tracking-wider text-zinc-400 font-bold">Split</span>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-[1400px] h-[820px] max-h-[95vh] rounded-2xl flex flex-col shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg">
                <BarChart3 size={16} />
              </span>
              Push Notification Logs &amp; Analytics
            </h2>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {loading ? 'Analyzing data...' : `Performance stats and delivery trace for "${logsData?.title}"`}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Tab Controllers */}
            {!loading && (
              <div className="bg-zinc-150 dark:bg-zinc-800 p-0.5 rounded-lg flex mr-2">
                <button
                  onClick={() => setActiveTab('Charts')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    activeTab === 'Charts' 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  Visual Analytics
                </button>
                <button
                  onClick={() => setActiveTab('Logs')}
                  className={`px-3 py-1 rounded-md text-xs font-bold transition-all ${
                    activeTab === 'Logs' 
                      ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm' 
                      : 'text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200'
                  }`}
                >
                  Device Logs ({filteredLogs.length})
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
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Loading delivery records...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-zinc-50/30 dark:bg-zinc-950/20">
            
            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Total Sent</span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">
                    {(logsData.kpi.sent).toLocaleString()}
                  </h4>
                  <p className="text-[9px] text-zinc-450 mt-0.5">Recipients targeted</p>
                </div>
                <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                  <Users size={14} />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Delivered</span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">
                    {(logsData.kpi.delivered).toLocaleString()}
                  </h4>
                  <p className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">
                    {logsData.kpi.successRate}% Success
                  </p>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
                  <CheckCircle size={14} />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Opened</span>
                  <h4 className="text-base font-black text-zinc-900 dark:text-zinc-100 mt-1">
                    {(logsData.kpi.opened).toLocaleString()}
                  </h4>
                  <p className="text-[9px] text-zinc-450 mt-0.5">
                    {((logsData.kpi.opened / logsData.kpi.delivered) * 100 || 0).toFixed(1)}% Open rate
                  </p>
                </div>
                <div className="p-2 bg-purple-500/10 text-purple-500 rounded-lg">
                  <Percent size={14} />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">Failed</span>
                  <h4 className="text-base font-black text-red-500 dark:text-red-400 mt-1">
                    {(logsData.kpi.failed).toLocaleString()}
                  </h4>
                  <p className="text-[9px] text-red-500/80 font-bold mt-0.5">Delivery failures</p>
                </div>
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                  <XCircle size={14} />
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl flex items-center justify-between shadow-sm bg-gradient-to-br from-emerald-500/5 to-teal-500/5 col-span-2 lg:col-span-1">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider block">Network Status</span>
                  <h4 className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-1">Healthy</h4>
                  <p className="text-[9px] text-zinc-450 mt-0.5">Delivery gateways active</p>
                </div>
                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <TrendingUp size={14} />
                </div>
              </div>

            </div>

            {/* TAB 1: VISUAL ANALYTICS */}
            {activeTab === 'Charts' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Upper row: Traffic line & Channel Donut */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  
                  {/* Delivery Trend (Grid Span: 8) */}
                  <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Delivery Trend (Last 7 Days)</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Daily comparison of notifications Sent vs Delivered</p>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] font-bold">
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500"></span> Sent</span>
                        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500"></span> Delivered</span>
                      </div>
                    </div>
                    
                    <div className="h-60 w-full relative pt-4">
                      {renderDeliveryChart()}
                    </div>
                  </div>

                  {/* Channel Split (Grid Span: 4) */}
                  <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2 shrink-0">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Channel Split</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Total notifications segmented by delivery media</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase"><PieChart size={14} /></span>
                    </div>

                    <div className="flex-1 flex items-center justify-center py-4">
                      {renderChannelDonut()}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] font-bold text-zinc-650 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-3 select-none">
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1 text-blue-500"><span className="w-2 h-2 rounded bg-blue-500"></span> Push</span>
                        <span className="text-zinc-800 dark:text-zinc-200 font-black">50%</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1 text-orange-500"><span className="w-2 h-2 rounded bg-orange-500"></span> SMS</span>
                        <span className="text-zinc-800 dark:text-zinc-200 font-black">30%</span>
                      </div>
                      <div className="flex flex-col items-center gap-1">
                        <span className="flex items-center gap-1 text-purple-500"><span className="w-2 h-2 rounded bg-purple-500"></span> Email</span>
                        <span className="text-zinc-800 dark:text-zinc-200 font-black">20%</span>
                      </div>
                    </div>
                  </div>

                </div>

                {/* Lower row: Open Rate, Success/Failed stack, Audience pie */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Open Rate Area Chart */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Open Rate Trend (%)</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Average customer open rate ratio over time</p>
                      </div>
                      <span className="text-[10px] text-[var(--primary)] font-bold">25.0% Avg</span>
                    </div>

                    <div className="h-44 w-full relative pt-2">
                      {renderOpenRateChart()}
                    </div>
                  </div>

                  {/* Success vs Failed Stacked Bar */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Delivery Quality Logs</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Daily breakdown of Successful vs Failed deliveries</p>
                      </div>
                      <div className="flex gap-2 text-[9px] font-bold select-none">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-sm"></span> Success</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 bg-red-500 rounded-sm"></span> Failed</span>
                      </div>
                    </div>

                    <div className="h-44 w-full relative pt-2">
                      {renderSuccessFailedBar()}
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-zinc-400 mt-1 select-none px-2">
                      <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
                    </div>
                  </div>

                  {/* Audience Region Pie */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-center mb-2 shrink-0">
                      <div>
                        <h4 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Audience Segmentation</h4>
                        <p className="text-[10px] text-zinc-500 mt-0.5">Recipients distribution across primary food zones</p>
                      </div>
                      <span className="text-[10px] text-zinc-400 font-bold uppercase"><PieChart size={14} /></span>
                    </div>

                    <div className="flex-1 flex items-center justify-center py-2">
                      {renderAudiencePie()}
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[9px] font-bold text-zinc-650 dark:text-zinc-400 border-t border-zinc-100 dark:border-zinc-800 pt-2 shrink-0 select-none">
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-blue-500 shrink-0"></span> North (45%)</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-emerald-500 shrink-0"></span> South (25%)</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-orange-500 shrink-0"></span> West (20%)</div>
                      <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded bg-purple-500 shrink-0"></span> East (10%)</div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* TAB 2: DEVICE LOGS */}
            {activeTab === 'Logs' && (
              <div className="space-y-4 animate-in fade-in duration-200">
                {/* Search / Filter logs */}
                <div className="flex gap-3 items-center bg-white dark:bg-zinc-900 p-3.5 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm">
                  <div className="relative flex-1">
                    <input 
                      className="w-full pl-8 pr-3 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs focus:ring-2 focus:ring-[var(--primary)] outline-none transition-all text-black dark:text-white placeholder:text-black/40 dark:placeholder:text-white/40 font-semibold" 
                      placeholder="Search logs by customer, status, device..." 
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search size={14} className="absolute left-2.5 top-2.5 text-zinc-450" />
                  </div>
                  <button className="flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white dark:bg-zinc-900 text-[var(--primary)] border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-bold hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-sm select-none">
                    <Download size={14} /> Export CSV
                  </button>
                </div>

                {/* Table */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-[10px] uppercase tracking-wider font-extrabold select-none">
                      <tr>
                        <th className="px-4 py-3">Log ID</th>
                        <th className="px-4 py-3">Customer</th>
                        <th className="px-4 py-3">Target Device</th>
                        <th className="px-4 py-3">Channel</th>
                        <th className="px-4 py-3">Delivered Time</th>
                        <th className="px-4 py-3">Opened Time</th>
                        <th className="px-4 py-3">Failure Reason</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-xs font-semibold">
                      {paginatedLogs.map((log) => (
                        <tr key={log.logId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/20 transition-colors">
                          <td className="px-4 py-3 text-zinc-900 dark:text-zinc-100 font-bold">{log.logId}</td>
                          <td className="px-4 py-3 text-zinc-700 dark:text-zinc-350">{log.customer}</td>
                          <td className="px-4 py-3 text-zinc-700 dark:text-zinc-350 flex items-center gap-1.5">
                            <Smartphone size={13} className="text-zinc-400" />
                            {log.device}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex items-center gap-1 text-[10px] text-zinc-600 dark:text-zinc-300">
                              {log.channel === 'App Push' && <Bell size={12} className="text-blue-500" />}
                              {log.channel === 'SMS' && <MessageSquare size={12} className="text-orange-500" />}
                              {log.channel === 'Email' && <Mail size={12} className="text-purple-500" />}
                              {log.channel === 'Multi Channel' && <Users size={12} className="text-emerald-500" />}
                              {log.channel}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{log.deliveredTime}</td>
                          <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">{log.openedTime}</td>
                          <td className="px-4 py-3">
                            {log.failureReason !== '--' ? (
                              <span className="text-red-550 dark:text-red-400 font-bold flex items-center gap-1">
                                <ShieldAlert size={12} />
                                {log.failureReason}
                              </span>
                            ) : (
                              <span className="text-zinc-400 font-semibold italic">No errors</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold ${
                              log.status === 'Opened' ? 'bg-purple-100 text-purple-700 dark:bg-purple-500/10' :
                              log.status === 'Delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10' :
                              'bg-red-100 text-red-700 dark:bg-red-500/10'
                            }`}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {filteredLogs.length === 0 && (
                        <tr>
                          <td colSpan="8" className="px-4 py-8 text-center text-zinc-450 dark:text-zinc-500 font-extrabold">
                            No matching logs found. Try another query.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Pagination footer */}
                  <div className="px-4 py-3 flex justify-between items-center border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 select-none">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                      Showing {(currentPage-1)*itemsPerPage+1} - {Math.min(currentPage*itemsPerPage, filteredLogs.length)} of {filteredLogs.length} entries
                    </p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                        className="p-1 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <button 
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                        className="p-1 border border-zinc-300 dark:border-zinc-700 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-350 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end shrink-0 select-none">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-850 dark:hover:bg-zinc-855 text-zinc-750 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
          >
            Close Logs View
          </button>
        </div>

      </div>
    </div>
  );
}
