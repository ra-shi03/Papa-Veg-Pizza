import React, { useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Users, Search, Store, Phone, Mail, X, Clock, Briefcase, CalendarDays, Download, RefreshCw, UserCheck } from "lucide-react"
import { Link } from "react-router-dom"
import { adminAPI } from "@food/api"
import { adminClient } from "@/services/api/axios"

// The franchise's approved kitchen supervisors and kitchen staff, store by store. View only: people are added by the store
// manager and approved on the Kitchen Staff Approvals page.

const STATUS_STYLE = {
  Active: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/40",
  "On Leave": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/40",
  Suspended: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/40",
}
const TODAY_STYLE = {
  "Checked in": "text-emerald-600",
  "Checked out": "text-sky-600",
  "On leave": "text-amber-600",
  Present: "text-emerald-600",
  "Not checked in": "text-zinc-400",
}
const date = (v) => (v ? new Date(v).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "--")

export default function KitchenStaff() {
  const [search, setSearch] = useState("")
  const [storeId, setStoreId] = useState("All")
  const [role, setRole] = useState("All")
  const [status, setStatus] = useState("All")
  const [open, setOpen] = useState(null)

  const { data: stores = [] } = useQuery({
    queryKey: ["franchiseStoresForKitchenStaff"],
    queryFn: () => adminAPI.getStores({ limit: 1000 }).then((res) => res.data?.data?.stores || []),
  })
  const params = { ...(storeId !== "All" ? { storeId } : {}), ...(role !== "All" ? { role } : {}), ...(status !== "All" ? { status } : {}), ...(search.trim() ? { search: search.trim() } : {}) }
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["franchiseKitchenStaff", params],
    queryFn: async () => (await adminClient.get("/staff-approvals/staff", { params })).data?.data || { staff: [], counts: {} },
  })
  const rows = data?.staff || []
  const counts = data?.counts || {}
  const roles = useMemo(() => [...new Set(rows.map((r) => r.role).filter(Boolean))], [rows])

  const exportCsv = () => {
    const head = "Employee Code,Name,Role,Store,Phone,Email,Shift,Joined,Status,Today\n"
    const body = rows.map((r) => [r.employeeCode, r.name, r.role, r.storeName, r.phone, r.email, r.shiftType, date(r.joinedDate), r.status, r.today].map((v) => `"${v ?? ""}"`).join(",")).join("\n")
    const url = URL.createObjectURL(new Blob([head + body], { type: "text/csv" }))
    const a = document.createElement("a"); a.href = url; a.download = "kitchen_staff.csv"; a.click(); URL.revokeObjectURL(url)
  }

  const input = "h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-6 pt-4 text-zinc-900 dark:text-zinc-100">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="text-[var(--primary)]" />
          <div>
            <h1 className="text-xl font-black tracking-tight">Kitchen staff</h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Approved kitchen supervisors and staff across your stores.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/franchise-admin/kitchen-staff-approvals" className="flex items-center gap-1.5 rounded-lg bg-[var(--primary)] px-3 py-2 text-xs font-bold text-white hover:opacity-90"><UserCheck size={13} /> Approvals</Link>
          <button type="button" onClick={exportCsv} disabled={!rows.length} className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-bold hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-800 dark:bg-zinc-900"><Download size={13} /> Export CSV</button>
          <button type="button" onClick={() => refetch()} aria-label="Refresh" className="rounded-lg border border-zinc-200 bg-white p-2 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"><RefreshCw size={14} className={isFetching ? "animate-spin" : ""} /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[["Total staff", counts.total], ["Active", counts.active], ["On leave", counts.onLeave], ["Suspended", counts.suspended]].map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-zinc-200 bg-white p-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-2xl font-black">{value ?? 0}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone or employee code" className={`${input} w-full pl-8`} />
        </div>
        <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={`${input} min-w-[170px]`}>
          <option value="All">All stores</option>
          {stores.map((s) => <option key={s._id || s.id} value={String(s._id || s.id)}>{s.storeName}</option>)}
        </select>
        <select value={role} onChange={(e) => setRole(e.target.value)} className={input}>
          <option value="All">All roles</option>
          {["Kitchen Supervisor", "Pizza Maker", "Baker", "Packager", "Kitchen Staff", ...roles.filter((r) => !["Kitchen Supervisor", "Pizza Maker", "Baker", "Packager", "Kitchen Staff"].includes(r))].map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={input}>
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="On Leave">On leave</option>
          <option value="Suspended">Suspended</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-[10px] font-black uppercase tracking-wider text-zinc-400 dark:border-zinc-800 dark:bg-zinc-950">
            <tr>{["Staff", "Employee ID", "Store", "Contact", "Shift", "Joined", "Status", "Today"].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {isLoading && [0, 1, 2, 3].map((n) => <tr key={n}><td colSpan={8} className="px-4 py-3"><div className="h-6 animate-pulse rounded bg-zinc-100 dark:bg-zinc-800" /></td></tr>)}
            {isError && <tr><td colSpan={8} className="px-4 py-10 text-center font-semibold text-rose-500">Could not load kitchen staff.</td></tr>}
            {!isLoading && !isError && rows.length === 0 && <tr><td colSpan={8} className="px-4 py-12 text-center font-semibold text-zinc-400">No kitchen staff match these filters.</td></tr>}
            {rows.map((r) => (
              <tr key={r._id} onClick={() => setOpen(r)} className="cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-950/40">
                <td className="px-4 py-3">
                  <p className="font-extrabold">{r.name}</p>
                  <p className="text-[10px] text-zinc-400">{r.role}</p>
                </td>
                <td className="px-4 py-3 font-semibold text-zinc-500">{r.employeeCode}</td>
                <td className="px-4 py-3 font-semibold">{r.storeName || "--"}</td>
                <td className="px-4 py-3 text-zinc-500"><p>{r.phone}</p><p className="text-[10px]">{r.email}</p></td>
                <td className="px-4 py-3 text-zinc-500">{r.shiftType || "--"}{r.shiftStart ? <span className="block text-[10px]">{r.shiftStart} to {r.shiftEnd}</span> : null}</td>
                <td className="whitespace-nowrap px-4 py-3 text-zinc-500">{date(r.joinedDate)}</td>
                <td className="px-4 py-3"><span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${STATUS_STYLE[r.status] || STATUS_STYLE.Active}`}>{r.status}</span></td>
                <td className={`px-4 py-3 font-bold ${TODAY_STYLE[r.today] || ""}`}>{r.today}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]" onClick={() => setOpen(null)}>
          <aside className="h-full w-full max-w-sm space-y-4 overflow-y-auto bg-white p-5 shadow-2xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-base font-black text-[var(--primary)]">{(open.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}</span>
                <div>
                  <h2 className="text-base font-extrabold">{open.name}</h2>
                  <p className="text-xs text-zinc-500">{open.role} · {open.employeeCode}</p>
                </div>
              </div>
              <button type="button" onClick={() => setOpen(null)} aria-label="Close" className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={16} /></button>
            </div>
            <span className={`inline-block rounded-full border px-3 py-1 text-[11px] font-extrabold uppercase ${STATUS_STYLE[open.status] || STATUS_STYLE.Active}`}>{open.status}</span>
            {[[Store, "Store", open.storeName], [Phone, "Phone", open.phone], [Mail, "Email", open.email], [Clock, "Shift", open.shiftType ? `${open.shiftType}${open.shiftStart ? ` · ${open.shiftStart} to ${open.shiftEnd}` : ""}` : "--"], [CalendarDays, "Joined", date(open.joinedDate)], [Briefcase, "Experience", `${open.experience || 0} year(s)`], [UserCheck, "Added by", open.addedBy || "--"], [Clock, "Today", open.today]].map(([Icon, label, value]) => (
              <div key={label} className="flex items-start gap-3 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <Icon size={15} className="mt-0.5 text-zinc-400" />
                <div><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p><p className="text-sm font-semibold">{value || "--"}</p></div>
              </div>
            ))}
            {open.skills?.length > 0 && (
              <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Skills</p>
                <div className="flex flex-wrap gap-1.5">{open.skills.map((s) => <span key={s} className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold dark:bg-zinc-800">{s}</span>)}</div>
              </div>
            )}
            <Link to="/franchise-admin/staff-attendance" className="block rounded-xl border border-zinc-200 py-2.5 text-center text-xs font-bold text-[var(--primary)] hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-950">See attendance</Link>
          </aside>
        </div>
      )}
    </div>
  )
}
