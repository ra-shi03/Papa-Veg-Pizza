import React, { useState } from "react";
import { X, AlertCircle, RefreshCcw, DollarSign, Send, Check } from "lucide-react";
import { useOrderDetails, useCreateRefund } from "../hooks/useCustomerOrders";
import { Skeleton } from "@food/components/ui/skeleton";
import { toast } from "sonner";

export default function RefundHistoryModal({ visible, onClose, orderId, userRole }) {
  const { data, isLoading, isError, refetch } = useOrderDetails(orderId);
  const createRefundMutation = useCreateRefund();
  const [refundReason, setRefundReason] = useState("");
  const [showInitiateForm, setShowInitiateForm] = useState(false);

  if (!visible) return null;

  const { order = {}, refunds = [] } = data || {};
  const isReadOnly = userRole === "assistant_manager";

  const handleInitiateRefund = async (e) => {
    e.preventDefault();
    if (!refundReason.trim()) {
      toast.error("Please enter a valid reason for refund.");
      return;
    }

    try {
      await createRefundMutation.mutateAsync({
        orderId: order._id,
        reason: refundReason
      });
      setRefundReason("");
      setShowInitiateForm(false);
      refetch();
    } catch (_) {}
  };

  return (
    <div className="fixed inset-y-0 left-0 right-0 lg:left-[280px] z-50 flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-3xl bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 dark:border-zinc-850">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white tracking-tight uppercase">
              Order Refund Audit Ledger
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-550 font-semibold mt-0.5">
              Review and audit refund status for Order: <strong className="text-[var(--primary)]">{order.orderNumber || ""}</strong>.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-zinc-805 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-28 w-full rounded-2xl" />
            </div>
          ) : isError ? (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-12 h-12 bg-red-50 text-[var(--primary)] rounded-full flex items-center justify-center">
                <AlertCircle size={24} />
              </div>
              <h4 className="text-sm font-extrabold text-zinc-850 dark:text-zinc-200">Failed to Load Refund Audit Log</h4>
              <button
                onClick={() => refetch()}
                className="flex items-center gap-1.5 px-4 py-2 bg-[var(--primary)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                <RefreshCcw size={12} />
                <span>Retry</span>
              </button>
            </div>
          ) : (
            <>
              {/* Order Amount overview */}
              <div className="flex items-center justify-between p-4 bg-neutral-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                <div>
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Total Order Amount</span>
                  <span className="text-lg font-black text-zinc-900 dark:text-white mt-0.5 block">₹{order.totalAmount}</span>
                </div>
                <div>
                  <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">Settle Method</span>
                  <span className="text-xs font-bold text-zinc-650 dark:text-zinc-350 mt-0.5 block">{order.paymentMethod}</span>
                </div>
                <div>
                  {refunds.length === 0 && !showInitiateForm && (
                    <button
                      disabled={isReadOnly}
                      onClick={() => setShowInitiateForm(true)}
                      className={`flex items-center gap-1.5 px-4.5 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer ${
                        isReadOnly ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      <DollarSign size={13} />
                      <span>Initiate Refund</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Initiate Refund Form */}
              {showInitiateForm && (
                <form onSubmit={handleInitiateRefund} className="p-4 border border-amber-200/60 dark:border-amber-900/20 bg-amber-500/[0.02] dark:bg-amber-950/[0.02] rounded-2xl space-y-3">
                  <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                    Initiate Refund Request
                  </h4>
                  
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">
                      Reason for Refund
                    </label>
                    <textarea
                      value={refundReason}
                      onChange={(e) => setRefundReason(e.target.value)}
                      placeholder="e.g. Late delivery and cold pizza. Customer refused to accept order."
                      className="w-full text-xs font-semibold px-3 py-2 bg-neutral-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-zinc-850 dark:text-white placeholder-zinc-400 outline-none focus:border-[var(--primary)] transition-all min-h-[60px]"
                      required
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowInitiateForm(false)}
                      className="px-3.5 py-1.5 bg-neutral-100 dark:bg-zinc-800 hover:bg-neutral-200 dark:hover:bg-zinc-750 text-zinc-600 dark:text-zinc-350 font-bold rounded-xl text-xs transition-all cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={createRefundMutation.isPending}
                      className="flex items-center gap-1 px-4 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-bold rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      {createRefundMutation.isPending ? (
                        <span>Processing...</span>
                      ) : (
                        <>
                          <Send size={11} />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Refunds List Table */}
              {refunds.length === 0 ? (
                <div className="py-10 text-center border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl bg-zinc-50/10 dark:bg-zinc-950/10">
                  <Check size={24} className="text-emerald-500 stroke-[2.5] mx-auto mb-2" />
                  <p className="text-xs font-extrabold text-zinc-600 dark:text-zinc-400">No Refunds Claims Found</p>
                  <p className="text-[9px] text-zinc-400 mt-0.5">This transaction has not registered any disputes or refunds requests.</p>
                </div>
              ) : (
                <div className="border border-zinc-150 dark:border-zinc-800 rounded-2xl overflow-hidden bg-white dark:bg-zinc-950">
                  <table className="w-full text-left text-xs font-semibold">
                    <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 dark:text-zinc-550 tracking-wider">
                      <tr>
                        <th className="px-4 py-2.5">Refund ID</th>
                        <th className="px-4 py-2.5">Reason</th>
                        <th className="px-4 py-2.5 text-right">Amount</th>
                        <th className="px-4 py-2.5">Status</th>
                        <th className="px-4 py-2.5">Created Date</th>
                        <th className="px-4 py-2.5">Approved By</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850 text-zinc-700 dark:text-zinc-350">
                      {refunds.map((ref) => (
                        <tr key={ref._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                          <td className="px-4 py-2.5 font-mono font-extrabold text-[10px] text-zinc-900 dark:text-white uppercase">
                            {ref._id}
                          </td>
                          <td className="px-4 py-2.5 text-zinc-850 dark:text-zinc-200 font-bold max-w-[150px] truncate" title={ref.reason}>
                            {ref.reason}
                          </td>
                          <td className="px-4 py-2.5 text-right font-extrabold text-rose-500">
                            ₹{ref.amount}
                          </td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              ref.status === "approved" 
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" 
                                : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                            }`}>
                              {ref.status}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-zinc-450 dark:text-zinc-500 font-bold">
                            {new Date(ref.createdAt).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric"
                            })}
                          </td>
                          <td className="px-4 py-2.5 text-zinc-450 dark:text-zinc-500 font-bold capitalize">
                            {ref.approvedBy || "--"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950/20 border-t border-zinc-150 dark:border-zinc-800 text-right">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-neutral-200 hover:bg-neutral-300 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-300 font-bold rounded-2xl text-xs transition-all cursor-pointer"
          >
            Close Ledgers
          </button>
        </div>
      </div>
    </div>
  );
}
