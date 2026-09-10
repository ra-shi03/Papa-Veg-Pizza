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
import { initialMockSuppliers } from "../mockData";
import { SlidersHorizontal, RotateCcw } from "lucide-react";

export function InventoryFilters({ filters, onFilterChange, onReset }) {
  const categories = ["Cheese", "Sauce", "Veggie & Toppings", "Flour & Dough", "Packaging & Addons"];
  const statuses = [
    { label: "Available", value: "available" },
    { label: "Low Stock", value: "low_stock" },
    { label: "Out of Stock", value: "out_of_stock" }
  ];
  const units = ["KG", "Litre", "Pcs", "Box (500 Pcs)"];

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
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        
        {/* Search */}
        <div className="sm:col-span-2 md:col-span-4 lg:col-span-2 space-y-1.5">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Search</Label>
          <SearchInput 
            value={filters.search || ""} 
            onChange={(val) => onFilterChange("search", val)} 
            placeholder="Search name, supplier..."
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</Label>
          <Select 
            value={filters.category || "All"} 
            onValueChange={(val) => onFilterChange("category", val)}
          >
            <SelectTrigger className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl">
              <SelectItem value="All" className="text-xs font-semibold py-2">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat} className="text-xs font-semibold py-2">
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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

        {/* Supplier */}
        <div className="space-y-1.5 sm:col-span-1 md:col-span-2 lg:col-span-1">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Supplier</Label>
          <Select 
            value={filters.supplier || "All"} 
            onValueChange={(val) => onFilterChange("supplier", val)}
          >
            <SelectTrigger className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900 truncate">
              <SelectValue placeholder="All Suppliers" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl max-w-[240px]">
              <SelectItem value="All" className="text-xs font-semibold py-2">All Suppliers</SelectItem>
              {initialMockSuppliers.map((sup) => (
                <SelectItem key={sup._id} value={sup._id} className="text-xs font-semibold py-2 truncate">
                  {sup.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Unit */}
        <div className="space-y-1.5">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit</Label>
          <Select 
            value={filters.unit || "All"} 
            onValueChange={(val) => onFilterChange("unit", val)}
          >
            <SelectTrigger className="h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900">
              <SelectValue placeholder="All Units" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-850 rounded-xl">
              <SelectItem value="All" className="text-xs font-semibold py-2">All Units</SelectItem>
              {units.map((u) => (
                <SelectItem key={u} value={u} className="text-xs font-semibold py-2">
                  {u}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date From */}
        <div className="space-y-1.5 sm:col-span-1 md:col-span-2 lg:col-span-1">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated From</Label>
          <input 
            type="date"
            value={filters.from || ""}
            onChange={(e) => onFilterChange("from", e.target.value)}
            className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

        {/* Date To */}
        <div className="space-y-1.5 sm:col-span-1 md:col-span-2 lg:col-span-1">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Updated To</Label>
          <input 
            type="date"
            value={filters.to || ""}
            onChange={(e) => onFilterChange("to", e.target.value)}
            className="w-full h-9 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[var(--primary)] bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
          />
        </div>

      </div>
    </div>
  );
}
