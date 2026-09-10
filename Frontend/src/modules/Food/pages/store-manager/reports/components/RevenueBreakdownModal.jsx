import React, { useEffect } from "react";
import { X, DollarSign, RefreshCw } from "lucide-react";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { useRevenueBreakdown } from "../hooks/useRevenueBreakdown";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
};

export default function RevenueBreakdownModal({ isOpen, onClose, month }) {
  const { data, isLoading, isError, refetch } = useRevenueBreakdown(month, isOpen);

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
    pizzaSales = 0,
    beverageSales = 0,
    comboSales = 0,
    addOns = 0,
    coupons = 0,
    taxes = 0,
    refunds = 0,
    netRevenue = 0,
    grossRevenue = 0,
    discountImpact = 0
  } = data || {};

  const chartData = [
    { name: "Pizza Sales", value: pizzaSales },
    { name: "Beverages", value: beverageSales },
    { name: "Combos", value: comboSales },
    { name: "Add-Ons", value: addOns },
    { name: "Taxes & Duties", value: taxes }
  ].filter(item => item.value > 0);

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#7c3aed", "#6b7280"];

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
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <DollarSign size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Revenue Breakdown Analysis
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-555 font-bold mt-0.5">
                Sales contributions for {month}
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
              <p className="text-sm font-bold text-rose-500">Failed to load revenue breakdown details</p>
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
              
              {/* Pie Chart Representation */}
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

              {/* Financial Breakdown Info */}
              <div className="space-y-4">
                <div className="p-4 bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs font-bold text-zinc-500">
                    <span>Gross Revenue</span>
                    <span className="text-slate-900 dark:text-white">{formatINR(grossRevenue)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-rose-500">
                    <span>Coupon Deductions</span>
                    <span>{formatINR(coupons)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-amber-600">
                    <span>Refund adjustments</span>
                    <span>{formatINR(refunds)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-black text-slate-900 dark:text-white pt-2 border-t border-dashed border-zinc-200 dark:border-zinc-800">
                    <span>Net Clean Revenue</span>
                    <span className="text-emerald-600 dark:text-emerald-400">{formatINR(netRevenue)}</span>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/10 dark:bg-amber-950/5 border border-amber-100/30 rounded-2xl">
                  <p className="text-[10px] uppercase font-black text-amber-600 tracking-wider">Discount Impact</p>
                  <p className="text-sm font-black text-slate-900 dark:text-white mt-1">
                    {discountImpact}% of Sales
                  </p>
                  <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                    Coupons and adjustments accounted for a minor reduction in net margin.
                  </p>
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
