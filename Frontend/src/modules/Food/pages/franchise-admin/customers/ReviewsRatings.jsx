import OverviewPage, { day, useOverview } from "../shared/OverviewPage"

export default function ReviewsRatings() {
  const query = useOverview("reviews")
  const rows = (query.data.rows || []).map((r) => ({ ...r, stars: String(r.rating) }))
  return (
    <OverviewPage
      title="Reviews & Ratings" subtitle={`Store ratings from customers. Average ${query.data.average || 0} from ${rows.length}. The store manager replies.`}
      query={query} rows={rows} searchKeys={["customerName", "comment", "orderNumber", "storeName"]} empty="No ratings yet."
      filter={{ key: "stars", label: "All ratings", options: ["5", "4", "3", "2", "1"] }}
      columns={[
        { title: "Store", key: "storeName" }, { title: "Customer", key: "customerName" }, { title: "Order", key: "orderNumber" },
        { title: "Rating", render: (r) => <span className="text-amber-500 font-black">{"★".repeat(r.rating)}</span> },
        { title: "Comment", render: (r) => <span className="block max-w-xs">{r.comment || "-"}</span> },
        { title: "Store reply", render: (r) => <span className="block max-w-xs">{r.reply || "-"}</span> },
        { title: "Date", render: (r) => day(r.createdAt) },
      ]}
    />
  )
}
