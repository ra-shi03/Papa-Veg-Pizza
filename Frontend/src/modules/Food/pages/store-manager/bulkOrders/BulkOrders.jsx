import React, { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, ShoppingBag, Truck, MapPin, Phone, Mail, X, Check } from "lucide-react";
import { toast } from "sonner";
import apiClient from "@/services/api/axios";

const BASE = "/food/store/bulk-orders";
const STATUS = {
  new: { label: "New", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  confirmed: { label: "Confirmed", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  preparing: { label: "Preparing", cls: "bg-indigo-50 text-indigo-700 border-indigo-200" },
  ready: { label: "Ready", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  out_for_delivery: { label: "Out for delivery", cls: "bg-sky-50 text-sky-700 border-sky-200" },
  completed: { label: "Completed", cls: "bg-emerald-600 text-white border-emerald-600" },
  rejected: { label: "Declined", cls: "bg-red-50 text-red-700 border-red-200" },
  cancelled: { label: "Cancelled", cls: "bg-zinc-100 text-zinc-600 border-zinc-200" },
};
const TABS = ["all", "new", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "rejected", "cancelled"];
const err = (e) => e?.response?.data?.message || e?.response?.data?.error || e?.message || "Something went wrong";
const when = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");

/** Store manager: bulk orders placed at this store. Confirm with an amount, prepare, hand over. */
export default function BulkOrders() {
  const [status, setStatus] = useState("new");
  const [search, setSearch] = useState("");
  const [data, setData] = useState({ orders: [], counts: {} });
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);
  const [busy, setBusy] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState(""); // confirm | reject | cancel
  const [riders, setRiders] = useState([]);
  const [riderId, setRiderId] = useState("");

  const load = useCallback(async () => {
    try {
      const res = await apiClient.get(BASE, { params: { status, search: search.trim() || undefined } });
      setData(res?.data?.data || { orders: [], counts: {} });
    } catch (e) {
      toast.error(err(e));
    } finally {
      setLoading(false);
    }
  }, [status, search]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);
  useEffect(() => {
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  // the delivery partners this store can assign, for an open delivery order
  useEffect(() => {
    setRiders([]); setRiderId("");
    if (!open || open.fulfilment !== "delivery" || !open.orderId || !["confirmed", "preparing", "ready"].includes(open.status)) return;
    let on = true;
    apiClient.get(`${BASE}/${open.id}/riders`).then((res) => { if (on) setRiders(res?.data?.data?.riders || []); }).catch(() => {});
    return () => { on = false; };
  }, [open?.id, open?.status, open?.rider?.name]);

  const reset = () => { setMode(""); setAmount(""); setNote(""); setReason(""); };
  const act = async (path, body, okMessage) => {
    setBusy(true);
    try {
      const res = await apiClient.post(`${BASE}/${open.id}/${path}`, body || {});
      setOpen(res?.data?.data?.order || null);
      reset();
      toast.success(okMessage);
      await load();
    } catch (e) {
      toast.error(err(e));
    } finally {
      setBusy(false);
    }
  };

  const count = (s) => (s === "all" ? Object.values(data.counts || {}).reduce((a, b) => a + b, 0) : data.counts?.[s] || 0);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white m-0">Bulk Orders</h1>
          <p className="text-xs text-zinc-500 m-0 mt-0.5">Party and catering orders customers placed at your store. Confirm with an amount, prepare, then hand over or deliver.</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reference, name, phone" className="h-9 w-56 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-xs bg-white dark:bg-zinc-900" />
          <button onClick={() => { setLoading(true); load(); }} className="h-9 w-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent cursor-pointer flex items-center justify-center" aria-label="Refresh"><RefreshCw size={14} /></button>
        </div>
      </div>

      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((t) => (
          <button key={t} onClick={() => setStatus(t)} className={`px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer capitalize ${status === t ? "bg-primary text-white border-primary" : "bg-white dark:bg-zinc-900 text-zinc-600 border-zinc-200 dark:border-zinc-700"}`}>
            {t === "rejected" ? "Declined" : t === "out_for_delivery" ? "Out for delivery" : t.replace(/_/g, " ")} <span className="opacity-70">({count(t)})</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="animate-spin text-primary" /></div>
      ) : data.orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">No bulk orders here.</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {data.orders.map((o) => {
            const st = STATUS[o.status] || { label: o.status, cls: "bg-zinc-100 text-zinc-600 border-zinc-200" };
            return (
              <button key={o.id} onClick={() => { reset(); setOpen(o); }} className="text-left rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 cursor-pointer hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="m-0 text-sm font-black tracking-wide">{o.reference}</p>
                    <p className="m-0 text-xs text-zinc-500 truncate">{o.name}{o.organisation ? ` · ${o.organisation}` : ""}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.cls}`}>{st.label}</span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-[11px] text-zinc-500 flex-wrap">
                  <span className="flex items-center gap-1 font-bold text-zinc-700 dark:text-zinc-300">{o.fulfilment === "delivery" ? <Truck size={12} /> : <ShoppingBag size={12} />}{o.fulfilment === "delivery" ? "Delivery" : "Takeaway"}</span>
                  {o.eventDate && <span>{o.eventDate}{o.eventTime ? ` · ${o.eventTime}` : ""}</span>}
                  {o.partySize && <span>{o.partySize}</span>}
                  {o.quotedAmount != null && <span className="font-bold">₹{Number(o.quotedAmount).toLocaleString("en-IN")}</span>}
                </div>
                {o.query && <p className="m-0 mt-2 text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">{o.query}</p>}
              </button>
            );
          })}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => !busy && setOpen(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h3 className="m-0 text-base font-black">{open.reference}</h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${(STATUS[open.status] || {}).cls}`}>{(STATUS[open.status] || {}).label || open.status}</span>
              </div>
              <button onClick={() => setOpen(null)} className="bg-transparent border-0 cursor-pointer" aria-label="Close"><X size={18} /></button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div><p className="m-0 text-[10px] font-bold uppercase text-zinc-400">Customer</p><p className="m-0 font-bold">{open.name}</p>{open.organisation && <p className="m-0 text-zinc-500">{open.organisation}</p>}</div>
              <div><p className="m-0 text-[10px] font-bold uppercase text-zinc-400">Contact</p><p className="m-0 flex items-center gap-1"><Phone size={11} />{open.phone}</p><p className="m-0 flex items-center gap-1 break-all"><Mail size={11} />{open.email}</p></div>
              <div><p className="m-0 text-[10px] font-bold uppercase text-zinc-400">When</p><p className="m-0">{open.eventDate || "-"}{open.eventTime ? ` · ${open.eventTime}` : ""}</p></div>
              <div><p className="m-0 text-[10px] font-bold uppercase text-zinc-400">Party size</p><p className="m-0">{open.partySize || "-"}</p></div>
              <div className="col-span-2">
                <p className="m-0 text-[10px] font-bold uppercase text-zinc-400">{open.fulfilment === "delivery" ? "Deliver to" : "Takeaway"}</p>
                <p className="m-0 flex gap-1"><MapPin size={12} className="mt-0.5 shrink-0" />{open.fulfilment === "delivery" ? [open.address?.street, open.address?.landmark, open.address?.city, open.address?.state, open.address?.pincode].filter(Boolean).join(", ") : "The customer collects from your store"}</p>
              </div>
              {open.quotedAmount != null && (
                <div className="col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2">
                  <p className="m-0 text-[10px] font-bold uppercase text-zinc-400">Payment</p>
                  <p className="m-0 font-bold">₹{Number(open.quotedAmount).toLocaleString("en-IN")} · {open.paymentMethod === "online" ? "Online" : open.fulfilment === "delivery" ? "Cash / UPI on delivery" : "Cash / UPI at the store"}</p>
                  <p className={`m-0 font-semibold ${open.paymentStatus === "paid" ? "text-emerald-600" : "text-amber-600"}`}>{open.paymentStatus === "paid" ? "Paid" : open.paymentMethod === "online" ? "Waiting for the customer's online payment" : "To be collected"}</p>
                </div>
              )}
              {open.fulfilment === "delivery" && open.orderId && (
                <div className="col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-700 px-3 py-2 space-y-2">
                  <p className="m-0 text-[10px] font-bold uppercase text-zinc-400">Delivery partner</p>
                  {open.rider ? (
                    <p className="m-0 font-bold flex items-center gap-2">{open.rider.name}{open.rider.phone && <span className="font-normal text-zinc-500 flex items-center gap-1"><Phone size={11} />{open.rider.phone}</span>}<span className="text-[10px] font-bold uppercase text-emerald-600">{open.rider.status === "accepted" ? "Accepted" : "Assigned"}</span></p>
                  ) : (
                    <p className="m-0 text-amber-600 font-semibold">No delivery partner yet. Assign one before the order is ready.</p>
                  )}
                  {["confirmed", "preparing", "ready"].includes(open.status) && (
                    <div className="flex gap-2">
                      <select value={riderId} onChange={(e) => setRiderId(e.target.value)} className="flex-1 min-w-0 h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 px-2 text-xs bg-white dark:bg-zinc-900">
                        <option value="">{riders.length ? (open.rider ? "Change delivery partner" : "Choose a delivery partner") : "No delivery partner available"}</option>
                        {riders.map((r) => <option key={r._id} value={r._id}>{r.name} · {r.availability === "busy" ? "busy" : "free"}{r.distanceFromStore ? ` · ${r.distanceFromStore} km` : ""}</option>)}
                      </select>
                      <button disabled={busy || !riderId} onClick={() => act("assign-rider", { riderId }, "Delivery partner assigned.")} className="h-9 px-4 rounded-lg bg-primary text-white text-xs font-bold border-0 cursor-pointer disabled:opacity-50">Assign</button>
                    </div>
                  )}
                </div>
              )}
              {(open.items || []).length > 0 && (
                <div className="col-span-2">
                  <p className="m-0 text-[10px] font-bold uppercase text-zinc-400">Items</p>
                  {open.items.map((it, i) => (
                    <p key={i} className="m-0 flex justify-between gap-3"><span>{it.quantity} × {it.name}{it.size ? ` (${it.size})` : ""}</span><span className="font-semibold">₹{Number(it.lineTotal).toLocaleString("en-IN")}</span></p>
                  ))}
                  {open.estimatedTotal != null && <p className="m-0 mt-1 flex justify-between font-black border-t border-zinc-200 pt-1"><span>Estimated total</span><span>₹{Number(open.estimatedTotal).toLocaleString("en-IN")}</span></p>}
                </div>
              )}
              {open.query && <div className="col-span-2"><p className="m-0 text-[10px] font-bold uppercase text-zinc-400">Special requests</p><p className="m-0 whitespace-pre-wrap">{open.query}</p></div>}
              {open.quotedAmount != null && <div><p className="m-0 text-[10px] font-bold uppercase text-zinc-400">Amount</p><p className="m-0 font-bold">₹{Number(open.quotedAmount).toLocaleString("en-IN")}</p></div>}
              {open.storeNote && <div><p className="m-0 text-[10px] font-bold uppercase text-zinc-400">Your note</p><p className="m-0">{open.storeNote}</p></div>}
            </div>

            <div className="space-y-1 border-t border-zinc-100 dark:border-zinc-800 pt-3">
              {(open.history || []).map((h, i) => (
                <p key={i} className="m-0 text-[11px] text-zinc-500"><b className="text-zinc-700 dark:text-zinc-300 capitalize">{h.status}</b> · {when(h.at)}{h.note ? ` · ${h.note}` : ""}</p>
              ))}
            </div>

            {mode === "confirm" && (
              <div className="space-y-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 p-3">
                <input type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount to pay (₹)" className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-sm bg-white dark:bg-zinc-900" />
                <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Note for the customer (timing, payment...)" className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-sm bg-white dark:bg-zinc-900" />
                <div className="flex gap-2">
                  <button disabled={busy} onClick={() => act("confirm", { quotedAmount: amount === "" ? undefined : Number(amount), note }, "Bulk order confirmed. The customer has been emailed.")} className="flex-1 h-10 rounded-lg bg-emerald-600 text-white text-sm font-bold border-0 cursor-pointer disabled:opacity-60">{busy ? "Confirming..." : "Confirm order"}</button>
                  <button onClick={reset} className="h-10 px-4 rounded-lg border border-zinc-300 text-sm font-bold bg-transparent cursor-pointer">Back</button>
                </div>
              </div>
            )}
            {(mode === "reject" || mode === "cancel") && (
              <div className="space-y-2 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 p-3">
                <input value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Reason (the customer will see this)" className="w-full h-10 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-sm bg-white dark:bg-zinc-900" />
                <div className="flex gap-2">
                  <button disabled={busy || !reason.trim()} onClick={() => act(mode, { reason }, mode === "reject" ? "Bulk order declined" : "Bulk order cancelled")} className="flex-1 h-10 rounded-lg bg-red-600 text-white text-sm font-bold border-0 cursor-pointer disabled:opacity-60">{busy ? "Please wait..." : mode === "reject" ? "Decline order" : "Cancel order"}</button>
                  <button onClick={reset} className="h-10 px-4 rounded-lg border border-zinc-300 text-sm font-bold bg-transparent cursor-pointer">Back</button>
                </div>
              </div>
            )}

            {!mode && (
              <div className="flex flex-wrap gap-2">
                {open.status === "new" && (
                  <>
                    <button onClick={() => { setAmount(open.estimatedTotal != null ? String(open.estimatedTotal) : ""); setMode("confirm"); }} className="h-10 px-5 rounded-lg bg-emerald-600 text-white text-sm font-bold border-0 cursor-pointer flex items-center gap-1.5"><Check size={14} />Confirm</button>
                    <button onClick={() => setMode("reject")} className="h-10 px-5 rounded-lg border border-red-300 text-red-600 text-sm font-bold bg-transparent cursor-pointer">Decline</button>
                  </>
                )}
                {open.status === "confirmed" && (
                  <button
                    disabled={busy || (open.paymentMethod === "online" && open.paymentStatus !== "paid")}
                    onClick={() => act("status", { status: "preparing" }, "Updated. The customer has been emailed.")}
                    title={open.paymentMethod === "online" && open.paymentStatus !== "paid" ? "Waiting for the customer's online payment" : ""}
                    className="h-10 px-5 rounded-lg bg-primary text-white text-sm font-bold border-0 cursor-pointer disabled:opacity-50"
                  >Start preparing</button>
                )}
                {open.status === "preparing" && (
                  <button
                    disabled={busy || (open.fulfilment === "delivery" && !open.rider)}
                    onClick={() => act("status", { status: "ready" }, "Marked ready. The customer has been emailed.")}
                    title={open.fulfilment === "delivery" && !open.rider ? "Assign a delivery partner first" : ""}
                    className="h-10 px-5 rounded-lg bg-primary text-white text-sm font-bold border-0 cursor-pointer disabled:opacity-50"
                  >Mark ready</button>
                )}
                {open.status === "ready" && open.fulfilment !== "delivery" && (
                  <button disabled={busy} onClick={() => act("status", { status: "completed" }, "Order handed over. Payment recorded.")} className="h-10 px-5 rounded-lg bg-primary text-white text-sm font-bold border-0 cursor-pointer disabled:opacity-60">Handed over</button>
                )}
                {["ready", "out_for_delivery"].includes(open.status) && open.fulfilment === "delivery" && (
                  <p className="m-0 text-xs text-zinc-500 self-center">{open.status === "ready" ? "Waiting for the delivery partner to pick it up." : "On its way. The delivery partner completes it with the customer's code."}</p>
                )}
                {["confirmed", "preparing", "ready"].includes(open.status) && <button onClick={() => setMode("cancel")} className="h-10 px-5 rounded-lg border border-red-300 text-red-600 text-sm font-bold bg-transparent cursor-pointer">Cancel order</button>}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
