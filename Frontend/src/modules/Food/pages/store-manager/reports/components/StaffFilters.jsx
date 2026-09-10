import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Filter, RotateCcw, Shield, Briefcase, Calendar } from "lucide-react";

export default function StaffFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Load from URL or set defaults
  const period = searchParams.get("period") || "monthly";
  const role = searchParams.get("role") || "All";
  const station = searchParams.get("station") || "All";

  const handleSelectChange = (field, value) => {
    const params = new URLSearchParams(searchParams);
    params.set(field, value);
    params.set("page", "1"); // Reset pagination
    setSearchParams(params);
  };

  const handleReset = () => {
    const params = new URLSearchParams();
    params.set("period", "monthly");
    params.set("role", "All");
    params.set("station", "All");
    params.set("page", "1");
    setSearchParams(params);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl p-4.5 shadow-sm space-y-4 transition-all duration-300">
      <div className="flex items-center justify-between border-b border-zinc-50 dark:border-zinc-850 pb-2">
        <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 font-extrabold text-[10px] uppercase tracking-wider">
          <Filter size={11} className="text-[var(--primary)]" />
          <span>Staff Performance Filters</span>
        </div>
        <button
          onClick={handleReset}
          className="text-zinc-400 hover:text-[var(--primary)] flex items-center gap-1 text-[10px] font-black uppercase tracking-wider cursor-pointer active:scale-95 transition-all"
        >
          <RotateCcw size={10} />
          <span>Reset Filters</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Period selection */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <Calendar size={11} /> Performance Period
          </label>
          <select
            value={period}
            onChange={(e) => handleSelectChange("period", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="daily">Daily Performance</option>
            <option value="weekly">Weekly Performance</option>
            <option value="monthly">Monthly Performance</option>
          </select>
        </div>

        {/* Staff Role */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <Briefcase size={11} /> Staff Role
          </label>
          <select
            value={role}
            onChange={(e) => handleSelectChange("role", e.target.value)}
            className="w-full text-xs font-bold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] cursor-pointer transition-all"
          >
            <option value="All">All Roles</option>
            <option value="Chef">Chef</option>
            <option value="Kitchen Staff">Kitchen Staff</option>
            <option value="Cashier">Cashier</option>
            <option value="Store Manager">Store Manager</option>
            <option value="Delivery Rider">Delivery Rider</option>
          </select>
        </div>

        {/* Kitchen Station */}
        <div className="flex flex-col gap-1.5 text-xs font-semibold">
          <label className="text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
            <Shield size={11} /> Station Assignment
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
            <option value="N/A">Not Applicable (Cashier, Rider, Manager)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
