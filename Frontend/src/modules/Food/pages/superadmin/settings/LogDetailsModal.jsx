import React, { useState } from 'react';
import { X, User, Activity, History, ChevronDown, ChevronRight } from 'lucide-react';
import { ChangeSummaryTable } from './AuditHelper';

export default function LogDetailsModal({ isOpen, onClose, log }) {
  const [expandedSections, setExpandedSections] = useState({
    user: true,
    action: true,
    history: true
  });

  if (!isOpen || !log) return null;

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-auto md:max-h-[85vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-50 flex items-center gap-1.5">
              <Activity className="text-[var(--primary)] shrink-0" size={18} />
              Audit Log Details
            </h3>
            <p className="text-[10px] text-zinc-700 dark:text-zinc-350 mt-0.5 font-medium">
              Unique Trace Identifier: <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{log._id}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-zinc-200 dark:scrollbar-thumb-zinc-800">
          
          {/* Section 1: User Information */}
          <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/40">
            <button 
              onClick={() => toggleSection('user')}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:opacity-90 border-b border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <User size={14} className="text-blue-500" />
                <span>Actor & User Information</span>
              </div>
              {expandedSections.user ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {expandedSections.user && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-500 block">User Name</span>
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{log.userName || log.actorId}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-500 block">Actor ID</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-250 font-bold">{log.actorId}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-550 block">Role</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{log.actorRole}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-550 block">IP Address</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{log.ipAddress}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-550 block">Device</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{log.device}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-550 block">Browser</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{log.browser}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-555 block">Location</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{log.location || 'India'}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-555 block">Date & Time</span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">{new Date(log.createdAt).toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Action Information */}
          <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/40">
            <button 
              onClick={() => toggleSection('action')}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:opacity-90 border-b border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <Activity size={14} className="text-[var(--primary)]" />
                <span>Action & Module Information</span>
              </div>
              {expandedSections.action ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {expandedSections.action && (
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-555 block">Triggered Action</span>
                  <span className="font-extrabold text-zinc-900 dark:text-zinc-50">{log.action}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-555 block">Target Module</span>
                  <span className="font-bold text-zinc-900 dark:text-zinc-100">{log.module}</span>
                </div>
                <div className="space-y-0.5 col-span-2">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-555 block">Entity Reference ID</span>
                  <span className="font-mono text-zinc-850 dark:text-zinc-250 font-bold select-all">{log.entityId || 'N/A'}</span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9.5px] uppercase tracking-wider text-zinc-555 block">Result Status</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase inline-block border ${
                    log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    log.status === 'Failed' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                    log.status === 'Warning' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                    'bg-zinc-500/10 text-zinc-650 border-zinc-500/20'
                  }`}>
                    {log.status}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Change Details Summary Table */}
          <div className="border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden bg-white dark:bg-zinc-900/40">
            <button 
              onClick={() => toggleSection('history')}
              className="w-full flex items-center justify-between px-4 py-2.5 bg-zinc-50 dark:bg-zinc-900 text-xs font-bold text-zinc-800 dark:text-zinc-200 hover:opacity-90 border-b border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex items-center gap-2">
                <History size={14} className="text-purple-500" />
                <span>Configuration Change Properties</span>
              </div>
              {expandedSections.history ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            {expandedSections.history && (
              <div className="p-4">
                <ChangeSummaryTable oldVal={log.oldValue} newVal={log.newValue} />
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-black dark:bg-zinc-800 text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Close Details
          </button>
        </footer>

      </div>
    </div>
  );
}
