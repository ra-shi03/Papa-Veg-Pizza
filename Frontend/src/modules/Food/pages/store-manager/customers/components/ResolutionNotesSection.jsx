import React from "react";
import { CheckCircle2, AlertCircle, Sparkles, Receipt, ArrowRight } from "lucide-react";

export default function ResolutionNotesSection({ status, resolution }) {
  const isResolved = status === "resolved";

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  if (!isResolved) {
    return (
      <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 flex flex-col items-center justify-center gap-1.5 text-center font-semibold text-xs py-8 text-zinc-450 dark:text-zinc-500">
        <AlertCircle size={20} className="text-amber-500 animate-pulse" />
        <div>
          <p className="font-extrabold text-zinc-700 dark:text-zinc-350">Awaiting Supervisor Resolution</p>
          <p className="text-[10px] text-zinc-400 mt-0.5">Use "Resolve Issue" action to process refund, replacements, or apologize code.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-4 text-xs font-semibold">
      <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
        <CheckCircle2 size={15} className="text-emerald-500" />
        Resolution Details
      </h4>

      <div className="space-y-3">
        <div>
          <span className="text-[10px] text-zinc-400 block mb-0.5">Action Taken Summary</span>
          <p className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-3 rounded-2xl text-zinc-750 dark:text-zinc-300 leading-relaxed font-bold">
            {resolution?.actionTaken || "No resolution details provided."}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-2.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-extrabold mb-1">Refund Action</span>
            <span className="font-black text-zinc-900 dark:text-white text-sm">
              {resolution?.refundAmount > 0 ? formatCurrency(resolution.refundAmount) : "₹0 (No Refund)"}
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-2.5 rounded-2xl flex flex-col justify-between">
            <span className="text-[9px] uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-extrabold mb-1">Coupon Issued</span>
            <span className="font-mono font-black text-emerald-600 dark:text-emerald-450 text-xs">
              {resolution?.couponIssued ? (
                <span className="flex items-center gap-1">
                  <Sparkles size={11} className="shrink-0" />
                  {resolution.couponIssued}
                </span>
              ) : (
                "None"
              )}
            </span>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-2.5 rounded-2xl flex flex-col justify-between col-span-2">
            <span className="text-[9px] uppercase tracking-wider text-zinc-450 dark:text-zinc-500 font-extrabold mb-1">Replacement Order</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">
              {resolution?.replacementOrderId ? (
                <span className="flex items-center gap-1">
                  <Receipt size={12} className="text-zinc-400 shrink-0" />
                  <span>ID: {resolution.replacementOrderId}</span>
                  <ArrowRight size={10} className="text-zinc-400" />
                  <span className="text-[9px] bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded">Triggered</span>
                </span>
              ) : (
                "No replacement Pizza issued"
              )}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center text-[10px] text-zinc-450 font-bold border-t border-zinc-100 dark:border-zinc-850 pt-2">
          <span>Resolved By: {resolution?.resolvedBy || "Store Manager"}</span>
          <span>Date: {new Date(resolution?.resolvedAt || Date.now()).toLocaleDateString("en-IN")}</span>
        </div>
      </div>
    </div>
  );
}
