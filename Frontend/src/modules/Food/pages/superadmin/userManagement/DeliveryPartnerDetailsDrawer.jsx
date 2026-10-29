import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Phone, MessageSquare, Store, User, Bike, Star, AlertCircle, FileText, CheckCircle, Navigation, MapPin, ExternalLink, Landmark } from "lucide-react"
import useDeliveryPartnerDetails from "./useDeliveryPartnerDetails"

const maskAccount = (n) => {
  const d = String(n || "").replace(/\s+/g, "")
  return d ? `${"•".repeat(Math.max(0, d.length - 4))}${d.slice(-4)}` : ""
}
const maskId = (n) => {
  const d = String(n || "").replace(/\s+/g, "")
  return d ? `${"X".repeat(Math.max(0, d.length - 4))}${d.slice(-4)}` : ""
}
const when = (date) => (date ? new Date(date).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "")

export default function DeliveryPartnerDetailsDrawer({ isOpen, onClose, rider, onSuspend, onEdit, onApprove, onReject }) {
  // The full signup record from the server (documents, bank, licence, location); the list row is only a fallback
  const { details, loading: loadingDetails, error: detailsError, reload: reloadDetails } = useDeliveryPartnerDetails(rider?.id, Boolean(isOpen && rider))
  if (!rider) return null

  const d = details || {}
  const approval = d.approvalStatus || (rider.status === "Pending" ? "pending" : rider.status === "Suspended" ? "suspended" : "approved")
  const statusLabel = approval === "pending" ? "Pending" : approval === "rejected" ? "Rejected" : approval === "suspended" ? "Suspended" : rider.status
  const email = d.email ?? rider.email
  const phone = d.phone ?? rider.phone
  const hasFix = Number.isFinite(d.lastLat) && Number.isFinite(d.lastLng)
  const lastSeen = d.lastLocationAt || d.updatedAt
  const bank = d.documents?.bankDetails
  const docs = [
    { label: "Selfie / profile photo", url: d.profilePhoto },
    { label: "ID card (Aadhaar)", url: d.aadharPhoto, number: maskId(d.aadharNumber) },
    { label: "PAN card", url: d.panPhoto, number: d.panNumber ? maskId(d.panNumber) : "" },
    { label: "Driving licence", url: d.drivingLicensePhoto, number: d.drivingLicenseNumber || "" },
    { label: "Vehicle RC", url: null, notCollected: true },
    { label: "Address proof", url: null, notCollected: true },
  ]
  const act = async (fn) => {
    if (!fn) return
    await fn(rider)
    reloadDetails()
  }

  // Helper for status badge styling
  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case "ONLINE":
        return "bg-green-50 text-green-600 border border-green-100 dark:bg-green-950/20 dark:text-green-400 dark:border-green-900/30"
      case "BUSY":
        return "bg-amber-50 text-amber-600 border border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30"
      case "OFFLINE":
        return "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700/30"
      case "PENDING":
        return "bg-sky-50 text-sky-600 border border-sky-100 dark:bg-sky-950/20 dark:text-sky-400 dark:border-sky-900/30"
      case "REJECTED":
      case "SUSPENDED":
        return "bg-rose-50 text-rose-600 border border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30"
      default:
        return "bg-zinc-100 text-zinc-600 border border-zinc-200"
    }
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
                {approval !== "rejected" && approval !== "pending" && (
                  <button
                    onClick={() => act(onSuspend)}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-850 transition-colors"
                  >
                    {approval === "suspended" ? "Activate" : "Suspend"}
                  </button>
                )}
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
                    {d.profilePhoto ? (
                      <img src={d.profilePhoto} alt={`${rider.name} profile`} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-zinc-500 font-black text-xl">
                        {String(rider.name || "?").trim().charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className={`absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wide shadow-sm ${getStatusBadge(statusLabel)}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="flex-1 space-y-2 w-full">
                  <div>
                    <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50 tracking-tight">{rider.name}</h2>
                    <p className="text-zinc-400 font-semibold text-[9px] tracking-widest uppercase">RIDER ID: {rider.deliveryId || rider.id}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => phone && (window.location.href = `tel:${phone}`)}
                      className="w-7.5 h-7.5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--primary)] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <Phone size={14} />
                    </button>
                    <button
                      onClick={() => phone && (window.location.href = `sms:${phone}`)}
                      className="w-7.5 h-7.5 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[var(--primary)] hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                    >
                      <MessageSquare size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                      <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wide">Email Address</span>
                      <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-200 break-all">{email || "Not given"}</span>
                    </div>
                    <div className="p-2.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-850 rounded-lg">
                      <span className="text-[9px] text-zinc-400 block uppercase font-bold tracking-wide">Phone Number</span>
                      <span className="text-xs font-semibold text-zinc-850 dark:text-zinc-200">{phone}</span>
                    </div>
                  </div>
                  {(loadingDetails || detailsError || d.rejectionReason) && (
                    <p className={`text-[10px] font-semibold ${detailsError || d.rejectionReason ? "text-rose-500" : "text-zinc-400"}`}>
                      {loadingDetails ? "Loading signup details…" : detailsError || `Reason: ${d.rejectionReason}`}
                    </p>
                  )}
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
                    <div className="flex items-start gap-2">
                      <MapPin size={13} className="text-zinc-400 mt-0.5 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-250">{[d.address, d.city, d.state].filter(Boolean).join(", ") || rider.address || "No address given"}</p>
                        <p className="text-[8px] text-zinc-455 font-bold uppercase tracking-wider">Address (from signup)</p>
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
                    <span className={`text-[8px] px-1.5 py-0.5 rounded font-extrabold tracking-wider border ${approval === "approved" ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"}`}>{approval === "approved" ? "APPROVED" : approval.toUpperCase()}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500 font-medium">Type</span>
                      <span className="font-bold text-zinc-850 dark:text-zinc-150">{d.vehicleType || rider.vehicle}{(d.vehicleName || rider.vehicleModel) ? ` (${d.vehicleName || rider.vehicleModel})` : ""}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500 font-medium">Vehicle Number</span>
                      <span className="font-bold font-mono text-zinc-850 dark:text-zinc-150">{d.vehicleNumber || "—"}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-500 font-medium">License Number</span>
                      <span className="font-bold font-mono text-zinc-850 dark:text-zinc-150">{d.drivingLicenseNumber || rider.licenseNumber || "—"}</span>
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

              {/* Last known location (real GPS fix, if the rider ever shared one) */}
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50">Last Known Location</h4>
                  <span className="text-[9px] text-zinc-400 font-bold">{lastSeen ? `Last seen: ${when(lastSeen)}` : "Never seen in the app"}</span>
                </div>
                <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between gap-3">
                  {hasFix ? (
                    <>
                      <div className="flex items-center gap-2">
                        <Navigation size={14} className="text-[var(--primary)]" />
                        <div>
                          <p className="text-[10px] font-bold text-zinc-800 dark:text-zinc-200">{d.lastLat.toFixed(5)}, {d.lastLng.toFixed(5)}</p>
                          <p className="text-[9px] text-zinc-400 font-semibold">{d.availabilityStatus === "online" ? "Online" : "Offline"} · fix at {when(d.lastLocationAt)}</p>
                        </div>
                      </div>
                      <a href={`https://www.google.com/maps?q=${d.lastLat},${d.lastLng}`} target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold text-[var(--primary)] flex items-center gap-1 hover:underline">
                        Open map <ExternalLink size={11} />
                      </a>
                    </>
                  ) : (
                    <p className="text-[10px] text-zinc-400 font-semibold">No GPS yet. The rider shares a location after approval, when they open the app, allow location and go online.</p>
                  )}
                </div>
              </section>

              {/* Documents uploaded at signup */}
              <section className="space-y-3">
                <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50">Documents</h4>
                <div className="grid grid-cols-2 gap-2">
                  {docs.map((doc) => (
                    <div key={doc.label} className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-1.5">
                      {doc.url ? (
                        <a href={doc.url} target="_blank" rel="noopener noreferrer" className="block h-20 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900">
                          <img src={doc.url} alt={doc.label} className="w-full h-full object-cover hover:scale-105 transition-transform" />
                        </a>
                      ) : (
                        <div className="h-20 rounded-lg bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-[9px] text-zinc-400 font-semibold text-center px-2">
                          {doc.notCollected ? "Not collected at signup" : "Not uploaded"}
                        </div>
                      )}
                      <p className="text-[9px] font-bold text-zinc-700 dark:text-zinc-300">{doc.label}</p>
                      {doc.number && <p className="text-[9px] font-mono text-zinc-400">{doc.number}</p>}
                    </div>
                  ))}
                </div>
              </section>

              {/* Bank details (account number masked) */}
              <section className="space-y-3">
                <div className="flex items-center gap-2 text-[var(--primary)]">
                  <Landmark size={16} />
                  <h4 className="font-bold text-xs text-zinc-900 dark:text-zinc-50">Bank Details</h4>
                </div>
                {bank || d.upiId ? (
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 space-y-1.5 text-[10px]">
                    {[["Account holder", bank?.accountHolderName], ["Bank", bank?.bankName], ["Account number", maskAccount(bank?.accountNumber)], ["IFSC", bank?.ifscCode], ["UPI id", d.upiId]].map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-zinc-500 font-medium">{k}</span>
                        <span className="font-bold font-mono text-zinc-850 dark:text-zinc-150">{v || "—"}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-zinc-400 font-semibold">No bank details yet. Riders add them in the app after approval.</p>
                )}
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
              {approval === "pending" ? (
                <>
                  <button
                    onClick={() => act(onApprove)}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 text-white py-1.5 rounded-lg font-bold text-xs hover:opacity-90 transition-all active:scale-[0.98] shadow-md cursor-pointer"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => act(onReject)}
                    className="flex-1 flex items-center justify-center gap-2 bg-rose-600 text-white py-1.5 rounded-lg font-bold text-xs hover:opacity-90 transition-all active:scale-[0.98] shadow-md cursor-pointer"
                  >
                    Reject
                  </button>
                </>
              ) : approval === "rejected" ? (
                <p className="flex-1 text-center text-[10px] font-semibold text-zinc-400 py-1.5">Rejected. The rider can sign up again with the same phone.</p>
              ) : (
                <button
                  onClick={() => act(onSuspend)}
                  className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 py-1.5 rounded-lg font-bold text-xs hover:opacity-90 transition-all active:scale-[0.98] shadow-md shadow-zinc-900/10 cursor-pointer"
                >
                  {approval === "suspended" ? "Activate Rider" : "Suspend Rider"}
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
