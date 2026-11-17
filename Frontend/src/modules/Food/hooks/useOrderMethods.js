import { useEffect, useState } from "react"
import { orderAPI } from "@food/api"
import { readSavedCoords } from "@food/utils/savedLocation"

// The order methods the super admin offers at the store serving this customer, from the server. One request is shared
// by every component that asks within a few seconds. null while loading or when the server could not be reached.
let cache = { key: "", at: 0, promise: null }
const TTL_MS = 5000

const load = () => {
  const p = readSavedCoords()
  const key = p ? `${p.lat},${p.lng}` : "none"
  if (cache.promise && cache.key === key && Date.now() - cache.at < TTL_MS) return cache.promise
  const promise = orderAPI.getOrderMethods().catch((e) => {
    cache = { key: "", at: 0, promise: null }
    throw e
  })
  cache = { key, at: Date.now(), promise }
  return promise
}

export const useOrderMethods = () => {
  const [methods, setMethods] = useState(null)
  useEffect(() => {
    let current = true
    const run = () => load().then((m) => current && setMethods(m)).catch(() => current && setMethods(null))
    run()
    window.addEventListener("focus", run)
    window.addEventListener("storage", run)
    return () => {
      current = false
      window.removeEventListener("focus", run)
      window.removeEventListener("storage", run)
    }
  }, [])
  return methods
}

/** true only when the server says this method is on for the customer's store; false while loading or off. */
export const useMethodOffered = (id) => {
  const methods = useOrderMethods()
  return Boolean(methods?.some((m) => m.id === id && m.enabled))
}
