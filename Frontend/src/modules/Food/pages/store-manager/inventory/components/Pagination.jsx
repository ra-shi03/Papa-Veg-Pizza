import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage }) {
  if (totalPages <= 1) return null;

  const startIndex = (currentPage - 1) * itemsPerPage + 1;
  const endIndex = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3.5 bg-slate-50 dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-850 select-none">
      <span className="text-[11px] font-bold text-slate-400">
        Showing {startIndex}-{endIndex} of {totalItems} items
      </span>
      
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="h-7 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1"
        >
          <ChevronLeft size={13} />
          Previous
        </button>
        
        <span className="text-[11px] font-bold text-slate-500 px-2.5">
          Page {currentPage} of {totalPages}
        </span>
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="h-7 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-[11px] font-bold text-zinc-600 dark:text-zinc-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-1"
        >
          Next
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
