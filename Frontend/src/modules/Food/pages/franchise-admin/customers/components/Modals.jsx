import React, { useState, useEffect } from "react";
import { X, Check, ShieldAlert, FileText, ShieldCheck } from "lucide-react";
import { mockStores } from "../mockData";

// Helper to format date nicely
const formatDateTime = (value) => {
  if (!value) return "-";
  try {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
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

// Modal Wrapper for premium design consistency
function DialogWrapper({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      {/* Panel */}
      <div className={`relative w-full ${maxWidth} bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-150 dark:border-zinc-800 overflow-hidden transform transition-all animate-fade-down duration-200 z-10 max-h-[90vh] flex flex-col`}>
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
          <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            {title}
          </h3>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
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

// 1. EDIT CUSTOMER MODAL
export function EditCustomerModal({ isOpen, onClose, customer, onSave }) {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    customerType: "Regular",
    tags: "",
    favoriteStoreId: "store-01",
    isVerified: true
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        fullName: customer.fullName || "",
        email: customer.email || "",
        mobile: customer.mobile || "",
        customerType: customer.customerType || "Regular",
        tags: customer.tags ? customer.tags.join(", ") : "",
        favoriteStoreId: customer.favoriteStoreId || "store-01",
        isVerified: customer.isVerified !== undefined ? customer.isVerified : true
      });
    }
  }, [customer]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const tagArray = formData.tags
      ? formData.tags.split(",").map(t => t.trim()).filter(Boolean)
      : [];
    onSave(customer._id, {
      ...formData,
      tags: tagArray
    });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Edit Customer Details">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Full Name</label>
          <input
            type="text"
            required
            value={formData.fullName}
            onChange={e => setFormData({ ...formData, fullName: e.target.value })}
            className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Mobile Number</label>
            <input
              type="text"
              required
              value={formData.mobile}
              onChange={e => setFormData({ ...formData, mobile: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Customer Type</label>
            <select
              value={formData.customerType}
              onChange={e => setFormData({ ...formData, customerType: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            >
              <option value="New">New</option>
              <option value="Regular">Regular</option>
              <option value="VIP">VIP</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Favorite Store</label>
            <select
              value={formData.favoriteStoreId}
              onChange={e => setFormData({ ...formData, favoriteStoreId: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            >
              {mockStores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Tags (comma separated)</label>
          <input
            type="text"
            placeholder="e.g. Cheese Lover, Spicy Fan"
            value={formData.tags}
            onChange={e => setFormData({ ...formData, tags: e.target.value })}
            className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
          />
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-850">
          <div>
            <p className="font-bold text-zinc-800 dark:text-zinc-250">Verify Account Status</p>
            <p className="text-[10px] text-zinc-400">Verifies customer credentials on database</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isVerified: !formData.isVerified })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isVerified ? "bg-[var(--primary)]" : "bg-zinc-300 dark:bg-zinc-700"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isVerified ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-305 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-lg transition-all"
          >
            Save Changes
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 2. BLOCK CUSTOMER MODAL
export function BlockCustomerModal({ isOpen, onClose, customer, onBlock }) {
  const [formData, setFormData] = useState({
    reason: "Spam",
    blockUntil: "",
    permanent: false,
    notify: true,
    remarks: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onBlock(customer._id, formData);
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Block Customer Access">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-rose-500/10 text-rose-600 dark:text-rose-400">
          <ShieldAlert size={28} className="shrink-0 animate-pulse" />
          <div>
            <p className="font-bold">Restricting: {customer?.fullName}</p>
            <p className="text-[10px] opacity-80">This will suspend this user's active ordering access instantly.</p>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Block Reason</label>
          <select
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
            className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
          >
            <option value="Spam">Spam Activity</option>
            <option value="Fake Orders">Fake Orders / Rejection</option>
            <option value="Payment Fraud">Payment Fraud / Chargeback</option>
            <option value="Abusive Behavior">Abusive Behavior</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-850">
          <div>
            <p className="font-bold text-zinc-800 dark:text-zinc-250">Permanent Suspension</p>
            <p className="text-[10px] text-zinc-400">Suspends account indefinitely</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, permanent: !formData.permanent })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.permanent ? "bg-rose-500" : "bg-zinc-300 dark:bg-zinc-700"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.permanent ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        {!formData.permanent && (
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Block Until Date</label>
            <input
              type="date"
              required
              value={formData.blockUntil}
              onChange={e => setFormData({ ...formData, blockUntil: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            />
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-850">
          <div>
            <p className="font-bold text-zinc-800 dark:text-zinc-250">Notify Customer</p>
            <p className="text-[10px] text-zinc-450">Triggers Email & SMS Notification Alerts</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, notify: !formData.notify })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.notify ? "bg-[var(--primary)]" : "bg-zinc-300 dark:bg-zinc-700"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.notify ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Additional Remarks</label>
          <textarea
            required
            rows={3}
            placeholder="Add internal remarks about this block..."
            value={formData.remarks}
            onChange={e => setFormData({ ...formData, remarks: e.target.value })}
            className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-305 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-lg transition-all"
          >
            Confirm suspension
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 3. UNBLOCK CUSTOMER MODAL
export function UnblockCustomerModal({ isOpen, onClose, customer, onUnblock }) {
  const [remarks, setRemarks] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onUnblock(customer._id, { remarks });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Reactivate Customer Profile">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center gap-3 p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-emerald-600 dark:text-emerald-400">
          <ShieldCheck size={28} className="shrink-0" />
          <div>
            <p className="font-bold">Reactivating: {customer?.fullName}</p>
            <p className="text-[10px] opacity-80">This restores standard app privileges & ordering routes instantly.</p>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Remarks for Reactivation</label>
          <textarea
            required
            rows={3}
            placeholder="e.g. Issues resolved with client. Reactivating..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-305 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all"
          >
            Confirm Reactivation
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 4. EXPORT CUSTOMERS MODAL
export function ExportCustomersModal({ isOpen, onClose, onExport }) {
  const [formData, setFormData] = useState({
    format: "CSV",
    customerType: "All",
    status: "All",
    dateRange: { start: "", end: "" }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport(formData.format, {
      customerType: formData.customerType,
      status: formData.status,
      dateRange: formData.dateRange.start && formData.dateRange.end ? formData.dateRange : null
    });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Export Customers Database">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Export Format</label>
          <div className="grid grid-cols-3 gap-2">
            {["CSV", "Excel", "PDF"].map(fmt => (
              <button
                key={fmt}
                type="button"
                onClick={() => setFormData({ ...formData, format: fmt })}
                className={`py-2 text-xs font-bold rounded-lg border transition-all ${formData.format === fmt ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]" : "border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-650 dark:text-zinc-450"}`}
              >
                {fmt}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Customer Type Filter</label>
            <select
              value={formData.customerType}
              onChange={e => setFormData({ ...formData, customerType: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            >
              <option value="All">All Types</option>
              <option value="New">New Only</option>
              <option value="Regular">Regular Only</option>
              <option value="VIP">VIP Only</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Status Filter</label>
            <select
              value={formData.status}
              onChange={e => setFormData({ ...formData, status: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            >
              <option value="All">All Statuses</option>
              <option value="Active">Active Only</option>
              <option value="Blocked">Blocked Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Joining Date Range (Optional)</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={formData.dateRange.start}
              onChange={e => setFormData({ ...formData, dateRange: { ...formData.dateRange, start: e.target.value } })}
              className="w-full p-2 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-850 dark:text-zinc-200"
            />
            <input
              type="date"
              value={formData.dateRange.end}
              onChange={e => setFormData({ ...formData, dateRange: { ...formData.dateRange, end: e.target.value } })}
              className="w-full p-2 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-850 dark:text-zinc-200"
            />
          </div>
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-305 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-lg transition-all flex items-center justify-center gap-1.5"
          >
            <FileText size={14} />
            Generate & Download
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 5. ADD NOTE MODAL
export function AddNoteModal({ isOpen, onClose, customerId, onAdd }) {
  const [note, setNote] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(customerId, note);
    setNote("");
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Add Internal Admin Note">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Internal Remarks</label>
          <textarea
            required
            rows={4}
            placeholder="Write internal team notes about customer behaviour or requirements..."
            value={note}
            onChange={e => setNote(e.target.value)}
            className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-805 dark:text-zinc-200 resize-none"
          />
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-305 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-lg transition-all"
          >
            Save Note
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}
