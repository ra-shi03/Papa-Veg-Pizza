import OverviewPage, { useOverview } from "../shared/OverviewPage"

// Every ingredient the franchise's stores keep, one row per name. Stores add and edit them in their own panel.
export default function Ingredients() {
  const query = useOverview("stock")
  const byName = new Map()
  for (const r of query.data.rows || []) {
    const key = `${r.ingredientName.toLowerCase()}|${r.unit}`
    const row = byName.get(key) || { _id: key, ingredientName: r.ingredientName, category: r.category, unit: r.unit, stores: 0, total: 0, low: 0 }
    row.stores += 1
    row.total = Math.round((row.total + r.currentStock) * 100) / 100
    if (r.status === "low_stock" || r.status === "out_of_stock") row.low += 1
    byName.set(key, row)
  }
  return (
    <OverviewPage
      title="Ingredients" subtitle="What your stores keep in stock. Each store adds and edits its own ingredients."
      query={query} rows={[...byName.values()]} searchKeys={["ingredientName", "category"]} empty="No store has ingredients yet."
      columns={[
        { title: "Ingredient", key: "ingredientName" }, { title: "Category", key: "category" },
        { title: "Stores", key: "stores" }, { title: "Total stock", render: (r) => `${r.total} ${r.unit}` },
        { title: "Stores running low", key: "low" },
      ]}
    />
  )
}
