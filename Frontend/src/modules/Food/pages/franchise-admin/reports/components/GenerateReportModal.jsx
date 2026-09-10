import React, { useState, useEffect } from "react";
import { X, FileText, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { useGenerateReport, useStoresDropdown } from "../hooks/useSalesReport";
import { toast } from "sonner";

export default function GenerateReportModal({ isOpen, onClose }) {
  const { data: storesList, isLoading: isStoresLoading } = useStoresDropdown();
  const generateReportMutation = useGenerateReport();

  // Form states
  const [reportType, setReportType] = useState("Custom");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState("all");
  const [format, setFormat] = useState("PDF");
  
  const [includeRefunds, setIncludeRefunds] = useState(true);
  const [includeTaxes, setIncludeTaxes] = useState(true);
  const [includeStorePerformance, setIncludeStorePerformance] = useState(true);
  const [includeTopProducts, setIncludeTopProducts] = useState(true);

  // Simulated background processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Auto set dates when reportType changes
  useEffect(() => {
    const today = new Date().toISOString().split("T")[0];
    if (reportType === "Daily") {
      setStartDate(today);
      setEndDate(today);
    } else if (reportType === "Weekly") {
      const prevWeek = new Date();
      prevWeek.setDate(prevWeek.getDate() - 7);
      setStartDate(prevWeek.toISOString().split("T")[0]);
      setEndDate(today);
    } else if (reportType === "Monthly") {
      const prevMonth = new Date();
      prevMonth.setMonth(prevMonth.getMonth() - 1);
      setStartDate(prevMonth.toISOString().split("T")[0]);
      setEndDate(today);
    }
  }, [reportType]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!startDate || !endDate) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (new Date(startDate) > new Date(endDate)) {
      toast.error("Start date cannot be after end date");
      return;
    }

    const payload = {
      reportType,
      startDate,
      endDate,
      storeId,
      format,
      includeRefunds,
      includeTaxes,
      includeStorePerformance,
      includeTopProducts
    };

    setIsProcessing(true);
    setProgress(15);

    // Simulate background processing steps
    const timer1 = setTimeout(() => setProgress(45), 400);
    const timer2 = setTimeout(() => setProgress(80), 800);

    try {
      // Trigger API post
      const response = await generateReportMutation.mutateAsync(payload);
      
      const timer3 = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsProcessing(false);
          setProgress(0);
          toast.success(`Sales report generated successfully! ID: ${response.reportId}`);
          onClose();
        }, 300);
      }, 1200);

    } catch (error) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsProcessing(false);
      setProgress(0);
      toast.error(error.message || "Failed to generate sales report");
    }
  };

  return (
    <div className="fixed inset-0 lg:left-[280px] z-50 overflow-hidden text-xs">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs z-50 animate-fade-in" 
        onClick={!isProcessing ? onClose : undefined} 
      />

      {/* Modal Container */}
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-scale-up font-semibold text-zinc-750 dark:text-zinc-350">
          
          {/* Header */}
          <header className="p-3.5 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[var(--primary)] text-white rounded-lg">
                <FileText size={14} />
              </span>
              <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white">
                Generate Sales Report
              </h3>
            </div>
            {!isProcessing && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </header>

          {isProcessing ? (
            /* Progress Bar Loader Screen */
            <div className="p-8 space-y-6 text-center animate-fade-in">
              <div className="flex justify-center">
                <RefreshCw className="animate-spin text-[var(--primary)]" size={32} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Processing Report...</h4>
                <p className="text-[10px] text-zinc-400">Please wait while the system compiles database records for payments, orders, refunds, and taxes.</p>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-[var(--primary)] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-[10px] font-bold text-[var(--primary)]">
                {progress}% Completed
              </div>
            </div>
          ) : (
            /* Form screen */
            <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[80vh] overflow-y-auto scrollbar-thin">
              
              {/* Report Type */}
              <div className="space-y-1">
                <label className="block text-zinc-500 font-bold">Report Type *</label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
                >
                  <option value="Daily">Daily Report</option>
                  <option value="Weekly">Weekly Report</option>
                  <option value="Monthly">Monthly Report</option>
                  <option value="Custom">Custom Date Range</option>
                </select>
              </div>

              {/* Date pickers grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold">Start Date *</label>
                  <input
                    type="date"
                    disabled={reportType !== "Custom"}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 disabled:opacity-60"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold">End Date *</label>
                  <input
                    type="date"
                    disabled={reportType !== "Custom"}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Store selection */}
              <div className="space-y-1">
                <label className="block text-zinc-500 font-bold">Target Store *</label>
                <select
                  value={storeId}
                  disabled={isStoresLoading}
                  onChange={(e) => setStoreId(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
                >
                  <option value="all">All Stores (Franchise-wide)</option>
                  {storesList?.map((s) => (
                    <option key={s.storeId} value={s.storeId}>
                      {s.storeName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Output format */}
              <div className="space-y-1">
                <label className="block text-zinc-500 font-bold mb-1">Export Format</label>
                <div className="flex gap-4">
                  {["PDF", "Excel", "CSV"].map((fmt) => (
                    <label key={fmt} className="flex items-center gap-1.5 cursor-pointer font-bold text-zinc-800 dark:text-zinc-300">
                      <input
                        type="radio"
                        name="format"
                        value={fmt}
                        checked={format === fmt}
                        onChange={() => setFormat(fmt)}
                        className="w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)]"
                      />
                      <span>{fmt}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Checkboxes sections to include */}
              <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                <label className="block text-zinc-500 font-bold">Include Sections</label>
                <div className="grid grid-cols-2 gap-2.5">
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-zinc-150 dark:border-zinc-850 hover:border-[var(--primary)]/30 rounded-xl bg-zinc-50/10 hover:bg-white dark:hover:bg-zinc-900/30 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={includeRefunds}
                      onChange={(e) => setIncludeRefunds(e.target.checked)}
                      className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                    <span className="font-bold text-zinc-850 dark:text-zinc-300 text-[10px]">Include Refunds</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-zinc-150 dark:border-zinc-850 hover:border-[var(--primary)]/30 rounded-xl bg-zinc-50/10 hover:bg-white dark:hover:bg-zinc-900/30 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={includeTaxes}
                      onChange={(e) => setIncludeTaxes(e.target.checked)}
                      className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                    <span className="font-bold text-zinc-850 dark:text-zinc-300 text-[10px]">Include Taxes</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-zinc-150 dark:border-zinc-850 hover:border-[var(--primary)]/30 rounded-xl bg-zinc-50/10 hover:bg-white dark:hover:bg-zinc-900/30 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={includeStorePerformance}
                      onChange={(e) => setIncludeStorePerformance(e.target.checked)}
                      className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                    <span className="font-bold text-zinc-850 dark:text-zinc-300 text-[10px]">Include Store Performance</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-zinc-150 dark:border-zinc-850 hover:border-[var(--primary)]/30 rounded-xl bg-zinc-50/10 hover:bg-white dark:hover:bg-zinc-900/30 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={includeTopProducts}
                      onChange={(e) => setIncludeTopProducts(e.target.checked)}
                      className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                    <span className="font-bold text-zinc-850 dark:text-zinc-300 text-[10px]">Include Top Products</span>
                  </label>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 rounded-lg font-bold cursor-pointer text-zinc-800 dark:text-zinc-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateReportMutation.isPending}
                  className="px-4 py-2 text-white font-black rounded-lg shadow-md bg-[var(--primary)] hover:bg-[var(--primary-hover)] cursor-pointer disabled:opacity-50"
                >
                  Generate Report
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
