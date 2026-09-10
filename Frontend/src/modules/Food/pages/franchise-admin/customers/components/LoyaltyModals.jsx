import React, { useState, useEffect } from "react";
import { X, AlertTriangle, Download, Info, Check, Search } from "lucide-react";

// Reusable Modal Wrapper Component
function DialogWrapper({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-semibold text-xs select-none">
      <div className="absolute inset-0 bg-black/45 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl overflow-hidden animate-scale-up text-zinc-700 dark:text-zinc-300">
        <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
          <h3 className="font-extrabold uppercase text-[10px] text-zinc-900 dark:text-white tracking-wider">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
            <X size={14} />
          </button>
        </header>
        <div className="p-4 max-h-[75vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// 1. Enroll Member Modal
export function EnrollMemberModal({ isOpen, onClose, onSubmit }) {
  const [customerId, setCustomerId] = useState("");
  const [initialTier, setInitialTier] = useState("Bronze");
  const [initialPoints, setInitialPoints] = useState(0);
  const [expiryDate, setExpiryDate] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  // States to hold customers eligible for enrollment
  const [eligibleCustomers, setEligibleCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch customers and users from localStorage
      const customersList = JSON.parse(localStorage.getItem("pv_customers") || "[]");
      const usersList = JSON.parse(localStorage.getItem("pv_users") || "[]");
      const loyaltyMembers = JSON.parse(localStorage.getItem("pv_loyalty_members") || "[]");

      // Filter out customers already enrolled in loyalty program
      const enrolledCustomerIds = new Set(loyaltyMembers.map(m => m.customerId));
      
      const eligible = customersList
        .filter(c => !enrolledCustomerIds.has(c._id))
        .map(c => {
          const u = usersList.find(user => user._id === c.userId) || {};
          return {
            customerId: c._id,
            name: u.fullName || "Guest Customer",
            phone: u.mobile || "N/A"
          };
        });

      setEligibleCustomers(eligible);
      setCustomerId("");
      setInitialTier("Bronze");
      setInitialPoints(0);
      
      // Default expiry date: 1 year from now
      const oneYear = new Date();
      oneYear.setFullYear(oneYear.getFullYear() + 1);
      setExpiryDate(oneYear.toISOString().split("T")[0]);
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!customerId) {
      alert("Please select a customer to enroll.");
      return;
    }
    const success = onSubmit({
      customerId,
      initialTier,
      initialPoints,
      expiryDate,
      notifyCustomer
    });
    if (success) onClose();
  };

  const filteredEligible = eligibleCustomers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Enroll Loyalty Member">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Customer Search & Select */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Search & Select Customer *</label>
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
            <input
              type="text"
              placeholder="Filter customer name or phone..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-8 pr-3 py-1.5 w-full text-[11px] border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-150 rounded-lg outline-none"
            />
          </div>
          
          <select
            value={customerId}
            onChange={e => setCustomerId(e.target.value)}
            className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-750 dark:text-zinc-250 rounded-lg focus:outline-none focus:border-[var(--primary)] text-xs cursor-pointer font-semibold"
            required
          >
            <option value="">-- Choose Customer ({filteredEligible.length} available) --</option>
            {filteredEligible.map(c => (
              <option key={c.customerId} value={c.customerId}>
                {c.name} ({c.phone})
              </option>
            ))}
          </select>
        </div>

        {/* Initial Tier */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Initial Membership Tier</label>
          <select
            value={initialTier}
            onChange={e => setInitialTier(e.target.value)}
            className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-750 dark:text-zinc-250 rounded-lg focus:outline-none focus:border-[var(--primary)] text-xs cursor-pointer font-semibold"
          >
            <option value="Bronze">Bronze (0 Pts)</option>
            <option value="Silver">Silver (1000 Pts)</option>
            <option value="Gold">Gold (3000 Pts)</option>
            <option value="Platinum">Platinum (5000 Pts)</option>
          </select>
        </div>

        {/* Initial Points */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Initial Points Balance</label>
          <input
            type="number"
            min={0}
            value={initialPoints}
            onChange={e => setInitialPoints(Number(e.target.value))}
            className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-150 rounded-lg outline-none font-bold"
          />
        </div>

        {/* Expiry Date */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Membership Expiry Date</label>
          <input
            type="date"
            value={expiryDate}
            onChange={e => setExpiryDate(e.target.value)}
            className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-150 rounded-lg outline-none font-semibold"
            required
          />
        </div>

        {/* Notification Checkbox */}
        <div className="flex items-center gap-2 pt-1 font-semibold text-zinc-550 dark:text-zinc-400">
          <input
            type="checkbox"
            id="notifyEnroll"
            checked={notifyCustomer}
            onChange={e => setNotifyCustomer(e.target.checked)}
            className="rounded border-zinc-300 text-[var(--primary)] outline-none"
          />
          <label htmlFor="notifyEnroll" className="cursor-pointer">Notify customer via Email & SMS</label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg font-bold text-zinc-550 dark:text-zinc-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-95 rounded-lg shadow-sm font-bold uppercase tracking-wider text-[10px] cursor-pointer"
          >
            Create Membership
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 2. Adjust Points Modal
export function AdjustPointsModal({ isOpen, onClose, member, onSubmit }) {
  const [adjustmentType, setAdjustmentType] = useState("Add Points");
  const [points, setPoints] = useState(100);
  const [reason, setReason] = useState("Loyalty Bonus");
  const [remarks, setRemarks] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [sendEmail, setSendEmail] = useState(true);
  const [sendPush, setSendPush] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setAdjustmentType("Add Points");
      setPoints(100);
      setReason("Loyalty Bonus");
      setRemarks("");
      setNotifyCustomer(true);
      setSendEmail(true);
      setSendPush(false);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (points <= 0) {
      alert("Points must be greater than zero.");
      return;
    }
    const success = onSubmit(member._id, {
      adjustmentType,
      points,
      reason,
      remarks,
      notifyCustomer,
      sendEmail,
      sendPush
    });
    if (success) onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title={`Adjust Points - ${member?.customerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Adjustment Type */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Adjustment Type</label>
          <div className="grid grid-cols-2 gap-2">
            {["Add Points", "Deduct Points"].map(type => (
              <button
                key={type}
                type="button"
                onClick={() => setAdjustmentType(type)}
                className={`py-2 text-[10px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer ${
                  adjustmentType === type
                    ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)]"
                    : "border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-zinc-500"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Current Available Points Display */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg flex items-center justify-between">
          <span className="font-bold text-zinc-500">Current Balance:</span>
          <span className="font-black text-amber-500">{member?.availablePoints || 0} Points</span>
        </div>

        {/* Points input */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Points *</label>
          <input
            type="number"
            min={1}
            value={points}
            onChange={e => setPoints(Number(e.target.value))}
            className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-150 rounded-lg outline-none font-bold"
            required
          />
        </div>

        {/* Reason category */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Reason Category</label>
          <select
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-750 dark:text-zinc-250 rounded-lg focus:outline-none focus:border-[var(--primary)] text-xs cursor-pointer font-semibold"
          >
            <option value="Loyalty Bonus">Loyalty Promo Bonus</option>
            <option value="Order Return Correction">Order Return Deduction</option>
            <option value="Customer Goodwill Adjust">Goodwill Points Adjust</option>
            <option value="System Error Recovery">System Glitch Recovery</option>
            <option value="Other">Other (Specify in Remarks)</option>
          </select>
        </div>

        {/* Remarks */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Admin Remarks</label>
          <textarea
            placeholder="Type detailed remarks..."
            value={remarks}
            onChange={e => setRemarks(e.target.value)}
            className="p-2 w-full h-16 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-105 rounded-lg outline-none font-semibold resize-none"
          />
        </div>

        {/* Notify Toggles */}
        <div className="space-y-1.5 border-t border-zinc-100 dark:border-zinc-850 pt-2.5">
          <span className="block text-[9px] font-extrabold uppercase text-zinc-400">Channel Notifications</span>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-zinc-550 dark:text-zinc-400">
              <input
                type="checkbox"
                id="notifyAdjust"
                checked={notifyCustomer}
                onChange={e => setNotifyCustomer(e.target.checked)}
                className="rounded text-[var(--primary)] outline-none"
              />
              <label htmlFor="notifyAdjust" className="cursor-pointer">Notify customer about this adjust</label>
            </div>

            {notifyCustomer && (
              <div className="pl-4 flex gap-4 text-[10px] text-zinc-450 font-bold animate-fade-down">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={e => setSendEmail(e.target.checked)}
                    className="rounded text-[var(--primary)] outline-none"
                  />
                  <span>Send Email</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendPush}
                    onChange={e => setSendPush(e.target.checked)}
                    className="rounded text-[var(--primary)] outline-none"
                  />
                  <span>Send Push Notice</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg font-bold text-zinc-550 dark:text-zinc-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-95 rounded-lg shadow-sm font-bold uppercase tracking-wider text-[10px] cursor-pointer"
          >
            Save Adjustment
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 3. Upgrade Tier Modal
export function UpgradeTierModal({ isOpen, onClose, member, onSubmit }) {
  const [newTier, setNewTier] = useState("Bronze");
  const [reason, setReason] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  useEffect(() => {
    if (isOpen && member) {
      setNewTier(member.tier);
      setReason("");
      setNotifyCustomer(true);
    }
  }, [isOpen, member]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newTier === member.tier) {
      alert("Please select a tier different from the current tier.");
      return;
    }
    const success = onSubmit(member._id, { newTier, reason, notifyCustomer });
    if (success) onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title={`Upgrade Tier - ${member?.customerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Current Tier Display */}
        <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg flex items-center justify-between">
          <span className="font-bold text-zinc-500">Current Membership Tier:</span>
          <span className="font-black text-purple-600 dark:text-purple-400 uppercase">{member?.tier}</span>
        </div>

        {/* New Tier Selection */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Select New Tier *</label>
          <select
            value={newTier}
            onChange={e => setNewTier(e.target.value)}
            className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-750 dark:text-zinc-250 rounded-lg focus:outline-none focus:border-[var(--primary)] text-xs cursor-pointer font-semibold"
            required
          >
            <option value="Bronze">Bronze (Entry Level)</option>
            <option value="Silver">Silver (1,000+ points spent)</option>
            <option value="Gold">Gold (3,000+ points spent)</option>
            <option value="Platinum">Platinum (5,000+ points spent)</option>
          </select>
        </div>

        {/* Reason for Upgrade */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Reason for Tier Adjustment *</label>
          <textarea
            placeholder="Type reason (e.g. Completed manual reviews upgrade, high spend custom override)..."
            value={reason}
            onChange={e => setReason(e.target.value)}
            className="p-2 w-full h-16 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-105 rounded-lg outline-none font-semibold resize-none"
            required
          />
        </div>

        {/* Notification toggle */}
        <div className="flex items-center gap-2 font-semibold text-zinc-550 dark:text-zinc-400">
          <input
            type="checkbox"
            id="notifyUpgrade"
            checked={notifyCustomer}
            onChange={e => setNotifyCustomer(e.target.checked)}
            className="rounded text-[var(--primary)] outline-none"
          />
          <label htmlFor="notifyUpgrade" className="cursor-pointer">Notify customer about tier promotion</label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-855">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-855 rounded-lg font-bold text-zinc-555 dark:text-zinc-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-95 rounded-lg shadow-sm font-bold uppercase tracking-wider text-[10px] cursor-pointer"
          >
            Upgrade Tier
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 4. Suspend Member Modal
export function SuspendMemberModal({ isOpen, onClose, member, onSubmit }) {
  const [reason, setReason] = useState("");
  const [suspensionUntil, setSuspensionUntil] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setReason("Abusive points accumulation");
      setSuspensionUntil("");
      setRemarks("");
      setNotifyCustomer(true);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const success = onSubmit(member._id, { reason, suspensionUntil, remarks, notifyCustomer });
    if (success) onClose();
  };

  const isSuspended = member?.status === "Suspended";

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title={isSuspended ? `Reactivate Member - ${member?.customerName}` : `Suspend Member - ${member?.customerName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {isSuspended ? (
          <div className="space-y-3">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg flex items-start gap-2">
              <Info size={14} className="shrink-0 mt-0.5" />
              <p className="font-semibold text-xs leading-relaxed">
                Confirming reactivation will restore the membership status to **Active**, allowing the customer to accumulate and redeem points on their orders.
              </p>
            </div>
            
            <div className="space-y-1.5">
              <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Reactivation Audit Reason *</label>
              <textarea
                placeholder="Type explanation for reactivating..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="p-2 w-full h-16 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-105 rounded-lg outline-none font-semibold resize-none"
                required
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 rounded-lg flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <p className="font-semibold text-xs leading-relaxed">
                Suspending this loyalty membership will block points collection, tier progression, and reward coupon redemptions for this account.
              </p>
            </div>

            {/* Suspension Reason Category */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Reason Category *</label>
              <select
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-750 dark:text-zinc-250 rounded-lg focus:outline-none focus:border-[var(--primary)] text-xs cursor-pointer font-semibold"
                required
              >
                <option value="Abusive points accumulation">Abusive points accumulation / Exploit</option>
                <option value="Suspicious multiple orders activity">Suspicious multiple order spam</option>
                <option value="Customer request">Voluntary customer suspend request</option>
                <option value="Terms Violation">Violated standard loyalty guidelines</option>
              </select>
            </div>

            {/* Suspend Until Date */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Suspend Until (Optional)</label>
              <input
                type="date"
                value={suspensionUntil}
                onChange={e => setSuspensionUntil(e.target.value)}
                className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-150 rounded-lg outline-none font-semibold"
              />
              <span className="text-[8px] text-zinc-400 block font-bold">Leave empty for indefinite suspension.</span>
            </div>

            {/* Remarks */}
            <div className="space-y-1.5">
              <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Additional Remarks</label>
              <textarea
                placeholder="Type additional remarks..."
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                className="p-2 w-full h-16 border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-105 rounded-lg outline-none font-semibold resize-none"
              />
            </div>
          </div>
        )}

        {/* Notification toggle */}
        <div className="flex items-center gap-2 font-semibold text-zinc-550 dark:text-zinc-400">
          <input
            type="checkbox"
            id="notifySuspend"
            checked={notifyCustomer}
            onChange={e => setNotifyCustomer(e.target.checked)}
            className="rounded text-[var(--primary)] outline-none"
          />
          <label htmlFor="notifySuspend" className="cursor-pointer">Notify customer of account status modification</label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg font-bold text-zinc-555 dark:text-zinc-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-4 py-2 text-white hover:opacity-95 rounded-lg shadow-sm font-bold uppercase tracking-wider text-[10px] cursor-pointer ${
              isSuspended ? "bg-emerald-600" : "bg-rose-600"
            }`}
          >
            {isSuspended ? "Reactivate Member" : "Suspend Member"}
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}

// 5. Transaction Details Modal
export function TransactionDetailsModal({ isOpen, onClose, transaction }) {
  if (!transaction) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Transaction Ledger Detail">
      <div className="space-y-4">
        
        {/* Points Display Header */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg flex flex-col items-center justify-center space-y-1">
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Points Ledger Modification</span>
          <span className={`text-2xl font-black ${transaction.points > 0 ? "text-emerald-500" : "text-rose-500"}`}>
            {transaction.points > 0 ? `+${transaction.points}` : transaction.points} Pts
          </span>
          <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
            transaction.transactionType === "Earn"
              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
              : transaction.transactionType === "Redeem"
              ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
              : transaction.transactionType === "Expire"
              ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
              : "bg-amber-500/10 text-amber-600 border-amber-500/20"
          }`}>
            {transaction.transactionType}
          </span>
        </div>

        {/* Ledger Details List */}
        <div className="space-y-2.5 text-[11px]">
          <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-850">
            <span className="text-zinc-450">Transaction ID</span>
            <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">{transaction._id}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-850">
            <span className="text-zinc-450">Related Order ID</span>
            <span className="font-bold text-zinc-800 dark:text-zinc-250">{transaction.orderId || "N/A"}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-850">
            <span className="text-zinc-450">Date Logged</span>
            <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatDate(transaction.createdAt)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-zinc-100 dark:border-zinc-850">
            <span className="text-zinc-450">Remarks</span>
            <span className="font-semibold text-zinc-700 dark:text-zinc-300 text-right max-w-xs">{transaction.remarks}</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-zinc-450">Audit Logger</span>
            <span className="font-black text-zinc-650 dark:text-zinc-350">Admin Shubham</span>
          </div>
        </div>

        {/* Close button */}
        <div className="flex justify-end pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-100 dark:bg-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg font-bold text-zinc-650 dark:text-zinc-300 cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </DialogWrapper>
  );
}

// 6. Export Statement Modal
export function ExportStatementModal({ isOpen, onClose, onExport }) {
  const [format, setFormat] = useState("CSV");
  const [tier, setTier] = useState("All");
  const [status, setStatus] = useState("All");
  const [dateRange, setDateRange] = useState({ start: "", end: "" });

  useEffect(() => {
    if (isOpen) {
      setFormat("CSV");
      setTier("All");
      setStatus("All");
      setDateRange({ start: "", end: "" });
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onExport(format, { tier, status, dateRange });
    onClose();
  };

  return (
    <DialogWrapper isOpen={isOpen} onClose={onClose} title="Export Members Statement">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Format Selector */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Statement Export Format *</label>
          <div className="grid grid-cols-3 gap-2">
            {["CSV", "Excel", "PDF"].map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setFormat(f)}
                className={`py-2 text-[10px] font-extrabold uppercase rounded-lg border transition-all cursor-pointer ${
                  format === f
                    ? "border-[var(--primary)] bg-[var(--primary)]/5 text-[var(--primary)] shadow-2xs"
                    : "border-zinc-200 dark:border-zinc-805 bg-white dark:bg-zinc-950 text-zinc-500"
                }`}
              >
                {f} Report
              </button>
            ))}
          </div>
        </div>

        {/* Filter Parameter Tiers */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Filter by Tier Category</label>
          <select
            value={tier}
            onChange={e => setTier(e.target.value)}
            className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-750 dark:text-zinc-250 rounded-lg focus:outline-none focus:border-[var(--primary)] text-xs cursor-pointer font-semibold"
          >
            <option value="All">All Tiers (Bronze, Silver, Gold, Platinum)</option>
            <option value="Bronze">Bronze Members Only</option>
            <option value="Silver">Silver Members Only</option>
            <option value="Gold">Gold Members Only</option>
            <option value="Platinum">Platinum Members Only</option>
          </select>
        </div>

        {/* Filter Status */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Filter by Account Status</label>
          <select
            value={status}
            onChange={e => setStatus(e.target.value)}
            className="p-2 w-full border border-zinc-250 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-750 dark:text-zinc-250 rounded-lg focus:outline-none focus:border-[var(--primary)] text-xs cursor-pointer font-semibold"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active Accounts Only</option>
            <option value="Inactive">Inactive Accounts Only</option>
            <option value="Suspended">Suspended Accounts Only</option>
            <option value="Expired">Expired Accounts Only</option>
          </select>
        </div>

        {/* Date Range Selector */}
        <div className="space-y-1.5">
          <label className="block text-[9px] font-extrabold uppercase text-zinc-400">Membership Join Range</label>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={e => setDateRange({ ...dateRange, start: e.target.value })}
              className="p-2 border border-zinc-250 dark:border-zinc-750 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-150 rounded-lg outline-none font-semibold"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={e => setDateRange({ ...dateRange, end: e.target.value })}
              className="p-2 border border-zinc-250 dark:border-zinc-750 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-150 rounded-lg outline-none font-semibold"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-850">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 border border-zinc-250 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-850 rounded-lg font-bold text-zinc-555 dark:text-zinc-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--primary)] text-white hover:opacity-95 rounded-lg shadow-sm font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5 cursor-pointer"
          >
            <Download size={12} />
            <span>Generate Statement</span>
          </button>
        </div>
      </form>
    </DialogWrapper>
  );
}
