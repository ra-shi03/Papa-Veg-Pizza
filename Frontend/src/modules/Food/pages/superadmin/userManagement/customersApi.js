import { useCallback, useEffect, useState } from "react"
import { adminClient } from "@/services/api/axios"

export const errText = (e) => e?.response?.data?.message || e?.response?.data?.error || e?.message || "Something went wrong"

/** A server customer in the shape the customer screens draw. */
export const toCustomer = (c) => ({
  id: String(c._id || c.id),
  name: c.name || "Unnamed",
  email: c.email || "",
  phone: c.phone || "",
  avatar: c.profileImage || "",
  status: c.isActive === false || c.status === false ? "SUSPENDED" : "ACTIVE",
  orders: Number(c.totalOrder ?? c.totalOrders) || 0,
  spent: Number(c.totalOrderAmount) || 0,
  memberSince: c.createdAt ? new Date(c.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "-",
  joiningDate: c.createdAt || null,
  ordersList: c.ordersList || [],
})

export const setCustomerActive = (id, isActive) => adminClient.patch(`/food/admin/customers/${id}/status`, { isActive })

/** Every customer account (GET /food/admin/customers), newest first. */
export function useCustomerList() {
  const [customers, setCustomers] = useState([])
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    try {
      const res = await adminClient.get("/food/admin/customers", { params: { limit: 1000 } })
      const data = res?.data?.data || {}
      setCustomers((data.customers || data.users || (Array.isArray(data) ? data : [])).map(toCustomer))
      setError("")
    } catch (e) {
      setError(errText(e))
    }
  }, [])
  useEffect(() => { load() }, [load])
  return { customers, setCustomers, error, reload: load }
}
