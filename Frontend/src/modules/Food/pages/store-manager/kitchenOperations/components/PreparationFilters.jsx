import React, { useState, useEffect } from "react";
import { Search, RotateCcw, User, AlertCircle } from "lucide-react";
import { Input, Select, Checkbox } from "antd";

export default function PreparationFilters({ filters, onChange, onReset, chefs = [] }) {
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
            placeholder="Search Order ID, Pizza Name, Chef..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="compact-input rounded-xl text-xs h-9 bg-slate-50 dark:bg-zinc-950 border-slate-100 dark:border-zinc-850 hover:border-slate-200 dark:hover:border-zinc-850 text-slate-800 dark:text-white"
            allowClear
          />
        </div>

        {/* Filters selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Priority */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase">Priority:</span>
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

          {/* Size */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase">Size:</span>
            <Select
              value={filters.size || "All"}
              onChange={(val) => onChange({ ...filters, size: val })}
              className="w-24 text-xs"
              options={[
                { value: "All", label: "All Sizes" },
                { value: "Medium", label: "Medium" },
                { value: "Large", label: "Large" }
              ]}
              popupClassName="dark:bg-zinc-900 text-xs"
            />
          </div>

          {/* Assigned Chef */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-550 uppercase">Chef:</span>
            <Select
              value={filters.chef || "All"}
              onChange={(val) => onChange({ ...filters, chef: val })}
              className="w-36 text-xs"
              options={[
                { value: "All", label: "All Chefs" },
                { value: "Unassigned", label: "Unassigned Only" },
                ...chefs.map((c) => ({ value: c._id, label: c.name }))
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
            <span>Delayed Items only</span>
          </div>
        </label>

        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-600 dark:text-zinc-400">
          <Checkbox
            checked={filters.onlyUnassigned === "true"}
            onChange={(e) =>
              onChange({ ...filters, onlyUnassigned: e.target.checked ? "true" : "false" })
            }
            className="accent-[var(--primary)]"
          />
          <div className="flex items-center gap-1">
            <User size={12} className="text-amber-500" />
            <span>Unassigned only</span>
          </div>
        </label>
      </div>
    </div>
  );
}
