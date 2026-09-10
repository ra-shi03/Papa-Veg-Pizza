import React from "react";
import { User, Mail, Phone, Calendar, Award } from "lucide-react";

export default function CustomerInfoSection({ customer }) {
  if (!customer) {
    return (
      <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 text-center font-semibold text-xs text-zinc-400 py-8">
        No customer profile linked.
      </div>
    );
  }

  const getInitials = (name) => {
    return (name || "")
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <User size={15} className="text-[var(--primary)]" />
        Customer Profile
      </h4>
      
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-black text-sm border border-[var(--primary)]/20">
          {getInitials(customer.name)}
        </div>
        <div>
          <h5 className="text-sm font-extrabold text-slate-900 dark:text-white leading-normal">{customer.name}</h5>
          <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono">ID: {customer._id}</span>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center gap-2">
          <Mail size={13} className="text-zinc-400 shrink-0" />
          <span className="text-zinc-600 dark:text-zinc-355 truncate">{customer.email}</span>
        </div>

        <div className="flex items-center gap-2">
          <Phone size={13} className="text-zinc-400 shrink-0" />
          <span className="text-zinc-650 dark:text-zinc-300 font-bold">{customer.mobile}</span>
        </div>

        <div className="flex items-center gap-2">
          <Calendar size={13} className="text-zinc-400 shrink-0" />
          <span className="text-zinc-600 dark:text-zinc-450">Member Since: {formatDate(customer.createdAt)}</span>
        </div>

        <div className="flex items-center justify-between p-2.5 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
          <div className="flex items-center gap-1.5">
            <Award size={13} className="text-amber-500" />
            <span className="text-[10px] uppercase font-bold text-zinc-400">Loyalty Points</span>
          </div>
          <span className="text-xs font-black text-amber-600 dark:text-amber-400">{customer.loyaltyPoints || 0} pts</span>
        </div>
      </div>
    </div>
  );
}
