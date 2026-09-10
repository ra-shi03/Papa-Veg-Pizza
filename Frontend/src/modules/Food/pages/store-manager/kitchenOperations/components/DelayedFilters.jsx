import React, { useState, useEffect } from "react";
import { Search, RotateCcw, AlertOctagon, User } from "lucide-react";
import { Input, Select, Checkbox } from "antd";

export default function DelayedFilters({ filters, onChange, onReset, staff = [] }) {
  const safeStaff = Array.isArray(staff) ? staff : [];
  const [searchInput, setSearchInput] = useState(filters.search || "");

  // Debounce search input (300ms)
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
        {/* Search Input */}
        <div className="flex-1 min-w-[200px] max-w-sm">
          <Input
            prefix={<Search size={14} className="text-slate-400 mr-1" />}
            placeholder="Search Order ID, Customer, Phone, Staff..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="compact-input rounded-xl text-xs h-9 bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-850 hover:border-slate-200 dark:hover:border-zinc-850 text-slate-800 dark:text-white"
            allowClear
          />
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Current Stage */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Stage:</span>
            <Select
              value={filters.stage || "All"}
              onChange={(val) => onChange({ ...filters, stage: val })}
              className="w-28 text-xs"
              options={[
                { value: "All", label: "All Stages" },
                { value: "queued", label: "Queued" },
                { value: "preparing", label: "Preparing" },
                { value: "baking", label: "Baking" },
                { value: "packaging", label: "Packaging" }
              ]}
              classNames={{ popup: { root: "dark:bg-zinc-900 text-xs" } }}
            />
          </div>

          {/* Priority */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Priority:</span>
            <Select
              value={filters.priority || "All"}
              onChange={(val) => onChange({ ...filters, priority: val })}
              className="w-26 text-xs"
              options={[
                { value: "All", label: "All Priority" },
                { value: "NORMAL", label: "Normal" },
                { value: "VIP", label: "VIP" },
                { value: "EXPRESS", label: "Express" }
              ]}
              classNames={{ popup: { root: "dark:bg-zinc-900 text-xs" } }}
            />
          </div>

          {/* Issue Type */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Reason:</span>
            <Select
              value={filters.issueType || "All"}
              onChange={(val) => onChange({ ...filters, issueType: val })}
              className="w-36 text-xs"
              options={[
                { value: "All", label: "All Bottlenecks" },
                { value: "Machine Failure", label: "Machine Failure" },
                { value: "Ingredient Shortage", label: "Ingredient Shortage" },
                { value: "High Order Volume", label: "High Order Volume" },
                { value: "Staff Shortage", label: "Staff Shortage" }
              ]}
              classNames={{ popup: { root: "dark:bg-zinc-900 text-xs" } }}
            />
          </div>

          {/* Staff */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Staff:</span>
            <Select
              value={filters.staffId || "All"}
              onChange={(val) => onChange({ ...filters, staffId: val })}
              className="w-36 text-xs"
              options={[
                { value: "All", label: "All Staff" },
                ...safeStaff.map(s => ({ value: s._id, label: s.name }))
              ]}
              classNames={{ popup: { root: "dark:bg-zinc-900 text-xs" } }}
            />
          </div>

          {/* Resolved Check */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-555 uppercase">Status:</span>
            <Select
              value={filters.resolved || "false"}
              onChange={(val) => onChange({ ...filters, resolved: val })}
              className="w-28 text-xs"
              options={[
                { value: "false", label: "Active Delayed" },
                { value: "true", label: "Resolved" },
                { value: "All", label: "All Orders" }
              ]}
              classNames={{ popup: { root: "dark:bg-zinc-900 text-xs" } }}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-slate-50 dark:border-zinc-850 pt-2 flex-wrap gap-2">
        {/* Checkbox filters */}
        <div className="flex items-center gap-4">
          <Checkbox
            checked={filters.criticalOnly === true || filters.criticalOnly === "true"}
            onChange={(e) => onChange({ ...filters, criticalOnly: e.target.checked })}
          >
            <span className="text-xs font-bold text-rose-500 flex items-center gap-1 select-none">
              <AlertOctagon size={12} />
              <span>Critical Delays Only (&gt; 20m)</span>
            </span>
          </Checkbox>
        </div>

        {/* Reset button */}
        <button
          onClick={() => {
            setSearchInput("");
            onReset();
          }}
          className="h-8 px-3 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-400 rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs font-extrabold cursor-pointer shadow-sm"
        >
          <RotateCcw size={12} />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}
