import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Phone, MessageSquare, Store, User, Bike, Star, AlertCircle, FileText, CheckCircle, Navigation } from "lucide-react"

export default function DeliveryPartnerDetailsDrawer({ isOpen, onClose, rider, onSuspend, onEdit }) {
  if (!rider) return null

  // Helper for status badge styling
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "ONLINE":
        return "bg-green-50 text-green-600 border border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30"
      case "BUSY":
        return "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
      case "OFFLINE":
        return "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/30"
      case "SUSPENDED":
        return "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
      default:
        return "bg-zinc-100 text-zinc-600 border border-zinc-200"
    }
  }

  // Set WebP profile image based on rider name or fallback
  const getProfileImage = (name) => {
    if (name?.toLowerCase().includes("alex")) return "/rider_alex.webp"
    if (name?.toLowerCase().includes("elena")) return "/rider_elena.webp"
    if (name?.toLowerCase().includes("marcus")) return "/rider_marcus.webp"
    return "/rider_alex.webp" // Default fallback
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] transition-opacity"
          />

          {/* Sliding Drawer Content */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-white dark:bg-zinc-900 shadow-2xl z-[101] flex flex-col overflow-hidden border-l border-zinc-200 dark:border-zinc-800"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors"
                >
                  <X size={16} className="text-zinc-700 dark:text-zinc-300" />
                </button>
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-50">Partner Profile</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onSuspend(rider)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
                >
                  {rider.status === "Suspended" ? "Activate" : "Suspend"}
                </button>
                {/* <button
                  onClick={() => onEdit(rider)}
                  className="px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white font-semibold text-xs hover:opacity-90 transition-opacity"
                >
                  Edit Details
                </button> */}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4 pb-20 scrollbar-thin">
              {/* Profile Card Summary */}
              <section className="flex flex-col sm:flex-row gap-4 items-start pb-4 border-b border-zinc-150 dark:border-zinc-800">
                <div className="relative flex-shrink-0">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-4 border-zinc-100 dark:border-zinc-800 shadow-md">
                    <img
                      src={getProfileImage(rider.name)}
                      alt={`${rider.name} profile`}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className={`absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide shadow-sm ${getStatusBadge(rider.status)}`}>
                    {rider.status}
                  </span>
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">{rider.name}</h2>
                    <p className="text-zinc-400 font-semibold text-[9px] tracking-widest uppercase">RIDER ID: {rider.id}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => alert(`Calling ${rider.name}...`)}
                      className="w-7.5 h-7.5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--primary)] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <Phone size={14} />
                    </button>
                    <button
                      onClick={() => alert(`Opening chat with ${rider.name}...`)}
                      className="w-7.5 h-7.5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--primary)] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                      <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wide">Email Address</span>
                      <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 break-all">{rider.email}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                      <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wide">Phone Number</span>
                      <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">{rider.phone}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Assignment & Vehicle */}
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Store Card */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-[var(--primary)]">
                    <Store size={18} />
                    <h4 className="font-bold text-xs">Store Assignment</h4>
                  </div>
                  <div className="space-y-3">
                    <p className="text-xs font-extrabold text-zinc-950 dark:text-zinc-50">{rider.store}</p>
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-600 dark:text-zinc-400 font-bold text-[10px]">
                        {rider.storeManager?.charAt(0) || "M"}
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-250">{rider.storeManager}</p>
                        <p className="text-[8px] text-zinc-455 font-bold uppercase tracking-wider">Store Manager</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Vehicle Card */}
                <div className="p-3.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-[var(--primary)]">
                      <Bike size={18} />
                      <h4 className="font-bold text-xs">Vehicle Details</h4>
                    </div>
                    <span className="bg-emerald-500/10 text-emerald-600 text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider border border-emerald-500/20">VERIFIED</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500 font-medium">Type</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-150">{rider.vehicle} ({rider.vehicleModel})</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500 font-medium">License Number</span>
                      <span className="font-bold font-mono text-zinc-850 dark:text-zinc-150">{rider.licenseNumber}</span>
                    </div>
                  </div>
                </div>
              </section>

              {/* Performance Metrics */}
              <section className="space-y-3">
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50">Performance Metrics</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center hover:border-[var(--primary)]/30 transition-colors">
                    <span className="text-[var(--primary)] font-black text-base leading-none block">{rider.completedOrders}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Completed</span>
                  </div>
                  <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl text-center hover:border-red-500/30 transition-colors">
                    <span className="text-rose-500 font-black text-base leading-none block">{rider.cancelledOrders}</span>
                    <span className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">Cancelled</span>
                  </div>
                  <div className="p-2.5 bg-[var(--primary)] text-white rounded-xl text-center shadow-lg shadow-[var(--primary)]/10 flex flex-col justify-center items-center">
                    <div className="flex items-center gap-0.5">
                      <span className="font-black text-base leading-none">{rider.rating}</span>
                      <Star size={13} className="fill-white stroke-none" />
                    </div>
                    <span className="text-[9px] text-white/80 font-bold uppercase tracking-wider">Rating</span>
                  </div>
                </div>
              </section>

              {/* Live Status Tracking */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50">Live Status Tracking</h4>
                  <span className="text-[9px] text-zinc-400 font-bold">Last Active: 2 mins ago</span>
                </div>
                <div className="relative h-36 w-full rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 group shadow-inner">
                  <img
                    src="/live_map_preview.webp"
                    alt="Live Map Preview"
                    className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-700"
                  />
                  {/* Simulated Map Pulse Ping & Marker */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-[var(--primary)]/40 rounded-full animate-ping scale-150" />
                      <div className="relative w-6 h-6 bg-[var(--primary)] rounded-full border-2 border-white flex items-center justify-center shadow-lg">
                        <Navigation size={11} className="text-white transform rotate-45" />
                      </div>
                    </div>
                  </div>
                  {/* Map Overlay Badge */}
                  <div className="absolute bottom-2 left-2 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-2 py-1 rounded-lg shadow-md flex items-center gap-2 border border-zinc-100 dark:border-zinc-850">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-[8px] font-extrabold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
                      On Delivery: #ORD-11502
                    </span>
                  </div>
                </div>
              </section>

              {/* Recent Deliveries */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50">Recent Deliveries</h4>
                  <button className="text-[var(--primary)] font-bold text-[10px] hover:underline">View History</button>
                </div>
                <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 rounded-xl overflow-hidden divide-y divide-zinc-150 dark:divide-zinc-850">
                  {rider.recentDeliveries?.length > 0 ? (
                    rider.recentDeliveries.map((del) => (
                      <div key={del.id} className="p-2.5 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-7.5 h-7.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-500 dark:text-zinc-400">
                            <FileText size={14} />
                          </div>
                          <div>
                            <p className="font-bold text-[10px] text-zinc-900 dark:text-zinc-50">Order #{del.id}</p>
                            <p className="text-[9px] text-zinc-400 font-semibold">{del.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase tracking-wide ${del.status === "Delivered" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-450" : "bg-rose-50 text-rose-600 dark:bg-rose-950/20 dark:text-rose-450"
                            }`}>
                            {del.status}
                          </span>
                          <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-150 mt-1">${del.earnings.toFixed(2)} Earnings</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-zinc-400 text-[10px] font-semibold">No recent deliveries recorded</div>
                  )}
                </div>
              </section>
            </div>

            {/* Sticky Action Footer */}
            <div className="absolute bottom-0 left-0 right-0 p-3 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 flex gap-4">
              <button
                onClick={() => alert(`Alert notification sent to ${rider.name}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-1.5 rounded-lg font-bold text-xs hover:opacity-90 transition-all active:scale-[0.98] shadow-md shadow-zinc-900/10 cursor-pointer"
              >
                Send Alert Notification
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
