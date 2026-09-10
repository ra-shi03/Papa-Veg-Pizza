// ExportModal.jsx
import React, { useState } from 'react';
import { X, Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportModal({ isOpen, onClose, activeFilters }) {
  const [format, setFormat] = useState('csv');
  const [exporting, setExporting] = useState(false);

  if (!isOpen) return null;

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      
      // Simulated browser download trigger
      const dataStr = "Mock CSV Data for Orders Management";
      const dataUri = 'data:application/txt;charset=utf-8,'+ encodeURIComponent(dataStr);
      const exportFileDefaultName = `PapaVegPizza_Orders_Export_${new Date().toISOString().substring(0,10)}.${format}`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();

      toast.success(`Report exported successfully as ${format.toUpperCase()}`);
      onClose();
    }, 1200);
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (activeFilters.search) count++;
    if (activeFilters.franchise && activeFilters.franchise !== 'All') count++;
    if (activeFilters.store && activeFilters.store !== 'All') count++;
    if (activeFilters.city && activeFilters.city !== 'All') count++;
    if (activeFilters.orderType && activeFilters.orderType !== 'All') count++;
    if (activeFilters.paymentMethod && activeFilters.paymentMethod !== 'All') count++;
    if (activeFilters.paymentStatus && activeFilters.paymentStatus !== 'All') count++;
    if (activeFilters.orderStatus && activeFilters.orderStatus !== 'All') count++;
    if (activeFilters.fromDate) count++;
    if (activeFilters.toDate) count++;
    return count;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Content */}
      <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-xl shadow-xl overflow-hidden relative z-10 animate-in fade-in zoom-in-95 duration-200 select-none text-zinc-800 dark:text-zinc-150">
        
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center shrink-0">
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-1.5">
            <Download size={15} />
            Export Order Reports
          </h3>
          <button 
            className="text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 p-1.5 rounded-full transition-colors cursor-pointer"
            onClick={onClose}
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          
          {/* Active filters status summary */}
          <div className="bg-zinc-50 dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-805/60 text-xs font-semibold space-y-1">
            <span className="text-[9px] text-zinc-400 block uppercase tracking-wider">Export Scope Summary</span>
            <p className="text-zinc-800 dark:text-zinc-200">
              The exported file will respect all active search queries and database filters.
            </p>
            <div className="pt-2 flex items-center justify-between text-[10px] border-t border-zinc-150 dark:border-zinc-800/85">
              <span className="text-zinc-400">Applied Filter Scope count:</span>
              <span className="text-[var(--primary)] font-black">{getActiveFiltersCount()} Filters</span>
            </div>
          </div>

          {/* Form Selector */}
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-zinc-450 uppercase tracking-widest">
              Select Report Format
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFormat('csv')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  format === 'csv' 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'
                }`}
              >
                <File size={20} />
                <span>CSV File</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('xlsx')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  format === 'xlsx' 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'
                }`}
              >
                <FileSpreadsheet size={20} />
                <span>Excel Sheet</span>
              </button>

              <button
                type="button"
                onClick={() => setFormat('pdf')}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-bold ${
                  format === 'pdf' 
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)]' 
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500'
                }`}
              >
                <FileText size={20} />
                <span>PDF Document</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-150 dark:border-zinc-800 flex gap-3">
            <button 
              type="button"
              onClick={onClose}
              className="flex-1 border border-zinc-250 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 h-9 rounded-lg text-xs font-bold hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              Close
            </button>
            <button 
              onClick={handleExport}
              disabled={exporting}
              className="flex-1 bg-[var(--primary)] text-white h-9 rounded-lg text-xs font-bold hover:opacity-90 shadow-md active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {exporting ? (
                <>
                  <RefreshCw size={12} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Download size={13} />
                  <span>Start Export</span>
                </>
              )}
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
