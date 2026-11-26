import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Plug } from "lucide-react"
import { adminClient } from "@/services/api/axios"

// Shown on the order screens when this store runs its orders in Pet Pooja: accepting, marking food ready or cancelling
// in Pet Pooja updates the order here by itself. The buttons on this screen keep working (for when Pet Pooja is down).
export default function PetPoojaModeBanner() {
  const [on, setOn] = useState(false)
  useEffect(() => {
    let alive = true
    adminClient.get("/food/store/pos/petpooja")
      .then((res) => { if (alive) setOn(!!res?.data?.data?.runsOrdersInPos) })
      .catch(() => {})
    return () => { alive = false }
  }, [])
  if (!on) return null
  return (
    <div className="flex items-start gap-2 rounded-2xl border border-sky-200 bg-sky-50 dark:bg-sky-950/20 dark:border-sky-900/40 px-4 py-3 text-xs font-semibold text-sky-800 dark:text-sky-300">
      <Plug size={15} className="shrink-0 mt-px" />
      <span>
        This store runs its orders in Pet Pooja. Accept, mark food ready or cancel there and this list updates by itself; riders are still assigned here.
        You can also act from this screen if Pet Pooja is down. <Link to="/store-operations/integrations/petpooja" className="underline">Pet Pooja settings</Link>
      </span>
    </div>
  )
}
