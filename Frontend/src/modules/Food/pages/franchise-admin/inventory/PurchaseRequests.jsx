import { useState } from "react"
import { toast } from "sonner"
import { adminClient } from "@/services/api/axios"
import OverviewPage, { BASE, Badge, day, errText, useOverview } from "../shared/OverviewPage"

// The stores' restock requests (their dashboard "Reorder"). Approving or rejecting tells the store; stock only changes
// when the store books the delivery in.
export default function PurchaseRequests() {
  const query = useOverview("restock-requests")
  const [busy, setBusy] = useState("")

  const decide = async (r, decision) => {
    const note = window.prompt(decision === "approved" ? "Note for the store (optional)" : "Why is it rejected? The store sees this.", "")
    if (note === null) return
    setBusy(r._id)
    try {
      await adminClient.patch(`${BASE}/restock-requests/${r._id}`, { decision, note })
      toast.success(`Request ${decision}. The store has been told.`)
      await query.load()
    } catch (e) {
      toast.error(errText(e))
    } finally {
      setBusy("")
    }
  }

  return (
    <OverviewPage
      title="Purchase Requests" subtitle="Restock requests sent by your stores."
      query={query} searchKeys={["ingredientName", "storeName"]} empty="No restock requests."
      filter={{ key: "status", label: "All statuses", options: ["pending", "approved", "rejected", "closed"] }}
      columns={[
        { title: "Store", key: "storeName" }, { title: "Ingredient", key: "ingredientName" },
        { title: "Quantity", render: (r) => `${r.quantity} ${r.unit}` }, { title: "Urgency", render: (r) => <Badge value={r.severity} /> },
        { title: "Message", render: (r) => <span className="block max-w-xs">{r.message}</span> },
        { title: "Asked", render: (r) => `${r.requestedBy || "-"} · ${day(r.createdAt)}` },
        {
          title: "Status", render: (r) => (r.status === "pending" ? (
            <span className="inline-flex gap-1.5">
              <button disabled={busy === r._id} onClick={() => decide(r, "approved")} className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-bold cursor-pointer disabled:opacity-50">Approve</button>
              <button disabled={busy === r._id} onClick={() => decide(r, "rejected")} className="px-2.5 py-1.5 rounded-lg border border-rose-300 text-rose-700 font-bold cursor-pointer disabled:opacity-50">Reject</button>
            </span>
          ) : (
            <span className="space-y-1 block"><Badge value={r.status} />{r.note && <span className="block text-[10px] text-zinc-400">{r.note}</span>}</span>
          )),
        },
      ]}
    />
  )
}
