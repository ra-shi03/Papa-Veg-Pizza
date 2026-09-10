import React, { useState } from "react";
import { X, Calendar, Award, Phone, Mail, ShoppingBag, CreditCard, RefreshCcw, HeartHandshake, AlertCircle } from "lucide-react";
import { useCustomerProfile } from "../hooks/useCustomerOrders";
import RecentOrdersTable from "./RecentOrdersTable";
import ComplaintsHistoryTable from "./ComplaintsHistoryTable";
import ReviewsHistoryTable from "./ReviewsHistoryTable";
import { Skeleton } from "@food/components/ui/skeleton";

export default function CustomerProfileModal({ visible, onClose, customerId, onViewOrder }) {
  const { data, isLoading, isError, refetch } = useCustomerProfile(customerId);
  const [activeTab, setActiveTab] = useState("orders");

  if (!visible) return null;

  const { customerProfile = {}, recentOrders = [], complaints = [], reviews = [] } = data || {};

  const handleRetry = () => {
    refetch();
  };

  const getInitials = (name) => {
    if (!name) return "C";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">
              Customer Profile File
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
              Detailed breakdown of purchasing logs, complaints, and loyalty ranking.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-805 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            // Skeleton Loader
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-5 items-start">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-5 w-48 rounded" />
                  <Skeleton className="h-4 w-64 rounded" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 rounded-xl" />
                ))}
              </div>
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : isError ? (
            // Error State
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-[var(--primary)] rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">Failed to Load Profile Data</h4>
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
            // Success Content
            <>
              {/* SECTION: CUSTOMER INFORMATION */}
              <div className="flex flex-col md:flex-row gap-5 items-start bg-neutral-50/50 dark:bg-zinc-950/20 p-5 rounded-2xl border border-zinc-100 dark:border-zinc-850">
                <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center text-lg font-black shrink-0 border border-[var(--primary)]/20 shadow-sm">
                  {getInitials(customerProfile.name)}
                </div>
                
                <div className="flex-1 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="text-base font-black text-zinc-900 dark:text-white leading-tight">
                        {customerProfile.name}
                      </h4>
                      <p className="text-[9px] font-bold text-zinc-400 dark:text-zinc-550 leading-none mt-1">
                        ID: {customerProfile._id}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-250/30 rounded-full text-[10px] font-black">
                      <Award size={12} className="stroke-[2.5]" />
                      <span>{customerProfile.loyaltyPoints || 0} Loyalty Points</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <Phone size={12} className="text-zinc-400" />
                      <span>{customerProfile.mobile}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail size={12} className="text-zinc-400 truncate max-w-[180px]" />
                      <span>{customerProfile.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Calendar size={12} className="text-zinc-400" />
                      <span>Member since {new Date(customerProfile.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION: CUSTOMER STATISTICS */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {/* Stat 1: Total Orders */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm text-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Total Orders</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-white mt-1 block">
                    {customerProfile.totalOrders || 0}
                  </span>
                </div>

                {/* Stat 2: Total Spent */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm text-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Total Spending</span>
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
                    ₹{customerProfile.totalSpent || 0}
                  </span>
                </div>

                {/* Stat 3: AOV */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm text-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Avg Order Value</span>
                  <span className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1 block">
                    ₹{customerProfile.totalSpent && customerProfile.totalOrders ? Math.round(customerProfile.totalSpent / customerProfile.totalOrders) : 0}
                  </span>
                </div>

                {/* Stat 4: Cancelled Orders */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm text-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Cancelled Orders</span>
                  <span className="text-lg font-black text-rose-500 mt-1 block">
                    {complaints.filter(c => (c.issue || c.description || "").toLowerCase().includes("cancelled") || c.status === "failed").length}
                  </span>
                </div>

                {/* Stat 5: Refunds Count */}
                <div className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-800 rounded-xl p-3.5 shadow-sm text-center">
                  <span className="text-[9px] font-black text-zinc-400 uppercase tracking-wider block">Refund Count</span>
                  <span className="text-lg font-black text-amber-500 mt-1 block">
                    {complaints.filter(c => (c.issue || c.description || "").toLowerCase().includes("refund")).length || 1}
                  </span>
                </div>
              </div>

              {/* TABS CONTAINER */}
              <div className="space-y-4 pt-2">
                <div className="flex border-b border-zinc-100 dark:border-zinc-800">
                  <button
                    onClick={() => setActiveTab("orders")}
                    className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${
                      activeTab === "orders"
                        ? "border-[var(--primary)] text-[var(--primary)] font-black"
                        : "border-transparent text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    Recent Orders ({recentOrders.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("complaints")}
                    className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${
                      activeTab === "complaints"
                        ? "border-[var(--primary)] text-[var(--primary)] font-black"
                        : "border-transparent text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    Complaints History ({complaints.length})
                  </button>
                  <button
                    onClick={() => setActiveTab("reviews")}
                    className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-[2px] cursor-pointer ${
                      activeTab === "reviews"
                        ? "border-[var(--primary)] text-[var(--primary)] font-black"
                        : "border-transparent text-zinc-400 hover:text-zinc-600"
                    }`}
                  >
                    Reviews History ({reviews.length})
                  </button>
                </div>

                <div className="pt-1">
                  {activeTab === "orders" && (
                    <RecentOrdersTable orders={recentOrders} onViewOrder={onViewOrder} />
                  )}
                  {activeTab === "complaints" && (
                    <ComplaintsHistoryTable complaints={complaints} />
                  )}
                  {activeTab === "reviews" && (
                    <ReviewsHistoryTable reviews={reviews} />
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-100 dark:border-zinc-850 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl text-xs transition-all cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
}
