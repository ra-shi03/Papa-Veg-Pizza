import React, { useState, useEffect } from 'react';
import { X, Search, Check, ChevronDown, Award, Sparkles, AlertCircle } from 'lucide-react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend
} from 'recharts';
import { useStores, useCompareStores } from '../hooks/useStoreAnalyticsQuery';
import { Skeleton } from '../../../../components/ui/skeleton';

export default function CompareStoresModal({ isOpen, onClose }) {
  const { data: storeOptions, loading: loadingStores } = useStores();
  const { compare, data: comparisonData, loading: comparing } = useCompareStores();

  const [selectedIds, setSelectedIds] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [compared, setCompared] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Auto-populate first two stores for instant comparison on load
      if (storeOptions && storeOptions.length >= 2 && selectedIds.length === 0) {
        setSelectedIds([storeOptions[0].id, storeOptions[1].id]);
      }
    } else {
      setDropdownOpen(false);
      setSearchTerm('');
      setCompared(false);
    }
  }, [isOpen, storeOptions]);

  if (!isOpen) return null;

  const toggleStore = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(item => item !== id));
    } else {
      if (selectedIds.length >= 5) {
        toast.warning('You can compare a maximum of 5 stores.');
        return;
      }
      setSelectedIds(prev => [...prev, id]);
    }
    setCompared(false);
  };

  const removeStore = (id) => {
    setSelectedIds(prev => prev.filter(item => item !== id));
    setCompared(false);
  };

  const handleCompare = () => {
    if (selectedIds.length < 2) {
      return;
    }
    compare(selectedIds);
    setCompared(true);
  };

  const filteredOptions = storeOptions?.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.id.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  // Metrics definitions
  // isLowerBest: true for prep time, refund %, cancellation rate. False for others.
  const METRICS = [
    { key: 'revenue', label: 'Revenue (₹)', format: v => `₹${v.toLocaleString('en-IN')}`, isLowerBest: false },
    { key: 'orders', label: 'Orders Count', format: v => v.toLocaleString(), isLowerBest: false },
    { key: 'rating', label: 'Average Rating', format: v => `${v.toFixed(1)} ★`, isLowerBest: false },
    { key: 'prepTime', label: 'Prep Time (mins)', format: v => `${v} mins`, isLowerBest: true },
    { key: 'refundPct', label: 'Refund Rate (%)', format: v => `${v.toFixed(1)}%`, isLowerBest: true },
    { key: 'csat', label: 'Satisfaction (CSAT)', format: v => `${v}%`, isLowerBest: false },
    { key: 'profit', label: 'Profit (₹)', format: v => `₹${v.toLocaleString('en-IN')}`, isLowerBest: false },
    { key: 'cancelRate', label: 'Cancellation (%)', format: v => `${v.toFixed(1)}%`, isLowerBest: true },
    { key: 'inventoryHealth', label: 'Inventory Health (%)', format: v => `${v}%`, isLowerBest: false }
  ];

  // Helper to find the best performing value's store index for a given metric
  const getBestStoreIndex = (metricKey, isLowerBest) => {
    if (!comparisonData || comparisonData.length === 0) return -1;
    let bestVal = comparisonData[0][metricKey];
    let bestIdx = 0;

    for (let i = 1; i < comparisonData.length; i++) {
      const curVal = comparisonData[i][metricKey];
      if (isLowerBest) {
        if (curVal < bestVal) {
          bestVal = curVal;
          bestIdx = i;
        }
      } else {
        if (curVal > bestVal) {
          bestVal = curVal;
          bestIdx = i;
        }
      }
    }
    return bestIdx;
  };

  // Normalization logic for Radar Chart mapping (0 to 100)
  const getRadarData = () => {
    if (!comparisonData || comparisonData.length === 0) return [];
    
    return METRICS.map(m => {
      const row = { subject: m.label };
      
      // Find max/min boundaries to normalize between 0 and 100
      const vals = comparisonData.map(s => s[m.key]);
      const maxVal = Math.max(...vals, 1);
      const minVal = Math.min(...vals, 0);
      const range = maxVal - minVal;

      comparisonData.forEach((s, idx) => {
        const val = s[m.key];
        let normalized = 0;
        
        if (m.isLowerBest) {
          // For lower is better, invert the scale: max value gets lowest score, min value gets highest score
          normalized = maxVal === val ? 25 : range > 0 ? 100 - ((val - minVal) / range) * 75 : 100;
        } else {
          normalized = range > 0 ? ((val - minVal) / range) * 80 + 20 : 100;
        }
        row[`store_${idx}`] = Math.round(normalized);
        row[`store_${idx}_label`] = m.format(val);
      });
      
      return row;
    });
  };

  const radarData = getRadarData();
  
  // Palette for Radar strokes
  const CHART_COLORS = [
    { stroke: 'var(--primary, #a43c12)', fill: 'var(--primary, #a43c12)', fillOpacity: 0.15 },
    { stroke: '#38bdf8', fill: '#38bdf8', fillOpacity: 0.15 },
    { stroke: '#10b981', fill: '#10b981', fillOpacity: 0.15 },
    { stroke: '#eab308', fill: '#eab308', fillOpacity: 0.15 },
    { stroke: '#a855f7', fill: '#a855f7', fillOpacity: 0.15 }
  ];

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-[1400px] bg-zinc-50 dark:bg-zinc-950 rounded-2xl shadow-2xl flex flex-col relative border border-zinc-200 dark:border-zinc-800 max-h-[92vh] overflow-hidden my-auto">
        
        {/* Modal Header */}
        <header className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-white dark:bg-zinc-900 rounded-t-2xl shrink-0 z-10 shadow-sm">
          <div className="flex items-center gap-2">
            <Sparkles className="text-[var(--primary)]" size={18} />
            <h2 className="text-base font-extrabold text-black dark:text-white">Store Comparison Dashboard</h2>
            <span className="bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold px-2 py-0.5 rounded-full border border-zinc-250 dark:border-zinc-700">
              Up to 5 channels
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </header>

        {/* Modal Scroll Content */}
        <main className="flex-1 overflow-y-auto p-4 space-y-4 font-semibold text-zinc-800 dark:text-zinc-200 text-xs">
          
          {/* Custom Selector Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl shadow-sm space-y-3.5 relative">
            <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Select Stores to Compare</h3>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Dropdown Controller */}
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="px-4 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg hover:border-[var(--primary)] transition-all flex items-center gap-2.5 text-zinc-700 dark:text-zinc-300 font-extrabold cursor-pointer"
                >
                  <span>Select Stores ({selectedIds.length})</span>
                  <ChevronDown size={14} className={`transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Options Box */}
                {dropdownOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl z-30 p-2 space-y-2 animate-fade-down">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 text-zinc-400" size={13} />
                      <input
                        type="text"
                        placeholder="Search stores..."
                        className="w-full text-xs pl-8 pr-3 py-1.5 border border-zinc-150 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950 text-black dark:text-white focus:outline-none focus:border-[var(--primary)]"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto pr-1 scrollbar-thin space-y-0.5">
                      {loadingStores ? (
                        <div className="py-4 text-center text-zinc-400">Loading options...</div>
                      ) : filteredOptions.length > 0 ? (
                        filteredOptions.map((s) => {
                          const isSelected = selectedIds.includes(s.id);
                          return (
                            <button
                              key={s.id}
                              onClick={() => toggleStore(s.id)}
                              className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-extrabold'
                                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                              }`}
                            >
                              <div className="truncate">
                                <p className="font-bold truncate">{s.name}</p>
                                <p className="text-[9px] text-zinc-400 uppercase font-bold">{s.id}</p>
                              </div>
                              {isSelected && <Check size={14} className="stroke-[2.5]" />}
                            </button>
                          );
                        })
                      ) : (
                        <div className="py-4 text-center text-zinc-400 italic">No stores found.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <button
                onClick={handleCompare}
                disabled={selectedIds.length < 2 || comparing}
                className="px-5 py-2 rounded-lg bg-[var(--primary)] text-white shadow-md text-xs font-bold uppercase tracking-wider hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-opacity active:scale-[0.98]"
              >
                {comparing ? 'Processing...' : 'Run Comparison'}
              </button>

              <div className="h-6 w-px bg-zinc-250 dark:bg-zinc-800 hidden sm:block"></div>

              {/* Selected Pills */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1">
                {selectedIds.map(id => {
                  const storeName = storeOptions?.find(s => s.id === id)?.name || id;
                  return (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1 bg-zinc-100 dark:bg-zinc-800 text-black dark:text-white border border-zinc-200 dark:border-zinc-700 rounded-lg px-2.5 py-1 text-[11px] font-bold"
                    >
                      <span className="truncate max-w-[120px]">{storeName}</span>
                      <button
                        onClick={() => removeStore(id)}
                        className="hover:text-rose-500 text-zinc-400 cursor-pointer shrink-0 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  );
                })}
                {selectedIds.length < 2 && (
                  <p className="text-[10px] text-zinc-400 font-bold flex items-center gap-1 italic">
                    <AlertCircle size={12} className="text-amber-500" />
                    Please select at least 2 stores.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Result Views */}
          {comparing ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Skeleton className="h-96 rounded-xl" />
              <Skeleton className="h-96 rounded-xl" />
            </div>
          ) : compared && comparisonData.length >= 2 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 animate-fade-in">
              
              {/* Radar Performance Comparison */}
              <div className="lg:col-span-5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 flex flex-col justify-between shadow-sm min-h-[420px]">
                <div>
                  <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider">Performance Radar Layout</h3>
                  <p className="text-[9px] text-zinc-450 dark:text-zinc-400 font-semibold mt-0.5">
                    Normalized index (higher area represents better score)
                  </p>
                </div>

                <div className="h-[280px] w-full flex items-center justify-center mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                      <PolarGrid stroke="#e4e4e7" strokeWidth={1} />
                      <PolarAngleAxis dataKey="subject" fontSize={8} fontWeight="bold" stroke="#71717a" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} fontSize={8} stroke="#d4d4d8" />
                      
                      {comparisonData.map((s, idx) => (
                        <Radar
                          key={s.id}
                          name={s.name}
                          dataKey={`store_${idx}`}
                          stroke={CHART_COLORS[idx % CHART_COLORS.length].stroke}
                          fill={CHART_COLORS[idx % CHART_COLORS.length].fill}
                          fillOpacity={CHART_COLORS[idx % CHART_COLORS.length].fillOpacity}
                        />
                      ))}
                      <Legend iconSize={10} wrapperStyle={{ fontSize: '9px', fontWeight: 'bold', paddingTop: '10px' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Grid Side-by-side Table */}
              <div className="lg:col-span-7 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-sm overflow-hidden flex flex-col justify-between min-h-[420px]">
                <table className="w-full text-left text-xs divide-y divide-zinc-200 dark:divide-zinc-800">
                  <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-550 dark:text-zinc-450 font-bold uppercase tracking-wider text-[9px]">
                    <tr>
                      <th className="px-4 py-3">Key Metrics</th>
                      {comparisonData.map((s, index) => (
                        <th key={s.id} className="px-4 py-3 text-center truncate max-w-[120px]" title={s.name}>
                          <div className="flex flex-col items-center">
                            <span className="w-2.5 h-2.5 rounded-full mb-1 shrink-0" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length].stroke }} />
                            <span className="truncate max-w-[110px] font-extrabold text-black dark:text-white leading-tight">{s.name}</span>
                            <span className="text-[8px] text-zinc-400 uppercase font-bold mt-0.5 tracking-wider">ID: {s.id}</span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-850 dark:text-zinc-200">
                    {METRICS.map((metric) => {
                      const bestIdx = getBestStoreIndex(metric.key, metric.isLowerBest);
                      return (
                        <tr key={metric.key} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/10 transition-colors">
                          <td className="px-4 py-2.5 text-zinc-650 dark:text-zinc-350 font-bold">{metric.label}</td>
                          {comparisonData.map((s, idx) => {
                            const isBest = idx === bestIdx;
                            const rawVal = s[metric.key];
                            return (
                              <td
                                key={s.id}
                                className={`px-4 py-2.5 text-center font-mono text-xs ${
                                  isBest
                                    ? 'bg-emerald-500/5 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-450 font-black'
                                    : ''
                                }`}
                              >
                                <div className="flex items-center justify-center gap-1">
                                  <span>{metric.format(rawVal)}</span>
                                  {isBest && (
                                    <Award size={12} className="text-yellow-500 shrink-0 fill-yellow-500/20" title="Best Performance" />
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <div className="p-3 border-t border-zinc-150 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-[9px] text-zinc-450 font-bold uppercase tracking-wider flex items-center gap-1.5 shrink-0">
                  <Award size={12} className="text-yellow-500" />
                  Green highlighted boxes represent the top-performing value for each operational criteria.
                </div>
              </div>

            </div>
          ) : (
            <div className="border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl p-12 text-center flex flex-col items-center justify-center max-w-xl mx-auto space-y-3.5">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                <Search size={22} />
              </div>
              <h3 className="text-sm font-black text-black dark:text-white">Run Store Comparison</h3>
              <p className="text-zinc-500 dark:text-zinc-400 max-w-xs leading-normal font-semibold">
                Select 2 to 5 store channels above and click "Run Comparison" to generate side-by-side performance grids and footprint radar graphs.
              </p>
            </div>
          )}

        </main>

        {/* Modal Footer */}
        <footer className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex justify-end bg-zinc-50/50 dark:bg-zinc-900/50 rounded-b-2xl shrink-0 z-10 shadow-inner">
          <button
            onClick={onClose}
            className="px-5 py-1.5 border border-zinc-250 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-750 dark:text-zinc-200 rounded-lg font-bold text-xs uppercase tracking-wider cursor-pointer transition-colors"
          >
            Dismiss
          </button>
        </footer>

      </div>
    </div>
  );
}
