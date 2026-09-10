import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, Filter, RotateCcw } from "lucide-react";

export default function StoreFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load initial filters from URL or set defaults
  const period = searchParams.get("period") || "monthly";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const preset = searchParams.get("preset") || "default";

  const [customRange, setCustomRange] = useState(preset === "custom");
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  const getPresetDates = (selectedPeriod) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];
    
    switch (selectedPeriod) {
      case "monthly": {
        // Last 12 months starting from last year
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        const startStr = oneYearAgo.toISOString().split("T")[0];
        return { start: startStr, end: todayStr };
      }
      case "quarterly": {
        // Last 4 quarters
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(today.getFullYear() - 1);
        const startStr = oneYearAgo.toISOString().split("T")[0];
        return { start: startStr, end: todayStr };
      }
      case "yearly": {
        // Last 3 years
        const threeYearsAgo = new Date();
        threeYearsAgo.setFullYear(today.getFullYear() - 3);
        const startStr = threeYearsAgo.toISOString().split("T")[0];
        return { start: startStr, end: todayStr };
      }
      default:
        return { start: "", end: "" };
    }
  };

  const handlePeriodChange = (selectedPeriod) => {
    const params = new URLSearchParams(searchParams);
    params.set("period", selectedPeriod);
    params.set("preset", "default");
    params.set("page", "1");

    setCustomRange(false);
    const { start, end } = getPresetDates(selectedPeriod);
    params.set("startDate", start);
    params.set("endDate", end);
    setSearchParams(params);
  };

  const handleCustomRangeToggle = () => {
    const nextCustom = !customRange;
    setCustomRange(nextCustom);
    
    const params = new URLSearchParams(searchParams);
    if (nextCustom) {
      params.set("preset", "custom");
      setSearchParams(params);
    } else {
      params.set("preset", "default");
      const { start, end } = getPresetDates(period);
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

  const handleReset = () => {
    const params = new URLSearchParams();
    const defaultDates = getPresetDates("monthly");
    params.set("period", "monthly");
    params.set("preset", "default");
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
      const { start, end } = getPresetDates(period);
      if (startDate !== start || endDate !== end) {
        const params = new URLSearchParams(searchParams);
        params.set("startDate", start);
        params.set("endDate", end);
        setSearchParams(params);
      }
    }
  }, [period, preset]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-3 shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
      
      {/* Left side: Icon, period controls, range controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-550 font-extrabold text-[10px] uppercase tracking-wider pr-3 border-r border-zinc-200 dark:border-zinc-800 shrink-0">
          <Filter size={11} className="text-[var(--primary)]" />
          <span>Filters</span>
        </div>

        {/* Period select */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 shrink-0">Period:</span>
          <div className="flex bg-neutral-50 dark:bg-zinc-950 p-0.5 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
            {["monthly", "quarterly", "yearly"].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => handlePeriodChange(p)}
                className={`py-1 px-3.5 rounded-xl text-center font-bold capitalize transition-all cursor-pointer text-[11px] ${
                  period === p
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-zinc-650 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Range select */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 shrink-0">Range:</span>
          <button
            type="button"
            onClick={handleCustomRangeToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-[11px] font-bold transition-all cursor-pointer ${
              customRange
                ? "border-[var(--primary)] text-[var(--primary)]"
                : "text-zinc-805 dark:text-white"
            }`}
          >
            <span>{customRange ? "Custom Range" : "Preset Range"}</span>
            <Calendar size={12} className="text-zinc-400 shrink-0" />
          </button>
        </div>

        {/* Custom date range inputs */}
        {customRange && (
          <div className="flex items-center gap-2 animate-fade-in duration-200">
            <input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="text-[11px] font-bold px-2 py-1 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-850 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
            />
            <span className="text-zinc-400 font-bold text-[10px]">to</span>
            <input
              type="date"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              className="text-[11px] font-bold px-2 py-1 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-850 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
            />
            <button
              onClick={handleCustomDateApply}
              disabled={!localStart || !localEnd}
              className="py-1 px-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-sm disabled:opacity-50"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Right side: showing details range text, reset button */}
      <div className="flex items-center gap-4 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-zinc-100 dark:border-zinc-850">
        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 whitespace-nowrap">
          {startDate && endDate && (
            <>
              Showing data: <strong className="text-[var(--primary)]">{startDate}</strong> to <strong className="text-[var(--primary)]">{endDate}</strong>
            </>
          )}
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 px-4.5 py-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-[11px] border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm active:scale-95 whitespace-nowrap"
        >
          <RotateCcw size={11} className="text-zinc-400 shrink-0" />
          <span>Reset Console</span>
        </button>
      </div>

    </div>
  );
}
