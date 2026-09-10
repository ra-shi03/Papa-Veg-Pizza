import React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { History, X, Search, SlidersHorizontal, Receipt, Headset, HelpCircle } from "lucide-react"

export default function OrdersTransactionModal({ isOpen, onClose, customer }) {
  if (!isOpen || !customer) return null

  const ordersToDisplay = Array.isArray(customer.orders) && customer.orders.length > 0 
    ? customer.orders 
    : [
        { id: "ORD-8821", restaurant: "Downtown Core", date: "Oct 24, 2023 • 14:32 PM", amount: 42.50, status: "Delivered" },
        { id: "ORD-8799", restaurant: "West End", date: "Oct 24, 2023 • 15:05 PM", amount: 28.90, status: "In Progress" },
        { id: "ORD-8755", restaurant: "Uptown Hub", date: "Oct 23, 2023 • 19:15 PM", amount: 56.00, status: "Cancelled" },
        { id: "ORD-8612", restaurant: "Downtown Core", date: "Oct 23, 2023 • 12:10 PM", amount: 15.20, status: "Delivered" },
      ]

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Modal Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[150] transition-opacity"
          />

          {/* Order History Bottom Sheet / Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-full max-h-[70vh] bg-white dark:bg-zinc-900 z-[160] rounded-t-2xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Handle for dragging feel */}
            <div className="w-full flex justify-center py-2 bg-white dark:bg-zinc-900 z-10 relative">
              <div className="w-10 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full"></div>
            </div>

            {/* Header Section */}
            <header className="px-4 pb-2.5 pt-1 space-y-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 relative z-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <History className="text-[var(--primary)]" size={18} />
                  <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                    Order Transaction History
                  </h2>
                </div>
                <button
                  onClick={onClose}
                  className="w-7.5 h-7.5 flex items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-500 active:scale-95 transition-all hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                >
                  <X size={15} />
                </button>
              </div>

              {/* Search & Filter Bar */}
              <div className="flex gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
                  <input
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-[var(--primary)]/20 transition-all placeholder:text-zinc-400 text-zinc-800 dark:text-zinc-100 outline-none"
                    placeholder="Search by ID, customer or store..."
                    type="text"
                  />
                </div>
                <button className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-lg bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700 active:scale-95 transition-all hover:text-[var(--primary)] cursor-pointer">
                  <SlidersHorizontal size={15} />
                </button>
              </div>
            </header>

            {/* Scrollable Order List */}
            <main className="flex-1 overflow-y-auto px-3 py-2.5 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-950/50 scrollbar-none relative z-0 min-h-0">
              {ordersToDisplay && ordersToDisplay.length > 0 ? (
                ordersToDisplay.map((order, idx) => (
                  <article
                    key={idx}
                    className={`bg-white dark:bg-zinc-900 p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow group ${
                      order.status === "Cancelled" ? "opacity-75" : ""
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1.5">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-bold">
                          Store: {order.restaurant || "Downtown Core"}
                        </p>
                        <h3 className="font-extrabold text-sm text-zinc-900 dark:text-zinc-50">{order.id}</h3>
                      </div>
                      <span
                        className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                          order.status === "Delivered"
                            ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50"
                            : order.status === "In Progress" || order.status === "Pending"
                            ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50"
                            : order.status === "Cancelled"
                            ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50"
                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <p className="text-zinc-500 text-[10px] font-medium">{order.date}</p>
                      <p
                        className={`font-black text-sm ${
                          order.status === "Cancelled" ? "text-zinc-400 line-through" : "text-[var(--primary)]"
                        }`}
                      >
                        ₹{(order.total || order.amount || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      {order.status === "Cancelled" ? (
                        <>
                          <button className="flex-1 py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                            <History size={13} /> <span className="hidden sm:inline">Details</span>
                          </button>
                          <button className="flex-1 py-1.5 px-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700">
                            <HelpCircle size={13} /> <span className="hidden sm:inline">Help</span>
                          </button>
                        </>
                      ) : (
                        <>
                          <button className="flex-1 py-1.5 px-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-[10px] font-bold flex items-center justify-center gap-1.5 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
                            <Receipt size={13} /> <span className="hidden sm:inline">View Receipt</span>
                          </button>
                          <button className="flex-1 py-1.5 px-2.5 rounded-lg bg-[var(--primary)] text-white text-[10px] font-bold flex items-center justify-center gap-1.5 shadow-sm hover:bg-[var(--primary-hover)] transition-colors cursor-pointer">
                            <Headset size={13} /> <span className="hidden sm:inline">Support</span>
                          </button>
                        </>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                    <History size={24} />
                  </div>
                  <p className="text-zinc-500 text-xs font-bold">No order history available.</p>
                </div>
              )}

              {/* Load More Indicator */}
              {ordersToDisplay && ordersToDisplay.length > 0 && (
                <div className="flex justify-center py-2.5 pb-4">
                  <button className="px-4 py-1 rounded-full border border-[var(--primary)] text-[var(--primary)] font-bold text-[10px] active:scale-95 transition-all hover:bg-[var(--primary)]/5 cursor-pointer">
                    Load Older Orders
                  </button>
                </div>
              )}
            </main>

            {/* Fixed Footer / Quick Summary */}
            <footer className="p-3 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 rounded-b-none relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold">
                    Total Spent (30 Days)
                  </p>
                  <p className="font-black text-base text-[var(--primary)] mt-0.5">
                    ₹
                    {ordersToDisplay
                      ? ordersToDisplay.reduce((acc, order) => acc + (order.total || order.amount || 0), 0).toFixed(2)
                      : (customer.spent || 0).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-zinc-500 text-[9px] uppercase tracking-widest font-bold">
                    Total Transactions
                  </p>
                  <p className="font-black text-base text-zinc-900 dark:text-zinc-50 mt-0.5">
                    {ordersToDisplay ? ordersToDisplay.length : customer.orders || 0}
                  </p>
                </div>
              </div>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
