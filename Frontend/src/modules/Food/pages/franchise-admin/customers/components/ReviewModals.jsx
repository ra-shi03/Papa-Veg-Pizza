import React, { useState, useEffect } from "react";
import { 
  X, Check, AlertTriangle, ShieldAlert, FileText, Send, 
  Download, Sparkles, Star, Users, DollarSign, Package 
} from "lucide-react";
import { mockStores } from "../mockData";

// Helper to format date
const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return String(value);
  }
};

// Local storage retrieval helpers
const getDB = (key) => JSON.parse(localStorage.getItem(key) || "[]");

// Shared accessible dialog panel wrapper
export function DialogWrapper({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden transform transition-all animate-fade-down duration-200 z-10 max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 scrollbar-thin text-xs text-zinc-650 dark:text-zinc-350">
          {children}
        </div>
      </div>
    </div>
  );
}

// 1. REPLY REVIEW MODAL
export function ReplyReviewModal({ isOpen, onClose, review, onSubmit }) {
  const [replyMessage, setReplyMessage] = useState("");
  const [toggles, setToggles] = useState({
    publishReply: true,
    notifyCustomer: true,
    sendEmail: true,
    sendPush: true
  });

  useEffect(() => {
    if (isOpen) {
      setReplyMessage("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    onSubmit(review._id, {
      replyMessage: replyMessage.trim(),
      ...toggles
    });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Reply to Customer Review">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {review && (
          <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Customer feedback</span>
              <span className="text-[10px] text-amber-500 font-extrabold flex items-center gap-0.5">
                {Array.from({ length: review.rating }).map((_, i) => (
                  <Star key={i} size={10} fill="currentColor" />
                ))}
              </span>
            </div>
            <p className="italic text-zinc-500 leading-normal">"{review.reviewText || 'No text content'}"</p>
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Reply Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply message..."
            rows={4}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            required
          />
        </div>

        {/* Notifications toggles */}
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
          <label className="flex items-center gap-2 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={toggles.publishReply}
              onChange={(e) => setToggles({ ...toggles, publishReply: e.target.checked })}
              className="accent-[var(--primary)]"
            />
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Publish Reply publicly</span>
          </label>

          <label className="flex items-center gap-2 select-none cursor-pointer">
            <input
              type="checkbox"
              checked={toggles.notifyCustomer}
              onChange={(e) => setToggles({ ...toggles, notifyCustomer: e.target.checked })}
              className="accent-[var(--primary)]"
            />
            <span className="font-bold text-zinc-700 dark:text-zinc-300">Notify Customer (Triggers notifications)</span>
          </label>

          {toggles.notifyCustomer && (
            <div className="pl-5 grid grid-cols-2 gap-2 animate-fade-down">
              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px]">
                <input
                  type="checkbox"
                  checked={toggles.sendEmail}
                  onChange={(e) => setToggles({ ...toggles, sendEmail: e.target.checked })}
                  className="accent-[var(--primary)]"
                />
                <span className="text-zinc-500 font-medium">Send Email Notification</span>
              </label>

              <label className="flex items-center gap-2 select-none cursor-pointer text-[10px]">
                <input
                  type="checkbox"
                  checked={toggles.sendPush}
                  onChange={(e) => setToggles({ ...toggles, sendPush: e.target.checked })}
                  className="accent-[var(--primary)]"
                />
                <span className="text-zinc-500 font-medium">Send Mobile Push Alert</span>
              </label>
            </div>
          )}
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
            Send Response
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}

// 2. EDIT REPLY MODAL
export function EditReplyModal({ isOpen, onClose, review, onSubmit }) {
  const [replyMessage, setReplyMessage] = useState("");

  useEffect(() => {
    if (review && review.adminReply) {
      setReplyMessage(review.adminReply.message || "");
    }
  }, [review, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;
    onSubmit(review._id, { replyMessage: replyMessage.trim() });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Edit Admin Reply">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Update Reply Message <span className="text-red-500">*</span>
          </label>
          <textarea
            value={replyMessage}
            onChange={(e) => setReplyMessage(e.target.value)}
            placeholder="Type your reply message..."
            rows={4}
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
            Update Reply
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 3. HIDE REVIEW MODAL
export function HideReviewModal({ isOpen, onClose, review, onSubmit }) {
  const [reason, setReason] = useState("Spam");
  const [remarks, setRemarks] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!review) return;
    onSubmit(review._id, { reason, remarks, notifyCustomer });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Hide Review from Feed">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-3 flex gap-2">
          <AlertTriangle className="text-amber-500 shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-normal font-semibold font-medium">
            Hiding this review will remove it immediately from all customer-facing apps. The record will remain archived for reporting and audit logs.
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Reason for Hiding <span className="text-red-500">*</span>
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150 text-zinc-700 dark:text-zinc-300"
            required
          >
            <option value="Spam">Spam Content / Unrelated Texts</option>
            <option value="Abusive Content">Abusive or Inappropriate Language</option>
            <option value="Fake Review">Fake review / Competitor attack</option>
            <option value="Duplicate">Duplicate submission</option>
            <option value="Other">Other Operational (specify below)</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Staff Remarks / Explanation
          </label>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Type private reason notes..."
            rows={3}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
          />
        </div>

        <label className="flex items-center gap-2 select-none cursor-pointer">
          <input
            type="checkbox"
            checked={notifyCustomer}
            onChange={(e) => setNotifyCustomer(e.target.checked)}
            className="accent-[var(--primary)]"
          />
          <span className="font-bold text-zinc-700 dark:text-zinc-300">Send compliance notice to customer</span>
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
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Hide Review
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}

// 4. PUBLISH REVIEW MODAL (Confirmation)
export function PublishReviewModal({ isOpen, onClose, review, onConfirm }) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!review) return;
    onConfirm(review._id);
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Publish Review Confirmation">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-lg p-3 flex gap-2">
          <Check className="text-emerald-500 shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] text-emerald-700 dark:text-emerald-400 leading-normal font-semibold font-medium">
            This review is currently hidden. Do you want to publish it back to the customer app storefront and pizza listings?
          </p>
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
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-750 text-white font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Publish Review
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}

// 5. DELETE REVIEW MODAL
export function DeleteReviewModal({ isOpen, onClose, reviewId, onConfirm }) {
  const [reason, setReason] = useState("Inappropriate content");

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm(reviewId, { reason });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Delete Review">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div className="bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 flex gap-2">
          <ShieldAlert className="text-rose-600 shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] text-rose-700 dark:text-rose-400 leading-normal font-semibold font-medium">
            Are you sure you want to delete this review? This action will perform a soft-delete and log an audit trail entry.
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Delete Reason
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
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
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold uppercase rounded-lg shadow-sm cursor-pointer"
          >
            Confirm Delete
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}

// 6. CUSTOMER HISTORY MODAL
export function CustomerHistoryModal({ isOpen, onClose, customerId }) {
  const [profile, setProfile] = useState(null);
  const [history, setHistory] = useState({
    reviews: [],
    complaints: [],
    avgRating: 0
  });

  useEffect(() => {
    if (isOpen && customerId) {
      const customersList = getDB("pv_customers");
      const usersList = getDB("pv_users");
      const reviewsList = getDB("pv_reviews");
      const complaintsList = getDB("pv_complaints") || getDB("pv_customer_complaints");

      const cust = customersList.find(c => c._id === customerId);
      if (cust) {
        const u = usersList.find(user => user._id === cust.userId) || {};
        setProfile({
          ...cust,
          ...u
        });
      }

      const custReviews = reviewsList.filter(r => r.customerId === customerId);
      const custComplaints = complaintsList.filter(c => c.customerId === customerId);
      const avg = custReviews.length > 0
        ? parseFloat((custReviews.reduce((sum, r) => sum + r.rating, 0) / custReviews.length).toFixed(1))
        : 0;

      setHistory({
        reviews: custReviews,
        complaints: custComplaints,
        avgRating: avg
      });
    }
  }, [isOpen, customerId]);

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Customer Feedback Summary" maxWidth="max-w-xl">
      {profile ? (
        <div className="space-y-4">
          {/* Header Card */}
          <div className="flex items-center gap-3 pb-3 border-b border-zinc-150 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold text-sm">
              {profile.fullName?.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "CU"}
            </div>
            <div>
              <h4 className="font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">{profile.fullName}</h4>
              <p className="text-[10px] text-zinc-400 mt-0.5">{profile.mobile} | {profile.email}</p>
            </div>
          </div>

          {/* Stats Deck */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg text-center">
              <span className="text-[8px] font-bold text-zinc-400 uppercase block mb-1">Total Reviews</span>
              <strong className="text-sm font-extrabold text-zinc-800 dark:text-white">{history.reviews.length}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg text-center">
              <span className="text-[8px] font-bold text-zinc-400 uppercase block mb-1">Avg Rating Given</span>
              <strong className="text-sm font-extrabold text-amber-500">{history.avgRating}★</strong>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg text-center">
              <span className="text-[8px] font-bold text-zinc-400 uppercase block mb-1">Total Orders</span>
              <strong className="text-sm font-extrabold text-zinc-800 dark:text-white">{profile.totalOrders || 0}</strong>
            </div>
            <div className="p-2.5 bg-slate-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg text-center">
              <span className="text-[8px] font-bold text-zinc-400 uppercase block mb-1">Complaint Tickets</span>
              <strong className="text-sm font-extrabold text-rose-500">{history.complaints.length}</strong>
            </div>
          </div>

          {/* Recent feedback list */}
          <div className="space-y-2">
            <h5 className="font-extrabold text-[10px] uppercase text-zinc-900 dark:text-white tracking-wider">Recent Reviews Logs</h5>
            <div className="max-h-48 overflow-y-auto space-y-2 border border-zinc-150 dark:border-zinc-850 p-2.5 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50 scrollbar-thin">
              {history.reviews.length > 0 ? (
                history.reviews.map(r => (
                  <div key={r._id} className="p-2 bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-md">
                    <div className="flex justify-between items-center text-[9px] mb-1 font-bold">
                      <span className="text-amber-500">{r.rating}★</span>
                      <span className="text-zinc-400">{formatDateTime(r.createdAt || r.date)}</span>
                    </div>
                    <p className="text-[10px] text-zinc-650 dark:text-zinc-350 italic">"{r.reviewText || 'No text review'}"</p>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-zinc-400 italic">No feedback entries.</div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-zinc-100 dark:border-zinc-850">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 font-extrabold uppercase rounded-lg cursor-pointer"
            >
              Close History
            </button>
          </div>

        </div>
      ) : (
        <div className="text-center py-6 text-zinc-400">Loading customer history profile...</div>
      )}
    </DialogWrapper>
  );
}

// 7. EXPORT REVIEWS MODAL
export function ExportReviewsModal({ isOpen, onClose, onExport }) {
  const [formData, setFormData] = useState({
    format: "CSV",
    storeId: "All",
    rating: "All",
    replyStatus: "All",
    dateRange: { start: "", end: "" }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport(formData.format, {
      storeId: formData.storeId,
      rating: formData.rating,
      replyStatus: formData.replyStatus,
      dateRange: formData.dateRange
    });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Export Reviews Database">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Export Format
          </label>
          <div className="grid grid-cols-3 gap-2">
            {["CSV", "Excel", "PDF"].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, format: f }))}
                className={`py-2 rounded-lg border text-center text-xs font-bold transition-all cursor-pointer ${
                  formData.format === f
                    ? "bg-zinc-800 text-white border-zinc-850 dark:bg-zinc-200 dark:text-zinc-900 dark:border-zinc-200"
                    : "bg-white border-zinc-250 hover:bg-zinc-55 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Filter by Store
          </label>
          <select
            value={formData.storeId}
            onChange={(e) => setFormData(prev => ({ ...prev, storeId: e.target.value }))}
            className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
          >
            <option value="All">All Store Branches</option>
            {mockStores.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Filter Rating
            </label>
            <select
              value={formData.rating}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            >
              <option value="All">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
              Reply Status
            </label>
            <select
              value={formData.replyStatus}
              onChange={(e) => setFormData(prev => ({ ...prev, replyStatus: e.target.value }))}
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] outline-hidden text-zinc-850 dark:text-zinc-150"
            >
              <option value="All">All statuses</option>
              <option value="Replied">Replied</option>
              <option value="Awaiting Reply">Awaiting Reply</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-450 dark:text-zinc-400 mb-1">
            Custom Date Created Range
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[9px] text-zinc-450 font-bold uppercase block mb-0.5">From</span>
              <input
                type="date"
                value={formData.dateRange.start}
                onChange={(e) => setFormData(prev => ({ ...prev, dateRange: { ...prev.dateRange, start: e.target.value } }))}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-150"
              />
            </div>
            <div>
              <span className="text-[9px] text-zinc-450 font-bold uppercase block mb-0.5">To</span>
              <input
                type="date"
                value={formData.dateRange.end}
                onChange={(e) => setFormData(prev => ({ ...prev, dateRange: { ...prev.dateRange, end: e.target.value } }))}
                className="w-full px-2 py-1.5 bg-white dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg text-xs focus:ring-1 focus:ring-[var(--primary)] text-zinc-850 dark:text-zinc-150"
              />
            </div>
          </div>
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
            Export Now
          </button>
        </div>

      </form>
    </DialogWrapper>
  );
}
