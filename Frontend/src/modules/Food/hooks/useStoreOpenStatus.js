import { useEffect, useState } from "react"
import { userClient } from "@/services/api/axios"
import { readSavedCoords, readPickupStore } from "@food/utils/savedLocation"

const DEFAULT_STATE = {
  isOpen: true,
  storeOpen: true,
  openTime: "10:00 AM",
  closeTime: "11:00 PM",
  storeTiming: "10:00 AM - 11:00 PM",
}

// Is the store serving this customer taking orders right now, and what are its dynamic store hours?
// (GET /food/stores/status: hours, temporary closure and the store manager's Open / Closed switch.)
// Re-checked every 30 seconds and when the app comes back into view.
export const useStoreOpenStatus = () => {
  const [status, setStatus] = useState(() => {
    try {
      const cached = localStorage.getItem("store_open_status")
      if (cached) {
        const parsed = JSON.parse(cached)
        const open = parsed.isOpen ?? parsed.switchOn ?? true
        return {
          isOpen: open,
          storeOpen: open,
          openTime: parsed.openTime || "10:00 AM",
          closeTime: parsed.closeTime || "11:00 PM",
          storeTiming: parsed.storeTiming || "10:00 AM - 11:00 PM",
        }
      }
    } catch (_) {}
    return DEFAULT_STATE
  })

  useEffect(() => {
    let current = true
    const run = async () => {
      try {
        const pickup = readPickupStore()
        const savedStoreId = localStorage.getItem("user_storeId")
        const p = readSavedCoords()

        const params = { includeHours: 1 }
        if (pickup?.id) {
          params.storeId = pickup.id
        } else if (savedStoreId) {
          params.storeId = savedStoreId
        } else if (p && Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
          params.lat = p.lat
          params.lng = p.lng
        } else {
          params.fallback = 1
        }

        const res = await userClient.get("/food/stores/status", { params, _isFallback: true })
        const d = res?.data?.data
        if (current && d) {
          const isOpen = d.serviceable ? d.isOpen !== false : true
          const openTime = d.openTime || "10:00 AM"
          const closeTime = d.closeTime || "11:00 PM"
          const storeTiming = d.storeTiming || `${openTime} - ${closeTime}`

          const next = {
            isOpen,
            storeOpen: isOpen,
            openTime,
            closeTime,
            storeTiming,
          }
          setStatus(next)
          try {
            localStorage.setItem("store_open_status", JSON.stringify({ ...next, updatedAt: Date.now() }))
          } catch (_) {}
        }
      } catch (_) {
        // preserve current state on transient errors
      }
    }

    run()
    const timer = setInterval(run, 30000)
    window.addEventListener("focus", run)
    window.addEventListener("storage", run)
    window.addEventListener("storeStatusChanged", (e) => {
      if (e?.detail) {
        setStatus((prev) => ({
          ...prev,
          isOpen: e.detail.isOpen ?? prev.isOpen,
          storeOpen: e.detail.isOpen ?? prev.storeOpen,
          openTime: e.detail.openTime || prev.openTime,
          closeTime: e.detail.closeTime || prev.closeTime,
          storeTiming: e.detail.storeTiming || prev.storeTiming,
        }))
      } else {
        run()
      }
    })
    return () => {
      current = false
      clearInterval(timer)
      window.removeEventListener("focus", run)
      window.removeEventListener("storage", run)
    }
  }, [])

  return status
}
