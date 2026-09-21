import React, { useState, useEffect } from "react";
import { Briefcase, Store, Shield, Calendar, User, Clock, MapPin, Loader2 } from "lucide-react";
import { profileApi } from "@food/api";

export default function WorkInfoTab({ user, store }) {
  const items = [
    { label: "Employee ID", value: user?.employeeId, icon: Shield },
    { label: "Designation", value: user?.designation, icon: Briefcase },
    { label: "Role Permission Group", value: user?.role === "store_manager" ? "Store Manager" : "Employee", icon: User },
    { label: "Primary Store Assignment", value: user?.storeName, icon: Store },
    { label: "Reporting Manager", value: user?.reportingManager, icon: User },
    { label: "Employment Status", value: user?.status, icon: Clock, badge: true },
    { label: "Joining Date", value: user?.joiningDate, icon: Calendar },
  ];

  return (
    <div className="space-y-4">
      {/* EMPLOYMENT DETAILS CARD */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
          <Briefcase size={16} className="text-[var(--primary)]" />
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Employment Profile
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {items.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="flex items-start gap-3 p-3 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850"
              >
                <div className="p-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 text-[var(--primary)] shrink-0">
                  <Icon size={13} className="stroke-[2.2]" />
                </div>
                <div className="space-y-0.5">
                  <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                    {item.label}
                  </span>
                  {item.badge ? (
                    <div className="pt-0.5">
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-450 border border-emerald-100 dark:border-emerald-900/30">
                        {item.value || "N/A"}
                      </span>
                    </div>
                  ) : (
                    <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200">
                      {item.value || "Not Specified"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STORE DETAILS CARD */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3 mb-4">
          <Store size={16} className="text-[var(--secondary)]" />
          <h2 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
            Store Assignment Details
          </h2>
        </div>

        <div className="flex flex-col md:flex-row gap-5 items-start md:items-center justify-between">
          <div className="space-y-3 flex-1">
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                {store?.name || "Papa Veg Pizza"}
              </h3>
              <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1 mt-1 leading-normal">
                <MapPin size={12} className="shrink-0 text-slate-400" />
                <span>{store?.address || "N/A"}</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm pt-1">
              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Store Timings
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                  <Clock size={11} className="text-[var(--primary)]" />
                  <span>{store?.openingTime || "11 AM"} - {store?.closingTime || "11 PM"}</span>
                </p>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                  Active Manager
                </span>
                <p className="text-xs font-semibold text-slate-800 dark:text-zinc-200 flex items-center gap-1">
                  <User size={11} className="text-[var(--secondary)]" />
                  <span>{store?.managerName || "N/A"}</span>
                </p>
              </div>
            </div>
          </div>

          <div className="w-full md:w-auto shrink-0 bg-zinc-50 dark:bg-zinc-950 p-4 rounded-xl border border-zinc-150 dark:border-zinc-850/80 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-450 uppercase tracking-wide bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/30">
              Operational
            </span>
            <p className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 mt-2">
              Assigned Store Hub
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
