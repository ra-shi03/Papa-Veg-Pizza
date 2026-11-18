import React, { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, ShoppingBag, Truck } from "lucide-react";
import { toast } from "sonner";
import { adminClient } from "@/services/api/axios";

const STATUS = {
  new: "New", confirmed: "Confirmed", preparing: "Preparing", ready: "Ready", out_for_delivery: "Out for delivery", completed: "Completed", rejected: "Declined", cancelled: "Cancelled",
};
const CLS = {
  new: "bg-amber-50 text-amber-700 border-amber-200", confirmed: "bg-blue-50 text-blue-700 border-blue-200", preparing: "bg-indigo-50 text-indigo-700 border-indigo-200",
  ready: "bg-emerald-50 text-emerald-700 border-emerald-200", out_for_delivery: "bg-sky-50 text-sky-700 border-sky-200", completed: "bg-emerald-600 text-white border-emerald-600", rejected: "bg-red-50 text-red-700 border-red-200", cancelled: "bg-zinc-100 text-zinc-600 border-zinc-200",
};
const when = (d) => (d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "-");

/** Franchise admin: bulk orders placed at the franchise's stores. View only: the store manager handles them. */
export default function BulkOrders() {
  const [status, setStatus] = useState("all");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await adminClient.get("/food/franchise/bulk-orders", { params: { status } });
      setOrders(res?.data?.data?.orders || []);
    } catch (e) {
      toast.error(e?.response?.data?.message || "Could not load bulk orders");
    } finally {
      setLoading(false);
    }
  }, [status]);
  useEffect(() => { setLoading(true); load(); }, [load]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-lg font-black text-slate-900 dark:text-white m-0">Bulk Orders</h1>
          <p className="text-xs text-zinc-500 m-0 mt-0.5">Party and catering orders placed at your stores. The store manager confirms and prepares them; you can follow progress here.</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 rounded-lg border border-zinc-200 dark:border-zinc-700 px-3 text-xs bg-white dark:bg-zinc-900">
            <option value="all">All statuses</option>
            {Object.entries(STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <button onClick={() => { setLoading(true); load(); }} className="h-9 w-9 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-transparent cursor-pointer flex items-center justify-center" aria-label="Refresh"><RefreshCw size={14} /></button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 flex justify-center"><Loader2 className="animate-spin" /></div>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500">No bulk orders yet.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-950/40 text-[10px] uppercase text-zinc-500">
              <tr><th className="p-3">Reference</th><th className="p-3">Store</th><th className="p-3">Customer</th><th className="p-3">Type</th><th className="p-3">When</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} onClick={() => setOpen(o)} className="border-t border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/40 cursor-pointer">
                  <td className="p-3 font-mono font-bold">{o.reference}</td>
                  <td className="p-3">{o.storeName}</td>
                  <td className="p-3"><span className="font-bold">{o.name}</span><span className="block text-zinc-500">{o.phone}</span></td>
                  <td className="p-3"><span className="inline-flex items-center gap-1">{o.fulfilment === "delivery" ? <Truck size={12} /> : <ShoppingBag size={12} />}{o.fulfilment === "delivery" ? "Delivery" : "Takeaway"}</span></td>
                  <td className="p-3">{o.eventDate || "-"}{o.eventTime ? ` · ${o.eventTime}` : ""}</td>
                  <td className="p-3">{o.quotedAmount != null ? `₹${Number(o.quotedAmount).toLocaleString("en-IN")}` : "-"}</td>
                  <td className="p-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CLS[o.status] || ""}`}>{STATUS[o.status] || o.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(null)}>
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white dark:bg-zinc-900 p-5 space-y-3 text-xs" onClick={(e) => e.stopPropagation()}>
            <h3 className="m-0 text-base font-black">{open.reference} · {STATUS[open.status] || open.status}</h3>
            <p className="m-0"><b>Store:</b> {open.storeName}</p>
            <p className="m-0"><b>Customer:</b> {open.name}{open.organisation ? ` (${open.organisation})` : ""} · {open.phone} · {open.email}</p>
            <p className="m-0"><b>{open.fulfilment === "delivery" ? "Delivery to" : "Takeaway"}:</b> {open.fulfilment === "delivery" ? [open.address?.street, open.address?.landmark, open.address?.city, open.address?.pincode].filter(Boolean).join(", ") : "Collect from the store"}</p>
            {open.partySize && <p className="m-0"><b>Party size:</b> {open.partySize}</p>}
            {(open.items || []).length > 0 && (
              <div>
                <b>Items:</b>
                {open.items.map((it, i) => <p key={i} className="m-0 flex justify-between gap-3"><span>{it.quantity} × {it.name}{it.size ? ` (${it.size})` : ""}</span><span>₹{Number(it.lineTotal).toLocaleString("en-IN")}</span></p>)}
                {open.estimatedTotal != null && <p className="m-0 flex justify-between font-black"><span>Estimated total</span><span>₹{Number(open.estimatedTotal).toLocaleString("en-IN")}</span></p>}
              </div>
            )}
            {open.query && <p className="m-0 whitespace-pre-wrap"><b>Special requests:</b> {open.query}</p>}
            {open.quotedAmount != null && <p className="m-0"><b>Payment:</b> {open.paymentMethod === "online" ? "Online" : "Cash / UPI"} · {open.paymentStatus === "paid" ? "Paid" : "Not paid yet"}</p>}
            {open.rider && <p className="m-0"><b>Delivery partner:</b> {open.rider.name}{open.rider.phone ? ` · ${open.rider.phone}` : ""}</p>}
            {open.quotedAmount != null && <p className="m-0"><b>Amount quoted:</b> ₹{Number(open.quotedAmount).toLocaleString("en-IN")}</p>}
            {open.reasonText && <p className="m-0"><b>Reason:</b> {open.reasonText}</p>}
            <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 space-y-0.5">
              {(open.history || []).map((h, i) => <p key={i} className="m-0 text-zinc-500"><b className="text-zinc-700 dark:text-zinc-300">{STATUS[h.status] || h.status}</b> · {when(h.at)}{h.note ? ` · ${h.note}` : ""}</p>)}
            </div>
            <button onClick={() => setOpen(null)} className="h-9 px-4 rounded-lg border border-zinc-300 text-xs font-bold bg-transparent cursor-pointer">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
