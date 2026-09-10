import React from "react"
import { AlertTriangle, X } from "lucide-react"

export default function DeleteManagerModal({ isOpen, onClose, onConfirm, manager }) {
  if (!isOpen || !manager) return null

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden p-6 animate-scale-up z-10">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-4">
          <div className="p-3 bg-red-100 dark:bg-red-950/30 text-red-650 dark:text-red-400 rounded-xl shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-zinc-900 dark:text-white uppercase tracking-wider">
              Delete Store Manager
            </h3>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 font-semibold mt-1 leading-normal">
              Are you sure you want to delete <span className="font-bold text-red-650 dark:text-red-400">{manager.name}</span> (ID: {manager.employeeCode})? This will perform a soft delete and mark their profile status as <span className="font-bold">DELETED</span>.
            </p>
            <div className="mt-2.5 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 text-[10px] text-red-700 dark:text-red-450 font-bold leading-normal">
              Warning: This action cannot be undone and will affect their active store assignment. An entry in audit logs will be recorded.
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-2.5 mt-6 border-t border-zinc-100 dark:border-zinc-800 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-zinc-200 dark:border-zinc-850 hover:bg-zinc-50 dark:hover:bg-zinc-950 text-zinc-700 dark:text-zinc-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(manager.id)}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-md shadow-red-500/10 hover:shadow-lg transition-all cursor-pointer"
          >
            Delete Manager
          </button>
        </div>
      </div>
    </div>
  )
}
