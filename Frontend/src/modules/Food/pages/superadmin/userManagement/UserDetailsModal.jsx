import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  X,
  User,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  CreditCard,
  CheckCircle,
  AlertCircle
} from "lucide-react"

export default function UserDetailsModal({ isOpen, onClose, customer }) {
  if (!isOpen || !customer) return null

  // Ensure spent formatting has standard decimals and symbol
  const formattedSpent = customer.spent !== undefined 
    ? `₹${customer.spent.toLocaleString("en-IN", { minimumFractionDigits: 2 })}` 
    : "₹0.00"

  // Appending time placeholder to match mockup image format
  const joinedDateWithTime = `${customer.memberSince || "NA"}, 08:22 pm`

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Scrim Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] transition-opacity"
          />

          {/* Centered Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 m-auto w-[calc(100%-2rem)] max-w-xl h-fit bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 shadow-2xl z-[160] overflow-hidden select-none"
          >
            {/* Header Row */}
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-50">
                User Details
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all active:scale-90 cursor-pointer"
                aria-label="Close modal"
              >
                <X size={15} />
              </button>
            </div>

            {/* User Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Customer ID */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Customer ID</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{customer.id || "N/A"}</p>
              </div>

              {/* User Name */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">User Name</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{customer.name || "N/A"}</p>
              </div>

              {/* Email Address */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Email Address</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{customer.email || "N/A"}</p>
              </div>

              {/* Phone Number */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Phone Number</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{customer.phone || "N/A"}</p>
              </div>

              {/* Total Order */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Total Order</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{customer.orders || 0}</p>
              </div>

              {/* Total Order Amount */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Total Order Amount</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{formattedSpent}</p>
              </div>

              {/* Joining Date */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Joining Date</p>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-50">{customer.memberSince || "N/A"}</p>
              </div>

              {/* Status */}
              <div className="bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-850 rounded-xl p-3">
                <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mb-1">Status</p>
                <div>
                  {customer.status === "ACTIVE" ? (
                    <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                      <CheckCircle size={10} className="fill-emerald-100 dark:fill-emerald-900/20" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/30 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase">
                      <AlertCircle size={10} className="fill-rose-100 dark:fill-rose-900/20" />
                      Deactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
