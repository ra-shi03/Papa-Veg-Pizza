import React, { useState, useEffect } from "react";
import { 
  X, Check, AlertTriangle, DollarSign, Ticket, FileText, Send 
} from "lucide-react";
import { DialogWrapper } from "./ComplaintModals";

// 1. RESOLVE COMPLAINT MODAL
export function ResolveComplaintModal({ isOpen, onClose, complaint, onResolve }) {
  const [formData, setFormData] = useState({
    resolutionType: "Apology & Closure",
    refundAmount: 0,
    couponCode: "",
    couponValue: 0,
    remarks: ""
  });

  useEffect(() => {
    if (complaint) {
      // If payment issue, auto-set resolution to Refund
      const isPayment = complaint.category === "Payment";
      setFormData({
        resolutionType: isPayment ? "Refund" : "Apology & Closure",
        refundAmount: 0,
        couponCode: "",
        couponValue: 0,
        remarks: ""
      });
    }
  }, [complaint]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!complaint) return;
    onResolve(complaint._id, formData);
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title={`Resolve Ticket ${complaint?.ticketNumber || ""}`} maxWidth="max-w-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Resolution Type <span className="text-red-500">*</span>
          </label>
          <select
            value={formData.resolutionType}
            onChange={(e) => setFormData(prev => ({ ...prev, resolutionType: e.target.value }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            required
          >
            <option value="Apology & Closure">Standard Apology / Explanation</option>
            <option value="Refund">Full/Partial Refund (Razorpay/COD)</option>
            <option value="Coupon Compensation">Issue Discount Coupon / Points</option>
            <option value="Replacement Order">Ship Free Replacement Pizza</option>
          </select>
        </div>

        {/* Refund Panel */}
        {formData.resolutionType === "Refund" && (
          <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-lg space-y-3">
            <div className="flex items-center gap-1.5 text-rose-700 dark:text-rose-400 font-extrabold text-[10px] uppercase">
              <DollarSign size={13} />
              Refund Dispatch Form
            </div>
            <div>
              <label className="block text-[10px] font-bold text-zinc-450 dark:text-zinc-400 mb-1">Refund Value (₹)</label>
              <input
                type="number"
                value={formData.refundAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, refundAmount: Number(e.target.value) }))}
                min={0}
                className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
                required
              />
            </div>
            <p className="text-[10px] text-zinc-450 font-medium">
              Refund is routed back to Razorpay gateway or cash registry and settles in 3-5 working days.
            </p>
          </div>
        )}

        {/* Coupon Panel */}
        {formData.resolutionType === "Coupon Compensation" && (
          <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 rounded-lg space-y-3">
            <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px] uppercase">
              <Ticket size={13} />
              Compensation Voucher Details
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-zinc-450 dark:text-zinc-400 mb-1">Voucher Code</label>
                <input
                  type="text"
                  value={formData.couponCode}
                  onChange={(e) => setFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                  placeholder="COMP100"
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-450 dark:text-zinc-400 mb-1">Voucher Value (₹)</label>
                <input
                  type="number"
                  value={formData.couponValue}
                  onChange={(e) => setFormData(prev => ({ ...prev, couponValue: Number(e.target.value) }))}
                  min={0}
                  className="w-full px-3 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
                  required
                />
              </div>
            </div>
            <p className="text-[10px] text-zinc-450 font-medium">
              Vouchers will be immediately pushed to the customer's mobile profile and are applicable on next checkout.
            </p>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Resolution Explanation & Action Taken <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.remarks}
            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
            placeholder="Type message that customer will receive..."
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            required
          />
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-lg font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Mark Resolved
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}

// 2. CLOSE TICKET MODAL
export function CloseTicketModal({ isOpen, onClose, complaint, onCloseTicket }) {
  const [formData, setFormData] = useState({
    closingRemarks: "",
    clientVerified: false
  });

  useEffect(() => {
    if (complaint) {
      setFormData({
        closingRemarks: "",
        clientVerified: false
      });
    }
  }, [complaint]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!complaint || !formData.clientVerified) return;
    onCloseTicket(complaint._id, formData);
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title={`Close Ticket ${complaint?.ticketNumber || ""}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="bg-slate-500/5 border border-slate-500/10 rounded-lg p-3 flex gap-2">
          <FileText className="text-slate-500 shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] text-zinc-600 dark:text-zinc-400 leading-normal font-medium">
            Closing a ticket locks the conversation history and archives the log. No further comments can be posted to the ticket timeline.
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Closing Remarks / Final Verification Note <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formData.closingRemarks}
            onChange={(e) => setFormData(prev => ({ ...prev, closingRemarks: e.target.value }))}
            placeholder="Type final comments about resolution confirmation..."
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            required
          />
        </div>

        <label className="flex items-start gap-2.5 p-2 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-lg select-none cursor-pointer">
          <input
            type="checkbox"
            checked={formData.clientVerified}
            onChange={(e) => setFormData(prev => ({ ...prev, clientVerified: e.target.checked }))}
            className="mt-0.5 accent-[var(--primary)]"
            required
          />
          <span className="text-[10px] text-zinc-650 dark:text-zinc-455 font-bold leading-normal">
            I confirm that we contacted the customer, and they verified that the issue has been resolved to their satisfaction.
          </span>
        </label>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-lg font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!formData.clientVerified}
            className="px-4 py-2 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Close & Archive
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}

// 3. ADD COMPLAINT NOTE MODAL
export function AddComplaintNoteModal({ isOpen, onClose, complaintId, onAddNote }) {
  const [noteText, setNoteText] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    onAddNote(complaintId, noteText.trim());
    setNoteText("");
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Add Internal Staff Note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Private Staff Remark
          </label>
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Type internal remarks (not visible to customer)..."
            rows={4}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150 scrollbar-thin"
            required
          />
        </div>

        <p className="text-[10px] text-zinc-450 leading-relaxed font-medium">
          Internal notes are only shown to franchise admins, kitchen staff, and customer success agents. They are excluded from customer invoices/logs.
        </p>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-zinc-250 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-lg font-bold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-90 font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Save Note
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 4. IMAGE LIGHTBOX PREVIEW
export function ImagePreviewLightbox({ isOpen, onClose, imageSrc }) {
  if (!isOpen || !imageSrc) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/85 transition-opacity" 
        onClick={onClose}
      />
      {/* Panel */}
      <div className="relative max-w-4xl max-h-[85vh] overflow-hidden rounded-xl border border-zinc-800 z-10 flex flex-col items-center">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 rounded-full text-white cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>
        <img 
          src={imageSrc} 
          alt="Preview evidence" 
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
}
