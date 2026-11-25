import OverviewPage, { Badge, day, useOverview } from "../shared/OverviewPage"

// What the stores reported: delivery issues (store manager) and kitchen issues (stations). The store handles them.
export default function OrderIssues() {
  const query = useOverview("order-issues")
  return (
    <OverviewPage
      title="Order Issues" subtitle="Delivery and kitchen problems reported by your stores. The store works on them."
      query={query} searchKeys={["orderNumber", "issueType", "storeName", "description"]} empty="No issues reported."
      filter={{ key: "source", label: "Delivery and kitchen", options: ["delivery", "kitchen"] }}
      columns={[
        { title: "Store", key: "storeName" }, { title: "Order", key: "orderNumber" }, { title: "From", key: "source" },
        { title: "Issue", key: "issueType" }, { title: "Severity", render: (r) => <Badge value={r.severity} /> },
        { title: "Details", render: (r) => <span className="block max-w-xs">{r.description || "-"}{r.resolution && <span className="block text-emerald-600">{r.resolution}</span>}</span> },
        { title: "Photo", render: (r) => (r.image ? <a href={r.image} target="_blank" rel="noreferrer"><img src={r.image} alt="Issue" className="h-10 w-10 rounded-lg object-cover" /></a> : "-") },
        { title: "Status", render: (r) => <Badge value={r.status} /> }, { title: "Reported", render: (r) => day(r.createdAt) },
      ]}
    />
  )
}
