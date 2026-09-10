import React, { useState } from "react";
import { X, FileText, Check, RefreshCw } from "lucide-react";
import { useGenerateInventoryReport } from "../hooks/useInventoryReport";
import { useStoresDropdown } from "../hooks/useSalesReport";
import { toast } from "sonner";

export default function GenerateInventoryReportModal({ isOpen, onClose }) {
  const { data: storesList, isLoading: isStoresLoading } = useStoresDropdown();
  const generateInventoryReportMutation = useGenerateInventoryReport();

  // Form states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [storeId, setStoreId] = useState("all");
  const [format, setFormat] = useState("PDF");

  const [includeWastage, setIncludeWastage] = useState(true);
  const [includePurchases, setIncludePurchases] = useState(true);
  const [includeTransfers, setIncludeTransfers] = useState(true);
  const [includeStockTransactions, setIncludeStockTransactions] = useState(true);
  const [includeLowStock, setIncludeLowStock] = useState(true);
  const [includeSuppliers, setIncludeSuppliers] = useState(true);

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
      format,
      includeWastage,
      includePurchases,
      includeTransfers,
      includeStockTransactions,
      includeLowStock,
      includeSuppliers
    };

    setIsProcessing(true);
    setProgress(10);

    const timer1 = setTimeout(() => setProgress(40), 400);
    const timer2 = setTimeout(() => setProgress(75), 800);

    try {
      const response = await generateInventoryReportMutation.mutateAsync(payload);

      const timer3 = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsProcessing(false);
          setProgress(0);
          toast.success(`Inventory report generated successfully! ID: ${response.reportId}`);
          onClose();
        }, 300);
      }, 1200);

    } catch (error) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setIsProcessing(false);
      setProgress(0);
      toast.error(error.message || "Failed to generate inventory report");
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
              <div>
                <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Generate Inventory Report</h3>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-normal">Configure ingredient consumption and stock level analytics</p>
              </div>
            </div>
            {!isProcessing && (
              <button 
                onClick={onClose}
                className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 transition-colors rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <X size={16} />
              </button>
            )}
          </header>

          {isProcessing ? (
            /* Progress State */
            <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative flex items-center justify-center">
                <RefreshCw size={28} className="animate-spin text-[var(--primary)]" />
                <span className="absolute text-[9px] font-bold text-zinc-800 dark:text-zinc-200">{progress}%</span>
              </div>
              <div>
                <h4 className="font-bold text-zinc-850 dark:text-white text-sm">Aggregating Stock Analytics</h4>
                <p className="text-[11px] text-zinc-450 dark:text-zinc-500 font-normal mt-1">
                  Querying MongoDB databases & grouping stock transactions...
                </p>
              </div>
              <div className="w-full max-w-xs bg-zinc-100 dark:bg-zinc-900 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-[var(--primary)] h-1.5 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          ) : (
            /* Form Input State */
            <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
              <div className="p-4 space-y-3.5 flex-1 overflow-y-auto max-h-[65vh]">
                
                {/* Store Selection */}
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Target Store</label>
                  <select 
                    value={storeId} 
                    onChange={(e) => setStoreId(e.target.value)}
                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-800 dark:text-white focus:outline-none focus:border-[var(--primary)]"
                  >
                    <option value="all" className="bg-white dark:bg-zinc-955 text-zinc-800 dark:text-zinc-200">
                      All Stores (Franchise-wide)
                    </option>
                    {isStoresLoading ? (
                      <option disabled>Loading stores...</option>
                    ) : (
                      storesList?.map((st) => (
                        <option 
                          key={st.storeId} 
                          value={st.storeId}
                          className="bg-white dark:bg-zinc-955 text-zinc-800 dark:text-zinc-200"
                        >
                          {st.storeName}
                        </option>
                      ))
                    )}
                  </select>
                </div>

                {/* Date Ranges */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-850 dark:text-white focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-500 dark:text-zinc-400 mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-transparent text-zinc-850 dark:text-white focus:outline-none focus:border-[var(--primary)]"
                    />
                  </div>
                </div>

                {/* File Format */}
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1.5">File Format</label>
                  <div className="grid grid-cols-3 gap-2.5">
                    {["PDF", "Excel", "CSV"].map((fmt) => (
                      <button
                        key={fmt}
                        type="button"
                        onClick={() => setFormat(fmt)}
                        className={`p-2 rounded-lg border text-center transition-all ${
                          format === fmt 
                            ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] font-bold shadow-xs" 
                            : "border-zinc-200 dark:border-zinc-800 hover:border-zinc-350 dark:hover:border-zinc-650 text-zinc-700 dark:text-zinc-300 font-semibold"
                        }`}
                      >
                        {fmt}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Checklist Custom Report Inclusions */}
                <div>
                  <label className="block text-zinc-500 dark:text-zinc-400 mb-1.5">Report Inclusions</label>
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                    <label className="flex items-center gap-2 p-2 border border-zinc-150 dark:border-zinc-850 rounded-lg cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <input 
                        type="checkbox" 
                        checked={includeWastage} 
                        onChange={(e) => setIncludeWastage(e.target.checked)}
                        className="rounded accent-[var(--primary)] w-3.5 h-3.5"
                      />
                      <span>Wastage Audit</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 border border-zinc-150 dark:border-zinc-850 rounded-lg cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <input 
                        type="checkbox" 
                        checked={includePurchases} 
                        onChange={(e) => setIncludePurchases(e.target.checked)}
                        className="rounded accent-[var(--primary)] w-3.5 h-3.5"
                      />
                      <span>Procurement Logs</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 border border-zinc-150 dark:border-zinc-850 rounded-lg cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <input 
                        type="checkbox" 
                        checked={includeTransfers} 
                        onChange={(e) => setIncludeTransfers(e.target.checked)}
                        className="rounded accent-[var(--primary)] w-3.5 h-3.5"
                      />
                      <span>Stock Transfers</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 border border-zinc-150 dark:border-zinc-850 rounded-lg cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <input 
                        type="checkbox" 
                        checked={includeStockTransactions} 
                        onChange={(e) => setIncludeStockTransactions(e.target.checked)}
                        className="rounded accent-[var(--primary)] w-3.5 h-3.5"
                      />
                      <span>All Stock Transactions</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 border border-zinc-150 dark:border-zinc-850 rounded-lg cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <input 
                        type="checkbox" 
                        checked={includeLowStock} 
                        onChange={(e) => setIncludeLowStock(e.target.checked)}
                        className="rounded accent-[var(--primary)] w-3.5 h-3.5"
                      />
                      <span>Low Stock Warnings</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 border border-zinc-150 dark:border-zinc-850 rounded-lg cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30">
                      <input 
                        type="checkbox" 
                        checked={includeSuppliers} 
                        onChange={(e) => setIncludeSuppliers(e.target.checked)}
                        className="rounded accent-[var(--primary)] w-3.5 h-3.5"
                      />
                      <span>Supplier Ratings</span>
                    </label>
                  </div>
                </div>

              </div>

              {/* Form Footer */}
              <footer className="p-3.5 border-t border-zinc-150 dark:border-zinc-850 flex items-center justify-end gap-2.5 bg-zinc-50/30 dark:bg-zinc-900/10">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 rounded-lg font-bold text-zinc-650 hover:bg-zinc-50 dark:text-zinc-350 dark:hover:bg-zinc-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generateInventoryReportMutation.isPending}
                  className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary)]/90 active:scale-[0.98] text-white rounded-lg font-bold transition-all flex items-center gap-1.5"
                >
                  <FileText size={13} />
                  <span>Generate Report</span>
                </button>
              </footer>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
