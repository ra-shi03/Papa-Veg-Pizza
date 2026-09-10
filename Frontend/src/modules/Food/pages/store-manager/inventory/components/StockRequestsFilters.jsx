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
import { useIngredients } from "../hooks/useIngredients";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

export function StockRequestsFilters({ filters, onFilterChange, onReset }) {
  const { data: ingredientsData } = useIngredients({ limit: 100 });
  const ingredientsList = ingredientsData?.data || [];

  const statuses = [
    { label: "Pending", value: "pending" },
    { label: "Approved", value: "approved" },
    { label: "Rejected", value: "rejected" },
    { label: "Fulfilled", value: "fulfilled" }
  ];

  const urgencies = [
    { label: "Low", value: "low" },
    { label: "Medium", value: "medium" },
    { label: "High", value: "high" },
    { label: "Critical", value: "critical" }
  ];

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 select-none">
      
      {/* Filters Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-slate-800 dark:text-zinc-200">
          <SlidersHorizontal size={15} className="text-[var(--primary)]" />
          <span className="text-xs font-black tracking-tight uppercase">Search & Filters</span>
        </div>
        <button
          onClick={onReset}
          className="text-[10px] font-black text-zinc-500 hover:text-[var(--primary)] dark:text-zinc-400 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
        >
          <RotateCcw size={11} />
          Reset Filters
        </button>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        {/* Search */}
        <div className="sm:col-span-2 space-y-1.5">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search Request No</Label>
          <SearchInput 
            value={filters.search || ""} 
            onChange={(val) => onFilterChange("search", val)} 
            placeholder="e.g. SR-2026-001..."
          />
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</Label>
          <Select 
            value={filters.status || "All"} 
            onValueChange={(val) => onFilterChange("status", val)}
          >
            <SelectTrigger className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl">
              <SelectItem value="All" className="text-xs font-semibold py-2">All Statuses</SelectItem>
              {statuses.map((st) => (
                <SelectItem key={st.value} value={st.value} className="text-xs font-semibold py-2">
                  {st.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Urgency */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgency</Label>
          <Select 
            value={filters.urgency || "All"} 
            onValueChange={(val) => onFilterChange("urgency", val)}
          >
            <SelectTrigger className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="All Urgency" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl">
              <SelectItem value="All" className="text-xs font-semibold py-2">All Urgency</SelectItem>
              {urgencies.map((ur) => (
                <SelectItem key={ur.value} value={ur.value} className="text-xs font-semibold py-2">
                  {ur.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ingredient Filter */}
        <div className="space-y-1.5 sm:col-span-1 md:col-span-1">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ingredient</Label>
          <Select 
            value={filters.ingredientId || "All"} 
            onValueChange={(val) => onFilterChange("ingredientId", val)}
          >
            <SelectTrigger className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900 truncate">
              <SelectValue placeholder="All Ingredients" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl max-h-[300px]">
              <SelectItem value="All" className="text-xs font-semibold py-2">All Ingredients</SelectItem>
              {ingredientsList.map((ing) => (
                <SelectItem key={ing._id} value={ing._id} className="text-xs font-semibold py-2">
                  {ing.ingredientName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-1.5 sm:col-span-1 md:col-span-1">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created From</Label>
          <input 
            type="date"
            value={filters.from || ""}
            onChange={(e) => onFilterChange("from", e.target.value)}
            className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5 sm:col-span-1 md:col-span-1">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Created To</Label>
          <input 
            type="date"
            value={filters.to || ""}
            onChange={(e) => onFilterChange("to", e.target.value)}
            className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-350"
          />
        </div>

      </div>
    </div>
  );
}
