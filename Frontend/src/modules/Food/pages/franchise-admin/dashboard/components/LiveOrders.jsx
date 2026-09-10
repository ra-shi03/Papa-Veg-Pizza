import React, { useState, useEffect } from "react"
import { ShoppingBag, Eye, Navigation, Phone, RefreshCw, X, Clock, MapPin, User, ShieldAlert, Sparkles } from "lucide-react"
import io from "socket.io-client"
import { toast } from "sonner"

export default function LiveOrders({ orders, onRefresh, loading }) {
  const [liveOrders, setLiveOrders] = useState(orders || [])
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [activeTab, setActiveTab] = useState("info") // info, timeline, staff, notes
  const [trackingRider, setTrackingRider] = useState(null)

  useEffect(() => {
    setLiveOrders(orders || [])
  }, [orders])

  // Setup Socket.IO subscription
  useEffect(() => {
    let socket;
    try {
      const socketUrl = import.meta.env?.VITE_SOCKET_URL || "http://localhost:5000"
      socket = io(socketUrl, { autoConnect: false })
      socket.connect()

      socket.on("orderStatusUpdated", (updatedOrder) => {
        setLiveOrders(prev => {
          const index = prev.findIndex(o => o.id === updatedOrder.id)
          if (index !== -1) {
            const copy = [...prev]
            copy[index] = { ...copy[index], ...updatedOrder }
            toast.info(`Order ${updatedOrder.id} status updated to ${updatedOrder.status}`)
            return copy
          }
          return [updatedOrder, ...prev]
        })
      })
    } catch (_) {}

    return () => {
      if (socket) socket.disconnect()
    }
  }, [])

  // Auto-refresh simulation for Standalone Mock mode
  useEffect(() => {
    const timer = setInterval(() => {
      // Choose a random order to update status
      if (liveOrders.length > 0) {
        const randIdx = Math.floor(Math.random() * liveOrders.length)
        const statuses = ["confirmed", "preparing", "baking", "packed", "out_for_delivery"]
        const currentStatus = liveOrders[randIdx].status
        const nextStatusIdx = (statuses.indexOf(currentStatus) + 1) % statuses.length
        const nextStatus = statuses[nextStatusIdx]

        setLiveOrders(prev => {
          const copy = [...prev]
          copy[randIdx] = { ...copy[randIdx], status: nextStatus }
          return copy
        })

        toast.info(`Live Status: Order ${liveOrders[randIdx].id} is now ${nextStatus.replace(/_/g, " ")}`, {
          duration: 3000
        })
      }
    }, 20000)

    return () => clearInterval(timer)
  }, [liveOrders])

  const statusColors = {
    confirmed: "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30",
    preparing: "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30",
    baking: "bg-orange-50 text-orange-600 border-orange-100 dark:bg-orange-950/20 dark:text-orange-400 dark:border-orange-900/30",
    packed: "bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30",
    out_for_delivery: "bg-cyan-50 text-cyan-600 border-cyan-100 dark:bg-cyan-950/20 dark:text-cyan-400 dark:border-cyan-900/30"
  }

  const handleTrackRider = (order) => {
    setTrackingRider(order)
    toast.success(`Tracking Rider ${order.assignedStaff?.rider} for Order ${order.id}`)
  }

  const handleContactStore = (order) => {
    toast.success(`Calling ${order.store} support manager line...`)
  }

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 p-4 rounded-3xl shadow-sm flex flex-col h-[400px]">
      <div className="flex items-center justify-between mb-3 shrink-0">
        <div>
          <h3 className="text-xs font-black text-zinc-900 dark:text-white flex items-center gap-1.5 uppercase tracking-wide">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[var(--primary)] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary)]"></span>
            </span>
            Live Operations Feed
          </h3>
          <p className="text-[10px] text-zinc-400 font-semibold mt-0.5">Real-time socket updates for incoming store orders</p>
        </div>

        <button onClick={onRefresh} disabled={loading} className="p-1 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-x-auto min-w-full scrollbar-thin">
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800 text-left">
          <thead>
            <tr className="text-[9px] font-extrabold uppercase text-zinc-400 tracking-wider">
              <th className="py-2.5 px-3">Order ID</th>
              <th className="py-2.5 px-3">Store Outlet</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Time</th>
              <th className="py-2.5 px-3">Amount</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            {loading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <tr key={idx} className="animate-pulse">
                  <td className="py-3 px-3"><div className="h-3 w-16 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-3 w-28 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-3 w-20 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-5 w-16 bg-zinc-100 dark:bg-zinc-800 rounded-full" /></td>
                  <td className="py-3 px-3"><div className="h-3 w-12 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-3 w-10 bg-zinc-100 dark:bg-zinc-800 rounded" /></td>
                  <td className="py-3 px-3"><div className="h-6 w-16 bg-zinc-100 dark:bg-zinc-800 rounded ml-auto" /></td>
                </tr>
              ))
            ) : liveOrders.length > 0 ? (
              liveOrders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                  <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-white">{order.id}</td>
                  <td className="py-2.5 px-3 truncate max-w-[140px]">{order.store.replace("Papa Veg Pizza - ", "")}</td>
                  <td className="py-2.5 px-3">{order.customer}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border uppercase ${statusColors[order.status] || "bg-zinc-100"}`}>
                      {order.status.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-zinc-400 font-medium">{order.time}</td>
                  <td className="py-2.5 px-3 font-black text-zinc-900 dark:text-white">₹{order.amount}</td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="flex gap-1.5 justify-end">
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setActiveTab("info")
                        }}
                        className="p-1 text-zinc-400 hover:text-[var(--primary)] dark:hover:text-[var(--primary)] hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
                        title="View Details"
                      >
                        <Eye size={13} />
                      </button>
                      <button
                        onClick={() => handleTrackRider(order)}
                        className="p-1 text-zinc-400 hover:text-emerald-500 dark:hover:text-emerald-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
                        title="Track Rider"
                      >
                        <Navigation size={13} />
                      </button>
                      <button
                        onClick={() => handleContactStore(order)}
                        className="p-1 text-zinc-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition-all cursor-pointer"
                        title="Contact Store"
                      >
                        <Phone size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="text-center py-12 text-zinc-450 dark:text-zinc-500 font-semibold">
                  <ShoppingBag size={32} className="mx-auto text-zinc-300 dark:text-zinc-700 stroke-[1.5] mb-2" />
                  No live operational orders matches found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-[2rem] border border-zinc-100 dark:border-zinc-800 max-w-lg w-full overflow-hidden shadow-2xl animate-fade-up">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-850 flex justify-between items-center">
              <div>
                <span className="text-[9px] font-extrabold uppercase bg-[var(--primary)]/10 text-[var(--primary)] px-2 py-0.5 rounded-full border border-[var(--primary)]/20">
                  {selectedOrder.status.replace(/_/g, " ")}
                </span>
                <h3 className="text-base font-black text-zinc-900 dark:text-white mt-1">Order details: {selectedOrder.id}</h3>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400 transition-colors cursor-pointer">
                <X size={14} />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-zinc-100 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 px-3">
              {[
                { id: "info", label: "Order Info" },
                { id: "timeline", label: "Timeline" },
                { id: "staff", label: "Assigned Staff" },
                { id: "notes", label: "Notes" }
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
            <div className="p-6 max-h-[300px] overflow-y-auto scrollbar-thin text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {activeTab === "info" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 p-3 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400 font-bold">Customer</p>
                      <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5">{selectedOrder.customer}</p>
                      <p className="text-zinc-500 font-medium">{selectedOrder.phone}</p>
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400 font-bold">Outlet Location</p>
                      <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5">{selectedOrder.store}</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-[9px] uppercase text-zinc-400 font-bold mb-1.5">Delivery Address</p>
                    <p className="p-3 bg-zinc-50/50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-xl leading-relaxed">
                      {selectedOrder.address}
                    </p>
                  </div>

                  <div>
                    <p className="text-[9px] uppercase text-zinc-400 font-bold mb-1.5">Items Summary</p>
                    <div className="space-y-1.5">
                      {selectedOrder.items?.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1 border-b border-zinc-50 dark:border-zinc-850">
                          <span>{item.name} <span className="text-zinc-450 dark:text-zinc-500">x{item.quantity}</span></span>
                          <span className="font-bold text-zinc-900 dark:text-white">₹{item.price * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-2.5 mt-2.5 border-t border-zinc-100 dark:border-zinc-800 text-sm font-black">
                      <span className="text-zinc-900 dark:text-white">Total Amount</span>
                      <span className="text-[var(--primary)]">₹{selectedOrder.amount}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "timeline" && (
                <div className="space-y-4 py-2">
                  {[
                    { key: "confirmed", label: "Order Confirmed" },
                    { key: "preparing", label: "Preparing Pizza" },
                    { key: "baking", label: "Baking in Oven" },
                    { key: "packed", label: "Packed & Hot-box" },
                    { key: "out_for_delivery", label: "Out for Delivery" }
                  ].map((step, idx, arr) => {
                    const statuses = ["confirmed", "preparing", "baking", "packed", "out_for_delivery"]
                    const currentIdx = statuses.indexOf(selectedOrder.status)
                    const isDone = idx <= currentIdx
                    const isCurrent = idx === currentIdx

                    return (
                      <div key={step.key} className="flex gap-4 items-start relative">
                        {idx < arr.length - 1 && (
                          <div className={`absolute left-2.5 top-6 w-[2px] h-8 bg-zinc-100 dark:bg-zinc-850 z-0 ${
                            isDone ? "bg-[var(--primary)]" : ""
                          }`} />
                        )}
                        <div className={`w-5 h-5 rounded-full border-4 flex items-center justify-center shrink-0 z-10 transition-colors ${
                          isDone 
                            ? "bg-white dark:bg-zinc-900 border-[var(--primary)]" 
                            : "bg-zinc-100 border-zinc-200 dark:bg-zinc-950 dark:border-zinc-800"
                        }`}>
                          {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] animate-ping" />}
                        </div>
                        <div className="min-w-0">
                          <p className={`font-bold ${isDone ? "text-zinc-900 dark:text-white" : "text-zinc-400"}`}>
                            {step.label}
                          </p>
                          <p className="text-[9px] text-zinc-400 font-medium">
                            {isDone ? `Completed at ${selectedOrder.time}` : "Awaiting step"}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {activeTab === "staff" && (
                <div className="space-y-3">
                  <div className="p-3 bg-zinc-55 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-purple-50 dark:bg-purple-950/20 text-purple-500 rounded-xl">
                      <User size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400 font-bold">Kitchen Supervisor</p>
                      <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5">{selectedOrder.assignedStaff?.kitchen || "Chef Anil"}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-55 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-850 rounded-2xl flex items-center gap-3">
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500 rounded-xl">
                      <Navigation size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] uppercase text-zinc-400 font-bold">Delivery Rider</p>
                      <p className="font-extrabold text-zinc-900 dark:text-white mt-0.5">{selectedOrder.assignedStaff?.rider || "Pending Allocation"}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "notes" && (
                <div className="space-y-4">
                  <div className="p-3 border border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/10 rounded-2xl flex items-start gap-2.5">
                    <Clock size={16} className="text-zinc-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-zinc-900 dark:text-white">Special Instructions</p>
                      <p className="text-zinc-500 leading-relaxed mt-1">{selectedOrder.notes || "None"}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-500/20 rounded-2xl flex items-start gap-2.5 text-zinc-700 dark:text-zinc-300">
                    <ShieldAlert size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-rose-600 dark:text-rose-400">Order issues log</p>
                      <p className="text-zinc-450 dark:text-zinc-400 leading-relaxed mt-1">No active issues logged by delivery partner or outlet kitchen.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-100 dark:border-zinc-850 flex gap-2">
              <button
                onClick={() => setSelectedOrder(null)}
                className="flex-1 py-2 bg-zinc-100 hover:bg-zinc-250 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Close View
              </button>
              <button
                onClick={() => {
                  toast.success(`Broadcasting update alert for ${selectedOrder.id}...`)
                  setSelectedOrder(null)
                }}
                className="flex-1 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-[var(--primary)]/10 cursor-pointer"
              >
                Trigger Sync Alert
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tracker floating window */}
      {trackingRider && (
        <div className="fixed bottom-4 right-4 bg-zinc-950 border border-zinc-800 text-white rounded-2xl p-4 w-72 shadow-2xl z-50 animate-fade-up">
          <div className="flex justify-between items-start mb-2">
            <div>
              <span className="text-[8px] font-black uppercase text-emerald-400 tracking-wider"> RIDER RADAR SYNCING</span>
              <h4 className="font-black text-xs mt-0.5">{trackingRider.assignedStaff?.rider}</h4>
            </div>
            <button onClick={() => setTrackingRider(null)} className="text-zinc-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
          <div className="space-y-2 text-[10px] font-semibold text-zinc-400">
            <div className="flex gap-2 items-center">
              <Clock size={12} className="text-zinc-500" />
              <span>ETA: 12 mins to destination</span>
            </div>
            <div className="flex gap-2 items-center">
              <MapPin size={12} className="text-zinc-500" />
              <span>Last seen: Near Indore Bypass Road</span>
            </div>
            <div className="h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
              <div className="h-full bg-emerald-500 w-2/3 rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
