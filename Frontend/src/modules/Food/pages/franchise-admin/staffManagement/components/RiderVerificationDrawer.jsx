import React, { useCallback, useEffect, useState } from "react"
import { X, CheckCircle2, XCircle, Ban, UserCheck, ExternalLink, Bike, MapPin, Phone, Mail, FileText } from "lucide-react"
import { adminAPI } from "@food/api"

// Franchise admin: verify a delivery partner and approve, reject (reason required), suspend or activate it.
// Data from GET /food/admin/delivery/:id (franchise view): ID numbers show only their last 4 characters; bank details
// are never sent to a franchise admin.
const errorText = (err) => err?.response?.data?.message || err?.response?.data?.error || err?.message || "That did not work"
const when = (d) => (d ? new Date(d).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "")
const STATUS_STYLE = {
  pending: "bg-sky-50 text-sky-700 border-sky-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  suspended: "bg-rose-50 text-rose-700 border-rose-200",
  rejected: "bg-zinc-100 text-zinc-600 border-zinc-200",
}

export default function RiderVerificationDrawer({ isOpen, riderId, onClose, onChanged }) {
  const [rider, setRider] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [reason, setReason] = useState("")
  const [mode, setMode] = useState(null) // "reject" | "suspend" while the reason box is open

  const load = useCallback(async () => {
    if (!isOpen || !riderId) return
    setLoading(true)
    setError("")
    try {
      const res = await adminAPI.getDeliveryPartnerById(riderId)
      setRider(res?.data?.data?.delivery || null)
    } catch (err) {
      setRider(null)
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }, [isOpen, riderId])

  useEffect(() => {
    setMode(null)
    setReason("")
    load()
  }, [load])

  const run = async (call, done) => {
    setBusy(true)
    setError("")
    try {
      await call()
      setMode(null)
      setReason("")
      onChanged?.(done)
      if (done === "rejected") onClose?.()
      else await load()
    } catch (err) {
      setError(errorText(err))
    } finally {
      setBusy(false)
    }
  }

  if (!isOpen) return null
  const status = rider?.status || ""
  const docs = rider
    ? [
        { label: "Selfie / profile photo", url: rider.profilePhoto },
        { label: "Aadhaar card", url: rider.aadharPhoto, number: rider.aadharNumber },
        { label: "PAN card", url: rider.panPhoto, number: rider.panNumber },
        { label: "Driving licence", url: rider.drivingLicensePhoto, number: rider.drivingLicenseNumber },
      ]
    : []

  return (
    <div className="fixed inset-0 z-[120] flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white dark:bg-zinc-900 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
          <div>
            <h3 className="text-sm font-black text-zinc-900 dark:text-white">Verify Delivery Partner</h3>
            {rider && <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{rider.deliveryId}</p>}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
          {loading && <p className="text-zinc-400 font-semibold">Loading…</p>}
          {error && <p className="text-rose-600 font-bold">{error}</p>}
          {rider && (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-base font-black text-zinc-900 dark:text-white">{rider.name}</p>
                  <p className="text-[10px] text-zinc-400 font-semibold">Signed up {when(rider.createdAt)}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase ${STATUS_STYLE[status] || STATUS_STYLE.rejected}`}>
                  {status === "pending" ? "Pending approval" : status}
                </span>
              </div>

              <section className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <p className="flex items-center gap-2"><Phone size={12} className="text-zinc-400" /> {rider.phone}</p>
                <p className="flex items-center gap-2"><Mail size={12} className="text-zinc-400" /> {rider.email || "No email given"}</p>
                <p className="flex items-center gap-2"><MapPin size={12} className="text-zinc-400" /> {[rider.address, rider.city, rider.state].filter(Boolean).join(", ") || "No address given"}</p>
              </section>

              <section className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1.5">
                <p className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-200"><Bike size={12} /> Vehicle</p>
                {[["Type", rider.vehicleType], ["Name", rider.vehicleName], ["Number", rider.vehicleNumber], ["Licence no.", rider.drivingLicenseNumber], ["Aadhaar no.", rider.aadharNumber], ["PAN no.", rider.panNumber]].map(([k, v]) => (
                  <div key={k} className="flex justify-between"><span className="text-zinc-500">{k}</span><span className="font-bold font-mono">{v || "—"}</span></div>
                ))}
              </section>

              <section className="space-y-2">
                <p className="flex items-center gap-2 font-bold text-zinc-700 dark:text-zinc-200"><FileText size={12} /> Documents</p>
                <div className="grid grid-cols-2 gap-2">
                  {docs.map((d) => (
                    <div key={d.label} className="p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-1">
                      {d.url ? (
                        <a href={d.url} target="_blank" rel="noopener noreferrer" className="block h-24 rounded-lg overflow-hidden bg-zinc-100">
                          <img src={d.url} alt={d.label} className="w-full h-full object-cover" />
                        </a>
                      ) : (
                        <div className="h-24 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] text-zinc-400 font-semibold">Not uploaded</div>
                      )}
                      <p className="text-[10px] font-bold flex items-center justify-between">
                        {d.label}
                        {d.url && <ExternalLink size={10} className="text-zinc-400" />}
                      </p>
                      {d.number && <p className="text-[10px] font-mono text-zinc-400">{d.number}</p>}
                    </div>
                  ))}
                </div>
              </section>

              {(rider.rejectionReason || rider.suspensionReason) && (
                <p className="text-rose-600 font-semibold">Reason: {rider.suspensionReason || rider.rejectionReason}</p>
              )}
              {rider.approvalHistory?.length > 0 && (
                <section className="space-y-1">
                  <p className="font-bold text-zinc-700 dark:text-zinc-200">History</p>
                  {rider.approvalHistory.map((h, i) => (
                    <p key={i} className="text-[10px] text-zinc-500">{when(h.at)} · {h.action}{h.reason ? ` · ${h.reason}` : ""}</p>
                  ))}
                </section>
              )}

              {mode && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-zinc-500">
                    {mode === "reject" ? "Reason for rejection (the rider sees it)" : "Reason for suspension (optional)"}
                  </label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500}
                    className="w-full p-2 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-xs" />
                </div>
              )}
            </>
          )}
        </div>

        {rider && (
          <div className="p-3 border-t border-zinc-200 dark:border-zinc-800 flex gap-2">
            {status === "pending" && !mode && (
              <>
                <button disabled={busy} onClick={() => run(() => adminAPI.approveDeliveryPartner(rider._id), "approved")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-60"><CheckCircle2 size={14} /> Approve</button>
                <button disabled={busy} onClick={() => setMode("reject")}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold disabled:opacity-60"><XCircle size={14} /> Reject</button>
              </>
            )}
            {status === "approved" && !mode && (
              <button disabled={busy} onClick={() => setMode("suspend")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zinc-900 text-white text-xs font-bold disabled:opacity-60"><Ban size={14} /> Suspend</button>
            )}
            {status === "suspended" && (
              <button disabled={busy} onClick={() => run(() => adminAPI.activateDeliveryPartner(rider._id), "activated")}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-bold disabled:opacity-60"><UserCheck size={14} /> Activate</button>
            )}
            {mode && (
              <>
                <button disabled={busy} onClick={() => { setMode(null); setReason("") }} className="flex-1 py-2 rounded-lg border border-zinc-200 dark:border-zinc-800 text-xs font-bold">Cancel</button>
                <button
                  disabled={busy || (mode === "reject" && !reason.trim())}
                  onClick={() => run(
                    () => (mode === "reject" ? adminAPI.rejectDeliveryPartner(rider._id, reason) : adminAPI.suspendDeliveryPartner(rider._id, reason)),
                    mode === "reject" ? "rejected" : "suspended",
                  )}
                  className="flex-1 py-2 rounded-lg bg-rose-600 text-white text-xs font-bold disabled:opacity-60"
                >
                  {mode === "reject" ? "Confirm rejection" : "Confirm suspension"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
