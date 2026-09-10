import React, { useState, useEffect } from "react";
import { X, Check, MapPin, Phone } from "lucide-react";
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

// 1. ADD ADDRESS MODAL
export function AddAddressModal({ isOpen, onClose, customerId, onAdd }) {
  const [formData, setFormData] = useState({
    addressType: "Home",
    recipientName: "",
    phone: "",
    houseNumber: "",
    street: "",
    city: "Indore",
    state: "Madhya Pradesh",
    pincode: "",
    landmark: "",
    latitude: "22.75",
    longitude: "75.89",
    isDefault: false
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd(customerId, formData);
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Add Customer Address">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Address Label</label>
            <select
              value={formData.addressType}
              onChange={e => setFormData({ ...formData, addressType: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            >
              <option value="Home">Home</option>
              <option value="Office">Office</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Recipient Name</label>
            <input
              type="text"
              required
              placeholder="Full Name"
              value={formData.recipientName}
              onChange={e => setFormData({ ...formData, recipientName: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Recipient Mobile</label>
            <input
              type="text"
              required
              placeholder="e.g. +91 9988776655"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Flat / House / Block No</label>
            <input
              type="text"
              required
              placeholder="e.g. Flat 301, Tower C"
              value={formData.houseNumber}
              onChange={e => setFormData({ ...formData, houseNumber: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Street Address</label>
          <input
            type="text"
            required
            placeholder="e.g. Shalimar Enclave, Vijay Nagar"
            value={formData.street}
            onChange={e => setFormData({ ...formData, street: e.target.value })}
            className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">City</label>
            <input
              type="text"
              required
              value={formData.city}
              onChange={e => setFormData({ ...formData, city: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-850 dark:text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">State</label>
            <input
              type="text"
              required
              value={formData.state}
              onChange={e => setFormData({ ...formData, state: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-850 dark:text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Pincode</label>
            <input
              type="text"
              required
              placeholder="e.g. 452010"
              value={formData.pincode}
              onChange={e => setFormData({ ...formData, pincode: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-850 dark:text-zinc-200"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Landmark</label>
            <input
              type="text"
              placeholder="Optional"
              value={formData.landmark}
              onChange={e => setFormData({ ...formData, landmark: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-850 dark:text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Latitude</label>
            <input
              type="text"
              value={formData.latitude}
              onChange={e => setFormData({ ...formData, latitude: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-850 dark:text-zinc-200"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Longitude</label>
            <input
              type="text"
              value={formData.longitude}
              onChange={e => setFormData({ ...formData, longitude: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-850 dark:text-zinc-200"
            />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 bg-zinc-50 dark:bg-zinc-950/40 rounded-xl border border-zinc-150 dark:border-zinc-850">
          <div>
            <p className="font-bold text-zinc-800 dark:text-zinc-250">Set as default Address</p>
            <p className="text-[10px] text-zinc-400 font-medium">Makes this the active shipping point</p>
          </div>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, isDefault: !formData.isDefault })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.isDefault ? "bg-[var(--primary)]" : "bg-zinc-300 dark:bg-zinc-700"}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isDefault ? "translate-x-6" : "translate-x-1"}`} />
          </button>
        </div>

        <div className="flex gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-lg transition-all"
          >
            Save Address
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 2. ADJUST POINTS MODAL
export function AdjustPointsModal({ isOpen, onClose, customerId, onAdjust }) {
  const [formData, setFormData] = useState({
    points: "",
    type: "Credit",
    reason: "Late Delivery Compensation",
    remarks: ""
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onAdjust(customerId, formData);
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Adjust Loyalty Balance">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Points Amount</label>
            <input
              type="number"
              required
              min={1}
              value={formData.points}
              onChange={e => setFormData({ ...formData, points: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
              placeholder="e.g. 100"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Adjustment Type</label>
            <select
              value={formData.type}
              onChange={e => setFormData({ ...formData, type: e.target.value })}
              className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
            >
              <option value="Credit">Credit (Add)</option>
              <option value="Debit">Debit (Subtract)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Reason Category</label>
          <select
            value={formData.reason}
            onChange={e => setFormData({ ...formData, reason: e.target.value })}
            className="w-full p-2.5 bg-zinc-55 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs outline-none text-zinc-800 dark:text-zinc-200"
          >
            <option value="Late Delivery Compensation">Late Delivery Compensation</option>
            <option value="Wrong Item Refund Compensation">Wrong Item Refund Compensation</option>
            <option value="Loyalty Onboarding Bonus">Loyalty Onboarding Bonus</option>
            <option value="App System Glitch Fix">App System Glitch Fix</option>
            <option value="Others">Others</option>
          </select>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase text-zinc-400 mb-1">Admin Remarks</label>
          <textarea
            required
            rows={3}
            placeholder="Add internal remarks about this points adjustment..."
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
            className="flex-1 py-2 bg-[var(--primary)] hover:opacity-90 text-white font-bold rounded-lg transition-all"
          >
            Confirm Adjustment
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 3. ORDER DETAILS MODAL
export function OrderDetailsModal({ isOpen, onClose, order }) {
  if (!order) return null;
  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title={`Order Details: ${order.orderNumber}`} maxWidth="max-w-2xl">
      <div className="space-y-4">
        {/* Order Summary Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-3 rounded-xl">
          <div>
            <p className="text-[10px] font-bold text-zinc-450 uppercase">Outlet Store</p>
            <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{order.storeName}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-450 uppercase">Date & Time</p>
            <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{formatDateTime(order.date)}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-450 uppercase">Order Status</p>
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700 dark:bg-green-950/20 dark:text-green-400 capitalize mt-1">
              {order.orderStatus}
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-450 uppercase">Delivery Type</p>
            <p className="font-bold text-zinc-800 dark:text-zinc-200 capitalize mt-0.5">{order.deliveryType}</p>
          </div>
        </div>

        {/* Products Table */}
        <div>
          <p className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-2">Item Breakdown</p>
          <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-950/50 border-b border-zinc-150 dark:border-zinc-800">
                <tr className="text-left text-[9px] uppercase tracking-wider font-bold text-zinc-450">
                  <th className="px-4 py-2">Product Name</th>
                  <th className="px-4 py-2 text-center">Qty</th>
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {order.items?.map((item, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-950/10">
                    <td className="px-4 py-2 font-bold text-zinc-800 dark:text-zinc-200">{item.name}</td>
                    <td className="px-4 py-2 text-center font-semibold">{item.quantity}</td>
                    <td className="px-4 py-2 text-right font-medium">₹{item.price}</td>
                    <td className="px-4 py-2 text-right font-bold text-zinc-800 dark:text-zinc-200">₹{item.price * item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Taxes & Bill summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Delivery Address */}
          <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-xl text-[11px]">
            <p className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200 mb-2">Shipping Information</p>
            {order.deliveryAddress ? (
              <div className="space-y-1 text-zinc-600 dark:text-zinc-455">
                <p className="font-bold text-zinc-900 dark:text-white">{order.deliveryAddress.recipientName}</p>
                <p className="flex items-center gap-1"><Phone size={12} /> {order.deliveryAddress.phone}</p>
                <p className="flex items-start gap-1">
                  <MapPin size={12} className="mt-0.5 shrink-0" />
                  <span>
                    {order.deliveryAddress.houseNo}, {order.deliveryAddress.street}, {order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}
                    {order.deliveryAddress.landmark && ` (Landmark: ${order.deliveryAddress.landmark})`}
                  </span>
                </p>
              </div>
            ) : (
              <p className="text-zinc-400 italic">Self Pickup/Takeaway Order</p>
            )}
          </div>

          {/* Pricing summary */}
          <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
            <p className="font-extrabold uppercase text-[10px] tracking-wider text-zinc-800 dark:text-zinc-200 mb-2">Payment breakdown</p>
            <div className="space-y-1.5 font-medium">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{(order.items?.reduce((sum, item) => sum + (item.price * item.quantity), 0) || 0)}</span>
              </div>
              <div className="flex justify-between text-zinc-500">
                <span>Taxes & GST</span>
                <span>+₹{order.taxes}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>Discount {order.coupon && `(${order.coupon})`}</span>
                  <span>-₹{order.discount}</span>
                </div>
              )}
              <div className="flex justify-between font-black text-sm text-zinc-900 dark:text-white border-t border-zinc-150 dark:border-zinc-800 pt-1.5">
                <span>Grand Total</span>
                <span>₹{order.amount}</span>
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <p className="text-[10px] font-bold text-zinc-450 uppercase">Gateway Channel</p>
              <p className="font-bold text-zinc-800 dark:text-zinc-200 mt-0.5">{order.paymentMethod}</p>
              <p className="text-[9px] text-zinc-400 mt-0.5">TXN ID: {order.paymentDetails?.transactionId} ({order.paymentDetails?.status})</p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <p className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-2">Order Activity Timeline</p>
          <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-zinc-100 dark:before:bg-zinc-800">
            {order.timeline?.map((step, idx) => (
              <div key={idx} className="flex gap-4 relative z-10">
                <div className="w-4 h-4 rounded-full border border-white dark:border-zinc-900 bg-emerald-500 flex items-center justify-center shadow-xs mt-0.5">
                  <Check size={9} className="text-white stroke-[3px]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">{step.status}</p>
                    <span className="text-[9px] text-zinc-400 font-medium">{formatDateTime(step.time)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-450 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DialogWrapper>
  );
}

// 4. COMPLAINT DETAILS MODAL
export function ComplaintDetailsModal({ isOpen, onClose, complaint }) {
  if (!complaint) return null;
  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title={`Complaint details: ${complaint.complaintNumber}`}>
      <div className="space-y-4">
        {/* Ticket Header */}
        <div className="grid grid-cols-2 gap-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 p-3 rounded-xl">
          <div>
            <p className="text-[10px] font-bold text-zinc-450 uppercase">Category</p>
            <p className="font-bold text-zinc-805 dark:text-zinc-205 mt-0.5">{complaint.category}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-450 uppercase">Priority Status</p>
            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold mt-1 ${complaint.priority === "High" ? "bg-rose-100 text-rose-700 dark:bg-rose-950/25 dark:text-rose-400" : "bg-amber-100 text-amber-700 dark:bg-amber-950/25 dark:text-amber-400"}`}>
              {complaint.priority} Priority
            </span>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-450 uppercase">Assigned Staff</p>
            <p className="font-semibold text-zinc-700 dark:text-zinc-300 mt-0.5">{complaint.assignedTo}</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-450 uppercase">Complaint Date</p>
            <p className="font-semibold text-zinc-750 dark:text-zinc-350 mt-0.5">{formatDateTime(complaint.createdDate)}</p>
          </div>
        </div>

        {/* Message */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-150 dark:border-zinc-850 rounded-xl">
          <p className="text-[10px] font-bold text-zinc-450 uppercase mb-1">Customer Message</p>
          <p className="font-semibold text-zinc-800 dark:text-zinc-200 italic">"{complaint.message}"</p>
        </div>

        {/* Notes */}
        {complaint.resolutionNotes && (
          <div className="p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 text-[11px]">
            <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1">Resolution Notes</p>
            <p className="font-semibold text-zinc-700 dark:text-zinc-300">{complaint.resolutionNotes}</p>
          </div>
        )}

        {/* Timeline */}
        <div>
          <p className="font-extrabold text-[11px] uppercase tracking-wider text-zinc-800 dark:text-zinc-200 mb-2">Complaint Status Log</p>
          <div className="space-y-3 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-zinc-100 dark:before:bg-zinc-800">
            {complaint.timeline?.map((step, idx) => (
              <div key={idx} className="flex gap-4 relative z-10">
                <div className={`w-4 h-4 rounded-full border border-white dark:border-zinc-900 flex items-center justify-center shadow-xs mt-0.5 ${complaint.status === "Resolved" && idx === complaint.timeline.length - 1 ? "bg-emerald-500" : "bg-amber-500"}`}>
                  <Check size={9} className="text-white stroke-[3px]" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-bold text-zinc-800 dark:text-zinc-200">{step.title}</p>
                    <span className="text-[9px] text-zinc-400 font-medium">{formatDateTime(step.time)}</span>
                  </div>
                  <p className="text-[10px] text-zinc-450 mt-0.5">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:opacity-90 text-zinc-800 dark:text-zinc-200 font-bold rounded-lg transition-all"
          >
            Close Dialog
          </button>
        </div>
      </div>
    </DialogWrapper>
  );
}
