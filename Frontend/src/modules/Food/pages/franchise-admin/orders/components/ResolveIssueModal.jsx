import React, { useState, useEffect } from "react";
import { X, CheckCircle, Info, BellRing, Check } from "lucide-react";
import { useResolveIssue } from "../ordersQuery";

export default function ResolveIssueModal({ isOpen, onClose, issue }) {
  const { mutateAsync: resolveIssue, isLoading } = useResolveIssue();

  const [resolutionType, setResolutionType] = useState("Refund");
  const [compensationAmount, setCompensationAmount] = useState("");
  const [couponCode, setCouponCode] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (issue) {
      setResolutionType("Refund");
      setCompensationAmount("");
      setCouponCode("");
      setRemarks("");
      setError("");
    }
  }, [issue, isOpen]);

  if (!isOpen || !issue) return null;

  const orderValue = issue.order?.totalAmount || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const parsedAmount = parseFloat(compensationAmount) || 0;
    if (resolutionType === "Refund" && parsedAmount <= 0) {
      setError("Please specify a valid refund amount");
      return;
    }
    if (resolutionType === "Refund" && parsedAmount > orderValue) {
      setError(`Refund amount cannot exceed order value (₹${orderValue})`);
      return;
    }
    if (resolutionType === "Coupon" && !couponCode.trim()) {
      setError("Coupon code is required for coupon compensation");
      return;
    }
    if (!remarks.trim()) {
      setError("Please provide resolution notes justifying the resolution");
      return;
    }

    try {
      await resolveIssue({
        issueId: issue.issueNumber,
        resolutionType,
        compensationAmount: parsedAmount,
        couponCode,
        remarks,
        notifyCustomer,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to resolve issue");
    }
  };

  const resolutionTypes = [
    { id: "Refund", name: "Refund Payout", desc: "Source gateway settlement", color: "border-blue-500 text-blue-650 bg-blue-50/10" },
    { id: "Replacement", name: "Replacement Order", desc: "Dispatch free food items", color: "border-amber-500 text-amber-650 bg-amber-50/10" },
    { id: "Coupon Compensation", name: "Coupon Credit", desc: "补偿 Coupons (e.g. PvP50)", color: "border-purple-500 text-purple-650 bg-purple-50/10" },
    { id: "Apology", name: "Apology Note", desc: "Close without payout credit", color: "border-emerald-500 text-emerald-650 bg-emerald-50/10" },
    { id: "No Action", name: "No Compensation", desc: "Mark issue as settled directly", color: "border-zinc-400 text-zinc-650 bg-zinc-50/20" }
  ];

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/55 backdrop-blur-xs transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />

      {/* Center Wrapper shifted to prevent sidebar overlap */}
      <div className="fixed inset-0 lg:left-[280px] flex items-center justify-center p-4 z-10 pointer-events-none">
        
        {/* Modal Container: 800px Max Width */}
        <form 
          onSubmit={handleSubmit}
          className="relative w-full max-w-[800px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-scale-up text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <CheckCircle className="text-emerald-500" size={18} />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Resolve Operational Issue Ticket
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Confirm resolution terms and customer payout packages for issue {issue.issueNumber}
                </p>
              </div>
            </div>
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          </header>

          {/* Form Content */}
          <div className="p-5 space-y-4 overflow-y-auto max-h-[75vh] scrollbar-thin">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/30 rounded-xl text-red-600 text-[11px] font-bold flex items-start gap-2">
                <Info size={14} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Resolution Type Selection */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Select Resolution Method
              </label>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
                {resolutionTypes.map((t) => {
                  const selected = resolutionType === t.id;
                  return (
                    <div
                      key={t.id}
                      onClick={() => setResolutionType(t.id)}
                      className={`relative p-3 border rounded-xl cursor-pointer select-none transition-all duration-200 text-center ${
                        selected 
                          ? `${t.color} ring-2 ring-offset-0 border-transparent shadow-md` 
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-current flex items-center justify-center text-white">
                          <Check size={8} strokeWidth={3} />
                        </span>
                      )}
                      <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-[10px]">{t.name}</p>
                      <p className="text-[8px] text-zinc-400 mt-1 font-semibold leading-tight">{t.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Context Order Panel */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[8.5px] uppercase font-bold text-zinc-400">Customer Complaint</p>
                <p className="font-extrabold text-zinc-805 dark:text-zinc-200 mt-0.5">Category: {issue.category}</p>
                <p className="text-[9.5px] text-zinc-500 mt-0.5 truncate max-w-[400px]">"{issue.description}"</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-[8.5px] uppercase font-bold text-zinc-400">Order Net Total</p>
                <p className="font-black text-sm text-zinc-900 dark:text-white mt-0.5">₹{orderValue.toFixed(2)}</p>
              </div>
            </div>

            {/* Compensation Details Panel */}
            {(resolutionType === "Refund" || resolutionType === "Replacement" || resolutionType === "Coupon Compensation") && (
              <div className="p-4 border border-zinc-150 dark:border-zinc-850 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-550/[0.02]">
                
                {/* Compensation Amount */}
                {(resolutionType === "Refund" || resolutionType === "Replacement") && (
                  <div className="space-y-1.5 col-span-2 md:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                      Compensation Amount (₹)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-450 font-bold">₹</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        max={orderValue}
                        value={compensationAmount}
                        onChange={(e) => setCompensationAmount(e.target.value)}
                        className="w-full pl-7 pr-4 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Coupon Code Input */}
                {resolutionType === "Coupon Compensation" && (
                  <div className="space-y-1.5 col-span-2 md:col-span-1">
                    <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                      Apology Coupon Code
                    </label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none placeholder-zinc-400"
                      placeholder="e.g. PVPCOMP100"
                      required
                    />
                  </div>
                )}

                {/* Expiry Date (Optional) */}
                <div className="space-y-1.5 col-span-2 md:col-span-1 flex flex-col justify-end">
                  <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                    Compensation SLA Expiry
                  </label>
                  <div className="w-full px-3 py-2 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-450 font-bold font-mono">
                    30 Days Standard Claim Window
                  </div>
                </div>

              </div>
            )}

            {/* Resolution Notes Textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Resolution Explanation (Visible in audit logs)
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-250 placeholder-zinc-450 focus:outline-none focus:border-[var(--primary)] transition-all font-semibold"
                placeholder="Log internal comments. Summarize how the issue was resolved (e.g. Rider misbehavior flagged to fleet operator, replacement pizza delivered free of charge)..."
                required
              />
            </div>

            {/* Notify Customer Checkbox */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="text-zinc-400" size={14} />
                <div>
                  <p className="font-extrabold text-[10px] text-zinc-800 dark:text-zinc-200">Alert Customer via App</p>
                  <p className="text-[9px] text-zinc-450 font-semibold">Notify customer with resolution details, coupons, or refund transaction receipts.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={notifyCustomer}
                  onChange={(e) => setNotifyCustomer(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-zinc-200 dark:bg-zinc-850 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500" />
              </label>
            </div>
          </div>

          {/* Footer Actions */}
          <footer className="p-4 border-t border-zinc-100 dark:border-zinc-850 flex justify-end gap-3 bg-zinc-50/30 dark:bg-zinc-900/10">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-755 text-white font-bold rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? "Resolving..." : "Resolve Issue"}
            </button>
          </footer>
        </form>

      </div>
    </div>
  );
}
