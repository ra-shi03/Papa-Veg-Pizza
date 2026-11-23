// The super admin's order screens on real data: GET /food/admin/orders (list) and /food/admin/orders/:id (one order),

import { adminAPI } from "@food/api"

const STATUS = {
  created: "Placed", confirmed: "Confirmed", preparing: "Preparing", ready_for_pickup: "Packed", reached_pickup: "Packed",
  picked_up: "Out For Delivery", reached_drop: "Out For Delivery", delivered: "Delivered",
  cancelled_by_user: "Cancelled", cancelled_by_store: "Cancelled", cancelled_by_admin: "Cancelled", cancelled: "Cancelled",
}
const ROLE = { USER: "Customer", STORE: "Store", STORE_MANAGER: "Store Manager", KITCHEN_STAFF: "Kitchen Staff", DELIVERY_PARTNER: "Rider", ADMIN: "Admin", SYSTEM: "System" }
const METHOD = { cash: "COD", wallet: "Wallet", razorpay: "Online", razorpay_qr: "QR" }
const num = (v) => Number(v) || 0

const idOf = (v) => (v && typeof v === "object" ? String(v._id || "") : String(v || ""))
const statusOf = (o) => {
  const s = STATUS[o.orderStatus] || "Placed"
  return s === "Packed" && idOf(o.dispatch?.deliveryPartnerId) ? "Assigned" : s
}

/** What the rider recorded on the way (photos and times), for the delivery proof block. */
export const proofOf = (o) => ({
  billImageUrl: o.deliveryState?.billImageUrl || "",
  billImageAt: o.deliveryState?.billImageAt || null,
  handoverPhotoUrl: o.deliveryVerification?.handoverPhotoUrl || "",
  handoverPhotoAt: o.deliveryVerification?.handoverPhotoAt || null,
  dropOtpVerified: o.deliveryVerification?.dropOtp?.verified === true,
  pickedUpAt: o.deliveryState?.pickedUpAt || null,
  deliveredAt: o.deliveryState?.deliveredAt || null,
})

export function toAdminOrder(o, { franchises = new Map(), stores = new Map() } = {}) {
  const pricing = o.pricing || {}
  const pay = o.payment || {}
  const addr = o.deliveryAddress || {}
  const [lng, lat] = addr.location?.coordinates || []
  const storeId = idOf(o.storeId)
  const st = stores.get(storeId) || (typeof o.storeId === "object" ? o.storeId : {}) || {}
  const franchiseId = idOf(o.franchiseId) || String(st.franchiseId || "")
  const partner = o.dispatch?.deliveryPartnerId && typeof o.dispatch.deliveryPartnerId === "object" ? o.dispatch.deliveryPartnerId : null
  const items = (o.items || []).map((i, idx) => {
    const qty = num(i.quantity) || 1
    return { _id: `${o._id}-${idx}`, productName: i.name || "Item", variant: [i.size, i.crust].filter(Boolean).join(" / "), quantity: qty, unitPrice: num(i.price), taxAmount: 0, subtotal: num(i.price) * qty }
  })
  return {
    _id: String(o._id),
    orderNumber: o.order_id || o.orderId || String(o._id),
    customerId: idOf(o.userId),
    franchiseId,
    storeId,
    deliveryPartnerId: partner ? String(partner._id || "") : idOf(o.dispatch?.deliveryPartnerId),
    subtotal: num(pricing.subtotal),
    taxAmount: num(pricing.tax),
    discountAmount: num(pricing.discount),
    deliveryFee: num(pricing.deliveryFee),
    grandTotal: num(pricing.total),
    orderType: o.isPickup === true ? "Pickup" : "Delivery",
    paymentMethod: METHOD[pay.method] || pay.method || "",
    paymentStatus: pay.status === "paid" ? "Paid" : pay.status === "refunded" ? "Refunded" : pay.status === "failed" ? "Failed" : "Pending",
    orderStatus: statusOf(o),
    couponCode: pricing.couponCode || "",
    specialInstructions: o.note || "",
    createdAt: o.createdAt,
    eta: o.kitchen?.expectedReadyAt ? new Date(o.kitchen.expectedReadyAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "",
    customer: {
      _id: idOf(o.userId),
      name: o.customerName || o.userId?.name || o.userId?.fullName || "Customer",
      phone: o.customerPhone || o.userId?.phone || "",
      email: o.customerEmail || o.userId?.email || "",
      address: [addr.street, addr.city, addr.state, addr.zipCode].filter(Boolean).join(", "),
      lat: Number.isFinite(lat) ? lat : undefined,
      lng: Number.isFinite(lng) ? lng : undefined,
    },
    store: { _id: storeId, name: st.storeName || st.name || "Store", phone: st.phone || "", address: st.address || [st.area, st.city].filter(Boolean).join(", "), city: st.city || "", manager: "", timings: "", prepEta: "", lat: st.latitude, lng: st.longitude },
    franchise: { _id: franchiseId, name: franchises.get(franchiseId)?.name || "", city: franchises.get(franchiseId)?.city || "" },
    deliveryPartner: partner ? { _id: String(partner._id || ""), name: partner.name || partner.fullName || "", phone: partner.phone || "", vehicleNumber: partner.vehicleNumber || "", currentLat: o.lastRiderLocation?.coordinates?.[1], currentLng: o.lastRiderLocation?.coordinates?.[0] } : {},
    items,
    itemsCount: items.reduce((s, i) => s + i.quantity, 0),
    payment: {
      txnId: pay.razorpay?.paymentId || "", gateway: pay.method || "", time: o.createdAt,
      refundStatus: pay.refund?.status || "none", refundAmount: num(pay.refund?.amount),
    },
    delivery: proofOf(o),
    _raw: { statusHistory: o.statusHistory || [] },
  }
}

const lookups = async () => {
  const [f, s] = await Promise.all([adminAPI.getFranchises().catch(() => null), adminAPI.getStores({ limit: 1000 }).catch(() => null)])
  const franchiseList = Array.isArray(f?.data?.data) ? f.data.data : []
  const storeList = s?.data?.data?.stores || []
  return {
    franchiseList, storeList,
    franchises: new Map(franchiseList.map((x) => [String(x._id), x])),
    stores: new Map(storeList.map((x) => [String(x._id), x])),
  }
}

let cache = { at: 0, orders: [], lookups: null }
async function load(force = false) {
  if (!force && Date.now() - cache.at < 1500) return cache
  const [res, lk] = await Promise.all([adminAPI.getOrders({ limit: 200, page: 1 }), lookups()])
  const raw = res?.data?.data?.orders || res?.data?.data?.data || []
  cache = { at: Date.now(), orders: raw.map((o) => toAdminOrder(o, lk)), lookups: lk }
  return cache
}

/** Filter, sort and page the loaded orders the way the screen asks. */
export async function fetchAdminOrders(filters = {}, page = 1, limit = 5, sortBy = "createdAt", sortOrder = "desc") {
  const { orders } = await load(true)
  const q = String(filters.search || "").toLowerCase()
  let list = orders.filter((o) => {
    if (q && !(o.orderNumber.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q) || String(o.customer.phone).includes(q))) return false
    if (filters.franchise && filters.franchise !== "All" && o.franchiseId !== filters.franchise) return false
    if (filters.store && filters.store !== "All" && o.storeId !== filters.store) return false
    if (filters.city && filters.city !== "All" && o.store.city !== filters.city && o.franchise.city !== filters.city) return false
    if (filters.orderType && filters.orderType !== "All" && o.orderType !== filters.orderType) return false
    if (filters.paymentMethod && filters.paymentMethod !== "All" && o.paymentMethod !== filters.paymentMethod) return false
    if (filters.paymentStatus && filters.paymentStatus !== "All" && o.paymentStatus !== filters.paymentStatus) return false
    if (filters.orderStatus && filters.orderStatus !== "All" && o.orderStatus !== filters.orderStatus) return false
    if (filters.fromDate && new Date(o.createdAt) < new Date(filters.fromDate)) return false
    if (filters.toDate && new Date(o.createdAt) > new Date(`${filters.toDate}T23:59:59`)) return false
    return true
  })
  list = list.sort((a, b) => {
    const va = sortBy === "customerName" ? a.customer.name.toLowerCase() : sortBy === "storeName" ? a.store.name.toLowerCase() : a[sortBy]
    const vb = sortBy === "customerName" ? b.customer.name.toLowerCase() : sortBy === "storeName" ? b.store.name.toLowerCase() : b[sortBy]
    if (va < vb) return sortOrder === "asc" ? -1 : 1
    if (va > vb) return sortOrder === "asc" ? 1 : -1
    return 0
  })
  const start = (page - 1) * limit
  return { orders: list.slice(start, start + limit), total: list.length, page, pages: Math.ceil(list.length / limit) }
}

export async function fetchAdminKpis() {
  const { orders } = await load()
  const today = new Date().toDateString()
  const paid = orders.filter((o) => o.paymentStatus === "Paid")
  const sum = orders.reduce((s, o) => s + o.grandTotal, 0)
  return {
    totalOrders: orders.length,
    todayOrders: orders.filter((o) => new Date(o.createdAt).toDateString() === today).length,
    completedOrders: orders.filter((o) => o.orderStatus === "Delivered").length,
    pendingOrders: orders.filter((o) => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled").length,
    cancelledOrders: orders.filter((o) => o.orderStatus === "Cancelled").length,
    refundedOrders: orders.filter((o) => o.paymentStatus === "Refunded").length,
    aov: orders.length ? Math.round(sum / orders.length) : 0,
    totalRevenue: paid.reduce((s, o) => s + o.grandTotal, 0),
  }
}

export async function fetchAdminOrder(orderId) {
  const [res, lk] = await Promise.all([adminAPI.getOrderById(orderId), lookups()])
  const raw = res?.data?.data?.order
  if (!raw) throw new Error("Order not found")
  return toAdminOrder(raw, lk)
}

export async function fetchAdminOrderLogs(orderId) {
  const o = await fetchAdminOrder(orderId)
  return (o._raw.statusHistory || []).map((h, i) => ({
    _id: `${o._id}-log-${i}`, orderId: o._id, status: STATUS[h.to] || h.to || "", updatedBy: ROLE[h.byRole] || h.byRole || "System",
    role: ROLE[h.byRole] || h.byRole || "System", remarks: h.note || "", createdAt: h.at,
  }))
}

export async function fetchAdminTracking(orderId) {
  const o = await fetchAdminOrder(orderId)
  return {
    orderId: o._id, orderNumber: o.orderNumber, status: o.orderStatus, rider: o.deliveryPartner?.name ? o.deliveryPartner : null, eta: o.eta || "",
    customerLat: o.customer.lat, customerLng: o.customer.lng, storeLat: o.store.lat, storeLng: o.store.lng,
    riderLat: o.deliveryPartner?.currentLat, riderLng: o.deliveryPartner?.currentLng, lastUpdated: new Date().toISOString(),
  }
}

/** The franchise and store lists for the filters, from the server. */
export async function fetchFilterOptions() {
  const { lookups: lk } = await load()
  return {
    franchises: lk.franchiseList.map((f) => ({ _id: String(f._id), name: f.name, city: f.city || "" })),
    stores: lk.storeList.map((s) => ({ _id: String(s._id), name: s.storeName, franchiseId: String(s.franchiseId || "") })),
  }
}

/** Orders still in progress (not delivered, not cancelled), for the live tracking screen. */
export async function fetchLiveOrders(filters = {}, page = 1, limit = 5, sortBy = "createdAt", sortOrder = "desc") {
  const all = await fetchAdminOrders({ ...filters, orderStatus: "All" }, 1, 1000, sortBy, sortOrder)
  let list = all.orders.filter((o) => o.orderStatus !== "Delivered" && o.orderStatus !== "Cancelled")
  if (filters.orderStatus && filters.orderStatus !== "All") list = list.filter((o) => o.orderStatus === filters.orderStatus)
  if (filters.rider && filters.rider !== "All") list = list.filter((o) => o.deliveryPartnerId === filters.rider)
  list = list.map((o) => ({ ...o, delayMinutes: 0, delayText: "", gps: {}, expectedDeliveryTime: o.eta }))
  const start = (page - 1) * limit
  return { orders: list.slice(start, start + limit), total: list.length, page, pages: Math.ceil(list.length / limit) }
}

/** One live order with its rider's last known position (no position is invented). */
export async function fetchLiveTracking(orderId) {
  const o = await fetchAdminOrder(orderId)
  const p = o.deliveryPartner || {}
  return {
    orderId: o._id, orderNumber: o.orderNumber, orderStatus: o.orderStatus, createdAt: o.createdAt,
    expectedDeliveryTime: o.eta, delayMinutes: 0, grandTotal: o.grandTotal, paymentMethod: o.paymentMethod, orderType: o.orderType,
    customer: o.customer, store: o.store, franchise: { name: o.franchise.name },
    rider: p.name ? { _id: p._id, name: p.name, phone: p.phone, vehicleNumber: p.vehicleNumber || "", lat: p.currentLat, lng: p.currentLng, status: o.orderStatus } : null,
  }
}

/** The order's real status history as timeline events. */
export async function fetchOrderEvents(orderId) {
  const logs = await fetchAdminOrderLogs(orderId)
  return logs.map((l) => ({ id: l._id, event: l.status, time: l.createdAt ? new Date(l.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "", user: l.updatedBy, role: l.role }))
}

export async function fetchRiderDetails(riderId) {
  const res = await adminAPI.getDeliveryPartnerById(riderId)
  const d = res?.data?.data?.delivery
  if (!d) throw new Error("Rider not found")
  return { _id: d._id, name: d.name || "", phone: d.phone || "", vehicleNumber: d.vehicleNumber || "", status: d.availabilityStatus || "offline", averageRating: d.rating || 0, avatar: d.profilePhoto || "", lat: d.lastLat, lng: d.lastLng }
}

export async function fetchCustomerDetails(customerId) {
  const res = await adminAPI.getCustomerById(customerId)
  const c = res?.data?.data?.customer || res?.data?.data || {}
  if (!c || !(c._id || c.id)) throw new Error("Customer not found")
  return { _id: c._id || c.id, name: c.name || "", phone: c.phone || "", address: c.address || "", recentOrders: [], lifetimeOrders: c.totalOrders || 0, lifetimeSpend: c.totalSpent || 0, notes: "" }
}
