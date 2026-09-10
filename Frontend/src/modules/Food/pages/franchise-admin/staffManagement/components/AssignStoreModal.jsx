import React, { useState, useEffect } from "react"
import { Building2, ArrowRight, X, Sparkles } from "lucide-react"
import { initialStores } from "../mockManagersData"

export default function AssignStoreModal({ isOpen, onClose, onConfirm, manager }) {
  const [storeId, setStoreId] = useState("")
  const [reason, setReason] = useState("")
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen && manager) {
      setStoreId(manager.storeId || "")
      setReason("")
      setErrors({})
    }
  }, [isOpen, manager])

  if (!isOpen || !manager) return null

  const currentStore = initialStores.find((s) => s._id === manager.storeId)
  const availableStores = initialStores.filter((s) => s._id !== manager.storeId)

  const handleSubmit = (e) => {
    e.preventDefault()

    const newErrors = {}
    if (!storeId) {
      newErrors.storeId = "Please select a target store"
    }
    if (!reason.trim()) {
      newErrors.reason = "Please state the reason for this store transfer"
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    onConfirm(manager.id, storeId, reason)
  }

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Building2 className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Transfer Store Assignment</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Visual Assignment Compare */}
          <div className="grid grid-cols-7 items-center gap-2 p-3 bg-zinc-50 dark:bg-zinc-950/25 border border-zinc-100 dark:border-zinc-850 rounded-2xl">
            {/* Current Store */}
            <div className="col-span-3 text-center p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850">
              <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Current Assignment</span>
              <p className="text-[10px] font-extrabold text-zinc-800 dark:text-zinc-200 truncate">
                {currentStore ? currentStore.storeName : "No assigned store"}
              </p>
              <span className="text-[8px] font-bold text-zinc-400">
                {currentStore ? currentStore.city : "-"}
              </span>
            </div>

            {/* Indicator Arrow */}
            <div className="col-span-1 flex items-center justify-center text-zinc-400">
              <ArrowRight className="w-5 h-5 text-[var(--primary)] animate-pulse" />
            </div>

            {/* Target Store */}
            <div className="col-span-3 text-center p-2 rounded-xl bg-[var(--primary)]/5 border border-[var(--primary)]/10 text-[var(--primary)]">
              <span className="block text-[8px] font-bold uppercase tracking-wider mb-0.5 opacity-80">Target Assignment</span>
              <p className="text-[10px] font-extrabold truncate">
                {storeId ? initialStores.find((s) => s._id === storeId)?.storeName : "Choose below..."}
              </p>
              <span className="text-[8px] font-bold opacity-80">
                {storeId ? initialStores.find((s) => s._id === storeId)?.city : "-"}
              </span>
            </div>
          </div>

          {/* New Store dropdown selection */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Target Store</label>
            <select
              value={storeId}
              onChange={(e) => setStoreId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold focus:outline-none"
            >
              <option value="">Select a new store...</option>
              {availableStores.map((store) => (
                <option key={store._id} value={store._id}>
                  {store.storeName} ({store.city})
                </option>
              ))}
            </select>
            {errors.storeId && <p className="text-[9px] font-bold text-red-500">{errors.storeId}</p>}
          </div>

          {/* Transfer Reason */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider block">Transfer Reason</label>
            <textarea
              rows="3"
              placeholder="State clear reasons for this transfer assignment (e.g., Seasonal relocation, Backup coverage, Store operation scaling...)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-[var(--primary)] focus:bg-white"
            />
            {errors.reason && <p className="text-[9px] font-bold text-red-500">{errors.reason}</p>}
          </div>

          <div className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 dark:text-zinc-500 bg-zinc-50/50 dark:bg-zinc-950/20 p-2 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800">
            <Sparkles size={10} className="text-[var(--primary)] shrink-0" />
            <span>*This assignment change takes effect immediately on the manager's POS panel.</span>
          </div>

          {/* Footer buttons */}
          <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-xl text-xs font-bold shadow-md shadow-[var(--primary)]/10 hover:shadow-lg transition-all cursor-pointer"
            >
              Confirm Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
