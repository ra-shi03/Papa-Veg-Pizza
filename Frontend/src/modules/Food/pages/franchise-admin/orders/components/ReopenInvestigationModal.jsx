import React, { useState } from "react";
import { X, ShieldAlert, AlertCircle, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { useReopenInvestigation } from "../ordersQuery";

export default function ReopenInvestigationModal({ isOpen, onClose, order }) {
  const { mutateAsync: reopenInvestigation, isLoading } = useReopenInvestigation();

  // Form fields state
  const [investigationReason, setInvestigationReason] = useState("Disputed Customer cancellation timeline");
  const [priority, setPriority] = useState("Medium");
  const [assignedStaff, setAssignedStaff] = useState("Amit Patel");
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState([]);

  if (!isOpen || !order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please provide a detailed description of the reopening request.");
      return;
    }

    try {
      await reopenInvestigation({
        orderId: order.id,
        reason: investigationReason,
        priority,
        assignedStaff,
        description,
        attachments: attachments.map(f => f.name)
      });
      toast.success("Investigation case reopened successfully.");
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to reopen investigation.");
    }
  };

  const handleMockAttachment = () => {
    const mockFileNames = ["store_kitchen_logs.pdf", "customer_chat_screenshot.webp", "razorpay_settlement_receipt.xlsx"];
    const randomFile = mockFileNames[Math.floor(Math.random() * mockFileNames.length)];
    
    if (attachments.find(a => a.name === randomFile)) {
      toast.info("Attachment already added.");
      return;
    }

    setAttachments([...attachments, { name: randomFile, size: "142 KB" }]);
    toast.success(`Mock file "${randomFile}" attached successfully.`);
  };

  const handleRemoveAttachment = (name) => {
    setAttachments(attachments.filter(a => a.name !== name));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog Content (700px Width) */}
      <div className="relative w-full max-w-[700px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-scale-up">
        
        {/* Header */}
        <header className="p-4 border-b border-zinc-100 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
          <div className="flex items-center gap-2">
            <ShieldAlert className="text-[var(--primary)]" size={18} />
            <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
              Reopen Investigation
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
          >
            <X size={16} />
          </button>
        </header>

        {/* Scrollable Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4.5 max-h-[80vh] text-xs">
          
          <div className="p-3 bg-amber-50 text-amber-705 dark:bg-amber-955/10 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30 rounded-xl flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Investigation Reopening Notice</p>
              <p className="text-[10px] mt-0.5">Reopening a case sets the order status to "Under Review" and assigns dedicated operations staff to audit logs, kitchen timestamps, and payment status.</p>
            </div>
          </div>

          {/* Core Info Summary */}
          <div className="p-3.5 rounded-xl border border-zinc-150 dark:border-zinc-800 grid grid-cols-2 sm:grid-cols-3 gap-2 bg-zinc-50/10 dark:bg-zinc-900/5">
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Order Number</span>
              <span className="font-bold text-zinc-850 dark:text-zinc-200">{order.orderNumber}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Store</span>
              <span className="font-bold text-zinc-850 dark:text-zinc-200">{order.store.name}</span>
            </div>
            <div>
              <span className="text-zinc-400 block text-[9px] uppercase font-semibold">Total Price</span>
              <span className="font-bold text-[var(--primary)]">₹{order.pricing.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Form fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Investigation Reason dropdown */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-350">Investigation Reason</label>
              <select
                value={investigationReason}
                onChange={(e) => setInvestigationReason(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-semibold focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="Disputed Customer cancellation timeline">Disputed Customer cancellation timeline</option>
                <option value="Store manager cancellation audit request">Store manager cancellation audit request</option>
                <option value="Refund amount mismatch error">Refund amount mismatch error</option>
                <option value="Razorpay payment gateway double charge dispute">Razorpay payment gateway double charge dispute</option>
                <option value="Fake / System bug order cancel loop suspected">Fake / System bug order cancel loop suspected</option>
              </select>
            </div>

            {/* Priority Selector */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-350">Investigation Priority</label>
              <div className="grid grid-cols-3 gap-2">
                {["Low", "Medium", "High"].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 rounded-xl text-center font-bold border transition-all cursor-pointer ${
                      priority === p
                        ? p === "High"
                          ? "bg-rose-500 border-rose-500 text-white shadow-sm"
                          : p === "Medium"
                            ? "bg-amber-500 border-amber-500 text-white shadow-sm"
                            : "bg-blue-500 border-blue-500 text-white shadow-sm"
                        : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Assign Staff */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-350 flex items-center gap-1">
                <UserPlus size={13} />
                Assign Operations Inspector
              </label>
              <select
                value={assignedStaff}
                onChange={(e) => setAssignedStaff(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold focus:outline-none focus:border-[var(--primary)]"
              >
                <option value="Amit Patel">Amit Patel (Connaught Place Ops)</option>
                <option value="Suresh Raina">Suresh Raina (Bandra West Ops)</option>
                <option value="Karan Johar">Karan Johar (HQ Financial Auditor)</option>
                <option value="Rahul Sharma">Rahul Sharma ( बेंगलुरु Local Inspector )</option>
              </select>
            </div>

            {/* Attachments Section */}
            <div className="flex flex-col gap-1.5">
              <label className="font-semibold text-zinc-700 dark:text-zinc-350">Upload Logs & Evidence</label>
              <button
                type="button"
                onClick={handleMockAttachment}
                className="w-full py-2 border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-[var(--primary)] text-zinc-550 dark:hover:text-zinc-200 rounded-xl font-bold transition-all bg-zinc-50/50 dark:bg-zinc-950/20 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles size={13} className="text-[var(--primary)]" />
                Attach Simulated Audit File
              </button>
            </div>

          </div>

          {/* List of Attachments */}
          {attachments.length > 0 && (
            <div className="p-3 bg-zinc-50 dark:bg-zinc-900/30 rounded-xl border border-zinc-150 dark:border-zinc-800 space-y-1.5">
              <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Attached Evidence ({attachments.length})</p>
              <div className="space-y-1">
                {attachments.map((file) => (
                  <div key={file.name} className="flex items-center justify-between p-1.5 bg-white dark:bg-zinc-950 rounded-lg border border-zinc-100 dark:border-zinc-850">
                    <span className="font-mono text-[10px] text-zinc-800 dark:text-zinc-200 truncate max-w-[200px]">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(file.name)}
                      className="text-rose-500 hover:text-rose-600 font-bold hover:bg-rose-50 dark:hover:bg-rose-950/20 px-2 py-0.5 rounded"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="font-semibold text-zinc-700 dark:text-zinc-350">Audit Description & Notes</label>
            <textarea
              rows={3}
              placeholder="State key reasons why investigation is required, customer claims details, or timeline disputes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl focus:outline-none focus:border-[var(--primary)] resize-none"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-850 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-55 cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? "Processing..." : "Reopen Case"}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
