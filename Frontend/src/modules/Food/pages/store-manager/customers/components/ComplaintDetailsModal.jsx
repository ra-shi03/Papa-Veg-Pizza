import React from "react";
import { X, AlertCircle, RefreshCcw, HeartHandshake, CheckCircle2 } from "lucide-react";
import { useComplaintDetails } from "../hooks/useComplaints";
import { Skeleton } from "@food/components/ui/skeleton";
import CustomerInfoSection from "./CustomerInfoSection";
import OrderInfoSection from "./OrderInfoSection";
import ResolutionTimeline from "./ResolutionTimeline";
import ComplaintImagesGallery from "./ComplaintImagesGallery";
import ResolutionNotesSection from "./ResolutionNotesSection";
import ComplaintStatusBadge from "./ComplaintStatusBadge";
import ComplaintPriorityBadge from "./ComplaintPriorityBadge";
import { toast } from "sonner";

export default function ComplaintDetailsModal({
  visible,
  onClose,
  complaintId,
  onResolveTrigger,
  userRole
}) {
  const { data: complaint, isLoading, isError, refetch } = useComplaintDetails(visible ? complaintId : null);
  const isReadOnly = userRole === "assistant_manager";

  if (!visible) return null;

  const handleRetry = () => {
    refetch();
  };

  const getIssueTypeLabel = (type) => {
    const t = (type || "").toLowerCase();
    switch (t) {
      case "missing_items": return "Missing Items";
      case "late_delivery": return "Late Delivery";
      case "food_quality": return "Food Quality";
      case "wrong_order": return "Wrong Order";
      case "rider_behavior": return "Rider Behavior";
      case "other": return "Other";
      default: return type;
    }
  };

  return (
    <div 
      className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-5xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">
                Complaint Investigation Details
              </h3>
              {complaint && (
                <>
                  <ComplaintStatusBadge status={complaint.status} />
                  <ComplaintPriorityBadge priority={complaint.priority} />
                </>
              )}
            </div>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
              Analyze issue details, customer evidence, timelines, and resolution settlements.
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <Skeleton className="h-28 w-full rounded-3xl" />
                <Skeleton className="h-44 w-full rounded-3xl" />
                <Skeleton className="h-48 w-full rounded-3xl" />
              </div>
              <div className="space-y-4">
                <Skeleton className="h-48 w-full rounded-3xl" />
                <Skeleton className="h-44 w-full rounded-3xl" />
              </div>
            </div>
          ) : isError ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-[var(--primary)] rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">Failed to Load Complaint Info</h4>
              <p className="text-[10px] text-zinc-400">Please check your network connection and try again.</p>
              <button
                onClick={handleRetry}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <RefreshCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Left Column: Complaint Details & Timeline */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Description Card */}
                <div className="bg-slate-50 dark:bg-zinc-950 p-5 rounded-3xl border border-zinc-150 dark:border-zinc-800 space-y-3 text-xs font-semibold">
                  <h4 className="text-sm font-black text-slate-800 dark:text-zinc-200 flex items-center gap-1.5 border-b border-zinc-100 dark:border-zinc-850 pb-2">
                    <AlertCircle size={15} className="text-[var(--primary)]" />
                    Complaint Description ({getIssueTypeLabel(complaint.complaintType)})
                  </h4>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-1">COMPLAINT ID</span>
                    <span className="font-mono text-zinc-850 dark:text-zinc-200 font-extrabold bg-zinc-200/50 dark:bg-zinc-805 px-2 py-0.5 rounded text-[10px]">
                      {complaint._id}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-400 block mb-0.5">CUSTOMER ISSUE DESCRIPTION</span>
                    <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-bold bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-3.5 rounded-2xl">
                      {complaint.description}
                    </p>
                  </div>
                </div>

                {/* Evidence Image Gallery */}
                <ComplaintImagesGallery images={complaint.images} />

                {/* Timeline */}
                <ResolutionTimeline 
                  status={complaint.status} 
                  createdAt={complaint.createdAt} 
                  updatedAt={complaint.updatedAt} 
                  resolution={complaint.resolution}
                />
              </div>

              {/* Right Column: Customer Info, Order details & Resolution Notes */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Customer Info */}
                <CustomerInfoSection customer={complaint.customer} />

                {/* Order Details */}
                <OrderInfoSection order={complaint.order} />

                {/* Resolution Notes */}
                <ResolutionNotesSection status={complaint.status} resolution={complaint.resolution} />
              </div>

            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850 flex justify-end items-center gap-2">
          <button
            onClick={onClose}
            className="px-4.5 py-2 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
          >
            Close
          </button>

          {complaint && complaint.status !== "resolved" && (
            <button
              onClick={() => {
                if (isReadOnly) {
                  toast.error("Access Denied", {
                    description: "Assistant Manager role is in Read-Only mode."
                  });
                } else {
                  onResolveTrigger(complaint._id);
                }
              }}
              className={`flex items-center gap-1.5 px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm shadow-[var(--primary)]/15 ${
                isReadOnly ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              <CheckCircle2 size={13} />
              <span>Resolve Complaint</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
