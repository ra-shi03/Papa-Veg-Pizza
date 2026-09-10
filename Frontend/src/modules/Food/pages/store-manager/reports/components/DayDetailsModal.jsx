import React, { useEffect } from "react";
import { X, Calendar, DollarSign, CheckCircle2, AlertTriangle, RefreshCw, Star, Users, Clock } from "lucide-react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useDayDetails } from "../hooks/useDayDetails";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
};

const formatDate = (dateStr) => {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

export default function DayDetailsModal({ isOpen, onClose, date }) {
  const { data, isLoading, isError } = useDayDetails(date);

  // Close on ESC key
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
    totalRevenue = 0,
    completedOrders = 0,
    cancelledOrders = 0,
    refundAmount = 0,
    paymentBreakdown = [],
    topSellingItems = [],
    topCustomers = [],
    hourlySales = []
  } = data || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center lg:pl-[280px] overflow-x-hidden overflow-y-auto outline-none transition-all">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-zinc-900/60 dark:bg-zinc-950/80 backdrop-blur-sm transition-opacity"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-5xl mx-3 my-6 z-50 bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden animate-fade-down duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center p-5 border-b border-zinc-100 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center">
              <Calendar size={16} />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                Sales Audit Details
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold mt-0.5">
                Detailed audit review for {formatDate(date)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          
          {isLoading ? (
            // Loading Skeletons
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="h-20 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-64 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
                <div className="h-64 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
              </div>
            </div>
          ) : isError ? (
            // Error State
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/20 text-red-500 flex items-center justify-center mx-auto">
                <AlertTriangle size={24} />
              </div>
              <h3 className="text-sm font-black text-zinc-800 dark:text-white">Failed to Load Audit Details</h3>
              <p className="text-[11px] text-zinc-400 max-w-sm mx-auto">
                There was a problem retrieving sales ledger details for this date. Please close and try again.
              </p>
            </div>
          ) : (
            <>
              {/* Basic Statistics Bento */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
                    <DollarSign size={18} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase">Gross Revenue</span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{formatINR(totalRevenue)}</p>
                  </div>
                </div>

                <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
                    <CheckCircle2 size={18} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase">Completed</span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{completedOrders} Orders</p>
                  </div>
                </div>

                <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                    <AlertTriangle size={18} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase">Cancelled</span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{cancelledOrders} Orders</p>
                  </div>
                </div>

                <div className="bg-neutral-50/50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500 shrink-0">
                    <RefreshCw size={18} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <span className="text-[9px] font-extrabold text-zinc-400 uppercase">Refund Value</span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">{formatINR(refundAmount)}</p>
                  </div>
                </div>
              </div>

              {/* Hourly graph & Payment breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Graph */}
                <div className="lg:col-span-7 bg-neutral-50/50 dark:bg-zinc-950/10 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4.5 flex flex-col justify-between h-[280px]">
                  <div className="flex items-center gap-1 mb-2">
                    <Clock size={12} className="text-[var(--primary)]" />
                    <span className="text-[10px] font-extrabold uppercase text-zinc-400 tracking-wider">Hourly Performance Index</span>
                  </div>
                  <div className="flex-1 w-full h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={hourlySales} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.02)" className="dark:stroke-zinc-800/40" />
                        <XAxis dataKey="time" stroke="#888888" fontSize={8} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                        <Tooltip
                          contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.95)", borderRadius: "12px", border: "0", fontSize: "10px", fontWeight: "bold" }}
                          className="dark:!bg-zinc-900 dark:!border-zinc-800 dark:!text-white"
                          formatter={(value) => [`₹${value}`, "Sales"]}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="var(--primary, #a43c12)" strokeWidth={2} dot={{ r: 2 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Payments */}
                <div className="lg:col-span-5 border border-zinc-100 dark:border-zinc-800 rounded-2xl p-4 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider mb-3">
                      Payment Gateway Audit
                    </h3>
                    <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-xl">
                      <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 text-left text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                        <thead className="bg-zinc-50 dark:bg-zinc-950/30 text-[9px] uppercase font-bold text-zinc-400">
                          <tr>
                            <th className="px-3 py-2">Method</th>
                            <th className="px-3 py-2">Transactions</th>
                            <th className="px-3 py-2 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-bold">
                          {paymentBreakdown.map((row) => (
                            <tr key={row.method} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20">
                              <td className="px-3 py-2.5 text-zinc-900 dark:text-white">{row.method}</td>
                              <td className="px-3 py-2.5">{row.transactions} txs</td>
                              <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">{formatINR(row.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items & Customers Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Top Items */}
                <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4">
                  <h3 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Star size={13} className="text-amber-500" />
                    Top Selling Products
                  </h3>
                  <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-xl">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 text-left text-[11px] font-semibold text-zinc-750 dark:text-zinc-350">
                      <thead className="bg-zinc-50 dark:bg-zinc-950/30 text-[9px] uppercase font-bold text-zinc-400">
                        <tr>
                          <th className="px-3 py-2">Item Name</th>
                          <th className="px-3 py-2">Qty Sold</th>
                          <th className="px-3 py-2 text-right">Revenue</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-bold">
                        {topSellingItems.map((item, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20">
                            <td className="px-3 py-2.5 text-zinc-900 dark:text-white">{item.name}</td>
                            <td className="px-3 py-2.5">{item.quantity} units</td>
                            <td className="px-3 py-2.5 text-right text-[var(--primary)]">{formatINR(item.revenue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Top Customers */}
                <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl p-4">
                  <h3 className="text-xs font-black text-zinc-850 dark:text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 mb-3">
                    <Users size={13} className="text-indigo-500" />
                    Top Customer Patrons
                  </h3>
                  <div className="overflow-hidden border border-zinc-100 dark:border-zinc-850 rounded-xl">
                    <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 text-left text-[11px] font-semibold text-zinc-750 dark:text-zinc-350">
                      <thead className="bg-zinc-50 dark:bg-zinc-950/30 text-[9px] uppercase font-bold text-zinc-400">
                        <tr>
                          <th className="px-3 py-2">Customer</th>
                          <th className="px-3 py-2">Orders</th>
                          <th className="px-3 py-2 text-right">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 font-bold">
                        {topCustomers.map((cust, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/20">
                            <td className="px-3 py-2.5 text-zinc-900 dark:text-white">{cust.name}</td>
                            <td className="px-3 py-2.5">{cust.orders} orders</td>
                            <td className="px-3 py-2.5 text-right text-emerald-600 dark:text-emerald-400">{formatINR(cust.totalSpent)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 p-4 bg-zinc-50 dark:bg-zinc-950/40 border-t border-zinc-100 dark:border-zinc-850 shrink-0">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold rounded-full text-xs active:scale-95 transition-all shadow-md cursor-pointer"
          >
            Close Audit
          </button>
        </div>

      </div>
    </div>
  );
}
