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

export function WasteFilters({ filters, onFilterChange, onReset, role }) {
  
  const wasteTypes = [
    { label: "Expired", value: "expired" },
    { label: "Burnt", value: "burnt" },
    { label: "Damaged", value: "damaged" },
    { label: "Spillage", value: "spillage" }
  ];

  const reportedOptions = [
    { name: "Aman Verma" },
    { name: "Vijay Saxena" },
    { name: "Ramesh Singh" },
    { name: "Shubham Jamliya" }
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
            placeholder="Search ingredient or reason..."
            className="h-8 text-xs rounded-lg"
          />
        </div>

        {/* Waste Type */}
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Waste Type</Label>
          <Select 
            value={filters.wasteType || "All"} 
            onValueChange={(val) => onFilterChange("wasteType", val)}
          >
            <SelectTrigger className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg">
              <SelectItem value="All" className="text-xs font-semibold py-1.5">All Types</SelectItem>
              {wasteTypes.map((t) => (
                <SelectItem key={t.value} value={t.value} className="text-xs font-semibold py-1.5">
                  {t.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reported By (Only enabled/visible for supervisor/manager or let it show as readonly for staff) */}
        <div className="space-y-1">
          <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Reported By</Label>
          <Select 
            value={role === "kitchen_staff" ? filters.reportedBy || "All" : filters.reportedBy || "All"} 
            onValueChange={(val) => onFilterChange("reportedBy", val)}
            disabled={role === "kitchen_staff"}
          >
            <SelectTrigger className="h-8 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="All Reporters" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-lg">
              <SelectItem value="All" className="text-xs font-semibold py-1.5">All Staff</SelectItem>
              {reportedOptions.map((st) => (
                <SelectItem key={st.name} value={st.name} className="text-xs font-semibold py-1.5">
                  {st.name}
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
