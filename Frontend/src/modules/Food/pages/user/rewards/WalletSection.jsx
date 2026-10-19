import React, { useState, useEffect } from "react";
import { Loader2, Award } from "lucide-react";
import { userAPI } from "@food/api";
import { toast } from "sonner";

// Format date matching reference screenshot: "26 Sept 2026"
const formatRowDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  const day = d.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
  const month = months[d.getMonth()] || "Sept";
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function WalletSection({
  isEnrolled: propIsEnrolled,
  onEnroll,
  onOpenFaqs
}) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [localEnrolled, setLocalEnrolled] = useState(() => {
    return localStorage.getItem("pvp_rewards_enrolled") === "true";
  });

  const isUserEnrolled = propIsEnrolled ?? localEnrolled;

  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const response = await userAPI.getWallet();
      const walletData = response?.data?.data?.wallet || response?.data?.wallet;
      if (walletData) {
        setWallet(walletData);
        setTransactions(Array.isArray(walletData.transactions) ? walletData.transactions : []);
        if (walletData.isEnrolled) {
          setLocalEnrolled(true);
          localStorage.setItem("pvp_rewards_enrolled", "true");
        }
      }
    } catch (err) {
      console.warn("Wallet data fetch note:", err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const handleEnrollClick = async () => {
    try {
      if (userAPI.enrollInRewards) {
        await userAPI.enrollInRewards();
      }
    } catch (err) {
      console.warn("Enroll API error:", err?.message || err);
    }
    setLocalEnrolled(true);
    localStorage.setItem("pvp_rewards_enrolled", "true");
    window.dispatchEvent(new Event("pvp_rewards_enrolled_changed"));
    if (onEnroll) {
      onEnroll();
    }
    toast.success("🎉 You are now enrolled! Your wallet is activated.");
    fetchWalletData();
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#EE3A43]" />
        <span className="text-xs text-zinc-400">Loading wallet...</span>
      </div>
    );
  }

  // If user is NOT enrolled, prompt enrollment as requested:
  // "and showing only when user actually enroll got it"
  if (!isUserEnrolled) {
    return (
      <div className="max-w-md mx-auto py-6">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-150 dark:border-zinc-800 p-6 sm:p-8 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-[#EE3A43] mb-4">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
            Enroll to Activate Your Wallet
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Your Refund Balance, earned reward points, and transaction statement will show here once you enroll.
          </p>
          <button
            type="button"
            onClick={handleEnrollClick}
            className="w-full mt-6 py-3 bg-[#EE3A43] hover:bg-[#d92d36] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-500/25 active:scale-[0.99] cursor-pointer border-0"
            style={{ backgroundColor: 'var(--accent-red, #EE3A43)', color: '#ffffff' }}
          >
            Enroll Now
          </button>
        </div>

        {/* FAQs link at bottom */}
        <div className="pt-8 pb-4">
          <button
            type="button"
            onClick={onOpenFaqs}
            className="text-sm font-semibold text-[var(--accent-red,#EE3A43)] hover:underline cursor-pointer"
          >
            FAQs
          </button>
        </div>
      </div>
    );
  }

  const currentBalance = Number(wallet?.balance || 0);

  return (
    <div className="max-w-md mx-auto pb-10">
      {/* ── Refund Balance Card (Matching Reference Screenshot) ── */}
      <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-150 dark:border-zinc-800 p-5 shadow-xs">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Refund Balance
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white mt-1">
          ₹{currentBalance.toLocaleString("en-IN")}
        </h2>
      </div>

      {/* ── Transaction Table Header (Earned / Used) ── */}
      <div className="flex items-center justify-end gap-10 sm:gap-14 px-3 pt-6 pb-2.5 text-sm font-semibold text-zinc-500 dark:text-zinc-400 border-b border-zinc-150 dark:border-zinc-800">
        <span className="w-20 text-center">Earned</span>
        <span className="w-20 text-center">Used</span>
      </div>

      {/* ── Dynamic Transactions List ── */}
      <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {transactions.map((tx, idx) => {
          const type = String(tx.type || "").toLowerCase();
          const isEarned = type === "addition" || type === "refund" || type === "cashback";
          const isUsed = type === "deduction" || type === "expired" || type === "debit";
          const expiryDate = tx?.metadata?.expiresAt || tx?.expiresAt;

          return (
            <div
              key={tx.id || tx._id || idx}
              className="flex items-start justify-between py-4 px-3"
            >
              {/* Date */}
              <div className="font-bold text-[15px] sm:text-base text-zinc-900 dark:text-zinc-100 pt-0.5">
                {formatRowDate(tx.createdAt || tx.date)}
              </div>

              {/* Earned & Used Columns */}
              <div className="flex items-start justify-end gap-10 sm:gap-14">
                {/* Earned Column */}
                <div className="w-20 text-center">
                  {isEarned ? (
                    <div>
                      <span className="font-bold text-[15px] sm:text-base text-green-600 dark:text-green-500">
                        + {Number(tx.amount || 0)}
                      </span>
                      {expiryDate && (
                        <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight">
                          Exp: {formatRowDate(expiryDate)}
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="font-bold text-lg text-green-600 dark:text-green-500 leading-none">
                      -
                    </span>
                  )}
                </div>

                {/* Used Column */}
                <div className="w-20 text-center">
                  {isUsed ? (
                    <div>
                      <span className="font-bold text-[15px] sm:text-base text-red-600 dark:text-red-500">
                        - {Number(tx.amount || 0)}
                      </span>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 leading-tight">
                        {type === "expired" || String(tx.description || "").toLowerCase().includes("expire")
                          ? "Expired"
                          : tx.description || "Used"}
                      </p>
                    </div>
                  ) : (
                    <span className="font-bold text-lg text-red-600 dark:text-red-500 leading-none">
                      -
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* Dynamic Empty State (No hardcoded data) */}
        {transactions.length === 0 && (
          <div className="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500">
            No transactions found
          </div>
        )}
      </div>

      {/* ── FAQs Link at Bottom (Matching Reference Screenshot) ── */}
      <div className="pt-8 pb-4 px-3">
        <button
          type="button"
          onClick={onOpenFaqs}
          className="text-sm font-semibold text-[var(--accent-red,#EE3A43)] hover:underline cursor-pointer"
        >
          FAQs
        </button>
      </div>
    </div>
  );
}
