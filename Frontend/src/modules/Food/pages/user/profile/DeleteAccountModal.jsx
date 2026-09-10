import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  isDarkMode = true
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
            className={`relative w-full max-w-[390px] p-6 rounded-[28px] shadow-2xl border flex flex-col items-center text-center z-10 transition-colors duration-300 ${
              isDarkMode
                ? "bg-[#18181b] border-white/10 text-white"
                : "bg-white border-zinc-150 text-zinc-900"
            }`}
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              disabled={loading}
              className={`absolute top-4 right-4 p-2 rounded-full cursor-pointer transition-colors border-0 bg-transparent outline-none ${
                isDarkMode
                  ? "text-zinc-400 hover:text-white hover:bg-white/10"
                  : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="mt-4 mb-6">
              <h2 className={`text-[22px] leading-tight font-extrabold font-headline-lg-mobile px-4 mb-4 ${
                isDarkMode ? "text-white" : "text-zinc-900"
              }`}>
                Are you sure you want to delete your Account?
              </h2>
              
              <p className={`text-xs leading-relaxed font-sans font-medium px-2 ${
                isDarkMode ? "text-zinc-400" : "text-zinc-650"
              }`}>
                If you continue, your Papa Veg Pizza account will be closed and deleted from the Papa Veg Pizza website and app. If you open a new account, you will not have access to any information from this account, including stored cards, prior orders or receipts. We will still retain certain data and information related to your account and transaction history for our business purposes. To learn more about how Papa Veg Pizza manages data and your privacy rights, please visit our Privacy Policy.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full flex flex-col gap-3">
              {/* Primary Confirm Button */}
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`w-full h-12 flex items-center justify-center rounded-xl font-sans font-bold text-sm transition-all active:scale-[0.98] border-0 outline-none cursor-pointer bg-[#E53935] text-white hover:bg-red-700 ${
                  loading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Deleting...</span>
                  </div>
                ) : (
                  "Yes, delete Account"
                )}
              </button>

              {/* Secondary Cancel Button */}
              <button
                onClick={onClose}
                disabled={loading}
                className={`w-full h-12 flex items-center justify-center rounded-xl font-sans font-bold text-sm border-2 transition-all active:scale-[0.98] outline-none cursor-pointer bg-transparent border-[#E53935] text-[#E53935] hover:bg-[#E53935]/5 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                No thanks, keep Account
              </button>
            </div>

          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
