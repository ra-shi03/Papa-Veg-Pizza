import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import { ChangeSummaryTable } from './AuditHelper';

export default function JsonViewerModal({ isOpen, onClose, oldVal, newVal, title = "Configuration Comparison View" }) {
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 md:p-4 animate-fade">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-4xl rounded-t-2xl md:rounded-xl shadow-2xl flex flex-col h-[90vh] md:h-[75vh] overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-black dark:text-zinc-50">
              {title}
            </h3>
            <p className="text-[10px] text-zinc-700 dark:text-zinc-300 font-medium mt-0.5">
              Compare property modifications side-by-side between the original state and updated configurations
            </p>
          </div>
          <div className="flex items-center gap-2">
            {/* Search within Properties */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" size={13} />
              <input 
                type="text" 
                placeholder="Search properties..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 w-40 sm:w-48 border border-zinc-300 dark:border-zinc-700 rounded-lg bg-zinc-50 dark:bg-zinc-800 text-xs focus:ring-1 focus:ring-[var(--primary)] outline-none text-black dark:text-zinc-100 font-semibold"
              />
            </div>
            
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full text-zinc-750 dark:text-zinc-300 hover:text-black dark:hover:text-zinc-50 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 p-5 overflow-y-auto bg-zinc-50 dark:bg-zinc-950 scrollbar-thin scrollbar-thumb-zinc-250 dark:scrollbar-thumb-zinc-800">
          <ChangeSummaryTable oldVal={oldVal} newVal={newVal} searchFilter={searchQuery} />
        </div>

        {/* Footer */}
        <footer className="p-3 bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end shrink-0">
          <button 
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-black dark:bg-zinc-800 text-white text-xs font-semibold rounded-lg hover:opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Close Comparison
          </button>
        </footer>

      </div>
    </div>
  );
}
