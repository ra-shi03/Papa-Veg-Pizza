import React from "react";
import { SearchInput } from "./SearchInput";
import { Label } from "@food/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@food/components/ui/select";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

export function ShortageFilters({ filters, onFilterChange, onReset }) {
  const severities = [
    { label: "Critical", value: "critical" },
    { label: "High", value: "high" },
    { label: "Medium", value: "medium" },
    { label: "Low", value: "low" }
  ];

  const statuses = [
    { label: "Active", value: "active" },
    { label: "Resolved", value: "resolved" }
  ];

  const stores = [
    { label: "Indore Main Store", value: "st-indore-01" },
    { label: "Vijay Nagar Store", value: "st-indore-02" },
    { label: "Palasia Store", value: "st-indore-03" }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3 select-none">
      {/* Filters Header bar */}
      <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-1.5 text-slate-800 dark:text-zinc-200">
          <SlidersHorizontal size={14} className="text-[var(--primary)]" />
          <span className="text-[10px] font-black tracking-tight uppercase">Search & Filters</span>
        </div>
        <button
          onClick={onReset}
          className="text-[9px] font-black text-zinc-500 hover:text-[var(--primary)] dark:text-zinc-400 flex items-center gap-1 transition-colors uppercase tracking-wider"
        >
          <RotateCcw size={10} />
          Reset Filters
        </button>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Search */}
        <div className="sm:col-span-2 space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Search Ingredient</Label>
          <SearchInput 
            value={filters.search || ""} 
            onChange={(val) => onFilterChange("search", val)} 
            placeholder="Search ingredient..."
            className="h-8 text-xs rounded-lg"
          />
        </div>

        {/* Severity */}
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Severity</Label>
          <Select 
            value={filters.severity || "All"} 
            onValueChange={(val) => onFilterChange("severity", val)}
          >
            <SelectTrigger className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="All Severities" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg">
              <SelectItem value="All" className="text-xs font-semibold py-1.5">All Severities</SelectItem>
              {severities.map((s) => (
                <SelectItem key={s.value} value={s.value} className="text-xs font-semibold py-1.5">
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status */}
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status</Label>
          <Select 
            value={filters.status || "All"} 
            onValueChange={(val) => onFilterChange("status", val)}
          >
            <SelectTrigger className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg">
              <SelectItem value="All" className="text-xs font-semibold py-1.5">All Statuses</SelectItem>
              {statuses.map((st) => (
                <SelectItem key={st.value} value={st.value} className="text-xs font-semibold py-1.5">
                  {st.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">From Date</Label>
          <input 
            type="date"
            value={filters.from || ""}
            onChange={(e) => onFilterChange("from", e.target.value)}
            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">To Date</Label>
          <input 
            type="date"
            value={filters.to || ""}
            onChange={(e) => onFilterChange("to", e.target.value)}
            className="w-full h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>
      </div>
    </div>
  );
}
