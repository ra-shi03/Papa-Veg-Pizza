import OverviewPage, { day, money, useOverview } from "../shared/OverviewPage"

export default function CustomersList() {
  const query = useOverview("customers")
  return (
    <OverviewPage
      title="Customer List" subtitle="Customers who have ordered from your stores."
      query={query} searchKeys={["name", "phone", "email"]} empty="No customers yet."
      columns={[
        { title: "Customer", key: "name" }, { title: "Mobile", key: "phone" }, { title: "Email", key: "email" },
        { title: "Orders", key: "totalOrders" }, { title: "Spent", render: (r) => money(r.totalSpent) },
        { title: "Last order", render: (r) => day(r.lastOrderDate) }, { title: "Last store", key: "storeName" },
      ]}
    />
  )
}
