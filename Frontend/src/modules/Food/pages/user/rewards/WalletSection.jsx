import React, { useState, useEffect, useRef } from "react";
import { Loader2, Award, ArrowLeft, ChevronDown, ChevronRight, Wallet, RotateCcw } from "lucide-react";
import { userAPI } from "@food/api";
import { toast } from "sonner";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Format date matching reference screenshot: "26 Sep 2026"
const formatRowDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return String(dateString);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

// Theme-driven banner (uses the app accent colour, never a hard-coded brand blue)
const BANNER_STYLE = {
  background:
    "linear-gradient(135deg, var(--accent-red, #EE3A43) 0%, color-mix(in srgb, var(--accent-red, #EE3A43) 72%, #000) 100%)",
};

/** Collapsible question row used by every FAQ / Terms list on the rewards & wallet screens. */
export function AccordionItem({ question, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg bg-zinc-100/80 dark:bg-zinc-800/70 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3.5 py-3.5 flex items-center justify-between text-left gap-3 cursor-pointer select-none bg-transparent border-0"
      >
        <span className="text-[13px] font-medium text-zinc-800 dark:text-zinc-200 leading-snug">{question}</span>
        <ChevronDown
          className={`w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 ${
            open ? "rotate-180 text-[var(--accent-red,#EE3A43)]" : ""
          }`}
        />
      </button>
      {open && (
        <div className="px-3.5 pb-3.5 text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">{children}</div>
      )}
    </div>
  );
}

export default function WalletSection({ isEnrolled: propIsEnrolled, onEnroll, rewardsConfig, onBalanceChange }) {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [localEnrolled, setLocalEnrolled] = useState(() => {
    return localStorage.getItem("pvp_rewards_enrolled") === "true";
  });

  const isUserEnrolled = propIsEnrolled ?? localEnrolled;

  // Older history pages load automatically when the end of the list scrolls into view.
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadMoreRef = useRef(null);

  const cfg = rewardsConfig || {};
  const pointsLabel = cfg.walletPointsLabel || "Points";
  const conversionText = cfg.walletConversionText || "1 Point = 1 Rupee";
  const refundTitle = cfg.refundCardTitle || "Refund Points";
  const walletFaqs = Array.isArray(cfg.walletFaqs) ? cfg.walletFaqs : [];

  // Balance and history come from the server ledger; the UI never computes the balance itself.
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const [walletRes, txRes] = await Promise.all([
        userAPI.getWalletMe(),
        userAPI.getWalletTransactions({ page: 1, limit: 20 }),
      ]);
      const walletData = walletRes?.data?.data?.wallet;
      const txData = txRes?.data?.data;
      if (walletData) {
        setWallet(walletData);
        onBalanceChange?.(Number(walletData.balance) || 0);
      }
      setTransactions(Array.isArray(txData?.transactions) ? txData.transactions : []);
      setPage(1);
      setHasMore(Boolean(txData?.pagination?.hasMore));
    } catch (err) {
      console.warn("Wallet data fetch note:", err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  };

  const loadMoreTransactions = async () => {
    if (loadingMore || !hasMore) return;
    try {
      setLoadingMore(true);
      const nextPage = page + 1;
      const txRes = await userAPI.getWalletTransactions({ page: nextPage, limit: 20 });
      const txData = txRes?.data?.data;
      const more = Array.isArray(txData?.transactions) ? txData.transactions : [];
      setTransactions((prev) => {
        const seen = new Set(prev.map((t) => t.id));
        return [...prev, ...more.filter((t) => !seen.has(t.id))];
      });
      setPage(nextPage);
      setHasMore(Boolean(txData?.pagination?.hasMore));
    } catch (err) {
      console.warn("Wallet history fetch note:", err?.response?.data?.message || err?.message);
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  useEffect(() => {
    const node = loadMoreRef.current;
    if (!node || !hasMore || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0]?.isIntersecting) loadMoreTransactions();
    });
    observer.observe(node);
    return () => observer.disconnect();
  });

  const handleEnrollClick = async () => {
    if (onEnroll) {
      await onEnroll();
      setLocalEnrolled(true);
      fetchWalletData();
      return;
    }
    try {
      await userAPI.enrollInRewards();
    } catch (err) {
      toast.error(err?.response?.data?.message || "Could not enroll. Please try again.");
      return;
    }
    setLocalEnrolled(true);
    localStorage.setItem("pvp_rewards_enrolled", "true");
    window.dispatchEvent(new Event("pvp_rewards_enrolled_changed"));
    fetchWalletData();
  };

  const faqList = walletFaqs.length > 0 && (
    <div className="mt-6">
      <h3 className="text-[15px] font-bold text-zinc-900 dark:text-white mb-3 px-1">
        {cfg.faqTitle || "Frequently Asked Questions"}
      </h3>
      <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-150 dark:border-zinc-800 shadow-2xs p-3 space-y-2.5">
        {walletFaqs.map((faq, index) => (
          <AccordionItem key={index} question={faq.question}>
            {faq.answer}
          </AccordionItem>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--accent-red,#EE3A43)]" />
        <span className="text-xs text-zinc-400">Loading wallet...</span>
      </div>
    );
  }

  // The wallet is only shown to users who have actually enrolled.
  if (!isUserEnrolled) {
    return (
      <div className="max-w-md mx-auto pb-10">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-150 dark:border-zinc-800 p-6 sm:p-8 text-center shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-full bg-red-50 dark:bg-red-950/40 flex items-center justify-center text-[var(--accent-red,#EE3A43)] mb-4">
            <Award className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white">
            Enroll to Activate Your Wallet
          </h3>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mt-2 max-w-xs mx-auto leading-relaxed">
            Your Refund Points and transaction statement will show here once you enroll.
          </p>
          <button
            type="button"
            onClick={handleEnrollClick}
            className="w-full mt-6 py-3 bg-[#EE3A43] hover:bg-[#d92d36] text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-red-500/25 active:scale-[0.99] cursor-pointer border-0"
            style={{ backgroundColor: "var(--accent-red, #EE3A43)", color: "#ffffff" }}
          >
            {cfg.buttonText || "Enroll Now"}
          </button>
        </div>
        {faqList}
      </div>
    );
  }

  const balance = Number(wallet?.balance || 0);
  const balanceText = balance.toLocaleString("en-IN");

  return (
    <div className="max-w-md mx-auto pb-10">
      {/* ── Hero banner: balance + conversion rate ── */}
      <div className="-mx-4 text-white px-6 pt-5 pb-14 relative overflow-hidden" style={BANNER_STYLE}>
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-end gap-2">
              <span className="text-5xl font-bold leading-none">{balanceText}</span>
              <span className="mb-1 px-2.5 py-0.5 rounded-full bg-white/90 text-[12px] font-semibold text-[var(--accent-red,#EE3A43)]">
                {pointsLabel}
              </span>
            </div>
            <p className="mt-3 text-xs font-medium text-white/85">{conversionText}</p>
          </div>
          <div className="w-24 h-24 shrink-0 flex items-center justify-center">
            {cfg.walletHeroImageUrl ? (
              <img src={cfg.walletHeroImageUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center">
                <Wallet className="w-10 h-10 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Refund Points card (opens the history screen) ── */}
      <button
        type="button"
        onClick={() => setShowHistory(true)}
        className="relative -mt-8 w-full flex items-center gap-3.5 bg-white dark:bg-zinc-900 rounded-[10px] border border-zinc-150 dark:border-zinc-800 shadow-md p-4 text-left cursor-pointer active:scale-[0.99] transition-transform"
      >
        <div className="w-14 h-14 rounded-full border-2 border-[var(--accent-red,#EE3A43)] flex items-center justify-center shrink-0 text-[var(--accent-red,#EE3A43)]">
          <RotateCcw className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-[15px] text-zinc-900 dark:text-white">{refundTitle}</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
            {cfg.refundCardSubtitle || "Use this to pay for your next order. Unrestricted Usage."}
          </p>
        </div>
        <span className="font-bold text-base text-zinc-900 dark:text-white">{balanceText}</span>
        <ChevronRight className="w-4 h-4 text-zinc-400 shrink-0" />
      </button>

      {faqList}

      {/* ── Refund Points history (full-screen) ── */}
      {showHistory && (
        <div className="fixed inset-0 z-[60] bg-white dark:bg-zinc-950 flex flex-col overflow-hidden">
          <div className="text-white px-4 pt-3.5 pb-5 shrink-0" style={BANNER_STYLE}>
            <div className="max-w-md mx-auto">
              <div className="flex items-center gap-2.5 mb-3">
                <button
                  type="button"
                  onClick={() => setShowHistory(false)}
                  aria-label="Back"
                  className="p-1 -ml-1 rounded-full hover:bg-white/15 active:scale-95 transition-all cursor-pointer text-white bg-transparent border-0 flex items-center justify-center"
                >
                  <ArrowLeft className="w-5 h-5 stroke-[2.4]" />
                </button>
                <h2 className="text-[17px] font-semibold text-white tracking-tight m-0">{refundTitle}</h2>
              </div>
              <div className="flex items-center justify-between gap-3 pl-1">
                <div className="min-w-0">
                  <div className="flex items-end gap-2">
                    <span className="text-4xl font-bold leading-none">{balanceText}</span>
                    <span className="mb-0.5 px-2.5 py-0.5 rounded-full bg-white/90 text-[12px] font-semibold text-[var(--accent-red,#EE3A43)]">
                      {pointsLabel}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-white/85">{conversionText}</p>
                </div>
                <div className="w-14 h-14 rounded-full border-2 border-white/80 flex items-center justify-center shrink-0">
                  <RotateCcw className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div
            className="px-4 py-3 shrink-0 text-xs font-semibold text-white"
            style={{ backgroundColor: "color-mix(in srgb, var(--accent-red, #EE3A43) 55%, #000)" }}
          >
            <div className="max-w-md mx-auto flex justify-end gap-10">
              <span className="w-20 text-center">{cfg.earnedColumnLabel || "Earned"}</span>
              <span className="w-20 text-center">{cfg.usedColumnLabel || "Used"}</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="max-w-md mx-auto px-4 pb-10">
              {transactions.map((tx, idx) => {
                const type = String(tx.type || "").toLowerCase();
                const isEarned = type === "credit";
                const isUsed = type === "debit";
                const expiryDate = tx?.expiresAt;
                const amount = Number(tx.amount || 0).toLocaleString("en-IN");

                return (
                  <div
                    key={tx.id || tx._id || idx}
                    className="flex items-start justify-between py-4 border-b border-zinc-200 dark:border-zinc-800"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-[15px] text-zinc-800 dark:text-zinc-100 m-0">
                        {formatRowDate(tx.createdAt || tx.date)}
                      </p>
                      {tx.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 m-0 leading-snug">
                          {tx.description}
                        </p>
                      )}
                    </div>

                    <div className="flex items-start justify-end gap-10 shrink-0">
                      <div className="w-20 text-center">
                        {isEarned ? (
                          <>
                            <span className="font-bold text-[15px] text-green-600 dark:text-green-500">+ {amount}</span>
                            {expiryDate && (
                              <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight m-0">
                                Exp : {formatRowDate(expiryDate)}
                              </p>
                            )}
                          </>
                        ) : (
                          <span className="font-bold text-lg text-green-600 dark:text-green-500 leading-none">-</span>
                        )}
                      </div>
                      <div className="w-20 text-center">
                        {isUsed ? (
                          <span className="font-bold text-[15px] text-red-700 dark:text-red-500">- {amount}</span>
                        ) : (
                          <span className="font-bold text-lg text-red-700 dark:text-red-500 leading-none">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {transactions.length === 0 && (
                <div className="py-16 text-center text-xs text-zinc-400 dark:text-zinc-500">
                  {cfg.walletEmptyText || "No transactions yet"}
                </div>
              )}

              {/* Zero-height sentinel: loads older transactions when scrolled into view */}
              {hasMore && <div ref={loadMoreRef} aria-hidden="true" />}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
