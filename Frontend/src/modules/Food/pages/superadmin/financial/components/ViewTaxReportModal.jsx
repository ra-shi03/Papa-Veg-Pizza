import React, { useState } from 'react';
import { X, FileText, Download, Landmark, FileSpreadsheet, Activity, Search, ArrowUpDown, Calendar, HelpCircle, AlertCircle } from 'lucide-react';
import { useTaxReportDetails, useExportTaxReports } from '../hooks/useTaxQuery';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, PieChart, Pie, Cell, Legend } from 'recharts';

export default function ViewTaxReportModal({ isOpen, onClose, reportId }) {
  const { data: details, loading } = useTaxReportDetails(reportId);
  const { exportReport, exportLoading } = useExportTaxReports();
  const [activeTab, setActiveTab] = useState('summary');
  
  // Table search & sort states
  const [stateSearch, setStateSearch] = useState('');
  const [franchiseSearch, setFranchiseSearch] = useState('');
  
  const [stateSortConfig, setStateSortConfig] = useState({ key: 'sales', direction: 'desc' });
  const [franchiseSortConfig, setFranchiseSortConfig] = useState({ key: 'taxCollected', direction: 'desc' });

  if (!isOpen) return null;

  const COLORS = ['#A42C12', '#F59E0B', '#10B981', '#3B82F6'];

  const requestSortState = (key) => {
    let direction = 'asc';
    if (stateSortConfig.key === key && stateSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setStateSortConfig({ key, direction });
  };

  const requestSortFranchise = (key) => {
    let direction = 'asc';
    if (franchiseSortConfig.key === key && franchiseSortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setFranchiseSortConfig({ key, direction });
  };

  const handleDownload = async (format) => {
    if (!reportId) return;
    await exportReport(format, reportId);
  };

  // Safe table data handling
  const stateBreakdown = details?.stateBreakdown || [];
  const franchiseBreakdown = details?.franchiseBreakdown || [];
  const auditLogs = details?.auditLogs || [];

  // Sort and Filter States
  const filteredStates = stateBreakdown
    .filter(row => row.state.toLowerCase().includes(stateSearch.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[stateSortConfig.key];
      const bVal = b[stateSortConfig.key];
      if (typeof aVal === 'string') {
        return stateSortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return stateSortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

  // Sort and Filter Franchises
  const filteredFranchises = franchiseBreakdown
    .filter(row => row.franchise.toLowerCase().includes(franchiseSearch.toLowerCase()))
    .sort((a, b) => {
      const aVal = a[franchiseSortConfig.key];
      const bVal = b[franchiseSortConfig.key];
      if (typeof aVal === 'string') {
        return franchiseSortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      return franchiseSortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 flex items-start justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div 
        className="relative w-full max-w-[1400px] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] shadow-inner">
              <FileText size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-extrabold text-black dark:text-white">
                  Compliance Tax Audit Ledger
                </h3>
                <span className="text-[10px] font-bold text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-0.5 rounded border border-[var(--primary)]/20 font-mono">
                  {reportId}
                </span>
              </div>
              <p className="text-[10px] font-semibold text-zinc-550 dark:text-zinc-400 mt-0.5">
                Overview of GST compliance calculations, regional state splits, franchise summaries, and audit logs
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Loading State */}
        {loading || !details ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="w-10 h-10 border-4 border-[var(--primary)]/20 border-t-[var(--primary)] rounded-full animate-spin"></div>
            <p className="text-xs font-bold text-zinc-500">Loading audit ledger data...</p>
          </div>
        ) : (
          <>
            {/* Metadata Summary Info Bar */}
            <div className="px-6 py-3 bg-zinc-100/50 dark:bg-zinc-900/30 border-b border-zinc-200 dark:border-zinc-800 flex flex-wrap justify-between items-center gap-4 text-xs font-bold shrink-0 text-zinc-650 dark:text-zinc-300">
              <div className="flex flex-wrap items-center gap-x-6 gap-y-1">
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-zinc-400" />
                  <span>Period: <span className="text-black dark:text-white font-extrabold">{details.period}</span></span>
                </div>
                <span>•</span>
                <span>Financial Year: <span className="text-black dark:text-white font-extrabold">{details.financialYear}</span></span>
                <span>•</span>
                <span>Quarter: <span className="text-black dark:text-white font-extrabold">{details.quarter}</span></span>
                <span>•</span>
                <span>Month: <span className="text-black dark:text-white font-extrabold">{details.month}</span></span>
              </div>

              {/* Status Badge */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-widest text-emerald-600 dark:text-emerald-450 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-extrabold">
                  Status: Compiled & Verified
                </span>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="px-6 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center gap-6 shrink-0">
              {[
                { id: 'summary', label: 'Summary & Analytics', icon: Activity },
                { id: 'regional', label: 'Regional splits & Franchises', icon: Landmark },
                { id: 'audit', label: 'Compliance Audit trail', icon: FileSpreadsheet }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`py-3 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                      activeTab === tab.id
                        ? 'border-[var(--primary)] text-[var(--primary)]'
                        : 'border-transparent text-zinc-450 dark:text-zinc-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    <Icon size={14} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Modal Body Scroll Container */}
            <div className="p-6 overflow-y-auto max-h-[calc(100vh-270px)] custom-scrollbar space-y-6 flex-1">
              
              {/* TAB 1: SUMMARY & ANALYTICS */}
              {activeTab === 'summary' && (
                <div className="space-y-6">
                  {/* KPI Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Gross Sales</span>
                      <p className="text-base font-extrabold text-zinc-900 dark:text-white mt-1">₹ {details.sales.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-400 mt-1 font-semibold">Total Revenue Recorded</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Taxable Amount</span>
                      <p className="text-base font-extrabold text-zinc-900 dark:text-white mt-1">₹ {details.taxableSales.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-400 mt-1 font-semibold">Net Eligible for GST Slabs</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-bold text-[var(--primary)]">Total GST Collected</span>
                      <p className="text-base font-extrabold text-[var(--primary)] mt-1">₹ {details.totalTax.toLocaleString('en-IN')}</p>
                      <p className="text-[9px] text-[var(--primary)]/80 mt-1 font-semibold">Sum of CGST + SGST + IGST + Cess</p>
                    </div>
                    <div className="p-4 bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 rounded-xl">
                      <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Invoice Count</span>
                      <p className="text-base font-extrabold text-zinc-900 dark:text-white mt-1">{details.invoiceCount.toLocaleString()}</p>
                      <p className="text-[9px] text-zinc-450 dark:text-zinc-400 mt-1 font-semibold">Total Auditable Billings</p>
                    </div>
                  </div>

                  {/* GST Type Breakdown Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-zinc-50/50 dark:bg-zinc-950/10 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Central GST (CGST)</span>
                      <p className="text-sm font-bold text-zinc-805 dark:text-zinc-200">₹ {details.breakdown.cgst.toLocaleString('en-IN')}</p>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-[var(--primary)] h-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">State GST (SGST)</span>
                      <p className="text-sm font-bold text-zinc-805 dark:text-zinc-200">₹ {details.breakdown.sgst.toLocaleString('en-IN')}</p>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-amber-500 h-full" style={{ width: '25%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Integrated GST (IGST)</span>
                      <p className="text-sm font-bold text-zinc-805 dark:text-zinc-200">₹ {details.breakdown.igst.toLocaleString('en-IN')}</p>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-emerald-500 h-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-wider">Compensatory Cess</span>
                      <p className="text-sm font-bold text-zinc-805 dark:text-zinc-200">₹ {details.breakdown.cess.toLocaleString('en-IN')}</p>
                      <div className="w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden mt-2">
                        <div className="bg-blue-500 h-full" style={{ width: '5%' }}></div>
                      </div>
                    </div>
                  </div>

                  {/* Recharts Graphs Area */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Trend Line (7 Cols) */}
                    <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl p-5">
                      <h4 className="text-xs font-extrabold text-black dark:text-white mb-4 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity size={14} className="text-[var(--primary)]" />
                        GST Collections Trend (INR LAKHS)
                      </h4>
                      <div className="h-[280px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={details.charts?.trends}>
                            <defs>
                              <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#71717a" fontSize={10} tickLine={false} />
                            <YAxis stroke="#71717a" fontSize={10} tickLine={false} />
                            <RechartsTooltip 
                              contentStyle={{ 
                                backgroundColor: 'rgb(24 24 27)', 
                                border: '1px solid rgb(39 39 42)',
                                borderRadius: '8px',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }} 
                            />
                            <Area type="monotone" dataKey="sales" name="Sales Vol." stroke="var(--primary)" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2} />
                            <Area type="monotone" dataKey="cgst" name="CGST" stroke="#F59E0B" fill="none" strokeWidth={1.5} />
                            <Area type="monotone" dataKey="igst" name="IGST" stroke="#10B981" fill="none" strokeWidth={1.5} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Tax distribution Pie (5 Cols) */}
                    <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl p-5 flex flex-col justify-between">
                      <h4 className="text-xs font-extrabold text-black dark:text-white mb-4 uppercase tracking-wider flex items-center gap-1.5">
                        <Activity size={14} className="text-[var(--primary)]" />
                        Tax component distribution
                      </h4>
                      <div className="h-[200px] flex items-center justify-center">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={details.charts?.distribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={55}
                              outerRadius={75}
                              paddingAngle={3}
                              dataKey="value"
                            >
                              {details.charts?.distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <RechartsTooltip />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="text-[10px] text-zinc-450 dark:text-zinc-500 text-center font-bold mt-2">
                        IGST accounts for the largest share due to inter-state raw material supplies.
                      </div>
                    </div>
                  </div>

                  {/* Download Center cards */}
                  <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-250 dark:border-zinc-800 rounded-xl p-5">
                    <h4 className="text-xs font-extrabold text-black dark:text-white mb-3 uppercase tracking-wider flex items-center gap-1.5">
                      <Download size={14} className="text-[var(--primary)]" />
                      Filing download Center
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {/* PDF Report Card */}
                      <div 
                        onClick={() => handleDownload('pdf')}
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:border-[var(--primary)] rounded-lg cursor-pointer flex items-center justify-between transition-all group hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-rose-50 dark:bg-rose-950/20 text-rose-550 shrink-0">
                            <FileText size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-white">Tax Ledger Statement</p>
                            <p className="text-[9px] text-zinc-450 dark:text-zinc-400 font-semibold mt-0.5">Formal regulatory PDF</p>
                          </div>
                        </div>
                        <Download size={13} className="text-zinc-400 group-hover:text-[var(--primary)] transition-colors" />
                      </div>

                      {/* Excel Card */}
                      <div 
                        onClick={() => handleDownload('excel')}
                        className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 hover:border-emerald-500 rounded-lg cursor-pointer flex items-center justify-between transition-all group hover:shadow-md"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/20 text-emerald-650 shrink-0">
                            <FileSpreadsheet size={16} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-zinc-900 dark:text-white">Transaction details</p>
                            <p className="text-[9px] text-zinc-450 dark:text-zinc-400 font-semibold mt-0.5">Spreadsheet compatible CSV</p>
                          </div>
                        </div>
                        <Download size={13} className="text-zinc-400 group-hover:text-emerald-500 transition-colors" />
                      </div>

                      {/* Info box */}
                      <div className="p-3 rounded-lg border border-dashed border-zinc-250 dark:border-zinc-800 text-[10px] text-zinc-450 font-bold flex items-center gap-2">
                        <AlertCircle size={16} className="text-[var(--primary)] shrink-0" />
                        Compliance compilation triggers signature hashing log inside compliance audit trail.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: REGIONAL SPLITS & FRANCHISES */}
              {activeTab === 'regional' && (
                <div className="space-y-6">
                  {/* Grid for State and Franchise tables */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    
                    {/* STATE BREAKDOWN */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col h-[480px]">
                      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                        <h4 className="text-xs font-extrabold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Landmark size={14} className="text-[var(--primary)]" />
                          State GST Allocation breakdown
                        </h4>
                        
                        {/* Search Input */}
                        <div className="relative">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Filter states..."
                            value={stateSearch}
                            onChange={(e) => setStateSearch(e.target.value)}
                            className="pl-7 pr-3 h-7 w-40 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-[10px] font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                          />
                        </div>
                      </div>

                      {/* States Table */}
                      <div className="overflow-auto border border-zinc-150 dark:border-zinc-850 rounded-lg flex-1 custom-scrollbar">
                        <table className="w-full text-[11px] font-semibold text-left text-zinc-700 dark:text-zinc-300">
                          <thead className="text-[9px] text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-950/60 sticky top-0 border-b border-zinc-200 dark:border-zinc-850">
                            <tr>
                              <th className="px-4 py-2">State</th>
                              <th className="px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => requestSortState('sales')}>
                                <div className="flex items-center gap-1">
                                  Gross Sales
                                  <ArrowUpDown size={10} />
                                </div>
                              </th>
                              <th className="px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => requestSortState('cgst')}>
                                <div className="flex items-center gap-1">
                                  CGST
                                  <ArrowUpDown size={10} />
                                </div>
                              </th>
                              <th className="px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => requestSortState('igst')}>
                                <div className="flex items-center gap-1">
                                  IGST
                                  <ArrowUpDown size={10} />
                                </div>
                              </th>
                              <th className="px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => requestSortState('totalTax')}>
                                <div className="flex items-center gap-1">
                                  Total Tax
                                  <ArrowUpDown size={10} />
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                            {filteredStates.length > 0 ? (
                              filteredStates.map((row, idx) => (
                                <tr key={idx} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-850/40">
                                  <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-white">{row.state}</td>
                                  <td className="px-4 py-2.5">₹ {row.sales.toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5">₹ {row.cgst.toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5">₹ {row.igst.toLocaleString('en-IN')}</td>
                                  <td className="px-4 py-2.5 font-bold text-[var(--primary)]">₹ {row.totalTax.toLocaleString('en-IN')}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={5} className="py-8 text-center text-zinc-400 font-bold">No state matching search filters.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* FRANCHISE BREAKDOWN */}
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col h-[480px]">
                      <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
                        <h4 className="text-xs font-extrabold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                          <Landmark size={14} className="text-[var(--primary)]" />
                          Franchise-wise Sales tax collected
                        </h4>
                        
                        {/* Search Input */}
                        <div className="relative">
                          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Filter franchises..."
                            value={franchiseSearch}
                            onChange={(e) => setFranchiseSearch(e.target.value)}
                            className="pl-7 pr-3 h-7 w-40 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-md text-[10px] font-bold focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-white"
                          />
                        </div>
                      </div>

                      {/* Franchise Table */}
                      <div className="overflow-auto border border-zinc-150 dark:border-zinc-850 rounded-lg flex-1 custom-scrollbar">
                        <table className="w-full text-[11px] font-semibold text-left text-zinc-700 dark:text-zinc-300">
                          <thead className="text-[9px] text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-950/60 sticky top-0 border-b border-zinc-200 dark:border-zinc-850">
                            <tr>
                              <th className="px-4 py-2">Franchise</th>
                              <th className="px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => requestSortFranchise('orders')}>
                                <div className="flex items-center gap-1">
                                  Total Orders
                                  <ArrowUpDown size={10} />
                                </div>
                              </th>
                              <th className="px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => requestSortFranchise('invoiceCount')}>
                                <div className="flex items-center gap-1">
                                  Invoices
                                  <ArrowUpDown size={10} />
                                </div>
                              </th>
                              <th className="px-4 py-2 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => requestSortFranchise('taxCollected')}>
                                <div className="flex items-center gap-1">
                                  Tax Collected
                                  <ArrowUpDown size={10} />
                                </div>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                            {filteredFranchises.length > 0 ? (
                              filteredFranchises.map((row, idx) => (
                                <tr key={idx} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-850/40">
                                  <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-white">{row.franchise}</td>
                                  <td className="px-4 py-2.5">{row.orders.toLocaleString()}</td>
                                  <td className="px-4 py-2.5">{row.invoiceCount.toLocaleString()} Bills</td>
                                  <td className="px-4 py-2.5 font-bold text-[var(--primary)]">₹ {row.taxCollected.toLocaleString('en-IN')}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan={4} className="py-8 text-center text-zinc-400 font-bold">No franchises matching filter.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AUDIT TRAIL LOGS */}
              {activeTab === 'audit' && (
                <div className="space-y-6">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-250 dark:border-zinc-800 rounded-xl p-5">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-xs font-extrabold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                        <Activity size={14} className="text-[var(--primary)]" />
                        Report-Specific Compliance Logs
                      </h4>
                      <span className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                        <AlertCircle size={12} className="text-amber-500" />
                        These actions are signed with SHA-256 for integrity.
                      </span>
                    </div>

                    {/* Audit Logs Table */}
                    <div className="overflow-x-auto border border-zinc-150 dark:border-zinc-850 rounded-lg">
                      <table className="w-full text-[11px] font-semibold text-left text-zinc-700 dark:text-zinc-300">
                        <thead className="text-[9px] text-zinc-400 uppercase tracking-widest bg-zinc-50 dark:bg-zinc-950/60 border-b border-zinc-200 dark:border-zinc-850">
                          <tr>
                            <th className="px-4 py-2">Action</th>
                            <th className="px-4 py-2">Operator</th>
                            <th className="px-4 py-2">Timestamp</th>
                            <th className="px-4 py-2">Regulatory Remarks</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-850">
                          {auditLogs.length > 0 ? (
                            auditLogs.map((log, idx) => (
                              <tr key={idx} className="hover:bg-zinc-50/55 dark:hover:bg-zinc-850/40">
                                <td className="px-4 py-2.5 font-bold">
                                  <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wide font-extrabold ${
                                    log.action === 'Generated' 
                                      ? 'bg-emerald-500/10 text-emerald-650'
                                      : log.action === 'Downloaded'
                                      ? 'bg-blue-500/10 text-blue-650'
                                      : 'bg-zinc-500/10 text-zinc-650'
                                  }`}>
                                    {log.action}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-white">{log.performedBy}</td>
                                <td className="px-4 py-2.5 font-mono text-zinc-450">{log.date}</td>
                                <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400">{log.remarks}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={4} className="py-8 text-center text-zinc-400 font-bold">No compliance audit trail logs recorded.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Footer */}
            <div className="px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
              <button
                onClick={onClose}
                className="px-4 py-1.5 border border-zinc-350 dark:border-zinc-800 text-zinc-750 dark:text-zinc-300 text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors cursor-pointer"
              >
                Close Audit Details
              </button>

              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={exportLoading}
                  className="px-4 py-1.5 border border-zinc-250 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-xs font-bold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Export CSV
                </button>
                <button
                  onClick={() => handleDownload('pdf')}
                  disabled={exportLoading}
                  className="px-4 py-1.5 bg-[var(--primary)] hover:brightness-110 text-white text-xs font-bold rounded-lg shadow active:scale-95 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Download size={13} />
                  Filing PDF
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
