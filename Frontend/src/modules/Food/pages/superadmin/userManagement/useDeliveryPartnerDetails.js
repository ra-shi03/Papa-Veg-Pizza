import { useCallback, useEffect, useState } from "react"
import { adminAPI } from "@food/api"
import { STANDALONE_MOCK } from "@/services/api/mockPolicy"

/**
 * The full signup record of one rider for the super admin's Partner Profile drawer
 * (GET /food/admin/delivery/:id: contact, address, vehicle, licence, documents, bank, location). Nothing in standalone mock.
 */
export default function useDeliveryPartnerDetails(id, enabled) {
  const [details, setDetails] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const reload = useCallback(async () => {
    if (STANDALONE_MOCK || !id || !enabled) return
    setLoading(true)
    setError("")
    try {
      const res = await adminAPI.getDeliveryPartnerById(id)
      setDetails(res?.data?.data?.delivery || null)
    } catch (err) {
      setDetails(null)
      setError(err?.response?.data?.message || err?.response?.data?.error || err?.message || "Could not load this rider")
    } finally {
      setLoading(false)
    }
  }, [id, enabled])

  useEffect(() => {
    setDetails(null)
    reload()
  }, [reload])

  return { details, loading, error, reload }
}
