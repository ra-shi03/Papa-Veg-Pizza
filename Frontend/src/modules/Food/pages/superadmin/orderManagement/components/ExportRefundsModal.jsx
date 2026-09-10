import React, { useState, useEffect } from 'react';
import { 
  X, History, FileText, FileDown, TableProperties, 
  Calendar, ChevronDown, Download, CheckCircle, Loader2 
} from 'lucide-react';
import { toast } from 'sonner';

export default function ExportRefundsModal({ isOpen, onClose, activeFilters }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isRendered, setIsRendered] = useState(isOpen);
  const [format, setFormat] = useState('CSV'); // CSV, PDF, Excel
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [columns, setColumns] = useState([
    { key: 'refundNumber', label: 'Refund ID', checked: true },
    { key: 'orderNumber', label: 'Order Number', checked: true },
    { key: 'customerName', label: 'Customer Name', checked: true },
    { key: 'refundAmount', label: 'Refund Amount', checked: true },
    { key: 'status', label: 'Refund Status', checked: true },
    { key: 'gateway', label: 'Gateway Name', checked: true },
    { key: 'reason', label: 'Reason Code', checked: false },
    { key: 'createdAt', label: 'Requested Date', checked: true },
    { key: 'approvedBy', label: 'Approved By', checked: false }
  ]);

  useEffect(() => {
    if (isOpen) {
      setIsRendered(true);
      setTimeout(() => setIsVisible(true), 10);
      setDownloadComplete(false);
      setIsDownloading(false);
    } else {
      setIsVisible(false);
      const timer = setTimeout(() => setIsRendered(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isRendered) return null;

  const toggleColumn = (key) => {
    setColumns(prev => prev.map(col => col.key === key ? { ...col, checked: !col.checked } : col));
  };

  const handleSelectAll = () => {
    const allChecked = columns.every(c => c.checked);
    setColumns(prev => prev.map(col => ({ ...col, checked: !allChecked })));
  };

  const handleDownload = () => {
    const selectedCount = columns.filter(c => c.checked).length;
    if (selectedCount === 0) {
      toast.error('Please select at least one column to include in the report.');
      return;
    }

    setIsDownloading(true);
    setTimeout(() => {
      setIsDownloading(false);
      setDownloadComplete(true);
      toast.success(`Successfully exported refund records as ${format}`);
      setTimeout(() => {
        onClose();
      }, 1000);
    }, 1800);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className={`w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col relative z-10 transition-all duration-300 transform ${isVisible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-900/50">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">Export Refund Records</h2>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">Configure report formats and column attributes.</p>
          </div>
          <button 
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-zinc-150 dark:hover:bg-zinc-805 text-zinc-500 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4 overflow-y-auto max-h-[65vh] text-xs font-semibold">
          {/* Quick Presets */}
          <section>
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 block uppercase tracking-wider">Quick Presets</label>
            <div className="flex flex-wrap gap-2">
              <button 
                type="button"
                className="px-3 py-1.5 rounded-full border border-[var(--primary)] bg-red-500/5 text-[var(--primary)] text-[10px] font-bold flex items-center gap-1 hover:bg-red-500/10 transition-colors cursor-pointer"
              >
                <History size={12} />
                <span>Last 30 Days</span>
              </button>
              <button 
                type="button"
                className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 text-[10px] font-bold flex items-center gap-1 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors cursor-pointer"
              >
                Today's Pending
              </button>
              <button 
                type="button"
                className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-650 dark:text-zinc-350 text-[10px] font-bold flex items-center gap-1 hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors cursor-pointer"
              >
                Monthly Summary
              </button>
            </div>
          </section>

          {/* Formats & Date range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* File format */}
            <section>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 block uppercase tracking-wider">File Format</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  type="button"
                  onClick={() => setFormat('CSV')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                    format === 'CSV' 
                      ? 'border-[var(--primary)] bg-red-500/5 text-[var(--primary)] font-bold' 
                      : 'border-zinc-250 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50'
                  }`}
                >
                  <FileText size={16} className="mb-1" />
                  <span className="text-[9px] font-bold">CSV</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormat('PDF')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                    format === 'PDF' 
                      ? 'border-[var(--primary)] bg-red-500/5 text-[var(--primary)] font-bold' 
                      : 'border-zinc-255 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50'
                  }`}
                >
                  <FileDown size={16} className="mb-1" />
                  <span className="text-[9px] font-bold">PDF</span>
                </button>
                <button 
                  type="button"
                  onClick={() => setFormat('Excel')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-xl border-2 transition-all cursor-pointer ${
                    format === 'Excel' 
                      ? 'border-[var(--primary)] bg-red-500/5 text-[var(--primary)] font-bold' 
                      : 'border-zinc-255 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850/50'
                  }`}
                >
                  <TableProperties size={16} className="mb-1" />
                  <span className="text-[9px] font-bold">Excel</span>
                </button>
              </div>
            </section>

            {/* Date Range */}
            <section>
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 mb-2 block uppercase tracking-wider">Date Period</label>
              <div className="relative">
                <input 
                  type="text" 
                  readOnly
                  defaultValue="01 Jun, 2026 - 30 Jun, 2026"
                  className="w-full h-9 pl-8 pr-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs font-bold outline-none text-zinc-650"
                />
                <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450" />
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-450" />
              </div>
            </section>
          </div>

          {/* Columns checklist */}
          <section>
            <div className="flex justify-between items-center mb-2">
              <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Columns to Include</label>
              <button 
                type="button"
                onClick={handleSelectAll}
                className="text-[var(--primary)] text-[10px] font-bold hover:underline cursor-pointer"
              >
                Toggle All
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {columns.map((col) => (
                <label 
                  key={col.key}
                  className={`flex items-center gap-2 p-2 rounded-xl border border-transparent bg-zinc-50 dark:bg-zinc-950 hover:bg-zinc-100 dark:hover:bg-zinc-805/40 cursor-pointer transition-all ${
                    col.checked ? 'border-[var(--primary)]/10 ring-1 ring-[var(--primary)]/10' : ''
                  }`}
                >
                  <input 
                    type="checkbox"
                    checked={col.checked}
                    onChange={() => toggleColumn(col.key)}
                    className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-[var(--primary)] focus:ring-[var(--primary)] cursor-pointer"
                  />
                  <span className="text-xs text-zinc-755 dark:text-zinc-300">{col.label}</span>
                </label>
              ))}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-end gap-2.5">
          <button 
            onClick={onClose}
            disabled={isDownloading}
            className="h-8 px-4 rounded-lg text-xs font-bold hover:bg-zinc-200 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button 
            onClick={handleDownload}
            disabled={isDownloading || downloadComplete}
            className={`h-8 px-4 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all min-w-[150px] ${
              downloadComplete 
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                : 'bg-[var(--primary)] hover:opacity-90 text-white'
            }`}
          >
            {isDownloading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Exporting...</span>
              </>
            ) : downloadComplete ? (
              <>
                <CheckCircle size={13} />
                <span>Report Exported</span>
              </>
            ) : (
              <>
                <Download size={13} />
                <span>Generate Export</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
