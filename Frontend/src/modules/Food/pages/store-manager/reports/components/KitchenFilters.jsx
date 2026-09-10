import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, Filter, RotateCcw, Shield, Users } from "lucide-react";

export default function KitchenFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load filters from URL or default values
  const preset = searchParams.get("preset") || "this-week";
  const station = searchParams.get("station") || "All";
  const staffId = searchParams.get("staffId") || "All";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const [customRange, setCustomRange] = useState(preset === "custom");
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  const getPresetDates = (selectedPreset) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    switch (selectedPreset) {
      case "today":
        return { start: todayStr, end: todayStr };
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        const yestStr = yesterday.toISOString().split("T")[0];
        return { start: yestStr, end: yestStr };
      }
      case "this-week": {
        const currentWeekStart = new Date(today);
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        currentWeekStart.setDate(diff);
        const startStr = currentWeekStart.toISOString().split("T")[0];
        return { start: startStr, end: todayStr };
      }
      case "this-month": {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startStr = new Date(startOfMonth.getTime() - startOfMonth.getTimezoneOffset() * 60000).toISOString().split("T")[0];
        return { start: startStr, end: todayStr };
      }
      default:
        return { start: "", end: "" };
    }
  };

  const handlePresetChange = (selectedPreset) => {
    const params = new URLSearchParams(searchParams);
    params.set("preset", selectedPreset);
    params.set("page", "1");

    if (selectedPreset === "custom") {
      setCustomRange(true);
    } else {
      setCustomRange(false);
      const { start, end } = getPresetDates(selectedPreset);
      params.set("startDate", start);
      params.set("endDate", end);
      setSearchParams(params);
    }
  };

  const handleCustomDateApply = () => {
    if (localStart && localEnd) {
      const params = new URLSearchParams(searchParams);
      params.set("preset", "custom");
      params.set("startDate", localStart);
      params.set("endDate", localEnd);
      params.set("page", "1");
      setSearchParams(params);
    }
  };

  const handleSelectChange = (field, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(field, value);
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleReset = () => {
    const params = new URLSearchParams();
    const defaultDates = getPresetDates("this-week");
    params.set("preset", "this-week");
    params.set("station", "All");
    params.set("staffId", "All");
    params.set("startDate", defaultDates.start);
    params.set("endDate", defaultDates.end);
    params.set("page", "1");

    setCustomRange(false);
    setLocalStart("");
    setLocalEnd("");
    setSearchParams(params);
  };

  useEffect(() => {
    if (preset !== "custom") {
      const { start, end } = getPresetDates(preset);
      if (startDate !== start || endDate !== end) {
        const params = new URLSearchParams(searchParams);
        params.set("startDate", start);
        params.set("endDate", end);
        setSearchParams(params);
      }
    }
  }, [preset]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-4.5 shadow-sm space-y-4 transition-all animate-fade duration-150">
      <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-850 pb-2">
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-extrabold text-[10px] uppercase tracking-wider">
          <Filter size={11} className="text-[var(--primary)]" />
          <span>Kitchen Performance Console</span>
        </div>
        <button
          onClick={handleReset}
          className="text-zinc-400 hover:text-[var(--primary)] flex items-center gap-1 text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
        >
          <RotateCcw size={10} />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Date presets */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold md:col-span-3">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <Calendar size={11} /> Date Range Preset
          </label>
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="this-week">This Week</option>
            <option value="this-month">This Month</option>
            <option value="custom">Custom Date Range</option>
          </select>
        </div>

        {/* Custom date range picker */}
        {customRange && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 md:col-span-5 items-end">
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Start Date</label>
              <input
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">End Date</label>
              <input
                type="date"
                value={localEnd}
                onChange={(e) => setLocalEnd(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
            <button
              onClick={handleCustomDateApply}
              className="w-full sm:w-auto px-4.5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-2xl text-xs active:scale-95 transition-all cursor-pointer"
            >
              Apply dates
            </button>
          </div>
        )}

        {/* Station Filter */}
        <div className={`flex flex-col gap-1.5 text-xs font-semibold ${customRange ? "md:col-span-2" : "md:col-span-3"}`}>
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <Shield size={11} /> Station
          </label>
          <select
            value={station}
            onChange={(e) => handleSelectChange("station", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Stations</option>
            <option value="Pizza Station">Pizza Station</option>
            <option value="Baking Station">Baking Station</option>
            <option value="Packaging Station">Packaging Station</option>
          </select>
        </div>

        {/* Staff Filter */}
        <div className={`flex flex-col gap-1.5 text-xs font-semibold ${customRange ? "md:col-span-2" : "md:col-span-3"}`}>
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <Users size={11} /> Staff Member
          </label>
          <select
            value={staffId}
            onChange={(e) => handleSelectChange("staffId", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Staff Members</option>
            <option value="sanjay">Chef Sanjay Kumar</option>
            <option value="anil">Chef Anil Sharma</option>
            <option value="priya">Chef Priya Patel</option>
          </select>
        </div>
      </div>
    </div>
  );
}
