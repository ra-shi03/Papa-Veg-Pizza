import { useEffect, useMemo, useState } from "react"
import { Loader2, X, Clock, Upload, ShieldCheck, AlertTriangle, Landmark, CheckCircle2 } from "lucide-react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"

// Shared pieces of the Payouts pages (store manager, kitchen staff, franchise admin, super admin).
// Every amount here comes from the server; the screens never work one out. The server decides who may pay, reject,
// report or decide; these screens only show the buttons that apply.

export const REAL = { _isFallback: true }
export const errText = (e) => e?.response?.data?.error || e?.response?.data?.message || e?.message || "That did not work"
export const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`
export const when = (v) => (v ? new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "")
export const monthLabel = (period) => {
  if (!period) return ""
  const [y, m] = period.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("en-IN", { month: "long", year: "numeric" })
}

export const STATUS = {
  pending: { label: "Waiting", cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900" },
  paid: { label: "Paid", cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900" },
  rejected: { label: "Rejected", cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900" },
  reversed: { label: "Not paid (reversed)", cls: "bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700" },
}
export const KIND = {
  rider_withdrawal: "Rider withdrawal",
  staff_salary: "Staff salary",
  store_payout: "Store payout",
  franchise_payout: "Franchise payout",
}
const METHOD = { bank_transfer: "Bank transfer", upi: "UPI", cash: "Cash" }
const ROLE = { STORE_MANAGER: "Store manager", FRANCHISE_ADMIN: "Franchise admin", SUPER_ADMIN: "Super admin", SUPERADMIN: "Super admin", DELIVERY_PARTNER: "Rider", KITCHEN_STAFF: "Staff" }

export const card = "bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl"
const input = "w-full h-10 px-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold outline-none focus:border-[var(--primary)]"
const label = "text-[10px] font-black uppercase tracking-wider text-zinc-400"

export function StatusBadge({ status, dispute }) {
  const s = STATUS[status] || STATUS.pending
  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
      {dispute?.status === "open" && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-orange-50 text-orange-700 border-orange-200">Not received?</span>}
    </span>
  )
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 w-full overflow-x-auto">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)}
          className={`px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap cursor-pointer ${value === t.id ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-sm" : "text-zinc-500"}`}>
          {t.label}{t.count ? <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-[9px]">{t.count}</span> : null}
        </button>
      ))}
    </div>
  )
}

/** What a level can ask for: available now, on hold (recent deliveries), waiting and already paid. */
export function BalanceCards({ balance, holdHours = 24 }) {
  const items = [
    { k: "available", label: "Available to request", hint: "Delivered orders, after the hold" },
    { k: "onHold", label: `On hold (${holdHours}h)`, hint: "Delivered recently; available soon" },
    { k: "pending", label: "Requested, waiting", hint: "Not paid yet" },
    { k: "paid", label: "Paid so far", hint: "Marked paid with a reference" },
  ]
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      {items.map((i) => (
        <div key={i.k} className={`${card} p-3`}>
          <span className="block text-[10px] font-bold uppercase tracking-wider text-zinc-500">{i.label}</span>
          <span className={`text-xl font-black ${i.k === "available" ? "text-[var(--primary)]" : "text-zinc-900 dark:text-zinc-100"}`}>{money(balance?.[i.k])}</span>
          <span className="block text-[10px] text-zinc-400 font-medium">{i.hint}</span>
        </div>
      ))}
    </div>
  )
}

/** Bank account / UPI the money is sent to. Saving a change holds new requests for 24 hours (anti-fraud). */
export function AccountCard({ account, onSave, title = "Payout account" }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ accountHolderName: "", accountNumber: "", ifscCode: "", bankName: "", upiId: "" })
  const [saving, setSaving] = useState(false)
  const onHold = account?.holdUntil && new Date(account.holdUntil) > new Date()
  const start = () => {
    setForm({ accountHolderName: account?.accountHolderName || "", accountNumber: "", ifscCode: account?.ifscCode || "", bankName: account?.bankName || "", upiId: account?.upiId || "" })
    setEditing(true)
  }
  const save = async () => {
    setSaving(true)
    try {
      await onSave(form)
      toast.success("Payout account saved")
      setEditing(false)
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setSaving(false)
    }
  }
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  return (
    <div className={`${card} p-4 space-y-3`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-black text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-2"><Landmark size={15} />{title}</p>
        {!editing && <button onClick={start} className="text-xs font-bold text-[var(--primary)] cursor-pointer">{account ? "Change" : "Add"}</button>}
      </div>
      {!editing && (account ? (
        <div className="text-xs space-y-0.5">
          {account.accountNumber && <p className="font-bold text-zinc-800 dark:text-zinc-200">{account.accountHolderName} · {account.accountNumber} · {account.ifscCode}{account.bankName ? ` · ${account.bankName}` : ""}</p>}
          {account.upiId && <p className="font-bold text-zinc-800 dark:text-zinc-200">UPI: {account.upiId}</p>}
          {onHold && <p className="text-amber-600 font-semibold inline-flex items-center gap-1"><AlertTriangle size={12} />Changed recently: requests open after {when(account.holdUntil)}</p>}
        </div>
      ) : <p className="text-xs text-zinc-500 font-medium">Add a bank account or UPI ID before requesting a payout.</p>)}
      {editing && (
        <div className="space-y-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input className={input} placeholder="Account holder name" value={form.accountHolderName} onChange={set("accountHolderName")} />
            <input className={input} placeholder="Account number" inputMode="numeric" value={form.accountNumber} onChange={set("accountNumber")} />
            <input className={input} placeholder="IFSC code" value={form.ifscCode} onChange={(e) => setForm((f) => ({ ...f, ifscCode: e.target.value.toUpperCase() }))} />
            <input className={input} placeholder="Bank name" value={form.bankName} onChange={set("bankName")} />
            <input className={`${input} sm:col-span-2`} placeholder="UPI ID (optional if bank account given)" value={form.upiId} onChange={set("upiId")} />
          </div>
          <p className="text-[10px] text-zinc-500 font-medium inline-flex items-center gap-1"><ShieldCheck size={12} />For safety, payouts can be requested 24 hours after changing these details.</p>
          <div className="flex gap-2">
            <button disabled={saving} onClick={save} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">{saving && <Loader2 size={12} className="animate-spin" />}Save</button>
            <button disabled={saving} onClick={() => setEditing(false)} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer">Cancel</button>
          </div>
        </div>
      )}
    </div>
  )
}

/** A list of payouts; clicking one opens it. */
export function PayoutList({ rows, onOpen, empty = "Nothing here yet.", showKind = false, who = (p) => p.payee?.name }) {
  if (!rows?.length) return <p className={`${card} py-12 text-center text-xs font-semibold text-zinc-400`}>{empty}</p>
  return (
    <ul className={`${card} divide-y divide-zinc-100 dark:divide-zinc-800 overflow-hidden`}>
      {rows.map((p) => (
        <li key={p.id}>
          <button onClick={() => onOpen(p)} className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-950 cursor-pointer flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">{who(p) || "—"}{p.period ? ` · ${monthLabel(p.period)}` : ""}</p>
              <p className="text-[11px] text-zinc-500 font-medium truncate">
                {showKind ? `${KIND[p.kind]} · ` : ""}{when(p.createdAt)}{p.payment?.reference ? ` · Ref ${p.payment.reference}` : ""}
              </p>
            </div>
            <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 shrink-0">{p.amount > 0 ? money(p.amount) : "Amount to set"}</span>
            <span className="shrink-0"><StatusBadge status={p.status} dispute={p.dispute} /></span>
          </button>
        </li>
      ))}
    </ul>
  )
}

async function uploadProof(file) {
  const fd = new FormData()
  fd.append("file", file)
  const res = await adminClient.post("/uploads/image", fd, { ...REAL, headers: { "Content-Type": "multipart/form-data" } })
  return res?.data?.data?.url || res?.data?.url || ""
}

/**
 * One payout, with the actions the caller may take:
 * canPay / canReject (the payer), canReport ("not received", the payee), canResolve (the level above, on an open report).
 * `base` is the API path the actions post to: `${base}/${id}/pay` etc.
 */
export function PayoutDrawer({ payout, base, canPay, canReject, canReport, canResolve, onClose, onDone }) {
  const [mode, setMode] = useState("")
  const [form, setForm] = useState({ method: "bank_transfer", reference: "", amount: "", note: "", reason: "", outcome: "paid_confirmed", resolution: "", proofUrl: "" })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  useEffect(() => { setMode(""); setForm((f) => ({ ...f, amount: payout?.amount ? String(payout.amount) : "", reference: "", reason: "", note: "", resolution: "", proofUrl: "" })) }, [payout?.id])
  if (!payout) return null
  const p = payout
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const isSalary = p.kind === "staff_salary"
  const disputeOpen = p.dispute?.status === "open"

  const run = async (path, body, done) => {
    setBusy(true)
    try {
      await adminClient.post(`${base}/${p.id}/${path}`, body, REAL)
      toast.success(done)
      onDone?.()
      onClose()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(false)
    }
  }
  const onProof = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    if (!file.type.startsWith("image/")) return toast.error("Choose an image (screenshot of the payment)")
    setUploading(true)
    try {
      const url = await uploadProof(file)
      if (!url) throw new Error("Upload failed")
      setForm((f) => ({ ...f, proofUrl: url }))
    } catch (err) {
      toast.error(errText(err))
    } finally {
      setUploading(false)
    }
  }

  const b = p.bank || {}
  return (
    <div className="fixed inset-0 z-[300] bg-black/40 flex justify-end" onClick={() => !busy && onClose()}>
      <div className="w-full max-w-md h-full bg-white dark:bg-zinc-900 overflow-y-auto p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">{KIND[p.kind]}</span>
            <h2 className="text-base font-black text-zinc-900 dark:text-zinc-100">{p.payee?.name || "—"}{p.period ? ` · ${monthLabel(p.period)}` : ""}</h2>
            <p className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mt-1">{p.amount > 0 ? money(p.amount) : "Amount to set"}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"><X size={16} /></button>
        </div>
        <StatusBadge status={p.status} dispute={p.dispute} />

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-3 text-xs space-y-1">
          <p className={label}>Pay to</p>
          {b.accountNumber ? <p className="font-bold text-zinc-800 dark:text-zinc-200">{b.accountHolderName} · {b.accountNumber} · {b.ifscCode}{b.bankName ? ` · ${b.bankName}` : ""}</p> : null}
          {b.upiId ? <p className="font-bold text-zinc-800 dark:text-zinc-200">UPI: {b.upiId}</p> : null}
          {!b.accountNumber && !b.upiId && <p className="text-zinc-500 font-medium">No bank account or UPI saved. Pay in person and record the receipt.</p>}
          <p className="text-[10px] text-zinc-400 font-medium">Details as saved when the request was made.</p>
        </div>

        {p.note && <div><p className={label}>Note</p><p className="text-xs text-zinc-700 dark:text-zinc-300">{p.note}</p></div>}
        {p.payment?.reference && (
          <div className="rounded-xl bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs space-y-1">
            <p className="font-bold text-emerald-800 dark:text-emerald-300 inline-flex items-center gap-1"><CheckCircle2 size={13} />Paid by {METHOD[p.payment.method] || p.payment.method} · Ref {p.payment.reference}</p>
            <p className="text-emerald-700 dark:text-emerald-400 font-medium">{when(p.payment.paidAt)}{p.payment.paidBy?.name ? ` · ${p.payment.paidBy.name}` : ""}</p>
            {p.payment.proofUrl && <a href={p.payment.proofUrl} target="_blank" rel="noreferrer" className="text-[var(--primary)] font-bold">View payment screenshot</a>}
          </div>
        )}
        {p.rejection && <div className="rounded-xl bg-rose-50 dark:bg-rose-950/20 p-3 text-xs"><p className="font-bold text-rose-700">Rejected: {p.rejection.reason}</p></div>}
        {p.dispute && (
          <div className="rounded-xl bg-orange-50 dark:bg-orange-950/20 p-3 text-xs space-y-1">
            <p className="font-bold text-orange-800 dark:text-orange-300">Reported not received · {when(p.dispute.raisedAt)}</p>
            <p className="text-orange-700 dark:text-orange-400">{p.dispute.note}</p>
            {p.dispute.status === "resolved" && <p className="font-bold text-zinc-700 dark:text-zinc-300">{p.dispute.outcome === "not_paid" ? "Decided: not paid (reversed)" : "Decided: payment confirmed"} · {p.dispute.resolution}</p>}
          </div>
        )}

        {p.activity?.length > 0 && (
          <div>
            <p className={`${label} mb-2`}>History</p>
            <ul className="space-y-2">
              {p.activity.map((a, i) => (
                <li key={i} className="text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 p-2.5">
                  <span className="font-bold text-zinc-800 dark:text-zinc-200 capitalize">{String(a.action).replace(/_/g, " ")}</span>
                  <span className="text-zinc-400 font-medium"> · {ROLE[a.byRole] || a.byRole}{a.byName ? ` (${a.byName})` : ""} · <Clock size={10} className="inline -mt-0.5" /> {when(a.at)}</span>
                  {a.note && <p className="mt-1 text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap">{a.note}</p>}
                </li>
              ))}
            </ul>
          </div>
        )}

        {p.status === "pending" && (canPay || canReject) && !mode && (
          <div className="flex gap-2">
            {canPay && <button onClick={() => setMode("pay")} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold cursor-pointer">Mark as paid</button>}
            {canReject && <button onClick={() => setMode("reject")} className="px-3 py-2 rounded-lg border border-rose-300 text-rose-700 text-xs font-bold cursor-pointer">Reject</button>}
          </div>
        )}
        {canReport && p.canReportNotReceived && !mode && (
          <button onClick={() => setMode("report")} className="px-3 py-2 rounded-lg border border-orange-300 text-orange-700 text-xs font-bold cursor-pointer">I did not receive this</button>
        )}
        {canResolve && disputeOpen && !mode && (
          <button onClick={() => setMode("resolve")} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold cursor-pointer">Decide this report</button>
        )}

        {mode === "pay" && (
          <div className="space-y-2 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
            <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Send the money first, then record it here. This cannot be undone.</p>
            <select className={input} value={form.method} onChange={set("method")}>
              <option value="bank_transfer">Bank transfer (NEFT / IMPS / RTGS)</option>
              <option value="upi">UPI</option>
              <option value="cash">Cash</option>
            </select>
            <input className={input} placeholder={form.method === "cash" ? "Cash receipt number" : "UTR / transaction reference"} value={form.reference} onChange={set("reference")} />
            {isSalary && <input className={input} placeholder="Amount paid (₹)" inputMode="decimal" value={form.amount} onChange={set("amount")} />}
            {isSalary && <input className={input} placeholder="Note (needed if the amount differs from the salary)" value={form.note} onChange={set("note")} />}
            <label className="flex items-center gap-2 text-xs font-bold text-zinc-600 dark:text-zinc-300 cursor-pointer">
              {uploading ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {form.proofUrl ? "Screenshot attached (change)" : "Attach payment screenshot (optional)"}
              <input type="file" accept="image/*" className="hidden" onChange={onProof} disabled={uploading} />
            </label>
            <div className="flex gap-2">
              <button disabled={busy || uploading || !form.reference.trim()} onClick={() => run("pay", { method: form.method, reference: form.reference.trim(), ...(form.proofUrl ? { proofUrl: form.proofUrl } : {}), ...(isSalary ? { amount: form.amount, note: form.note } : {}) }, "Marked as paid")}
                className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">{busy && <Loader2 size={12} className="animate-spin" />}Confirm paid</button>
              <button onClick={() => setMode("")} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer">Back</button>
            </div>
          </div>
        )}
        {mode === "reject" && (
          <FormBox busy={busy} onBack={() => setMode("")} disabled={form.reason.trim().length < 5} confirm="Reject request"
            onConfirm={() => run("reject", { reason: form.reason.trim() }, "Request rejected")}>
            <textarea className={`${input} h-20 py-2`} placeholder="Reason the requester will see (for example: bank name does not match)" value={form.reason} onChange={set("reason")} maxLength={300} />
          </FormBox>
        )}
        {mode === "report" && (
          <FormBox busy={busy} onBack={() => setMode("")} disabled={form.note.trim().length < 10} confirm="Report not received"
            onConfirm={() => run("not-received", { note: form.note.trim() }, "Reported. It will be checked one level up.")}>
            <textarea className={`${input} h-20 py-2`} placeholder="What did you check? (for example: no credit in my account ending 1234)" value={form.note} onChange={set("note")} maxLength={500} />
          </FormBox>
        )}
        {mode === "resolve" && (
          <FormBox busy={busy} onBack={() => setMode("")} disabled={form.resolution.trim().length < 5} confirm="Save decision"
            onConfirm={() => run("resolve-dispute", { outcome: form.outcome, resolution: form.resolution.trim() }, "Report decided")}>
            <select className={input} value={form.outcome} onChange={set("outcome")}>
              <option value="paid_confirmed">Payment confirmed (it was paid)</option>
              <option value="not_paid">Not paid (reverse it: amount goes back to their balance)</option>
            </select>
            <textarea className={`${input} h-20 py-2`} placeholder="What you checked (bank statement, call with both sides...)" value={form.resolution} onChange={set("resolution")} maxLength={500} />
          </FormBox>
        )}
      </div>
    </div>
  )
}

function FormBox({ children, busy, disabled, confirm, onConfirm, onBack }) {
  return (
    <div className="space-y-2 rounded-xl border border-zinc-200 dark:border-zinc-800 p-3">
      {children}
      <div className="flex gap-2">
        <button disabled={busy || disabled} onClick={onConfirm} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">{busy && <Loader2 size={12} className="animate-spin" />}{confirm}</button>
        <button onClick={onBack} className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold cursor-pointer">Back</button>
      </div>
    </div>
  )
}

/** Ask the level above for money: the server caps it at what is available. */
export function RequestBox({ available, onRequest, disabledReason, who = "the franchise" }) {
  const [amount, setAmount] = useState("")
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const go = async () => {
    setBusy(true)
    try {
      await onRequest({ ...(amount ? { amount } : {}), ...(note.trim() ? { note: note.trim() } : {}) })
      toast.success(`Payout requested from ${who}`)
      setAmount("")
      setNote("")
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className={`${card} p-4 space-y-2`}>
      <p className="text-sm font-black text-zinc-900 dark:text-zinc-100">Request payout from {who}</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <input className={input} placeholder={`Amount (blank = all ${money(available)})`} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        <input className={`${input} sm:col-span-2`} placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} />
      </div>
      {disabledReason && <p className="text-[11px] text-amber-600 font-semibold">{disabledReason}</p>}
      <button disabled={busy || Boolean(disabledReason)} onClick={go} className="px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-bold disabled:opacity-50 cursor-pointer inline-flex items-center gap-1.5">{busy && <Loader2 size={12} className="animate-spin" />}Request payout</button>
    </div>
  )
}

export function useOpen(rows) {
  const [openId, setOpenId] = useState(null)
  const open = useMemo(() => rows.find((r) => r.id === openId) || null, [rows, openId])
  return { open, setOpen: (p) => setOpenId(p?.id || null) }
}

export function PageHead({ title, sub, onRefresh, loading }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
        <p className="text-xs text-zinc-500 font-medium">{sub}</p>
      </div>
      <button onClick={onRefresh} className="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-bold cursor-pointer inline-flex items-center gap-1.5">
        {loading ? <Loader2 size={13} className="animate-spin" /> : null}Refresh
      </button>
    </div>
  )
}
