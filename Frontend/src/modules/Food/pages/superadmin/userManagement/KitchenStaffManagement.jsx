import { useCallback, useEffect, useState } from "react"
import { adminClient } from "@/services/api/axios"
import OverviewPage, { Badge, errText } from "../../franchise-admin/shared/OverviewPage"

// Kitchen staff of every store. Store managers add them and franchise admins approve them; this is the company view.
export default function KitchenStaffManagement() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await adminClient.get("/food/admin/kitchen-staff")
      setRows((res?.data?.data?.staff || []).map((s) => ({ ...s, state: String(s.status || "").toLowerCase(), duty: s.onDuty ? "On duty" : "Off duty" })))
      setError("")
    } catch (e) {
      setError(errText(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const count = (fn) => rows.filter(fn).length
  const states = [...new Set(rows.map((r) => r.state).filter(Boolean))]
  return (
    <OverviewPage
      title="Kitchen Staff" subtitle="Kitchen staff across all stores. Store managers add them; franchise admins approve them."
      query={{ data: {}, loading, error, load }} rows={rows} searchKeys={["name", "email", "phone", "employeeCode", "role", "storeName", "franchiseName"]} empty="No kitchen staff yet."
      filter={{ key: "state", label: "All statuses", options: states }}
      summary={
        <div className="grid grid-cols-3 gap-3">
          {[["Staff", rows.length], ["Active", count((r) => r.state === "active")], ["On duty now", count((r) => r.onDuty)]].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
              <p className="text-xl font-black">{value}</p>
            </div>
          ))}
        </div>
      }
      columns={[
        { title: "Name", render: (r) => <span>{r.name}<span className="block text-[10px] text-zinc-400">{r.employeeCode}</span></span> },
        { title: "Contact", render: (r) => <span>{r.phone}<span className="block text-[10px] text-zinc-400">{r.email}</span></span> },
        { title: "Role", key: "role" }, { title: "Store", key: "storeName" }, { title: "Franchise", key: "franchiseName" },
        { title: "Shift", key: "shift" }, { title: "Orders delivered", key: "ordersDelivered" }, { title: "Today", key: "duty" },
        { title: "Status", render: (r) => <Badge value={r.state === "active" ? "member" : r.state === "pending" ? "pending" : "closed"} /> },
      ]}
    />
  )
}
