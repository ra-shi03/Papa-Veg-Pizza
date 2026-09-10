import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Calendar, Filter, RotateCcw, CreditCard, ShoppingBag } from "lucide-react";

export default function SalesFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load initial filters from URL or set defaults
  const preset = searchParams.get("preset") || "this-week";
  const paymentMethod = searchParams.get("paymentMethod") || "All";
  const orderType = searchParams.get("orderType") || "All";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";

  const [customRange, setCustomRange] = useState(preset === "custom");
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);

  // Calculate preset date ranges relative to today (June 25, 2026)
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
        // Start of current week (Monday)
        const currentWeekStart = new Date(today);
        const dayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // adjust when day is sunday
        currentWeekStart.setDate(diff);
        const startStr = currentWeekStart.toISOString().split("T")[0];
        return { start: startStr, end: todayStr };
      }
      case "this-month": {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        // Correct timezone offset offset issues
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
    params.set("page", "1"); // Reset page pagination

    if (selectedPreset === "custom") {
      setCustomRange(true);
      // Don't auto-search yet, let user pick dates
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
    params.set("paymentMethod", "All");
    params.set("orderType", "All");
    params.set("startDate", defaultDates.start);
    params.set("endDate", defaultDates.end);
    params.set("page", "1");
    
    setCustomRange(false);
    setLocalStart("");
    setLocalEnd("");
    setSearchParams(params);
  };

  // Sync state if url updates externally
  useEffect(() => {
    if (preset !== "custom") {
      const { start, end } = getPresetDates(preset);
      // Only update URL if values are missing or different
      if (startDate !== start || endDate !== end) {
        const params = new URLSearchParams(searchParams);
        params.set("startDate", start);
        params.set("endDate", end);
        setSearchParams(params);
      }
    }
  }, [preset]);

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-4.5 shadow-sm space-y-4 transition-all">
      {/* Header Info */}
      <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-extrabold text-[10px] uppercase tracking-wider pb-1 border-b border-zinc-50 dark:border-zinc-850">
        <Filter size={11} className="text-[var(--primary)]" />
        <span>Sales Filters Console</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        {/* Date presets */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold md:col-span-3">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Date Range Preset</label>
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-205 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
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
              disabled={!localStart || !localEnd}
              className="py-2 px-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-2xl transition-all cursor-pointer shadow-sm text-center w-full disabled:opacity-50"
            >
              Apply Date
            </button>
          </div>
        )}

        {/* Payment Method filter */}
        <div className={`flex flex-col gap-1.5 text-xs font-semibold ${customRange ? "md:col-span-2" : "md:col-span-4"}`}>
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <CreditCard size={10} />
            Payment Channel
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => handleSelectChange("paymentMethod", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Payment Methods</option>
            <option value="Cash">Cash Payments</option>
            <option value="UPI">UPI / PhonePe</option>
            <option value="Card">Card Transactions</option>
            <option value="Wallet">Mobile Wallets</option>
          </select>
        </div>

        {/* Order Type filter */}
        <div className={`flex flex-col gap-1.5 text-xs font-semibold ${customRange ? "md:col-span-2" : "md:col-span-4"}`}>
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <ShoppingBag size={10} />
            Order Dining Type
          </label>
          <select
            value={orderType}
            onChange={(e) => handleSelectChange("orderType", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Order Types</option>
            <option value="Dine-In">Dine-In</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Delivery">Delivery Service</option>
          </select>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-zinc-50 dark:border-zinc-850">
        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
          Showing data for: <strong className="text-[var(--primary)]">{startDate || "Start"}</strong> to <strong className="text-[var(--primary)]">{endDate || "End"}</strong>
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-4 py-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
        >
          <RotateCcw size={11} className="text-zinc-400" />
          <span>Reset Console</span>
        </button>
      </div>
    </div>
  );
}
