import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { LogOut, X } from "lucide-react"

export default function LogoutConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  isDarkMode = false
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={loading ? undefined : onClose}
          />

          {/* Modal Container */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={`relative w-full max-w-[380px] p-6 rounded-[28px] shadow-2xl border flex flex-col items-center text-center z-10 transition-colors duration-300 ${
              isDarkMode
                ? "bg-[#18181b] border-white/10 text-white"
                : "bg-white border-zinc-200 text-zinc-900"
            }`}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className={`absolute top-4 right-4 p-2 rounded-full cursor-pointer transition-colors border-0 bg-transparent outline-none ${
                isDarkMode
                  ? "text-zinc-400 hover:text-white hover:bg-white/10"
                  : "text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100"
              }`}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logout Icon */}
            <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center mb-3.5 ring-8 ring-red-50/50 dark:ring-red-950/20">
              <LogOut className="w-7 h-7" />
            </div>

            <h2
              className={`text-[20px] font-extrabold leading-tight tracking-tight mb-2 ${
                isDarkMode ? "text-white" : "text-zinc-900"
              }`}
            >
              Are you sure you want to logout?
            </h2>

            <p
              className={`text-xs leading-relaxed font-medium mb-6 px-2 ${
                isDarkMode ? "text-zinc-400" : "text-zinc-600"
              }`}
            >
              You will need to sign in again to access your saved addresses, previous orders, and rewards points.
            </p>

            {/* Actions */}
            <div className="w-full flex flex-col gap-2.5">
              <button
                type="button"
                onClick={onConfirm}
                disabled={loading}
                className="w-full h-12 flex items-center justify-center rounded-xl font-bold text-sm transition-all active:scale-[0.98] border-0 outline-none cursor-pointer bg-[#E53935] hover:bg-[#d92d36] text-white shadow-md shadow-red-500/25 disabled:opacity-60"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Logging out...</span>
                  </div>
                ) : (
                  "Yes, Logout"
                )}
              </button>

              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`w-full h-11 flex items-center justify-center rounded-xl font-bold text-sm border transition-all active:scale-[0.98] outline-none cursor-pointer ${
                  isDarkMode
                    ? "border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                    : "border-zinc-300 text-zinc-700 hover:bg-zinc-100"
                } ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

