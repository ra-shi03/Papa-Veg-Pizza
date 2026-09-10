import React, { useState, useEffect } from "react"
import { Shield, X, Check } from "lucide-react"

const ALL_PERMISSIONS = [
  { key: "view_orders", label: "View Orders", desc: "Allows viewing live orders and order logs." },
  { key: "manage_kitchen", label: "Manage Kitchen", desc: "Allows kitchen queues, prep timers, and recipe steps access." },
  { key: "inventory_access", label: "Inventory Access", desc: "Allows stock check, low stock logs, and ingredients refill requests." },
  { key: "staff_management", label: "Staff Management", desc: "Allows scheduling shifts and managing kitchen/rider roles." },
  { key: "reports_access", label: "Reports Access", desc: "Allows viewing store performance ratings and sales summary logs." },
  { key: "promotions_access", label: "Promotions Access", desc: "Allows configuring local store coupons and banner items." },
  { key: "refund_approval", label: "Refund Approval", desc: "Allows approving/rejecting customer refund requests." }
];

export default function PermissionsModal({ isOpen, onClose, onConfirm, manager }) {
  const [selectedPermissions, setSelectedPermissions] = useState([])

  useEffect(() => {
    if (isOpen && manager) {
      setSelectedPermissions(manager.permissions || [])
    }
  }, [isOpen, manager])

  if (!isOpen || !manager) return null

  const handleToggle = (key) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const handleSelectAll = () => {
    setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.key))
  }

  const handleClearAll = () => {
    setSelectedPermissions([])
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm(manager.id, selectedPermissions)
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
            <Shield className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">Manager Permissions</h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/20 border border-zinc-100 dark:border-zinc-850 rounded-xl p-3">
            <div>
              <p className="text-[11px] font-black text-zinc-800 dark:text-zinc-200 leading-none">{manager.name}</p>
              <p className="text-[9px] text-zinc-500 font-semibold mt-1">Code: {manager.employeeCode} • Status: {manager.status}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-[9px] font-extrabold bg-[var(--primary)]/10 text-[var(--primary)] hover:bg-[var(--primary)]/20 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Grant All
              </button>
              <button
                type="button"
                onClick={handleClearAll}
                className="text-[9px] font-extrabold border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-950 px-2 py-1 rounded transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Checklist list */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
            {ALL_PERMISSIONS.map((perm) => {
              const isChecked = selectedPermissions.includes(perm.key)
              return (
                <div
                  key={perm.key}
                  onClick={() => handleToggle(perm.key)}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border cursor-pointer select-none transition-all duration-200 ${
                    isChecked
                      ? "border-[var(--primary)]/40 bg-[var(--primary)]/5"
                      : "border-zinc-100 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-950/40"
                  }`}
                >
                  <div
                    className={`w-4.5 h-4.5 mt-0.5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                      isChecked
                        ? "border-[var(--primary)] bg-[var(--primary)] text-white"
                        : "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950"
                    }`}
                  >
                    {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <div>
                    <span className="text-[11px] font-extrabold text-zinc-800 dark:text-zinc-200">{perm.label}</span>
                    <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium leading-normal mt-0.5">{perm.desc}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer actions */}
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
              Save Credentials
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
