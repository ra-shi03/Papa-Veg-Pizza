import React, { useState, useEffect } from "react";
import { Search, RotateCcw, AlertCircle, ChefHat } from "lucide-react";
import { Input, Select, Checkbox } from "antd";

export default function BakingFilters({ filters, onChange, onReset, ovens = [], staff = [] }) {
  const safeOvens = Array.isArray(ovens) ? ovens : [];
  const safeStaff = Array.isArray(staff) ? staff : [];

  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      onChange({ ...filters, search: searchInput });
    }, 300);

    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    setSearchInput(filters.search || "");
  }, [filters.search]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 p-3 rounded-2.5xl space-y-2.5 shadow-sm transition-all duration-300">
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Search Bar */}
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            prefix={<Search size={14} className="text-slate-400 mr-1" />}
            placeholder="Search Pizza, Order ID, Oven, Staff..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="compact-input rounded-xl text-xs h-9 bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-850 hover:border-slate-200 dark:hover:border-zinc-850 text-slate-800 dark:text-white"
            allowClear
          />
        </div>

        {/* Filters Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Status:</span>
            <Select
              value={filters.status || "All"}
              onChange={(val) => onChange({ ...filters, status: val })}
              className="w-32 text-xs"
              options={[
                { value: "All", label: "All Statuses" },
                { value: "ready_for_baking", label: "Ready For Baking" },
                { value: "baking_started", label: "Baking Started" },
                { value: "baking_paused", label: "Baking Paused" },
                { value: "baking_completed", label: "Baking Completed" }
              ]}
              popupClassName="dark:bg-zinc-900 text-xs"
            />
          </div>

          {/* Oven */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Oven:</span>
            <Select
              value={filters.oven || "All"}
              onChange={(val) => onChange({ ...filters, oven: val })}
              className="w-28 text-xs"
              options={[
                { value: "All", label: "All Ovens" },
                ...safeOvens.map(o => ({ value: o._id, label: o.oven_number }))
              ]}
              popupClassName="dark:bg-zinc-900 text-xs"
            />
          </div>

          {/* Assigned Staff */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Staff:</span>
            <Select
              value={filters.staff || "All"}
              onChange={(val) => onChange({ ...filters, staff: val })}
              className="w-36 text-xs"
              options={[
                { value: "All", label: "All Staff" },
                ...safeStaff.map(s => ({ value: s._id, label: s.name }))
              ]}
              popupClassName="dark:bg-zinc-900 text-xs"
            />
          </div>

          {/* Reset button */}
          <button
            onClick={() => {
              setSearchInput("");
              onReset();
            }}
            className="h-9 px-3 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-400 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-extrabold cursor-pointer shadow-sm"
          >
            <RotateCcw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Quick Checkbox Toggles */}
      <div className="flex flex-wrap items-center gap-4 pt-1.5 border-t border-slate-50 dark:border-zinc-850">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-zinc-400">
          <Checkbox
            checked={filters.delayed === "true"}
            onChange={(e) =>
              onChange({ ...filters, delayed: e.target.checked ? "true" : "false" })
            }
            className="accent-rose-500"
          />
          <div className="flex items-center gap-1">
            <AlertCircle size={12} className="text-rose-500" />
            <span>Delayed Bakes only</span>
          </div>
        </label>

        {/* Priority Filter Select */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Priority:</span>
          <Select
            value={filters.priority || "All"}
            onChange={(val) => onChange({ ...filters, priority: val })}
            className="w-28 text-xs"
            options={[
              { value: "All", label: "All Priority" },
              { value: "NORMAL", label: "Normal" },
              { value: "VIP", label: "VIP" },
              { value: "EXPRESS", label: "Express" }
            ]}
            popupClassName="dark:bg-zinc-900 text-xs"
          />
        </div>
      </div>
    </div>
  );
}
