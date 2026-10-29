import { useCallback, useEffect, useState } from "react"
import { adminAPI } from "@food/api"
import { STANDALONE_MOCK } from "@/services/api/mockPolicy"

const errorText = (err) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || "Could not load delivery partners"

/** Server rider (franchise view: masked phone, no documents) -> the row the Delivery Partners screen renders. */
export function toFranchiseRiderRow(p) {
  const status = p.status === "pending"
    ? "Pending approval"
    : p.status === "suspended"
      ? "Suspended"
      : p.activeOrders > 0
        ? "Busy"
        : p.availability === "online"
          ? "Online"
          : "Offline"
  return {
    id: String(p._id),
    employeeCode: p.deliveryId || `DP-${String(p._id).slice(-8).toUpperCase()}`,
    name: p.name || "",
    email: "",
    phone: p.phone || "",
    status,
    availability: status === "Online" || status === "Busy" ? "Available" : "Unavailable",
    storeId: (p.storeIds && p.storeIds[0]) || "",
    storeNames: p.storeNames || [],
    area: p.zone || "",
    vehicleType: p.vehicleType || "",
    // the small grey line under the vehicle type: the rider's area and when they were last seen (never a plate number)
    vehicleNumber: [p.zone, p.lastSeen ? `seen ${new Date(p.lastSeen).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""].filter(Boolean).join(" · "),
    profileImage: "/rider_alex.webp",
    rating: p.rating || 0,
    ordersToday: p.ordersToday || 0,
    totalOrders: p.totalOrders || 0,
    lastSeen: p.lastSeen || null,
  }
}

/** The stat cards from the real rows; numbers the server does not have are null (the card shows a dash). */
export function riderKpis(rows) {
  const rated = rows.filter((r) => r.rating > 0)
  return {
    totalRiders: rows.length,
    onlineRiders: rows.filter((r) => r.status === "Online").length,
    busyRiders: rows.filter((r) => r.status === "Busy").length,
    deliveredToday: rows.reduce((sum, r) => sum + (r.ordersToday || 0), 0),
    avgDeliveryTime: null,
    avgRating: rated.length ? Math.round((rated.reduce((s, r) => s + r.rating, 0) / rated.length) * 10) / 10 : 0,
    todayEarnings: null,
    cancelledDeliveries: null,
  }
}

/**
 * The franchise admin's delivery partners: GET /food/admin/delivery/partners, already limited by the server to riders
 * near or working for this franchise's stores. Sample riders only with VITE_STANDALONE_MOCK=true.
 */
export default function useFranchiseRiders(initialRiders = []) {
  const [riders, setRiders] = useState(STANDALONE_MOCK ? initialRiders : [])
  const [stores, setStores] = useState([])
  const [loading, setLoading] = useState(!STANDALONE_MOCK)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    if (STANDALONE_MOCK) return
    setLoading(true)
    setError("")
    try {
      const res = await adminAPI.getDeliveryPartners({ limit: 1000 })
      const data = res?.data?.data || {}
      setRiders((data.deliveryPartners || []).map(toFranchiseRiderRow))
      setStores(data.stores || [])
    } catch (err) {
      setRiders([])
      setError(errorText(err))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  return { riders, setRiders, stores, loading, error, reload }
}
