import { useCallback, useEffect, useState } from "react"
import { adminClient } from "@/services/api/axios"
import OverviewPage, { errText } from "../../franchise-admin/shared/OverviewPage"

// The real roles. Their permissions are fixed in the server, so this page explains them and counts who holds each.
export default function RolesPermissionManagement() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const load = useCallback(async () => {
    setLoading(true)
    try {
      setRows((await adminClient.get("/food/admin/roles-summary"))?.data?.data?.roles || [])
      setError("")
    } catch (e) {
      setError(errText(e))
    } finally {
      setLoading(false)
    }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <OverviewPage
      title="Roles & Permissions" subtitle="What each role can do. These are built into the system and cannot be edited here."
      query={{ data: {}, loading, error, load }} rows={rows} empty="No roles found."
      columns={[
        { title: "Role", render: (r) => <span className="font-black">{r.name}</span> },
        { title: "Can", render: (r) => <span className="block max-w-xl">{r.can}</span> },
        { title: "People", key: "people" }, { title: "Active", key: "active" },
      ]}
    />
  )
}
