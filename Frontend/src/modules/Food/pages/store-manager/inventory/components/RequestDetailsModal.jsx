import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { useStockRequestDetails } from "../hooks/useStockRequestDetails";
import { StatusBadge } from "./StatusBadge";
import { UrgencyBadge } from "./UrgencyBadge";
import { ApprovalTimeline } from "./ApprovalTimeline";
import { 
  Eye, 
  User, 
  ShieldAlert, 
  Calendar, 
  CheckCircle, 
  XOctagon, 
  Truck, 
  ArrowRight 
} from "lucide-react";
import { format } from "date-fns";

export function RequestDetailsModal({ 
  isOpen, 
  onClose, 
  requestId, 
  role, 
  onApprove, // Callback to open approval modal
  onReject,  // Callback to open rejection modal
  onFulfill  // Callback to open fulfillment modal
}) {
  const { data, isLoading, error } = useStockRequestDetails(requestId);

  const request = data?.request;
  const ingredient = data?.ingredient;
  const requestedBy = data?.requestedBy;
  const approvedBy = data?.approvedBy;

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl lg:max-w-[calc(100vw-340px)] xl:max-w-2xl lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[95vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <Eye className="text-[var(--primary)] w-4 h-4" />
              Stock Request Details
            </DialogTitle>
            {request && (
              <div className="flex items-center gap-2">
                <StatusBadge status={request.status} />
                <UrgencyBadge urgency={request.urgency} />
              </div>
            )}
          </div>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Audit logs and status history for stock requests.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">Loading request logs...</p>
          </div>
        ) : error ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white">Failed to Load Logs</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm">{error.message}</p>
          </div>
        ) : !request ? (
          <div className="flex-1 py-8 text-center text-zinc-400 dark:text-zinc-550 text-xs font-bold">
            No logs found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 select-none">
            {/* Top overview card */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Request No</p>
                <p className="text-xs font-black text-slate-800 dark:text-white mt-0.5">{request.requestNo}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Date Raised</p>
                <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mt-0.5">{formatDate(request.createdAt)}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Ingredient</p>
                <p className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 mt-0.5">{request.ingredientName}</p>
              </div>
              <div>
                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Category</p>
                <span className="inline-block text-[10px] font-bold text-zinc-500 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-2 py-0.5 rounded-lg mt-0.5">
                  {ingredient?.category || "Unknown"}
                </span>
              </div>
            </div>

            {/* Basic request quantities and details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-850 bg-white dark:bg-zinc-900 space-y-0.5">
                <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Requested Quantity</p>
                <p className="text-base font-black text-slate-855 dark:text-white">
                  {request.requestedQty} <span className="text-[10px] text-slate-400 font-medium">{ingredient?.unit}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-855 bg-white dark:bg-zinc-900 space-y-0.5">
                <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Approved Quantity</p>
                <p className="text-base font-black text-slate-855 dark:text-white">
                  {request.approvedQty || 0} <span className="text-[10px] text-slate-400 font-medium">{ingredient?.unit}</span>
                </p>
              </div>
              <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-855 bg-white dark:bg-zinc-900 space-y-0.5">
                <p className="text-[9px] uppercase font-bold tracking-wider text-slate-400">Delivered Quantity</p>
                <p className="text-base font-black text-slate-855 dark:text-white">
                  {request.deliveredQty || 0} <span className="text-[10px] text-slate-400 font-medium">{ingredient?.unit}</span>
                </p>
              </div>
            </div>

            {/* Staff Profiles Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-850 bg-white dark:bg-zinc-900 space-y-2 text-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-50 dark:border-zinc-805 pb-1">
                  <User className="w-3.5 h-3.5 text-amber-500" />
                  Requested By Profile
                </div>
                {requestedBy ? (
                  <div className="space-y-1 text-[11px]">
                    <p className="font-bold text-slate-800 dark:text-white leading-none mb-0.5">{requestedBy.name}</p>
                    <p className="text-zinc-500">Role: <span className="font-semibold">{requestedBy.role}</span></p>
                    <p className="text-zinc-500">Shift: <span className="font-semibold">{requestedBy.shift}</span></p>
                    <p className="text-zinc-500">Dept: <span className="font-semibold">{requestedBy.department}</span></p>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400">Profile metadata missing</p>
                )}
              </div>

              <div className="p-3 rounded-xl border border-slate-100 dark:border-zinc-850 bg-white dark:bg-zinc-900 space-y-2 text-xs">
                <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-50 dark:border-zinc-805 pb-1">
                  <User className="w-3.5 h-3.5 text-emerald-500" />
                  Approved By Profile
                </div>
                {request.status !== "pending" && approvedBy ? (
                  <div className="space-y-1 text-[11px]">
                    <p className="font-bold text-slate-800 dark:text-white leading-none mb-0.5">{approvedBy.name}</p>
                    <p className="text-zinc-500">Role: <span className="font-semibold">{approvedBy.role}</span></p>
                    <p className="text-zinc-500">Shift: <span className="font-semibold">{approvedBy.shift}</span></p>
                    <p className="text-zinc-500">Dept: <span className="font-semibold">{approvedBy.department}</span></p>
                  </div>
                ) : request.status === "rejected" ? (
                  <div className="space-y-1 text-[11px] text-zinc-505">
                    <p className="font-bold text-rose-600 dark:text-rose-400">Rejected</p>
                    <p>Processed by Store Manager</p>
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 py-3 italic">Awaiting store manager approval</p>
                )}
              </div>
            </div>

            {/* Approval progress timeline */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-zinc-850 bg-white dark:bg-zinc-900 space-y-3">
              <h4 className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 border-b border-slate-50 dark:border-zinc-805 pb-1.5">
                Approval Flow Progress
              </h4>
              <ApprovalTimeline request={request} />
            </div>

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-zinc-800">
              <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">
                Store operations logs
              </span>
              
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-855 hover:bg-slate-50 dark:hover:bg-zinc-850 text-xs font-bold text-slate-700 dark:text-zinc-300 transition-colors w-full sm:w-auto text-center cursor-pointer"
                >
                  Close
                </button>

                {/* Manager pending actions */}
                {role === "store_manager" && request.status === "pending" && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        onReject(request._id);
                      }}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 dark:border-rose-900/30 bg-rose-50/20 text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955 text-xs font-bold transition-all w-full sm:w-auto text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <XOctagon className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApprove(request._id);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white transition-all shadow-sm w-full sm:w-auto text-center flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </>
                )}

                {/* Manager approved (ready to fulfill) action */}
                {role === "store_manager" && request.status === "approved" && (
                  <button
                    type="button"
                    onClick={() => {
                      onFulfill(request._id);
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-xs font-bold text-white transition-all shadow-sm w-full sm:w-auto text-center flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    Fulfill Request
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
