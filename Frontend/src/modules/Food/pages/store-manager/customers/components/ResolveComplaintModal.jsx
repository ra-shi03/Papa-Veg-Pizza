import React, { useState, useEffect } from "react";
import { X, Sparkles, AlertTriangle, ShieldCheck, HelpCircle } from "lucide-react";
import { useResolveComplaint, useComplaintDetails } from "../hooks/useComplaints";
import { mockStaff } from "../mockData";
import { Skeleton } from "@food/components/ui/skeleton";
import { toast } from "sonner";

export default function ResolveComplaintModal({
  visible,
  onClose,
  complaintId,
  userRole
}) {
  const { data: complaint, isLoading } = useComplaintDetails(visible ? complaintId : null);
  const resolveMutation = useResolveComplaint();

  const [staff, setStaff] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [refundAmount, setRefundAmount] = useState(0);
  const [replacementOrderId, setReplacementOrderId] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState("");

  const isReadOnly = userRole === "assistant_manager";

  if (!visible) return null;

  // Pre-fill fields or reset when modal opens
  useEffect(() => {
    if (complaint) {
      setStaff(complaint.resolvedBy || mockStaff[0]?.fullName || "");
      setCouponCode("");
      setRefundAmount(0);
      setReplacementOrderId("");
      setResolutionNotes("");
      setEvidenceUrl("");
    }
  }, [complaint]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isReadOnly) {
      toast.error("Read-Only Mode", {
        description: "Assistant Manager role is restricted from resolving complaints."
      });
      return;
    }

    if (!resolutionNotes.trim()) {
      toast.error("Validation Error", {
        description: "Please enter the resolution notes taken."
      });
      return;
    }

    const orderAmount = complaint?.order?.totalAmount || 0;
    if (refundAmount < 0) {
      toast.error("Validation Error", {
        description: "Refund amount cannot be negative."
      });
      return;
    }

    if (orderAmount > 0 && refundAmount > orderAmount) {
      toast.error("Validation Error", {
        description: `Refund amount cannot exceed the order amount (₹${orderAmount}).`
      });
      return;
    }

    const payload = {
      staff,
      couponIssued: couponCode,
      refundAmount: Number(refundAmount),
      replacementOrderId,
      actionTaken: resolutionNotes,
      evidenceImage: evidenceUrl
    };

    resolveMutation.mutate(
      { complaintId, data: payload },
      {
        onSuccess: () => {
          onClose();
        }
      }
    );
  };

  const handleRecommendCoupon = () => {
    // Fill in a recommended coupon
    const orderNum = complaint?.orderNumber || "PVP";
    setCouponCode(`SORRY-${orderNum.replace("PVP-", "")}`);
    toast.info("Apology coupon generated.");
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <div 
      className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-60 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase flex items-center gap-1.5">
              <ShieldCheck className="text-emerald-500" size={16} />
              Resolve Customer Complaint
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-semibold mt-0.5">
              Specify refund amounts, dispatch replacement pizzas, or issue voucher coupons.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs font-semibold">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-2xl" />
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-10 w-full rounded-2xl" />
            </div>
          ) : (
            <>
              {/* Linked Complaint Context Summary */}
              {complaint && (
                <div className="bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-3 items-start">
                  <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={15} />
                  <div>
                    <h5 className="font-extrabold text-zinc-850 dark:text-zinc-200">
                      Resolving: {complaint._id} - {complaint.customerName}
                    </h5>
                    <p className="text-[10px] text-zinc-450 dark:text-zinc-500 leading-relaxed font-semibold mt-0.5">
                      Issue description: "{complaint.description}"
                    </p>
                    {complaint.order && (
                      <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 font-mono">
                        Linked Order: {complaint.orderNumber} (Grand Total: {formatCurrency(complaint.order.totalAmount)})
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Read-Only Mode Banner */}
              {isReadOnly && (
                <div className="bg-rose-500/5 dark:bg-rose-500/10 border border-rose-550/20 p-4.5 rounded-2xl text-rose-500 font-extrabold flex gap-2 items-center">
                  <AlertTriangle size={15} />
                  <span>Your Assistant Manager profile is locked to Read-Only view. Form submissions are disabled.</span>
                </div>
              )}

              {/* Form Fields Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Staff Assignment Selection */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Staff Assignee / Resolved By
                  </label>
                  <select
                    disabled={isReadOnly}
                    value={staff}
                    onChange={(e) => setStaff(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white outline-none focus:border-[var(--primary)] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {mockStaff.map((st) => (
                      <option key={st._id} value={st.fullName}>
                        {st.fullName} ({st.role})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Voucher Apology Coupon Code */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider flex justify-between">
                    <span>Coupon Voucher Code</span>
                    {!isReadOnly && (
                      <button
                        type="button"
                        onClick={handleRecommendCoupon}
                        className="text-[9px] text-[var(--primary)] hover:underline flex items-center gap-0.5 cursor-pointer font-bold lowercase"
                      >
                        <Sparkles size={8} /> Auto Generate
                      </button>
                    )}
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SORRY50"
                    className="w-full text-xs font-semibold px-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Refund Cash Payout */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Refund Amount (INR ₹)
                  </label>
                  <input
                    type="number"
                    disabled={isReadOnly}
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(Math.max(0, Number(e.target.value)))}
                    placeholder="e.g. 150"
                    className="w-full text-xs font-semibold px-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Replacement Order Identifier */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Replacement Order ID
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={replacementOrderId}
                    onChange={(e) => setReplacementOrderId(e.target.value)}
                    placeholder="e.g. ord-3"
                    className="w-full text-xs font-semibold px-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Upload Image Evidence Link */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Evidence Image URL / Path (Optional)
                  </label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={evidenceUrl}
                    onChange={(e) => setEvidenceUrl(e.target.value)}
                    placeholder="e.g. https://images.unsplash.com/photo-..."
                    className="w-full text-xs font-semibold px-3.5 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all disabled:opacity-50"
                  />
                </div>

                {/* Resolution Notes Description */}
                <div className="flex flex-col gap-1.5 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                    Resolution Actions Taken (Required)
                  </label>
                  <textarea
                    required
                    disabled={isReadOnly}
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    placeholder="Describe how the complaint is resolved (e.g. refunded customer, pizza refected, called driver...)"
                    rows={4}
                    className="w-full text-xs font-semibold px-3.5 py-2.5 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-800 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all resize-none disabled:opacity-50"
                  />
                </div>
              </div>
            </>
          )}
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850 flex justify-end items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-2 bg-white dark:bg-zinc-900 hover:bg-neutral-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl text-xs border border-zinc-200 dark:border-zinc-800 transition-all cursor-pointer shadow-sm"
          >
            Cancel
          </button>
          
          <button
            type="button"
            disabled={isReadOnly || resolveMutation.isPending || isLoading}
            onClick={handleSubmit}
            className={`flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl text-xs transition-all cursor-pointer shadow-sm shadow-emerald-600/15 ${
              isReadOnly || resolveMutation.isPending || isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {resolveMutation.isPending ? "Saving..." : "Resolve Complaint"}
          </button>
        </div>
      </div>
    </div>
  );
}
