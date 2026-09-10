import React, { useState, useEffect } from "react"
import { Wallet, X, ArrowUpRight, ArrowDownRight, TrendingUp, ShieldAlert, Award, Calendar, DollarSign } from "lucide-react"
import { getDeliveryPartnerWallet } from "../mockManagersData"

export default function WalletModal({ isOpen, onClose, rider }) {
  const [walletData, setWalletData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen && rider) {
      setLoading(true)
      // Simulate API load
      const timer = setTimeout(() => {
        const stats = getDeliveryPartnerWallet(rider.id)
        setWalletData(stats)
        setLoading(false)
      }, 350)
      return () => clearTimeout(timer)
    }
  }, [isOpen, rider])

  if (!isOpen || !rider) return null

  return (
    <div className="fixed lg:left-[280px] left-0 top-[64px] right-0 bottom-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop restricted to content area */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-4xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl overflow-hidden animate-scale-up flex flex-col max-h-[85vh] z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-150 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/20 shrink-0">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-white">
            <Wallet className="w-5 h-5 text-[var(--primary)]" />
            <h3 className="text-sm font-extrabold uppercase tracking-wider">
              Rider Wallet & Payout Ledger: {rider.name} ({rider.employeeCode})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-250 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {loading ? (
          <div className="flex-1 p-8 flex flex-col items-center justify-center min-h-[300px]">
            <div className="w-8 h-8 border-4 border-[var(--primary)] border-t-transparent rounded-full animate-spin mb-4" />
            <span className="text-xs font-extrabold text-zinc-500 uppercase tracking-widest animate-pulse">
              Syncing Payout Ledger...
            </span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { 
                  label: "Current Balance", 
                  val: `₹${walletData.balance.toLocaleString("en-IN")}`, 
                  sub: "Settlement pending", 
                  icon: Wallet, 
                  color: "text-[var(--primary)] bg-[var(--primary)]/5" 
                },
                { 
                  label: "Today's Earnings", 
                  val: `₹${walletData.todayEarnings.toLocaleString("en-IN")}`, 
                  sub: "From orders today", 
                  icon: TrendingUp, 
                  color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20" 
                },
                { 
                  label: "Bonuses Credited", 
                  val: `₹${walletData.bonuses.toLocaleString("en-IN")}`, 
                  sub: "Performance incentives", 
                  icon: Award, 
                  color: "text-purple-650 bg-purple-50 dark:bg-purple-950/20" 
                },
                { 
                  label: "Penalties Deducted", 
                  val: `₹${walletData.penalties.toLocaleString("en-IN")}`, 
                  sub: "Cancellations / Late fees", 
                  icon: ShieldAlert, 
                  color: "text-rose-650 bg-rose-50 dark:bg-rose-950/20" 
                }
              ].map((card, idx) => (
                <div key={idx} className="bg-white dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-xl p-3 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[85px]">
                  <div>
                    <span className="block text-[8px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-0.5">
                      {card.label}
                    </span>
                    <span className="text-base font-black text-zinc-900 dark:text-white">
                      {card.val}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5 pt-1.5 border-t border-zinc-50 dark:border-zinc-850/50 text-[9px] font-bold text-zinc-400">
                    <span>{card.sub}</span>
                    <div className={`p-1 rounded ${card.color}`}>
                      <card.icon className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Additional details */}
            <div className="grid grid-cols-2 gap-4 p-4 border border-zinc-150 dark:border-zinc-800 rounded-xl bg-zinc-50/50 dark:bg-zinc-950/30">
              <div>
                <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Weekly Earnings Summary</span>
                <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                  ₹{walletData.weeklyEarnings.toLocaleString("en-IN")}
                </span>
              </div>
              <div>
                <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Total Withdrawals Processed</span>
                <span className="text-sm font-black text-zinc-800 dark:text-zinc-200 mt-0.5 block">
                  ₹{walletData.withdrawals.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            {/* Ledger Transactions Table */}
            <div className="space-y-3">
              <h4 className="text-[10px] font-black text-zinc-450 dark:text-zinc-500 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-800 pb-1.5">
                Wallet Ledger and Transaction History
              </h4>

              <div className="border border-zinc-150 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-950">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-150 dark:border-zinc-800 text-[9px] font-black uppercase text-zinc-400 tracking-wider">
                      <th className="py-2.5 px-3">Date/Time</th>
                      <th className="py-2.5 px-3">Transaction Type</th>
                      <th className="py-2.5 px-3">Reference ID</th>
                      <th className="py-2.5 px-3 text-right">Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                    {walletData.history && walletData.history.length > 0 ? (
                      walletData.history.map((tx, i) => {
                        const isCredit = tx.type.includes("Payout") || tx.type.includes("Bonus")
                        return (
                          <tr key={i} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors text-[11px] font-medium text-zinc-700 dark:text-zinc-350">
                            <td className="py-2.5 px-3 font-semibold text-zinc-500">{tx.date}</td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-zinc-800 dark:text-zinc-200 block">{tx.type}</span>
                            </td>
                            <td className="py-2.5 px-3 text-[10px] font-bold text-zinc-400">{tx.refId}</td>
                            <td className={`py-2.5 px-3 text-right font-black text-xs ${
                              isCredit ? "text-emerald-600" : "text-rose-600"
                            }`}>
                              {isCredit ? "+" : "-"}₹{tx.amount}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                tx.status === "Credited" || tx.status === "Processed"
                                  ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600"
                                  : "bg-amber-50 dark:bg-amber-950/20 text-amber-600"
                              }`}>
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr>
                        <td colSpan="5" className="py-8 text-center text-xs font-bold text-zinc-400">
                          No wallet transactions recorded for this period.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-end border-t border-zinc-100 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-950/20 shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-950 dark:hover:bg-zinc-900 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            Close Wallet Drawer
          </button>
        </div>

      </div>
    </div>
  )
}
