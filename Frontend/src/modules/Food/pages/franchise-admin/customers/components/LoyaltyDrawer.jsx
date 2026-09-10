import React, { useState, useEffect } from "react";
import { 
  X, User, Sparkles, Receipt, Trophy, Gift, Activity, ExternalLink,
  ChevronRight, Calendar, ArrowUpRight, ShieldAlert, BadgeInfo 
} from "lucide-react";

export default function LoyaltyDrawer({
  isOpen,
  onClose,
  memberId,
  useLoyaltyHook,
  onAdjustPointsClick,
  onUpgradeTierClick,
  onSuspendClick,
  onViewTransactionClick
}) {
  const { memberDetails, loadingDetails, fetchMemberDetails } = useLoyaltyHook;
  const [activeTab, setActiveTab] = useState("profile");

  useEffect(() => {
    if (isOpen && memberId) {
      fetchMemberDetails(memberId);
      setActiveTab("profile");
    }
  }, [isOpen, memberId, fetchMemberDetails]);

  if (!isOpen) return null;

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dateStr;
    }
  };

  const getTierBadge = (t) => {
    switch (t) {
      case "Platinum":
        return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25";
      case "Gold":
        return "bg-yellow-500/10 text-yellow-600 dark:text-yellow-455 border-yellow-500/25";
      case "Silver":
        return "bg-slate-400/10 text-slate-500 dark:text-slate-400 border-slate-400/25";
      default: // Bronze
        return "bg-amber-600/10 text-amber-700 dark:text-amber-500 border-amber-600/25";
    }
  };

  const getStatusChip = (s) => {
    switch (s) {
      case "Active":
        return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20";
      case "Suspended":
        return "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20";
      case "Expired":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-450 border-amber-500/20";
      default: // Inactive
        return "bg-slate-550/10 text-slate-500 border-slate-550/20";
    }
  };

  // Tier progress calculations
  const getTierProgress = (points, currentTier) => {
    let nextTier = "";
    let minPoints = 0;
    let maxPoints = 0;
    let benefits = "";

    if (currentTier === "Bronze") {
      nextTier = "Silver";
      minPoints = 0;
      maxPoints = 1000;
      benefits = "3% Cashback on all orders, Free Garlic Bread on birthdays.";
    } else if (currentTier === "Silver") {
      nextTier = "Gold";
      minPoints = 1000;
      maxPoints = 3000;
      benefits = "5% Cashback on orders, Free Delivery, Priority kitchen order prep.";
    } else if (currentTier === "Gold") {
      nextTier = "Platinum";
      minPoints = 3000;
      maxPoints = 5000;
      benefits = "10% VIP Cashback, 24/7 dedicated support, Exclusive chef pizza invites.";
    } else {
      nextTier = "Max Tier Achieved";
      minPoints = 5000;
      maxPoints = 5000;
      benefits = "You have unlocked all benefits: 10% VIP Cashback, Free delivery, Chef pizza invites.";
    }

    const currentProgress = points - minPoints;
    const range = maxPoints - minPoints;
    const percentage = range > 0 ? Math.min(100, Math.max(0, Math.round((points / maxPoints) * 100))) : 100;
    const remaining = Math.max(0, maxPoints - points);

    return { nextTier, percentage, remaining, maxPoints, benefits };
  };

  const progress = memberDetails ? getTierProgress(memberDetails.totalPoints, memberDetails.tier) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-semibold text-xs select-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      
      {/* Drawer Box */}
      <div className="relative w-11/12 md:w-[90%] h-full bg-slate-50 dark:bg-zinc-950 shadow-2xl flex flex-col transition-transform duration-300 animate-slide-left text-zinc-700 dark:text-zinc-300 border-l border-zinc-200 dark:border-zinc-800">
        
        {/* Header */}
        <header className="p-4 bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer">
              <X size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold uppercase tracking-tight text-zinc-900 dark:text-white">
                  Loyalty Member File
                </h3>
                {memberDetails && (
                  <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${getTierBadge(memberDetails.tier)}`}>
                    {memberDetails.tier}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-zinc-400 font-bold mt-0.5">
                {memberDetails ? `${memberDetails.customerName} (${memberDetails.membershipNumber})` : "Loading member history..."}
              </p>
            </div>
          </div>

          {memberDetails && (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => onAdjustPointsClick(memberDetails)}
                className="px-2.5 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg font-extrabold text-[10px] uppercase cursor-pointer"
              >
                Adjust Points
              </button>
              <button 
                onClick={() => onUpgradeTierClick(memberDetails)}
                className="px-2.5 py-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-450 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg font-extrabold text-[10px] uppercase cursor-pointer"
              >
                Upgrade Tier
              </button>
              <button 
                onClick={() => onSuspendClick(memberDetails)}
                className={`px-2.5 py-1.5 rounded-lg font-extrabold text-[10px] uppercase border cursor-pointer ${
                  memberDetails.status === "Suspended"
                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/25 hover:bg-emerald-500/20"
                    : "bg-rose-500/10 text-rose-600 border-rose-500/25 hover:bg-rose-500/20"
                }`}
              >
                {memberDetails.status === "Suspended" ? "Reactivate" : "Suspend"}
              </button>
            </div>
          )}
        </header>

        {loadingDetails ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
              <span className="font-semibold text-xs text-zinc-400">Loading Loyalty Profile...</span>
            </div>
          </div>
        ) : !memberDetails ? (
          <div className="flex-1 flex items-center justify-center text-zinc-400">
            Error loading loyalty details. Member not found.
          </div>
        ) : (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Tabs List Side-panel */}
            <aside className="w-full md:w-56 bg-white dark:bg-zinc-900 border-b md:border-b-0 md:border-r border-zinc-200 dark:border-zinc-800 flex flex-row md:flex-col p-2 gap-1 overflow-x-auto md:overflow-x-visible shrink-0">
              {[
                { id: "profile", label: "Profile Details", icon: User },
                { id: "summary", label: "Point Summary", icon: Sparkles },
                { id: "transactions", label: "Transactions Ledger", icon: Receipt },
                { id: "tier", label: "Tier History", icon: Trophy },
                { id: "rewards", label: "Rewards Redeemed", icon: Gift },
                { id: "activity", label: "Activity Audit", icon: Activity }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-left font-bold cursor-pointer transition-all whitespace-nowrap text-[10px] md:text-xs ${
                      activeTab === tab.id
                        ? "bg-[var(--primary)] text-white shadow-xs"
                        : "text-zinc-550 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-850"
                    }`}
                  >
                    <Icon size={14} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </aside>

            {/* Tab Contents Viewport */}
            <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-4">
              
              {/* Tab 1: Profile Details */}
              {activeTab === "profile" && (
                <div className="space-y-4 max-w-4xl animate-fade-down duration-150">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 flex flex-col sm:flex-row items-center gap-5">
                    <div className="w-16 h-16 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-extrabold text-lg border-2 border-[var(--primary)]/20 shrink-0">
                      {memberDetails.customerName?.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2) || "LM"}
                    </div>
                    <div className="space-y-1.5 text-center sm:text-left flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h4 className="text-base font-extrabold text-zinc-900 dark:text-white uppercase">{memberDetails.customerName}</h4>
                          <p className="text-[10px] text-zinc-450 mt-0.5">Membership Number: <span className="font-bold text-zinc-700 dark:text-zinc-300">{memberDetails.membershipNumber}</span></p>
                        </div>
                        <div className="flex justify-center sm:justify-start gap-1.5">
                          <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${getTierBadge(memberDetails.tier)}`}>
                            {memberDetails.tier}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full border text-[8px] font-black uppercase ${getStatusChip(memberDetails.status)}`}>
                            {memberDetails.status}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-850 mt-3 text-[10px]">
                        <div>
                          <span className="text-zinc-400 block font-bold">Email Address</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{memberDetails.customer?.email || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block font-bold">Mobile Phone</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{memberDetails.customer?.mobile || "N/A"}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block font-bold">Joined Date</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{formatDate(memberDetails.joinedDate)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block font-bold">Expiry Date</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{formatDate(memberDetails.expiryDate)}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block font-bold">Lifetime spend</span>
                          <span className="text-zinc-700 dark:text-zinc-200 font-black text-sm">₹{memberDetails.totalSpent?.toLocaleString("en-IN") || 0}</span>
                        </div>
                        <div>
                          <span className="text-zinc-400 block font-bold">Last Activity</span>
                          <span className="text-zinc-700 dark:text-zinc-300 font-semibold">{formatDate(memberDetails.lastActivityDate)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Customer Profile Integrations */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3">
                    <h5 className="font-extrabold text-[10px] uppercase text-zinc-450 tracking-wider">Customer Core Integrations</h5>
                    
                    <div className="flex flex-wrap gap-2.5">
                      <a 
                        href={`/franchise-admin/customers-list?userId=${memberDetails.customerId}`}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer text-zinc-650 dark:text-zinc-200"
                      >
                        <User size={13} />
                        <span>View Customer Profile</span>
                        <ExternalLink size={11} />
                      </a>

                      <button
                        onClick={() => alert(`Redirecting to order list for user: ${memberDetails.customerName}`)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 dark:bg-zinc-950 border border-zinc-250 dark:border-zinc-800 rounded-lg font-bold hover:bg-zinc-100 dark:hover:bg-zinc-850 cursor-pointer text-zinc-650 dark:text-zinc-200"
                      >
                        <Receipt size={13} />
                        <span>Order History</span>
                      </button>

                      <button
                        onClick={() => alert(`Triggering Block workflow for customer: ${memberDetails.customerName}`)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-500/5 border border-rose-500/20 text-rose-600 rounded-lg font-bold hover:bg-rose-500/10 cursor-pointer"
                      >
                        <ShieldAlert size={13} />
                        <span>Block Customer</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Point Summary */}
              {activeTab === "summary" && (
                <div className="space-y-4 max-w-4xl animate-fade-down duration-150">
                  
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 rounded-xl">
                      <span className="text-zinc-450 block font-bold uppercase text-[9px]">Total Earned Points</span>
                      <span className="text-lg font-black text-zinc-900 dark:text-white">{memberDetails.totalPoints} Pts</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-amber-500/20 p-4 rounded-xl">
                      <span className="text-amber-600 block font-bold uppercase text-[9px]">Available Points</span>
                      <span className="text-lg font-black text-amber-500">{memberDetails.availablePoints} Pts</span>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-emerald-500/20 p-4 rounded-xl">
                      <span className="text-emerald-600 block font-bold uppercase text-[9px]">Redeemed Points</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-450">{memberDetails.redeemedPoints} Pts</span>
                    </div>
                  </div>

                  {/* Tier Progress Bar */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 rounded-xl space-y-3">
                    <div className="flex justify-between items-center text-[10px] font-bold">
                      <span className="uppercase text-zinc-400">Tier Status Profile</span>
                      <span className="text-[var(--primary)] uppercase">{progress.nextTier}</span>
                    </div>

                    <div className="space-y-1">
                      <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2">
                        <div 
                          className="bg-[var(--primary)] h-2 rounded-full transition-all"
                          style={{ width: `${progress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[8px] font-extrabold text-zinc-450 uppercase mt-0.5">
                        <span>Current: {memberDetails.totalPoints} Points</span>
                        {memberDetails.tier !== "Platinum" ? (
                          <span>{progress.remaining} Points required to reach {progress.nextTier}</span>
                        ) : (
                          <span>Highest Platinum tier unlocked</span>
                        )}
                      </div>
                    </div>

                    {memberDetails.tier !== "Platinum" && (
                      <div className="p-3 bg-zinc-50 dark:bg-zinc-950 border border-zinc-150 dark:border-zinc-850 rounded-lg flex items-start gap-2">
                        <BadgeInfo size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
                        <div>
                          <span className="font-extrabold text-zinc-700 dark:text-zinc-200 block">Next Tier Benefits:</span>
                          <p className="text-zinc-500 mt-0.5 font-medium leading-relaxed">{progress.benefits}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Tier benefits breakdown panel */}
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4">
                    <h5 className="font-extrabold text-[10px] uppercase text-zinc-450 tracking-wider mb-3">Tier Loyalty Benefits Index</h5>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                      {[
                        { tier: "Bronze", pts: "0 - 999 Pts", benefits: "1% points cashback on orders" },
                        { tier: "Silver", pts: "1,000 - 2,999 Pts", benefits: "3% points cashback + Birthday gift" },
                        { tier: "Gold", pts: "3,000 - 4,999 Pts", benefits: "5% points cashback + Free delivery" },
                        { tier: "Platinum", pts: "5,000+ Pts", benefits: "10% points cashback + VIP dedicated desk" }
                      ].map(t => (
                        <div 
                          key={t.tier} 
                          className={`p-3 rounded-lg border transition-all ${
                            memberDetails.tier === t.tier 
                              ? "bg-[var(--primary)]/5 border-[var(--primary)]"
                              : "bg-slate-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-850"
                          }`}
                        >
                          <span className={`text-[10px] font-black uppercase block ${
                            memberDetails.tier === t.tier ? "text-[var(--primary)]" : "text-zinc-700 dark:text-zinc-350"
                          }`}>
                            {t.tier}
                          </span>
                          <span className="text-[8px] text-zinc-400 font-bold uppercase mt-0.5 block">{t.pts}</span>
                          <p className="text-[9px] text-zinc-500 font-semibold mt-1.5 leading-relaxed">{t.benefits}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 3: Transactions Ledger */}
              {activeTab === "transactions" && (
                <div className="space-y-4 max-w-4xl animate-fade-down duration-150">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                    <div className="p-3.5 border-b border-zinc-150 dark:border-zinc-850">
                      <h5 className="font-extrabold text-[10px] uppercase text-zinc-400 tracking-wider">Point Ledger Entries</h5>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-850 text-[10px] uppercase font-bold text-zinc-450 tracking-wider">
                          <tr>
                            <th className="px-4 py-2">Order ID</th>
                            <th className="px-4 py-2">Type</th>
                            <th className="px-4 py-2">Points</th>
                            <th className="px-4 py-2">Remarks</th>
                            <th className="px-4 py-2">Created Date</th>
                            <th className="px-4 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                          {memberDetails.transactions?.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-zinc-400 font-semibold">
                                No transactions recorded for this member.
                              </td>
                            </tr>
                          ) : (
                            memberDetails.transactions.map((tr) => (
                              <tr key={tr._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-350">
                                <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-zinc-200">{tr.orderId}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                                    tr.transactionType === "Earn"
                                      ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                      : tr.transactionType === "Redeem"
                                      ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                      : tr.transactionType === "Expire"
                                      ? "bg-rose-500/10 text-rose-600 border-rose-500/20"
                                      : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                                  }`}>
                                    {tr.transactionType}
                                  </span>
                                </td>
                                <td className={`px-4 py-2.5 font-black text-xs ${tr.points > 0 ? "text-emerald-500" : "text-rose-500"}`}>
                                  {tr.points > 0 ? `+${tr.points}` : tr.points}
                                </td>
                                <td className="px-4 py-2.5 font-semibold text-zinc-500">{tr.remarks}</td>
                                <td className="px-4 py-2.5 font-semibold text-zinc-400">{formatDate(tr.createdAt)}</td>
                                <td className="px-4 py-2.5 text-right">
                                  <button
                                    onClick={() => onViewTransactionClick(tr)}
                                    className="p-1 text-zinc-400 hover:text-[var(--primary)] rounded transition-colors cursor-pointer"
                                    title="View Details"
                                  >
                                    <ExternalLink size={13} />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 4: Tier History */}
              {activeTab === "tier" && (
                <div className="space-y-4 max-w-4xl animate-fade-down duration-150">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
                    <h5 className="font-extrabold text-[10px] uppercase text-zinc-400 tracking-wider mb-5">Tier Transitions Timeline</h5>
                    
                    {memberDetails.tierHistory?.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 font-semibold">
                        No tier changes recorded. Initial enrollment tier: {memberDetails.tier}.
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 space-y-6 py-2">
                        {memberDetails.tierHistory.map((th) => (
                          <div key={th._id} className="relative pl-6">
                            {/* Dot */}
                            <span className="absolute -left-1.5 top-1 w-3 h-3 bg-yellow-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                            
                            <div className="bg-slate-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-850 p-3 rounded-lg flex flex-col md:flex-row justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className={`px-1.5 py-0.2 rounded border text-[8px] font-black uppercase ${getTierBadge(th.oldTier)}`}>
                                    {th.oldTier}
                                  </span>
                                  <ChevronRight size={10} className="text-zinc-400" />
                                  <span className={`px-1.5 py-0.2 rounded border text-[8px] font-black uppercase ${getTierBadge(th.newTier)}`}>
                                    {th.newTier}
                                  </span>
                                </div>
                                <p className="text-zinc-500 font-semibold mt-1">Reason: {th.reason}</p>
                              </div>
                              
                              <div className="text-right text-[10px] text-zinc-400 font-bold shrink-0 self-start md:self-auto">
                                <div>Updated by: {th.changedBy}</div>
                                <div className="flex items-center gap-1 mt-0.5 justify-end">
                                  <Calendar size={10} />
                                  <span>{formatDate(th.changedAt)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab 5: Rewards Redeemed */}
              {activeTab === "rewards" && (
                <div className="space-y-4 max-w-4xl animate-fade-down duration-150">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
                    <div className="p-3.5 border-b border-zinc-150 dark:border-zinc-850">
                      <h5 className="font-extrabold text-[10px] uppercase text-zinc-400 tracking-wider">Coupon Redemption History</h5>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left min-w-[600px]">
                        <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-850 text-[10px] uppercase font-bold text-zinc-450 tracking-wider">
                          <tr>
                            <th className="px-4 py-2">Reward Description</th>
                            <th className="px-4 py-2">Coupon Code</th>
                            <th className="px-4 py-2">Points Used</th>
                            <th className="px-4 py-2">Redeemed Date</th>
                            <th className="px-4 py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                          {memberDetails.rewardRedemptions?.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-4 py-8 text-center text-zinc-400 font-semibold">
                                No reward coupons redeemed by this member.
                              </td>
                            </tr>
                          ) : (
                            memberDetails.rewardRedemptions.map((rr) => (
                              <tr key={rr._id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40 text-zinc-700 dark:text-zinc-350">
                                <td className="px-4 py-2.5 font-bold text-zinc-900 dark:text-zinc-200 flex items-center gap-1.5">
                                  <Gift size={13} className="text-[var(--primary)]" />
                                  <span>{rr.rewardName}</span>
                                </td>
                                <td className="px-4 py-2.5">
                                  <span className="font-mono font-extrabold bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
                                    {rr.couponCode}
                                  </span>
                                </td>
                                <td className="px-4 py-2.5 font-black text-rose-500">{rr.pointsUsed} Pts</td>
                                <td className="px-4 py-2.5 font-semibold text-zinc-450">{formatDate(rr.redeemedAt)}</td>
                                <td className="px-4 py-2.5">
                                  <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase border ${
                                    rr.status === "Used"
                                      ? "bg-zinc-550/10 text-zinc-500 border-zinc-550/20"
                                      : "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                  }`}>
                                    {rr.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 6: Activity Timeline */}
              {activeTab === "activity" && (
                <div className="space-y-4 max-w-4xl animate-fade-down duration-150">
                  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5 shadow-xs">
                    <h5 className="font-extrabold text-[10px] uppercase text-zinc-400 tracking-wider mb-5">Audit Log Timeline</h5>
                    
                    {memberDetails.logs?.length === 0 ? (
                      <div className="text-center py-8 text-zinc-400 font-semibold">
                        No activity logs registered for this member.
                      </div>
                    ) : (
                      <div className="relative border-l-2 border-zinc-200 dark:border-zinc-800 ml-3 space-y-6 py-2">
                        {memberDetails.logs.map((log) => (
                          <div key={log._id} className="relative pl-6">
                            {/* Dot */}
                            <span className="absolute -left-1.5 top-1 w-3 h-3 bg-[var(--primary)] border-2 border-white dark:border-zinc-900 rounded-full" />
                            
                            <div>
                              <span className="text-[10px] text-zinc-400 font-bold block">{formatDate(log.createdAt)}</span>
                              <div className="mt-1 font-bold text-zinc-850 dark:text-zinc-200 text-xs flex items-center gap-1.5">
                                <span>{log.action}</span>
                                <span className="text-[9px] font-normal text-zinc-450">performed by</span>
                                <span className="text-[10px] font-bold text-zinc-650 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 px-1 py-0.2 rounded border border-zinc-200 dark:border-zinc-850">{log.performedBy}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </main>
          </div>
        )}
      </div>
    </div>
  );
}
