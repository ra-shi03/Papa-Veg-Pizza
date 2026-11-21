import { useEffect, useState } from "react"
import { Wallet } from "lucide-react"
import { adminAPI } from "@food/api"

/** Read only for the super admin: each franchise's delivery wallet minimum (set by its franchise admin). */
export default function FranchiseWalletMinimums() {
  const [list, setList] = useState(null)
  useEffect(() => {
    adminAPI.getRiderWalletSettings()
      .then((res) => setList(res?.data?.data?.franchises || []))
      .catch(() => setList([]))
  }, [])
  if (!list || !list.length) return null
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Wallet size={14} className="text-[var(--primary)]" />
        <p className="text-xs font-extrabold text-black dark:text-white">Rider wallet minimum by franchise</p>
        <span className="text-[10px] text-black/50 dark:text-white/50 font-semibold">set by each franchise admin; riders need it to accept that franchise's orders</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {list.map((f) => (
          <span key={f._id} className="px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-black dark:text-white">
            {f.name || "Franchise"}: ₹{(Number(f.riderWalletMinBalance) || 0).toFixed(0)}
          </span>
        ))}
      </div>
    </div>
  )
}
