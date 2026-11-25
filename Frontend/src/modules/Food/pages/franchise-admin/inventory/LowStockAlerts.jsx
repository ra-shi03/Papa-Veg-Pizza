import OverviewPage, { Badge, day, useOverview } from "../shared/OverviewPage"

export default function LowStockAlerts() {
  const query = useOverview("alerts")
  return (
    <OverviewPage
      title="Low Stock Alerts" subtitle="Raised automatically when a store's counted stock falls to its minimum."
      query={query} searchKeys={["ingredientName", "storeName"]} empty="No low-stock alerts."
      filter={{ key: "status", label: "All statuses", options: ["active", "resolved"] }}
      columns={[
        { title: "Store", key: "storeName" }, { title: "Ingredient", key: "ingredientName" },
        { title: "Stock / minimum", render: (r) => `${r.currentStock} / ${r.minimumStock}` },
        { title: "Severity", render: (r) => <Badge value={r.severity} /> }, { title: "Status", render: (r) => <Badge value={r.status} /> },
        { title: "Raised", render: (r) => day(r.createdAt) }, { title: "Resolved by", key: "resolvedBy" },
      ]}
    />
  )
}
