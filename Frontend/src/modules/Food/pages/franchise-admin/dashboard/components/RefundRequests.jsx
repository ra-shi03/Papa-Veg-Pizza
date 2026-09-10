import React, { useState } from "react"
import { RotateCcw, Check, X, FileText, RefreshCw, Sparkles, AlertCircle } from "lucide-react"
import { toast } from "sonner"

export default function RefundRequests({ refunds, onRefresh, loading }) {
  const [list, setList] = useState(refunds || [])
  const [selectedRefund, setSelectedRefund] = useState(null)
  const [activeTab, setActiveTab] = useState("details") // details, notes, attachments
  const [actionLoading, setActionLoading] = useState(null)

  React.useEffect(() => {
    setList(refunds || [])
  }, [refunds])

  const handleApprove = async (e, refund) => {
    e.stopPropagation()
    setActionLoading(`approve-${refund.id}`)
    setTimeout(() => {
      setList(prev => prev.filter(r => r.id !== refund.id))
      toast.success(`Refund approved for Order ${refund.id}`)
      setActionLoading(null)
      setSelectedRefund(null)
    }, 1500)
  }

  const handleReject = async (e, refund) => {
    e.stopPropagation()
    setActionLoading(`reject-${refund.id}`)
    setTimeout(() => {
      setList(prev => prev.filter(r => r.id !== refund.id))
      toast.error(`Refund request rejected for Order ${refund.id}`)
      setActionLoading(null)
      setSelectedRefund(null)
    }, 1500)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
            <RotateCcw size={14} className="text-rose-500 animate-pulse" />
            Refund Requests
          </h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Refund tickets from customers awaiting approval</p>
        </div>

        <button onClick={onRefresh} className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800 text-left">
          <thead>
            <tr className="text-[8px] font-extrabold uppercase text-zinc-400 tracking-wider">
              <th className="py-2 px-2.5">Order ID</th>
              <th className="py-2 px-2.5">Customer</th>
              <th className="py-2 px-2.5">Amount</th>
              <th className="py-2 px-2.5">Reason</th>
              <th className="py-2 px-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-2.5"><div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-3 w-10 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5 text-right"><div className="h-5 w-24 bg-zinc-100 dark:bg-zinc-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : list.length > 0 ? (
              list.map((refund) => (
                <tr
                  key={refund.id}
                  onClick={() => {
                    setSelectedRefund(refund)
                    setActiveTab("details")
                  }}
                  className="hover:bg-rose-500/[0.02] hover:shadow-inner cursor-pointer transition-all duration-200"
                >
                  <td className="py-2.5 px-2.5 font-bold text-zinc-900 dark:text-white">{refund.id}</td>
                  <td className="py-2.5 px-2.5">{refund.customer}</td>
                  <td className="py-2.5 px-2.5 font-black text-rose-500">₹{refund.amount}</td>
                  <td className="py-2.5 px-2.5 max-w-[120px] truncate text-zinc-400 font-medium" title={refund.reason}>
                    {refund.reason}
                  </td>
                  <td className="py-2.5 px-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-1 justify-end">
                      <button
                        disabled={actionLoading === `approve-${refund.id}`}
                        onClick={(e) => handleApprove(e, refund)}
                        className="p-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white rounded-lg border border-emerald-100 dark:border-emerald-900/30 transition-all cursor-pointer"
                        title="Approve Refund"
                      >
                        {actionLoading === `approve-${refund.id}` ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <Check size={11} className="stroke-[3]" />
                        )}
                      </button>
                      <button
                        disabled={actionLoading === `reject-${refund.id}`}
                        onClick={(e) => handleReject(e, refund)}
                        className="p-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white rounded-lg border border-rose-100 dark:border-rose-900/30 transition-all cursor-pointer"
                        title="Reject Refund"
                      >
                        {actionLoading === `reject-${refund.id}` ? (
                          <RefreshCw size={11} className="animate-spin" />
                        ) : (
                          <X size={11} className="stroke-[3]" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-12 text-zinc-400">
                  <RotateCcw size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5] mb-2" />
                  No pending refund requests found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Refund Details Modal */}
      {selectedRefund && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-md w-full overflow-hidden shadow-2xl animate-fade-up text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-extrabold uppercase bg-rose-50 text-rose-500 px-2 py-0.5 rounded-full border border-rose-200">
                  Pending Verification
                </span>
                <h3 className="text-base font-black text-zinc-900 dark:text-white mt-1">Refund Request: {selectedRefund.id}</h3>
              </div>
              <button onClick={() => setSelectedRefund(null)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 px-3">
              {[
                { id: "details", label: "Details" },
                { id: "notes", label: "Customer Notes" },
                { id: "attachments", label: "Attachments" }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? "border-[var(--primary)] text-[var(--primary)]"
                      : "border-transparent text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[220px] overflow-y-auto scrollbar-thin">
              {activeTab === "details" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400 font-bold">Customer Name</p>
                      <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5">{selectedRefund.customer}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400 font-bold">Refund Amount</p>
                      <p className="font-extrabold text-rose-500 mt-0.5">₹{selectedRefund.amount}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase text-zinc-400 font-bold mb-1.5">Reason for Request</p>
                    <p className="p-3 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-xl leading-relaxed">
                      {selectedRefund.reason}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-2">
                  <p className="text-[9px] uppercase text-zinc-400 font-bold mb-1.5">Internal Notes from Agent</p>
                  <p className="p-3 bg-amber-50/10 dark:bg-amber-950/10 border border-amber-500/20 rounded-xl leading-relaxed text-zinc-650 dark:text-zinc-300">
                    "Customer complains the pizza delivered was cold and cheese was dried out. Store manager confirmed 20 mins delay in dispatching rider."
                  </p>
                </div>
              )}

              {activeTab === "attachments" && (
                <div className="space-y-2">
                  <p className="text-[9px] uppercase text-zinc-400 font-bold mb-1.5">Uploaded Files (Images of delivered item)</p>
                  <div className="p-3 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText size={16} className="text-[var(--primary)]" />
                      <span>cold-pizza-photo.jpg</span>
                    </div>
                    <span className="text-[9px] text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded font-bold">2.4 MB</span>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850 flex gap-2">
              <button
                disabled={actionLoading}
                onClick={(e) => handleReject(e, selectedRefund)}
                className="flex-1 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:text-rose-400 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border border-rose-200/50"
              >
                Reject Refund
              </button>
              <button
                disabled={actionLoading}
                onClick={(e) => handleApprove(e, selectedRefund)}
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-500/10 cursor-pointer flex items-center justify-center gap-1.5 border-0"
              >
                Approve Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
