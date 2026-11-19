import React, { useState, useEffect } from "react";
import { 
  X, Check, AlertTriangle, UserPlus, ShieldAlert, 
  DollarSign, Ticket, FileText, Upload, Calendar, 
  TrendingUp, HelpCircle, Eye, Trash2, Plus
} from "lucide-react";

// Local storage retrieval helpers
const getDB = (key) => JSON.parse(localStorage.getItem(key) || "[]");

// Premium Reusable Dialog Wrapper
export function DialogWrapper({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all animate-fade-down duration-200 z-10 max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin text-xs text-zinc-650 dark:text-zinc-350">
          {children}
        </div>
      </div>
    </div>
  );
}

// 4. EXPORT COMPLAINTS MODAL
export function ExportComplaintsModal({ isOpen, onClose, onExport, stores = [] }) {
  const [formData, setFormData] = useState({
    format: "CSV",
    storeId: "All",
    status: "All",
    priority: "All",
    dateRange: { start: "", end: "" }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport(formData.format, {
      storeId: formData.storeId,
      status: formData.status,
      priority: formData.priority,
      dateRange: formData.dateRange
    });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Export Support Tickets">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["CSV", "Excel", "PDF"].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, format: f }))}
                className={`py-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                  formData.format === f
                    ? "bg-zinc-800 text-white border-zinc-850 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200"
                    : "bg-white border-zinc-250 hover:bg-zinc-55 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Filter by Store
          </label>
          <select
            value={formData.storeId}
            onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
          >
            <option value="All">All Stores</option>
            {stores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Filter Status
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            >
              <option value="All">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Filter Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            >
              <option value="All">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
              <option value="Critical">Critical</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Custom Date Created Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[9px] text-zinc-450 font-bold uppercase block mb-0.5">From</span>
              <input
                type="date"
                value={formData.dateRange.start}
                onChange={(e) => setFormData(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-150"
              />
            </div>
            <div>
              <span className="text-[9px] text-zinc-450 font-bold uppercase block mb-0.5">To</span>
              <input
                type="date"
                value={formData.dateRange.end}
                onChange={(e) => setFormData(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-150"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-lg font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Export Now
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}
