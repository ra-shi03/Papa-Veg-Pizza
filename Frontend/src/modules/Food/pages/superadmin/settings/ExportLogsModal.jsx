import React, { useState, useEffect } from 'react';
import { X, Download, Calendar, Filter, FileText, Loader2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function ExportLogsModal({ isOpen, onClose }) {
  const [dateRange, setDateRange] = useState('7d'); // 'today' | '7d' | '30d' | 'custom'
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [selectedModules, setSelectedModules] = useState([]);
  const [selectedStatus, setSelectedStatus] = useState([]);
  
  const [format, setFormat] = useState('csv'); // 'csv' | 'excel' | 'pdf'
  const [includeJson, setIncludeJson] = useState(false);
  const [compress, setCompress] = useState(false);
  
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setDateRange('7d');
      setStartDate('');
      setEndDate('');
      setSelectedRoles([]);
      setSelectedModules([]);
      setSelectedStatus([]);
      setFormat('csv');
      setIncludeJson(false);
      setCompress(false);
      setIsExporting(false);
      setProgress(0);
      setProgressText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const rolesOptions = ['Super Admin', 'Admin', 'Store Manager', 'Kitchen Staff', 'Delivery Partner', 'System'];
  const modulesOptions = ['Authentication', 'Products', 'Orders', 'Payments', 'Marketing', 'Settings', 'Franchise'];
  const statusOptions = ['Success', 'Failed', 'Warning', 'Pending'];

  const toggleMultiSelect = (val, list, setList) => {
    if (list.includes(val)) {
      setList(list.filter(item => item !== val));
    } else {
      setList([...list, val]);
    }
  };

  const handleExport = (e) => {
    e.preventDefault();
    setIsExporting(true);
    setProgress(0);
    setProgressText('Querying audit log records...');

    const steps = [
      { prg: 20, txt: 'Filtering by selected scopes...' },
      { prg: 50, txt: 'Compiling structured payload data...' },
      { prg: 80, txt: `Formatting records to ${format.toUpperCase()} layout...` },
      { prg: 95, txt: 'Finalizing file encryption and compression...' },
      { prg: 100, txt: 'Ready!' }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setProgress(step.prg);
        setProgressText(step.txt);
        if (step.prg === 100) {
          setTimeout(() => {
            setIsExporting(false);
            toast.success(`Audit logs successfully exported as ${format.toUpperCase()}!`);
            onClose();
          }, 400);
        }
      }, (idx + 1) * 450);
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-55 flex items-center gap-1.5">
              <Download className="text-[var(--primary)] shrink-0" size={18} />
              Export Audit Logs
            </h3>
            <p className="text-[10px] text-zinc-700 dark:text-zinc-300 mt-0.5 font-medium">
              Extract and download platform audit logs into structural files
            </p>
          </div>
          <button 
            onClick={onClose}
            disabled={isExporting}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          {isExporting ? (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-zinc-200 dark:border-zinc-800 border-t-[var(--primary)] rounded-full animate-spin"></div>
              <div className="space-y-2 w-full max-w-sm">
                <h4 className="text-xs font-bold text-black dark:text-zinc-100">Exporting Audit Data</h4>
                <div className="w-full bg-zinc-105 dark:bg-zinc-800 rounded-full h-2 overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  <div 
                    className="bg-[var(--primary)] h-full transition-all duration-300 rounded-full" 
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-[9px] text-zinc-500 font-extrabold px-1">
                  <span>{progressText}</span>
                  <span>{progress}%</span>
                </div>
              </div>
            </div>
          ) : (
            <form id="exportLogsForm" onSubmit={handleExport} className="space-y-4 text-xs font-semibold">
              
              {/* 1. Date range filter */}
              <div className="space-y-2 border-b border-zinc-150 dark:border-zinc-800 pb-3">
                <label className="text-[10px] font-black text-zinc-750 dark:text-zinc-350 uppercase tracking-wider block">
                  Select Time Frame
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: 'today', label: 'Today Only' },
                    { id: '7d', label: 'Last 7 Days' },
                    { id: '30d', label: 'Last 30 Days' },
                    { id: 'custom', label: 'Custom Range' }
                  ].map(d => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDateRange(d.id)}
                      className={`px-3 py-1.5 border rounded-lg text-xs transition-colors ${
                        dateRange === d.id
                          ? 'border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] font-bold'
                          : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-750 dark:text-zinc-350 font-medium'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {dateRange === 'custom' && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">Start Date</span>
                      <input 
                        type="date"
                        required
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full h-8 px-2.5 border border-zinc-300 dark:border-zinc-750 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-zinc-100 font-medium outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 uppercase tracking-wider">End Date</span>
                      <input 
                        type="date"
                        required
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full h-8 px-2.5 border border-zinc-300 dark:border-zinc-750 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-black dark:text-zinc-100 font-medium outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Target Filters Checklist */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-zinc-150 dark:border-zinc-800 pb-3">
                {/* Roles multi-select */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-zinc-750 dark:text-zinc-350 uppercase tracking-wider block">Target Roles</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
                    {rolesOptions.map(role => {
                      const active = selectedRoles.includes(role);
                      return (
                        <button
                          key={role}
                          type="button"
                          onClick={() => toggleMultiSelect(role, selectedRoles, setSelectedRoles)}
                          className={`w-full flex items-center justify-between p-1.5 rounded text-left transition-colors ${
                            active ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-850 dark:text-zinc-200'
                          }`}
                        >
                          <span className="text-xs font-semibold">{role}</span>
                          {active && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Modules multi-select */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-zinc-750 dark:text-zinc-350 uppercase tracking-wider block">Target Modules</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
                    {modulesOptions.map(mod => {
                      const active = selectedModules.includes(mod);
                      return (
                        <button
                          key={mod}
                          type="button"
                          onClick={() => toggleMultiSelect(mod, selectedModules, setSelectedModules)}
                          className={`w-full flex items-center justify-between p-1.5 rounded text-left transition-colors ${
                            active ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-850 dark:text-zinc-200'
                          }`}
                        >
                          <span className="text-xs font-semibold">{mod}</span>
                          {active && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Status multi-select */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black text-zinc-750 dark:text-zinc-355 uppercase tracking-wider block">Target Status</span>
                  <div className="space-y-1 max-h-36 overflow-y-auto border border-zinc-200 dark:border-zinc-800 p-2 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/30">
                    {statusOptions.map(st => {
                      const active = selectedStatus.includes(st);
                      return (
                        <button
                          key={st}
                          type="button"
                          onClick={() => toggleMultiSelect(st, selectedStatus, setSelectedStatus)}
                          className={`w-full flex items-center justify-between p-1.5 rounded text-left transition-colors ${
                            active ? 'bg-[var(--primary)]/10 text-[var(--primary)]' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-850 dark:text-zinc-200'
                          }`}
                        >
                          <span className="text-xs font-semibold">{st}</span>
                          {active && <Check size={12} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* 3. Export format radio choices */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-zinc-750 dark:text-zinc-350 uppercase tracking-wider block">Export Format</span>
                  <div className="flex gap-4">
                    {[
                      { id: 'csv', label: 'CSV File' },
                      { id: 'excel', label: 'Excel (XLSX)' },
                      { id: 'pdf', label: 'PDF Report' }
                    ].map(f => (
                      <label key={f.id} className="flex items-center gap-2 cursor-pointer text-xs text-zinc-850 dark:text-zinc-200">
                        <input 
                          type="radio" 
                          name="exportFormat" 
                          value={f.id}
                          checked={format === f.id}
                          onChange={() => setFormat(f.id)}
                          className="text-[var(--primary)] focus:ring-[var(--primary)]"
                        />
                        <span>{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Configurations Toggles */}
                <div className="flex flex-col gap-2 bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 p-3 rounded-xl text-zinc-750 dark:text-zinc-300">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Include Snapshot Data (JSON values)</span>
                    <input 
                      type="checkbox" 
                      checked={includeJson}
                      onChange={(e) => setIncludeJson(e.target.checked)}
                      className="text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                    />
                  </label>
                  <label className="flex items-center justify-between cursor-pointer">
                    <span>Enable GZIP Compressing</span>
                    <input 
                      type="checkbox" 
                      checked={compress}
                      onChange={(e) => setCompress(e.target.checked)}
                      className="text-[var(--primary)] focus:ring-[var(--primary)] rounded"
                    />
                  </label>
                </div>
              </div>

            </form>
          )}
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2 shrink-0">
          <button 
            type="button"
            onClick={onClose}
            disabled={isExporting}
            className="px-3.5 py-1.5 border border-zinc-300 dark:border-zinc-700 text-zinc-750 dark:text-zinc-300 text-xs font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          {!isExporting && (
            <button 
              type="submit"
              form="exportLogsForm"
              className="px-4 py-1.5 bg-[var(--primary)] text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm flex items-center gap-1.5"
            >
              <Download size={13} />
              <span>Export Logs</span>
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
