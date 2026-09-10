import React, { useState } from "react"
import { AlertCircle, Eye, RefreshCw, X, ShieldAlert, MessageSquare } from "lucide-react"
import { toast } from "sonner"

export default function RecentComplaints({ complaints, onRefresh, loading }) {
  const [list, setList] = useState(complaints || [])
  const [selectedTicket, setSelectedTicket] = useState(null)

  React.useEffect(() => {
    setList(complaints || [])
  }, [complaints])

  const priorityColors = {
    low: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700",
    medium: "bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400 border-yellow-100 dark:border-yellow-900/30",
    high: "bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400 border-orange-100 dark:border-orange-900/30",
    critical: "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 animate-pulse"
  }

  const handleResolve = () => {
    toast.success(`Complaint Ticket ${selectedTicket.id} marked as resolved.`)
    setList(prev => prev.filter(t => t.id !== selectedTicket.id))
    setSelectedTicket(null)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col h-[320px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
            <ShieldAlert size={14} className="text-rose-500" />
            Recent Complaints
          </h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Tickets requiring manager attention</p>
        </div>

        <button onClick={onRefresh} className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800 text-left">
          <thead>
            <tr className="text-[8px] font-extrabold uppercase text-zinc-400 tracking-wider">
              <th className="py-2 px-2.5">Ticket ID</th>
              <th className="py-2 px-2.5">Customer</th>
              <th className="py-2 px-2.5">Store Outlet</th>
              <th className="py-2 px-2.5">Priority</th>
              <th className="py-2 px-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {loading ? (
              Array.from({ length: 3 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-2.5"><div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-3 w-24 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-2.5"><div className="h-5 w-14 bg-zinc-100 dark:bg-zinc-800 rounded-full" /></td>
                  <td className="py-3 px-2.5 text-right"><div className="h-6 w-12 bg-zinc-100 dark:bg-zinc-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : list.length > 0 ? (
              list.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/10 transition-colors">
                  <td className="py-2.5 px-2.5 font-bold text-zinc-900 dark:text-white">{ticket.id}</td>
                  <td className="py-2.5 px-2.5">{ticket.customer}</td>
                  <td className="py-2.5 px-2.5 truncate max-w-[100px]">{ticket.store.replace("Papa Veg Pizza - ", "")}</td>
                  <td className="py-2.5 px-2.5">
                    <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border uppercase ${priorityColors[ticket.priority]}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-2.5 text-right">
                    <button
                      onClick={() => setSelectedTicket(ticket)}
                      className="p-1 text-zinc-400 hover:text-[var(--primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
                      title="View Complaint"
                    >
                      <Eye size={13} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center py-12 text-zinc-400">
                  <AlertCircle size={32} className="mx-auto text-emerald-500 opacity-60 mb-2" />
                  No open complaints in this region
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Ticket Details Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-150 dark:border-zinc-800 max-w-md w-full overflow-hidden shadow-2xl animate-fade-up text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <div>
                <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border uppercase ${priorityColors[selectedTicket.priority]}`}>
                  {selectedTicket.priority} Priority
                </span>
                <h3 className="text-sm font-black text-zinc-900 dark:text-white mt-1">Ticket Details: {selectedTicket.id}</h3>
              </div>
              <button onClick={() => setSelectedTicket(null)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                <div>
                  <p className="text-[9px] uppercase text-zinc-400 font-bold">Customer Name</p>
                  <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5">{selectedTicket.customer}</p>
                </div>
                <div>
                  <p className="text-[9px] uppercase text-zinc-400 font-bold">Associated Outlet</p>
                  <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5">{selectedTicket.store}</p>
                </div>
              </div>

              <div>
                <p className="text-[9px] uppercase text-zinc-400 font-bold mb-1.5">Description of Issue</p>
                <p className="p-3 bg-rose-50/[0.02] border border-dashed border-rose-500/20 rounded-xl leading-relaxed">
                  "{selectedTicket.description}"
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850 flex gap-2">
              <button
                onClick={() => setSelectedTicket(null)}
                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close view
              </button>
              <button
                onClick={handleResolve}
                className="flex-1 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[var(--primary)]/10 cursor-pointer"
              >
                Mark as Resolved
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
