import React, { useState, useEffect } from "react";
import { X, WalletCards, Info, BellRing, ShieldCheck, Check } from "lucide-react";
import { useProcessRefund } from "../ordersQuery";

export default function ProcessRefundModal({ isOpen, onClose, request }) {
  const { mutateAsync: processRefund, isLoading } = useProcessRefund();
  
  const [gateway, setGateway] = useState("Razorpay");
  const [refundTransactionId, setRefundTransactionId] = useState("");
  const [processedBy, setProcessedBy] = useState("Franchise Payout Agent");
  const [gatewayReference, setGatewayReference] = useState("");
  const [remarks, setRemarks] = useState("");
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (request) {
      const initialTxn = `REF-${gateway.toUpperCase()}${Math.floor(100000 + Math.random() * 900000)}`;
      setRefundTransactionId(initialTxn);
      setGatewayReference(`GTR-${Math.floor(10000000 + Math.random() * 90000000)}`);
      setRemarks("");
      setError("");
    }
  }, [request, isOpen, gateway]);

  if (!isOpen || !request) return null;

  const approvedAmount = request.refundAmount || 0;
  const originalTxnId = request.paymentTransactionId || "N/A";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!refundTransactionId.trim()) {
      setError("Refund Transaction ID is required");
      return;
    }

    try {
      await processRefund({
        requestId: request.requestId,
        gateway,
        refundTransactionId,
        processedAmount: approvedAmount,
        processedBy,
        gatewayReference,
        remarks,
        notifyCustomer,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to process refund payout");
    }
  };

  const gateways = [
    { id: "Razorpay", name: "Razorpay", desc: "Cards, NetBanking, UPI", color: "border-blue-500 text-blue-600 bg-blue-50/10" },
    { id: "Stripe", name: "Stripe", desc: "Global Cards, Apple Pay", color: "border-indigo-500 text-indigo-600 bg-indigo-50/10" },
    { id: "Cashfree", name: "Cashfree", desc: "Wallets, UPI instant payout", color: "border-cyan-500 text-cyan-600 bg-cyan-50/10" },
    { id: "PhonePe", name: "PhonePe", desc: "Direct BHIM UPI node", color: "border-purple-500 text-purple-600 bg-purple-50/10" },
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
        
        {/* Modal Container: 850px Max Width */}
        <form 
          onSubmit={handleSubmit}
          className="relative w-full max-w-[850px] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col pointer-events-auto animate-scale-up text-xs font-medium text-zinc-700 dark:text-zinc-300"
        >
          {/* Header */}
          <header className="p-4 border-b border-zinc-150 dark:border-zinc-850 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="flex items-center gap-2">
              <WalletCards className="text-emerald-500" size={18} />
              <div>
                <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-100">
                  Process Payout / Gateway Settlement
                </h3>
                <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">
                  Confirm payment node integration details for request {request.requestId}
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

            {/* Gateway Radio Cards Section */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Select Payment Gateway Node
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {gateways.map((g) => {
                  const selected = gateway === g.id;
                  return (
                    <div
                      key={g.id}
                      onClick={() => setGateway(g.id)}
                      className={`relative p-3.5 border rounded-xl cursor-pointer select-none transition-all duration-200 ${
                        selected 
                          ? `${g.color} ring-2 ring-offset-0 border-transparent shadow-md` 
                          : "border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/50"
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-current flex items-center justify-center text-white">
                          <Check size={10} strokeWidth={3} />
                        </span>
                      )}
                      <p className="font-extrabold text-zinc-900 dark:text-zinc-100 text-xs">{g.name}</p>
                      <p className="text-[9px] text-zinc-400 mt-1 font-semibold leading-relaxed">{g.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Refund Information Panel */}
            <div className="p-3.5 bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-150 dark:border-zinc-850 rounded-xl grid grid-cols-3 gap-4">
              <div>
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Approved Amount</p>
                <p className="font-black text-emerald-600 dark:text-emerald-500 text-sm mt-0.5">₹{approvedAmount.toFixed(2)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-[9px] uppercase font-bold text-zinc-400 tracking-wide">Customer & Transaction ID</p>
                <p className="font-extrabold text-zinc-800 dark:text-zinc-200 mt-0.5 truncate">
                  {request.customer?.name} ({request.customer?.phone})
                </p>
                <p className="text-[10px] text-zinc-400 mt-0.5 font-mono">Original Txn: {originalTxnId}</p>
              </div>
            </div>

            {/* Form Fields: Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Refund Transaction ID */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                  Refund Transaction ID / Reference
                </label>
                <input
                  type="text"
                  value={refundTransactionId}
                  onChange={(e) => setRefundTransactionId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  placeholder="REF-XXXXX"
                  required
                />
              </div>

              {/* Gateway Reference */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                  Gateway API Reference / Order ID
                </label>
                <input
                  type="text"
                  value={gatewayReference}
                  onChange={(e) => setGatewayReference(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold font-mono text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  placeholder="GTR-XXXXX"
                  required
                />
              </div>

              {/* Processed By (Auth User / Agent) */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                  Processed By (Operator Signature)
                </label>
                <input
                  type="text"
                  value={processedBy}
                  onChange={(e) => setProcessedBy(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all"
                  required
                />
              </div>

              {/* Gateway Reference (Read only payout check) */}
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                  Settlement Destination
                </label>
                <div className="w-full px-3.5 py-2.5 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 rounded-xl font-bold text-zinc-500 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
                  <span>Original Source Payment Provider</span>
                </div>
              </div>

            </div>

            {/* Remarks Textarea */}
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase font-bold text-zinc-400 tracking-wide block">
                Settlement remarks / Log Notes
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-800 dark:text-zinc-250 placeholder-zinc-450 focus:outline-none focus:border-[var(--primary)] focus:ring-1 focus:ring-[var(--primary)] transition-all font-semibold"
                placeholder="Log transaction notes, payout completion codes, or gateway status codes..."
              />
            </div>

            {/* Notify Customer Checkbox */}
            <div className="p-3 bg-zinc-50/50 dark:bg-zinc-900/10 border border-zinc-150 dark:border-zinc-850 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BellRing className="text-zinc-400" size={14} />
                <div>
                  <p className="font-extrabold text-[10px] text-zinc-800 dark:text-zinc-200">Send Payout SMS Receipt</p>
                  <p className="text-[9px] text-zinc-450">Alert customer with transaction ID, amount credited, and estimated bank clearing SLA (2-3 working days).</p>
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
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-750 text-white font-bold rounded-xl shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isLoading ? "Processing..." : "Process Payout"}
            </button>
          </footer>
        </form>

      </div>
    </div>
  );
}
