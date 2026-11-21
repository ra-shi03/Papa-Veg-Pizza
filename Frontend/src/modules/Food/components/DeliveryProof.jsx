import React from "react"

const fmt = (v) => (v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "")

/**
 * What the delivery partner recorded for an order: the bill photo taken at the store and the handover photo taken at the
 * door, with the times. Same block in the store, franchise admin and super admin order views.
 * `proof` = { billImageUrl, billImageAt, handoverPhotoUrl, handoverPhotoAt, dropOtpVerified, pickedUpAt, deliveredAt }.
 */
export default function DeliveryProof({ proof, className = "" }) {
  const p = proof || {}
  const photos = [
    { key: "bill", label: "Bill photo (at the store)", url: p.billImageUrl, at: p.billImageAt || p.pickedUpAt },
    { key: "door", label: "Handover photo (at the door)", url: p.handoverPhotoUrl, at: p.handoverPhotoAt || p.deliveredAt },
  ]
  return (
    <div className={`space-y-2 ${className}`} data-testid="delivery-proof">
      <span className="text-zinc-400 block text-[11px] font-semibold">Delivery proof</span>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((ph) => (
          <div key={ph.key} className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-2">
            <span className="block text-[10px] font-bold text-zinc-500 mb-1">{ph.label}</span>
            {ph.url ? (
              <a href={ph.url} target="_blank" rel="noreferrer">
                <img src={ph.url} alt={ph.label} className="w-full h-24 object-cover rounded-lg bg-zinc-100" />
              </a>
            ) : (
              <div className="h-24 rounded-lg bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-[10px] text-zinc-400 font-semibold">Not uploaded yet</div>
            )}
            {ph.url && ph.at ? <span className="block text-[9px] text-zinc-400 mt-1">{fmt(ph.at)}</span> : null}
          </div>
        ))}
      </div>
      {p.dropOtpVerified ? <span className="text-[10px] font-bold text-emerald-600">Customer code verified at the door</span> : null}
    </div>
  )
}
