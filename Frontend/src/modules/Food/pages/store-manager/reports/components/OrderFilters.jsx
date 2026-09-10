import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, RotateCcw, Calendar, Search, Tag, CreditCard, ShoppingBag } from "lucide-react";

export default function OrderFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load state from URL params
  const preset = searchParams.get("preset") || "this-week";
  const status = searchParams.get("status") || "All";
  const paymentMethod = searchParams.get("paymentMethod") || "All";
  const orderType = searchParams.get("orderType") || "All";
  const couponUsed = searchParams.get("couponUsed") || "All";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const searchVal = searchParams.get("search") || "";

  const [customRange, setCustomRange] = useState(preset === "custom");
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const [localSearch, setLocalSearch] = useState(searchVal);

  // Debounced Search (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams);
      if (localSearch) {
        params.set("search", localSearch);
      } else {
        params.delete("search");
      }
      params.set("page", "1");
      setSearchParams(params);
    }, 400);

    return () => clearTimeout(handler);
  }, [localSearch]);

  // Sync local search if URL updates externally
  useEffect(() => {
    setLocalSearch(searchVal);
  }, [searchVal]);

  const getPresetDates = (selectedPreset) => {
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    switch (selectedPreset) {
      case "today":
        return { start: todayStr, end: todayStr };
      case "yesterday": {
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return { start: yesterday.toISOString().split("T")[0], end: yesterday.toISOString().split("T")[0] };
      }
      case "this-week": {
        const weekStart = new Date(today);
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1);
        weekStart.setDate(diff);
        return { start: weekStart.toISOString().split("T")[0], end: todayStr };
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
    params.set("status", "All");
    params.set("paymentMethod", "All");
    params.set("orderType", "All");
    params.set("couponUsed", "All");
    params.set("startDate", defaultDates.start);
    params.set("endDate", defaultDates.end);
    params.set("page", "1");

    setCustomRange(false);
    setLocalStart("");
    setLocalEnd("");
    setLocalSearch("");
    setSearchParams(params);
  };

  // Sync initial dates
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
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-4.5 shadow-sm space-y-4 transition-all">
      <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-extrabold text-[10px] uppercase tracking-wider pb-1 border-b border-zinc-50 dark:border-zinc-850">
        <Filter size={11} className="text-[var(--primary)]" />
        <span>Order Filters Console</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-4">
        {/* Search */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold md:col-span-3">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Order Search</label>
          <div className="relative">
            <input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder="Search ID, customer name..."
              className="w-full text-xs font-bold pl-8.5 pr-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all shadow-inner"
            />
            <Search className="absolute left-3 top-2.5 text-zinc-400" size={13} />
          </div>
        </div>

        {/* Date Preset */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold md:col-span-2">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Date Preset</label>
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

        {/* Custom date picker */}
        {customRange && (
          <div className="grid grid-cols-2 gap-2 md:col-span-4 items-end">
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <input
                type="date"
                value={localStart}
                onChange={(e) => setLocalStart(e.target.value)}
                className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-xs font-semibold">
              <div className="relative flex items-center">
                <input
                  type="date"
                  value={localEnd}
                  onChange={(e) => setLocalEnd(e.target.value)}
                  className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all"
                />
                <button
                  type="button"
                  onClick={handleCustomDateApply}
                  disabled={!localStart || !localEnd}
                  className="absolute -right-1.5 py-1.5 px-2 bg-[var(--primary)] text-white text-[10px] font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Go
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Status */}
        <div className={`flex flex-col gap-1.5 text-xs font-semibold ${customRange ? "md:col-span-1" : "md:col-span-2"}`}>
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500">Status</label>
          <select
            value={status}
            onChange={(e) => handleSelectChange("status", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Statuses</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
            <option value="Refunded">Refunded</option>
            <option value="Pending">Pending</option>
            <option value="Preparing">Preparing</option>
            <option value="Delivered">Delivered</option>
          </select>
        </div>

        {/* Payment */}
        <div className={`flex flex-col gap-1.5 text-xs font-semibold ${customRange ? "md:col-span-1" : "md:col-span-2"}`}>
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <CreditCard size={10} />
            Payment
          </label>
          <select
            value={paymentMethod}
            onChange={(e) => handleSelectChange("paymentMethod", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Payments</option>
            <option value="Cash">Cash</option>
            <option value="UPI">UPI</option>
            <option value="Card">Card</option>
            <option value="Wallet">Wallet</option>
          </select>
        </div>

        {/* Type */}
        <div className={`flex flex-col gap-1.5 text-xs font-semibold ${customRange ? "md:col-span-1" : "md:col-span-2"}`}>
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <ShoppingBag size={10} />
            Type
          </label>
          <select
            value={orderType}
            onChange={(e) => handleSelectChange("orderType", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Types</option>
            <option value="Delivery">Delivery</option>
            <option value="Takeaway">Takeaway</option>
            <option value="Dine-In">Dine-In</option>
          </select>
        </div>

        {/* Coupons */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold md:col-span-1">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-0.5">
            <Tag size={10} />
            Coupon
          </label>
          <select
            value={couponUsed}
            onChange={(e) => handleSelectChange("couponUsed", e.target.value)}
            className="w-full text-xs font-bold px-2 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All</option>
            <option value="Coupon Applied">Applied</option>
            <option value="No Coupon">None</option>
          </select>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-zinc-50 dark:border-zinc-850">
        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500">
          Selected Date Boundary: <strong className="text-[var(--primary)]">{startDate || "Start"}</strong> to <strong className="text-[var(--primary)]">{endDate || "End"}</strong>
        </span>
        <button
          onClick={handleReset}
          className="flex items-center gap-1 px-4 py-2 bg-neutral-50 hover:bg-neutral-100 dark:bg-zinc-850 dark:hover:bg-zinc-800 text-zinc-650 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
        >
          <RotateCcw size={11} className="text-zinc-400" />
          <span>Reset Filters</span>
        </button>
      </div>
    </div>
  );
}
