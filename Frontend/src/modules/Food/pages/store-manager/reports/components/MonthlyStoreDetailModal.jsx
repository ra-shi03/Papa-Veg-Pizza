import React, { useState, useEffect } from "react";
import { X, Calendar, DollarSign, ArrowUpRight, TrendingDown, Users, Truck, Star, ClipboardList, RefreshCw } from "lucide-react";
import { useMonthlyStoreDetails } from "../hooks/useMonthlyStoreDetails";

const formatINR = (num) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num || 0);
};

export default function MonthlyStoreDetailModal({ isOpen, onClose, month }) {
  const { data, isLoading, isError, refetch } = useMonthlyStoreDetails(month, isOpen);
  const [activeTab, setActiveTab] = useState("financials");

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
    revenueBreakdown = {},
    expensesBreakdown = {},
    bestSellingProducts = [],
    topCustomers = [],
    staffPerformance = [],
    deliveryMetrics = {},
    customerFeedback = [],
    inventoryUsage = []
  } = data || {};

  const tabs = [
    { id: "financials", label: "Financials", icon: DollarSign },
    { id: "sales", label: "Sales & Customers", icon: ArrowUpRight },
    { id: "ops", label: "Operations & Staff", icon: Users },
    { id: "inventory", label: "Inventory & Feedback", icon: ClipboardList }
  ];

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
                Store Operations Audit Report
              </h2>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-555 font-bold mt-0.5">
                Performance audit index for {month}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-450 hover:text-zinc-650 dark:text-zinc-500 dark:hover:text-zinc-300 transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-neutral-50/50 dark:bg-zinc-950/20 px-5 py-1.5 gap-2 overflow-x-auto scrollbar-none shrink-0">
          {tabs.map((tab) => {
            const TabIcon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-2xl transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-zinc-650 dark:text-zinc-400 hover:bg-neutral-100 dark:hover:bg-zinc-800"
                }`}
              >
                <TabIcon size={12} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {isLoading ? (
            <div className="space-y-6 animate-pulse">
              <div className="grid grid-cols-2 gap-4">
                <div className="h-40 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
                <div className="h-40 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
              </div>
              <div className="h-48 bg-neutral-100 dark:bg-zinc-800 rounded-2xl" />
            </div>
          ) : isError ? (
            <div className="text-center py-10 space-y-3">
              <p className="text-sm font-bold text-rose-500">Failed to load monthly operations metrics</p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-2xl transition-all shadow-sm flex items-center gap-1 mx-auto cursor-pointer"
              >
                <RefreshCw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <>
              {/* TAB 1: Financials */}
              {activeTab === "financials" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Revenue Breakdown */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-[var(--primary)] uppercase tracking-wider flex items-center gap-1">
                      <DollarSign size={13} />
                      Revenue Breakdown
                    </h3>
                    <div className="space-y-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <div className="flex justify-between pb-2 border-b border-dashed border-zinc-200 dark:border-zinc-800 text-sm font-black text-slate-900 dark:text-white">
                        <span>Total Net Revenue</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{formatINR(revenueBreakdown.netRevenue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pizza Sales</span>
                        <span>{formatINR(revenueBreakdown.pizzaSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Beverage Sales</span>
                        <span>{formatINR(revenueBreakdown.beverageSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Combo Packs</span>
                        <span>{formatINR(revenueBreakdown.comboSales)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Add-Ons & Extras</span>
                        <span>{formatINR(revenueBreakdown.addOns)}</span>
                      </div>
                      <div className="flex justify-between text-rose-500">
                        <span>Discount Coupons</span>
                        <span>{formatINR(revenueBreakdown.coupons)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-500">
                        <span>GST & Taxes (5%)</span>
                        <span>{formatINR(revenueBreakdown.taxes)}</span>
                      </div>
                      <div className="flex justify-between text-amber-600">
                        <span>Refunds Issued</span>
                        <span>{formatINR(revenueBreakdown.refunds)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Expenses Breakdown */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-rose-555 uppercase tracking-wider flex items-center gap-1">
                      <TrendingDown size={13} />
                      Expenses Breakdown
                    </h3>
                    <div className="space-y-2.5 text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      <div className="flex justify-between pb-2 border-b border-dashed border-zinc-200 dark:border-zinc-800 text-sm font-black text-slate-900 dark:text-white">
                        <span>Total Expenses</span>
                        <span className="text-rose-600">{formatINR(expensesBreakdown.totalExpenses)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ingredient Costs</span>
                        <span>{formatINR(expensesBreakdown.ingredients)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Staff Salaries</span>
                        <span>{formatINR(expensesBreakdown.staffSalaries)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Operations</span>
                        <span>{formatINR(expensesBreakdown.deliveryCosts)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Store Utilities</span>
                        <span>{formatINR(expensesBreakdown.utilities)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maintenance & Repairs</span>
                        <span>{formatINR(expensesBreakdown.maintenance)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Other Administrative Costs</span>
                        <span>{formatINR(expensesBreakdown.otherExpenses)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Sales & Customers */}
              {activeTab === "sales" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Best Selling Products */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Best Selling Products
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-850">
                      <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold">
                        <thead className="bg-neutral-50 dark:bg-zinc-950/50 text-zinc-400 dark:text-zinc-550">
                          <tr>
                            <th className="px-4 py-2.5 text-left">Product</th>
                            <th className="px-4 py-2.5 text-right">Quantity</th>
                            <th className="px-4 py-2.5 text-right">Revenue</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300">
                          {bestSellingProducts.map((p, idx) => (
                            <tr key={idx} className="hover:bg-white dark:hover:bg-zinc-900/30">
                              <td className="px-4 py-3">{p.name}</td>
                              <td className="px-4 py-3 text-right">{p.quantity}</td>
                              <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{formatINR(p.revenue)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Top Customers */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Top Customers
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-850">
                      <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold">
                        <thead className="bg-neutral-50 dark:bg-zinc-950/50 text-zinc-400 dark:text-zinc-550">
                          <tr>
                            <th className="px-4 py-2.5 text-left">Customer</th>
                            <th className="px-4 py-2.5 text-right">Orders</th>
                            <th className="px-4 py-2.5 text-right">Total Spent</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300">
                          {topCustomers.map((c, idx) => (
                            <tr key={idx} className="hover:bg-white dark:hover:bg-zinc-900/30">
                              <td className="px-4 py-3">{c.name}</td>
                              <td className="px-4 py-3 text-right">{c.orders}</td>
                              <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{formatINR(c.totalSpent)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: Operations & Staff */}
              {activeTab === "ops" && (
                <div className="space-y-6">
                  {/* Delivery Metrics */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850">
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Success Rate</p>
                      <h4 className="text-lg font-black text-emerald-605 mt-1">{deliveryMetrics.successRate}%</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850">
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Late Deliveries</p>
                      <h4 className="text-lg font-black text-rose-500 mt-1">{deliveryMetrics.lateDeliveries}</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850">
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Failed Deliveries</p>
                      <h4 className="text-lg font-black text-rose-500 mt-1">{deliveryMetrics.failedDeliveries}</h4>
                    </div>
                    <div className="p-4 rounded-2xl bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850">
                      <p className="text-[10px] text-zinc-450 dark:text-zinc-500 uppercase tracking-wider">Avg Transit Time</p>
                      <h4 className="text-lg font-black text-zinc-800 dark:text-white mt-1">{deliveryMetrics.avgDeliveryTime} mins</h4>
                    </div>
                  </div>

                  {/* Staff Performance */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Staff Performance Ledger
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-850">
                      <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold">
                        <thead className="bg-neutral-50 dark:bg-zinc-950/50 text-zinc-400 dark:text-zinc-550">
                          <tr>
                            <th className="px-4 py-2.5 text-left">Staff Member</th>
                            <th className="px-4 py-2.5 text-right">Efficiency</th>
                            <th className="px-4 py-2.5 text-right">Attendance</th>
                            <th className="px-4 py-2.5 text-right">Satisfaction Rating</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300">
                          {staffPerformance.map((s, idx) => (
                            <tr key={idx} className="hover:bg-white dark:hover:bg-zinc-900/30">
                              <td className="px-4 py-3">{s.name}</td>
                              <td className="px-4 py-3 text-right text-emerald-600 dark:text-emerald-400">{s.efficiency}%</td>
                              <td className="px-4 py-3 text-right">{s.attendance}%</td>
                              <td className="px-4 py-3 text-right text-amber-500">⭐ {s.rating}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: Inventory & Feedback */}
              {activeTab === "inventory" && (
                <div className="space-y-6">
                  {/* Inventory Usage */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Inventory Consumption & Waste
                    </h3>
                    <div className="overflow-x-auto rounded-2xl border border-zinc-100 dark:border-zinc-850">
                      <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-850 text-xs font-bold">
                        <thead className="bg-neutral-50 dark:bg-zinc-950/50 text-zinc-400 dark:text-zinc-550">
                          <tr>
                            <th className="px-4 py-2.5 text-left">Ingredient</th>
                            <th className="px-4 py-2.5 text-right">Used Quantity</th>
                            <th className="px-4 py-2.5 text-right">Waste Quantity</th>
                            <th className="px-4 py-2.5 text-right">Cost Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-300">
                          {inventoryUsage.map((inv, idx) => (
                            <tr key={idx} className="hover:bg-white dark:hover:bg-zinc-900/30">
                              <td className="px-4 py-3">{inv.ingredient}</td>
                              <td className="px-4 py-3 text-right">{inv.usedQty}</td>
                              <td className="px-4 py-3 text-right text-rose-500">{inv.wasteQty}</td>
                              <td className="px-4 py-3 text-right">{formatINR(inv.cost)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Customer Feedback */}
                  <div className="bg-neutral-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-5 rounded-3xl space-y-4">
                    <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      Recent Reviews & Sentiments
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {customerFeedback.map((feedback, idx) => (
                        <div key={idx} className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-2">
                          <div className="flex justify-between items-center text-xs font-bold">
                            <span className="text-zinc-800 dark:text-white">{feedback.reviewer}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                              feedback.sentiment === "Positive"
                                ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20"
                                : "text-zinc-500 bg-zinc-100 dark:bg-zinc-800"
                            }`}>
                              {feedback.sentiment}
                            </span>
                          </div>
                          <div className="flex gap-0.5">
                            {Array.from({ length: 5 }).map((_, starIdx) => (
                              <Star
                                key={starIdx}
                                size={10}
                                className={
                                  starIdx < feedback.stars
                                    ? "fill-amber-400 text-amber-400"
                                    : "text-zinc-200 dark:text-zinc-800"
                                }
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold leading-relaxed">
                            "{feedback.reviewText}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-zinc-100 dark:border-zinc-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-neutral-100 hover:bg-neutral-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold rounded-2xl text-xs transition-all cursor-pointer active:scale-95"
          >
            Close Report
          </button>
        </div>

      </div>
    </div>
  );
}
