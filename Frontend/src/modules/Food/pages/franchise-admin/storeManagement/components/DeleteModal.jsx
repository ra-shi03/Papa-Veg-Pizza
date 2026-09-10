import React, { useState } from "react"
import { AlertTriangle, X } from "lucide-react"

export default function DeleteModal({ isOpen, onClose, onConfirm, store }) {
  const [confirmName, setConfirmName] = useState("")

  if (!isOpen || !store) return null

  const isMatched = confirmName.trim().toLowerCase() === store.storeName.trim().toLowerCase()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (isMatched) {
      onConfirm(store._id)
      setConfirmName("")
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md overflow-hidden bg-white dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 transition-all scale-in duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Warning Icon & Header */}
        <div className="flex items-start gap-4 mt-2">
          <div className="p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Delete Store</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Deleting a store will archive it and preserve order history.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Type <span className="font-bold text-slate-800 dark:text-slate-200">"{store.storeName}"</span> to confirm
            </label>
            <input
              type="text"
              required
              placeholder="Enter store name"
              value={confirmName}
              onChange={(e) => setConfirmName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isMatched}
              className="px-5 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-red-500/10"
            >
              Delete Store
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
