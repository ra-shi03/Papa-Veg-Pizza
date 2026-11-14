import React, { useState } from "react"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { UserCheck, Check, X, Search, Store, Clock, Loader2, ShieldCheck, ShieldX, Inbox, Eye, Phone, Mail, MapPin, CalendarDays, Briefcase, IndianRupee, Siren, Hash } from "lucide-react"
import { adminAPI } from "@food/api"
import { adminClient } from "@/services/api/axios"

// Kitchen supervisors and kitchen staff that store managers add wait here. Approve: they become Active and can sign in.
// Reject: a reason is required and the store manager sees it.

const TABS = [
  { key: "Pending Approval", label: "Pending", icon: Clock, tone: "text-amber-600 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40" },
  { key: "Approved", label: "Approved", icon: ShieldCheck, tone: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40" },
  { key: "Rejected", label: "Rejected", icon: ShieldX, tone: "text-rose-600 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40" },
]

const ago = (value) => {
  if (!value) return ""
  const mins = Math.round((Date.now() - new Date(value).getTime()) / 60000)
  if (mins < 1) return "just now"
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} hr ago`
  return new Date(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
}

export default function StaffApprovals() {
  const queryClient = useQueryClient()
  const [tab, setTab] = useState("Pending Approval")
  const [search, setSearch] = useState("")
  const [storeId, setStoreId] = useState("All")
  const [busyId, setBusyId] = useState(null)
  const [rejecting, setRejecting] = useState(null) // { id, reason }
  const [viewing, setViewing] = useState(null)

  const { data: stores = [] } = useQuery({
    queryKey: ["franchiseStoresForApprovals"],
    queryFn: () => adminAPI.getStores({ limit: 1000 }).then((res) => res.data?.data?.stores || []),
  })

  const params = { status: tab, ...(storeId !== "All" ? { storeId } : {}), ...(search.trim() ? { search: search.trim() } : {}) }
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["staffApprovals", params],
    queryFn: async () => (await adminClient.get("/staff-approvals", { params })).data?.data || { staff: [], counts: {} },
    refetchInterval: 60000,
  })
  const rows = data?.staff || []
  const counts = data?.counts || {}
  const countOf = { "Pending Approval": counts.pending, Approved: counts.approved, Rejected: counts.rejected }

  const decide = async (id, approve, reason) => {
    setBusyId(id)
    try {
      await adminClient.patch(`/staff-approvals/${id}/${approve ? "approve" : "reject"}`, approve ? {} : { reason })
      toast.success(approve ? "Approved. They can sign in now." : "Request rejected. The store manager can see your reason.")
      setRejecting(null)
      setViewing(null)
      queryClient.invalidateQueries({ queryKey: ["staffApprovals"] })
      queryClient.invalidateQueries({ queryKey: ["franchiseKitchenStaff"] })
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not save your decision")
      refetch()
    } finally {
      setBusyId(null)
    }
  }

  const input = "h-9 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/25 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 pb-6 pt-4 text-zinc-900 dark:text-zinc-100">
      <div className="flex items-center gap-2">
        <UserCheck className="text-[var(--primary)]" />
        <div>
          <h1 className="text-xl font-black tracking-tight">Kitchen staff approvals</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Approve or reject the supervisors and staff your store managers add. Nobody can sign in or work until you approve.</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {TABS.map((t) => {
          const Icon = t.icon
          const on = tab === t.key
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)} aria-pressed={on}
              className={`rounded-2xl border p-3.5 text-left transition active:scale-[0.98] ${on ? `${t.tone} shadow-sm` : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"}`}>
              <Icon size={16} className={on ? "" : "text-zinc-400"} />
              <p className="mt-1 text-2xl font-black">{countOf[t.key] ?? 0}</p>
              <p className="text-[10px] font-bold uppercase tracking-wider opacity-80">{t.label}</p>
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-zinc-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name, email, phone or employee code" className={`${input} w-full pl-8`} />
        </div>
        <label className="flex items-center gap-2 text-[11px] font-bold text-zinc-500">
          <Store size={14} />
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className={`${input} min-w-[180px]`}>
            <option value="All">All stores</option>
            {stores.map((s) => <option key={s._id || s.id} value={String(s._id || s.id)}>{s.storeName}</option>)}
          </select>
        </label>
      </div>

      <div className="space-y-2.5">
        {isLoading && [0, 1, 2].map((n) => <div key={n} className="h-24 animate-pulse rounded-2xl bg-zinc-200 dark:bg-zinc-800" />)}
        {isError && <p className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm font-semibold text-rose-600">Could not load the requests. <button type="button" onClick={() => refetch()} className="underline">Try again</button></p>}
        {!isLoading && !isError && rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-zinc-300 py-14 text-center dark:border-zinc-700">
            <Inbox className="mx-auto text-zinc-300" size={32} />
            <p className="mt-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">{tab === "Pending Approval" ? "Nothing is waiting for approval" : `No ${tab.toLowerCase()} requests`}</p>
            <p className="text-xs text-zinc-400">{tab === "Pending Approval" ? "New staff your store managers add will show up here." : "Try another filter."}</p>
          </div>
        )}

        {rows.map((r) => (
          <div key={r._id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-sm font-black text-[var(--primary)]">
                  {(r.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold">
                    {r.name}
                    <span className="ml-2 rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-bold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">{r.role || "Kitchen staff"}</span>
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <span className="flex items-center gap-1"><Store size={11} /> {r.storeName || "Store"}</span>
                    <span>{r.email}</span>
                    <span>{r.phone}</span>
                    <span>{r.employeeCode}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-zinc-400">
                    {r.addedBy ? `Added by ${r.addedBy} · ` : ""}{ago(r.createdAt)}{r.shiftType ? ` · ${r.shiftType} shift` : ""}
                  </p>
                </div>
              </div>

              {tab === "Pending Approval" ? (
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setViewing(r)} className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                    <Eye size={13} /> View
                  </button>
                  <button type="button" disabled={busyId === r._id} onClick={() => setRejecting({ id: r._id, reason: "" })}
                    className="flex items-center gap-1 rounded-lg border border-rose-200 px-3.5 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/40 dark:hover:bg-rose-950/20">
                    <X size={13} /> Reject
                  </button>
                  <button type="button" disabled={busyId === r._id} onClick={() => decide(r._id, true)}
                    className="flex items-center gap-1 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                    {busyId === r._id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-right text-[11px]">
                  <button type="button" onClick={() => setViewing(r)} className="flex items-center gap-1 rounded-lg border border-zinc-200 px-3.5 py-2 text-xs font-bold text-zinc-700 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800">
                    <Eye size={13} /> View
                  </button>
                  <div>
                  <span className={`rounded-full px-2.5 py-1 font-extrabold uppercase ${tab === "Approved" ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20" : "bg-rose-50 text-rose-700 dark:bg-rose-950/20"}`}>{tab === "Approved" ? "Approved" : "Rejected"}</span>
                  <p className="mt-1 text-zinc-400">{r.decidedByName ? `by ${r.decidedByName} · ` : ""}{ago(r.decidedAt)}</p>
                  </div>
                </div>
              )}
            </div>

            {tab === "Rejected" && r.rejectionReason && (
              <p className="mt-3 rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/20 dark:text-rose-300"><b>Reason:</b> {r.rejectionReason}</p>
            )}

            {rejecting?.id === r._id && (
              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-dashed border-zinc-200 pt-3 dark:border-zinc-800">
                <input autoFocus value={rejecting.reason} onChange={(e) => setRejecting({ id: r._id, reason: e.target.value.slice(0, 300) })}
                  placeholder="Reason for rejecting (the store manager will see it)" className={`${input} min-w-[240px] flex-1`} />
                <button type="button" onClick={() => setRejecting(null)} className="rounded-lg px-3 py-2 text-xs font-bold text-zinc-500">Cancel</button>
                <button type="button" disabled={!rejecting.reason.trim() || busyId === r._id} onClick={() => decide(r._id, false, rejecting.reason.trim())}
                  className="rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-50">Confirm reject</button>
              </div>
            )}
          </div>
        ))}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-[2px]" onClick={() => setViewing(null)}>
          <aside className="flex h-full w-full max-w-md flex-col bg-white shadow-2xl dark:bg-zinc-900" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-base font-black text-[var(--primary)]">
                  {(viewing.name || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()}
                </span>
                <div>
                  <h2 className="text-base font-extrabold">{viewing.name}</h2>
                  <p className="text-xs text-zinc-500">{viewing.role || "Kitchen staff"} · {viewing.storeName}</p>
                </div>
              </div>
              <button type="button" onClick={() => setViewing(null)} aria-label="Close" className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800"><X size={16} /></button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-5">
              <span className={`inline-block rounded-full px-3 py-1 text-[11px] font-extrabold uppercase ${viewing.status === "Pending Approval" ? "bg-amber-50 text-amber-700" : viewing.status === "Rejected" ? "bg-rose-50 text-rose-700" : "bg-emerald-50 text-emerald-700"}`}>
                {viewing.status === "Pending Approval" ? "Waiting for approval" : viewing.status}
              </span>
              {viewing.status === "Rejected" && viewing.rejectionReason && (
                <p className="rounded-xl bg-rose-50 p-3 text-xs font-medium text-rose-700 dark:bg-rose-950/20 dark:text-rose-300"><b>Reason:</b> {viewing.rejectionReason}</p>
              )}
              {[
                [Hash, "Employee ID", viewing.employeeCode],
                [Phone, "Phone", viewing.phone],
                [Mail, "Email", viewing.email],
                [Store, "Store", viewing.storeName],
                [Clock, "Shift", viewing.shiftType ? `${viewing.shiftType}${viewing.shiftStart ? ` · ${viewing.shiftStart} to ${viewing.shiftEnd}` : ""}` : ""],
                [CalendarDays, "Working days", (viewing.weeklyWorkingDays || []).join(", ")],
                [CalendarDays, "Joining date", viewing.joinedDate ? new Date(viewing.joinedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : ""],
                [Briefcase, "Experience", `${viewing.experience || 0} year(s)`],
                [IndianRupee, "Salary", viewing.salary ? `₹${Number(viewing.salary).toLocaleString("en-IN")} ${viewing.salaryType ? `(${viewing.salaryType})` : ""}` : ""],
                [MapPin, "Address", viewing.address],
                [Siren, "Emergency contact", viewing.emergencyContact],
                [UserCheck, "Added by", viewing.addedBy],
                [Clock, "Requested", ago(viewing.createdAt)],
              ].map(([Icon, label, value]) => (
                <div key={label} className="flex items-start gap-3 border-t border-zinc-100 pt-3 first:border-0 first:pt-0 dark:border-zinc-800">
                  <Icon size={15} className="mt-0.5 shrink-0 text-zinc-400" />
                  <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{label}</p><p className="break-words text-sm font-semibold">{value || "--"}</p></div>
                </div>
              ))}
              {viewing.skills?.length > 0 && (
                <div className="border-t border-zinc-100 pt-3 dark:border-zinc-800">
                  <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">Skills</p>
                  <div className="flex flex-wrap gap-1.5">{viewing.skills.map((s) => <span key={s} className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold dark:bg-zinc-800">{s}</span>)}</div>
                </div>
              )}
            </div>

            {viewing.status === "Pending Approval" && (
              <div className="space-y-2 border-t border-zinc-100 p-4 dark:border-zinc-800">
                {rejecting?.id === viewing._id ? (
                  <>
                    <input autoFocus value={rejecting.reason} onChange={(e) => setRejecting({ id: viewing._id, reason: e.target.value.slice(0, 300) })} placeholder="Reason for rejecting (the store manager will see it)" className={`${input} w-full`} />
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setRejecting(null)} className="flex-1 rounded-lg border border-zinc-200 py-2.5 text-xs font-bold dark:border-zinc-700">Cancel</button>
                      <button type="button" disabled={!rejecting.reason.trim() || busyId === viewing._id} onClick={() => decide(viewing._id, false, rejecting.reason.trim())} className="flex-1 rounded-lg bg-rose-600 py-2.5 text-xs font-bold text-white disabled:opacity-50">Confirm reject</button>
                    </div>
                  </>
                ) : (
                  <div className="flex gap-2">
                    <button type="button" disabled={busyId === viewing._id} onClick={() => setRejecting({ id: viewing._id, reason: "" })} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-rose-200 py-2.5 text-xs font-bold text-rose-600 hover:bg-rose-50 disabled:opacity-50 dark:border-rose-900/40"><X size={13} /> Reject</button>
                    <button type="button" disabled={busyId === viewing._id} onClick={() => decide(viewing._id, true)} className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-50">
                      {busyId === viewing._id ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />} Approve
                    </button>
                  </div>
                )}
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  )
}
