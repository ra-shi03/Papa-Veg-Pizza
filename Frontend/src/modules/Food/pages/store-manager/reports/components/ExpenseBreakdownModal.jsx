import React, { useEffect } from "react";
import { X, TrendingDown, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useExpenseBreakdown } from "../hooks/useExpenseBreakdown";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
};

export default function ExpenseBreakdownModal({ isOpen, onClose, month }) {
  const { data, isLoading, isError, refetch } = useExpenseBreakdown(month, isOpen);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const {
    ingredients = 0,
    staffSalaries = 0,
    deliveryCosts = 0,
    utilities = 0,
    maintenance = 0,
    otherExpenses = 0,
    totalExpenses = 0
  } = data || {};

  const chartData = [
    { name: "Ingredients", value: ingredients },
    { name: "Staff Salaries", value: staffSalaries },
    { name: "Delivery Costs", value: deliveryCosts },
    { name: "Utilities", value: utilities },
    { name: "Maintenance", value: maintenance },
    { name: "Other Expenses", value: otherExpenses }
  ].filter(item => item.value > 0);

  const COLORS = ["#f59e0b", "#3b82f6", "#ef4444", "#10b981", "#7c3aed", "#6b7280"];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] overflow-x-hidden overflow-y-auto outline-none transition-all">
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity"
      />

      <div className="relative w-full max-w-3xl mx-3 my-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-down duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500 flex items-center justify-center">
              <TrendingDown size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Expense Breakdown Analysis
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-555 font-bold mt-0.5">
                Categorized expenses and overheads for {month}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:text-zinc-550 dark:hover:text-zinc-350 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="h-48 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
              <div className="h-32 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
            </div>
          ) : isError ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-sm font-bold text-rose-500">Failed to load expense breakdown details</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-1 mx-auto cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Pie Chart */}
              <div className="h-60 w-full text-[10px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatINR(value)} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" iconSize={6} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Data list */}
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl space-y-2.5">
                  <div className="flex justify-between text-xs font-black text-slate-900 dark:text-white pb-2 border-b border-dashed border-zinc-200 dark:border-zinc-800">
                    <span>Total Outflow Expenses</span>
                    <span className="text-rose-600">{formatINR(totalExpenses)}</span>
                  </div>
                  {chartData.map((item, idx) => {
                    const percentage = totalExpenses > 0 ? ((item.value / totalExpenses) * 100).toFixed(1) : "0";
                    return (
                      <div key={idx} className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                          <span>{item.name}</span>
                        </div>
                        <span>{formatINR(item.value)} ({percentage}%)</span>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold rounded-2xl text-xs transition-all cursor-pointer active:scale-95"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
