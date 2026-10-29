import { useCallback, useEffect, useState } from "react"
import { adminAPI } from "@food/api"
import { STANDALONE_MOCK } from "@/services/api/mockPolicy"

const errorText = (err) =>
  err?.response?.data?.message || err?.response?.data?.error || err?.message || "Could not load delivery partners"

/** Server rider -> the row the Delivery Partners screen renders. */
export function toRiderRow(p, { storeNames = new Map(), franchiseNames = new Map() } = {}) {
  const pending = p.status === "pending"
  const status = pending
    ? "Pending"
    : p.status === "suspended"
      ? "Suspended"
      : p.activeOrders > 0
        ? "Busy"
        : p.availability === "online"
          ? "Online"
          : "Offline"
  const storeId = p.storeId ? String(p.storeId) : ""
  const franchiseId = p.franchiseId ? String(p.franchiseId) : ""
  return {
    id: String(p._id),
    deliveryId: p.deliveryId || `DP-${String(p._id).slice(-8).toUpperCase()}`,
    name: p.name || "",
    email: p.email || "",
    phone: p.phone || "",
    store: storeNames.get(storeId) || p.zone || "Not assigned",
    franchise: franchiseNames.get(franchiseId) || "",
    vehicle: p.vehicleType || "",
    vehicleModel: p.vehicleName || "",
    licenseNumber: "",
    totalOrders: p.totalOrders || 0,
    completedOrders: p.totalOrders || 0,
    cancelledOrders: "-",
    rating: p.rating ?? 0,
    status,
    address: p.zone || "",
    storeManager: "",
    priorityRouting: false,
    recentDeliveries: [],
  }
}

/**
 * The super admin's delivery partners: approved and suspended riders (/food/admin/delivery/partners) plus pending
 * signups (/food/admin/delivery/join-requests), with the real store and franchise lists for the filters.
 */
export default function useDeliveryPartnerRows(initialRiders = []) {
  const [riders, setRiders] = useState(STANDALONE_MOCK ? initialRiders : [])
  const [stores, setStores] = useState([])
  const [franchises, setFranchises] = useState([])
  const [loading, setLoading] = useState(!STANDALONE_MOCK)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    if (STANDALONE_MOCK) return
    setLoading(true)
    setError("")
    try {
      const [partnersRes, pendingRes, storesRes, franchisesRes] = await Promise.all([
        adminAPI.getDeliveryPartners({ status: "approved,suspended", limit: 1000 }),
        adminAPI.getDeliveryPartnerJoinRequests({ status: "pending", limit: 1000 }),
        adminAPI.getStores({ limit: 1000 }).catch(() => null),
        adminAPI.getFranchises().catch(() => null),
      ])
      const storeList = storesRes?.data?.data?.stores || []
      const franchiseList = Array.isArray(franchisesRes?.data?.data) ? franchisesRes.data.data : []
      const storeNames = new Map(storeList.map((s) => [String(s._id), s.storeName]))
      const franchiseNames = new Map(franchiseList.map((f) => [String(f._id), f.name]))
      const approved = partnersRes?.data?.data?.deliveryPartners || []
      const pending = (pendingRes?.data?.data?.requests || []).map((r) => ({ ...r, status: "pending", zone: r.zone, vehicleType: r.vehicleType }))
      setRiders([...pending, ...approved].map((p) => toRiderRow(p, { storeNames, franchiseNames })))
      setStores(storeList.map((s) => s.storeName).filter(Boolean))
      setFranchises(franchiseList.map((f) => f.name).filter(Boolean))
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

  return { riders, setRiders, stores, franchises, loading, error, reload }
}
