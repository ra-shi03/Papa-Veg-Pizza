import React, { useState } from "react";
import { X, User, ShoppingBag, MessageSquare, ShieldAlert, Award, Calendar, CreditCard, RefreshCcw, Star } from "lucide-react";
import { useCustomerProfile } from "../hooks/useCustomerOrders";
import { Skeleton } from "@food/components/ui/skeleton";
import RatingStars from "./RatingStars";
import SentimentBadge from "./SentimentBadge";

export default function CustomerHistoryModal({
  visible,
  onClose,
  customerId,
  onViewOrder
}) {
  const [activeTab, setActiveTab] = useState("orders");

  const { data, isLoading, isError, refetch } = useCustomerProfile(visible ? customerId : null);

  if (!visible) return null;

  const handleRetry = () => {
    refetch();
  };

  const { customerProfile = {}, recentOrders = [], complaints = [], reviews = [] } = data || {};

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  // Compute stats
  const averageRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  return (
    <div 
      className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase flex items-center gap-1.5">
              <User className="text-[var(--primary)]" size={16} />
              Customer Ledger & Feedback Log
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
              Comprehensive profile, historical purchases, review history, and logged complaint resolutions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800">
                <Skeleton className="w-12 h-12 rounded-full animate-pulse" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 rounded animate-pulse" />
                  <Skeleton className="h-3 w-48 rounded animate-pulse" />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4">
                <Skeleton className="h-20 rounded-2xl animate-pulse" />
                <Skeleton className="h-20 rounded-2xl animate-pulse" />
                <Skeleton className="h-20 rounded-2xl animate-pulse" />
                <Skeleton className="h-20 rounded-2xl animate-pulse" />
              </div>
              <Skeleton className="h-48 w-full rounded-3xl animate-pulse" />
            </div>
          ) : isError ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-[var(--primary)] rounded-full flex items-center justify-center">
                <ShieldAlert size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">Failed to Load Customer Ledger</h4>
              <p className="text-[10px] text-zinc-400">Please check your network and try again.</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <RefreshCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Customer Info Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[var(--primary)]/10 text-[var(--primary)] rounded-full flex items-center justify-center border border-[var(--primary)]/20">
                    <User size={24} className="stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                      {customerProfile.name || "Unknown Customer"}
                    </h4>
                    <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                      Email: {customerProfile.email || "N/A"} | Mobile: {customerProfile.mobile || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 px-4 py-2 rounded-2xl border border-zinc-100 dark:border-zinc-850 shadow-sm text-xs font-semibold">
                  <Award size={14} className="text-amber-500 shrink-0" />
                  <div>
                    <span className="text-[9px] text-zinc-400 block font-bold">Loyalty Level</span>
                    <span className="text-zinc-900 dark:text-white font-black">
                      {customerProfile.loyaltyPoints > 500 ? "Gold Patron" : customerProfile.loyaltyPoints > 200 ? "Silver Diner" : "Standard member"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Statistics Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Total Orders */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-3xl p-4 text-center shadow-sm">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase block tracking-wider">Total Orders</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-white block mt-1 leading-none">
                    {customerProfile.totalOrders || recentOrders.length || 0}
                  </span>
                </div>

                {/* Total Spent */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-3xl p-4 text-center shadow-sm">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase block tracking-wider">Total Spending</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-450 block mt-1 leading-none">
                    {formatCurrency(customerProfile.totalSpent || 0)}
                  </span>
                </div>

                {/* Loyalty Points */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-3xl p-4 text-center shadow-sm">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase block tracking-wider">Loyalty Points</span>
                  <span className="text-lg font-black text-amber-500 block mt-1 leading-none">
                    {customerProfile.loyaltyPoints || 0} pts
                  </span>
                </div>

                {/* Avg Rating Given */}
                <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-850 rounded-3xl p-4 text-center shadow-sm">
                  <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase block tracking-wider">Avg Rating Given</span>
                  <span className="text-lg font-black text-amber-500 flex items-center justify-center gap-0.5 mt-1 leading-none">
                    {averageRating} ★
                  </span>
                </div>
              </div>

              {/* Tabs Menu */}
              <div className="space-y-4 pt-2">
                <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`flex items-center gap-1.5 px-5 py-2.5 border-b-2 font-bold text-xs transition-all cursor-pointer ${
                      activeTab === "orders"
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                    }`}
                  >
                    <ShoppingBag size={13} />
                    <span>Previous Orders ({recentOrders.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`flex items-center gap-1.5 px-5 py-2.5 border-b-2 font-bold text-xs transition-all cursor-pointer ${
                      activeTab === "reviews"
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>Previous Reviews ({reviews.length})</span>
                  </button>

                  <button
                    onClick={() => setActiveTab("complaints")}
                    className={`flex items-center gap-1.5 px-5 py-2.5 border-b-2 font-bold text-xs transition-all cursor-pointer ${
                      activeTab === "complaints"
                        ? "border-[var(--primary)] text-[var(--primary)]"
                        : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-white"
                    }`}
                  >
                    <ShieldAlert size={13} />
                    <span>Complaint History ({complaints.length})</span>
                  </button>
                </div>

                {/* Tab Contents */}
                <div className="min-h-[220px]">
                  {activeTab === "orders" && (
                    <div className="border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                          <tr>
                            <th className="px-4 py-2.5">Order Number</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5">Bill Total</th>
                            <th className="px-4 py-2.5">Payment</th>
                            <th className="px-4 py-2.5">Order Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
                          {recentOrders.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-zinc-400">
                                No historical orders found.
                              </td>
                            </tr>
                          ) : (
                            recentOrders.map((ord) => (
                              <tr key={ord._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                                <td className="px-4 py-2.5">
                                  <button
                                    onClick={() => onViewOrder?.(ord._id)}
                                    className="font-mono font-extrabold text-[10px] text-zinc-900 dark:text-white hover:text-[var(--primary)] hover:underline cursor-pointer"
                                  >
                                    {ord.orderNumber}
                                  </button>
                                </td>
                                <td className="px-4 py-2.5 capitalize">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                    ord.orderStatus === "delivered" 
                                      ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10" 
                                      : ord.orderStatus === "refunded"
                                      ? "bg-rose-505/5 text-rose-500 border-rose-505/10"
                                      : "bg-amber-500/5 text-amber-600 border-amber-500/10"
                                  }`}>
                                    {ord.orderStatus}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-white">
                                  {formatCurrency(ord.totalAmount)}
                                </td>
                                <td className="px-4 py-2.5 capitalize text-[10px] text-zinc-500">
                                  {ord.paymentMethod} ({ord.paymentStatus})
                                </td>
                                <td className="px-4 py-2.5 text-zinc-400 text-[10px]">
                                  {formatDate(ord.createdAt)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {activeTab === "reviews" && (
                    <div className="space-y-3">
                      {reviews.length === 0 ? (
                        <div className="py-12 text-center text-zinc-400 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-neutral-50/20">
                          No previous reviews submitted.
                        </div>
                      ) : (
                        reviews.map((rev) => (
                          <div key={rev._id} className="bg-slate-50 dark:bg-zinc-950 p-4 border border-zinc-150 dark:border-zinc-850 rounded-2xl space-y-2">
                            <div className="flex justify-between items-center flex-wrap gap-2 text-xs font-semibold">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-amber-500">{rev.rating}★</span>
                                <RatingStars rating={rev.rating} size={9} />
                                <SentimentBadge sentiment={rev.sentiment} />
                              </div>
                              <span className="text-[10px] text-zinc-400 font-bold">{formatDate(rev.createdAt)}</span>
                            </div>
                            <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium italic leading-relaxed">
                              "{rev.reviewText}"
                            </p>
                            {rev.reply && (
                              <div className="bg-white dark:bg-zinc-900 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800 text-[11px] font-semibold text-zinc-550 pl-3 border-l-2 border-l-emerald-500">
                                <span className="text-[9px] uppercase font-bold text-emerald-600 block mb-1">Manager Reply:</span>
                                "{rev.reply.text}"
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {activeTab === "complaints" && (
                    <div className="border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden bg-white dark:bg-zinc-950">
                      <table className="w-full text-left text-xs font-semibold">
                        <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-500 tracking-wider">
                          <tr>
                            <th className="px-4 py-2.5">Complaint ID</th>
                            <th className="px-4 py-2.5">Issue</th>
                            <th className="px-4 py-2.5">Status</th>
                            <th className="px-4 py-2.5">Resolution Notes</th>
                            <th className="px-4 py-2.5">Date Created</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
                          {complaints.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="py-12 text-center text-zinc-400">
                                No historical complaints logged.
                              </td>
                            </tr>
                          ) : (
                            complaints.map((comp) => (
                              <tr key={comp._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                                <td className="px-4 py-2.5 font-mono font-extrabold text-[10px] uppercase text-zinc-900 dark:text-white">
                                  {comp._id}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-850 dark:text-zinc-200 max-w-[200px] truncate" title={comp.issue || comp.description}>
                                  {comp.issue || comp.description || comp.complaintType}
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                                    comp.status === "resolved"
                                      ? "bg-emerald-500/5 text-emerald-600 border-emerald-500/10"
                                      : "bg-amber-500/5 text-amber-600 border-amber-500/10"
                                  }`}>
                                    {comp.status}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 text-zinc-500 dark:text-zinc-400 max-w-[220px] truncate" title={typeof comp.resolution === "object" ? comp.resolution.actionTaken : comp.resolution}>
                                  {typeof comp.resolution === "object" ? comp.resolution.actionTaken : (comp.resolution || "Under Investigation")}
                                </td>
                                <td className="px-4 py-2.5 text-zinc-450 text-[10px]">
                                  {formatDate(comp.createdAt)}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850 flex justify-end items-center">
          <button
            onClick={onClose}
            className="px-4.5 py-2 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-755 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
          >
            Close Ledger
          </button>
        </div>
      </div>
    </div>
  );
}
