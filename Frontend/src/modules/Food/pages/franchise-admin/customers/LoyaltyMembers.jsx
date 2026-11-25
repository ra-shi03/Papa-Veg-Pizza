import OverviewPage, { Badge, day, useOverview } from "../shared/OverviewPage"

// Cheesy Rewards members who order from this franchise's stores (view only: the super admin runs the programme).
export default function LoyaltyMembers() {
  const query = useOverview("loyalty")
  const totals = query.data.totals || {}
  const cards = [
    ["Active members", totals.activeMembers], ["Points they hold", totals.pointsHeld],
    ["Points earned at your stores", totals.pointsEarnedHere], ["Rewards claimed at your stores", totals.rewardsClaimedHere],
  ]
  return (
    <OverviewPage
      title="Loyalty Members" subtitle="Rewards members who have ordered from your stores. The super admin runs the programme and its points."
      query={query} searchKeys={["name", "phone"]} empty="No rewards members have ordered from your stores yet."
      filter={{ key: "status", label: "All members", options: ["active", "left"] }}
      summary={
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{label}</p>
              <p className="text-xl font-black text-zinc-900 dark:text-white">{Number(value || 0).toLocaleString("en-IN")}</p>
            </div>
          ))}
        </div>
      }
      columns={[
        { title: "Member", key: "name" }, { title: "Mobile", key: "phone" },
        { title: "Status", render: (r) => <Badge value={r.status === "active" ? "member" : "left"} /> }, { title: "Points balance", key: "pointsBalance" },
        { title: "Earned here", key: "pointsEarnedHere" }, { title: "Rewards claimed here", key: "rewardsClaimedHere" },
        { title: "Orders here", key: "orders" }, { title: "Last order", render: (r) => day(r.lastOrderDate) },
        { title: "Joined", render: (r) => day(r.enrolledAt) },
      ]}
    />
  )
}
