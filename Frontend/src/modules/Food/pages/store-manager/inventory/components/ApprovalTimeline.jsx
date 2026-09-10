import React from "react";
import { CheckCircle2, XCircle, Clock, Package } from "lucide-react";
import { format } from "date-fns";

export function ApprovalTimeline({ request }) {
  if (!request) return null;

  const {
    status,
    requestedBy,
    approvedBy,
    requestedQty,
    approvedQty,
    deliveredQty,
    createdAt,
    updatedAt,
    remarks,
    reason,
  } = request;

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  // Steps definitions
  const steps = [
    {
      title: "Stock Requested",
      description: `Requested ${requestedQty} units by ${requestedBy}`,
      subtext: `Reason: "${reason}"`,
      date: formatDate(createdAt),
      status: "completed",
      icon: <Clock className="h-5 w-5 text-amber-500" />,
      color: "border-amber-500"
    },
    {
      title: status === "rejected" ? "Request Rejected" : "Manager Approval",
      description: 
        status === "rejected"
          ? `Rejected by ${approvedBy || "Store Manager"}`
          : status === "approved" || status === "fulfilled"
          ? `Approved ${approvedQty} units by ${approvedBy || "Store Manager"}`
          : "Awaiting store manager approval",
      subtext: remarks ? `Remarks: "${remarks}"` : null,
      date: (status === "approved" || status === "rejected" || status === "fulfilled") && updatedAt ? formatDate(updatedAt) : null,
      status: 
        status === "rejected" 
          ? "failed" 
          : status === "approved" || status === "fulfilled" 
          ? "completed" 
          : "pending",
      icon: 
        status === "rejected" ? (
          <XCircle className="h-5 w-5 text-rose-500" />
        ) : status === "approved" || status === "fulfilled" ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
        ) : (
          <Clock className="h-5 w-5 text-slate-300" />
        ),
      color: 
        status === "rejected" 
          ? "border-rose-500" 
          : status === "approved" || status === "fulfilled" 
          ? "border-emerald-500" 
          : "border-slate-200 dark:border-zinc-800"
    },
    {
      title: "Order Fulfillment",
      description: 
        status === "fulfilled" 
          ? `Delivered ${deliveredQty || approvedQty} units to kitchen`
          : status === "rejected"
          ? "Fulfillment cancelled"
          : "Awaiting delivery and inventory update",
      subtext: status === "fulfilled" && remarks ? `Remarks: "${remarks}"` : null,
      date: status === "fulfilled" && updatedAt ? formatDate(updatedAt) : null,
      status: 
        status === "fulfilled" 
          ? "completed" 
          : status === "rejected" 
          ? "disabled" 
          : "pending",
      icon: (
        <Package 
          className={`h-5 w-5 ${
            status === "fulfilled" 
              ? "text-indigo-500" 
              : status === "rejected" 
              ? "text-slate-300 dark:text-zinc-700" 
              : "text-slate-300"
          }`} 
        />
      ),
      color: 
        status === "fulfilled" 
          ? "border-indigo-500" 
          : "border-slate-200 dark:border-zinc-800"
    }
  ];

  return (
    <div className="relative border-l-2 border-slate-100 dark:border-zinc-800 ml-4 pl-6 space-y-8 py-2">
      {steps.map((step, idx) => {
        const isCompleted = step.status === "completed";
        const isFailed = step.status === "failed";
        const isPending = step.status === "pending";
        const isDisabled = step.status === "disabled";

        return (
          <div key={idx} className="relative">
            {/* Timeline Dot / Icon wrapper */}
            <div 
              className={`absolute -left-[37px] top-1 flex items-center justify-center bg-white dark:bg-zinc-950 rounded-full p-1 border-2 ${
                isCompleted 
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" 
                  : isFailed 
                  ? "border-rose-500 bg-rose-50 dark:bg-rose-950/20" 
                  : isPending
                  ? "border-slate-300 dark:border-zinc-700 bg-slate-50 dark:bg-zinc-900"
                  : "border-slate-200 dark:border-zinc-800 bg-slate-50 opacity-55"
              }`}
            >
              {step.icon}
            </div>

            {/* Step content */}
            <div className={isDisabled ? "opacity-40" : ""}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-zinc-200">
                  {step.title}
                </h4>
                {step.date && (
                  <span className="text-[11px] text-slate-400 dark:text-zinc-500 font-medium">
                    {step.date}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-zinc-400 mt-1">
                {step.description}
              </p>
              {step.subtext && (
                <div className="text-xs italic text-slate-500 dark:text-zinc-500 mt-1 bg-slate-50 dark:bg-zinc-900/50 p-2 rounded border border-slate-100 dark:border-zinc-900/50">
                  {step.subtext}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
