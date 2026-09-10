import React, { useState } from 'react';
import { X, Send, FileText, FileSpreadsheet, FileJson, Calendar } from 'lucide-react';
import { useExportReport } from '../hooks/useSalesQuery';

export default function ExportModal({ isOpen, onClose }) {
  const [fields, setFields] = useState({
    revenue: true,
    orders: true,
    taxes: true,
    profit: true,
    refunds: true,
    discounts: true,
    products: false,
    stores: false,
    regions: false
  });
  
  const [format, setFormat] = useState('excel'); // excel, csv, pdf
  const [dateRange, setDateRange] = useState('Last 30 Days');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { generateReport, loading } = useExportReport();

  if (!isOpen) return null;

  const handleCheckboxChange = (key) => {
    setFields(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleExport = async () => {
    const rangeLabel = dateRange === 'Custom' ? `${startDate || 'Start'} to ${endDate || 'End'}` : dateRange;
    const success = await generateReport({
      format,
      fields,
      dateRange: rangeLabel
    });
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-md bg-zinc-50 dark:bg-zinc-955 rounded-2xl shadow-2xl flex flex-col relative border border-zinc-200 dark:border-zinc-800">
        
        {/* Header */}
        <header className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between sticky top-0 bg-zinc-50 dark:bg-zinc-950 z-20 rounded-t-2xl">
          <div>
            <h2 className="text-sm font-black text-zinc-900 dark:text-zinc-50">Export Sales Ledger</h2>
            <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Configure compliance statements and audit fields</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <main className="p-4 space-y-4 text-xs">
          {/* Fields checkboxes */}
          <section className="space-y-2">
            <h3 className="text-[9px] font-bold text-zinc-550 uppercase tracking-widest">Select Audit Columns</h3>
            <div className="grid grid-cols-2 gap-2 p-2.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl">
              {Object.keys(fields).map((key) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={fields[key]}
                    onChange={() => handleCheckboxChange(key)}
                    className="w-4 h-4 rounded border-2 border-zinc-350 dark:border-zinc-700 checked:bg-[var(--primary)] checked:border-[var(--primary)] transition-all cursor-pointer accent-[var(--primary)]"
                  />
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-black dark:group-hover:text-white capitalize">
                    {key}
                  </span>
                </label>
              ))}
            </div>
          </section>

          {/* Datepicker settings */}
          <section className="space-y-2">
            <h3 className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">Date Range Selection</h3>
            <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 border border-zinc-200 dark:border-zinc-800 p-1.5 px-2 rounded-lg bg-zinc-50 dark:bg-zinc-950 font-bold">
                <Calendar size={13} className="text-[var(--primary)]" />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent border-none outline-none w-full text-xs font-bold text-black/70 dark:text-white/70 pr-4 cursor-pointer"
                >
                  <option value="Today">Today</option>
                  <option value="Yesterday">Yesterday</option>
                  <option value="Last 7 Days">Last 7 Days</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Custom">Custom Range</option>
                </select>
              </div>

              {dateRange === 'Custom' && (
                <div className="grid grid-cols-2 gap-2 animate-fade-down">
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">From</label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold outline-none text-black dark:text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-bold text-zinc-400 uppercase">To</label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-[10px] font-bold outline-none text-black dark:text-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </section>

          {/* Export formats radio buttons */}
          <section className="space-y-2">
            <h3 className="text-[9px] font-bold text-zinc-555 uppercase tracking-widest">Select File Format</h3>
            <div className="flex gap-2">
              {[
                { id: 'excel', label: 'Excel (XLSX)', icon: FileSpreadsheet, color: 'text-emerald-555' },
                { id: 'csv', label: 'CSV File', icon: FileJson, color: 'text-blue-500' },
                { id: 'pdf', label: 'PDF Report', icon: FileText, color: 'text-rose-500' }
              ].map((fmt) => {
                const Icon = fmt.icon;
                const isSelected = format === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    onClick={() => setFormat(fmt.id)}
                    className={`flex-1 flex flex-col items-center gap-1 p-2 border rounded-xl font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] shadow-sm'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                    }`}
                  >
                    <Icon size={16} className={fmt.color} />
                    <span className="text-[10px]">{fmt.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </main>

        {/* Footer */}
        <footer className="p-3 border-t border-zinc-200 dark:border-zinc-800 sticky bottom-0 bg-zinc-50 dark:bg-zinc-950 z-20 rounded-b-2xl flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold uppercase rounded-lg hover:opacity-95 transition-opacity cursor-pointer shadow-sm text-[10px]"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={loading}
            className="flex-[2] py-2 bg-[var(--primary)] text-white font-bold uppercase rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-md disabled:opacity-40 text-[10px]"
          >
            <Send size={12} />
            <span>{loading ? 'Compiling...' : 'Generate Report'}</span>
          </button>
        </footer>

      </div>
    </div>
  );
}
