import React, { useEffect, useMemo, useState } from "react"
import { CheckCircle2, Loader2, MapPin, Store, Truck, ShoppingBag, Phone, ListChecks } from "lucide-react"
import { toast } from "sonner"
import apiClient, { userClient } from "@/services/api/axios"
import { locationAPI } from "@/services/api/location"
import { readSavedCoords } from "@food/utils/savedLocation"

const field =
  "w-full h-12 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-4 text-sm text-zinc-900 dark:text-white outline-none focus:border-[#E53935] focus:ring-2 focus:ring-[#E53935]/15 transition-colors placeholder:text-zinc-400"
const label = "block text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5"

const isSignedIn = () => {
  try {
    return localStorage.getItem("user_authenticated") === "true" || !!localStorage.getItem("user_accessToken")
  } catch (_) {
    return false
  }
}

const readStoredUser = () => {
  try {
    const u = JSON.parse(localStorage.getItem("currentUser") || localStorage.getItem("user_user") || "null") || {}
    return {
      name: u.name || u.fullName || "",
      phone: String(u.phone || u.mobile || "").replace(/\D/g, "").slice(-10),
      email: u.email || "",
    }
  } catch (_) {
    return { name: "", phone: "", email: "" }
  }
}

const today = () => new Date().toISOString().slice(0, 10)

/**
 * The request form. Virtual Party: the customer picks a store near them, takeaway or delivery (with an address), the date
 * and the party size; the store confirms it. E-Gift Voucher: a plain inquiry for the corporate desk (no store).
 */
export default function BulkOrderForm({ type, partyOptions = [], voucherOptions = [], onTrack, contactPhone }) {
  const isParty = type === "virtual_party"
  const isOther = (v) => /^other$/i.test(String(v || "").trim())
  const stored = useMemo(readStoredUser, [])
  const [f, setF] = useState({
    name: stored.name,
    organisation: "",
    phone: stored.phone,
    email: stored.email,
    eventDate: "",
    eventTime: "",
    partySize: "",
    partySizeOther: "",
    query: "",
    fulfilment: "takeaway",
    street: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
  })
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }))
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(null)

  // Stores near the customer (within the radius the super admin set), nearest first
  const [stores, setStores] = useState([])
  const [storeState, setStoreState] = useState("loading") // loading | ready | nolocation | error
  const [radiusKm, setRadiusKm] = useState(null)
  const [storeId, setStoreId] = useState("")

  useEffect(() => {
    if (!isParty) return undefined
    let cancelled = false
    const load = async (point) => {
      try {
        const res = await locationAPI.getNearbyStores(point.lat, point.lng)
        if (cancelled) return
        const list = res?.data?.data?.stores
        if (!Array.isArray(list)) { setStoreState("error"); return }
        setStores(list)
        setRadiusKm(res.data.data.radiusKm || null)
        setStoreState("ready")
        if (list.length) setStoreId((cur) => cur || String(list[0]._id))
      } catch (_) {
        if (!cancelled) setStoreState("error")
      }
    }
    const saved = readSavedCoords()
    if (saved) {
      load(saved)
    } else if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => load({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { if (!cancelled) setStoreState("nolocation") },
        { timeout: 6000 }
      )
    } else {
      setStoreState("nolocation")
    }
    return () => { cancelled = true }
  }, [isParty])

  const validate = () => {
    const e = {}
    if (f.name.trim().length < 2) e.name = "Enter your name"
    if (!/^\d{10}$/.test(f.phone.replace(/\D/g, "").slice(-10))) e.phone = "Enter a valid 10-digit number"
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) e.email = "Enter a valid email address"
    if (isOther(f.partySize) && !f.partySizeOther.trim()) e.partySizeOther = "Tell us how many people or what you need"
    if (isParty) {
      if (!storeId) e.store = "Choose a store near you"
      if (!f.eventDate) e.eventDate = "Choose the date"
      if (f.fulfilment === "delivery") {
        if (!f.street.trim()) e.street = "Enter the delivery address"
        if (!f.city.trim()) e.city = "Enter the city"
      }
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submit = async (ev) => {
    ev.preventDefault()
    if (!validate()) {
      toast.error("Please check the highlighted fields")
      return
    }
    setSubmitting(true)
    try {
      const body = {
        name: f.name.trim(),
        organisation: f.organisation.trim(),
        phone: f.phone.replace(/\D/g, "").slice(-10),
        email: f.email.trim(),
        eventDate: f.eventDate,
        eventTime: f.eventTime,
        partySize: isOther(f.partySize) ? `Other: ${f.partySizeOther.trim()}` : f.partySize,
        query: f.query.trim(),
        type,
        ...(isParty
          ? {
              storeId,
              fulfilment: f.fulfilment,
              ...(f.fulfilment === "delivery"
                ? { address: { street: f.street.trim(), landmark: f.landmark.trim(), city: f.city.trim(), state: f.state.trim(), pincode: f.pincode.trim() } }
                : {}),
            }
          : {}),
      }
      // A signed-in customer's request is linked to them, so they can follow it under My Orders
      const client = isSignedIn() ? userClient : apiClient
      const res = await client.post("/food/bulk-order/inquiry", body)
      setDone(res?.data?.data || { reference: "" })
    } catch (err) {
      toast.error(err?.response?.data?.message || err?.response?.data?.error || "Could not send your request. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  const Err = ({ k }) => (errors[k] ? <p className="mt-1 text-[11px] font-semibold text-[#E53935]">{errors[k]}</p> : null)

  if (done) {
    return (
      <div className="py-8 text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-lg font-extrabold text-zinc-900 dark:text-white m-0">{isParty ? "Request sent to the store" : "Inquiry received"}</h3>
        {done.reference && (
          <p className="m-0 text-sm text-zinc-500">
            Your reference <span className="font-extrabold text-zinc-900 dark:text-white tracking-wider">{done.reference}</span>
          </p>
        )}
        <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto leading-relaxed">
          {isParty
            ? `${done.storeName || "The store"} will review it and confirm. We have emailed you the details and will email you at every step.`
            : "Our corporate desk will contact you shortly. We have emailed you a confirmation."}
        </p>
        <div className="flex flex-col gap-2 pt-2 max-w-xs mx-auto">
          {isParty && isSignedIn() && (
            <button type="button" onClick={onTrack} className="h-11 rounded-xl bg-[#E53935] text-white text-sm font-bold border-0 cursor-pointer flex items-center justify-center gap-2">
              <ListChecks className="w-4 h-4" /> Track my order
            </button>
          )}
          <button type="button" onClick={() => setDone(null)} className="h-11 rounded-xl border border-zinc-300 dark:border-zinc-700 text-sm font-bold bg-transparent text-zinc-700 dark:text-zinc-200 cursor-pointer">
            Place another request
          </button>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-5" noValidate>
      {isParty && (
        <>
          {/* 1. Store */}
          <div>
            <span className={label}>1. Choose a store near you</span>
            {storeState === "loading" && <p className="text-xs text-zinc-500 flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Finding stores near you...</p>}
            {storeState === "nolocation" && (
              <p className="text-xs text-zinc-500">Set your delivery location first (from the home page) so we can show stores near you.</p>
            )}
            {storeState === "error" && <p className="text-xs text-[#E53935]">Could not load nearby stores. Please try again.</p>}
            {storeState === "ready" && stores.length === 0 && (
              <p className="text-xs text-zinc-500">No store{radiusKm ? ` within ${radiusKm} km` : ""} of your location is available right now.</p>
            )}
            <div className="space-y-2">
              {stores.map((s) => {
                const on = String(s._id) === storeId
                return (
                  <button
                    type="button"
                    key={s._id}
                    onClick={() => { setStoreId(String(s._id)); setErrors((p) => ({ ...p, store: "" })) }}
                    className={`w-full text-left rounded-xl border px-4 py-3 flex items-center gap-3 cursor-pointer transition-all ${on ? "border-[#E53935] bg-[#E53935]/5 ring-2 ring-[#E53935]/15" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"}`}
                  >
                    <span className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${on ? "bg-[#E53935] text-white" : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500"}`}><Store className="w-4 h-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-bold text-zinc-900 dark:text-white leading-snug break-words">{s.storeName}</span>
                      <span className="block text-[11px] text-zinc-500 truncate">{s.address}</span>
                    </span>
                    <span className="text-[11px] font-bold text-[#E53935] shrink-0 flex items-center gap-1"><MapPin className="w-3 h-3" />{Number(s.distanceKm).toFixed(1)} km</span>
                  </button>
                )
              })}
            </div>
            <Err k="store" />
          </div>

          {/* 2. Takeaway or delivery */}
          <div>
            <span className={label}>2. How do you want it?</span>
            <div className="grid grid-cols-2 gap-2">
              {[{ id: "takeaway", t: "Takeaway", d: "Collect from the store", I: ShoppingBag }, { id: "delivery", t: "Delivery", d: "To your address", I: Truck }].map(({ id, t, d, I }) => (
                <button
                  type="button"
                  key={id}
                  onClick={() => set("fulfilment", id)}
                  className={`rounded-xl border px-3 py-3 text-left cursor-pointer transition-all ${f.fulfilment === id ? "border-[#E53935] bg-[#E53935]/5 ring-2 ring-[#E53935]/15" : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900"}`}
                >
                  <I className={`w-5 h-5 mb-1 ${f.fulfilment === id ? "text-[#E53935]" : "text-zinc-500"}`} />
                  <span className="block text-sm font-bold text-zinc-900 dark:text-white">{t}</span>
                  <span className="block text-[11px] text-zinc-500">{d}</span>
                </button>
              ))}
            </div>
          </div>

          {f.fulfilment === "delivery" && (
            <div className="space-y-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 p-4">
              <span className={label}>Delivery address</span>
              <div>
                <input className={field} placeholder="House / flat, street" value={f.street} onChange={(e) => set("street", e.target.value)} />
                <Err k="street" />
              </div>
              <input className={field} placeholder="Landmark (optional)" value={f.landmark} onChange={(e) => set("landmark", e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <input className={field} placeholder="City" value={f.city} onChange={(e) => set("city", e.target.value)} />
                  <Err k="city" />
                </div>
                <input className={field} placeholder="Pincode" inputMode="numeric" maxLength={6} value={f.pincode} onChange={(e) => set("pincode", e.target.value.replace(/\D/g, ""))} />
              </div>
              <input className={field} placeholder="State" value={f.state} onChange={(e) => set("state", e.target.value)} />
            </div>
          )}

          {/* 3. When and how many */}
          <div>
            <span className={label}>3. When and how many</span>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <input type="date" min={today()} className={field} value={f.eventDate} onChange={(e) => set("eventDate", e.target.value)} aria-label="Date" />
                <Err k="eventDate" />
              </div>
              <input type="time" className={field} value={f.eventTime} onChange={(e) => set("eventTime", e.target.value)} aria-label="Time" />
            </div>
            {partyOptions.length > 0 && (
              <select className={`${field} mt-3`} value={f.partySize} onChange={(e) => set("partySize", e.target.value)}>
                <option value="">Party size</option>
                {partyOptions.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            )}
            {isOther(f.partySize) && (
              <div className="mt-3">
                <input className={field} placeholder="Tell us your party size or requirement" maxLength={100} value={f.partySizeOther} onChange={(e) => set("partySizeOther", e.target.value)} autoFocus />
                <Err k="partySizeOther" />
              </div>
            )}
          </div>
        </>
      )}

      {!isParty && voucherOptions.length > 0 && (
        <div>
          <span className={label}>How many vouchers</span>
          <select className={field} value={f.partySize} onChange={(e) => set("partySize", e.target.value)}>
            <option value="">Select</option>
            {voucherOptions.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
          {isOther(f.partySize) && (
            <div className="mt-3">
              <input className={field} placeholder="Tell us how many vouchers you need" maxLength={100} value={f.partySizeOther} onChange={(e) => set("partySizeOther", e.target.value)} autoFocus />
              <Err k="partySizeOther" />
            </div>
          )}
        </div>
      )}

      {/* About you */}
      <div className="space-y-3">
        <span className={label}>{isParty ? "4. About you" : "About you"}</span>
        <div>
          <input className={field} placeholder="Name*" value={f.name} onChange={(e) => set("name", e.target.value)} autoComplete="name" />
          <Err k="name" />
        </div>
        <input className={field} placeholder={isParty ? "Organisation (optional)" : "Organisation"} value={f.organisation} onChange={(e) => set("organisation", e.target.value)} />
        <div className="grid grid-cols-1 gap-3">
          <div>
            <input className={field} placeholder="Contact number*" inputMode="tel" maxLength={14} value={f.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" />
            <Err k="phone" />
          </div>
          <div>
            <input className={field} type="email" placeholder="Email*" value={f.email} onChange={(e) => set("email", e.target.value)} autoComplete="email" />
            <Err k="email" />
          </div>
        </div>
        <textarea
          className={`${field} h-28 py-3 resize-none`}
          placeholder={isParty ? "What would you like? (pizzas, quantity, any special request)" : "Your query"}
          value={f.query}
          maxLength={2000}
          onChange={(e) => set("query", e.target.value)}
        />
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full h-12 rounded-xl bg-[#E53935] hover:bg-[#d32f2f] text-white text-sm font-extrabold tracking-wide border-0 cursor-pointer shadow-md shadow-[#E53935]/25 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : isParty ? "Send request to the store" : "Submit inquiry"}
      </button>
      <p className="text-center text-[11px] text-zinc-500 m-0">
        {isParty ? "The store confirms the price and timing. You pay when you collect or receive the order." : "Our corporate desk will get back to you."}
        {contactPhone && (
          <a href={`tel:${String(contactPhone).replace(/\s+/g, "")}`} className="ml-1 font-bold text-[#E53935] inline-flex items-center gap-1"><Phone className="w-3 h-3" />Call us</a>
        )}
      </p>
    </form>
  )
}
