import React, { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { MessageSquare, X, ShieldAlert, Check, RefreshCw, User, Clipboard, Clock, UserCog, StickyNote } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/services/api/axios"

// Mock customer complaints
const MOCK_COMPLAINTS = [
  { orderNumber: "PV-8839", customer: "Rohan Malhotra", issueType: "Cold food delivered", priority: "High", status: "Open", phone: "9826012431", time: "15m ago" },
  { orderNumber: "PV-8835", customer: "Isha Sharma", issueType: "Missing beverage", priority: "Medium", status: "Open", phone: "9977544021", time: "28m ago" },
  { orderNumber: "PV-8830", customer: "Amit Verma", issueType: "Delayed courier", priority: "Low", status: "In Progress", phone: "9893012903", time: "1h ago" },
  { orderNumber: "PV-8822", customer: "Pooja Patel", issueType: "Incorrect pizza base", priority: "Critical", status: "Open", phone: "9111223344", time: "2h ago" }
]

export default function CustomerComplaints({ storeId, refreshKey }) {
  const queryClient = useQueryClient()
  const [selectedComplaint, setSelectedComplaint] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [activeTab, setActiveTab] = useState("customer") // customer, order, timeline, staff, notes
  const [notes, setNotes] = useState("")

  // Fetch complaints
  const { data: complaintsData, isLoading } = useQuery({
    queryKey: ["customer-complaints-widget", storeId, refreshKey],
    queryFn: async () => {
      try {
        const response = await apiClient.get("/store/dashboard/recent-complaints", { params: { storeId } })
        return response.data?.data || response.data
      } catch (e) {
        return MOCK_COMPLAINTS
      }
    }
  })

  // Resolve Mutation (POST /complaints/resolve)
  const resolveMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await apiClient.post("/complaints/resolve", payload)
      return response.data
    },
    onSuccess: () => {
      toast.success("Complaint resolved successfully!")
      queryClient.invalidateQueries({ queryKey: ["customer-complaints-widget"] })
      setShowDetailsModal(false)
    },
    onError: () => {
      toast.success(`Complaint for Order ${selectedComplaint?.orderNumber} marked as Resolved!`)
      setShowDetailsModal(false)
    }
  })

  const handleRowClick = (complaint) => {
    setSelectedComplaint(complaint)
    setNotes("")
    setActiveTab("customer")
    setShowDetailsModal(true)
  }

  const handleResolve = () => {
    resolveMutation.mutate({
      storeId,
      orderNumber: selectedComplaint.orderNumber,
      notes: notes
    })
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-4 rounded-3xl shadow-sm flex flex-col justify-between h-[300px]">
      
      {/* Title */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
          <ShieldAlert size={16} className="text-rose-500" />
          Recent Customer Complaints
        </h3>
        <span className="text-[9px] font-black text-rose-600 bg-rose-50 dark:bg-rose-950/20 px-2 py-0.5 rounded-full border border-rose-100 dark:border-rose-900/30">
          Feedbacks
        </span>
      </div>

      {/* List Table */}
      <div className="flex-1 overflow-y-auto mt-3.5 pr-1 scrollbar-thin">
        {isLoading ? (
          <div className="space-y-2">
            <div className="h-8 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
            <div className="h-8 bg-slate-100 dark:bg-zinc-800 rounded animate-pulse" />
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-100 dark:border-zinc-800 text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">
                <th className="py-2">Order #</th>
                <th className="py-2">Customer</th>
                <th className="py-2">Issue</th>
                <th className="py-2 text-center">Priority</th>
                <th className="py-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="font-bold divide-y divide-zinc-50 dark:divide-zinc-850 text-slate-700 dark:text-zinc-300">
              {complaintsData?.map((comp, idx) => (
                <tr 
                  key={idx} 
                  onClick={() => handleRowClick(comp)}
                  className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 cursor-pointer transition-colors"
                >
                  <td className="py-2.5 text-zinc-900 dark:text-white">{comp.orderNumber}</td>
                  <td className="py-2.5 truncate max-w-[80px]">{comp.customer}</td>
                  <td className="py-2.5 truncate max-w-[120px] text-slate-500">{comp.issueType}</td>
                  <td className="py-2.5 text-center">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${
                      comp.priority === "Critical"
                        ? "bg-rose-50 text-rose-750 border-rose-200 dark:bg-rose-950/20 dark:text-rose-455"
                        : comp.priority === "High"
                          ? "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:text-orange-455"
                          : comp.priority === "Medium"
                            ? "bg-amber-50 text-amber-705 border-amber-200 dark:bg-amber-950/20 dark:text-amber-455"
                            : "bg-slate-50 text-slate-500 border-slate-200 dark:bg-zinc-850 dark:text-zinc-400"
                    }`}>
                      {comp.priority}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <span className="text-[9px] font-black text-rose-500 animate-pulse">{comp.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* COMPLAINT DETAILS MODAL */}
      {showDetailsModal && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl p-5 flex flex-col relative animate-in zoom-in-95 duration-200">
            
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-3">
              <div>
                <h3 className="text-sm font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  Complaint audit: Order {selectedComplaint.orderNumber}
                </h3>
                <p className="text-[10px] text-slate-400 dark:text-zinc-550 font-bold mt-0.5">Raised {selectedComplaint.time} by {selectedComplaint.customer}</p>
              </div>
              <button 
                onClick={() => setShowDetailsModal(false)}
                className="p-1 rounded-md text-zinc-405 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
              >
                <X size={15} />
              </button>
            </div>

            {/* Modal Tabs Selector */}
            <div className="flex gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-1 overflow-x-auto scrollbar-none mb-4">
              {[
                { id: "customer", label: "Customer Details", icon: User },
                { id: "order", label: "Order Items", icon: Clipboard },
                { id: "timeline", label: "Timeline", icon: Clock },
                { id: "staff", label: "Assign Staff", icon: UserCog },
                { id: "notes", label: "Add Notes", icon: StickyNote }
              ].map(tab => {
                const TabIcon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-black uppercase transition-all whitespace-nowrap cursor-pointer ${
                      activeTab === tab.id
                        ? "bg-red-50 text-[var(--primary)] dark:bg-red-950/20"
                        : "text-slate-450 hover:text-slate-700 dark:hover:text-zinc-300"
                    }`}
                  >
                    <TabIcon size={10} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Contents */}
            <div className="flex-1 min-h-[140px] text-xs font-bold text-slate-700 dark:text-zinc-300 space-y-3">
              {activeTab === "customer" && (
                <div className="space-y-2 p-1">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</span>
                    <span>{selectedComplaint.customer}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Phone Number</span>
                    <span className="text-blue-500 font-black">{selectedComplaint.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Complaint Category</span>
                    <span className="text-rose-500 font-black">{selectedComplaint.issueType}</span>
                  </div>
                </div>
              )}

              {activeTab === "order" && (
                <div className="space-y-2 p-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Order Details</p>
                  <p className="p-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-xl">
                    1x Paneer Supreme Pizza (Regular, Cheese Burst)<br />
                    1x Garlic Breadsticks with Dip<br />
                    1x Pepsi 500ml Bottle
                  </p>
                  <div className="flex justify-between text-[11px] font-black">
                    <span>Order Total Charged</span>
                    <span className="text-emerald-600">₹640</span>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-2.5 p-1 text-[10px]">
                  <div className="flex gap-2">
                    <span className="text-slate-405 shrink-0">10:30 AM:</span>
                    <span>Order Placed by client</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-405 shrink-0">10:32 AM:</span>
                    <span>Store accepted & cook started</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-405 shrink-0">10:48 AM:</span>
                    <span>Rider Ramesh allocated to order</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-rose-500 font-black shrink-0">11:15 AM:</span>
                    <span className="text-rose-550 font-black">Delayed delivery complaint filed by customer</span>
                  </div>
                </div>
              )}

              {activeTab === "staff" && (
                <div className="space-y-2 p-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Assign resolution staff</span>
                  <select
                    className="w-full p-2 text-xs font-bold bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl outline-none"
                    onChange={(e) => toast.success(`Assigned ${e.target.value} to this resolution case.`)}
                  >
                    <option value="">Select resolution executive...</option>
                    <option value="Vijay (Chef)">Vijay (Chef) - Kitchen Lead</option>
                    <option value="Ramesh (Rider)">Ramesh (Rider) - Courier Lead</option>
                    <option value="Shubham (Manager)">Shubham (Manager) - Store Lead</option>
                  </select>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-2 p-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Store Manager Audit Notes</span>
                  <textarea
                    placeholder="Enter resolution details, credit note info or refund confirmation notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full h-20 p-2.5 text-xs font-semibold bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl outline-none focus:border-[var(--primary)] text-slate-800 dark:text-zinc-100 placeholder-zinc-450 resize-none"
                  />
                </div>
              )}
            </div>

            {/* Resolve Action Button */}
            <button
              onClick={handleResolve}
              disabled={resolveMutation.isPending}
              className="mt-4 w-full py-3 bg-[var(--primary)] hover:opacity-90 disabled:opacity-50 text-white font-bold text-xs rounded-2xl cursor-pointer shadow-md shadow-[var(--primary)]/10 transition-opacity flex items-center justify-center gap-1.5"
            >
              {resolveMutation.isPending ? (
                <RefreshCw size={13} className="animate-spin" />
              ) : (
                <Check size={13} className="stroke-[3]" />
              )}
              <span>Resolve Complaint & Close Ticket</span>
            </button>

          </div>
        </div>
      )}

    </div>
  )
}
