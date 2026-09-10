import React, { useState } from "react";
import { X, FileText, Check, RefreshCw } from "lucide-react";
import { useGenerateOrderReport } from "../hooks/useOrdersReport";
import { useStoresDropdown } from "../hooks/useSalesReport";
import { toast } from "sonner";

export default function GenerateOrderReportModal({ isOpen, onClose }) {
  const { data: storesList, isLoading: isStoresLoading } = useStoresDropdown();
  const generateOrderReportMutation = useGenerateOrderReport();

  // Form states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState("all");
  const [orderStatus, setOrderStatus] = useState("All");
  const [orderType, setOrderType] = useState("All");
  const [format, setFormat] = useState("PDF");

  const [includeCustomerDetails, setIncludeCustomerDetails] = useState(true);
  const [includeDeliveryMetrics, setIncludeDeliveryMetrics] = useState(true);
  const [includeStorePerformance, setIncludeStorePerformance] = useState(true);
  const [includeTopCustomers, setIncludeTopCustomers] = useState(true);

  // Simulated background processing state
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

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
      startDate,
      endDate,
      storeId,
      status: orderStatus,
      orderType,
      format,
      includeCustomerDetails,
      includeDeliveryMetrics,
      includeStorePerformance,
      includeTopCustomers
    };

    setIsProcessing(true);
    setProgress(10);

    const timer1 = setTimeout(() => setProgress(40), 400);
    const timer2 = setTimeout(() => setProgress(75), 800);

    try {
      const response = await generateOrderReportMutation.mutateAsync(payload);

      const timer3 = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsProcessing(false);
          setProgress(0);
          toast.success(`Order report generated successfully! ID: ${response.reportId}`);
          onClose();
        }, 300);
      }, 1200);

    } catch (error) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsProcessing(false);
      setProgress(0);
      toast.error(error.message || "Failed to generate order report");
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
                Generate Order Report
              </h3>
            </div>
            {!isProcessing && (
              <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-400 cursor-pointer">
                <X size={14} />
              </button>
            )}
          </header>

          {isProcessing ? (
            /* Progress Loader Screen */
            <div className="p-8 space-y-6 text-center animate-fade-in">
              <div className="flex justify-center">
                <RefreshCw className="animate-spin text-[var(--primary)]" size={32} />
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Processing Order Report...</h4>
                <p className="text-[10px] text-zinc-400">Please wait while the system aggregates order volumes, status logs, and rider delivery timetables.</p>
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
              
              {/* Date pickers grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold">End Date *</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250"
                  />
                </div>
              </div>

              {/* Store dropdown */}
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

              {/* Status and Type Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold">Order Status *</label>
                  <select
                    value={orderStatus}
                    onChange={(e) => setOrderStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending</option>
                    <option value="Confirmed">Confirmed</option>
                    <option value="Preparing">Preparing</option>
                    <option value="Baking">Baking</option>
                    <option value="Packed">Packed</option>
                    <option value="Out For Delivery">Out For Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-zinc-500 font-bold">Order Type *</label>
                  <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] text-zinc-800 dark:text-zinc-250 cursor-pointer"
                  >
                    <option value="All">All Types</option>
                    <option value="Delivery">Delivery</option>
                    <option value="Takeaway">Takeaway</option>
                    <option value="Dine-In">Dine-In</option>
                  </select>
                </div>
              </div>

              {/* Format selection */}
              <div className="space-y-1">
                <label className="block text-zinc-500 font-bold mb-1">Export Format</label>
                <div className="flex gap-4">
                  {["PDF", "Excel", "CSV"].map((fmt) => (
                    <label key={fmt} className="flex items-center gap-1.5 cursor-pointer font-bold text-zinc-850 dark:text-zinc-300">
                      <input
                        type="radio"
                        name="order_format"
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
                      checked={includeCustomerDetails}
                      onChange={(e) => setIncludeCustomerDetails(e.target.checked)}
                      className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                    <span className="font-bold text-zinc-850 dark:text-zinc-300 text-[10px]">Customer Details</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-zinc-150 dark:border-zinc-850 hover:border-[var(--primary)]/30 rounded-xl bg-zinc-50/10 hover:bg-white dark:hover:bg-zinc-900/30 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={includeDeliveryMetrics}
                      onChange={(e) => setIncludeDeliveryMetrics(e.target.checked)}
                      className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                    <span className="font-bold text-zinc-850 dark:text-zinc-300 text-[10px]">Delivery Metrics</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-zinc-150 dark:border-zinc-850 hover:border-[var(--primary)]/30 rounded-xl bg-zinc-50/10 hover:bg-white dark:hover:bg-zinc-900/30 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={includeStorePerformance}
                      onChange={(e) => setIncludeStorePerformance(e.target.checked)}
                      className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                    <span className="font-bold text-zinc-850 dark:text-zinc-300 text-[10px]">Store Performance</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer p-2.5 border border-zinc-150 dark:border-zinc-850 hover:border-[var(--primary)]/30 rounded-xl bg-zinc-50/10 hover:bg-white dark:hover:bg-zinc-900/30 transition-all duration-200">
                    <input
                      type="checkbox"
                      checked={includeTopCustomers}
                      onChange={(e) => setIncludeTopCustomers(e.target.checked)}
                      className="rounded border-zinc-350 dark:border-zinc-700 bg-zinc-50 w-3.5 h-3.5 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                    />
                    <span className="font-bold text-zinc-850 dark:text-zinc-300 text-[10px]">Top Customers</span>
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
                  disabled={generateOrderReportMutation.isPending}
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
