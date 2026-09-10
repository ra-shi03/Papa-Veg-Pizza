import React, { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@food/components/ui/dialog";
import { useWasteDetails } from "../hooks/useWasteDetails";
import { format } from "date-fns";
import { 
  Eye, 
  User, 
  AlertCircle, 
  ShieldAlert, 
  Calendar, 
  TrendingDown, 
  FileImage, 
  Download, 
  ZoomIn, 
  CheckCircle2, 
  Trash2,
  Boxes,
  ArrowRight
} from "lucide-react";

export function WasteDetailsModal({ 
  isOpen, 
  onClose, 
  wasteId, 
  role = "store_manager",
  onApprove, // callback to trigger approval dialog
  onDelete   // callback to trigger delete confirmation dialog
}) {
  const { data, isLoading, error } = useWasteDetails(wasteId);
  const [zoomedImage, setZoomedImage] = useState(null);
  const [zoomScale, setZoomScale] = useState(1);

  const wasteLog = data?.wasteLog;
  const ingredient = data?.ingredient;
  const reportedBy = data?.reportedBy;
  const approvedBy = data?.approvedBy;
  const images = data?.images || [];
  const timeline = data?.timeline || [];

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), "dd MMM yyyy, hh:mm a");
    } catch (e) {
      return dateStr;
    }
  };

  const formatRupee = (value) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2
    }).format(value);
  };

  const getWasteTypeBadge = (type) => {
    switch (type) {
      case "expired":
        return <span className="inline-flex items-center text-[10px] font-bold text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/20 px-2.5 py-0.5 rounded-full border border-red-150 dark:border-red-900/30 capitalize">Expired</span>;
      case "burnt":
        return <span className="inline-flex items-center text-[10px] font-bold text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/20 px-2.5 py-0.5 rounded-full border border-orange-150 dark:border-orange-900/30 capitalize">Burnt</span>;
      case "damaged":
        return <span className="inline-flex items-center text-[10px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 px-2.5 py-0.5 rounded-full border border-amber-150 dark:border-amber-900/30 capitalize">Damaged</span>;
      case "spillage":
        return <span className="inline-flex items-center text-[10px] font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 px-2.5 py-0.5 rounded-full border border-blue-150 dark:border-blue-900/30 capitalize">Spillage</span>;
      default:
        return <span className="text-[10px] font-semibold">{type}</span>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return <span className="inline-flex items-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2.5 py-0.5 rounded-full border border-emerald-150 dark:border-emerald-900/30 capitalize">Approved</span>;
      case "pending":
        return <span className="inline-flex items-center text-[10px] font-bold text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 px-2.5 py-0.5 rounded-full border border-yellow-150 dark:border-yellow-900/30 capitalize">Pending</span>;
      default:
        return <span className="text-[10px] font-semibold">{status}</span>;
    }
  };

  // Helper to trigger direct image download from base64
  const downloadImage = (base64String, filename = "waste-proof.jpg") => {
    const link = document.createElement("a");
    link.href = base64String;
    link.download = filename;
    link.click();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl lg:left-[calc(50%+140px)] p-4 md:p-5 rounded-2xl border border-zinc-150 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <DialogHeader className="mb-3">
          <div className="flex items-center justify-between gap-4">
            <DialogTitle className="text-sm font-black text-zinc-900 dark:text-white tracking-tight flex items-center gap-1.5">
              <Eye className="text-[var(--primary)] w-4 h-4" />
              Waste Audit Log Details
            </DialogTitle>
            {wasteLog && (
              <div className="flex items-center gap-2">
                {getStatusBadge(wasteLog.status)}
                {getWasteTypeBadge(wasteLog.wasteType)}
              </div>
            )}
          </div>
          <DialogDescription className="text-zinc-505 dark:text-zinc-400 text-[10px]">
            Full parameters audit report, store financial impact, and timeline logs.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-bold">Loading waste log details...</p>
          </div>
        ) : error ? (
          <div className="flex-1 py-8 flex flex-col items-center justify-center text-center space-y-2">
            <div className="w-10 h-10 bg-rose-50 dark:bg-rose-950/20 text-rose-500 rounded-full flex items-center justify-center">
              <ShieldAlert size={20} />
            </div>
            <p className="text-xs font-bold text-zinc-900 dark:text-white">Failed to Load Details</p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 max-w-sm">{error.message}</p>
          </div>
        ) : !wasteLog ? (
          <div className="flex-1 py-8 text-center text-zinc-400 dark:text-zinc-550 text-xs font-bold">
            No waste log found.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 select-none text-xs">
            
            {/* Top Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              
              {/* Ingredient Card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Ingredient Information</span>
                  <h4 className="text-xs font-black text-slate-800 dark:text-white mt-1">{ingredient?.ingredientName}</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Category: {ingredient?.category}</p>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-slate-200/50 dark:border-zinc-800 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Current Stock:</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-300">{ingredient?.currentStock} {ingredient?.unit}</span>
                </div>
              </div>

              {/* Loss Valuation Card */}
              <div className="p-3 rounded-xl bg-rose-50/10 dark:bg-rose-950/10 border border-rose-100/20 dark:border-rose-900/30 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Loss Assessment</span>
                  <h4 className="text-sm font-black text-rose-600 dark:text-rose-400 mt-1">{formatRupee(wasteLog.estimatedLoss)}</h4>
                  <p className="text-[9px] text-zinc-400 mt-0.5">Wasted amount: {wasteLog.quantity} {ingredient?.unit}</p>
                </div>
                <div className="mt-2.5 pt-2.5 border-t border-rose-200/20 dark:border-rose-900/20 flex items-center justify-between text-[10px]">
                  <span className="text-zinc-400">Cost/Unit:</span>
                  <span className="font-bold text-rose-500/80">{formatRupee(ingredient?.costPerUnit || 0)}/{ingredient?.unit}</span>
                </div>
              </div>

              {/* Store impact description card */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 flex flex-col justify-between">
                <div>
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Store Impact Summary</span>
                  <p className="text-[10px] text-slate-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
                    This write-off represents a financial shrinkage of {formatRupee(wasteLog.estimatedLoss)}. All stocks were subtracted from active layout inventory.
                  </p>
                </div>
                <div className="mt-2.5 pt-2 text-[9px] text-zinc-400 italic">
                  Reported by: {reportedBy?.name || wasteLog.reportedBy} ({reportedBy?.role || "Staff"})
                </div>
              </div>

            </div>

            {/* Middle Section: Reason and Remarks */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Report parameters */}
              <div className="space-y-3">
                <div className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-white text-[10px] uppercase tracking-wider text-zinc-400">Report Parameters</h5>
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Date Reported:</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{formatDate(wasteLog.createdAt)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Reporter Shift:</span>
                      <span className="font-semibold text-slate-700 dark:text-zinc-300">{reportedBy?.shift || "Morning Shift"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-400">Status:</span>
                      <span className="font-semibold">{wasteLog.status === "approved" ? "Approved & Audited" : "Pending Approval"}</span>
                    </div>
                    {approvedBy && (
                      <div className="flex justify-between">
                        <span className="text-zinc-400">Approved By:</span>
                        <span className="font-semibold text-slate-700 dark:text-zinc-300">{approvedBy.name}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 space-y-2.5">
                  <div>
                    <h5 className="font-bold text-slate-800 dark:text-white text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Reason for Loss</h5>
                    <p className="text-[11px] text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950/40 p-2 rounded-lg border border-slate-100/50 dark:border-zinc-900/50">
                      {wasteLog.reason}
                    </p>
                  </div>
                  {wasteLog.remarks && (
                    <div>
                      <h5 className="font-bold text-slate-800 dark:text-white text-[10px] uppercase tracking-wider text-zinc-400 mb-1">Remarks / Countermeasures</h5>
                      <p className="text-[11px] text-slate-700 dark:text-zinc-300 bg-slate-50 dark:bg-zinc-950/40 p-2 rounded-lg border border-slate-100/50 dark:border-zinc-900/50">
                        {wasteLog.remarks}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Timeline Section */}
              <div className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-850 flex flex-col justify-between">
                <div>
                  <h5 className="font-bold text-slate-800 dark:text-white text-[10px] uppercase tracking-wider text-zinc-400 mb-2">Audit Timeline</h5>
                  <div className="relative border-l border-zinc-150 dark:border-zinc-850 ml-2.5 pl-4 space-y-4 py-1">
                    {timeline.map((event, idx) => {
                      const isReported = event.action === "reported";
                      const isApproved = event.action === "approved";
                      const isDeleted = event.action === "deleted";

                      return (
                        <div key={idx} className="relative">
                          {/* Dot indicator */}
                          <div className={`absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full border-2 bg-white dark:bg-zinc-900 ${
                            isReported ? "border-indigo-400" : isApproved ? "border-emerald-400" : "border-rose-400"
                          }`} />
                          
                          <div>
                            <p className="text-[10px] font-bold text-slate-800 dark:text-white flex items-center gap-1">
                              {event.user}
                              <span className={`text-[8px] px-1 py-0.5 rounded font-extrabold uppercase ${
                                isReported 
                                  ? "text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30" 
                                  : isApproved 
                                  ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
                                  : "text-rose-600 bg-rose-50 dark:bg-rose-950/30"
                              }`}>
                                {event.action}
                              </span>
                            </p>
                            <p className="text-[9px] text-zinc-400">{formatDate(event.createdAt)}</p>
                            {event.remarks && (
                              <p className="text-[10px] text-zinc-500 mt-0.5 bg-slate-50/50 dark:bg-zinc-950/20 px-1.5 py-0.5 rounded italic">
                                "{event.remarks}"
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Footer contextual actions */}
                {wasteLog.status === "pending" && role === "store_manager" && (
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2">
                    <button
                      onClick={() => {
                        onDelete(wasteLog._id);
                      }}
                      className="px-3 py-1.5 border border-rose-250 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={11} />
                      Reject/Delete Record
                    </button>
                    <button
                      onClick={() => {
                        onApprove(wasteLog._id);
                      }}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                    >
                      <CheckCircle2 size={11} />
                      Approve Spoilage
                    </button>
                  </div>
                )}
              </div>

            </div>

            {/* Proof Photos Gallery */}
            <div className="p-3 rounded-xl border border-zinc-150 dark:border-zinc-850">
              <h5 className="font-bold text-slate-800 dark:text-white text-[10px] uppercase tracking-wider text-zinc-400 mb-2">Proof Photos ({images.length})</h5>
              {images.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {images.map((img, idx) => (
                    <div 
                      key={idx} 
                      className="relative rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 aspect-square group bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center cursor-pointer shadow-sm"
                      onClick={() => {
                        setZoomedImage(img);
                        setZoomScale(1);
                      }}
                    >
                      <img 
                        src={img} 
                        alt={`Wastage proof ${idx + 1}`} 
                        className="object-cover w-full h-full"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-1.5 transition-all">
                        <ZoomIn size={14} className="text-white" />
                        <span className="text-[9px] text-white font-bold">Zoom</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-zinc-400 italic text-[11px]">
                  No photo attachments uploaded for this wastage log.
                </div>
              )}
            </div>

          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-4 pt-3 border-t border-zinc-150 dark:border-zinc-800 flex items-center justify-end select-none">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-bold text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded-lg transition-all cursor-pointer"
          >
            Close Details
          </button>
        </div>

      </DialogContent>

      {/* Lightbox Zoom Overlay */}
      {zoomedImage && (
        <Dialog open={!!zoomedImage} onOpenChange={(open) => !open && setZoomedImage(null)}>
          <DialogContent className="max-w-2xl bg-zinc-950 border border-zinc-900 p-3 rounded-2xl flex flex-col items-center justify-center max-h-[85vh] select-none">
            <div className="relative w-full flex-1 overflow-hidden flex items-center justify-center bg-black rounded-lg">
              <img 
                src={zoomedImage} 
                alt="Wastage Proof Zoomed" 
                className="max-h-[60vh] object-contain transition-transform duration-250 rounded"
                style={{ transform: `scale(${zoomScale})` }}
              />
            </div>
            
            {/* Overlay Toolbar */}
            <div className="w-full flex items-center justify-between pt-3 text-white text-xs px-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setZoomScale(scale => Math.min(3, scale + 0.25))}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <ZoomIn size={12} />
                  Zoom In
                </button>
                <button
                  onClick={() => setZoomScale(1)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold transition-all cursor-pointer"
                >
                  Reset Zoom
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadImage(zoomedImage, `waste-${wasteId}-proof.jpg`)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer"
                >
                  <Download size={12} />
                  Download
                </button>
                <button
                  onClick={() => setZoomedImage(null)}
                  className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 rounded-lg font-bold transition-all cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

    </Dialog>
  );
}
