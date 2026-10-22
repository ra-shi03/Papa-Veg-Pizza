import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, AlertTriangle, Trash2, CheckCircle2 } from "lucide-react"

const CONFIRMATION_KEYWORD = "DELETE"

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  isDarkMode = false
}) {
  const [confirmationInput, setConfirmationInput] = useState("")

  // Reset input when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationInput("")
    }
  }, [isOpen])

  const isConfirmed = confirmationInput.trim() === CONFIRMATION_KEYWORD

  const handleSubmit = (e) => {
    if (e) e.preventDefault()
    if (isConfirmed && !loading) {
      onConfirm()
    }
  }

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
            className={`relative w-full max-w-[420px] p-6 rounded-[28px] shadow-2xl border flex flex-col z-10 transition-colors duration-300 ${
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

            {/* Header Icon + Warning */}
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-2xl bg-red-50 dark:bg-red-950/40 text-[#E53935] flex items-center justify-center mb-3 ring-8 ring-red-50/50 dark:ring-red-950/20">
                <Trash2 className="w-7 h-7" />
              </div>

              <h2
                className={`text-[20px] sm:text-[22px] font-extrabold leading-tight tracking-tight mb-2 ${
                  isDarkMode ? "text-white" : "text-zinc-900"
                }`}
              >
                Permanently Delete Account?
              </h2>

              <p
                className={`text-xs leading-relaxed font-medium mb-4 ${
                  isDarkMode ? "text-zinc-400" : "text-zinc-600"
                }`}
              >
                This action is <strong className="text-red-600 font-bold">permanent and irreversible</strong>. Once confirmed, all your personal profile details, saved addresses, wallet points, and account data will be completely deleted from our database.
              </p>
            </div>

            {/* Warning Callout Box */}
            <div className="p-3.5 rounded-xl bg-red-50/70 dark:bg-red-950/30 border border-red-200/80 dark:border-red-900/40 mb-4 text-left">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-[11px] sm:text-xs text-red-800 dark:text-red-300 leading-snug m-0 font-medium">
                  You will lose all saved addresses, order history access, and accumulated reward points permanently.
                </p>
              </div>
            </div>

            {/* Form Confirmation Section */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col">
              <label
                htmlFor="confirm-delete-input"
                className={`text-xs font-semibold mb-2 block ${
                  isDarkMode ? "text-zinc-300" : "text-zinc-700"
                }`}
              >
                To confirm permanent deletion, type{" "}
                <span className="font-mono font-bold text-red-600 bg-red-100/70 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200 dark:border-red-800 tracking-wider">
                  {CONFIRMATION_KEYWORD}
                </span>{" "}
                below:
              </label>

              <div className="relative mb-5">
                <input
                  id="confirm-delete-input"
                  type="text"
                  autoComplete="off"
                  value={confirmationInput}
                  onChange={(e) => setConfirmationInput(e.target.value)}
                  placeholder={`Type "${CONFIRMATION_KEYWORD}" to proceed`}
                  disabled={loading}
                  className={`w-full h-11 px-3.5 rounded-xl text-sm font-medium tracking-wide border outline-none transition-all ${
                    isConfirmed
                      ? "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/20 dark:bg-emerald-950/20"
                      : isDarkMode
                      ? "bg-zinc-900 border-zinc-700 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-white"
                      : "bg-zinc-50 border-zinc-300 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 text-zinc-900"
                  }`}
                />
                {isConfirmed && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 absolute right-3 top-1/2 -translate-y-1/2" />
                )}
              </div>

              {/* Actions */}
              <div className="w-full flex flex-col gap-2.5">
                {/* Primary Confirm Button */}
                <button
                  type="submit"
                  disabled={!isConfirmed || loading}
                  className={`w-full h-12 flex items-center justify-center rounded-xl font-bold text-sm transition-all active:scale-[0.98] border-0 outline-none cursor-pointer ${
                    isConfirmed && !loading
                      ? "bg-[#E53935] text-white hover:bg-[#d92d36] shadow-md shadow-red-500/25"
                      : "bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Deleting Account...</span>
                    </div>
                  ) : (
                    "Permanently Delete Account"
                  )}
                </button>

                {/* Secondary Cancel Button */}
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
                  Cancel, Keep Account
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
