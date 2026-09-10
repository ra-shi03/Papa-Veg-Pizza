import React, { useState } from 'react';
import { X, Calendar, Settings, Info, RefreshCw, FileText } from 'lucide-react';
import { useGenerateGrowthReport } from '../hooks/useGrowthAnalyticsQuery';

export default function GenerateReportModal({ isOpen, onClose, onSuccess }) {
  const { generateReport, loading } = useGenerateGrowthReport();

  const [form, setForm] = useState({
    period: 'Monthly',
    includeForecast: true,
    includeTaxes: true,
    includeMarketingROI: true,
    format: 'PDF',
    startDate: '',
    endDate: ''
  });

  if (!isOpen) return null;

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await generateReport(form);
      if (response && onSuccess) {
        onSuccess(response.report);
      }
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fade-in">
      <div className="w-full max-w-[700px] bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl flex flex-col relative border border-zinc-200 dark:border-zinc-800 overflow-hidden my-auto text-zinc-800 dark:text-zinc-200">
        
        {/* Modal Header */}
        <header className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)]">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-sm font-black text-black dark:text-white uppercase tracking-wider">
                Generate Growth Intelligence Report
              </h3>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-bold mt-0.5 uppercase tracking-wide">
                Build Strategic BI Insights and Forecasts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 cursor-pointer transition-colors"
          >
            <X size={15} />
          </button>
        </header>

        {/* Form body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5 text-xs font-semibold">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Period Dropdown */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wide">
                Report Periodicity
              </label>
              <select
                className="w-full p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:border-[var(--primary)] text-xs"
                value={form.period}
                onChange={(e) => handleChange('period', e.target.value)}
              >
                <option value="Daily">Daily</option>
                <option value="Weekly">Weekly</option>
                <option value="Monthly">Monthly</option>
                <option value="Quarterly">Quarterly</option>
                <option value="Yearly">Yearly</option>
              </select>
            </div>

            {/* Format Selection */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wide">
                Export File Format
              </label>
              <div className="flex gap-4 p-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg">
                {['PDF', 'Excel', 'CSV'].map((fmt) => (
                  <label
                    key={fmt}
                    className={`flex-1 flex items-center justify-center gap-1 py-1 px-2.5 rounded-md cursor-pointer transition-all border text-[10px] uppercase font-black ${
                      form.format === fmt
                        ? 'bg-[var(--primary)] border-[var(--primary)] text-white shadow-sm'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-650 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                    }`}
                  >
                    <input
                      type="radio"
                      name="format"
                      value={fmt}
                      checked={form.format === fmt}
                      onChange={() => handleChange('format', fmt)}
                      className="sr-only"
                    />
                    {fmt}
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Date range inputs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wide">
                Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 text-zinc-400" size={13} />
                <input
                  type="date"
                  required
                  className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:border-[var(--primary)] text-xs"
                  value={form.startDate}
                  onChange={(e) => handleChange('startDate', e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-wide">
                End Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-2.5 top-2.5 text-zinc-400" size={13} />
                <input
                  type="date"
                  required
                  className="w-full pl-8 pr-3 py-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-black dark:text-white focus:outline-none focus:border-[var(--primary)] text-xs"
                  value={form.endDate}
                  onChange={(e) => handleChange('endDate', e.target.value)}
                />
              </div>
            </div>

          </div>

          {/* Switches toggles block */}
          <div className="space-y-3.5 bg-zinc-50 dark:bg-zinc-950/40 p-4 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
            <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-wider flex items-center gap-1">
              <Settings size={12} className="text-[var(--primary)]" />
              Advanced BI Parameters
            </h4>

            {/* Toggle 1: Forecasting */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-extrabold text-[11px]">Include AI Growth Forecasting</p>
                <p className="text-[9.5px] text-zinc-450 font-bold mt-0.5">Simulate next 30/90 days predictive metrics via ML models</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('includeForecast', !form.includeForecast)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.includeForecast ? 'bg-[var(--primary)]' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.includeForecast ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800/80"></div>

            {/* Toggle 2: Taxes */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-extrabold text-[11px]">Include Tax Ledger Auditing</p>
                <p className="text-[9.5px] text-zinc-450 font-bold mt-0.5">Incorporate GST splits, franchise tax audits and rebates</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('includeTaxes', !form.includeTaxes)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.includeTaxes ? 'bg-[var(--primary)]' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.includeTaxes ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="h-px bg-zinc-200 dark:bg-zinc-800/80"></div>

            {/* Toggle 3: Marketing ROI */}
            <div className="flex items-center justify-between py-1">
              <div>
                <p className="font-extrabold text-[11px]">Include Marketing ROI Metrics</p>
                <p className="text-[9.5px] text-zinc-450 font-bold mt-0.5">Link analytics to coupons performance and active marketing campaigns</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('includeMarketingROI', !form.includeMarketingROI)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  form.includeMarketingROI ? 'bg-[var(--primary)]' : 'bg-zinc-200 dark:bg-zinc-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    form.includeMarketingROI ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-550/5 border border-zinc-200/40 text-[9.5px] text-zinc-500 leading-normal font-bold">
            <Info size={12} className="text-[var(--primary)] shrink-0 mt-0.5" />
            <span>
              Generating this growth intelligence report will compile metrics from orders, store franchises, and Razorpay settlements. It will take roughly 5-10 seconds to compile fully when online.
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2.5 border-t border-zinc-200 dark:border-zinc-800 pt-4 bg-white/50 dark:bg-zinc-900/50">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-1.5 text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white font-bold text-xs bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-750 rounded-lg transition-colors border border-zinc-200 dark:border-zinc-700 cursor-pointer disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-1.5 bg-[var(--primary)] hover:brightness-110 text-white rounded-lg font-bold text-xs shadow-md flex items-center gap-1.5 cursor-pointer disabled:opacity-60 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                'Generate Report'
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
