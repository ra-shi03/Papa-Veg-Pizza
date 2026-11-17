import React, { useEffect, useState } from "react"
import { locationAPI } from "@/services/api/location"
import { readSavedCoords } from "@food/utils/savedLocation"

/** Stores within the super admin's radius that offer this order method, nearest first. Calls onChange(store | null). */
export default function PickupStorePicker({ method, value, onChange, textClass = "text-white" }) {
  const [state, setState] = useState("loading") // loading | ready | error | nolocation
  const [stores, setStores] = useState([])
  const [radiusKm, setRadiusKm] = useState(null)

  useEffect(() => {
    let cancelled = false
    const me = readSavedCoords()
    if (!me) { setState("nolocation"); return undefined }
    setState("loading")
    locationAPI.getNearbyStores(me.lat, me.lng, "", method)
      .then((res) => {
        if (cancelled) return
        const list = res?.data?.data?.stores
        if (!Array.isArray(list)) { setState("error"); return }
        setStores(list)
        setRadiusKm(res.data.data.radiusKm || null)
        setState("ready")
        if (list.length && !list.some((s) => String(s._id) === String(value?._id))) onChange(list[0])
      })
      .catch(() => { if (!cancelled) setState("error") })
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [method])

  if (state === "loading") return <p className={`text-xs opacity-60 ${textClass}`}>Finding stores near you...</p>
  if (state === "nolocation") return <p className={`text-xs opacity-60 ${textClass}`}>Set your location to see stores near you.</p>
  if (state === "error") return <p className="text-xs text-red-500">Could not load nearby stores. Please try again.</p>
  if (!stores.length) return <p className={`text-xs opacity-60 ${textClass}`}>No store{radiusKm ? ` within ${radiusKm} km` : ""} of your location offers this.</p>
  return (
    <div className="space-y-1.5">
      <span className={`text-[10px] uppercase opacity-50 font-semibold tracking-wider ${textClass}`}>Store</span>
      <div className="max-h-40 overflow-y-auto space-y-1.5">
        {stores.map((s) => {
          const on = String(value?._id) === String(s._id)
          return (
            <button
              type="button"
              key={s._id}
              onClick={() => onChange(s)}
              className={`w-full text-left px-3 py-2 rounded-xl border text-xs cursor-pointer ${on ? "border-primary bg-primary/10" : "border-white/10 bg-white/5"} ${textClass}`}
            >
              <span className="font-bold">{s.storeName}</span>
              <span className="opacity-60"> · {Number(s.distanceKm).toFixed(1)} km</span>
              {s.address && <span className="block opacity-60 truncate">{s.address}</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}
