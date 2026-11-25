import OverviewPage, { Badge, day, useOverview } from "../shared/OverviewPage"

export default function StockLevels() {
  const query = useOverview("stock")
  return (
    <OverviewPage
      title="Stock Levels" subtitle="Current stock in each store. Only the store changes its stock."
      query={query} searchKeys={["ingredientName", "category", "storeName"]} empty="No stock recorded yet."
      filter={{ key: "status", label: "All statuses", options: ["available", "low_stock", "out_of_stock", "not_counted"] }}
      columns={[
        { title: "Store", key: "storeName" }, { title: "Ingredient", key: "ingredientName" }, { title: "Category", key: "category" },
        { title: "In stock", render: (r) => (r.status === "not_counted" ? "-" : `${r.currentStock} ${r.unit}`) },
        { title: "Reorder level", render: (r) => `${r.reorderLevel} ${r.unit}` },
        { title: "Status", render: (r) => <Badge value={r.status} /> }, { title: "Updated", render: (r) => day(r.updatedAt) },
      ]}
    />
  )
}
