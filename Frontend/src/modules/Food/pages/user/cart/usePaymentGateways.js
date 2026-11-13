import { useEffect, useState } from "react"
import apiClient from "@/services/api/axios"

// The online payment methods the super admin has switched on (Settings > Payment Gateways). No keys here, only
// names and mode. Shared by the cart, checkout and the payment options page, and asked again at most once a minute.
let cache = { at: 0, list: [] }
let inflight = null

export function loadPaymentGateways(force = false) {
  if (!force && cache.at && Date.now() - cache.at < 60000) return Promise.resolve(cache.list)
  if (!inflight) {
    inflight = apiClient
      .get("/settings/payment-gateways/public", { _isFallback: true })
      .then((res) => {
        const list = res?.data?.data
        cache = { at: Date.now(), list: Array.isArray(list) ? list : [] }
        return cache.list
      })
      .catch(() => cache.list)
      .finally(() => { inflight = null })
  }
  return inflight
}

export function usePaymentGateways() {
  const [gateways, setGateways] = useState(cache.list)
  useEffect(() => {
    let alive = true
    // Always ask again when a screen opens or the tab is shown again, so switching a gateway on or off in the
    // admin panel shows up without a refresh.
    const refresh = () => loadPaymentGateways(true).then((list) => { if (alive) setGateways(list) })
    refresh()
    const onVisible = () => { if (document.visibilityState === "visible") refresh() }
    document.addEventListener("visibilitychange", onVisible)
    window.addEventListener("focus", refresh)
    return () => {
      alive = false
      document.removeEventListener("visibilitychange", onVisible)
      window.removeEventListener("focus", refresh)
    }
  }, [])
  return gateways
}
