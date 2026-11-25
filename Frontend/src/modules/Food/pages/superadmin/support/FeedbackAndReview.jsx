import { useCallback, useEffect, useState } from "react"
import { adminClient } from "@/services/api/axios"
import OverviewPage, { day, errText } from "../../franchise-admin/shared/OverviewPage"

// Real ratings customers gave: stores and delivery riders. View only (the store manager replies to store reviews).
export default function FeedbackAndReview() {
  const [tab, setTab] = useState("store")
  const [data, setData] = useState({ store: [], rider: [], totals: {} })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [s, d] = await Promise.all([
        adminClient.get("/food/admin/stores/reviews", { params: { limit: 1000 } }),
        adminClient.get("/food/admin/delivery/reviews", { params: { limit: 1000 } }),
      ])
      const map = (r, subject) => ({ ...r, _id: `${r.orderId}-${r.sl}`, subject, stars: String(Math.round(r.rating)) })
      const store = (s?.data?.data?.reviews || []).map((r) => map(r, r.store))
      const rider = (d?.data?.data?.reviews || []).map((r) => map(r, r.deliveryman))
      setData({ store, rider, totals: { store: s?.data?.data?.total || 0, rider: d?.data?.data?.total || 0 } })
      setError("")
    } catch (e) {
      setError(errText(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const rows = data[tab]
  const average = rows.length ? (rows.reduce((n, r) => n + Number(r.rating || 0), 0) / rows.length).toFixed(1) : "0.0"
  return (
    <OverviewPage
      title="Feedback & Reviews" subtitle={`Ratings from customers after their orders. Average ${average} from ${rows.length}.`}
      query={{ data: {}, loading, error, load }} rows={rows} searchKeys={["customer", "subject", "review", "orderId"]} empty="No ratings yet."
      filter={{ key: "stars", label: "All ratings", options: ["5", "4", "3", "2", "1"] }}
      summary={
        <div className="flex gap-2">
          {[["store", "Store reviews"], ["rider", "Delivery partner reviews"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`px-3 py-2 rounded-xl text-xs font-bold cursor-pointer border ${tab === id ? "bg-[var(--primary)] text-white border-transparent" : "border-zinc-200 dark:border-zinc-800"}`}>
              {label} ({data.totals[id] || 0})
            </button>
          ))}
        </div>
      }
      columns={[
        { title: tab === "store" ? "Store" : "Delivery partner", key: "subject" }, { title: "Customer", key: "customer" }, { title: "Order", key: "orderId" },
        { title: "Rating", render: (r) => <span className="text-amber-500 font-black">{"★".repeat(Math.round(r.rating))}</span> },
        { title: "Comment", render: (r) => <span className="block max-w-md">{r.review || "-"}</span> },
        { title: "Date", render: (r) => day(r.submittedAt) },
      ]}
    />
  )
}
